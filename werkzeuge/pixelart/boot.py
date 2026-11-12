"""Boot-Querschnitt 1320 x 300, gleiche Geometrie wie js/grafik.js (Abteile, Posten, Kojen, Anzeigen)."""
import math, random
from px import Can, hx, dark, mix
from pal import P

GB, GH = 1320, 300
MITTE = 180
DECKE, BODEN = 140, 220
# Typ VIIC, wie js/daten.js (ABTEILE, KOJEN, ANKER) – Bootseinheiten, Grafik = x 2
ABT = [('heck', 44, 128), ('diesel', 128, 224), ('uraum', 224, 297), ('zentrale', 297, 376),
       ('funk', 376, 410), ('offiziere', 410, 455), ('feldwebel', 455, 494), ('bug', 494, 606)]
KOJEN = [(74, 0, 0), (74, 1, 0), (258, 0, 0), (258, 1, 0), (280, 0, 0), (280, 1, 0),
         (422, 0, 1), (422, 1, 0), (443, 0, 0), (443, 1, 0), (466, 0, 0), (466, 1, 0), (484, 0, 0), (484, 1, 0),
         (512, 0, 0), (512, 1, 0), (532, 0, 0), (532, 1, 0), (552, 0, 0), (552, 1, 0), (572, 0, 0), (572, 1, 0)]
WAND = [P['wand2'], '#383a2f', '#3b3a30', '#3a3b31', '#323a37', '#38392f', '#363a33', '#383a30']
TURM0, TURM1 = 616, 744
SEHROHR = 682


def halb(x):
    t = abs((x - GB / 2) / 628)
    if t >= 1:
        return 0
    return 80 * (1 - t ** 3.2) ** (1 / 3.2) * (1 if x > GB / 2 else 0.96)


def handrad(g, cx, cy, rad, c, hell):
    g.circle(cx, cy, rad, c, ring=1.3)
    for i in range(-rad + 1, rad):
        g.px(cx + i, cy, c); g.px(cx, cy + i, c)
    for k in range(-rad, rad + 1, 3):
        pass
    g.px(cx - rad + 1, cy - rad // 2, hell)
    g.px(cx, cy, P['kontur'])


def rundanzeige(g, cx, cy, rad):
    for y in range(-rad, rad + 1):
        for x in range(-rad, rad + 1):
            d = math.hypot(x, y)
            if d <= rad + 0.3:
                g.px(cx + x, cy + y, P['messingHell'] if d > rad - 1 else P['kontur'] if d > rad - 1.8 else P['anzeige'])
    for a in range(9):
        w = math.pi * 0.75 + a * math.pi * 1.5 / 8
        g.px(round(cx + math.cos(w) * (rad - 2.5)), round(cy + math.sin(w) * (rad - 2.5)), '#4a4436')
    # roter Bereich (Zerstoerungstiefe)
    for a in range(3):
        w = math.pi * 0.75 + (6 + a) * math.pi * 1.5 / 8 * 0.95
        g.px(round(cx + math.cos(w) * (rad - 1.6)), round(cy + math.sin(w) * (rad - 1.6)), P['rotHell'])


def koje(g, xf, o, vorhang):
    y = 184 if o else 208
    g.r(xf - 18, y, 36, 3, P['holzDunkel']); g.r(xf - 18, y, 36, 1, P['holz'])
    g.r(xf - 17, y - 3, 34, 3, P['matratze']); g.r(xf - 17, y - 3, 34, 1, P['matratzeHell'])
    g.r(xf + 9, y - 5, 7, 2, P['weiss']); g.px(xf + 9, y - 4, P['weissDunkel'])
    g.r(xf - 19, y - 12, 2, 18, P['holzDunkel']); g.r(xf + 17, y - 12, 2, 18, P['holzDunkel'])
    g.px(xf - 19, y - 12, P['holz']); g.px(xf + 17, y - 12, P['holz'])
    if vorhang:
        g.r(xf - 17, y - 22, 34, 1, P['messing'])
        for i in range(10):
            g.r(xf - 17 + i, y - 21, 1, 18, '#2a3f30' if i % 3 == 0 else '#365440')
        g.r(xf - 17, y - 21, 10, 1, '#41634b')


def schrank(g, x, y, w, h):
    g.r(x, y, w, h, P['metallDunkel']); g.r(x, y, w, 1, P['metallHell'])
    g.r(x, y + h - 1, w, 1, P['kontur']); g.r(x + w - 1, y, 1, h, P['kontur'])


def zeichne(innen=True):
    g = Can(GB, GH)
    rnd = random.Random(7)
    # ---------- Aussenhuelle ----------
    for x in range(28, GB - 28):
        h = halb(x)
        if h <= 0:
            continue
        o, u = round(MITTE - h), round(MITTE + h)
        hh = u - o
        g.r(x, o, 1, hh, P['rumpf'])
        g.r(x, o, 1, 2, P['rumpfKante'])
        g.r(x, o + 2, 1, 3, P['rumpfLicht'])
        g.r(x, o + 5, 1, 5, P['rumpfHell'])
        if (x + o) % 2:
            g.px(x, o + 10, P['rumpfHell'])
        g.r(x, o + 10, 1, 8, P['rumpfMitte'])
        g.r(x, u - 22, 1, 22, P['rumpfDunkel'])
        g.r(x, u - 8, 1, 8, P['rumpfTief'])
        for k in range(5):
            if (x + k) % 2:
                g.px(x, u - 23 - k * 2, P['rumpfDunkel'])
        g.px(x, o - 1, P['kontur']); g.px(x, u, P['kontur'])
        # Laengsnaehte
        for f in (0.45, 0.78):
            n = round(MITTE + h * f)
            g.px(x, n, P['kontur']); g.px(x, n + 1, P['rumpfHell'] if f < 0.6 else P['rumpfMitte'])
        # Plattenstoesse mit Nieten
        if x % 44 == 0:
            g.r(x, o + 4, 1, hh - 6, P['kontur']); g.r(x + 1, o + 4, 1, hh - 6, P['rumpfHell'])
        if x % 44 in (3, 41):
            for yy in range(o + 6, u - 4, 6):
                g.px(x, yy, P['niete']); g.px(x, yy + 1, P['nieteDunkel'])
        # Rostspuren, die von Nieten nach unten laufen
        if x % 44 in (5, 6, 39) and rnd.random() < 0.5:
            ln = rnd.randint(6, 18)
            yy = o + 8 + rnd.randint(0, 20)
            for k in range(ln):
                g.px(x, yy + k, P['rostMitte'] if k < ln // 2 else P['rost'])
    # Oberdeck (Aussenhaut mit Flutschlitzen)
    for x in range(150, 1180):
        h = halb(x)
        o = round(MITTE - h)
        dt = 96
        if o > dt + 1:
            g.r(x, dt, 1, o - dt, P['rumpfMitte'])
            g.px(x, dt, P['rumpfKante']); g.px(x, dt + 1, P['rumpfLicht'])
            g.px(x, dt - 1, P['kontur'])
            if o - dt > 7 and x % 10 < 4:
                g.r(x, o - 5, 1, 2, P['kontur'])
    # Kiel
    for x in range(260, 1080):
        u = round(MITTE + halb(x))
        g.r(x, u + 1, 1, 3, P['rumpfTief']); g.px(x, u + 4, P['kontur'])
    # Reling (Handlaeufe) vor und hinter dem Turm
    for a, b in ((180, TURM0 - 20), (TURM1 + 16, 1150)):
        g.r(a, 90, b - a, 1, P['metallHell'])
        for x in range(a, b + 1, 18):
            g.r(x, 90, 1, 6, P['metall'])
    # Turm (Brücke) mit Wintergarten achtern
    for x in range(TURM0 - 24, TURM1):
        if x < TURM0:
            top = 66 + (TURM0 - x) // 3   # Wintergarten, niedriger
        else:
            top = 56
        if x > TURM1 - 18:
            top = 56 + (x - (TURM1 - 18))
        g.r(x, top, 1, 100 - top, P['rumpfMitte'])
        g.px(x, top, P['rumpfKante']); g.px(x, top + 1, P['rumpfLicht'])
        g.r(x, top + 2, 1, 4, P['rumpfHell'])
        g.r(x, 92, 1, 8, P['rumpfDunkel'])
        g.px(x, top - 1, P['kontur'])
    g.r(TURM0 - 25, 66, 1, 34, P['kontur'])
    # Brueckenbrüstung, Windabweiser
    g.r(TURM0 + 4, 50, TURM1 - TURM0 - 20, 2, P['metall']); g.r(TURM0 + 4, 50, TURM1 - TURM0 - 20, 1, P['metallHell'])
    for x in range(TURM0 + 8, TURM1 - 18, 12):
        g.r(x, 52, 1, 4, P['metall'])
    g.r(TURM0 + 18, 72, 70, 2, P['rumpfLicht'])
    for i in range(6):
        g.r(TURM0 + 24 + i * 10, 78, 6, 4, P['kontur']); g.px(TURM0 + 24 + i * 10, 78, P['rumpfTief'])
    # 2-cm-Flak auf dem Wintergarten
    g.r(TURM0 - 18, 58, 10, 8, P['metallDunkel']); g.r(TURM0 - 16, 54, 6, 4, P['metall'])
    for k in range(14):
        g.px(TURM0 - 10 + k, 54 - k // 3, P['metallHell'])
    # Turmkennung "U 7"
    for j, z in enumerate(['1001.1111', '1001.0001', '1001.0010', '1001.0100', '0110.0100']):
        for i, v in enumerate(z):
            if v == '1':
                g.r(TURM0 + 56 + i * 2, 84 + j * 2, 2, 2, P['weissDunkel'])
    # Rost am Turm
    for k in range(5):
        xx = TURM0 + rnd.randint(0, TURM1 - TURM0 - 10)
        for y in range(60 + rnd.randint(0, 6), 60 + rnd.randint(14, 30)):
            g.px(xx, y, P['rost'])
    # 8,8-cm-Deckgeschuetz vor dem Turm
    gx = TURM1 + 60
    g.r(gx, 86, 16, 10, P['metallDunkel']); g.r(gx + 2, 78, 14, 8, P['metall']); g.r(gx + 2, 78, 14, 1, P['metallHell'])
    g.r(gx + 14, 79, 40, 3, P['metall']); g.r(gx + 14, 79, 40, 1, P['metallHell']); g.r(gx + 52, 78, 3, 5, P['metallDunkel'])
    g.r(gx + 4, 94, 12, 2, P['kontur'])
    # Oberdeckbehaelter (Klappen im Oberdeck vor und hinter dem Turm)
    for cx in (TURM0 - 90, TURM1 + 150):
        g.r(cx, 95, 60, 1, P['kontur']); g.px(cx, 94, P['rumpfKante']); g.px(cx + 59, 94, P['rumpfKante'])
    # Heck: Ruder, Tiefenruder, Wellenbock (Schraube zeichnet das Spiel selbst bei x 24–33)
    g.r(6, 150, 8, 60, P['rumpfDunkel']); g.r(6, 150, 2, 60, P['rumpfHell']); g.r(5, 150, 1, 60, P['kontur'])
    g.r(13, 150, 1, 60, P['kontur']); g.r(6, 150, 8, 1, P['rumpfLicht'])
    g.r(16, 177, 26, 5, P['metall']); g.r(16, 177, 26, 1, P['metallHell']); g.r(16, 181, 26, 1, P['kontur'])
    g.r(30, 196, 30, 4, P['rumpfDunkel']); g.r(30, 196, 30, 1, P['rumpfLicht']); g.r(30, 199, 30, 1, P['kontur'])
    # Heckrohr-Muendung
    g.r(46, 168, 9, 9, P['kontur']); g.r(47, 169, 7, 7, P['rumpfTief']); g.r(47, 169, 7, 1, P['rumpfHell'])
    # Bug: Tiefenruder, Torpedoklappen
    g.r(1196, 194, 32, 4, P['rumpfDunkel']); g.r(1196, 194, 32, 1, P['rumpfLicht']); g.r(1196, 197, 32, 1, P['kontur'])
    for i in range(4):
        tx, ty = 1236 + (i % 2) * 6, 156 + (i // 2) * 28
        g.r(tx, ty, 9, 9, P['kontur']); g.r(tx + 1, ty + 1, 7, 7, P['rumpfTief']); g.r(tx + 1, ty + 1, 7, 1, P['rumpfHell'])
    # Netzabweiser am Bug

    if not innen:
        return g
    from innen import innenraum
    innenraum(g, ABT, KOJEN, WAND, SEHROHR)
    return g


if __name__ == '__main__':
    import sys
    out = sys.argv[1]
    zeichne().save(out + '/boot_querschnitt.png')
    zeichne(innen=False).save(out + '/boot_aussen.png')
