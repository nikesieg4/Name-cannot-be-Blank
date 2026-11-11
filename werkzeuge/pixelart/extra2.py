"""Seekarte, Karten-Symbole, Inventar-Gegenstaende, Skill-Symbole, Horch-Wasserfall."""
import math, random
from px import Can, hx, dark, mix
from pal import P

K = P['kontur']

LAND = [
    [[0, 0], [24, 0], [30, 40], [22, 80], [32, 120], [26, 150], [40, 175], [30, 200], [0, 200]],
    [[120, 80], [140, 70], [158, 82], [150, 104], [128, 108]],
    [[140, 0], [220, 0], [214, 18], [190, 26], [160, 22]],
    [[300, 0], [300, 200], [262, 200], [270, 160], [258, 120], [272, 80], [262, 40], [276, 0]],
]


def im_poly(x, y, poly):
    inside = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]; xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-9) + xi:
            inside = not inside
        j = i
    return inside


def im_land(kx, ky):
    return any(im_poly(kx, ky, p) for p in LAND)


def seekarte(beispiel=False):
    KF = 2
    W, H = 300 * KF, 200 * KF
    land = [[0] * W for _ in range(H)]
    for y in range(H):
        for x in range(W):
            kx, ky = (x + .5) / KF, (y + .5) / KF
            nx = math.sin(ky * .9 + kx * .13) * .7 + math.sin(ky * .31 - kx * .27) * 1.1
            ny = math.sin(kx * .8 - ky * .11) * .7 + math.sin(kx * .29 + ky * .23) * 1.1
            land[y][x] = 1 if im_land(kx + nx, ky + ny) else 0
    # Abstand zur Kueste (grob, fuer Flachwasser)
    dist = [[99] * W for _ in range(H)]
    from collections import deque
    q = deque()
    for y in range(H):
        for x in range(W):
            if land[y][x]:
                dist[y][x] = 0; q.append((x, y))
    while q:
        x, y = q.popleft()
        d = dist[y][x]
        if d >= 30:
            continue
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            X, Y = x + dx, y + dy
            if 0 <= X < W and 0 <= Y < H and dist[Y][X] > d + 1:
                dist[Y][X] = d + 1; q.append((X, Y))
    c = Can(W, H)
    rnd = random.Random(4)
    for y in range(H):
        for x in range(W):
            d = dist[y][x]
            if d == 0:
                # Land: oliv mit Hoehenrauschen, hellere Kueste
                n = math.sin(x * .07) * math.cos(y * .09) + math.sin((x + y) * .03)
                col = '#4a4a34' if n > .4 else '#3d3f2c' if n > -.4 else '#34362a'
                nb = any(not land[min(H - 1, max(0, y + dy))][min(W - 1, max(0, x + dx))]
                         for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
                if nb:
                    col = '#8a8460'
                c.a[y, x] = hx(col)
            elif d <= 2:
                c.a[y, x] = hx('#4e8c94')
            elif d <= 8:
                c.a[y, x] = hx('#2b5f72' if (d > 5 and (x + y) % 2) else '#336c7c' if d <= 5 else '#2b5f72')
            elif d <= 18:
                c.a[y, x] = hx('#1d4660' if (d > 14 and (x + y) % 2 == 0) else '#22506a' if d <= 14 else '#1d4660')
            else:
                c.a[y, x] = hx('#163a54' if (x // 3 + y // 3) % 7 else '#183d58')
    # Hoheitsgewaesser Vardanien: rote Schraffur bis 24 km vor der Ostkueste
    for y in range(H):
        for x in range(W):
            if not land[y][x] and x > 200 * KF:
                kx = x / KF
                # Abstand zur Ostkueste grob
                ok = any(im_land(kx + k, y / KF) for k in range(0, 26, 3))
                if ok and (x - y) % 8 < 1:
                    c.px(x, y, '#c8392b88')
    # Grenzlinie
    for y in range(H):
        for x in range(200 * KF, W - 1):
            if not land[y][x]:
                kx = x / KF
                a = any(im_land(kx + k, y / KF) for k in range(0, 26, 3))
                b = any(im_land(kx - .5 + k, y / KF) for k in range(0, 26, 3))
                if a and not b and y % 6 < 4:
                    c.px(x, y, '#e8503c')
    # Planquadrate (30 km)
    for k in range(1, 10):
        for y in range(0, H, 2):
            c.px(k * 60, y, '#9cc4d833')
    for k in range(1, 7):
        for x in range(0, W, 2):
            c.px(x, k * 60, '#9cc4d833')
    if beispiel:
        # Sicht- und Horchkreis ums eigene Boot
        bx, by = 90 * KF, 140 * KF
        for a in range(0, 720):
            w = a * math.pi / 360
            if a % 4 < 2:
                c.px(round(bx + math.cos(w) * 40), round(by + math.sin(w) * 40), '#efd086aa')
            if a % 8 < 3:
                c.px(round(bx + math.cos(w) * 76), round(by + math.sin(w) * 76), '#4fc77c99')
        # Kurslinie
        tx, ty = 200 * KF, 104 * KF
        n = int(math.hypot(tx - bx, ty - by))
        for i in range(0, n, 6):
            for j in range(3):
                t = (i + j) / n
                c.px(round(bx + (tx - bx) * t), round(by + (ty - by) * t), '#efd086')
        c.circle(tx, ty, 4, '#efd086', ring=1)
        # Auftragsziel G4 (Planquadrat hervorheben)
        for x in range(180 * KF, 210 * KF):
            for y in (90 * KF, 120 * KF - 1):
                if x % 4 < 2:
                    c.px(x, y, '#efd086')
        for y in range(90 * KF, 120 * KF):
            for x in (180 * KF, 210 * KF - 1):
                if y % 4 < 2:
                    c.px(x, y, '#efd086')
        # Kontakte
        for (sx, sy, nm) in ((90, 140, 'boot'), (214, 104, 'frachter'), (238, 128, 'zerstoerer'), (148, 150, 'haendler'),
                             (112, 62, 'unbekannt'), (38, 162, 'basis'), (182, 31, 'hafen')):
            c.paste(kartensymbol(nm), sx * KF - 6, sy * KF - 6)
        # Spur des Frachters
        for i in range(6):
            c.r(214 * KF + 10 + i * 6, 104 * KF - 2 + i * 1, 2, 2, '#e8503c66')
    return c


KS = {
    'boot': (['............', '.....kk.....', '.....kGk....', '..kkkkGGkk..', '.kGGGGGGGGk.', 'kGgGGGGGGGGk',
              '.kGGGGGGGGk.', '..kkkkkkkk..', '............'], {'G': '#4fc77c', 'g': '#b8ffd0'}),
    'frachter': (['.....kk.....', '....kRRk....', '...kRrRRk...', '..kRRRRRRk..', '.kRRRRRRRRk.', 'kRRRRRRRRRRk',
                  '.kRRRRRRRRk.', '..kRRRRRRk..', '...kRRRRk...', '....kRRk....', '.....kk.....'],
                 {'R': '#c8392b', 'r': '#ff8a6a'}),
    'zerstoerer': (['.....kk.....', '.....kRk....', '....kRRk....', '....kRrRk...', '...kRRRRk...', '...kRRRRRk..',
                    '..kRRRRRRk..', '..kRRRRRRRk.', '.kRRRRRRRRk.', '.kkkkkkkkkkk'], {'R': '#c8392b', 'r': '#ff8a6a'}),
    'haendler': (['....kkkk....', '..kkYYYYkk..', '.kYYyYYYYYk.', '.kYyYYYYYYk.', 'kYYYYYYYYYYk', 'kYYYYYYYYYYk',
                  'kYYYYYYYYYYk', '.kYYYYYYYYk.', '.kYYYYYYYYk.', '..kkYYYYkk..', '....kkkk....'],
                 {'Y': '#c29a45', 'y': '#efd086'}),
    'unbekannt': (['....kkkk....', '...kWWWWk...', '..kWkkkkWk..', '..kkk..kWk..', '.....kkWk...', '....kWWk....',
                   '....kWk.....', '....kkk.....', '....kWk.....', '....kkk.....'], {'W': '#c9d6dc'}),
    'basis': (['....kkkk....', '...kWWWWk...', '...kWkkWk...', '...kWWWWk...', 'kkkkkWWkkkkk', 'kWWWWWWWWWWk',
               'kkkkkWWkkkkk', 'kWk..WW..kWk', 'kWWk.WW.kWWk', '.kWWWWWWWWk.', '..kkWWWWkk..', '....kkkk....'],
              {'W': '#4fc77c'}),
    'hafen': (['....kkkk....', '...kWWWWk...', '...kWkkWk...', '...kWWWWk...', 'kkkkkWWkkkkk', 'kWWWWWWWWWWk',
               'kkkkkWWkkkkk', 'kWk..WW..kWk', 'kWWk.WW.kWWk', '.kWWWWWWWWk.', '..kkWWWWkk..', '....kkkk....'],
              {'W': '#efd086'}),
    'ziel': (['.....kk.....', '.....YY.....', '..kkkYYkkk..', '..kY....Yk..', '..k......k..', 'kYY..kk..YYk',
              'kYY..kk..YYk', '..k......k..', '..kY....Yk..', '..kkkYYkkk..', '.....YY.....', '.....kk.....'],
             {'Y': '#efd086'}),
}


def kartensymbol(n):
    rows, pal = KS[n]
    pal = dict(pal); pal['k'] = K
    c = Can(12, 12)
    c.grid(rows, pal, 0, (12 - len(rows)) // 2)
    return c


# ---------------- Inventar-Gegenstaende (24 x 24, Torpedo 48 x 24) ----------------
def item(name):
    if name == 'torpedo':
        c = Can(48, 24)
        y = 8
        c.r(6, y, 36, 9, '#59675e'); c.r(6, y, 36, 2, '#8a9a8e'); c.r(6, y + 7, 36, 2, '#33403a')
        c.r(42, y + 1, 2, 7, '#59675e'); c.r(44, y + 2, 1, 5, '#59675e'); c.r(45, y + 3, 1, 3, '#59675e')
        c.r(38, y, 1, 9, '#2c3530'); c.r(14, y, 1, 9, '#2c3530')
        c.r(9, y + 2, 4, 5, P['messing']); c.r(9, y + 2, 4, 1, P['messingGlanz'])
        c.r(1, y - 2, 5, 13, '#3a4540'); c.r(1, y - 2, 5, 1, '#5a6a60'); c.r(3, y + 3, 3, 3, P['messingHell'])
        for yy in range(y - 3, y + 12):
            for xx in range(0, 47):
                if c.a[yy, xx, 3] > 0 and (c.a[yy - 1, xx, 3] == 0 or c.a[yy + 1, xx, 3] == 0 or c.a[yy, xx - 1, 3] == 0 or c.a[yy, xx + 1, 3] == 0):
                    pass
        c.r(20, y + 3, 14, 1, '#c8392b')
        return outline(c)
    c = Can(24, 24)
    if name == 'diesel':
        c.r(5, 5, 14, 17, '#7a2a1e'); c.r(5, 5, 3, 17, '#a83a2a'); c.r(16, 5, 3, 17, '#5a1f16')
        c.r(7, 2, 8, 3, '#5a1f16'); c.r(8, 3, 6, 1, K)  # Griff
        c.r(15, 1, 4, 4, P['metall']); c.r(15, 1, 4, 1, P['metallHell'])
        c.r(7, 9, 10, 1, '#5a1f16'); c.r(7, 17, 10, 1, '#5a1f16')
        for k in range(4):
            c.px(8 + k * 2, 11 + k, '#5a1f16'); c.px(8 + k * 2 + 1, 11 + k, '#5a1f16')
        c.r(9, 12, 6, 3, P['messingHell'])
    elif name == 'proviant':
        c.r(2, 7, 20, 15, P['holz']); c.r(2, 7, 20, 2, P['holzHell'])
        c.r(2, 13, 20, 1, P['holzDunkel']); c.r(2, 18, 20, 1, P['holzDunkel'])
        c.r(2, 7, 1, 15, P['holzDunkel']); c.r(21, 7, 1, 15, P['holzDunkel'])
        c.r(8, 10, 8, 4, '#d9cfae'); c.r(9, 11, 6, 1, '#7a6c55')
        c.r(5, 3, 6, 4, '#a8743e'); c.r(5, 3, 6, 1, '#d8a868')  # Brot oben
        c.r(13, 2, 3, 6, '#8a3f24'); c.px(14, 2, '#b4583a')  # Wurst
    elif name == 'konserven':
        for i, (x, y) in enumerate(((3, 9), (12, 9), (7, 2))):
            c.r(x, y, 9, 12, P['metall']); c.r(x, y, 9, 1, P['metallGlanz']); c.r(x, y + 11, 9, 1, P['metallDunkel'])
            c.r(x, y + 3, 9, 6, ['#3c5c46', '#8a3f24', '#2f4a6a'][i]); c.r(x + 2, y + 5, 5, 2, P['weiss'])
            c.r(x, y, 1, 12, P['metallHell'])
    elif name == 'ersatzteile':
        # Zahnrad
        cx, cy = 9, 13
        for a in range(8):
            w = a * math.pi / 4
            c.r(round(cx + math.cos(w) * 7) - 1, round(cy + math.sin(w) * 7) - 1, 3, 3, P['metallHell'])
        c.circle(cx, cy, 6, P['metallHell']); c.circle(cx, cy, 6, P['metall'], ring=1); c.circle(cx, cy, 2, K)
        # Schraubenschluessel
        for k in range(12):
            c.r(11 + k, 21 - k, 2, 2, P['messingHell'])
        c.r(20, 4, 4, 4, P['messingHell']); c.r(21, 4, 2, 2, (0, 0, 0, 0))
        c.a[4:6, 21:23] = 0
    elif name == 'batterie':
        c.r(3, 6, 18, 16, '#2c3135'); c.r(3, 6, 18, 2, '#4a5156')
        c.r(6, 3, 3, 3, P['metallHell']); c.r(15, 3, 3, 3, P['kupferHell'])
        c.r(6, 11, 12, 6, P['sonar1']); c.r(6, 11, 9, 6, P['sonar4']); c.r(6, 11, 9, 1, P['sonar5'])
        c.r(5, 19, 4, 1, P['rotHell']); c.r(15, 19, 4, 1, P['metallHell'])
    elif name == 'druckluft':
        c.r(7, 6, 10, 17, '#3a6a8a'); c.r(7, 6, 3, 17, '#6aa8c8'); c.r(15, 6, 2, 17, '#244a62')
        c.r(8, 4, 8, 2, '#3a6a8a'); c.r(10, 1, 4, 3, P['metall']); c.r(9, 1, 6, 1, P['metallGlanz'])
        c.r(7, 12, 10, 2, P['weiss'])
    elif name == 'medizin':
        c.r(3, 6, 18, 15, P['weiss']); c.r(3, 6, 18, 2, '#ffffff'); c.r(3, 19, 18, 2, P['weissDunkel'])
        c.r(9, 3, 6, 3, P['weissDunkel'])
        c.r(10, 9, 4, 10, P['rotHell']); c.r(7, 12, 10, 4, P['rotHell'])
    return outline(c)


def outline(c):
    import numpy as np
    a = c.a[..., 3] > 0
    o = np.zeros_like(a)
    o[1:, :] |= a[:-1, :]; o[:-1, :] |= a[1:, :]; o[:, 1:] |= a[:, :-1]; o[:, :-1] |= a[:, 1:]
    o &= ~a
    c.a[o] = hx(K)
    return c


ITEMS = ['torpedo', 'diesel', 'proviant', 'konserven', 'ersatzteile', 'batterie', 'druckluft', 'medizin']


# ---------------- Skill-Symbole 24 x 24 ----------------
def skill(name):
    c = Can(24, 24)
    if name == 'rumpf':
        c.r(3, 4, 18, 16, '#2c3d3f'); c.r(3, 4, 18, 2, '#86a3a0'); c.r(3, 6, 18, 2, '#587372')
        for x in (5, 18):
            for y in (8, 12, 16):
                c.px(x, y, '#86a3a0')
        c.r(11, 4, 2, 16, '#172123'); c.r(3, 12, 18, 1, '#172123')
    elif name == 'tiefe':
        c.r(10, 2, 4, 14, '#4fc77c'); c.r(6, 13, 12, 3, '#4fc77c'); c.r(8, 16, 8, 2, '#4fc77c'); c.r(10, 18, 4, 2, '#4fc77c')
        c.r(10, 2, 1, 14, '#b8ffd0')
        c.r(3, 21, 18, 1, '#25507a')
    elif name == 'pumpe':
        c.circle(10, 13, 7, P['metall']); c.circle(10, 13, 7, P['metallHell'], ring=1)
        for a in range(4):
            w = a * math.pi / 2 + .4
            for k in range(6):
                c.px(round(10 + math.cos(w) * k), round(13 + math.sin(w) * k), '#6aa8c8')
        c.r(16, 5, 6, 4, P['metall']); c.r(16, 5, 6, 1, P['metallHell'])
        c.r(19, 9, 2, 3, '#6aa8c8'); c.px(19, 13, '#6aa8c8'); c.px(20, 15, '#6aa8c8')
    elif name == 'batterie':
        c.r(3, 7, 16, 12, '#2c3135'); c.r(19, 10, 2, 6, P['metallHell'])
        c.r(5, 9, 12, 8, P['sonar1']); c.r(5, 9, 8, 8, P['sonar4']); c.r(5, 9, 8, 1, P['sonar5'])
        for k in range(5):
            c.px(11 + (k % 2), 4 + k, P['messingGlanz'])
    elif name == 'diesel':
        c.r(4, 8, 16, 12, P['metall']); c.r(4, 8, 16, 2, P['metallHell'])
        for k in range(4):
            c.r(5 + k * 4, 3, 3, 5, '#343a3f'); c.r(5 + k * 4, 3, 3, 1, '#5b6166')
        c.r(8, 13, 8, 3, P['kupfer'])
    elif name == 'horch':
        c.circle(12, 12, 10, P['sonar1']); c.circle(12, 12, 10, P['sonar3'], ring=1); c.circle(12, 12, 5, P['sonar2'], ring=1)
        for k in range(10):
            c.px(12 + k * .7, 12 - k * .7, P['sonar5'])
        c.r(16, 6, 2, 2, P['sonar5'])
    elif name == 'klass':
        c.r(2, 4, 20, 16, P['sonar0']); c.r(2, 4, 20, 1, P['sonar3'])
        for i, h in enumerate([3, 7, 12, 5, 9, 14, 6, 4, 10]):
            c.r(3 + i * 2, 18 - h, 1, h, P['sonar4'])
    elif name == 'torpedo':
        c.r(2, 10, 17, 5, '#59675e'); c.r(2, 10, 17, 1, '#8a9a8e'); c.r(19, 11, 2, 3, '#59675e'); c.px(21, 12, '#59675e')
        c.r(0, 8, 2, 9, '#3a4540'); c.r(4, 11, 2, 3, P['messing'])
    elif name == 'nachladen':
        c.r(2, 13, 14, 5, '#59675e'); c.r(2, 13, 14, 1, '#8a9a8e')
        for k in range(6):
            c.px(15 + k, 7 + (k if k < 3 else 5 - k), P['messingGlanz'])
        c.r(17, 4, 4, 2, P['messingGlanz']); c.r(19, 4, 2, 4, P['messingGlanz'])
    elif name == 'rohr':
        c.circle(12, 12, 9, '#323937'); c.circle(12, 12, 9, P['messingHell'], ring=1)
        c.circle(12, 12, 5, '#111'); c.circle(12, 12, 5, P['messing'], ring=1); c.r(11, 11, 3, 3, '#59675e')
    elif name == 'funk':
        c.r(11, 6, 2, 14, P['metallHell']); c.r(7, 20, 10, 2, P['metall'])
        for r in (4, 7):
            for a in range(-6, 7):
                w = a * .13
                c.px(round(12 + math.sin(w) * r) - 0, round(6 - math.cos(w) * r) + 3, '#ff6a4a')
        c.circle(12, 6, 2, P['rotGlanz'])
    elif name == 'morse':
        c.r(3, 15, 18, 5, P['holz']); c.r(3, 15, 18, 1, P['holzHell'])
        c.r(6, 11, 14, 2, P['messingHell']); c.r(17, 8, 4, 4, '#1d1d1d'); c.r(17, 8, 4, 1, '#444')
        c.r(7, 13, 2, 2, P['messing'])
        c.r(3, 3, 3, 2, '#efd086'); c.r(8, 3, 7, 2, '#efd086'); c.r(17, 3, 3, 2, '#efd086')
    elif name == 'moral':
        c.r(4, 8, 12, 12, P['weiss']); c.r(4, 8, 12, 2, '#ffffff'); c.r(16, 11, 3, 6, P['weiss']); c.r(17, 12, 1, 4, K)
        c.r(5, 10, 10, 4, '#6b4a2a')
        for k in range(3):
            c.px(7 + k * 3, 4 + (k % 2), '#c8d0d4'); c.px(7 + k * 3, 6 - (k % 2), '#c8d0d4')
    elif name == 'leck':
        c.r(3, 10, 18, 6, P['rohr']); c.r(3, 10, 18, 1, P['rohrHell'])
        c.r(10, 8, 5, 10, P['messing']); c.r(10, 8, 5, 1, P['messingGlanz'])
        for k in range(3):
            c.px(6 + k * 6, 19 + k % 2, '#6aa8c8')
    elif name == 'lager':
        c.r(2, 9, 9, 12, P['holz']); c.r(2, 9, 9, 1, P['holzHell']); c.r(2, 14, 9, 1, P['holzDunkel'])
        c.r(13, 5, 9, 16, P['holz']); c.r(13, 5, 9, 1, P['holzHell']); c.r(13, 12, 9, 1, P['holzDunkel'])
        c.r(7, 2, 7, 2, P['sonar4']); c.r(12, 1, 1, 4, P['sonar4'])
    return outline(c)


SKILLS = ['rumpf', 'tiefe', 'pumpe', 'leck', 'batterie', 'diesel', 'horch', 'klass', 'torpedo', 'nachladen', 'rohr',
          'funk', 'morse', 'moral', 'lager']


# ---------------- Horch-Wasserfall (Spektrogramm) ----------------
TYPEN = {
    'frachter': ([(38, 1.0), (76, .7), (114, .45), (152, .3)], 10, .35, 2),
    'zerstoerer': ([(62, .8), (124, 1.0), (186, .6)], 4, .35, 3),
    'haendler': ([(30, .9), (90, .6), (100, .4)], 7, .35, 5),
    'uboot': ([(50, .45)], 13, .3, 7),
    'kontakt': ([(38, .9), (76, .6), (114, .4), (152, .25)], 10, .55, 11),
}


def wasserfall(typ='frachter'):
    W, H = 200, 120
    c = Can(W, H, P['sonar0'])
    linien, takt, rausch, seed = TYPEN[typ]
    rnd = random.Random(seed)
    for y in range(H):
        for x in range(W):
            v = rnd.random() * rausch
            for (lx, s) in linien:
                if abs(x - lx - math.sin(y / 9) * 1.2) < 1.5:
                    v += s * (.7 + .3 * ((y // 6) % 2))
            # Schraubenschlag: helle waagerechte Pulse
            if y % takt < 1 and (typ != 'haendler' or rnd.random() < .7):
                v += .25
            col = P['sonar0'] if v < .25 else P['sonar1'] if v < .45 else P['sonar2'] if v < .7 else P['sonar3'] if v < .95 else P['sonar4'] if v < 1.2 else P['sonar5']
            c.a[y, x] = hx(col)
    for x in range(0, W, 2):
        c.px(x, 0, P['sonar3'])
    return c


if __name__ == '__main__':
    import sys
    out = sys.argv[1]
    seekarte().save(out + '/karte_leer.png')
    seekarte(True).save(out + '/karte_beispiel.png')
    s = Can(12 * len(KS), 12)
    for i, n in enumerate(KS):
        s.paste(kartensymbol(n), i * 12, 0)
    s.save(out + '/karte_symbole.png')
    s = Can(48 + 24 * (len(ITEMS) - 1), 24)
    x = 0
    for n in ITEMS:
        it = item(n); s.paste(it, x, 0); x += it.w
    s.save(out + '/inventar_items.png')
    s = Can(24 * len(SKILLS), 24)
    for i, n in enumerate(SKILLS):
        s.paste(skill(n), i * 24, 0)
    s.save(out + '/skill_symbole.png')
    for t in TYPEN:
        wasserfall(t).save(out + f'/horch_{t}.png')
