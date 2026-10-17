# LoopSaathi demo video

## Deliverables

- `loopsaathi-hackathon-demo.mp4` — 28-second, 1920×1080, 30 fps H.264/AAC video.
- `loopsaathi-hackathon-demo-enhanced.mp4` — enhanced 28-second version with offline voiceover, subtle zoom-in/zoom-out motion, and burned-in subtitles.
- `brag.jpg` — poster frame from the opening scene.
- `brag-enhanced.jpg` — poster frame from the enhanced version.
- `storyboard.md` — scene timing and source notes.
- `share-copy.txt` — short post caption.
- `narration.txt` — exact condensed voiceover script used in the enhanced version.
- `loopsaathi-demo-subtitles.ass` — editable subtitle cues/style used for the enhanced version.
- `work/` — generated scene plates, render script and local audio intermediate.

## Content note

The final video is a polished screenshot overview assembled from the supplied LoopSaathi screenshots. It is intentionally not presented as a live click recording. The application’s visible `Demo data` and `UNVERIFIED` labels remain in the frames, and no real-world collection or recycling outcome is claimed.

The enhanced version uses the local Windows SAPI voice `Microsoft Zira`, a quiet original ambient bed, restrained center zooms (roughly 0–4.5%), and subtitles positioned above the existing footer. No network service, paid voice API, or application source change was used.

## Rebuild

From `D:\Loopsathi`, run:

```powershell
& 'D:\Loopsathi\app\ai-service\.venv\Scripts\python.exe' 'D:\Loopsathi\brag-output\work\build_simple_visuals.py'
& 'D:\Loopsathi\app\ai-service\.venv\Scripts\python.exe' 'D:\Loopsathi\brag-output\work\build_simple_demo.py'
& 'D:\Loopsathi\app\ai-service\.venv\Scripts\python.exe' 'D:\Loopsathi\brag-output\work\build_enhanced_demo.py'
```

The scripts use the local FFmpeg binaries supplied at `D:\ytvideodown\ffmpeg.exe` and do not modify LoopSaathi application source.
