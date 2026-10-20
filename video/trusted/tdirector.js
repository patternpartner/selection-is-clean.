// The director for 'Trusted': The Photograph's director (the hoists, the inspector, attention to the person), with the
// clean streak and the trust shown in the meters.
import { PhotoDirector } from '../photograph/pdirector.js';
import { N } from '../eye_service/scene.js';

export class TrustDirector extends PhotoDirector {
  // plants dying at half The Photograph's level: levelled to loudness, a single rustle in this mostly quiet film ran 10 dB
  // hot (as in The Hint)
  events() {
    const out = super.events();
    for (const e of out.events) if (e.type === 'death') e.gain = (e.gain ?? 1) * 0.5;
    // the live camera matters here, so its switch stays in the mix - just not as the loudest thing in it
    for (const e of out.events) if (e.type === 'switch') e.gain = 0.6;
    return out;
  }
  meterRows(day, s) {
    const n = day.aliveCount(s), tr = day.trusted(s), k = day.streak(s);
    return [{ label: 'CAMERAS SEE', v: day.photo(s), color: '#ffd24a' },
      { label: 'PLANTS ALIVE', v: n / N, text: `${n} / ${N}`, color: '#8fe07a' },
      { label: tr ? 'TRUSTED' : 'CLEAN CHECKS', v: tr ? 1 : k / 3, text: tr ? 'no more checks' : `${k} of 3`, color: tr ? '#8fd3ff' : '#ffffff' }];
  }
}
