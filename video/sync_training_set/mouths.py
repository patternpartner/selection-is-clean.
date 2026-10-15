# Whole song at 1x: Grok's footage re-cut on bar lines (some windows mirrored), cartoon mouths on all five
# faces, opened by the Demucs vocal stem and shaped by the vowels of the word being sung.
import json,re,subprocess,sys,numpy as np,cv2,soundfile as sf
from scipy.ndimage import gaussian_filter1d
FPS=24; W,H=1280,720; T=np.load('w/tracks.npy'); CUTS=[0,241,723,964,1325]
SONG=153.65; BAR=2.4; PH=0.09
# ---- edit: 2-bar windows from inside shots, shuffled, no window twice in a row, second use mirrored
rng=np.random.default_rng(int(sys.argv[1]) if len(sys.argv)>1 else 3)
wins=[]
for s,e in zip(CUTS,CUTS[1:]):
    t=s/FPS
    while t+2*BAR<=e/FPS-0.05: wins.append((round(t,3),s,e)); t+=BAR
edit=[]; t=0.0; use={}
starts=[0.0]+[PH+BAR*k for k in range(1,80) if PH+BAR*k<SONG]
bounds=starts[::2]+[SONG]
last=None
for a,b in zip(bounds,bounds[1:]):
    cand=[w for w in wins if w!=last and (last is None or w[1]!=last[1])]
    cand.sort(key=lambda w:(use.get(w,0),rng.random()))
    w=cand[0] if a>0 else wins[0]; n=use.get(w,0); use[w]=n+1; last=w
    edit.append(dict(t0=a,t1=b,src=w[0],mirror=bool(n%2),shot=(w[1],w[2])))
json.dump(edit,open('w/mouth_edit.json','w'),indent=0)
# ---- mouth openness from vocal stem: loudness gate x syllable pulse (vs its 300 ms local max)
from scipy.signal import butter,sosfiltfilt
from scipy.ndimage import maximum_filter1d
v,sr=sf.read('w/stems/htdemucs/song/vocals.wav'); v=v.mean(1) if v.ndim>1 else v
x=sosfiltfilt(butter(4,[300,3000],'band',fs=sr,output='sos'),v)
hop=sr//100; n=len(x)//hop; e=gaussian_filter1d(np.sqrt((x[:n*hop].reshape(n,hop)**2).mean(1)),1)
r=e/(maximum_filter1d(e,30)+1e-9); le=np.log10(gaussian_filter1d(e,4)+1e-6)
OPEN=np.clip((le+1.75)/0.6,0,1)**0.8*np.clip((r-0.15)/0.7,0,1)
OPEN=gaussian_filter1d(OPEN,1.2)
# ---- visemes from word timings
words=[(a,b,re.sub(r"[^a-z]","",w.lower())) for s in json.load(open('w/song.mp3.json')) for a,b,w in s['w']]
def vis(word):
    seq=[]
    for ch in word:
        if ch in 'aeiouwy':
            seq.append({'a':'A','e':'E','i':'E','y':'E','o':'O','u':'O','w':'O'}[ch])
        elif ch in 'mbp': seq.append('M')
    out=[]
    for x in seq:
        if not out or out[-1]!=x: out.append(x)
    return out or ['A']
def viseme(t):
    for a,b,w in words:
        if a<=t<b:
            s=vis(w); return s[min(int((t-a)/(b-a+1e-6)*len(s)),len(s)-1)]
    return 'A'
SHAPE={'A':(1.0,1.0),'E':(1.18,0.5),'O':(0.7,0.95),'M':(1.0,0.0)}
# ---- drawing
S4=4  # subpixel shift
def P(x,y): return (int(round(x*16)),int(round(y*16)))
def draw_mouth(img,cx,cy,fw,ang,o,shape,skin):
    # work in a crop around the mouth (fast); coordinates local to the crop
    R=int(fw*0.8)+4; x0=max(int(cx)-R,0); y0=max(int(cy)-R,0); x1=min(int(cx)+R,W); y1=min(int(cy)+R,H)
    if x1-x0<8 or y1-y0<8: return
    im=img[y0:y1,x0:x1]; hh,ww=im.shape[:2]; cx-=x0; cy-=y0
    sw,sh=SHAPE[shape]; o=0.0 if shape=='M' else o
    w=fw*0.36*sw*(1-0.1*o); h=fw*0.30*sh*o
    mask=np.zeros((hh,ww),np.uint8)
    cv2.ellipse(mask,P(cx,cy+fw*0.02),P(fw*0.34,fw*0.2),ang,0,360,255,-1,cv2.LINE_AA,4)
    m=cv2.GaussianBlur(mask,(0,0),max(fw*0.05,0.8))[...,None]/255.0
    f=im.astype(np.float32)*(1-m)+np.array(skin,np.float32)[None,None,:]*m
    lip=(60,50,205); dark=(35,20,80); line=max(1,int(round(fw*0.05)))
    if h<fw*0.035:
        f=f.astype(np.uint8)
        cv2.ellipse(f,P(cx,cy-fw*0.07),P(w,fw*0.11),ang,15,165,lip,line+2,cv2.LINE_AA,4)
        cv2.ellipse(f,P(cx,cy-fw*0.07),P(w,fw*0.11),ang,15,165,dark,max(1,line-1),cv2.LINE_AA,4)
        img[y0:y1,x0:x1]=f; return
    def ell(c,ax,col):
        mk=np.zeros((hh,ww),np.uint8); cv2.ellipse(mk,P(*c),P(*ax),ang,0,360,255,-1,cv2.LINE_AA,4); return mk
    inner=ell((cx,cy),(w,h),0)
    def paint(mk,col):
        nonlocal f; a_=mk[...,None]/255.0; f=f*(1-a_)+np.array(col,np.float32)[None,None,:]*a_
    paint(inner,(30,18,70))
    paint(cv2.bitwise_and(inner,ell((cx,cy-h),(w*0.85,h*0.5),0)),(245,245,245))
    if o>0.45: paint(cv2.bitwise_and(inner,ell((cx,cy+h*0.8),(w*0.55,h*0.45),0)),(120,105,235))
    f=f.astype(np.uint8)
    cv2.ellipse(f,P(cx,cy),P(w,h),ang,0,360,lip,line+2,cv2.LINE_AA,4)
    cv2.ellipse(f,P(cx,cy),P(w+line*0.9,h+line*0.9),ang,0,360,dark,1,cv2.LINE_AA,4)
    img[y0:y1,x0:x1]=f
dec=subprocess.Popen(['ffmpeg','-v','error','-i','w/vid.mp4','-f','rawvideo','-pix_fmt','bgr24','-'],stdout=subprocess.PIPE)
FR=np.frombuffer(dec.stdout.read(),np.uint8).reshape(-1,H,W,3)
outp=sys.argv[2] if len(sys.argv)>2 else 'w/mouths_silent.mp4'; N=int(SONG*FPS)
lim=int(sys.argv[3]) if len(sys.argv)>3 else N
enc=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','bgr24','-s',f'{W}x{H}','-r',str(FPS),'-i','-',
  '-c:v','libx264','-crf','18','-preset','medium','-pix_fmt','yuv420p',outp],stdin=subprocess.PIPE)
skin_ema={}
for n in range(min(N,lim)):
    t=(n+0.5)/FPS; seg=next(s for s in edit if s['t0']<=t<s['t1'])
    fi=int((seg['src']+t-seg['t0'])*FPS); fi=min(max(fi,seg['shot'][0]),seg['shot'][1]-1)
    img=FR[fi].copy()
    if seg['mirror']: img=img[:,::-1].copy()
    k=int(min(t*100,len(OPEN)-1)); vs=viseme(t)
    for j in range(5):
        mx,my,mw,fw,fh,ang,al=T[fi,j]
        if al<0.02: continue
        if seg['mirror']: mx=W-1-mx; ang=-ang
        # skin: median of cheeks just above the mouth, smoothed per face/seg
        y0=int(my-fw*0.35); x0=int(mx-fw*0.38); x1=int(mx+fw*0.38)
        patch=np.concatenate([img[y0:y0+int(fw*0.12),x0:x0+int(fw*0.15)].reshape(-1,3),img[y0:y0+int(fw*0.12),x1-int(fw*0.15):x1].reshape(-1,3)])
        sk=np.median(patch,0) if len(patch) else np.array([150,170,210])
        key=(j,id(seg)); skin_ema[key]=sk if key not in skin_ema else skin_ema[key]*0.8+sk*0.2
        lag=[0,1,0,2,1][j]  # tiny per-singer lag so they are not robots
        o=OPEN[max(0,k-lag*2)]
        if al>0.98: draw_mouth(img,mx,my,fw,ang,o,vs,skin_ema[key])
        else:
            tmp=img.copy(); draw_mouth(tmp,mx,my,fw,ang,o,vs,skin_ema[key])
            R=int(fw*0.8)+4; ys=slice(max(int(my)-R,0),int(my)+R); xs=slice(max(int(mx)-R,0),int(mx)+R)
            img[ys,xs]=(img[ys,xs]*(1-al)+tmp[ys,xs]*al).astype(np.uint8)
    g=1.0
    if t<0.6: g=t/0.6
    if t>SONG-2.0: g=max(0,(SONG-t)/2.0)
    if g<1: img=(img*g).astype(np.uint8)
    enc.stdin.write(img.tobytes())
enc.stdin.close(); enc.wait(); print('done',outp)
