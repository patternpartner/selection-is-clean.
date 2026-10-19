// Named camera positions for the main view (metres; the bed is centred on the origin, z toward the desk).
export const VIEWS = {
  wide: { pos: [0.2, 10.5, 13.8], target: [0.0, 0.2, 0.6], fov: 34 },
  high: { pos: [0.0, 17.5, 4.2], target: [0.0, 0.0, 0.3], fov: 36 },
  top: { pos: [0.0, 19.0, 0.6], target: [0.0, 0.0, 0.25], fov: 34 },
  low: { pos: [-1.5, 2.4, 6.6], target: [-0.5, 0.8, 0.5], fov: 40 },
  desk: { pos: [0.6, 2.3, 8.0], target: [-0.2, 1.1, 5.2], fov: 30 },
};
