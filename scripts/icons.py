"""Renders the PNG icons from the same rising-bars mark as the apps.

    python3 scripts/icons.py      (needs Pillow)
"""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "src" / "public"
BG = (11, 17, 32, 255)
BARS = [(0.235, 0.62, "#BAE6FD"), (0.355, 0.50, "#7DD3FC"),
        (0.475, 0.34, "#38BDF8"), (0.595, 0.44, "#0EA5E9"), (0.715, 0.62, "#BAE6FD")]


def render(size: int, rounded: bool = True) -> Image.Image:
    scale = 4  # supersample for smooth edges
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=s * 0.22, fill=BG)
    else:
        d.rectangle([0, 0, s, s], fill=BG)
    width, bottom = s * 0.075, s * 0.74
    for x, top, colour in BARS:
        left = s * x
        d.rounded_rectangle([left, s * top, left + width, bottom], radius=width * 0.42, fill=colour)
    return img.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    render(32).save(OUT / "favicon-32.png")
    render(180, rounded=False).save(OUT / "apple-touch-icon.png")  # iOS rounds it itself
    render(192).save(OUT / "icon-192.png")
    render(512).save(OUT / "icon-512.png")
    print("icons written to", OUT)
