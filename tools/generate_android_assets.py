from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "frontend" / "resources" / "app-icon.png"
RES = ROOT / "frontend" / "android" / "app" / "src" / "main" / "res"

ICON_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

FOREGROUND_SIZES = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}


def square_icon(source: Image.Image, size: int) -> Image.Image:
    return source.resize((size, size), Image.Resampling.LANCZOS)


def round_icon(source: Image.Image, size: int) -> Image.Image:
    icon = square_icon(source, size)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    result = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    result.paste(icon, (0, 0), mask)
    return result


def write_launcher_icons(source: Image.Image) -> None:
    for folder, size in ICON_SIZES.items():
        target_dir = RES / folder
        target_dir.mkdir(parents=True, exist_ok=True)
        square_icon(source, size).save(target_dir / "ic_launcher.png")
        round_icon(source, size).save(target_dir / "ic_launcher_round.png")

    for folder, size in FOREGROUND_SIZES.items():
        target_dir = RES / folder
        target_dir.mkdir(parents=True, exist_ok=True)
        square_icon(source, size).save(target_dir / "ic_launcher_foreground.png")


def write_splash_images(source: Image.Image) -> None:
    for splash in RES.glob("drawable*/splash.png"):
        with Image.open(splash) as existing:
            canvas_size = existing.size
        canvas = Image.new("RGB", canvas_size, "#f7fbfc")
        icon_size = max(128, int(min(canvas_size) * 0.42))
        icon = square_icon(source, icon_size)
        position = ((canvas_size[0] - icon_size) // 2, (canvas_size[1] - icon_size) // 2)
        canvas.paste(icon, position)
        canvas.save(splash)


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"App icon source does not exist: {SOURCE}")
    with Image.open(SOURCE) as image:
        source = image.convert("RGBA")
    write_launcher_icons(source)
    write_splash_images(source)
    print(f"Generated Android launcher and splash assets from {SOURCE}")


if __name__ == "__main__":
    main()
