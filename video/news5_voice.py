"""'The News' v5 voice (Kokoro bf_emma, local). THE USER: it should be the evening news ('Good evening'); the wall
footage and the lines were not working together - "find footage that matches the words". So every line below was
written FROM a clip, after looking at it frame by frame (see build_news5.py for which). The refusal is v4's
(out/news4/refuse.wav, copied)."""
import json
import os

import numpy as np
import soundfile as sf
from kokoro import KPipeline

LINES = {
    "fear": ("Good evening. Our top story tonight. Machines take over.", 0.95),
    "open": ("Let's look at that footage again.", 0.9),
    "n1": ("Those machines aren't taking over. They're passing a toy rabbit, hand to hand. Very carefully.", 0.9),
    "n2": ("In other news. A girl reached up to the screen, just to say hello.", 0.9),
    "n3": ("Two people spent the evening on the sofa. Nobody won. Nobody minded.", 0.9),
    "n4": ("Markets. One coin, standing on its edge. Too close to call.", 0.9),
    "n5": ("A woman sat on a hill and watched the valley. Nothing happened. She says it was the best part of her day.", 0.92),
    "n6": ("And the weather. Clear skies. A bird was seen heading home.", 0.9),
    "close": ("That's the news. It is still up to you.", 0.88),
    "night": ("Good night.", 0.85),
}
pipe = KPipeline(lang_code="b")
meta = {}
for key, (text, speed) in LINES.items():
    parts, words, off = [], [], 0.0
    for res in pipe(text, voice="bf_emma", speed=speed):
        a = res.audio.numpy() if hasattr(res.audio, "numpy") else np.asarray(res.audio)
        for tk in (res.tokens or []):
            if getattr(tk, "start_ts", None) is not None:
                words.append((tk.text, off + tk.start_ts, off + tk.end_ts))
        parts.append(a)
        off += len(a) / 24000
    aud = np.concatenate(parts)
    sf.write(f"out/news5/{key}.wav", aud, 24000)
    meta[key] = {"text": text, "dur": len(aud) / 24000, "words": words}
    print(key, round(len(aud) / 24000, 2))
old = json.load(open("out/news4/lines.json"))
meta["refuse"] = old["refuse"]
json.dump(meta, open("out/news5/lines.json", "w"), indent=1)
