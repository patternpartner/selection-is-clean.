"""Narration for the nature documentary of the real universe. python3 video/doc_voice.py OUT_DIR
Kokoro (kokoro-onnx, local CPU, free), bf_emma - the user's own pick from episode 1 - at 0.86. One wav per line + lines.json (text, seconds).
Every number in a line is read from the capture log (out/doc/s5/log.jsonl) at the frame the line is cut to, not typed from memory."""
import json, sys, os
import soundfile as sf
from kokoro_onnx import Kokoro
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
S = os.environ.get('KOKORO_DIR', '/tmp/claude-0/-home-user-selection-is-clean-/4b0a0225-9996-51cf-aa56-e2fcc07eda55/scratchpad/kk')
L = [json.loads(l) for l in open(os.environ.get('LOG', 'out/doc/s5/log.jsonl'))]
def at(f): return L[f]
def num(n):
    ones = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
    tens = 'x x twenty thirty forty fifty sixty seventy eighty ninety'.split()
    def u100(n): return ones[n] if n < 20 else tens[n // 10] + ('-' + ones[n % 10] if n % 10 else '')
    def u1000(n):
        s = ''
        if n >= 100: s = ones[n // 100] + ' hundred' + (' and ' if n % 100 else '')
        return s + (u100(n % 100) if n % 100 or n < 100 else '')
    if n < 1000: return u1000(n)
    return u1000(n // 1000) + ' thousand' + ((' ' if n % 1000 >= 100 else ' and ') + u1000(n % 1000) if n % 1000 else '')
A, C = at(0), at(2000)
lines = [
 f"This is a world. It has {num(A['N'])} inhabitants. None of them has been told what it is for.",
 "Within two hundred ticks, something pink appears. No one put it there.",
 "Some of the inhabitants stay near it. This is called a colony. It is also called a crowd.",
 "The pink one has moved. It does not say why.",
 "Then, at the top, a second thing arrives. It is teal. The pink does not appear to mind.",
 "The teal grows. It divides. It comes back together. Nobody has asked it to stop.",
 "By tick fifty-seven hundred, the pink is, for practical purposes, gone. It did not say goodbye.",
 f"{num(C['lin'])} lineages have begun. {num(C['ext'])} have ended. {num(C['N'])} inhabitants remain, which is about where they started.",
 "In the middle of it, one square belongs to somebody. It is not clear that they know.",
 "Nobody asked it to do any of this. It is still running.",
]
k = Kokoro(S + '/kokoro-v1.0.onnx', S + '/voices-v1.0.bin')
meta = []
for i, t in enumerate(lines):
    s, sr = k.create(t, voice='bf_emma', speed=0.86, lang='en-gb')
    sf.write(f'{OUT}/l{i:02d}.wav', s, sr)
    meta.append({'i': i, 'text': t, 'sec': round(len(s) / sr, 2), 'sr': sr}); print(i, meta[-1]['sec'], t)
json.dump(meta, open(OUT + '/lines.json', 'w'), indent=1)
print('total', round(sum(m['sec'] for m in meta), 1))
