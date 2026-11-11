"""Schiffe, HUD (Horchgeraet, Tiefenmesser, Symbole), Umwelt und die Gesamtszene."""
import math, random
from px import Can, hx, dark, mix
from pal import P
import boot, crew

K = P['kontur']


# ---------------- Schiffe (Seitenansicht, Bug rechts, Wasserlinie unten) ----------------
def rumpf(c, x0, x1, top, wl, bug, heck, farbe, unten='#5a1f1a', deckfarbe=None):
    for x in range(x0, x1):
        t = top
        if x > x1 - bug:
            t = top - (x - (x1 - bug)) // 3
        bot = wl + 6
        if x < x0 + heck:
            bot = wl + 6 - (x0 + heck - x) // 2
        if x > x1 - bug:
            bot = wl + 6 - (x - (x1 - bug)) * 6 // bug
        c.r(x, t, 1, wl - t, farbe)
        c.px(x, t, dark(farbe, 1.5) if deckfarbe is None else deckfarbe)
        c.r(x, wl - 3, 1, 3, dark(farbe, 0.7))
        c.r(x, wl, 1, max(0, bot - wl), unten)
        c.px(x, t - 1, K); c.px(x, max(bot, wl), K)
    c.vline(x0 - 1, top, wl + 2 - top, K)
    for x in range(x0 + 6, x1 - 6, 6):
        c.px(x, top + 3, dark(farbe, 0.6))


def frachter():
    c = Can(168, 60)
    rumpf(c, 6, 162, 30, 48, 22, 10, '#3a2622', unten='#6a2a20')
    c.r(6, 40, 156, 1, '#c9c2a8')  # Zierstreifen
    # Aufbau achtern
    c.r(22, 14, 34, 16, P['weiss']); c.r(22, 14, 34, 1, '#ffffff'); c.r(22, 29, 34, 1, P['weissDunkel'])
    for i in range(6):
        c.r(25 + i * 5, 18, 3, 3, '#26323a'); c.r(25 + i * 5, 23, 3, 3, '#26323a')
    c.r(26, 8, 24, 6, P['weissDunkel']); c.r(27, 9, 22, 2, '#26323a')
    c.r(34, 0, 9, 9, '#2a2a2a'); c.r(34, 2, 9, 2, '#a83a2a'); c.r(34, 0, 9, 1, '#111')  # Schornstein
    c.r(20, 13, 38, 1, K); c.vline(21, 14, 16, K); c.vline(56, 14, 16, K)
    # Ladeluken und Masten mit Ladebaeumen
    for x in (72, 102, 132):
        c.r(x, 26, 20, 4, '#4a3a2a'); c.r(x, 26, 20, 1, '#6a543a')
    for x in (66, 98, 128):
        c.r(x, 4, 2, 26, '#5a4e40'); c.px(x, 4, K)
        for k in range(16):
            c.px(x + 2 + k, 6 + k, '#5a4e40')
        c.hline(x - 4, 10, 10, '#5a4e40')
    c.r(150, 24, 8, 6, '#5a4e40')
    # Kisten auf Deck
    c.r(108, 22, 8, 4, '#3f5a3a'); c.r(116, 23, 6, 3, '#6b5a3a')
    return c


def zerstoerer():
    c = Can(184, 52)
    rumpf(c, 4, 180, 30, 42, 30, 8, '#4c5560', unten='#3a2a2a', deckfarbe='#7b8590')
    c.r(4, 36, 176, 1, '#3a414a')
    # Brueckenaufbau
    c.r(108, 14, 26, 16, '#59636e'); c.r(108, 14, 26, 1, '#8a96a2')
    c.r(112, 18, 18, 3, '#1c232a'); c.r(114, 8, 14, 6, '#59636e'); c.r(115, 9, 12, 2, '#1c232a')
    c.r(120, 0, 2, 8, '#59636e'); c.hline(116, 2, 10, '#59636e')  # Mast
    # Schornsteine
    for x in (70, 86):
        c.r(x, 12, 9, 18, '#59636e'); c.r(x, 12, 9, 2, '#1a1a1a'); c.r(x, 20, 9, 1, '#2a2f36')
    c.r(40, 20, 50, 10, '#59636e'); c.r(40, 20, 50, 1, '#8a96a2')
    # Geschuetztuerme
    for x, d in ((146, 1), (156, 1), (22, -1)):
        c.r(x, 24, 10, 6, '#646e7a'); c.r(x, 24, 10, 1, '#8a96a2')
        if d > 0:
            c.r(x + 9, 25, 10, 2, '#3a414a')
        else:
            c.r(x - 9, 25, 10, 2, '#3a414a')
    # Wasserbombenablage am Heck
    c.r(8, 26, 6, 4, '#2a2f36'); c.r(9, 25, 4, 1, '#646e7a')
    c.r(4, 36, 30, 1, '#a83a2a')
    return c


def haendler():
    c = Can(120, 48)
    rumpf(c, 4, 116, 26, 38, 16, 8, '#2f4a3a', unten='#5a2a20', deckfarbe='#5a7a62')
    c.r(4, 30, 112, 1, '#c9c2a8')
    c.r(14, 10, 26, 16, '#cfc5a8'); c.r(14, 10, 26, 1, '#efe6cc')
    for i in range(4):
        c.r(17 + i * 6, 14, 3, 3, '#26323a')
    c.r(18, 4, 7, 6, '#2a2a2a'); c.r(18, 6, 7, 1, '#d8b04a')
    c.r(70, 0, 2, 26, '#6a5a44'); c.hline(60, 6, 22, '#6a5a44')
    c.r(52, 18, 40, 8, '#6b5a3a'); c.r(52, 18, 40, 1, '#8a7652')  # Ladung unter Plane
    for x in range(54, 92, 8):
        c.vline(x, 18, 8, '#4a3c26')
    c.r(108, 22, 2, 4, '#c9c2a8')
    return c


def uboot_klein():
    c = Can(104, 30)
    for x in range(4, 100):
        t = abs((x - 52) / 48)
        h = 7 * (1 - t ** 3) ** (1 / 3) if t < 1 else 0
        if h <= 0:
            continue
        o, u = round(20 - h), round(20 + h)
        c.r(x, o, 1, u - o, P['rumpf']); c.px(x, o, P['rumpfLicht']); c.r(x, u - 3, 1, 3, P['rumpfTief'])
        c.px(x, o - 1, K); c.px(x, u, K)
    c.r(20, 12, 70, 2, P['rumpfMitte']); c.hline(20, 11, 70, K)
    c.r(52, 4, 16, 9, P['rumpfMitte']); c.r(52, 4, 16, 1, P['rumpfLicht']); c.vline(51, 4, 9, K); c.vline(68, 4, 9, K)
    c.r(58, 0, 1, 4, P['metallHell']); c.r(62, 1, 1, 3, P['metallHell'])
    c.r(74, 10, 6, 1, P['metallHell'])
    c.r(0, 18, 4, 5, P['messing'])
    return c


def torpedo():
    c = Can(28, 7)
    c.r(4, 1, 20, 5, '#59675e'); c.r(4, 1, 20, 1, '#8a9a8e'); c.r(4, 5, 20, 1, '#33403a')
    c.r(24, 2, 2, 3, '#59675e'); c.px(26, 3, '#59675e')
    c.r(20, 1, 1, 5, '#2c3530'); c.r(6, 2, 2, 3, P['messing'])
    c.r(0, 0, 4, 7, '#3a4540'); c.r(2, 3, 2, 1, P['messingHell'])
    for x in range(-1, 28 + 1):
        pass
    # Kontur
    for y in range(7):
        for x in range(28):
            pass
    return c


# ---------------- HUD ----------------
def horchschirm():
    N = 136
    c = Can(N, N)
    cx = cy = N // 2
    R = 60
    # Messinggehaeuse
    c.circle(cx, cy, R + 7, P['messing'])
    c.circle(cx, cy, R + 7, P['messingGlanz'], ring=1)
    c.circle(cx, cy, R + 5, P['messingHell'], ring=1)
    for a in range(12):
        w = a * math.pi / 6
        c.r(round(cx + math.cos(w) * (R + 4)) - 1, round(cy + math.sin(w) * (R + 4)) - 1, 2, 2, K)
    c.circle(cx, cy, R + 2, K)
    c.circle(cx, cy, R, P['sonar0'])
    # Wischkeil (Schweif)
    for y in range(-R, R + 1):
        for x in range(-R, R + 1):
            d = math.hypot(x, y)
            if d > R:
                continue
            ang = (math.atan2(y, x) - (-0.7)) % (2 * math.pi)
            if ang < 1.1:
                f = 1 - ang / 1.1
                if f > 0.66:
                    c.px(cx + x, cy + y, P['sonar2'])
                elif f > 0.33:
                    c.px(cx + x, cy + y, P['sonar1'])
                elif (x + y) % 2 == 0:
                    c.px(cx + x, cy + y, P['sonar1'])
    for rr in (15, 30, 45):
        c.circle(cx, cy, rr, P['sonar2'], ring=1)
    c.circle(cx, cy, R, P['sonar3'], ring=1)
    for k in range(-R + 2, R - 1):
        if k % 2 == 0:
            c.px(cx + k, cy, P['sonar2']); c.px(cx, cy + k, P['sonar2'])
    for a in range(36):
        w = a * math.pi / 18
        ln = 4 if a % 3 == 0 else 2
        for k in range(ln):
            c.px(round(cx + math.cos(w) * (R - 1 - k)), round(cy + math.sin(w) * (R - 1 - k)), P['sonar3'])
    # Wischstrahl
    for k in range(R):
        c.px(round(cx + math.cos(-0.7) * k), round(cy + math.sin(-0.7) * k), P['sonar5'] if k > 6 else P['sonar4'])
    # Kontakte
    for (dx, dy, hell) in ((30, -32, True), (-28, 12, False), (14, 36, False)):
        cxx, cyy = cx + dx, cy + dy
        c.r(cxx - 1, cyy - 1, 3, 3, P['sonar5'] if hell else P['sonar4'])
        if hell:
            c.circle(cxx, cyy, 4, P['sonar3'], ring=1)
    # Rauschen
    rnd = random.Random(3)
    for _ in range(140):
        x, y = rnd.randint(-R, R), rnd.randint(-R, R)
        if math.hypot(x, y) < R - 2:
            c.px(cx + x, cy + y, P['sonar1'])
    c.r(cx - 1, cy - 1, 3, 3, P['sonar4'])
    return c


def tiefenmesser():
    N = 72
    c = Can(N, N)
    cx = cy = N // 2
    R = 30
    c.circle(cx, cy, R + 4, P['messing']); c.circle(cx, cy, R + 4, P['messingGlanz'], ring=1)
    c.circle(cx, cy, R + 1, K)
    c.circle(cx, cy, R, P['anzeige'])
    c.circle(cx, cy, R, P['anzeigeDunkel'], ring=2)
    # Skala 0..220 m ueber 270 Grad, roter Bereich ab 150 m
    for i in range(23):
        w = math.pi * 0.75 + i / 22 * math.pi * 1.5
        ln = 5 if i % 5 == 0 else 3
        col = P['rotHell'] if i * 10 >= 150 else '#2a261c'
        for k in range(ln):
            c.px(round(cx + math.cos(w) * (R - 2 - k)), round(cy + math.sin(w) * (R - 2 - k)), col)
    for i in range(15, 23):
        w = math.pi * 0.75 + i / 22 * math.pi * 1.5
        c.px(round(cx + math.cos(w) * (R - 8)), round(cy + math.sin(w) * (R - 8)), P['rotHell'])
    # Zeiger auf 60 m (Schleichtiefe)
    w = math.pi * 0.75 + 60 / 220 * math.pi * 1.5
    for k in range(-4, R - 5):
        c.px(round(cx + math.cos(w) * k), round(cy + math.sin(w) * k), P['rot'])
        c.px(round(cx + math.cos(w) * k) + 1, round(cy + math.sin(w) * k), P['rotHell'])
    c.circle(cx, cy, 3, P['messingHell']); c.px(cx, cy, K)
    # Glanzlicht auf dem Glas
    for k in range(8):
        c.px(cx - 18 + k, cy - 20 + k // 3, '#ffffff66')
    return c


ICONS = {
    'geld': (['....kkkkkk......', '..kkyyyyyykk....', '.kyyYYYYYYyyk...', 'kyyYyyyyyyYyyk..', 'kyYyyykkyyyYyk..',
              'kyYyykyyyyyYyk..', 'kyYyyykkyyyYyk..', 'kyYyyyyykyyYyk..', 'kyYyykkkyyyYyk..', 'kyyYyyyyyyYyyk..',
              '.kyyYYYYYYyyk...', '..kkyyyyyykk....', '....kkkkkk......'], dict(y='#c29a45', Y='#efd086')),
    'moral': (['................', '..kkkk...kkkk...', '.krrrrk.krrrrk..', 'krrRRrrkrrrrrrk.', 'krRrrrrrrrrrrrk.',
               'krRrrrrrrrrrrrk.', 'krrrrrrrrrrrrrk.', '.krrrrrrrrrrrk..', '..krrrrrrrrrk...', '...krrrrrrrk....',
               '....krrrrrk.....', '.....krrrk......', '......krk.......', '.......k........'],
              dict(r='#c8392b', R='#ff8a6a')),
    'proviant': (['................', '.......kk.......', '......kbbk......', '.....kbBbbk.....', '....kbBbbbbk....',
                  '...kbBbbbbbbk...', '..kbbbbbbbbbbk..', '..kbbBbbbBbbbk..', '..kbbbbbbbbbbk..', '..kbbbbbbbbbbk..',
                  '..kddddddddddk..', '...kkkkkkkkkk...'], dict(b='#a8743e', B='#d8a868', d='#6b4a2a')),
    'diesel': (['.....kkkkkk.....', '....kmmmmmmk....', '...kkkkkkkkkk...', '...kgGgggggggk..', '...kgGgggggggk..',
                '...kkkkkkkkkkk..', '...kgGgggggggk..', '...kgGgg##gggk..', '...kgGg####ggk..', '...kgGgg##gggk..',
                '...kkkkkkkkkkk..', '...kgGgggggggk..', '...kgGgggggggk..', '....kkkkkkkkk...'],
               {'g': '#5a3a22', 'G': '#8a5a32', 'm': '#4a5156', '#': '#efd086'}),
    'batterie': (['................', '....kk....kk....', '...kmmk..kmmk...', '.kkkkkkkkkkkkkk.', '.kbbbbbbbbbbbbk.',
                  '.kbGGGbbbbbbbbk.', '.kbGGGbbb#bbbbk.', '.kbGGGbb###bbbk.', '.kbGGGbbb#bbbbk.', '.kbGGGbbbbbbbbk.',
                  '.kbbbbbbbbbbbbk.', '.kkkkkkkkkkkkkk.'], {'b': '#2c3135', 'G': '#4fc77c', 'm': '#737d82', '#': '#c8392b'}),
    'druckluft': (['......kkkk......', '.....kmmmmk.....', '......kmmk......', '.....kkkkkk.....', '....kbbbbbbk....',
                   '...kbBbbbbbbk...', '...kbBbbbbbbk...', '...kbBbbbbbbk...', '...kbBbbbbbbk...', '...kbBbbbbbbk...',
                   '...kbBbbbbbbk...', '...kbBbbbbbbk...', '....kbbbbbbk....', '.....kkkkkk.....'],
                  {'b': '#3a6a8a', 'B': '#6aa8c8', 'm': '#a8b2b4'}),
    'rumpf': (['................', '.kkkkkkkkkkkkkk.', '.kmMmmmmmmmmmmk.', '.kmMmnmmmmmmnmk.', '.kmMmmmmmmmmmmk.',
               '.kmMmmmmrmmmmmk.', '.kmMmmmrrrmmmmk.', '.kmMmmmmrmmmmmk.', '.kmMmmmmmmmmmmk.', '.kmMmnmmmmmmnmk.',
               '.kmmmmmmmmmmmmk.', '.kkkkkkkkkkkkkk.'], {'m': '#2c3d3f', 'M': '#587372', 'n': '#86a3a0', 'r': '#94532c'}),
    'torpedo': (['................', '................', '................', '.......kkkkkkk..', '.kk.kkgggggggGk.',
                 'kbbkgGGGGGGGGGgk', 'kbbkgggggggggggk', '.kk.kkgggggggGk.', '.......kkkkkkk..'],
                {'g': '#59675e', 'G': '#8a9a8e', 'b': '#c29a45'}),
    'funk': (['.......k........', '......kyk.......', '.......k........', '...k...k...k....', '..k.k..k..k.k...',
              '.k.k...k...k.k..', '..k.k..k..k.k...', '...k...k...k....', '.......k........', '......kmk.......',
              '.....kmmmk......', '....kmmmmmk.....', '...kkkkkkkkk....'], {'y': '#ff6a4a', 'm': '#737d82'}),
    'schlaf': (['................', '.........kkkk...', '...........k....', '..........k.....', '.........kkkk....',
                '...kkk..........', '..kyyyk.........', '.kyyyk..........', '.kyyk...........', '.kyyyk..........',
                '..kyyyyk..kk....', '...kyyyyyyk.....', '....kkkkkk......'], {'y': '#efd086', 'k': '#c9c2a8'}),
}


def icon(name):
    rows, pal = ICONS[name]
    pal = dict(pal)
    pal.setdefault('k', K)
    c = Can(16, 16)
    c.grid(rows, pal, 0, (16 - len(rows)) // 2)
    return c


# ---------------- Umwelt ----------------
def meeresboden(w=640, h=72, seed=5):
    c = Can(w, h)
    rnd = random.Random(seed)
    base = [0] * w
    y = 30
    for x in range(w):
        y += rnd.choice((-1, 0, 0, 0, 1)) * (1 if rnd.random() < 0.5 else 0)
        y = max(20, min(40, y))
        base[x] = y + int(4 * math.sin(x / 37) + 3 * math.sin(x / 13))
    for x in range(w):
        t = base[x]
        c.r(x, t, 1, h - t, '#1d1a14')
        c.px(x, t, '#5a5040'); c.px(x, t + 1, '#3e372a')
        if (x + t) % 2:
            c.px(x, t + 2, '#3e372a')
        for yy in range(t + 4, h, 2):
            if rnd.random() < 0.12:
                c.px(x, yy, '#2e281e')
    # Felsen
    for _ in range(w // 90):
        fx = rnd.randint(10, w - 40); fw = rnd.randint(18, 34); fh = rnd.randint(10, 20)
        for i in range(fw):
            hh = int(fh * math.sin(math.pi * i / fw) ** 0.6)
            top = base[min(w - 1, fx + i)] - hh + 3
            c.r(fx + i, top, 1, hh, '#2c3236')
            c.px(fx + i, top, '#4e5a5e')
            if i < fw // 2:
                c.px(fx + i, top + 1, '#3d464a')
            c.px(fx + i, top - 1, K)
    # Seegras
    for _ in range(w // 22):
        gx = rnd.randint(4, w - 4); ln = rnd.randint(10, 26)
        col = rnd.choice(['#1f3a2a', '#28503a', '#1b3326'])
        for k in range(ln):
            xx = gx + round(2 * math.sin(k / 3 + gx))
            c.px(xx, base[gx] - k, col)
            if k % 4 == 0:
                c.px(xx + 1, base[gx] - k, dark(col, 1.3))
    return c


def wrack():
    c = Can(120, 56)
    # schraeg liegender Rumpf eines alten Frachters
    for x in range(4, 116):
        top = 18 + x // 8
        bot = 50 - max(0, (x - 90) // 3)
        if x < 12:
            top += (12 - x)
        c.r(x, top, 1, bot - top, '#2a1f1a')
        c.px(x, top, '#4a3326'); c.px(x, top - 1, K)
        if x % 9 < 2:
            c.r(x, top + 4, 1, bot - top - 6, '#1a1310')
    # Loch im Rumpf
    for y in range(-6, 7):
        for x in range(-9, 10):
            if (x / 9) ** 2 + (y / 6) ** 2 < 1:
                c.px(60 + x, 36 + y, '#06090b')
    # Mast abgeknickt
    for k in range(26):
        c.px(40 + k, 22 - k // 2, '#3a2c22')
    # Rost und Bewuchs
    rnd = random.Random(9)
    for _ in range(90):
        x, y = rnd.randint(6, 112), rnd.randint(22, 48)
        if c.a[y, x, 3] > 0:
            c.px(x, y, rnd.choice([P['rost'], P['rostMitte'], '#28503a']))
    return c


def blasen():
    c = Can(32, 48)
    for (x, y, r) in ((8, 40, 3), (18, 30, 2), (12, 22, 2), (20, 12, 1), (14, 6, 1), (24, 38, 1)):
        c.circle(x, y, r, '#9cc4d8', ring=1)
        c.px(x - r // 2, y - r // 2, '#ffffff')
    return c


# ---------------- Gesamtszene ----------------
def wasser(w, h):
    c = Can(w, h)
    stops = [P['tief5'], P['tief4'], P['tief3'], P['tief2'], P['tief1'], P['tief0']]
    band = h / (len(stops) - 1)
    for y in range(h):
        i = min(len(stops) - 2, int(y / band))
        t = (y - i * band) / band
        a, b = stops[i], stops[i + 1]
        for x in range(w):
            # 2x2 Bayer-Dithering zwischen den Baendern
            th = ((x % 2) * 2 + (y % 2) * 3) % 4 / 4 + 0.125
            c.a[y, x] = hx(b if t > th else a)
    return c


def szene():
    W, H = 1320, 520
    c = wasser(W, H)
    # Wasseroberflaeche
    for x in range(W):
        y = 24 + round(2 * math.sin(x / 18))
        c.r(x, 0, 1, y, '#0d1a26')
        c.px(x, y, P['schaum']); c.px(x, y + 1, '#4d7c98')
    # Lichtstrahlen
    for k, sx in enumerate((120, 380, 700, 1010, 1220)):
        for y in range(26, 360):
            wdt = 10 + y // 14
            a = int(26 * (1 - y / 360))
            x0 = sx + y // 3
            c.r(x0, y, wdt, 1, (140, 200, 230, a))
    # Schwebeteilchen
    rnd = random.Random(1)
    for _ in range(400):
        c.px(rnd.randint(0, W - 1), rnd.randint(30, H - 60), (170, 210, 220, rnd.randint(40, 120)))
    # Meeresboden
    mb = meeresboden(W, 90, seed=11)
    c.paste(mb, 0, H - 90)
    c.paste(wrack(), 60, H - 92)
    # Boot
    b = boot.zeichne()
    OY = 70
    # Sehrohr ausgefahren (zeichnet sonst das Spiel)
    c.r(822, OY + 18, 4, 42, P['metallHell']); c.r(822, OY + 18, 1, 42, P['metallGlanz'])
    c.r(820, OY + 18, 8, 4, P['metall']); c.r(826, OY + 19, 3, 2, '#1a2523')
    c.paste(b, 0, OY)
    # Schraube
    c.r(26, OY + 162, 5, 34, P['messing']); c.r(26, OY + 162, 1, 34, P['messingGlanz']); c.r(24, OY + 175, 9, 8, P['messing'])
    # Crew an ihren Posten
    pos = {'kaleu': (412, 3), 'li': (370, 3), 'wo1': (384, 3), 'tauch': (398, 3), 'ruder': (428, 3), 'nav': (446, 0),
           'funker': (472, 3), 'soni': (510, 3), 'maschinist': (160, 3), 'smutje': (346, 3), 'logistik': (236, 0),
           'brand': (300, 1), 'vertau': (92, 3)}
    for r in crew.ROLLEN:
        x, fr = pos[r[0]]
        sp = crew.bild(r, fr)
        c.paste(sp, x * 2 - 6, OY + 220 - 28 + (1 if fr == 1 else 0))
    # Zwei Schlaefer in den Kojen
    for (kx, o), r in (((562, 0), crew.ROLLEN[8]), ((282, 1), crew.ROLLEN[9])):
        s = crew.schlaf(r)
        y = (184 if o else 208) - 3
        c.paste(s, kx * 2 - 14, OY + y - 10)
    # Lichtschein der Lampen (additiv)
    for (aid, a0, a1) in boot.ABT:
        x0, w = a0 * 2, (a1 - a0) * 2
        for l in ([x0 + w / 3, x0 + 2 * w / 3] if w > 160 else [x0 + w / 2]):
            for yy in range(0, 64):
                for xx in range(-48, 49):
                    d = math.hypot(xx / 48, yy / 64)
                    if d < 1:
                        X, Y = round(l) + xx, OY + 154 + yy
                        if 0 <= X < W and 0 <= Y < H:
                            v = (1 - d) ** 2 * 26
                            px_ = c.a[Y, X]
                            px_[0] = min(255, px_[0] + v * 1.0); px_[1] = min(255, px_[1] + v * 0.75); px_[2] = min(255, px_[2] + v * 0.4)
    # Blasen an der Schraube
    c.paste(blasen(), 0, OY + 140)
    # Kontakt in der Ferne: Zerstoerer an der Oberflaeche (Silhouette)
    z = zerstoerer()
    for y in range(z.h):
        for x in range(z.w):
            if z.a[y, x, 3] > 0 and y < 44:
                c.px(1060 + x, -18 + y, '#0c1520')
    return c


if __name__ == '__main__':
    import sys
    out = sys.argv[1]
    frachter().save(out + '/schiff_frachter.png')
    zerstoerer().save(out + '/schiff_zerstoerer.png')
    haendler().save(out + '/schiff_haendler.png')
    uboot_klein().save(out + '/uboot_klein.png')
    torpedo().save(out + '/torpedo.png')
    horchschirm().save(out + '/hud_horchschirm.png')
    tiefenmesser().save(out + '/hud_tiefenmesser.png')
    sheet = Can(16 * len(ICONS), 16)
    for i, n in enumerate(ICONS):
        sheet.paste(icon(n), i * 16, 0)
    sheet.save(out + '/hud_symbole.png')
    meeresboden().save(out + '/umwelt_meeresboden.png')
    wrack().save(out + '/umwelt_wrack.png')
    blasen().save(out + '/umwelt_blasen.png')
    s = szene()
    s.save(out + '/szene.png')
