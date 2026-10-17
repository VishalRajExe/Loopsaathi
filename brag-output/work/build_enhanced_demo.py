from __future__ import annotations

import subprocess
from pathlib import Path


WORK = Path(__file__).resolve().parent
OUT = WORK.parent
FFMPEG = Path(r"D:\ytvideodown\ffmpeg.exe")
SUBTITLES = OUT / "loopsaathi-demo-subtitles.ass"
VOICEOVER = WORK / "voiceover.wav"
MUSIC = WORK / "simple-demo-music.wav"

SCENES = [
    ("simple-scene-00.png", 3, 1.00, 1.04),
    ("simple-scene-01.png", 4, 1.04, 1.00),
    ("simple-scene-02.png", 4, 1.00, 1.045),
    ("simple-scene-03.png", 5, 1.045, 1.015),
    ("simple-scene-04.png", 3, 1.00, 1.04),
    ("simple-scene-05.png", 5, 1.04, 1.00),
    ("simple-scene-06.png", 4, 1.00, 1.045),
]
FPS = 30
TOTAL_SECONDS = sum(duration for _, duration, _, _ in SCENES)


def ass_time(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    remainder = seconds % 60
    return f"{hours}:{minutes:02d}:{remainder:05.2f}"


def write_subtitles() -> None:
    cues = [
        (0.15, 2.85, "LoopSaathi helps every item\\Nfind a better next step."),
        (3.15, 6.85, "Start in the Waste Guide:\\Nidentify an item, then confirm its stream."),
        (7.15, 10.85, "Request a pickup with the item,\\Nweight, locality and time slot."),
        (11.15, 15.85, "Collectors move each request:\\Nrequested, accepted, collected, delivered."),
        (16.15, 18.85, "E-waste follows a separate route,\\Nwith demo destinations clearly marked."),
        (19.15, 23.85, "Impact keeps estimated,\\Ncollected and delivered weight distinct."),
        (24.15, 27.85, "Less waste lost, more resources\\Ndirected to the right next step."),
    ]
    lines = [
        "[Script Info]",
        "ScriptType: v4.00+",
        "PlayResX: 1920",
        "PlayResY: 1080",
        "WrapStyle: 2",
        "ScaledBorderAndShadow: yes",
        "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        "Style: Subtitle,Arial,38,&H00FFFFFF,&H00FFFFFF,&H002B3D35,&HCC173025,1,0,0,0,100,100,0,0,3,2,0,2,90,90,112,1",
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]
    lines.extend(
        f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Subtitle,,0,0,0,,{text}"
        for start, end, text in cues
    )
    SUBTITLES.write_text("\n".join(lines) + "\n", encoding="utf-8")


def render(destination: Path) -> None:
    command = [str(FFMPEG), "-y"]
    for filename, duration, _, _ in SCENES:
        command.extend(["-loop", "1", "-framerate", str(FPS), "-t", str(duration), "-i", str(WORK / filename)])
    command.extend(["-i", str(MUSIC), "-i", str(VOICEOVER)])

    labels = []
    filters = []
    for index, (_, _, start_zoom, end_zoom) in enumerate(SCENES):
        label = f"v{index}"
        labels.append(f"[{label}]")
        frames = int(round(SCENES[index][1] * FPS))
        zoom = f"{start_zoom}+({end_zoom - start_zoom})*on/{max(1, frames - 1)}"
        filters.append(
            f"[{index}:v]zoompan=z='{zoom}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
            f"d=1:s=1920x1080:fps={FPS},setsar=1,format=yuv420p[{label}]"
        )
    filters.append("".join(labels) + f"concat=n={len(SCENES)}:v=1:a=0[vbase]")
    subtitle_path = SUBTITLES.as_posix().replace(":", r"\:")
    filters.append(f"[vbase]subtitles='{subtitle_path}'[vout]")
    filters.append("[7:a]volume=0.12[music]")
    filters.append("[8:a]volume=1.35,afade=t=out:st=27.3:d=0.65[voice]")
    filters.append("[music][voice]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0[aout]")

    command.extend(
        [
            "-filter_complex",
            ";".join(filters),
            "-map",
            "[vout]",
            "-map",
            "[aout]",
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
            "48000",
            "-ac",
            "2",
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
    destination = OUT / "loopsaathi-hackathon-demo-enhanced.mp4"
    poster = OUT / "brag-enhanced.jpg"
    for filename, _, _, _ in SCENES:
        if not (WORK / filename).exists():
            raise FileNotFoundError(WORK / filename)
    if not VOICEOVER.exists():
        raise FileNotFoundError(VOICEOVER)
    if not MUSIC.exists():
        raise FileNotFoundError(MUSIC)
    write_subtitles()
    render(destination)
    create_poster(destination, poster)
    print(f"created {destination} ({TOTAL_SECONDS}s)")
    print(f"created {SUBTITLES}")
    print(f"created {poster}")


if __name__ == "__main__":
    main()
