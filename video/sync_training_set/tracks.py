import json,numpy as np
from scipy.optimize import linear_sum_assignment
from scipy.ndimage import gaussian_filter1d
D=json.load(open('w/dets.json')); CUTS=[0,241,723,964,1325]; NF=len(D)
# per face: [mx,my, mouthw, facew, faceh, angle]
def feat(d):
    x,y,w,h=d[:4]; re=np.array(d[4:6]); le=np.array(d[6:8]); rm=np.array(d[10:12]); lm=np.array(d[12:14])
    m=(rm+lm)/2; ang=np.degrees(np.arctan2(le[1]-re[1],le[0]-re[0]))
    nose=np.array(d[8:10]); ed=np.linalg.norm(le-re)
    # frontal: eyes well apart, nose between the eyes, mouth below nose, confident
    fr=float(d[14]>0.75 and ed>0.32*w and min(re[0],le[0])<nose[0]<max(re[0],le[0]) and m[1]>nose[1] and np.linalg.norm(lm-rm)>0.22*w)
    return [m[0],m[1],np.linalg.norm(lm-rm),w,h,ang,fr]
T=np.full((NF,5,7),np.nan)
for s,e in zip(CUTS,CUTS[1:]):
    # seed with first frame that has exactly 5 faces, ordered by x
    f0=next(i for i in range(s,e) if len(D[i])==5)
    prev=np.array(sorted([feat(d) for d in D[f0]],key=lambda r:r[0]))
    order=list(range(f0,e))+list(range(f0-1,s-1,-1))
    last={}
    for i in order:
        if i==f0-1: prev=np.array(sorted([feat(d) for d in D[f0]],key=lambda r:r[0]))
        F=np.array([feat(d) for d in D[i]]) if D[i] else np.zeros((0,7))
        if len(F):
            C=np.linalg.norm(prev[:,None,:2]-F[None,:,:2],axis=2)
            r,c=linear_sum_assignment(C)
            for a,b in zip(r,c):
                if len(F)>=5 or C[a,b]<prev[a,3]*1.2: T[i,a]=F[b]; prev[a]=F[b]
# fill gaps + smooth per shot
for s,e in zip(CUTS,CUTS[1:]):
    for k in range(5):
        for j in range(6):
            v=T[s:e,k,j]; ok=~np.isnan(v); idx=np.arange(len(v))
            v=np.interp(idx,idx[ok],v[ok]); T[s:e,k,j]=gaussian_filter1d(v,1.2 if j<2 else 3,mode='nearest')
        fv=np.nan_to_num(T[s:e,k,6],nan=0.0)
        # need 3 of 5 frames frontal; then soften to an alpha
        fv=(np.convolve(fv,np.ones(5)/5,'same')>=0.6).astype(float); T[s:e,k,6]=np.clip(gaussian_filter1d(fv,1.5)*1.6-0.3,0,1)
np.save('w/tracks.npy',T); print('missing before fill per shot ok'); print(np.round(np.nanmedian(T,axis=0),1))
