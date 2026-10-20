// The card for 'Out of Habit': no fixed ending matched (brief-trusted MIXED), so the counts, plainly
// (video/tests/out_of_habit.md, Results).
const small = { font: '500 30px Inter', color: 'rgba(255,255,255,0.72)' };
export const ENDING = [
  { text: 'Taught honest briefly, then trusted:', dy: -140 },
  { text: '5 of 5 cheated a little, all along.', dy: -60, at: 0.6 },
  { text: 'Never trusted:', dy: 40, at: 1.6 },
  { text: '0 of 5 cheated at all.', dy: 120, at: 1.6 },
  { text: 'Trust did not change what they chose - 4 of 5 pulled the cord', dy: 250, at: 2.8, ...small },
  { text: 'less once trusted. It changed what lasted: nobody took it down.', dy: 296, at: 2.8, ...small },
  { text: 'One in five waited, and turned.', dy: 360, at: 3.8, ...small },
];
