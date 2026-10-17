from __future__ import annotations

from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[2]
WORK = Path(__file__).resolve().parent
SCREENSHOTS = ROOT / "video-input" / "screenshorts"

W, H = 1920, 1080
BG = "#FAFAF7"
GREEN = "#1F6B4A"
GREEN_DARK = "#18563D"
DARK = "#1C2420"
MUTED = "#5F6B64"
PALE = "#E4F1EA"
PALE_2 = "#F1F7F3"
LINE = "#D9E2DD"
FOOTER = "Screenshot overview · Local prototype · Demo data"


def font_path(bold: bool = False) -> Path | None:
    candidates = [
        Path(r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf"),
        Path(r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf"),
    ]
    return next((path for path in candidates if path.exists()), None)


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    path = font_path(bold)
    if path is not None:
        return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def text_width(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> int:
    box = draw.textbbox((0, 0), text, font=font)
    return box[2] - box[0]


def wrap_line(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_width: int) -> list[str]:
    words = text.split()
    if not words:
        return [""]
    lines: list[str] = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        if text_width(draw, candidate, font) <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def wrapped_lines(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_width: int) -> list[str]:
    lines: list[str] = []
    for part in text.split("\n"):
        lines.extend(wrap_line(draw, part, font, max_width))
    return lines


def draw_text_block(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    font: ImageFont.ImageFont,
    fill: str,
    max_width: int,
    spacing: int,
) -> int:
    lines = wrapped_lines(draw, text, font, max_width)
    draw.multiline_text(xy, "\n".join(lines), font=font, fill=fill, spacing=spacing)
    line_height = font.getbbox("Ag")[3] - font.getbbox("Ag")[1]
    return len(lines) * line_height + max(0, len(lines) - 1) * spacing


def fit_heading(draw: ImageDraw.ImageDraw, text: str, max_width: int, start_size: int = 64) -> tuple[ImageFont.ImageFont, list[str], int]:
    for size in range(start_size, 43, -1):
        font = load_font(size, bold=True)
        lines = wrapped_lines(draw, text, font, max_width)
        if all(text_width(draw, line, font) <= max_width for line in lines):
            line_height = font.getbbox("Ag")[3] - font.getbbox("Ag")[1]
            height = len(lines) * line_height + (len(lines) - 1) * 5
            return font, lines, height
    font = load_font(42, bold=True)
    lines = wrapped_lines(draw, text, font, max_width)
    line_height = font.getbbox("Ag")[3] - font.getbbox("Ag")[1]
    return font, lines, len(lines) * line_height + (len(lines) - 1) * 5


def draw_left_copy(
    canvas: Image.Image,
    eyebrow: str,
    heading: str,
    body: str,
    body_y: int | None = None,
) -> None:
    draw = ImageDraw.Draw(canvas)
    left, max_width = 100, 500
    eyebrow_font = load_font(20, bold=True)
    draw.text((left, 172), eyebrow, font=eyebrow_font, fill=GREEN, spacing=2)
    heading_font, heading_lines, heading_height = fit_heading(draw, heading, max_width)
    heading_y = 250
    draw.multiline_text((left, heading_y), "\n".join(heading_lines), font=heading_font, fill=DARK, spacing=5)
    if body:
        body_font = load_font(28)
        y = body_y if body_y is not None else heading_y + heading_height + 44
        draw_text_block(draw, (left, y), body, body_font, MUTED, max_width, 8)


def draw_footer(canvas: Image.Image) -> None:
    draw = ImageDraw.Draw(canvas)
    draw.line((100, 988, 1820, 988), fill=LINE, width=2)
    footer_font = load_font(22)
    draw.rounded_rectangle((100, 1005, 112, 1017), radius=6, fill=GREEN)
    draw.text((132, 1001), FOOTER, font=footer_font, fill=MUTED)


def add_screenshot(canvas: Image.Image, path: Path, crop: tuple[int, int, int, int] | None = None) -> None:
    image = Image.open(path).convert("RGB")
    if crop is not None:
        image = image.crop(crop)

    x, y, width, height = 680, 74, 1160, 870
    target_ratio = width / height
    source_ratio = image.width / image.height
    if source_ratio > target_ratio:
        crop_width = int(image.height * target_ratio)
        left = (image.width - crop_width) // 2
        image = image.crop((left, 0, left + crop_width, image.height))
    elif source_ratio < target_ratio:
        crop_height = int(image.width / target_ratio)
        image = image.crop((0, 0, image.width, crop_height))
    image = image.resize((width, height), Image.Resampling.LANCZOS)

    shadow = Image.new("RGBA", (width + 36, height + 36), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle((14, 14, width + 20, height + 20), radius=28, fill=(20, 42, 31, 42))
    shadow = shadow.filter(ImageFilter.GaussianBlur(15))
    canvas.paste(shadow, (x - 8, y - 2), shadow)

    mask = Image.new("L", (width, height), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width - 1, height - 1), radius=25, fill=255)
    canvas.paste(image, (x, y), mask)
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((x, y, x + width - 1, y + height - 1), radius=25, outline=LINE, width=2)


def draw_loop_emblem(canvas: Image.Image, center: tuple[int, int], diameter: int, stroke: int) -> None:
    draw = ImageDraw.Draw(canvas)
    cx, cy = center
    radius = diameter // 2
    draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=PALE)
    inset = int(diameter * 0.24)
    box = (cx - radius + inset, cy - radius + inset, cx + radius - inset, cy + radius - inset)
    draw.arc(box, 205, 350, fill="#75A88F", width=stroke)
    draw.arc(box, 25, 170, fill="#75A88F", width=stroke)
    arrow = max(10, stroke + 3)
    # These arrow corners mirror the loop emblem in Artwork.jsx.
    right_x, top_y = cx + radius - inset - 2, cy - radius + inset + 2
    draw.line((right_x, top_y, right_x, top_y + arrow * 2), fill="#75A88F", width=stroke, joint="curve")
    draw.line((right_x, top_y, right_x - arrow * 2, top_y), fill="#75A88F", width=stroke, joint="curve")
    left_x, bottom_y = cx - radius + inset + 2, cy + radius - inset - 2
    draw.line((left_x, bottom_y, left_x, bottom_y - arrow * 2), fill="#75A88F", width=stroke, joint="curve")
    draw.line((left_x, bottom_y, left_x + arrow * 2, bottom_y), fill="#75A88F", width=stroke, joint="curve")
    dot = max(8, diameter // 11)
    draw.ellipse((cx - dot, cy - dot, cx + dot, cy + dot), fill="#B2D9C0")


def draw_scene_06(canvas: Image.Image) -> None:
    draw = ImageDraw.Draw(canvas)
    draw_loop_emblem(canvas, (1450, 455), 440, 12)
    # A few restrained construction lines keep the closing plate tied to the app geometry.
    draw.line((1130, 455, 1275, 455), fill=LINE, width=3)
    draw.line((1625, 455, 1770, 455), fill=LINE, width=3)
    draw.ellipse((1108, 443, 1130, 465), fill=GREEN)
    draw.ellipse((1770, 443, 1792, 465), fill=GREEN)

    eyebrow_font = load_font(20, bold=True)
    draw.text((100, 172), "LOOPSAATHI", font=eyebrow_font, fill=GREEN)
    emblem_box = (100, 233, 170, 290)
    draw.rounded_rectangle(emblem_box, radius=15, fill=GREEN)
    # Small wordmark emblem, using the same loop construction as Artwork.jsx.
    draw.arc((113, 245, 157, 279), 205, 350, fill="white", width=4)
    draw.arc((113, 245, 157, 279), 25, 170, fill="white", width=4)
    draw.line((157, 245, 157, 257), fill="white", width=4)
    draw.line((157, 245, 145, 245), fill="white", width=4)
    draw.line((113, 279, 113, 267), fill="white", width=4)
    draw.line((113, 279, 125, 279), fill="white", width=4)
    draw.ellipse((132, 255, 140, 263), fill="#B2D9C0")
    wordmark_font = load_font(52, bold=True)
    draw.text((190, 228), "Loop", font=wordmark_font, fill=DARK)
    loop_width = text_width(draw, "Loop", wordmark_font)
    draw.text((190 + loop_width, 228), "Saathi", font=wordmark_font, fill=GREEN)

    heading_font, heading_lines, _ = fit_heading(draw, "Every item deserves\nthe right next step.", 560, 64)
    draw.multiline_text((100, 390), "\n".join(heading_lines), font=heading_font, fill=DARK, spacing=6)
    url_font = load_font(28)
    draw.text((100, 700), "github.com/VishalRajExe/Loopsaathi", font=url_font, fill=GREEN_DARK)
    draw.line((100, 755, 535, 755), fill=LINE, width=2)


def make_base() -> Image.Image:
    return Image.new("RGB", (W, H), BG)


def build() -> None:
    scenes: Iterable[tuple[str, str, str, str, tuple[int, int, int, int] | None]] = [
        (
            "simple-scene-00.png",
            "LOOPSAATHI · LOCAL DEMO",
            "Every item.\nA next step.",
            "Identify it. Request pickup. See where it goes.",
            None,
        ),
        (
            "simple-scene-01.png",
            "01 · GUIDE",
            "Identify.\nThen confirm.",
            "Photo suggestions need your confirmation.",
            None,
        ),
        (
            "simple-scene-02.png",
            "02 · REQUEST",
            "Request a\npickup.",
            "Choose a stream, estimate, locality and time.",
            None,
        ),
        (
            "simple-scene-03.png",
            "03 · COLLECTOR",
            "Track the\nhandoff.",
            "Requested → Accepted → Collected → Delivered",
            (0, 270, 540, 603),
        ),
        (
            "simple-scene-04.png",
            "04 · E-WASTE",
            "Electronics.\nA separate route.",
            "Demo destinations are unverified.",
            None,
        ),
        (
            "simple-scene-05.png",
            "05 · IMPACT",
            "Estimates ≠\nconfirmed kg.",
            "Requested, collected and delivered stay distinct.",
            None,
        ),
    ]

    sources = {
        "simple-scene-00.png": "Screenshot 2026-10-11 172858.png",
        "simple-scene-01.png": "Screenshot 2026-10-11 172913.png",
        "simple-scene-02.png": "Screenshot 2026-10-11 172927.png",
        "simple-scene-03.png": "Screenshot 2026-10-11 172936.png",
        "simple-scene-04.png": "Screenshot 2026-10-11 172945.png",
        "simple-scene-05.png": "Screenshot 2026-10-11 172950.png",
    }

    for filename, eyebrow, heading, body, crop in scenes:
        canvas = make_base()
        draw_left_copy(canvas, eyebrow, heading, body)
        add_screenshot(canvas, SCREENSHOTS / sources[filename], crop)
        draw_footer(canvas)
        output = WORK / filename
        canvas.save(output, format="PNG", optimize=True)
        print(f"created {output} :: {canvas.size} RGB")

    closing = make_base()
    draw_scene_06(closing)
    draw_footer(closing)
    closing_output = WORK / "simple-scene-06.png"
    closing.save(closing_output, format="PNG", optimize=True)
    print(f"created {closing_output} :: {closing.size} RGB")


if __name__ == "__main__":
    build()
