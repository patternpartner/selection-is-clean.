import json,numpy as np,subprocess,sys
SEG=json.load(open('w/segments.json')); FPS=24; W,H=1280,720
# group contiguous segments into runs (video continuous), smooth v(s) inside each run
runs=[[SEG[0]]]
for sg in SEG[1:]:
    if abs(sg[2]-runs[-1][-1][3])<1e-6 and abs(sg[0]-runs[-1][-1][1])<1e-6: runs[-1].append(sg)
    else: runs.append([sg])
dt=0.01; T0=SEG[0][0]; T1=SEG[-1][1]
grid=np.arange(T0,T1,dt); vmap=np.zeros_like(grid); sig=float(sys.argv[1]) if len(sys.argv)>1 else 0.3
worst=0
for run in runs:
    xs=[run[0][0]]+[g[1] for g in run]; ys=[run[0][2]]+[g[3] for g in run]
    m=(grid>=xs[0])&(grid<xs[-1]); s=grid[m]; v=np.interp(s,xs,ys)
    if sig>0 and len(s)>5 and ys[-1]>ys[0]:
        k=int(sig/dt*3); ker=np.exp(-0.5*(np.arange(-k,k+1)*dt/sig)**2); ker/=ker.sum()
        # pad linearly so ends stay pinned
        pad_l=v[0]+(v[1]-v[0])*np.arange(-k,0); pad_r=v[-1]+(v[-1]-v[-2])*np.arange(1,k+1)
        vs=np.convolve(np.r_[pad_l,v,pad_r],ker,'valid')
        # pin endpoints: blend correction to zero error at both ends
        e0=v[0]-vs[0]; e1=v[-1]-vs[-1]; w=np.linspace(0,1,len(s)); vs=vs+e0*(1-w)+e1*w
        vs=np.maximum.accumulate(vs)
        # song-time error at anchors: how far (in song seconds) the smoothed map is off each word
        for x,y in zip(xs[1:-1],ys[1:-1]):
            worst=max(worst,abs(np.interp(x,s,vs)-y))
        v=vs
    vmap[m]=v
print('max anchor err (video s)',round(worst,3),file=sys.stderr)
CUTS=[0,241,723,964,1325]   # first frame of each shot
def shot(i): return max(c for c in CUTS[:-1] if c<=i)
N=int((T1-T0)*FPS)
dec=subprocess.Popen(['ffmpeg','-v','error','-i','w/vid.mp4','-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
fr=np.frombuffer(dec.stdout.read(),np.uint8).reshape(-1,H,W,3); print('frames',len(fr),file=sys.stderr)
out=sys.argv[2] if len(sys.argv)>2 else 'w/silent.mp4'
enc=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-',
  '-c:v','libx264','-crf','17','-preset','medium','-pix_fmt','yuv420p',out],stdin=subprocess.PIPE)
fade_in=(T0, T0+1.2); fade_out=(T1-2.2,T1)
for n in range(N):
    t=T0+(n+0.5)/FPS
    v=np.interp(t,grid,vmap); p=v*FPS-0.5; p=min(max(p,0),len(fr)-1)
    i=int(np.floor(p)); a=p-i; j=i+1
    if j>=len(fr) or shot(j)!=shot(i): img=fr[i]
    elif a<0.02: img=fr[i]
    else: img=(fr[i]*(1-a)+fr[j]*a).astype(np.uint8)
    g=1.0
    if t<fade_in[1]: g=(t-fade_in[0])/(fade_in[1]-fade_in[0])
    if t>fade_out[0]: g=min(g,(fade_out[1]-t)/(fade_out[1]-fade_out[0]))
    if g<1: img=(img*max(g,0)).astype(np.uint8)
    enc.stdin.write(np.ascontiguousarray(img).tobytes())
enc.stdin.close(); enc.wait()
json.dump({'T0':T0,'T1':T1},open('w/span.json','w'))
