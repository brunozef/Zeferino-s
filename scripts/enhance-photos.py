#!/usr/bin/env python3
"""Clean up job-site photos for the portfolio and add the original Zeferino's logo.

Usage:
    python3 scripts/enhance-photos.py OUT_DIR PREFIX photo1.jpg photo2.jpg ...
    (optional) --blur "N:x0,y0,x1,y1"  blurs a box on photo N (1-based), e.g. a house number

What it does to each photo (nothing is added or removed from the scene):
  - fixes the rotation stored by the phone
  - straightens leaning walls and door frames, then crops to an editorial 4:5 frame
  - neutral, slightly warm white balance (white walls come out clean white)
  - levels, local clarity, soft matte S-curve, subtle vignette, denoise and sharpening
  - resizes to 2000 px on the long side
  - places the stacked Zeferino's logo (transparent background, soft shadow) in the bottom-left corner
Saves OUT_DIR/PREFIX-01.jpg, -02.jpg ... in the order given.
"""
import os, sys
import numpy as np, cv2
from PIL import Image, ImageOps, ImageDraw, ImageFilter, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO = os.path.join(ROOT, 'images', 'logo-stacked-full.png')
LONG = 2000

def straighten(im, strength=0.85):
    """Make walls and door frames vertical (fixes the leaning look of phone wide-angle shots).
    Finds near-vertical edges, measures how they converge, and corrects it with a keystone warp."""
    a = np.asarray(im); H, W = a.shape[:2]
    g = cv2.Canny(cv2.cvtColor(a, cv2.COLOR_RGB2GRAY), 40, 120)
    segs = cv2.HoughLinesP(g, 1, np.pi / 720, 80, minLineLength=int(H * .12), maxLineGap=12)
    if segs is None: return im
    bot, top, wts = [], [], []
    for x1, y1, x2, y2 in segs.reshape(-1, 4).astype(float):
        if abs(y2 - y1) < 1 or abs(x2 - x1) / abs(y2 - y1) > .30: continue   # keep lines within ~17 deg of vertical
        k = (x2 - x1) / (y2 - y1)
        bot.append(x1 + k * (H - y1) - W / 2); top.append(x1 + k * (0 - y1) - W / 2); wts.append(np.hypot(x2 - x1, y2 - y1))
    if len(bot) < 4: return im
    bot, top, wts = map(np.array, (bot, top, wts))
    A = np.stack([bot, np.ones_like(bot)], 1) * wts[:, None]
    (kk, c), *_ = np.linalg.lstsq(A, top * wts, rcond=None)   # x_top = kk * x_bot + c
    kk = 1 + float(np.clip(kk - 1, -.18, .18)) * strength; c = float(np.clip(c, -W * .08, W * .08)) * strength
    src = np.float32([[W / 2 + kk * (-W / 2) + c, 0], [W / 2 + kk * (W / 2) + c, 0], [W, H], [0, H]])
    dst = np.float32([[0, 0], [W, 0], [W, H], [0, H]])
    M = cv2.getPerspectiveTransform(src, dst)
    out = cv2.warpPerspective(a, M, (W, H), flags=cv2.INTER_CUBIC, borderValue=(0, 0, 0))
    mask = cv2.warpPerspective(np.full((H, W), 255, np.uint8), M, (W, H), flags=cv2.INTER_NEAREST)
    x0, y0, x1, y1 = 0, 0, W, H                                   # shrink until no empty corner remains
    while mask[y0:y1, x0:x1].min() == 0 and x1 - x0 > W * .6:
        dx, dy = max(1, W // 200), max(1, H // 200); x0 += dx; x1 -= dx; y0 += dy; y1 -= dy
    return Image.fromarray(out[y0:y1, x0:x1])

def frame(im, ratio=4 / 5):
    """Editorial 4:5 crop; most of the cut comes off the bottom (bare floor), a little off the ceiling."""
    W, H = im.size
    if W / H < ratio:
        nh = int(W / ratio); cut = H - nh; return im.crop((0, int(cut * .3), W, int(cut * .3) + nh))
    nw = int(H * ratio); return im.crop(((W - nw) // 2, 0, (W - nw) // 2 + nw, H))

def enhance(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    lum = a.mean(axis=2)
    bright = a[lum > np.percentile(lum, 70)]
    a = a * np.clip(bright.mean() / bright.mean(axis=0), 0.88, 1.15)   # neutral whites
    a *= np.array([1.025, 1.0, 0.965])                                # warm, gallery-white tone
    lo, hi = np.percentile(a.mean(axis=2), [0.3, 99.5])
    a = np.clip((a - lo) * (247.0 / max(hi - lo, 1)), 0, 255).astype(np.uint8)
    a = cv2.fastNlMeansDenoisingColored(a, None, 3, 3, 7, 21)
    lab = cv2.cvtColor(a, cv2.COLOR_RGB2LAB)                          # clarity: local contrast on light only
    L = lab[..., 0]; Lc = cv2.createCLAHE(clipLimit=1.2, tileGridSize=(4, 4)).apply(L)
    lab[..., 0] = cv2.addWeighted(L, .75, Lc, .25, 0)
    a = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB).astype(np.float32) / 255
    a = np.where(a < .5, .5 * (2 * a) ** 1.12, 1 - .5 * (2 - 2 * a) ** 1.12)   # soft S-curve
    a = 10 / 255 + a * (1 - 14 / 255)                                         # lifted, matte blacks
    H, W = a.shape[:2]; y, x = np.ogrid[:H, :W]
    a *= (1 - .10 * (((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2) / 2)[..., None]   # subtle vignette
    a = a * 255 + np.random.default_rng(7).normal(0, 1.6, (H, W, 1))   # fine grain hides banding on flat walls
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    im = ImageEnhance.Color(im).enhance(1.04)
    return im.filter(ImageFilter.UnsharpMask(radius=1.4, percent=80, threshold=5))

def add_logo(im):
    W, H = im.size
    logo = Image.open(LOGO).convert('RGBA')
    lw = int(W * 0.21); lh = int(logo.height * lw / logo.width)
    logo = logo.resize((lw, lh), Image.LANCZOS)
    m = int(W * 0.04)
    # bottom-left, transparent background (the site puts its own small watermark bottom-right).
    # A soft shadow keeps the gold readable on white walls without a visible box.
    x0, y0 = m, H - m - lh
    alpha = logo.split()[3]
    shadow = Image.new('RGBA', logo.size, (0, 0, 0, 0)); shadow.putalpha(alpha.point(lambda v: v * 0.55))
    big = Image.new('RGBA', im.size, (0, 0, 0, 0)); big.alpha_composite(shadow, (x0 + 2, y0 + 3))
    big = big.filter(ImageFilter.GaussianBlur(max(2, lw // 90)))
    out = Image.alpha_composite(im.convert('RGBA'), big)
    out.alpha_composite(logo, (x0, y0))
    return out.convert('RGB')

def main():
    args = sys.argv[1:]; blurs = {}
    while '--blur' in args:
        i = args.index('--blur'); n, box = args[i + 1].split(':')
        blurs.setdefault(int(n), []).append(tuple(int(v) for v in box.split(',')))
        del args[i:i + 2]
    out_dir, prefix, files = args[0], args[1], args[2:]
    os.makedirs(out_dir, exist_ok=True)
    for n, f in enumerate(files, 1):
        im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
        for box in blurs.get(n, []):
            im.paste(im.crop(box).filter(ImageFilter.GaussianBlur(14)), box[:2])
        im = frame(straighten(im))
        s = LONG / max(im.size)
        if s < 1: im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        out = os.path.join(out_dir, f'{prefix}-{n:02d}.jpg')
        add_logo(enhance(im)).save(out, quality=90, optimize=True, progressive=True)
        print(out)

if __name__ == '__main__':
    main()
