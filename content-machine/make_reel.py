#!/usr/bin/env python3
"""Zeferino's content machine: render a 9:16 Reel or Story from a JSON spec.

Usage: python3 make_reel.py spec.json
Run from the repository root (paths in the spec are relative to it).
Spec:
{
  "out": "out/2026-11-13-reel.mp4",
  "kind": "reel" | "story",
  "seed": 7,                                  # changes the original music
  "scenes": [
    {"media": "images/fort-myers-crown-01-before-tray-ceiling.jpg", "dur": 3.2,
     "tag": "BEFORE", "caption": "This tray ceiling looked *unfinished*."},
    {"media": "videos/clip.mp4", "start": 2.0, "dur": 3.0, "speed": 2.0,
     "tag": "INSTALL", "caption": "We fit every corner *by hand*."}
  ],
  "cta": {"title": "FREE ESTIMATE", "lines": ["zeferinosusa.com", "239-324-1224"]}
}
Words wrapped in *asterisks* are shown in gold italic. No narration is used:
captions carry the message so the video works with sound off.
"""
import json, math, os, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 1080, 1920, 30
GOLD = (212, 170, 70); CREAM = (245, 240, 230); BG = (16, 15, 14)
CARD = (60, 230, 1020, 1430)  # x0,y0,x1,y1 of the media card

def font(name, size):
    for p in [os.path.join(HERE, '..', 'fonts', name), '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf']:
        try: return ImageFont.truetype(p, size)
        except Exception: pass
    return ImageFont.load_default()

def sysfont(cands, size, fallback):
    import glob
    for c in cands:
        for p in glob.glob('/usr/share/fonts/**/' + c, recursive=True):
            try: return ImageFont.truetype(p, size)
            except Exception: pass
    return font(fallback, size)

CAP = sysfont(['Inter-ExtraBold.ttf', 'InterDisplay-ExtraBold.ttf', 'Inter-Bold.ttf'], 74, 'inter-500.woff')
HIL = font('pagella-italic.woff', 88)
SMALL = sysfont(['Inter-Medium.ttf'], 30, 'inter-500.woff')
TAG = sysfont(['Inter-Bold.ttf', 'Inter-SemiBold.ttf'], 34, 'inter-500.woff')
SERIF = font('pagella-regular.woff', 92)
SERIF_S = font('pagella-regular.woff', 56)

ease = lambda t: 1 - (1 - max(0.0, min(1.0, t))) ** 3
LOGO = Image.open(os.path.join(HERE, 'assets', 'logo_stacked_transparent.png')).convert('RGBA')

def base_bg():
    y, x = np.mgrid[0:H, 0:W]
    glow = np.exp(-(((x - W / 2) / 700) ** 2 + ((y - 1700) / 500) ** 2)) * 26
    a = np.zeros((H, W, 3)); a[..., 0] = BG[0] + glow; a[..., 1] = BG[1] + glow * .55; a[..., 2] = BG[2] + glow * .25
    return Image.fromarray(np.clip(a, 0, 255).astype('uint8')).convert('RGBA')
BGIMG = base_bg()

def cover(im, w, h, zoom=1.0, cx=.5, cy=.5):
    s = max(w / im.width, h / im.height) * zoom
    r = im.resize((max(w, int(im.width * s)), max(h, int(im.height * s))), Image.LANCZOS)
    x = int((r.width - w) * cx); y = int((r.height - h) * cy)
    return r.crop((x, y, x + w, y + h))

def load_video_frames(path, start, dur, speed, w, h):
    n = int(round(dur * FPS))
    cmd = ['ffmpeg', '-loglevel', 'error', '-ss', str(start), '-i', path, '-t', str(dur * speed + .2),
           '-vf', f'setpts=PTS/{speed},fps={FPS},scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}',
           '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)
    if len(fr) == 0: raise SystemExit('no frames from ' + path)
    return [Image.fromarray(fr[min(i, len(fr) - 1)]) for i in range(n)]

def parse_words(cap):
    out = []
    for w in cap.split():
        hl = w.startswith('*') or w.endswith('*') or w.endswith('*,') or w.endswith('*.')
        out.append((w.replace('*', ''), hl))
    return out

def layout_caption(words, d):
    lines, cur, cw = [], [], 0; maxw = W - 140
    for w, hl in words:
        f = HIL if hl else CAP; ww = d.textlength(w + ' ', font=f)
        if cur and cw + ww > maxw: lines.append(cur); cur, cw = [], 0
        cur.append((w, hl, ww)); cw += ww
    if cur: lines.append(cur)
    return lines

def draw_caption(fr, cap, t, dur):
    d = ImageDraw.Draw(fr); words = parse_words(cap); lines = layout_caption(words, d)
    per = min(.22, max(.08, (dur * .55) / max(1, len(words))))
    y = 1500 if len(lines) <= 2 else 1470; k = 0
    for ln in lines:
        tw = sum(w for _, _, w in ln); x = (W - tw) / 2
        for w, hl, ww in ln:
            a = ease((t - .15 - k * per) / .18); k += 1
            if a > 0:
                f = HIL if hl else CAP; c = GOLD if hl else CREAM
                dy = 18 * (1 - a) + (-10 if hl else 0)
                col = tuple(int(v * a + BG[i] * (1 - a)) for i, v in enumerate(c))
                d.text((x, y + dy), w, font=f, fill=col)
            x += ww
        y += 100

def header(fr, kind):
    d = ImageDraw.Draw(fr)
    d.text((70, 150), '@zeferinosprecisionfinish', font=SMALL, fill=GOLD)
    s = 'FINISH CARPENTRY  ·  SWFL'; d.text((W - 70 - d.textlength(s, font=SMALL), 150), s, font=SMALL, fill=(150, 140, 125))

def card(fr, media, t, dur, sc, idx):
    x0, y0, x1, y1 = CARD; w, h = x1 - x0, y1 - y0
    if isinstance(media, list): im = media[min(int(t * FPS), len(media) - 1)]
    else:
        p = t / dur; zoom = 1.04 + .10 * (p if idx % 2 == 0 else 1 - p)
        im = cover(media, w, h, zoom, .5 + .04 * math.sin(idx), .45)
    im = im.convert('RGBA')
    mask = Image.new('L', (w, h), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], 28, fill=255)
    shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(shadow).rounded_rectangle([x0, y0 + 18, x1, y1 + 18], 28, fill=(0, 0, 0, 150))
    fr.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(24)))
    fr.paste(im, (x0, y0), mask)
    d = ImageDraw.Draw(fr); d.rounded_rectangle([x0, y0, x1, y1], 28, outline=GOLD, width=3)
    if sc.get('tag'):
        tw = d.textlength(sc['tag'], font=TAG)
        d.rounded_rectangle([x0 + 30, y0 + 30, x0 + 70 + tw, y0 + 92], 12, fill=(14, 13, 12, 215))
        d.text((x0 + 50, y0 + 40), sc['tag'], font=TAG, fill=GOLD)
    z = LOGO.resize((150, int(LOGO.height * 150 / LOGO.width)))
    a = z.split()[3].point(lambda v: int(v * .85)); z.putalpha(a)
    fr.alpha_composite(z, (x1 - 180, y1 - z.height - 30))

def progress(fr, gt, total):
    d = ImageDraw.Draw(fr); y = 1860
    d.rounded_rectangle([70, y, W - 70, y + 8], 4, fill=(50, 46, 42))
    d.rounded_rectangle([70, y, 70 + int((W - 140) * min(1, gt / total)), y + 8], 4, fill=GOLD)

def cta_frame(fr, t, cta, kind):
    e = ease(t / .7)
    lw = 760; lg = LOGO.resize((lw, int(LOGO.height * lw / LOGO.width)))
    lg.putalpha(lg.split()[3].point(lambda v: int(v * e)))
    fr.alpha_composite(lg, ((W - lw) // 2, int(300 + 30 * (1 - e))))
    d = ImageDraw.Draw(fr); y = 860
    items = [(cta.get('title', 'FREE ESTIMATE'), SERIF, GOLD)] + [(s, SERIF_S, CREAM) for s in cta.get('lines', [])]
    for i, (s, f, c) in enumerate(items):
        a = ease((t - .4 - .25 * i) / .5)
        if a > 0:
            col = tuple(int(v * a + BG[j] * (1 - a)) for j, v in enumerate(c))
            d.text(((W - d.textlength(s, font=f)) / 2, y + 20 * (1 - a)), s, font=f, fill=col)
        y += 130 if i == 0 else 90
    if kind == 'story':
        a = ease((t - 1.2) / .5)
        if a > 0:
            s = cta.get('tap', 'LINK IN BIO'); c = tuple(int(v * a) for v in GOLD)
            d.text(((W - d.textlength(s, font=TAG)) / 2, 1500), s, font=TAG, fill=c)
            x = W // 2; yy = 1560 + int(10 * math.sin(t * 5)); d.polygon([(x - 26, yy), (x + 26, yy), (x, yy + 32)], fill=c)

def music(path, dur, seed):
    rng = np.random.default_rng(seed); SR = 48000; t = np.arange(int(SR * dur)) / SR; out = np.zeros_like(t)
    bpm = [88, 92, 96, 100][seed % 4]; beat = 60 / bpm; bar = 4 * beat
    progs = [([57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]), ([48, 52, 55], [55, 59, 62], [57, 60, 64], [53, 57, 60]),
             ([50, 53, 57], [55, 59, 62], [48, 52, 55], [57, 60, 64]), ([53, 57, 60], [48, 52, 55], [55, 59, 62], [57, 60, 64])]
    prog = progs[seed % 4]
    def note(f, st, d_, amp, kind):
        i0 = int(st * SR); n = min(int(d_ * SR), len(t) - i0)
        if n <= 0: return
        tt = np.arange(n) / SR
        if kind == 'pad':
            w = sum(np.sin(2 * np.pi * f * h * tt) / h ** 1.6 for h in (1, 2, 3, 4)) + .5 * np.sin(2 * np.pi * f * 1.003 * tt)
            env = np.minimum(1, tt / .6) * np.minimum(1, (d_ - tt) / .8)
        elif kind == 'pluck':
            w = sum(np.sin(2 * np.pi * f * h * tt) / h ** 1.2 for h in (1, 2, 3, 5)); env = np.exp(-tt * 5.5) * np.minimum(1, tt / .005)
        else:
            w = np.sin(2 * np.pi * f * tt) + .3 * np.sin(4 * np.pi * f * tt); env = np.minimum(1, tt / .02) * np.exp(-tt * 1.4)
        out[i0:i0 + n] += amp * w * env
    A = lambda m: 440 * 2 ** ((m - 69) / 12)
    for b in range(int(dur / bar) + 1):
        ch = prog[b % 4]; st = b * bar
        for m in ch: note(A(m), st, bar + .3, .05, 'pad')
        note(A(ch[0] - 24 if ch[0] > 52 else ch[0] - 12), st, bar, .22, 'bass')
        if b >= 1:
            arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12]
            for k in range(8): note(A(arp[(k + seed) % 4]), st + k * beat / 2, .5, .055, 'pluck')
    for k in range(int(dur / beat)):
        st = k * beat
        if st < bar: continue
        i0 = int(st * SR); n = int(.25 * SR)
        if i0 + n > len(t): break
        tt = np.arange(n) / SR
        if k % 2 == 0: out[i0:i0 + n] += .35 * np.sin(2 * np.pi * (50 + 90 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 9)
        else: out[i0:i0 + n] += rng.standard_normal(n) * np.exp(-tt * 18) * .08 + np.sin(2 * np.pi * 190 * tt) * np.exp(-tt * 20) * .1
        for hh in (0, .5):
            j0 = int((st + hh * beat) * SR); m = int(.06 * SR)
            if j0 + m < len(t): out[j0:j0 + m] += np.diff(rng.standard_normal(m), prepend=0) * np.exp(-np.arange(m) / SR * 60) * .035
    out *= np.clip((dur - t) / 2.5, 0, 1) * np.clip(t / .8, 0, 1)
    out = np.tanh(out * 1.4); out /= np.abs(out).max() * 1.12
    data = (np.stack([out, np.roll(out, int(.012 * SR)) * .9 + out * .1], 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())

def main(spec_path):
    spec = json.load(open(spec_path)); kind = spec.get('kind', 'reel'); scenes = spec['scenes']
    cta = spec.get('cta', {'title': 'FREE ESTIMATE', 'lines': ['zeferinosusa.com', '239-324-1224']})
    cta_dur = 4.5 if kind == 'reel' else 5.0
    cw, ch = CARD[2] - CARD[0], CARD[3] - CARD[1]
    medias = []
    for sc in scenes:
        m = sc['media']
        if m.lower().endswith(('.mp4', '.mov', '.m4v')):
            medias.append(load_video_frames(m, sc.get('start', 0), sc['dur'], sc.get('speed', 1.0), cw, ch))
        else:
            medias.append(Image.open(m).convert('RGB'))
    total = sum(s['dur'] for s in scenes) + cta_dur
    out = spec['out']; os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    silent = out + '.video.mp4'
    p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                          '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', silent], stdin=subprocess.PIPE)
    gt = 0.0
    for idx, (sc, media) in enumerate(zip(scenes, medias)):
        n = int(round(sc['dur'] * FPS))
        for i in range(n):
            t = i / FPS; fr = BGIMG.copy(); header(fr, kind); card(fr, media, t, sc['dur'], sc, idx)
            if sc.get('caption'): draw_caption(fr, sc['caption'], t, sc['dur'])
            progress(fr, gt + t, total)
            if t < .2 and idx > 0:  # quick fade between scenes
                fr = Image.blend(prev, fr, t / .2)
            p.stdin.write(fr.convert('RGB').tobytes()); last = fr
        prev = last; gt += sc['dur']
    for i in range(int(cta_dur * FPS)):
        t = i / FPS; fr = BGIMG.copy(); cta_frame(fr, t, cta, kind)
        if t < .3: fr = Image.blend(prev, fr, t / .3)
        p.stdin.write(fr.convert('RGB').tobytes())
    p.stdin.close(); p.wait()
    wav = out + '.wav'; music(wav, total, int(spec.get('seed', 1)))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', silent, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
                    '-shortest', '-movflags', '+faststart', out], check=True)
    os.remove(silent); os.remove(wav)
    print(out, round(total, 2), 's')

if __name__ == '__main__':
    main(sys.argv[1])
