# Map song time -> video time, word-anchored. Runs are lists of (song_word_idx, vid_word_idx) pairs
# that play continuously; between runs the video jumps. Each run ends at the next run's song start.
import json,re,numpy as np
def words(f):
    W=[]
    for s in json.load(open(f)):
        for a,b,w in s['w']:
            if re.sub(r"[^a-z]","",w.lower()): W.append((a,b))
    return W
S=words('w/song.mp3.json'); V=words('w/vid.mp4.json')
r=lambda s0,s1,v0:[(s,v0+s-s0) for s in range(s0,s1+1)]
RUNS=[
 r(0,11,0)[:7]+r(7,16,8)[:5]+[(12,13),(14,14),(15,15),(16,16)],   # verse 1, first 'want agi that way'
 r(17,22,22)+[(23,28),(25,29)]+r(26,44,30),                       # but we are two worlds apart .. tell me why
 r(45,50,52),                                                     # aint nothing but a training set
 r(51,53,60),                                                     # tell me why (skip 2nd)
 r(54,68,66)[:6]+r(60,62,72)+[(63,75),(64,76),(65,77),(66,79),(67,80),(68,81),(69,82),(70,83),(72,84),(73,85),(74,86)],
 'GAP',                                                           # instrumental: slow the 'i want ai that way' tail into 'am i'
 r(75,114,94),                                                    # am i your fire .. tell me why (end of video)
 [(115,75),(116,76),(117,77),(118,79),(119,80),(120,81),(121,82),(122,83),(123,84),(124,85),(125,86)],  # reuse: i never wanna hear you say i want ai that way
]
# check text pairs
St=[w for s in json.load(open('w/song.mp3.json')) for w in s['w'] if re.sub(r"[^a-z]","",w[2].lower())]
Vt=[w for s in json.load(open('w/vid.mp4.json')) for w in s['w'] if re.sub(r"[^a-z]","",w[2].lower())]
pts=[]  # list of runs of (s_time, v_time)
for run in RUNS:
    if run=='GAP': pts.append('GAP'); continue
    pts.append([(S[a][0],V[b][0]) for a,b in run])
    print(' '.join(f"{St[a][2].strip()}/{Vt[b][2].strip()}" for a,b in run))
SEG=[]
INTRO=7.29
SEG.append((INTRO,S[0][0],0.0,0.0))  # freeze first frame over the intro bar
for i,run in enumerate(pts):
    if run=='GAP':
        prev=pts[i-1][-1]; nxt=pts[i+1][0]
        # last word of previous run: hold its word duration then slow to next run
        SEG.append((SEG[-1][1],nxt[0],SEG[-1][3],nxt[1])); continue
    for (s0,v0),(s1,v1) in zip(run,run[1:]): SEG.append((s0,s1,v0,v1))
    s_last,v_last=run[-1]
    # tail of last word: up to next run's start (or end)
    if i+1<len(pts):
        nxt=pts[i+1]
        if nxt=='GAP': continue
        s_next=nxt[0][0]
    else: s_next=None
    vi=[b for a,b in RUNS[i]][-1]; v_end=V[vi][1]
    if s_next is None:
        SEG.append((s_last,S[125][1],v_last,v_end)); SEG.append((S[125][1],94.5,v_end,v_end+0.2))
    else:
        SEG.append((s_last,s_next,v_last,v_end))
json.dump(SEG,open('w/segments.json','w'))
for s0,s1,v0,v1 in SEG:
    print(f"song {s0:6.2f}-{s1:6.2f}  vid {v0:6.2f}-{v1:6.2f}  speed {(v1-v0)/max(s1-s0,1e-6):.2f}")
