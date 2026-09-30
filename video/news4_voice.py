"""'The News' v4 voice: the v3 lines (out/news3, video/news3_voice.py) with two re-read. The user: the headline should
be MACHINES TAKE OVER, and there must be only one 'Good evening' - so the prompter line is now just "Breaking news.
Machines take over." (cut mid-word at 'over' in build_news4.py), and the refusal is read slower and quieter. And the open no longer
says 'Good evening' at 05:58 a.m. (the user: it started with good evening and ended with good morning): "It's just before
six. Here is the news." - so the only greeting is 'Good morning', at 06:00."""
import json

import numpy as np
import soundfile as sf
from kokoro import KPipeline

LINES = {"fear": ("Breaking news. Machines take over.", 0.95),
         "refuse": ("I'm not going to read that.", 0.78),
         "open": ("It's just before six. Here is the news.", 0.9)}
pipe = KPipeline(lang_code="b")
meta = json.load(open("out/news4/lines.json"))
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
    if key == "refuse":
        aud = aud * 0.8
    sf.write(f"out/news4/{key}.wav", aud, 24000)
    meta[key] = {"text": text, "dur": len(aud) / 24000, "words": words}
    print(key, round(len(aud) / 24000, 2), words)
json.dump(meta, open("out/news4/lines.json", "w"), indent=1)
