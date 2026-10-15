# YuNet faces per frame -> per-shot tracks (5 singers) with mouth corners; smoothed, gaps filled.
import cv2,numpy as np,json
cap=cv2.VideoCapture('w/vid.mp4'); W,H=1280,720
det=cv2.FaceDetectorYN.create('models/yunet.onnx','',(W,H),0.6,0.3,50)
D=[]
while True:
    ok,img=cap.read()
    if not ok: break
    _,f=det.detect(img); D.append([] if f is None else f[:,:15].tolist())
json.dump(D,open('w/dets.json','w'))
cnt=[len(d) for d in D]; print('frames',len(D),'faces/frame hist',np.bincount(cnt))
