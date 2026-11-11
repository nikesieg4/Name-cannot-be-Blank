"""Kleine Pixel-Zeichenbibliothek auf numpy-RGBA."""
import numpy as np
from PIL import Image
import math


def hx(c):
    if isinstance(c, tuple):
        return c
    c = c.lstrip('#')
    if len(c) in (3, 4):
        c = ''.join(ch * 2 for ch in c)
    a = 255
    if len(c) == 8:
        a = int(c[6:8], 16)
    return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), a)


def dark(c, f):
    r, g, b, a = hx(c)
    return (int(r * f), int(g * f), int(b * f), a)


def mix(a, b, t):
    a, b = hx(a), hx(b)
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(4))


class Can:
    def __init__(self, w, h, bg=None):
        self.w, self.h = w, h
        self.a = np.zeros((h, w, 4), dtype=np.float32)
        if bg:
            self.a[:, :] = hx(bg)

    def px(self, x, y, c):
        x, y = int(x), int(y)
        if 0 <= x < self.w and 0 <= y < self.h:
            c = hx(c)
            if c[3] == 255:
                self.a[y, x] = c
            else:
                t = c[3] / 255
                d = self.a[y, x]
                na = t + d[3] / 255 * (1 - t)
                if na <= 0:
                    return
                rgb = (np.array(c[:3]) * t + d[:3] * (d[3] / 255) * (1 - t)) / na
                self.a[y, x] = (*rgb, na * 255)

    def r(self, x, y, w, h, c):
        x, y, w, h = int(x), int(y), int(w), int(h)
        x0, y0, x1, y1 = max(0, x), max(0, y), min(self.w, x + w), min(self.h, y + h)
        if x1 <= x0 or y1 <= y0:
            return
        c = hx(c)
        if c[3] == 255:
            self.a[y0:y1, x0:x1] = c
        else:
            t = c[3] / 255
            d = self.a[y0:y1, x0:x1]
            da = d[..., 3:4] / 255
            na = t + da * (1 - t)
            rgb = (np.array(c[:3]) * t + d[..., :3] * da * (1 - t)) / np.maximum(na, 1e-6)
            d[..., :3] = rgb
            d[..., 3:4] = na * 255

    def dither(self, x, y, w, h, c, phase=0):
        for j in range(h):
            for i in range((j + x + y + phase) % 2, w, 2):
                self.px(x + i, y + j, c)

    def hline(self, x, y, w, c):
        self.r(x, y, w, 1, c)

    def vline(self, x, y, h, c):
        self.r(x, y, 1, h, c)

    def circle(self, cx, cy, rad, c, ring=None):
        for y in range(-rad, rad + 1):
            for x in range(-rad, rad + 1):
                d = math.hypot(x, y)
                if d <= rad + 0.3 and (ring is None or d > rad - ring):
                    self.px(cx + x, cy + y, c)

    def grid(self, rows, pal, ox, oy, flip=False):
        for y, row in enumerate(rows):
            for x, k in enumerate(row):
                if k != '.' and k in pal and pal[k] is not None:
                    xx = (len(row) - 1 - x) if flip else x
                    self.px(ox + xx, oy + y, pal[k])

    def paste(self, other, ox, oy):
        for y in range(other.h):
            for x in range(other.w):
                c = other.a[y, x]
                if c[3] > 0:
                    self.px(ox + x, oy + y, tuple(int(v) for v in c))

    def img(self, scale=1):
        im = Image.fromarray(np.clip(self.a, 0, 255).astype(np.uint8), 'RGBA')
        if scale != 1:
            im = im.resize((self.w * scale, self.h * scale), Image.NEAREST)
        return im

    def save(self, path, scale=1):
        self.img(scale).save(path, optimize=True)
