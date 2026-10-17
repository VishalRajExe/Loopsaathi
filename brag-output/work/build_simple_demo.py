from __future__ import annotations

import math
import struct
import subprocess
import wave
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
WORK = Path(__file__).resolve().parent
OUT = WORK.parent
FFMPEG = Path(r"D:\ytvideodown\ffmpeg.exe")

SCENES = [
    ("simple-scene-00.png", 3),
    ("simple-scene-01.png", 4),
    ("simple-scene-02.png", 4),
    ("simple-scene-03.png", 5),
    ("simple-scene-04.png", 3),
    ("simple-scene-05.png", 5),
    ("simple-scene-06.png", 4),
]
FPS = 30
SAMPLE_RATE = 48_000
TOTAL_SECONDS = sum(duration for _, duration in SCENES)


def write_music(destination: Path) -> None:
    """Create a quiet, original ambient bed without external assets or services."""
    chords = [
        (196.00, 246.94, 293.66),  # G
        (164.81, 207.65, 246.94),  # E minor
        (174.61, 220.00, 261.63),  # F-ish lift
        (146.83, 196.00, 246.94),  # D
    ]
    frames = int(TOTAL_SECONDS * SAMPLE_RATE)
    fade_frames = int(1.4 * SAMPLE_RATE)
    with wave.open(str(destination), "wb") as audio:
        audio.setnchannels(2)
        audio.setsampwidth(2)
        audio.setframerate(SAMPLE_RATE)
        for index in range(frames):
            time = index / SAMPLE_RATE
            chord = chords[min(len(chords) - 1, int(time / 7))]
            pulse = 0.5 + 0.5 * math.sin(2 * math.pi * 0.22 * time)
            value = 0.0
            for tone_index, frequency in enumerate(chord):
                value += math.sin(2 * math.pi * frequency * time) * (0.012 / (tone_index + 1))
                value += math.sin(2 * math.pi * (frequency / 2) * time) * 0.006
            value += math.sin(2 * math.pi * 98 * time) * 0.004 * pulse
            envelope = min(1.0, index / fade_frames, (frames - index) / fade_frames)
            sample = max(-1.0, min(1.0, value * envelope))
            packed = struct.pack("<hh", int(sample * 32767), int(sample * 32767))
            audio.writeframesraw(packed)


def render_video(audio_path: Path, destination: Path) -> None:
    command = [str(FFMPEG), "-y"]
    for filename, duration in SCENES:
        command.extend(["-loop", "1", "-t", str(duration), "-i", str(WORK / filename)])
    command.extend(["-i", str(audio_path)])

    video_labels = []
    filters = []
    for index, (_, _) in enumerate(SCENES):
        label = f"v{index}"
        video_labels.append(f"[{label}]")
        filters.append(
            f"[{index}:v]fps={FPS},scale=1920:1080:force_original_aspect_ratio=decrease,"
            f"pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=#FAFAF7,format=yuv420p,setsar=1[{label}]"
        )
    filters.append("".join(video_labels) + f"concat=n={len(SCENES)}:v=1:a=0[vout]")
    filter_graph = ";".join(filters)
    command.extend(
        [
            "-filter_complex",
            filter_graph,
            "-map",
            "[vout]",
            "-map",
            f"{len(SCENES)}:a",
            "-r",
            str(FPS),
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "19",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "160k",
            "-ar",
            str(SAMPLE_RATE),
            "-t",
            str(TOTAL_SECONDS),
            "-movflags",
            "+faststart",
            str(destination),
        ]
    )
    subprocess.run(command, check=True)


def create_poster(video_path: Path, destination: Path) -> None:
    subprocess.run(
        [
            str(FFMPEG),
            "-y",
            "-ss",
            "1.0",
            "-i",
            str(video_path),
            "-frames:v",
            "1",
            "-q:v",
            "2",
            str(destination),
        ],
        check=True,
    )


def main() -> None:
    output_video = OUT / "loopsaathi-hackathon-demo.mp4"
    music = WORK / "simple-demo-music.wav"
    poster = OUT / "brag.jpg"
    for filename, _ in SCENES:
        path = WORK / filename
        if not path.exists():
            raise FileNotFoundError(path)
    write_music(music)
    render_video(music, output_video)
    create_poster(output_video, poster)
    print(f"created {output_video} ({TOTAL_SECONDS}s)")
    print(f"created {poster}")


if __name__ == "__main__":
    main()
