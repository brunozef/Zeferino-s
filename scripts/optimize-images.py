#!/usr/bin/env python3
"""
Creates fast-loading WebP copies of every project photo.

    python3 scripts/optimize-images.py

For each photo in images/ (and the video posters in videos/) it writes two
files into opt/, keeping the same folder structure:

    images/x/photo.jpg  ->  opt/images/x/photo-800.webp   (cards, phones)
                            opt/images/x/photo-1600.webp  (full screen, zoom)

The originals are never changed. Run this again after adding photos, then
commit the opt/ folder together with the new photos.
Needs Pillow:  pip install pillow
"""
import pathlib
import sys

from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "opt"
WIDTHS = (800, 1600)
QUALITY = 80
SKIP_PREFIXES = ("logo-", "wm-", "og-")  # brand files, already optimized


def sources():
    for folder in ("images", "videos"):
        for path in sorted((ROOT / folder).rglob("*")):
            if path.suffix.lower() not in (".jpg", ".jpeg", ".png"):
                continue
            if path.name.startswith(SKIP_PREFIXES):
                continue
            yield path


def main():
    made = skipped = 0
    total_bytes = 0
    for src in sources():
        rel = src.relative_to(ROOT)
        base = OUT / rel.with_suffix("")
        base.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(src) as raw:
            img = ImageOps.exif_transpose(raw).convert("RGB")
        for width in WIDTHS:
            target = min(width, img.width)  # never upscale small originals
            dst = base.parent / f"{base.name}-{width}.webp"
            if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
                skipped += 1
                total_bytes += dst.stat().st_size
                continue
            height = round(img.height * target / img.width)
            resized = img if target == img.width else img.resize((target, height), Image.LANCZOS)
            resized.save(dst, "WEBP", quality=QUALITY, method=6)
            made += 1
            total_bytes += dst.stat().st_size
    print(f"written: {made}, already up to date: {skipped}, total {total_bytes / 1e6:.1f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
