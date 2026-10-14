import sys,json
from faster_whisper import WhisperModel
m=WhisperModel('small',device='cpu',compute_type='int8')
for f in sys.argv[1:]:
    import numpy as np; segs,_=m.transcribe(np.fromfile(f+".16k",np.float32),language='en',word_timestamps=True,vad_filter=False)
    out=[]
    for s in segs:
        print(f,f"{s.start:6.2f}-{s.end:6.2f}",s.text); out.append({'s':s.start,'e':s.end,'t':s.text,'w':[(w.start,w.end,w.word) for w in s.words]})
    json.dump(out,open(f+'.json','w'))
