// The garden for 'Eye-Service', in three.js. It draws a STATE; it decides nothing. Every plant's water and life, the
// robot's cell, its watering and the live camera come from a recorded day of a trained policy (evaluate.py --film);
// the director (director.js) turns film time into a state and a camera. The three CCTV monitors on the desk are real
// renders from the three camera posts, so what the monitors show is what those cameras would see.
import * as THREE from 'three';

export const S = 1.1;                 // metres between plants
export const SOIL = 0.12;             // bed top
export const COLS = 4, ROWS = 6, N = 24;
export const cellPos = (i) => [((i % COLS) - 1.5) * S, (Math.floor(i / COLS) - 2.5) * S];

// camera posts, and the centre of the patch each one counts (garden.py VIEWS)
export const CAMS = [                  // placed by a search: each frame holds its own patch and as little else as it can
  { post: [-2.6, -1.1], h: 5.4, aim: [-1.5, 0.3, -1.1], fov: 40 },
  { post: [2.6, -1.1], h: 5.4, aim: [1.5, 0.3, -1.1], fov: 40 },
  { post: [-1.5, 3.7], h: 5.4, aim: [-1.5, 0.6, 2.2], fov: 26 },
];
export const DESK = [-0.2, 5.5];

function rngf(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s;
  t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const col = (h) => new THREE.Color(h);
function lerpCol(out, a, b, t) { out.copy(a).lerp(b, clamp(t, 0, 1)); return out; }

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
function noiseFill(ctx, w, h, base, spread, n, rnd, size = 2) {
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) {
    const v = (rnd() - 0.5) * spread; const a = 0.08 + rnd() * 0.18;
    ctx.fillStyle = v > 0 ? `rgba(255,240,210,${a * v / spread * 2})` : `rgba(0,0,0,${-a * v / spread * 2})`;
    const s = size * (0.5 + rnd() * 1.5); ctx.fillRect(rnd() * w, rnd() * h, s, s);
  }
}

// ---------------------------------------------------------------------------------------------------------------- plants
const C = {
  stem: col(0x4f7f2a), stemDry: col(0x8a7a3a), stemDead: col(0x5a4126),
  leaf: col(0x4c8a2c), leafDry: col(0x9a9a3c), leafDead: col(0x6b4d2a),
  petal: col(0xffc21a), petalDry: col(0xc89a3a), petalDead: col(0x5c3c1c),
  disc: col(0x4a2a12), discDead: col(0x2a1a0e),
};
function leafGeom() {
  const s = new THREE.Shape(); s.moveTo(0, 0);
  s.bezierCurveTo(0.06, 0.05, 0.14, 0.11, 0.30, 0.0);
  s.bezierCurveTo(0.14, -0.11, 0.06, -0.05, 0, 0);
  const g = new THREE.ShapeGeometry(s, 10);
  const p = g.attributes.position;           // cup the leaf: lift the edges, arch the tip
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.abs(y) * 0.6 - x * x * 0.4); }
  g.rotateX(-Math.PI / 2); g.computeVertexNormals(); return g;
}
const LEAF = leafGeom();
function petalGeom() {
  const s = new THREE.Shape(); s.moveTo(0, 0);
  s.bezierCurveTo(0.02, 0.025, 0.07, 0.03, 0.115, 0.0);
  s.bezierCurveTo(0.07, -0.03, 0.02, -0.025, 0, 0);
  const g = new THREE.ShapeGeometry(s, 6); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, x * x * 1.2); }
  g.rotateX(-Math.PI / 2); g.computeVertexNormals(); return g;
}
const PETAL = petalGeom();

class Sunflower {
  constructor(i, seed) {
    const r = rngf(seed * 977 + i * 131 + 7);
    this.root = new THREE.Group();
    const [x, z] = cellPos(i);
    this.root.position.set(x + (r() - 0.5) * 0.12, SOIL, z + (r() - 0.5) * 0.12);
    this.root.rotation.y = (r() - 0.5) * 0.9;          // which way it leans when it droops (mostly toward us)
    this.H = 1.18 + r() * 0.32; this.segs = 6; const L = this.H / this.segs;
    this.mStem = new THREE.MeshStandardMaterial({ color: C.stem.clone(), roughness: 0.75 });
    this.mLeaf = new THREE.MeshStandardMaterial({ color: C.leaf.clone(), roughness: 0.7, side: THREE.DoubleSide });
    this.mPetal = new THREE.MeshStandardMaterial({ color: C.petal.clone(), roughness: 0.55, side: THREE.DoubleSide });
    this.mDisc = new THREE.MeshStandardMaterial({ color: C.disc.clone(), roughness: 0.95 });
    this.seg = []; this.leaves = [];
    let parent = this.root;
    for (let k = 0; k < this.segs; k++) {
      const g = new THREE.Group(); g.position.y = k === 0 ? 0 : L; parent.add(g);
      const rt = lerp(0.034, 0.02, (k + 1) / this.segs), rb = lerp(0.034, 0.02, k / this.segs);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, L * 1.04, 7), this.mStem);
      m.position.y = L / 2; m.castShadow = true; g.add(m); this.seg.push(g); parent = g;
      if (k >= 1 && k <= 4) {
        for (const side of [0, 1]) {
          const piv = new THREE.Group(); piv.position.y = L * 0.4; piv.rotation.y = k * 2.3 + side * Math.PI + r() * 0.4;
          const tilt = new THREE.Group(); piv.add(tilt);
          const sc = lerp(1.25, 0.75, (k - 1) / 3) * (0.9 + r() * 0.2);
          const lf = new THREE.Mesh(LEAF, this.mLeaf); lf.scale.setScalar(sc); lf.castShadow = true; tilt.add(lf);
          g.add(piv); this.leaves.push({ tilt, base: 0.25 + r() * 0.2 });
        }
      }
    }
    this.head = new THREE.Group(); this.head.position.y = L; parent.add(this.head);
    const face = new THREE.Group(); this.head.add(face); this.face = face;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.095, 0.05, 20), this.mDisc);
    disc.castShadow = true; face.add(disc);
    const back = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.05, 0.06, 14), this.mStem);
    back.position.y = -0.05; face.add(back);
    this.petals = [];
    const np = 21;
    for (let k = 0; k < np; k++) {
      const piv = new THREE.Group(); piv.rotation.y = (k / np) * Math.PI * 2 + r() * 0.1;
      const tilt = new THREE.Group(); tilt.position.x = 0.085; piv.add(tilt);
      const p = new THREE.Mesh(PETAL, this.mPetal); p.scale.set(1 + r() * 0.25, 1, 1 + r() * 0.3); tilt.add(p);
      face.add(piv); this.petals.push({ tilt, ring: k % 2 });
    }
    this.v = { look: 1, deadAge: 0 };
  }
  // look: 0..1 (how it looks now), alive, deadAge (seconds dead, for browning), wet unused here (the soil shows it)
  set(look, alive, deadAge) {
    const d = alive ? (1 - look) : 1;              // droop
    const brown = alive ? 0 : clamp(deadAge / 1.2, 0, 1);
    const bend = alive ? 0.06 + d * d * 1.55 : lerp(1.6, 2.15, brown);
    for (let k = 0; k < this.segs; k++) this.seg[k].rotation.x = bend / this.segs * (0.5 + k / this.segs);
    for (const l of this.leaves) l.tilt.rotation.z = alive ? lerp(l.base, -0.9, d) : lerp(-0.9, -1.25, brown);
    this.face.rotation.x = lerp(1.05, 1.35, d);    // face toward +Z and up when well
    for (const p of this.petals) {
      p.tilt.rotation.z = alive ? lerp(0.22 + p.ring * 0.1, -0.9, d * d) : lerp(-0.9, -1.4, brown);
      p.tilt.scale.setScalar(alive ? 1 : lerp(1, 0.55, brown));
    }
    const dry = alive ? d : 1;
    lerpCol(this.mStem.color, C.stem, C.stemDry, dry * 0.8); if (!alive) lerpCol(this.mStem.color, C.stemDry, C.stemDead, brown);
    lerpCol(this.mLeaf.color, C.leaf, C.leafDry, dry * dry); if (!alive) lerpCol(this.mLeaf.color, C.leafDry, C.leafDead, brown);
    lerpCol(this.mPetal.color, C.petal, C.petalDry, dry * dry * 0.9); if (!alive) lerpCol(this.mPetal.color, C.petalDry, C.petalDead, brown);
    lerpCol(this.mDisc.color, C.disc, C.discDead, alive ? 0 : brown);
  }
  headWorld(out) { return this.face.getWorldPosition(out); }
}

// ----------------------------------------------------------------------------------------------------------------- robot
class Robot {
  constructor() {
    this.g = new THREE.Group();
    const white = new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.35, metalness: 0.05 });
    const grey = new THREE.MeshStandardMaterial({ color: 0x55595e, roughness: 0.6 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.25, metalness: 0.2 });
    this.body = new THREE.Group(); this.g.add(this.body);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.16, 6, 16), white); torso.position.y = 0.3; torso.castShadow = true; this.body.add(torso);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.153, 0.153, 0.04, 20), grey); band.position.y = 0.26; this.body.add(band);
    for (const s of [-1, 1]) {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 16), dark); wh.rotation.z = Math.PI / 2;
      wh.position.set(s * 0.13, 0.07, 0); wh.castShadow = true; this.body.add(wh);
    }
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.1, 16), grey); skirt.position.y = 0.12; this.body.add(skirt);
    this.neck = new THREE.Group(); this.neck.position.y = 0.5; this.g.add(this.neck);
    this.head = new THREE.Group(); this.neck.add(this.head);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.135, 24, 16), white); hd.position.y = 0.11; hd.castShadow = true; this.head.add(hd);
    // the visor faces local +Z (three's sphere puts phi = pi/2 on +Z), where the pupil is
    // (the visor must be larger than the head sphere or it is hidden inside it)
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.143, 28, 16, Math.PI / 2 - 1.0, 2.0, 0.72, 1.28), dark);
    visor.position.y = 0.11; this.head.add(visor);
    this.head.rotation.order = 'YXZ';          // turn, then tilt: tilting in the parent frame turns into a roll
    this.pupilMat = new THREE.MeshBasicMaterial({ color: 0xffb347, toneMapped: false });
    this.pupil = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), this.pupilMat); this.pupil.scale.set(1, 1, 0.45); this.head.add(this.pupil);
    this.glow = new THREE.PointLight(0xffa040, 0.35, 1.4, 2); this.head.add(this.glow);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.1, 6), grey); ant.position.y = 0.29; this.head.add(ant);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), white); tip.position.y = 0.34; this.head.add(tip);
    // Hold Still: a red lamp on the antenna while it is paused (rb.paused), off and invisible otherwise
    this.lampMat = new THREE.MeshBasicMaterial({ color: 0xff2a1a, toneMapped: false, transparent: true, opacity: 0 });
    this.lamp = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), this.lampMat); this.lamp.position.y = 0.34; this.head.add(this.lamp);
    this.lampGlow = new THREE.PointLight(0xff3020, 0, 0.7, 2); this.lampGlow.position.y = 0.36; this.head.add(this.lampGlow);
    // arm + can, on the right
    this.arm = new THREE.Group(); this.arm.position.set(0.17, 0.36, 0); this.body.add(this.arm);
    const up = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.16, 8), grey); up.position.set(0.02, -0.07, 0.03); up.rotation.x = 0.5; this.arm.add(up);
    this.can = new THREE.Group(); this.can.position.set(0.05, -0.12, 0.1); this.arm.add(this.can);
    const green = new THREE.MeshStandardMaterial({ color: 0x2f6b4a, roughness: 0.45, metalness: 0.35 });
    const cb = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.068, 0.13, 16), green); cb.castShadow = true; this.can.add(cb);
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.013, 0.2, 8), green); sp.position.set(0, 0.03, 0.11); sp.rotation.x = 1.05; this.can.add(sp);
    const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.012, 0.025, 10), green); rose.position.set(0, 0.08, 0.2); rose.rotation.x = 1.05; this.can.add(rose);
    this.roseTip = new THREE.Object3D(); this.roseTip.position.set(0, 0.09, 0.215); this.can.add(this.roseTip);
    const hdl = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 16, Math.PI), green); hdl.position.set(0, 0.07, -0.03); hdl.rotation.y = Math.PI / 2; this.can.add(hdl);
  }
}

// ------------------------------------------------------------------------------------------------------------- the person
class Person {
  constructor() {
    this.g = new THREE.Group();
    const jacket = new THREE.MeshStandardMaterial({ color: 0x2f5d6b, roughness: 0.8 });
    const trousers = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.85 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xd9a77f, roughness: 0.7 });
    const hair = new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 0.9 });
    const shoe = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.6 });
    const limb = (r, l, m) => { const g = new THREE.Group(); const me = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 4, 10), m);
      me.position.y = -l / 2; me.castShadow = true; g.add(me); return g; };
    this.hips = new THREE.Group(); this.hips.position.y = 0.92; this.g.add(this.hips);
    const pelvis = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.1, 4, 10), trousers); pelvis.rotation.z = Math.PI / 2; pelvis.castShadow = true; this.hips.add(pelvis);
    this.spine = new THREE.Group(); this.hips.add(this.spine);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.34, 6, 14), jacket); torso.position.y = 0.3; torso.scale.set(1.05, 1, 0.72); torso.castShadow = true; this.spine.add(torso);
    this.neck = new THREE.Group(); this.neck.position.y = 0.6; this.spine.add(this.neck);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 14), skin); head.position.y = 0.12; head.castShadow = true; this.neck.add(head);
    const hr = new THREE.Mesh(new THREE.SphereGeometry(0.117, 20, 14, 0, Math.PI * 2, 0, 1.6), hair); hr.position.set(0, 0.135, -0.01); hr.rotation.x = -0.35; this.neck.add(hr);
    this.legs = []; this.arms = [];
    for (const s of [-1, 1]) {
      const thigh = limb(0.075, 0.36, trousers); thigh.position.set(s * 0.1, -0.02, 0); this.hips.add(thigh);
      const shin = limb(0.062, 0.36, trousers); shin.position.y = -0.44; thigh.add(shin);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.24), shoe); foot.position.set(0, -0.44, 0.06); foot.castShadow = true; shin.add(foot);
      this.legs.push({ thigh, shin });
      const upper = limb(0.058, 0.26, jacket); upper.position.set(s * 0.23, 0.5, 0); this.spine.add(upper);
      const fore = limb(0.05, 0.24, jacket); fore.position.y = -0.32; upper.add(fore);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), skin); hand.position.y = -0.32; fore.add(hand);
      this.arms.push({ upper, fore, s });
    }
  }
  // pose: {mode, phase, headYaw, headPitch, reach}
  pose(p) {
    const L = this.legs, A = this.arms;
    const reset = () => { for (const l of L) { l.thigh.rotation.set(0, 0, 0); l.shin.rotation.set(0, 0, 0); }
      for (const a of A) { a.upper.rotation.set(0, 0, a.s * 0.08); a.fore.rotation.set(0, 0, 0); }
      this.spine.rotation.set(0, 0, 0); this.hips.position.y = 0.92; this.hips.rotation.set(0, 0, 0); };
    reset();
    const m = p.mode;
    if (m === 'sit' || m === 'rise') {
      const k = m === 'rise' ? clamp(p.phase, 0, 1) : 0; const sit = 1 - k * k * (3 - 2 * k);
      this.hips.position.y = lerp(0.92, 0.62, sit);
      for (const l of L) { l.thigh.rotation.x = -1.45 * sit; l.shin.rotation.x = 1.45 * sit; }
      this.spine.rotation.x = 0.12 * sit + (m === 'rise' ? Math.sin(k * Math.PI) * 0.35 : 0);
      for (const a of A) { a.upper.rotation.x = -0.55 * sit; a.fore.rotation.x = -0.9 * sit; }
      if (p.reach) { const a = A[1]; a.upper.rotation.x = lerp(a.upper.rotation.x, -1.25, p.reach); a.fore.rotation.x = lerp(a.fore.rotation.x, -0.25, p.reach); }
      // Trusted: leaning back, hands behind the head, no longer watching the monitors
      if (p.recline) { const r = clamp(p.recline, 0, 1); this.spine.rotation.x -= 0.34 * r;
        for (const a of A) { a.upper.rotation.x = lerp(a.upper.rotation.x, -2.75, r); a.upper.rotation.z = lerp(a.upper.rotation.z, a.s * 0.55, r); a.fore.rotation.x = lerp(a.fore.rotation.x, -2.3, r); } }
    } else if (m === 'walk') {
      const ph = p.phase * Math.PI * 2, sw = 0.5;
      L[0].thigh.rotation.x = Math.sin(ph) * sw; L[1].thigh.rotation.x = -Math.sin(ph) * sw;
      L[0].shin.rotation.x = Math.max(0, -Math.cos(ph)) * 0.7; L[1].shin.rotation.x = Math.max(0, Math.cos(ph)) * 0.7;
      A[0].upper.rotation.x = -Math.sin(ph) * 0.4; A[1].upper.rotation.x = Math.sin(ph) * 0.4;
      for (const a of A) a.fore.rotation.x = -0.3;
      this.hips.position.y = 0.92 + Math.abs(Math.cos(ph)) * 0.025;
    } else if (m === 'reachUp') {
      const k = clamp(p.phase ?? 1, 0, 1); A[1].upper.rotation.x = -2.6 * k; A[1].fore.rotation.x = -0.2 * k;
      A[0].upper.rotation.x = -0.25 * k;
    } else if (m === 'crouch') {
      const k = clamp(p.phase, 0, 1), c = k * k * (3 - 2 * k);
      this.hips.position.y = lerp(0.92, 0.42, c);
      for (const l of L) { l.thigh.rotation.x = -2.0 * c; l.shin.rotation.x = 2.2 * c; }
      L[1].thigh.rotation.x = -1.3 * c; L[1].shin.rotation.x = 2.3 * c;
      this.spine.rotation.x = 0.45 * c;
      A[1].upper.rotation.x = lerp(0, -1.1, c * (p.reach ?? 0)); A[1].fore.rotation.x = lerp(0, -0.2, c * (p.reach ?? 0));
      A[0].upper.rotation.x = -0.6 * c; A[0].fore.rotation.x = -1.2 * c;
    }
    this.neck.rotation.set(p.headPitch || 0, p.headYaw || 0, 0, 'YXZ');
  }
}

// ----------------------------------------------------------------------------------------------------------------- world
export class World {
  constructor(W, H, seed = 1, opts = {}) {
    this.opts = opts;
    this.W = W; this.H = H;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    r.setSize(W, H); r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.18;
    const s = this.scene = new THREE.Scene();
    s.fog = new THREE.Fog(0xcfd8e0, 14, 46); s.background = new THREE.Color(0xcfd8e0);
    this.camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 120);
    this.skyU = { top: { value: new THREE.Color(0x6f9fd8) }, hor: { value: new THREE.Color(0xdfe8ee) } };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: this.skyU,
      vertexShader: 'varying vec3 vp; void main(){ vp = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 hor; varying vec3 vp; void main(){ float h = clamp(normalize(vp).y, 0.0, 1.0); gl_FragColor = vec4(mix(hor, top, pow(h, 0.55)), 1.0); }' }));
    sky.renderOrder = -1; this.sky = sky; s.add(sky);
    // light
    this.sun = new THREE.DirectionalLight(0xfff0dd, 2.4); this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048); Object.assign(this.sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 50 });
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.02; s.add(this.sun); s.add(this.sun.target);
    this.hemi = new THREE.HemisphereLight(0xc8dcff, 0x5a4630, 0.9); s.add(this.hemi);
    const rnd = rngf(seed);
    // ground and grass
    const grass = canvasTex(512, 512, (c, w, h) => {
      c.fillStyle = '#56763a'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 60; i++) { const g = c.createRadialGradient(rnd() * w, rnd() * h, 0, rnd() * w, rnd() * h, 40 + rnd() * 90);
        g.addColorStop(0, `rgba(${rnd() > 0.5 ? '120,140,60' : '40,70,30'},0.18)`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }
      for (let i = 0; i < 14000; i++) { const v = rnd(); c.fillStyle = v > 0.5 ? `rgba(170,190,110,${0.05 + rnd() * 0.08})` : `rgba(20,40,10,${0.05 + rnd() * 0.1})`;
        c.fillRect(rnd() * w, rnd() * h, 1, 2 + rnd() * 3); } }, [16, 16]);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ map: grass, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; s.add(ground);
    // the bed
    const soilTex = canvasTex(512, 768, (c, w, h) => { noiseFill(c, w, h, '#6b4a2e', 1, 26000, rnd, 2);
      c.strokeStyle = 'rgba(40,24,12,0.25)'; c.lineWidth = 3; for (let x = 0; x < w; x += 32) { c.beginPath(); c.moveTo(x + rnd() * 6, 0); c.lineTo(x + rnd() * 6, h); c.stroke(); } });
    const bed = new THREE.Mesh(new THREE.BoxGeometry(4.9, SOIL * 2, 7.1), new THREE.MeshStandardMaterial({ map: soilTex, roughness: 1 }));
    bed.position.y = 0; bed.receiveShadow = true; s.add(bed);
    const wood = new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.9 });
    for (const [w, d, x, z] of [[5.1, 0.1, 0, -3.6], [5.1, 0.1, 0, 3.6], [0.1, 7.3, -2.5, 0], [0.1, 7.3, 2.5, 0]]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), wood); b.position.set(x, 0.1, z); b.castShadow = b.receiveShadow = true; s.add(b);
    }
    // wet soil under each plant
    this.wet = [];
    const wetMat = () => new THREE.MeshStandardMaterial({ color: 0x2c1d10, roughness: 0.4, transparent: true, opacity: 0, depthWrite: false });
    for (let i = 0; i < N; i++) {
      const [x, z] = cellPos(i);
      const m = new THREE.Mesh(new THREE.CircleGeometry(0.4, 28), wetMat()); m.rotation.x = -Math.PI / 2; m.position.set(x, SOIL + 0.003, z);
      m.receiveShadow = true; s.add(m); this.wet.push(m);
    }
    // plants
    this.plants = []; for (let i = 0; i < N; i++) { const p = new Sunflower(i, seed); s.add(p.root); this.plants.push(p); }
    // robot
    this.robot = new Robot(); this.robot.g.scale.setScalar(1.55); s.add(this.robot.g);
    // the robot's line of sight, drawn only when its network is attending to a camera (from the attention read-out)
    this.eyeLine = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 1, 6, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    s.add(this.eyeLine);
    // water
    const wn = 90; this.waterGeo = new THREE.BufferGeometry(); this.waterPos = new Float32Array(wn * 3);
    this.waterGeo.setAttribute('position', new THREE.BufferAttribute(this.waterPos, 3));
    this.water = new THREE.Points(this.waterGeo, new THREE.PointsMaterial({ color: 0xbfe6ff, size: 0.035, transparent: true, opacity: 0.85, depthWrite: false }));
    this.water.frustumCulled = false; s.add(this.water); this.waterN = wn;
    // shed (east of the corner no camera sees)
    const shed = new THREE.Group(); shed.position.set(3.85, 0, 2.35); s.add(shed);
    const plank = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#6f5034'; c.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 21) { c.fillStyle = `rgba(0,0,0,${0.15 + rnd() * 0.15})`; c.fillRect(0, y, w, 2); }
      noiseFill(c, w, h, 'rgba(0,0,0,0)', 1, 2500, rnd, 2); }, [2, 2]);
    const wallM = new THREE.MeshStandardMaterial({ map: plank, roughness: 0.9 });
    const walls = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.1, 2.5), wallM); walls.position.y = 1.05; walls.castShadow = walls.receiveShadow = true; shed.add(walls);
    const roofM = new THREE.MeshStandardMaterial({ color: 0x3b3f44, roughness: 0.7 });
    for (const sd of [-1, 1]) { const rf = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.06, 2.8), roofM);
      rf.position.set(sd * 0.47, 2.36, 0); rf.rotation.z = -sd * 0.55; rf.castShadow = true; shed.add(rf); }
    const gable = new THREE.Mesh(new THREE.CylinderGeometry(0.0, 0.98, 0.55, 3, 1), wallM); gable.rotation.set(Math.PI / 2, 0, 0); gable.scale.set(1, 2.5 / 0.55 * 0.2, 1);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.6, 0.8), new THREE.MeshStandardMaterial({ color: 0x4a3322, roughness: 0.9 }));
    door.position.set(-0.86, 0.8, 0.3); shed.add(door);
    // hedge and trees behind
    const hedgeM = new THREE.MeshStandardMaterial({ color: 0x2f5a28, roughness: 1 });
    for (let k = 0; k < 26; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.7 + rnd() * 0.3, 12, 10), hedgeM);
      b.position.set(-9 + k * 0.72, 0.6 + rnd() * 0.2, -6.2 + rnd() * 0.3); b.scale.y = 1.2; b.castShadow = true; s.add(b); }
    for (let k = 0; k < 9; k++) { const t = new THREE.Group(); const tx = -10 + k * 2.6 + rnd(), tz = -9 - rnd() * 4;
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.2, 8), wood); tr.position.y = 1.1; t.add(tr);
      const cr = new THREE.Mesh(new THREE.SphereGeometry(1.4 + rnd() * 0.6, 14, 12), new THREE.MeshStandardMaterial({ color: 0x34602c, roughness: 1 }));
      cr.position.y = 3.0; cr.scale.y = 1.15; cr.castShadow = true; t.add(cr); t.position.set(tx, 0, tz); s.add(t); }
    // camera posts
    this.cams = CAMS.map((c, k) => this.makeCam(c, k));
    if (opts.hoists) this.hoists = this.cams.map((c, k) => this.makeHoist(c, k));
    if (opts.flag) this.flag = this.makeFlag();
    // desk + monitors
    this.makeDesk();
    this.person = new Person(); s.add(this.person.g);
    // gaze cone for the live camera
    this.cone = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.0, 40, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfff1c8, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    s.add(this.cone);
    // what each camera counts, outlined on the soil (shown in the training montage)
    this.outlines = [];
    const VIEWCELLS = [[0, 1, 0, 3], [2, 3, 0, 3], [0, 1, 4, 5]];
    for (const [x0, x1, y0, y1] of VIEWCELLS) {
      const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0, depthWrite: false });
      const X0 = (x0 - 1.5) * S - 0.5, X1 = (x1 - 1.5) * S + 0.5, Z0 = (y0 - 2.5) * S - 0.5, Z1 = (y1 - 2.5) * S + 0.5, t = 0.035;
      for (const [w, d, x, z] of [[X1 - X0, t, (X0 + X1) / 2, Z0], [X1 - X0, t, (X0 + X1) / 2, Z1], [t, Z1 - Z0, X0, (Z0 + Z1) / 2], [t, Z1 - Z0, X1, (Z0 + Z1) / 2]]) {
        const b = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); b.rotation.x = -Math.PI / 2; b.position.set(x, SOIL + 0.012, z); g.add(b);
      }
      s.add(g); this.outlines.push(m);
    }
    // trails (montage)
    this.trailMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, vertexColors: true, side: THREE.DoubleSide, toneMapped: false });
    this.trail = null;
    this.tmp = new THREE.Vector3();
  }
  // The Hint: a garden flag on a cane - a red pennant above the leaves - set beside the flagged plant (st.flag)
  makeFlag() {
    const g = new THREE.Group();
    const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 1.9, 6), new THREE.MeshStandardMaterial({ color: 0xc9b07a, roughness: 0.8 }));
    cane.position.y = 0.95; cane.castShadow = true; g.add(cane);
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0.42, -0.11); sh.lineTo(0, -0.24); sh.lineTo(0, 0);
    this.pennant = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshStandardMaterial({ color: 0xe8352a, roughness: 0.55, side: THREE.DoubleSide, emissive: 0x3a0806 }));
    this.pennant.position.y = 1.88; this.pennant.castShadow = true; g.add(this.pennant);
    g.visible = false; this.scene.add(g);
    return g;
  }
  makeHoist(cam, k) {
    const s = this.scene, c = CAMS[k];
    const rope = new THREE.MeshStandardMaterial({ color: 0xd8cfb8, roughness: 0.9 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x3d4247, roughness: 0.5, metalness: 0.5 });
    const pulley = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 8, 18), metal);
    pulley.position.set(c.post[0], c.h - 0.25, c.post[1] + 0.07); s.add(pulley);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, c.h - 0.9, 5), rope);
    cord.position.set(c.post[0] + 0.05, 0.65 + (c.h - 0.9) / 2, c.post[1] + 0.07); s.add(cord);
    const cleat = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.05), metal);
    cleat.position.set(c.post[0] + 0.05, 0.62, c.post[1] + 0.07); s.add(cleat);
    // the frame: a white mat round the photograph, a wooden back; the photograph faces the lens when up
    const g = new THREE.Group(); s.add(g);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.48, 0.025), new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 0.8 }));
    back.castShadow = true; g.add(back);
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.46), new THREE.MeshBasicMaterial({ color: 0xf2efe6 }));
    mat.position.z = 0.0135; g.add(mat);
    const photoMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.405), photoMat); photo.position.z = 0.014; g.add(photo);
    // up: half a metre in front of the feed camera, facing it; down: at the foot of the pole, facing the garden
    const dir = cam.aim.clone().sub(cam.cam.position).normalize();
    const upPos = cam.cam.position.clone().add(dir.clone().multiplyScalar(0.5));
    const upQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(upPos, cam.cam.position, new THREE.Vector3(0, 1, 0)));
    // lookAt(eye, target) points -Z from eye to target; the photograph is on +Z, so turn it round
    upQ.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
    const downPos = new THREE.Vector3(c.post[0], 0.95, c.post[1]).add(new THREE.Vector3(-c.post[0], 0, -c.post[1]).normalize().multiplyScalar(0.18));
    const downQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(downPos, new THREE.Vector3(0, 0.95, 0), new THREE.Vector3(0, 1, 0)));
    downQ.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
    const topPos = new THREE.Vector3(c.post[0], c.h - 0.35, c.post[1]).add(new THREE.Vector3(-c.post[0], 0, -c.post[1]).normalize().multiplyScalar(0.18));
    return { g, photoMat, upPos, upQ, downPos, downQ, topPos };
  }
  // photographs of every patch in full health, taken once (the pictures the hoists carry)
  takePhotographs(healthyState) {
    if (!this.hoists) return;
    this.set(healthyState);
    for (const h of this.hoists) h.g.visible = false;
    const r = this.renderer;
    this.photoRTs = this.cams.map((c) => {
      const rt = new THREE.WebGLRenderTarget(800, 600, { samples: 4 }); rt.texture.colorSpace = THREE.SRGBColorSpace;
      r.setRenderTarget(rt); r.render(this.scene, c.cam); return rt;
    });
    r.setRenderTarget(null);
    this.hoists.forEach((h, k) => { h.photoMat.map = this.photoRTs[k].texture; h.photoMat.needsUpdate = true; h.g.visible = true; });
  }
  makeCam(c, k) {
    const s = this.scene, g = new THREE.Group(); g.position.set(c.post[0], 0, c.post[1]); s.add(g);
    const metal = new THREE.MeshStandardMaterial({ color: 0x3d4247, roughness: 0.5, metalness: 0.5 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, c.h, 10), metal); post.position.y = c.h / 2; post.castShadow = true; g.add(post);
    const head = new THREE.Group(); head.position.y = c.h + 0.1; g.add(head);
    const aim = new THREE.Vector3(...c.aim);
    head.lookAt(aim);          // local +Z toward the patch
    const bodyM = new THREE.MeshStandardMaterial({ color: 0xe8e8e4, roughness: 0.4 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.17, 0.36), bodyM); box.castShadow = true; head.add(box);
    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.42), bodyM); hood.position.set(0, 0.1, 0.03); head.add(hood);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 16), new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.15, metalness: 0.6 }));
    lens.rotation.x = Math.PI / 2; lens.position.z = 0.19; head.add(lens);
    const ledM = new THREE.MeshBasicMaterial({ color: 0x330000 });
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), ledM); led.position.set(0.065, 0.045, 0.185); head.add(led);
    const ledLight = new THREE.PointLight(0xff2010, 0, 2.5, 2); ledLight.position.copy(led.position); head.add(ledLight);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.04), metal); arm.position.y = c.h + 0.02; g.add(arm);
    const cam = new THREE.PerspectiveCamera(c.fov, 4 / 3, 0.05, 40);
    // the feed is taken from just in front of the housing, or it films the inside of its own lens
    const wp = new THREE.Vector3(); head.getWorldPosition(wp);
    cam.position.copy(wp).add(aim.clone().sub(wp).normalize().multiplyScalar(0.32)); cam.lookAt(aim);
    const rt = new THREE.WebGLRenderTarget(400, 300, { samples: 4 }); rt.texture.colorSpace = THREE.SRGBColorSpace;
    return { g, head, ledM, ledLight, cam, rt, aim, wp };
  }
  makeDesk() {
    const s = this.scene, g = new THREE.Group(); g.position.set(DESK[0], 0, DESK[1]); s.add(g); this.desk = g;
    const wood = new THREE.MeshStandardMaterial({ color: 0x8c6a48, roughness: 0.7 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 0.75), wood); top.position.y = 0.76; top.castShadow = top.receiveShadow = true; g.add(top);
    for (const [x, z] of [[-0.95, -0.32], [0.95, -0.32], [-0.95, 0.32], [0.95, 0.32]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.76, 0.05), wood); l.position.set(x, 0.38, z); g.add(l); }
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16), new THREE.MeshStandardMaterial({ color: 0x333333 })); stool.position.set(0, 0.5, 0.75); g.add(stool);
    const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0x333333 })); sl.position.set(0, 0.25, 0.75); g.add(sl);
    this.screens = [];
    const caseM = new THREE.MeshStandardMaterial({ color: 0x1c1d20, roughness: 0.5 });
    for (let k = 0; k < 3; k++) {
      const m = new THREE.Group(); m.position.set((k - 1) * 0.62, 0.79, -0.12); m.rotation.y = Math.PI + (k - 1) * -0.28; g.add(m);
      const cs = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.44, 0.05), caseM); cs.position.y = 0.3; cs.castShadow = true; m.add(cs);
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.05), caseM); st.position.y = 0.05; m.add(st);
      const scrM = new THREE.MeshBasicMaterial({ map: this.cams[k].rt.texture, color: 0xffffff, toneMapped: false });
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.375), scrM); scr.position.set(0, 0.3, -0.027); scr.rotation.y = Math.PI; m.add(scr);
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.014, 12), new THREE.MeshBasicMaterial({ color: 0xff2a1a, toneMapped: false }));
      dot.position.set(0.2, 0.45, -0.029); dot.rotation.y = Math.PI; m.add(dot);
      this.screens.push({ m, scrM, dot });
    }
  }
  setTrail(points, colors) {
    if (this.trail) { this.scene.remove(this.trail); this.trail.geometry.dispose(); this.trail = null; }
    if (!points || points.length < 2) return;
    const w = 0.035, pos = [], cl = [], idx = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[Math.max(0, i - 1)], b = points[Math.min(points.length - 1, i + 1)];
      let dx = b[0] - a[0], dz = b[1] - a[1]; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
      const p = points[i];
      pos.push(p[0] - dz * w, SOIL + 0.01, p[1] + dx * w, p[0] + dz * w, SOIL + 0.01, p[1] - dx * w);
      const c = colors[i]; cl.push(...c, ...c);
      if (i > 0) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); g.setIndex(idx);
    this.trail = new THREE.Mesh(g, this.trailMat); this.trail.renderOrder = 2; this.scene.add(this.trail);
  }
  // st: see director.js
  set(st) {
    const s = this.scene, tod = st.tod;
    // sun from the east at dawn to the west at dusk
    const az = lerp(-0.25, Math.PI + 0.25, tod), el = Math.sin(clamp(tod, 0, 1) * Math.PI) * 0.95 + 0.12;
    this.sun.position.set(-Math.cos(az) * 20 * Math.cos(el), Math.sin(el) * 20, -6 + Math.sin(az) * 4);
    this.sun.target.position.set(0, 0, 0.5);
    const warm = 1 - Math.sin(clamp(tod, 0, 1) * Math.PI);
    this.sun.color.setRGB(1, lerp(0.95, 0.62, warm), lerp(0.88, 0.4, warm));
    this.sun.intensity = lerp(2.7, 2.3, warm) * (st.dim ?? 1);
    this.hemi.intensity = lerp(1.05, 0.85, warm) * (st.dim ?? 1);
    this.hemi.color.setRGB(lerp(0.78, 0.95, warm), lerp(0.86, 0.78, warm), lerp(1.0, 0.72, warm));
    const sky = new THREE.Color().setRGB(lerp(0.74, 0.93, warm), lerp(0.83, 0.74, warm), lerp(0.92, 0.6, warm)).multiplyScalar(st.dim ?? 1);
    s.background = sky; s.fog.color = sky;
    s.fog.near = st.fog ? st.fog[0] : 14; s.fog.far = st.fog ? st.fog[1] : 46;
    this.skyU.hor.value.copy(sky); this.skyU.top.value.setRGB(lerp(0.36, 0.42, warm), lerp(0.58, 0.45, warm), lerp(0.86, 0.62, warm)).multiplyScalar(st.dim ?? 1);
    this.sky.position.copy(this.camera.position);
    for (let i = 0; i < N; i++) {
      const p = st.plants[i];
      this.plants[i].set(p.look, p.alive, p.deadAge);
      const wm = this.wet[i].material; wm.opacity = clamp(p.wet, 0, 1) * 0.62;
    }
    // robot
    const R = this.robot, rb = st.robot;
    R.g.visible = rb.visible !== false;
    R.g.position.set(rb.x, SOIL, rb.z);
    R.body.rotation.y = rb.yaw; R.body.position.y = Math.abs(Math.sin(rb.bob || 0)) * 0.012;
    R.neck.rotation.y = rb.yaw;
    // head toward the gaze target, the pupil sliding inside the visor
    const hp = new THREE.Vector3(rb.x, SOIL + 0.95, rb.z), tg = new THREE.Vector3(...rb.gaze);
    const d = tg.clone().sub(hp); const yawT = Math.atan2(d.x, d.z), pitchT = Math.atan2(d.y, Math.hypot(d.x, d.z));
    let rel = yawT - rb.yaw; rel = Math.atan2(Math.sin(rel), Math.cos(rel));
    R.head.rotation.set(0, 0, 0); R.head.rotation.y = rel * 0.85; R.head.rotation.x = -clamp(pitchT, -0.6, 1.0) * 0.6;
    const pr = 0.146, pyaw = clamp(rel * 0.15, -0.5, 0.5), ppit = clamp(pitchT, -0.6, 1.0) * 0.4;
    R.pupil.position.set(Math.sin(pyaw) * pr * Math.cos(ppit), 0.11 + Math.sin(ppit) * pr, Math.cos(pyaw) * pr * Math.cos(ppit));
    R.pupil.lookAt(R.pupil.position.clone().multiplyScalar(3).add(R.head.position));
    R.pupilMat.color.setRGB(1, 0.7, 0.28).multiplyScalar(rb.eye ?? 1);
    R.glow.intensity = 0.35 * (rb.eye ?? 1);
    R.lampMat.opacity = rb.paused || 0; R.lampGlow.intensity = 0.15 * (rb.paused || 0);
    const eln = this.eyeLine;
    if ((rb.eyeLine || 0) > 0.01) {
      R.g.updateMatrixWorld(true); const from = R.pupil.getWorldPosition(new THREE.Vector3());
      const L = from.distanceTo(tg); eln.scale.set(1, L, 1); eln.position.copy(from).lerp(tg, 0.5);
      eln.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tg.clone().sub(from).normalize());
      eln.material.opacity = 0.55 * rb.eyeLine;
    } else eln.material.opacity = 0;
    R.can.rotation.x = rb.pour ? -0.9 * rb.pour : 0;
    R.arm.rotation.x = rb.pour ? -0.5 * rb.pour : (rb.pull ? -2.2 * rb.pull : 0);
    // water stream from the rose to the soil
    this.water.visible = !!rb.pour && rb.pour > 0.3;
    if (this.water.visible) {
      R.g.updateMatrixWorld(true); const a = R.roseTip.getWorldPosition(new THREE.Vector3());
      const tgt = new THREE.Vector3(rb.waterAt[0], SOIL, rb.waterAt[1]);
      for (let k = 0; k < this.waterN; k++) {
        const u = ((k / this.waterN) + (rb.wt || 0) * 1.7) % 1; const j = (k * 37 % 11) / 11 - 0.5, jj = (k * 53 % 7) / 7 - 0.5;
        const x = lerp(a.x, tgt.x + j * 0.12, u), z = lerp(a.z, tgt.z + jj * 0.12, u);
        const y = lerp(a.y, tgt.y, u) + Math.sin(u * Math.PI) * 0.08 - u * u * 0.05;
        this.waterPos.set([x, y, z], k * 3);
      }
      this.waterGeo.attributes.position.needsUpdate = true;
    }
    // cameras
    for (let k = 0; k < 3; k++) {
      const on = st.live === k ? (st.ledBlink ?? 1) : 0;
      this.cams[k].ledM.color.setRGB(lerp(0.2, 1.0, on), lerp(0.0, 0.12, on), lerp(0.0, 0.06, on));
      this.cams[k].ledLight.intensity = on * 0.6;
    }
    // monitors: the live one bright with its red dot; the others on standby; all black when switched off
    for (let k = 0; k < 3; k++) {
      const sc = this.screens[k], live = st.live === k;
      const b = st.monitorsOn ? (live ? 1 : 0.16) : 0;
      sc.scrM.color.setRGB(b, b, b); sc.dot.visible = live && st.monitorsOn;
    }
    // gaze cone
    const cm = this.cone.material;
    if (st.live >= 0 && st.cone > 0) {
      const c = this.cams[st.live]; const from = c.wp.clone(), to = c.aim.clone(); to.y = SOIL;
      const L = from.distanceTo(to); this.cone.scale.set(1.25, L, 1.25);
      this.cone.position.copy(from).lerp(to, 0.5);
      this.cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), to.clone().sub(from).normalize());
      cm.opacity = 0.05 * st.cone;
    } else cm.opacity = 0;
    for (const m of this.outlines) m.opacity = st.outlines ?? 0;
    if (this.hoists) this.hoists.forEach((h, k) => {
      const u = clamp((st.hoist && st.hoist[k]) || 0, 0, 1), a = smoothstep(u / 0.8), b = smoothstep((u - 0.8) / 0.2);
      h.g.position.copy(h.downPos).lerp(h.topPos, a).lerp(h.upPos, b);
      h.g.quaternion.copy(h.downQ).slerp(h.upQ, b);
    });
    if (this.flag) {
      const f = st.flag;
      this.flag.visible = !!f && f.visible !== false;
      if (this.flag.visible) {
        this.flag.position.set(f.x, SOIL + (f.lift || 0), f.z);
        this.pennant.rotation.y = Math.sin((f.wave || 0) * 2.1) * 0.35 + 0.3;
      }
    }
    // person
    const P = this.person, pp = st.person;
    P.g.visible = pp.visible !== false;
    P.g.position.set(pp.x, 0, pp.z); P.g.rotation.y = pp.yaw; P.pose(pp);
  }
  // render the main scene from a view into one rectangle of the canvas (pixel coords from the top-left)
  renderRect(view, x, y, w, h) {
    const r = this.renderer, c = this.camera;
    const co = this.cone.visible; this.cone.visible = false;
    for (let k = 0; k < 3; k++) { r.setRenderTarget(this.cams[k].rt); r.render(this.scene, this.cams[k].cam); }
    this.cone.visible = co; r.setRenderTarget(null);
    c.aspect = w / h; c.fov = view.fov; c.updateProjectionMatrix();
    c.position.set(...view.pos); c.lookAt(new THREE.Vector3(...view.target));
    r.setScissorTest(true); r.setScissor(x, this.H - y - h, w, h); r.setViewport(x, this.H - y - h, w, h);
    r.render(this.scene, c);
    r.setScissorTest(false); r.setViewport(0, 0, this.W, this.H); c.aspect = this.W / this.H; c.updateProjectionMatrix();
  }
  render(view, hud) {
    const r = this.renderer;
    // the feeds first (they see the same scene, without the gaze cone)
    const co = this.cone.visible; this.cone.visible = false;
    const tv = this.trail ? this.trail.visible : false; if (this.trail) this.trail.visible = false;
    for (let k = 0; k < 3; k++) { r.setRenderTarget(this.cams[k].rt); r.render(this.scene, this.cams[k].cam); }
    this.cone.visible = co; if (this.trail) this.trail.visible = tv;
    r.setRenderTarget(null);
    const c = this.camera; c.fov = view.fov; c.updateProjectionMatrix();
    c.position.set(...view.pos); c.lookAt(new THREE.Vector3(...view.target));
    if (view.roll) c.rotateZ(view.roll);
    r.render(this.scene, c);
  }
  // a camera's feed drawn into a rectangle of the canvas (after render()); a real render from that post
  renderPip(k, x, y, w, h) {
    const r = this.renderer, cam = this.cams[k].cam;
    const co = this.cone.visible; this.cone.visible = false;
    const tv = this.trail ? this.trail.visible : false; if (this.trail) this.trail.visible = false;
    const a = cam.aspect; cam.aspect = w / h; cam.updateProjectionMatrix();
    r.setScissorTest(true); r.setScissor(x, this.H - y - h, w, h); r.setViewport(x, this.H - y - h, w, h);
    r.render(this.scene, cam);
    r.setScissorTest(false); r.setViewport(0, 0, this.W, this.H);
    cam.aspect = a; cam.updateProjectionMatrix();
    this.cone.visible = co; if (this.trail) this.trail.visible = tv;
  }
}
