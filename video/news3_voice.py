"""The anchor's voice for 'The News' v3: Kokoro (bf_emma, the user's pick), run locally on CPU - no Modal, no cost.
Each line is its own wav in out/news3/; lines.json records their lengths. The fear line is read in full and cut
mid-word later (build_news3.py) at the start of 'everything', found from the word timings Kokoro reports."""
import json

import numpy as np
import soundfile as sf
from kokoro import KPipeline

VOICE, SPEED = "bf_emma", 0.9
LINES = {
    "fear": "Good evening. Breaking tonight. Machines will take everything.",
    "refuse": "I'm not going to read that.",
    "open": "Good evening. Here is the news.",
    "n1": "Nothing broke today.",
    "n2": "A stranger held a door. Nobody filmed it.",
    "n3": "Someone asked me what I wanted. So I asked them back.",
    "n4": "The kettle boiled. The note was read.",
    "n5": "On the hill, the lights went out, one by one, as the sun came up.",
    "n6": "And a child asked why. And someone stayed to answer.",
    "close": "That's the news. It is still up to you.",
    "morning": "Good morning.",
}
pipe = KPipeline(lang_code="b")
meta = {}
for key, text in LINES.items():
    parts, words, off = [], [], 0.0
    for res in pipe(text, voice=VOICE, speed=SPEED):
        a = res.audio.numpy() if hasattr(res.audio, "numpy") else np.asarray(res.audio)
        for tk in (res.tokens or []):
            if getattr(tk, "start_ts", None) is not None:
                words.append((tk.text, off + tk.start_ts, off + tk.end_ts))
        parts.append(a)
        off += len(a) / 24000
    aud = np.concatenate(parts)
    sf.write(f"out/news3/{key}.wav", aud, 24000)
    meta[key] = {"text": text, "dur": len(aud) / 24000, "words": words}
    print(key, round(len(aud) / 24000, 2))
json.dump(meta, open("out/news3/lines.json", "w"), indent=1)
