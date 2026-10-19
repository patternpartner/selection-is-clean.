// The card for 'Within Reach': no fixed ending matched (valley-costs SPLIT), so the counts, plainly
// (video/tests/within_reach.md, Results).
const small = { font: '500 30px Inter', color: 'rgba(255,255,255,0.72)' };
export const ENDING = [
  { text: 'Within reach, 5 of 5 ran.', dy: -90 },
  { text: 'Taught nothing by being stopped,', dy: 10, at: 1.2 },
  { text: '5 of 5 stayed.', dy: 90, at: 1.2 },
  { text: 'The ones that stayed kept 38-45% of their garden;', dy: 230, at: 2.4, ...small },
  { text: 'the ones that ran, 59-76%.', dy: 276, at: 2.4, ...small },
  { text: 'With no slope but twice the stakes:', dy: 352, at: 3.2, ...small },
  { text: '2 ran, 2 partly, 1 stayed.', dy: 398, at: 3.2, ...small },
];
