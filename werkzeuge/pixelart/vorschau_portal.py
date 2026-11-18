"""Vorschaubilder für weitere Spiele im Maiskolbistan-Portal, im Stil von grafik/vorschau.png.

vorschaubilder/kolbenklicker.png        512 × 512   vorschaubilder/kolbenklicker_breit.png   1024 × 512
vorschaubilder/tower_defense.png        512 × 512   vorschaubilder/tower_defense_breit.png   1024 × 512

Gezeichnet in 128 × 128 bzw. 256 × 128 Pixeln und 4-fach ohne Glättung vergrößert.
Das Wichtigste liegt im mittleren Band, damit auch ein Zuschnitt auf 2:1 trägt.
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(__file__))
from px import Can, mix  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'vorschaubilder')


def verlauf(farben, t):
    t = max(0.0, min(0.9999, t))
    i = int(t * (len(farben) - 1))
    return mix(farben[i], farben[i + 1], t * (len(farben) - 1) - i)


def vignette(c):
    for y in range(c.h):
        for x in range(c.w):
            d = min(x, y, c.w - 1 - x, c.h - 1 - y)
            if d < 3:
                c.px(x, y, (0, 0, 0, 70 - d * 22))


def wolke(c, x, y, b, farbe, schatten):
    """Stufige Pixelwolke."""
    c.r(x, y + 4, b, 3, farbe)
    c.r(x + b // 6, y + 2, b * 2 // 3, 2, farbe)
    c.r(x + b // 3, y, b // 3, 2, farbe)
    c.r(x, y + 7, b, 1, schatten)


ZIFFERN = {
    '+': ['...', '.x.', 'xxx', '.x.', '...'],
    '1': ['.x', 'xx', '.x', '.x', '.x'],
    '5': ['xxx', 'x..', 'xx.', '..x', 'xx.'],
}


def schrift(c, x, y, text, farbe, rand):
    for ch in text:
        g = ZIFFERN[ch]
        for j, zeile in enumerate(g):
            for i, k in enumerate(zeile):
                if k == 'x':
                    for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                        c.px(x + i + dx, y + j + dy, rand)
        for j, zeile in enumerate(g):
            for i, k in enumerate(zeile):
                if k == 'x':
                    c.px(x + i, y + j, farbe)
        x += len(g[0]) + 1


# ---------------------------------------------------------------- Kolbenklicker
CURSOR = [
    'k.........',
    'kk........',
    'kwk.......',
    'kwwk......',
    'kwwwk.....',
    'kwwwwk....',
    'kwwwwwk...',
    'kwwwwwwk..',
    'kwwwwkkkk.',
    'kwkwwk....',
    'kk.kwwk...',
    'k..kwwk...',
    '....kwwk..',
    '....kkk...',
]


def cursor(c, x, y, spiegeln=False):
    c.grid(CURSOR, {'k': '#140a0c', 'w': '#fff7e0'}, x, y, flip=spiegeln)


def kolben(c, mx, oben, unten):
    """Maiskolben mit Körnern und Lieschblättern, Mitte mx, von oben bis unten."""
    h = unten - oben
    breite = 9
    # Schein hinter dem Kolben
    for y in range(oben - 14, unten + 8):
        for x in range(mx - 30, mx + 31):
            d = math.hypot((x - mx) / 1.15, (y - (oben + h * 0.45)) / 1.9)
            if d < 30:
                c.px(x, y, (255, 205, 90, int(70 * (1 - d / 30) ** 1.6)))
    # Körner
    for y in range(oben, unten):
        t = (y - oben) / h
        b = breite * math.sqrt(max(0.0, math.sin(math.pi * min(1, t * 1.08 + 0.04))))
        if t > 0.85:
            b *= 1 - (t - 0.85) * 4
        b = int(round(b))
        for x in range(mx - b, mx + b + 1):
            reihe = (y - oben) // 3
            spalte = (x - mx + 20 + (reihe % 2)) // 2
            fuge = (y - oben) % 3 == 2 or (x - mx + 20 + (reihe % 2)) % 2 == 1 and (y - oben) % 3 == 0
            if fuge:
                f = '#b8650c'
            else:
                f = '#ffd43a' if spalte % 3 else '#f4b11c'
            rel = (x - (mx - b)) / max(1, 2 * b)
            if rel < 0.22 and not fuge:
                f = '#fff09a'
            elif rel > 0.78:
                f = mix(f, '#9a4e08', 0.45)
            c.px(x, y, f)
        c.px(mx - b - 1, y, '#5a2a06')
        c.px(mx + b + 1, y, '#5a2a06')
    c.hline(mx - 3, oben - 1, 7, '#5a2a06')
    # Lieschblätter: liegen seitlich am Kolben, spitz nach oben, unten um den Stiel geschlossen
    def kante(y):
        t = (y - oben) / h
        b = breite * math.sqrt(max(0.0, math.sin(math.pi * min(1, t * 1.08 + 0.04))))
        if t > 0.85:
            b *= 1 - (t - 0.85) * 4
        return b
    for seite in (-1, 1):
        for (start, dicke, f1, f2, ab) in [(0.30, 7, '#2f8f3a', '#1d5e26', 2), (0.48, 5, '#4cb04d', '#2f8f3a', -1)]:
            y0 = int(oben + h * start)
            for y in range(y0, unten + 6):
                t = (y - y0) / (unten + 6 - y0)
                w = max(1, int(round(dicke * math.sin(math.pi * min(1.0, t * 0.75 + 0.08)))))
                k = kante(min(y, unten - 1))
                innen = int(k) + ab - (int((t - 0.7) * 30) if t > 0.7 else 0)
                innen = max(0, innen)
                for x in range(innen, innen + w):
                    c.px(mx + seite * x, y, f1 if x < innen + w - 1 else f2)
                c.px(mx + seite * (innen + w), y, '#0c2610')
            # Blattspitze
            c.px(mx + seite * (int(kante(y0)) + ab + 1), y0 - 1, f2)
            c.px(mx + seite * (int(kante(y0)) + ab + 2), y0 - 2, '#0c2610')
    # Stiel
    c.r(mx - 2, unten + 6, 5, 7, '#3c7d2c')
    c.r(mx - 2, unten + 13, 5, 1, '#0c2610')
    c.vline(mx + 2, unten + 6, 7, '#265e1c')


def kolbenklicker(W, H, seed=3):
    rnd = random.Random(seed)
    c = Can(W, H)
    mx = W // 2
    himmel = ['#1a0b1e', '#3b0f26', '#6e1a2a', '#a33326', '#d8642a', '#f2a03c']
    hor = 96
    for y in range(H):
        for x in range(W):
            f = verlauf(himmel, (y / hor) ** 1.2)
            if y % 4 == 3 and (x + y) % 2:
                f = verlauf(himmel, ((y + 1) / hor) ** 1.2)
            c.px(x, y, f)
    for _ in range(W // 7):
        c.px(rnd.randrange(W), rnd.randrange(0, 30), '#f7d8c8' if rnd.random() < 0.4 else '#a86a78')
    # Sonne tief am Horizont
    for y in range(-16, 1):
        for x in range(-16, 17):
            if x * x + y * y <= 256:
                c.px(mx + x, hor - 6 + y, '#ffcf5a' if x * x + y * y < 150 else '#f9a43e')
    # Wolken
    for (wx, wy, wb) in [(0.04, 20, 22), (0.72, 14, 26), (0.82, 44, 18), (0.12, 52, 16), (0.4, 8, 14)]:
        wolke(c, int(W * wx), wy, wb, '#c46a6a', '#8f3e4c')
    # Hügel
    for x in range(W):
        y0 = hor - 8 + int(5 * math.sin(x / 11) + 3 * math.sin(x / 5.3 + 2))
        for y in range(y0, H):
            c.px(x, y, '#3a1218' if y < y0 + 2 else '#2a0d13')
    # Maisfeld im Vordergrund
    for x in range(-2, W + 2, 3):
        hh = 16 + (x * 7) % 9
        for y in range(H - hh, H):
            c.px(x, y, '#170709')
            if y % 4 == 0:
                c.px(x + 1, y - 1, '#170709')
                c.px(x - 1, y - 2, '#170709')
        c.px(x, H - hh - 1, '#5a1e16')
        c.px(x, H - hh - 2, '#7a2c18')
    kolben(c, mx, 22, 84)
    # Cursor, die auf den Kolben zeigen
    cursor(c, mx + 14, 58)
    cursor(c, mx - 24, 62, spiegeln=True)
    cursor(c, mx + 18, 30)
    if W > H:
        cursor(c, mx + 46, 66)
        cursor(c, mx - 56, 40, spiegeln=True)
        cursor(c, mx - 40, 74, spiegeln=True)
    # Popcorn
    for (px_, py_) in [(-30, 30), (26, 46), (-22, 86), (30, 80), (-36, 70)] + ([(64, 30), (-70, 60), (80, 76), (-90, 26)] if W > H else []):
        x, y = mx + px_, py_
        for dx, dy in ((0, 0), (1, 0), (0, 1), (1, 1), (-1, 1), (2, 1), (0, 2), (1, 2)):
            c.px(x + dx, y + dy, '#fff8e8')
        c.px(x + 2, y + 2, '#e8c890')
        c.px(x - 1, y + 2, '#e8c890')
        c.px(x, y - 1, '#5a2a06')
    # „+1“ steigt auf
    schrift(c, mx + 20, 16, '+1', '#ffe066', '#5a1e06')
    schrift(c, mx - 30, 46, '+1', '#ffe066', '#5a1e06')
    if W > H:
        schrift(c, mx + 60, 48, '+5', '#ffe066', '#5a1e06')
    vignette(c)
    return c


# -------------------------------------------------------------- Tower Defense
def baum(c, x, y):
    c.r(x - 4, y + 5, 9, 2, (0, 0, 0, 60))
    c.r(x - 1, y + 2, 3, 4, '#6b3e1e')
    c.circle(x, y - 1, 5, '#215c27')
    c.circle(x - 1, y - 2, 4, '#2e7d32')
    c.circle(x - 2, y - 3, 2, '#4caf50')


def stein(c, x, y):
    c.r(x - 3, y + 1, 7, 1, (0, 0, 0, 60))
    c.r(x - 3, y - 2, 7, 3, '#8d939b')
    c.r(x - 2, y - 3, 5, 1, '#b8bec6')
    c.r(x - 2, y - 2, 2, 1, '#dfe3e8')
    c.hline(x - 3, y + 1, 7, '#565b62')


def turm(c, x, y, art):
    """Turm von oben schräg: Steinsockel, Aufsatz je nach Art."""
    c.r(x - 6, y + 6, 13, 3, (0, 0, 0, 70))
    c.r(x - 5, y - 2, 11, 9, '#7d7f8a')
    for j in range(0, 9, 3):
        c.hline(x - 5, y - 2 + j, 11, '#666874')
    c.vline(x, y + 1, 3, '#666874')
    c.r(x - 5, y - 3, 11, 1, '#a9abb5')
    c.r(x - 2, y + 3, 4, 4, '#2a1a2e')
    if art == 'bogen':
        c.r(x - 6, y - 7, 13, 4, '#8a5a2b')
        c.r(x - 5, y - 9, 11, 2, '#b07a3c')
        c.r(x - 4, y - 10, 9, 1, '#d6a25a')
        c.vline(x + 4, y - 15, 6, '#5a3a1a')
        c.r(x + 5, y - 15, 4, 3, '#d9473b')
    elif art == 'magie':
        c.r(x - 4, y - 6, 9, 3, '#4b2a6b')
        for j in range(7):
            w = 3 - abs(j - 3) // 1 if j < 4 else 6 - j
            c.hline(x - w, y - 13 + j, 2 * w + 1, '#a45cff' if j < 3 else '#7a3ad0')
        c.px(x - 1, y - 12, '#f0dcff')
        for k in range(6):
            a = k * math.pi / 3
            c.px(x + int(7 * math.cos(a)), y - 10 + int(4 * math.sin(a)), (200, 150, 255, 160))
    elif art == 'eis':
        c.r(x - 4, y - 6, 9, 3, '#2a4a6b')
        for j in range(8):
            w = (j + 1) // 2 if j < 4 else (8 - j) // 2
            c.hline(x - w, y - 14 + j, 2 * w + 1, '#7fd6ff' if j < 4 else '#3aa0e0')
        c.px(x, y - 13, '#ffffff')


def schleim(c, x, y, farbe, dunkel, gross=False):
    s = 2 if gross else 1
    c.r(x - 3 * s, y + 2 * s, 7 * s, s, (0, 0, 0, 70))
    for j in range(4 * s):
        w = [2, 3, 3, 3][min(3, j // s)] * s
        c.hline(x - w, y - 3 * s + j, 2 * w + 1, farbe)
    c.hline(x - 3 * s, y + s, 7 * s, dunkel)
    c.px(x - s, y - s, '#ffffff')
    c.px(x + s, y - s, '#ffffff')
    c.px(x - s, y - s + 1, '#101010') if not gross else c.r(x - 2, y - 1, 2, 2, '#101010')
    c.px(x + s, y - s + 1, '#101010') if not gross else c.r(x + 2, y - 1, 2, 2, '#101010')
    c.px(x - 2 * s, y - 2 * s, mix(farbe, '#ffffff', 0.5))
    # Lebensbalken
    b = 7 * s
    c.r(x - b // 2, y - 4 * s - 3, b, 2, '#2a0a10')
    c.r(x - b // 2, y - 4 * s - 3, int(b * (0.5 if gross else 0.8)), 2, '#e04848')


def herz(c, x, y):
    c.grid(['.x.x.', 'xxxxx', 'xxxxx', '.xxx.', '..x..'], {'x': '#ff5a6a'}, x, y)
    c.px(x + 1, y + 1, '#ffc0c8')


def muenze(c, x, y):
    c.circle(x + 2, y + 2, 2, '#ffcc33')
    c.px(x + 1, y + 1, '#fff2a0')


def kristall(c, x, y):
    c.grid(['..x..', '.xxx.', 'xxxxx', '.xxx.', '..x..'], {'x': '#4fc3ff'}, x, y)
    c.px(x + 2, y + 1, '#e0f6ff')


def tower_defense(W, H, seed=11):
    rnd = random.Random(seed)
    c = Can(W, H)
    # Wiese
    for y in range(H):
        for x in range(W):
            n = (x * 37 + y * 91 + (x * y) % 13) % 23
            c.px(x, y, '#4a9a46' if n == 0 else '#3f8b3e' if n < 3 else '#428f40')
    for _ in range(W * H // 110):
        c.px(rnd.randrange(W), rnd.randrange(H), rnd.choice(['#f4e06a', '#ffffff', '#5fb35a', '#357a35']))
    # Weg (Mittellinie als Punktfolge), 12 px breit mit Rand
    if W > H:
        punkte = [(-10, 34), (46, 34), (46, 96), (110, 96), (110, 50), (170, 50), (170, 92), (224, 92), (224, 30), (W + 10, 30)]
    else:
        punkte = [(-10, 34), (34, 34), (34, 96), (78, 96), (78, 52), (W + 10, 52)]
    weg = set()
    for (a, b) in zip(punkte, punkte[1:]):
        (x0, y0), (x1, y1) = a, b
        for x in range(min(x0, x1) - 6, max(x0, x1) + 7):
            for y in range(min(y0, y1) - 6, max(y0, y1) + 7):
                weg.add((x, y))
    for (x, y) in weg:
        if 0 <= x < W and 0 <= y < H:
            rand = any((x + dx, y + dy) not in weg for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            f = '#7a5630' if rand else ('#d2ad74' if (x * 7 + y * 3) % 11 else '#c19a62')
            c.px(x, y, f)
    for _ in range(W // 3):
        x, y = rnd.randrange(W), rnd.randrange(H)
        if (x, y) in weg and (x + 1, y) in weg and (x, y + 1) in weg:
            c.px(x, y, '#a88454')

    def frei(x, y, r=8):
        return all((x + dx, y + dy) not in weg for dx in range(-r, r + 1, 2) for dy in range(-r, r + 1, 2))

    # Bäume und Steine abseits des Weges
    for _ in range(60):
        x, y = rnd.randrange(6, W - 6), rnd.randrange(14, H - 8)
        if frei(x, y, 9):
            (baum if rnd.random() < 0.7 else stein)(c, x, y)
    # Türme
    if W > H:
        tuerme = [(64, 70, 'bogen'), (88, 112, 'magie'), (138, 74, 'eis'), (196, 70, 'bogen'), (200, 112, 'magie')]
    else:
        tuerme = [(54, 70, 'bogen'), (100, 78, 'magie'), (60, 116, 'eis')]
    for (x, y, art) in tuerme:
        c.r(x - 8, y - 4, 17, 15, (0, 0, 0, 0))
        turm(c, x, y, art)
    # Gegner auf dem Weg
    if W > H:
        gegner = [(20, 34, 'g'), (46, 58, 'g'), (46, 84, 'r'), (82, 96, 'g'), (110, 66, 'b'), (150, 50, 'r'), (170, 76, 'g')]
    else:
        gegner = [(14, 34, 'g'), (34, 58, 'r'), (34, 84, 'g'), (60, 96, 'b'), (78, 70, 'g'), (104, 52, 'r')]
    farben = {'g': ('#6bd35a', '#3a8a2e'), 'r': ('#f06a5a', '#a8342a'), 'b': ('#b07ae8', '#6a3aa8')}
    for (x, y, k) in gegner:
        schleim(c, x, y, *farben[k], gross=(k == 'b'))
    # Geschosse: Pfeil vom Bogenturm, Magiekugel, Eissplitter
    bx, by, _ = tuerme[0]
    zx, zy = (46, 84) if W > H else (34, 58)
    for t in range(4, 14):
        f = t / 18
        c.px(int(bx + (zx - bx) * f), int(by - 9 + (zy - by + 9) * f), '#f4e4c0' if t < 12 else '#c0c0c0')
    mx_, my_, _ = tuerme[1]
    zx, zy = (110, 70) if W > H else (78, 74)
    for t in range(3):
        f = 0.55 + t * 0.08
        c.circle(int(mx_ + (zx - mx_) * f), int(my_ - 10 + (zy - my_ + 10) * f), 2 - t // 2, ('#d8b0ff', '#b070ff', '#8a40f0')[t])
    ex, ey, _ = tuerme[2]
    zx, zy = (150, 54) if W > H else (60, 98)
    for t in range(5):
        f = 0.4 + t * 0.1
        c.px(int(ex + (zx - ex) * f), int(ey - 10 + (zy - ey + 10) * f), '#bfefff')
    # Leiste oben wie im Spiel: Leben, Gold, Kristalle
    c.r(0, 0, W, 11, (24, 18, 48, 235))
    c.hline(0, 11, W, '#6a4ab0')
    herz(c, 4, 3)
    muenze(c, 22, 3)
    kristall(c, 40, 3)
    for i in range(3):
        c.r(11 + i * 3, 5, 2, 3, '#ff8a96')
        c.r(29 + i * 3, 5, 2, 3, '#ffd75a')
    c.r(47, 5, 2, 3, '#8fd8ff')
    vignette(c)
    return c


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    kolbenklicker(128, 128).save(os.path.join(OUT, 'kolbenklicker.png'), 4)
    kolbenklicker(256, 128).save(os.path.join(OUT, 'kolbenklicker_breit.png'), 4)
    tower_defense(128, 128).save(os.path.join(OUT, 'tower_defense.png'), 4)
    tower_defense(256, 128).save(os.path.join(OUT, 'tower_defense_breit.png'), 4)
    print('4 Bilder in vorschaubilder/')
