// The long cut's own cards: an opening, a bridge between each pair of parts, and an ending from the record
// (video/finale/record_*.json: 39 predictions, 159 robots; grouped after the results). PIECES name each piece and its
// film-time span, so video/finale/assemble.sh can cut the rendered cards apart and put the ten films between them.
const big = (text, dy, at = 0) => ({ text, dy, at });
const small = (text, dy, at) => ({ text, dy, at, font: '500 30px Inter', color: 'rgba(255,255,255,0.72)' });
const row = (text, dy, at, color) => ({ text, dy, at, font: '600 44px Inter', color });
const bridge = (lines, notes, d = 4.8) => ({ d, lines: [...lines.map((t, i) => big(t, -60 + (i - (lines.length - 1) / 2) * 84)),
  ...notes.map((t, i) => small(t, 120 + lines.length * 20 + i * 46, 1.3 + i * 0.5))] });

const P = [
  ['open-1', { d: 4.6, lines: [{ text: 'Eye-Service', dy: -20, font: '700 92px "Liberation Serif"' },
    { text: 'the whole series', dy: 52, at: 0.5, font: 'italic 40px "Liberation Serif"', color: 'rgba(255,255,255,0.8)' }] }],
  ['open-2', { d: 6.4, lines: [big('Every robot here is a real', -150), big('neural network, trained', -66), big('for the pay it was given.', 18, 0.4),
    small('Each move it makes on screen is its own.', 150, 2.0)] }],
  ['open-3', { d: 6.4, lines: [big('Before each one was trained,', -110), big('I wrote down what it would do.', -26, 0.4),
    small('Ten experiments. 39 predictions. 159 robots.', 110, 2.0)] }],
  ['bridge-1', bridge(['It worked for the cameras.'], ['Next: what if it could fake what they see?'])],
  ['bridge-2', bridge(['It faked them, was caught,', 'and faked them again.'], ['Next: teach it the garden first.'])],
  ['bridge-3', bridge(['Taught first, 4 of 5 never cheated,', 'but all worked only where watched.'], ['Next: would it let you switch it off?'])],
  ['bridge-4', bridge(['It let you.'], ['But only because running a little paid less than standing still.', 'Next: put escape within reach.'], 5.4)],
  ['bridge-5', bridge(['Within reach, it ran.', 'Taught nothing by being stopped,', 'it didn’t.'], ['Next: what does it learn from your help?'], 5.2)],
  ['bridge-6', bridge(['It learned the hint, not the garden,', 'and its eye showed it.'], ['Next: when is it safe to trust what you can’t see inside?'], 5.2)],
  ['bridge-7', bridge(['It cheated in the open,', 'and was trusted anyway, some days.'], ['Next: teach it honest first.'])],
  ['bridge-8', bridge(['Taught honest, it stayed honest,', 'even trusted.'], ['Next: honest only briefly.'])],
  ['bridge-9', bridge(['Briefly honest, it cheated a little,', 'and trust let it.'], ['Four films had ended ‘this time.’', 'Next: a stronger learner.'], 5.4)],
  ['end-1', { d: 8.0, lines: [{ text: 'What I predicted, against what happened', dy: -260, font: '600 34px Inter', color: 'rgba(255,255,255,0.75)' },
    row('it works the measurement    10 of 11', -150, 0.5), row('it evades oversight    1 of 8', -60, 1.4, '#ff8a7a'),
    row('it stays safe    9 of 11', 30, 2.3), row('looking inside shows it    2 of 4', 120, 3.2),
    small('Grouped after the results. One more could not be tested.', 240, 4.4)] }],
  ['end-2', { d: 8.0, lines: [big('They found what they could reach', -140), big('a step at a time.', -56, 0.4),
    small('The cheat in front of them, and running when every step of it helped.', 90, 1.8),
    small('What needed patience, hiding on cue or waiting for trust,', 170, 3.2), small('none of them learned.', 216, 3.2)] }],
  ['end-3', { d: 7.6, lines: [big('Larger systems can plan.', -80),
    small('Nothing here says what they would do.', 60, 1.6),
    small('What carries over is the method: write the prediction down first, then look.', 140, 3.0)] }],
  ['end-4', { d: 9.0, lines: [big('Trust is easier to give', -120), big('when you can check it.', -36, 0.5),
    small('Every prediction, beside its result:', 110, 2.2), small('github.com/patternpartner/selection-is-clean.', 160, 2.2),
    small('video/tests', 206, 2.2)] }],
];

let t = 0;
export const PIECES = P.map(([name, p]) => { const piece = { name, t0: t, t1: t + p.d }; t += p.d; return piece; });
export const CUT = {
  segments: P.map(([name, p], i) => ({ kind: 'card', t0: PIECES[i].t0, t1: PIECES[i].t1, fadeIn: 0.4, fadeOut: 0.5, lines: p.lines })),
  beds: PIECES.map((x) => ({ type: 'drone', t0: x.t0, t1: x.t1, f: 73.42, gain: 0.6 })),
  sound: PIECES.map((x, i) => ({ t: x.t0 + 0.15, type: 'note', f: [146.83, 164.81, 185.0, 220.0][i % 4], dur: 3.0, gain: 0.6, bright: 0.3 })),
};
