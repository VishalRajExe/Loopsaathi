# LoopSaathi demo video

## Deliverables

- `loopsaathi-hackathon-demo.mp4` — 28-second, 1920×1080, 30 fps H.264/AAC video.
- `brag.jpg` — poster frame from the opening scene.
- `storyboard.md` — scene timing and source notes.
- `share-copy.txt` — short post caption.
- `work/` — generated scene plates, render script and local audio intermediate.

## Content note

The final video is a polished screenshot overview assembled from the supplied LoopSaathi screenshots. It is intentionally not presented as a live click recording. The application’s visible `Demo data` and `UNVERIFIED` labels remain in the frames, and no real-world collection or recycling outcome is claimed.

## Rebuild

From `D:\Loopsathi`, run:

```powershell
& 'D:\Loopsathi\app\ai-service\.venv\Scripts\python.exe' 'D:\Loopsathi\brag-output\work\build_simple_visuals.py'
& 'D:\Loopsathi\app\ai-service\.venv\Scripts\python.exe' 'D:\Loopsathi\brag-output\work\build_simple_demo.py'
```

The scripts use the local FFmpeg binaries supplied at `D:\ytvideodown\ffmpeg.exe` and do not modify LoopSaathi application source.
