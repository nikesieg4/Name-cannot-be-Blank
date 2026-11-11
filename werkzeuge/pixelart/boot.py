"""Boot-Querschnitt 1320 x 300, gleiche Geometrie wie js/grafik.js (Abteile, Posten, Kojen, Anzeigen)."""
import math, random
from px import Can, hx, dark, mix
from pal import P

GB, GH = 1320, 300
MITTE = 180
DECKE, BODEN = 140, 220
ABT = [('heck', 44, 112), ('maschine', 112, 204), ('lager', 204, 268), ('mannschaft', 268, 360),
       ('zentrale', 360, 460), ('funk', 460, 524), ('bug', 524, 606)]
KOJEN = [(540, 0), (540, 1), (562, 0), (562, 1), (584, 0), (584, 1), (282, 0), (282, 1), (304, 0), (304, 1),
         (490, 0), (490, 1), (60, 0), (60, 1)]
WAND = [P['wand2'], '#383a2f', '#3b3a30', '#3a3b31', '#323a37', '#323739', '#383a30']


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
    # Reling
    for a, b in ((180, 740), (940, 1150)):
        g.r(a, 90, b - a, 1, P['metallHell'])
        for x in range(a, b + 1, 18):
            g.r(x, 90, 1, 6, P['metall'])
    # Turm
    for x in range(770, 886):
        top = 56
        if x < 790:
            top = 56 + (790 - x) * 2
        if x > 868:
            top = 56 + (x - 868) * 1
        g.r(x, top, 1, 100 - top, P['rumpfMitte'])
        g.px(x, top, P['rumpfKante']); g.px(x, top + 1, P['rumpfLicht'])
        g.r(x, top + 2, 1, 4, P['rumpfHell'])
        g.r(x, 92, 1, 8, P['rumpfDunkel'])
        g.px(x, top - 1, P['kontur'])
    g.r(769, 56, 1, 44, P['kontur']); g.r(886, 56, 1, 44, P['kontur'])
    # Turmbrüstung, Windabweiser
    g.r(780, 50, 96, 2, P['metall']); g.r(780, 50, 96, 1, P['metallHell'])
    for x in range(784, 876, 12):
        g.r(x, 52, 1, 4, P['metall'])
    g.r(792, 72, 64, 2, P['rumpfLicht'])
    for i in range(6):
        g.r(796 + i * 10, 78, 6, 4, P['kontur']); g.px(796 + i * 10, 78, P['rumpfTief'])
    # Turmnummer (eigene Kennung "U 7")
    for j, z in enumerate(['1001.1111', '1001.0001', '1001.0010', '1001.0100', '0110.0100']):
        for i, v in enumerate(z):
            if v == '1':
                g.r(828 + i * 2, 84 + j * 2, 2, 2, P['weissDunkel'])
    # Rost am Turm
    for k in range(5):
        xx = 774 + rnd.randint(0, 100)
        for y in range(60 + rnd.randint(0, 6), 60 + rnd.randint(14, 30)):
            g.px(xx, y, P['rost'])
    # Deckgeschuetz
    g.r(976, 88, 14, 8, P['metallDunkel']); g.r(978, 82, 10, 6, P['metall']); g.r(978, 82, 10, 1, P['metallHell'])
    g.r(988, 83, 28, 3, P['metall']); g.r(988, 83, 28, 1, P['metallHell']); g.r(1014, 82, 3, 5, P['metallDunkel'])
    g.r(980, 94, 10, 2, P['kontur'])
    # Heck: Ruder, Tiefenruder, Wellenbock (Schraube zeichnet das Spiel selbst bei x 24–33)
    g.r(6, 150, 8, 60, P['rumpfDunkel']); g.r(6, 150, 2, 60, P['rumpfHell']); g.r(5, 150, 1, 60, P['kontur'])
    g.r(13, 150, 1, 60, P['kontur']); g.r(6, 150, 8, 1, P['rumpfLicht'])
    g.r(16, 177, 26, 5, P['metall']); g.r(16, 177, 26, 1, P['metallHell']); g.r(16, 181, 26, 1, P['kontur'])
    g.r(30, 196, 30, 4, P['rumpfDunkel']); g.r(30, 196, 30, 1, P['rumpfLicht']); g.r(30, 199, 30, 1, P['kontur'])
    # Bug: Tiefenruder, Torpedoklappen
    g.r(1196, 194, 32, 4, P['rumpfDunkel']); g.r(1196, 194, 32, 1, P['rumpfLicht']); g.r(1196, 197, 32, 1, P['kontur'])
    for i in range(4):
        tx, ty = 1236 + (i % 2) * 6, 156 + (i // 2) * 28
        g.r(tx, ty, 9, 9, P['kontur']); g.r(tx + 1, ty + 1, 7, 7, P['rumpfTief']); g.r(tx + 1, ty + 1, 7, 1, P['rumpfHell'])
    # Netzabweiser am Bug

    if not innen:
        return g

    # ---------- Innenraum (Schnitt) ----------
    for i, (aid, a0, a1) in enumerate(ABT):
        x0, x1 = a0 * 2, a1 * 2
        w = x1 - x0
        base = WAND[i]
        g.r(x0, DECKE, w, BODEN - DECKE, base)
        # Spanten (Rippen) im Rumpfquerschnitt
        for x in range(x0 + 10, x1 - 4, 20):
            g.r(x, DECKE + 12, 3, BODEN - DECKE - 12, dark(base, 0.72))
            g.px(x, DECKE + 12, dark(base, 1.25))
            g.r(x + 3, DECKE + 12, 1, BODEN - DECKE - 12, dark(base, 0.85))
        # obere Wand heller (Licht von Lampen), unten dunkler
        g.r(x0, BODEN - 30, w, 30, '#0000002a')
        g.r(x0, BODEN - 12, w, 12, '#00000026')
        g.dither(x0, BODEN - 32, w, 2, '#00000033')
        # Kabelbaeume und Rohre an der Decke
        g.r(x0, DECKE, w, 3, P['rohrDunkel'])
        g.r(x0, DECKE + 3, w, 3, P['rohr']); g.r(x0, DECKE + 3, w, 1, P['rohrHell'])
        g.r(x0, DECKE + 6, w, 2, P['messing']); g.r(x0, DECKE + 6, w, 1, P['messingHell'])
        if i % 2 == 0:
            g.r(x0, DECKE + 8, w, 2, P['rot']); g.r(x0, DECKE + 8, w, 1, P['rotHell'])
        else:
            g.r(x0, DECKE + 8, w, 2, '#2f4a5a'); g.r(x0, DECKE + 8, w, 1, '#46697a')
        g.r(x0, DECKE + 10, w, 2, P['wand0'])
        for x in range(x0 + 12, x1 - 4, 26):
            g.r(x, DECKE, 2, 12, P['kontur'])  # Rohrschellen
        # Ventilraeder an der Decke
        for x in range(x0 + 30, x1 - 20, 70):
            g.circle(x, DECKE + 4, 3, P['rotHell'], ring=1); g.px(x, DECKE + 4, P['kontur'])
        g.r(x0, DECKE + 12, w, 2, '#0000004d')
        # Lampenkoerbe
        lx = [x0 + w / 3, x0 + 2 * w / 3] if w > 160 else [x0 + w / 2]
        for l in lx:
            xx = round(l) - 3
            g.r(xx, DECKE + 11, 7, 1, P['kontur']); g.r(xx + 1, DECKE + 12, 5, 4, P['lampe'])
            g.r(xx + 1, DECKE + 15, 5, 1, P['lampeWarm'])
            g.px(xx + 1, DECKE + 13, P['kontur']); g.px(xx + 5, DECKE + 13, P['kontur']); g.px(xx + 3, DECKE + 13, P['messing'])
            g.r(xx + 1, DECKE + 16, 5, 1, P['kontur'])
            # weicher Lichtkegel an der Wand (ins Bild gebacken, ganz leicht)
            for k in range(1, 30):
                a = int(22 * (1 - k / 30))
                g.r(xx + 3 - k // 2 - 2, DECKE + 16 + k, k + 5, 1, (255, 190, 110, a))
    # Boden mit Gitterrost, Bilge
    bx0, bx1 = 44 * 2, 606 * 2
    g.r(bx0, BODEN, bx1 - bx0, 6, P['boden'])
    for x in range(bx0, bx1, 4):
        g.r(x, BODEN + 1, 2, 4, P['rost_gitter'])
    g.r(bx0, BODEN, bx1 - bx0, 1, '#5d6660')
    g.r(bx0, BODEN + 6, bx1 - bx0, 10, P['bilge'])
    g.r(bx0, BODEN + 12, bx1 - bx0, 2, P['bilgeWasser'])
    g.dither(bx0, BODEN + 11, bx1 - bx0, 1, '#22484a')
    # Batterietroege unter dem Boden (Heck und Bug)
    for x in range(bx0 + 20, bx1 - 20, 16):
        if 440 < x < 1040:
            g.r(x, BODEN + 7, 10, 4, '#1f2622'); g.px(x + 2, BODEN + 7, P['rotHell']); g.px(x + 7, BODEN + 7, '#3c5c46')

    # Heckraum: E-Maschine, Welle
    g.r(90, 176, 60, 6, P['metallDunkel']); g.r(90, 176, 60, 1, P['metall'])  # Welle
    g.r(158, 184, 54, 36, P['metall'])
    g.r(158, 184, 54, 2, P['metallGlanz']); g.dither(158, 186, 54, 3, P['metallHell'])
    for x in range(162, 208, 3):
        g.r(x, 192, 1, 22, P['metallDunkel'])
    g.r(176, 198, 18, 8, P['kupfer']); g.r(176, 198, 18, 1, P['kupferHell'])
    g.r(158, 216, 54, 4, P['metallDunkel']); g.r(158, 219, 54, 1, P['kontur'])
    g.r(212, 198, 12, 6, P['messing']); g.r(212, 198, 12, 1, P['messingHell'])
    schrank(g, 166, 154, 38, 24)
    g.r(170, 158, 30, 8, '#14191a')
    for i in range(4):
        g.r(172 + i * 7, 171, 3, 2, P['rotHell'] if i % 2 else P['sonar4'])
    rundanzeige(g, 196, 162, 3)
    # Maschinenraum: zwei Diesel
    for x0 in (236, 328):
        g.r(x0, 184, 62, 36, P['metall'])
        g.r(x0, 184, 62, 2, P['metallGlanz']); g.dither(x0, 186, 62, 2, P['metallHell'])
        g.r(x0, 212, 62, 8, P['metallDunkel']); g.r(x0, 219, 62, 1, P['kontur'])
        g.r(x0 + 61, 184, 1, 36, P['kontur'])
        for k in range(6):
            kx = x0 + 4 + k * 10
            g.r(kx, 172, 7, 12, '#343a3f'); g.r(kx, 172, 7, 1, '#5b6166'); g.r(kx + 2, 167, 3, 5, '#262a2e')
            g.px(kx + 3, 166, P['rohrHell'])
        g.r(x0 - 2, 162, 66, 4, P['messing']); g.r(x0 - 2, 162, 66, 1, P['messingGlanz'])
        for k in range(6):
            g.r(x0 + 6 + k * 10, 166, 2, 6, P['messing'])
        for k in range(4):
            g.r(x0 + 8 + k * 14, 198, 8, 1, P['metallHell'])
        g.r(x0 + 4, 204, 54, 2, P['rostMitte'])  # Oelschmiere
        g.dither(x0 + 4, 206, 54, 2, P['rost'])
    # Maschinentelegraf (Posten Diesel x 320)
    g.r(318, 190, 4, 30, P['messing']); g.r(318, 190, 1, 30, P['messingGlanz'])
    g.circle(320, 182, 9, P['messingHell'], ring=1.2)
    g.circle(320, 182, 8, P['anzeige']); g.circle(320, 182, 8, P['messing'], ring=1)
    for k in range(5):
        w = math.pi + k * math.pi / 4
        g.px(round(320 + math.cos(w) * 6), round(182 + math.sin(w) * 6), '#4a4436')
    g.r(319, 176, 2, 6, P['rotHell'])
    # Laderaum: Regale (Kisten zeichnet das Spiel)
    for y in (168, 194):
        g.r(412, y, 120, 3, P['holzDunkel']); g.r(412, y, 120, 1, P['holzHell'])
    for x in (412, 470, 528):
        g.r(x, 158, 3, 62, P['holzDunkel']); g.px(x, 158, P['holz'])
    g.r(412, DECKE + 13, 120, 1, P['rohrDunkel'])  # Stange fuer Proviant
    # Mannschaftsraum: Kojen, Tisch, Kombuese
    g.r(632, 200, 48, 3, P['holz']); g.r(632, 200, 48, 1, P['holzHell'])
    g.r(636, 203, 2, 17, P['holzDunkel']); g.r(674, 203, 2, 17, P['holzDunkel'])
    g.r(626, 210, 9, 2, P['holz']); g.r(677, 210, 9, 2, P['holz'])
    g.r(642, 196, 4, 4, P['weiss']); g.r(646, 197, 1, 2, P['weiss'])  # Becher
    g.r(658, 197, 8, 3, P['metallHell']); g.r(659, 196, 6, 1, P['metallGlanz'])  # Teller
    g.r(668, 192, 2, 8, '#2f5a3a'); g.px(668, 191, '#4f7a5a')  # Flasche
    # Kombuese
    g.r(684, 190, 32, 30, '#4e5356'); g.r(684, 190, 32, 2, P['metallGlanz'])
    g.r(688, 196, 24, 10, '#1f2224'); g.r(690, 198, 20, 6, '#33373a')
    g.r(691, 203, 18, 1, P['rotHell'])  # Glut
    for k in range(3):
        g.r(690 + k * 7, 210, 4, 4, '#262a2c'); g.px(691 + k * 7, 211, P['messing'])
    g.r(688, 180, 10, 10, '#8a8f96'); g.r(688, 180, 10, 1, '#b4bac0'); g.r(698, 184, 2, 1, '#6a6f74')  # Topf
    g.r(700, 184, 11, 6, '#6a6f74'); g.r(700, 184, 11, 1, '#9aa0a6')  # Pfanne
    for k in range(4):
        g.r(686 + k * 8, 158, 1, 12, '#3a3a3a'); g.r(684 + k * 8, 170, 5, 3, P['metallHell'])  # Kellen
    # Wurst und Brot an der Decke
    for k in range(5):
        hx_ = 586 + k * 10
        g.r(hx_ + 1, DECKE + 13, 1, 4, '#4a3a2a')
        g.r(hx_, DECKE + 17, 3, 9 if k % 2 else 6, '#8a3f24' if k % 2 else '#a8743e')
    # Zentrale
    g.r(820, DECKE - 2, 8, 50, P['metall']); g.r(820, DECKE - 2, 2, 50, P['metallGlanz']); g.r(826, DECKE - 2, 2, 50, P['metallDunkel'])
    g.r(812, 188, 24, 6, P['metallHell']); g.r(812, 188, 24, 1, P['metallGlanz'])
    g.r(809, 189, 4, 4, P['kontur']); g.r(835, 189, 4, 4, P['kontur'])
    g.r(818, 180, 12, 8, P['metallDunkel']); g.r(820, 182, 8, 3, P['sonar0'])
    g.r(816, 194, 16, 3, P['metallDunkel']); g.r(822, 197, 4, 23, P['metallDunkel'])
    # Tiefensteuerstand mit Tiefenmesser (Zeiger zeichnet das Spiel bei 737/164)
    g.r(726, 150, 68, 38, '#262c2a'); g.r(726, 150, 68, 1, '#4a5450'); g.r(726, 187, 68, 1, P['kontur'])
    g.r(793, 150, 1, 38, P['kontur'])
    rundanzeige(g, 737, 164, 9)
    rundanzeige(g, 757, 162, 6)
    rundanzeige(g, 776, 162, 6)
    for i in range(6):
        g.r(730 + i * 10, 180, 6, 3, '#2f6b42' if i < 3 else '#6b2f2f')
        g.px(730 + i * 10, 180, P['sonar4'] if i < 3 else P['rotGlanz'])
    g.r(736, 196, 10, 24, '#343a3a'); g.r(736, 196, 10, 1, '#56605c')
    handrad(g, 741, 194, 7, P['messingHell'], P['messingGlanz'])
    handrad(g, 752, 202, 5, P['messingHell'], P['messingGlanz'])
    # Torpedo-Vorhalterechner (Schirm 762/190)
    g.r(758, 186, 22, 18, '#262c2a'); g.r(758, 186, 22, 1, '#4a5450')
    g.r(762, 190, 14, 7, P['sonar1']); g.r(762, 190, 14, 1, P['sonar2'])
    g.dither(762, 191, 14, 6, '#0d3a22')
    for k in range(3):
        g.r(763 + k * 5, 199, 3, 2, P['messing'])
    g.r(766, 204, 6, 16, '#343a3a')
    # Flutventile
    g.r(786, 178, 22, 42, '#343a3a'); g.r(786, 178, 22, 1, '#56605c')
    for k in range(8):
        cx = 790 + (k % 4) * 5; cy = 186 + (k // 4) * 10
        g.circle(cx, cy, 2, P['rotHell'] if k % 3 == 0 else '#2f8a4c', ring=None)
        g.px(cx, cy, P['kontur'])
    g.r(788, 206, 18, 1, P['messing'])
    # Seitenruder
    g.r(853, 200, 6, 20, P['metall']); handrad(g, 856, 192, 8, P['messingHell'], P['messingGlanz'])
    g.r(846, 166, 20, 12, '#1a1f1d'); g.r(848, 168, 16, 8, P['anzeige']); g.r(855, 168, 2, 8, P['rotHell'])
    for k in range(4):
        g.px(849 + k * 4, 175, '#4a4436')
    # Leiter zum Turm
    g.r(868, DECKE - 40, 2, 120, P['metall']); g.r(876, DECKE - 40, 2, 120, P['metall'])
    for y in range(DECKE - 40, BODEN, 8):
        g.r(868, y, 10, 2, P['metallHell'])
    g.r(864, DECKE, 18, 2, P['kontur'])
    # Turmluke-Schacht durch den Rumpf
    g.r(866, 100, 14, 40, '#141a1b'); g.r(866, 100, 1, 40, P['kontur']); g.r(879, 100, 1, 40, P['kontur'])
    g.r(868, DECKE - 40, 2, 40, P['metall']); g.r(876, DECKE - 40, 2, 40, P['metall'])
    for y in range(DECKE - 40, DECKE, 8):
        g.r(868, y, 10, 2, P['metallHell'])
    # Kartentisch mit Lampe
    g.r(880, 200, 32, 3, P['holz']); g.r(880, 200, 32, 1, P['holzHell'])
    g.r(882, 198, 28, 2, P['anzeige']); g.px(888, 198, '#3f6f8a'); g.px(894, 199, P['rotHell']); g.r(898, 198, 6, 1, '#3f6f8a')
    g.r(884, 203, 2, 17, P['holzDunkel']); g.r(906, 203, 2, 17, P['holzDunkel'])
    g.r(900, 176, 2, 22, P['metallDunkel']); g.r(896, 174, 10, 3, '#2f6b5a'); g.r(897, 177, 8, 1, P['lampe'])
    # Rotlicht (Gefechtsbeleuchtung) in der Zentrale
    g.r(790, DECKE + 11, 5, 3, P['rotHell']); g.px(791, DECKE + 11, P['rotGlanz'])
    # Funk- und Horchraum
    g.r(926, 200, 36, 3, P['holz']); g.r(926, 200, 36, 1, P['holzHell']); g.r(928, 203, 2, 17, P['holzDunkel'])
    g.r(928, 162, 32, 38, '#2b3235'); g.r(928, 162, 32, 1, '#4c5558')
    g.r(930, 164, 28, 4, '#1c2123')
    for k in range(6):
        g.r(933 + k * 4, 170, 2, 2, '#3a2a22')  # Funk-Laempchen (Spiel faerbt sie)
    for k in range(4):
        g.circle(934 + k * 7, 180, 2, P['metallHell'], ring=1); g.px(934 + k * 7, 180, P['kontur'])
    g.r(931, 186, 26, 4, P['sonar0']); g.r(932, 187, 10, 1, P['sonar3'])
    g.r(930, 192, 28, 1, P['messing'])
    g.r(944, 194, 8, 5, '#1d1d1d'); g.px(943, 194, '#1d1d1d'); g.px(952, 194, '#1d1d1d'); g.r(946, 193, 4, 1, P['metall'])  # Kopfhoerer
    g.r(932, 196, 6, 4, P['weiss']); g.hline(933, 197, 4, '#7a7464')  # Notizblock
    # Horchgeraet (Schirm 1023/184)
    g.r(1004, 200, 36, 3, P['holz']); g.r(1004, 200, 36, 1, P['holzHell']); g.r(1036, 203, 2, 17, P['holzDunkel'])
    g.r(1006, 168, 34, 32, '#2b3235'); g.r(1006, 168, 34, 1, '#4c5558')
    g.circle(1023, 184, 10, P['metallDunkel'])
    g.circle(1023, 184, 9, P['sonar1'])
    g.circle(1023, 184, 9, P['sonar2'], ring=1)
    g.circle(1023, 184, 5, P['sonar2'], ring=1)
    g.px(1023, 184, P['sonar4'])
    g.px(1029, 179, P['sonar5'])  # Kontakt
    g.r(1009, 170, 4, 2, P['messing']); g.r(1033, 170, 4, 2, P['messing'])
    handrad(g, 1012, 196, 3, P['messingHell'], P['messingGlanz'])
    # Bugraum: Torpedorohre, Haken, Kette
    g.r(1052, DECKE + 14, 140, 2, P['metallDunkel'])
    g.r(1120, DECKE + 16, 8, 4, P['metall']); g.r(1123, DECKE + 20, 1, 10, '#777777'); g.r(1121, DECKE + 30, 5, 2, '#777777')
    g.r(1192, 150, 20, 70, '#323937'); g.r(1192, 150, 1, 70, '#56605c')
    for i in range(4):
        tx, ty = 1194 + (i % 2) * 8, 152 + (i // 2) * 28
        g.r(tx, ty, 8, 22, '#212726'); g.r(tx + 1, ty + 1, 6, 20, '#2c3432')
        g.circle(tx + 4, ty + 10, 3, P['messingHell'], ring=1); g.px(tx + 4, ty + 10, P['kontur'])
        g.r(tx + 3, ty + 4, 2, 2, '#1a1a1a')  # Platz fuer Rohr-Lampe
    # Schotten mit Rundtuer-Rahmen (Tuerblaetter zeichnet das Spiel)
    for i in range(1, len(ABT)):
        x = ABT[i][1] * 2
        g.r(x - 4, DECKE, 8, BODEN - DECKE, '#2a312e')
        g.r(x - 4, DECKE, 1, BODEN - DECKE, '#46504b'); g.r(x + 3, DECKE, 1, BODEN - DECKE, P['kontur'])
        g.r(x - 5, 180, 10, 2, P['messing']); g.r(x - 5, 180, 10, 1, P['messingHell'])
    g.r(84, DECKE, 6, BODEN - DECKE, '#2a312e'); g.r(1210, DECKE, 6, BODEN - DECKE, '#2a312e')
    # Kojen (wie im Spiel)
    for kx, o in KOJEN:
        koje(g, kx * 2, o, o == 1 and kx in (60, 490))
    # Schatten an den Rumpfkanten innen
    for (aid, a0, a1) in ABT:
        pass
    g.r(88, DECKE, 3, BODEN - DECKE, '#00000055'); g.r(1207, DECKE, 3, BODEN - DECKE, '#00000055')
    return g


if __name__ == '__main__':
    import sys
    out = sys.argv[1]
    zeichne().save(out + '/boot_querschnitt.png')
    zeichne(innen=False).save(out + '/boot_aussen.png')
