"""Boot-Querschnitt 1320 x 300 – Typ VII C nach dem Handbuch (Seitenansicht, Heck links, Bug rechts).
Einhüllen-Boot: druckfester Zylinder (Druckkörper 50,5 m) mit acht Abteilungen, darüber die nicht
druckfeste Außenhülle mit Oberdeck, Bug und Heck mit Tauchzelle 1 und 5, seitlich die Satteltanks,
Turm mit Wintergarten und 2-cm-Flak, 8,8-cm-Geschütz vor dem Turm, GHG unter dem Vorschiff.
Koordinaten passend zu js/daten.js (ABTEILE, KOJEN, ANKER)."""
import math, random
from px import Can, hx, dark, mix
from pal import P

GB, GH = 1320, 300
DECKE, BODEN = 140, 220
# Druckkörper (Grafikpixel): Innenraum 88–1212, oben 128, unten 252
DK_X0, DK_X1, DK_OBEN, DK_UNTEN = 84, 1216, 128, 252
ABT = [('heck', 44, 116), ('diesel', 116, 211), ('kombuese', 211, 239), ('uraum', 239, 295),
       ('zentrale', 295, 373), ('funk', 373, 406), ('offiziere', 406, 484), ('bug', 484, 606)]
# (x, o, vorhang)  o: 0 unten, 1 oben, 2 Hängematte
KOJEN = [(252, 0, 0), (252, 1, 0), (274, 0, 0), (274, 1, 0), (396, 1, 1),
         (418, 0, 0), (418, 1, 0), (437, 0, 0), (437, 1, 0), (470, 0, 0), (470, 1, 0),
         (498, 0, 0), (498, 1, 0), (516, 0, 0), (516, 1, 0), (534, 0, 0), (534, 1, 0), (552, 0, 0), (552, 1, 0),
         (570, 0, 0), (570, 1, 0), (507, 2, 0), (561, 2, 0)]
WAND = [P['wand2'], '#383a2f', '#3e3b31', '#3a3b31', '#323a37', '#323739', '#363a33', '#383a30']
TURM0, TURM1 = 610, 740
SEHROHR = 660


def deck_y(x):
    """Oberkante der Außenhülle (Oberdeck), Bug mit leichtem Sprung."""
    if x < 120:
        return 100 + 50 * ((120 - x) / 96) ** 1.6
    if x <= 1200:
        return 100 - 6 * max(0, (x - 1000) / 200) ** 2
    return 94 + 74 * ((x - 1200) / 106) ** 1.6


def kiel_y(x):
    """Unterkante: Druckkörper, Satteltanks mittschiffs, aufgekimmtes Heck und Bug."""
    y = DK_UNTEN
    t = (x - 670) / 380
    if abs(t) < 1:
        y += 24 * math.sqrt(1 - t * t)
    if x < 200:
        y = DK_UNTEN - 47 * ((200 - x) / 170) ** 1.5
    if x > 1100:
        y = DK_UNTEN - 80 * ((x - 1100) / 206) ** 1.8
    return y


def zeichne(innen=True):
    g = Can(GB, GH)
    rnd = random.Random(7)
    # ---------- Außenhülle ----------
    for x in range(24, 1307):
        o, u = round(deck_y(x)), round(kiel_y(x))
        if u <= o:
            continue
        hh = u - o
        g.r(x, o, 1, hh, P['rumpf'])
        g.r(x, o, 1, 2, P['rumpfKante'])
        g.r(x, o + 2, 1, 3, P['rumpfLicht'])
        g.r(x, o + 5, 1, 5, P['rumpfHell'])
        g.r(x, u - 18, 1, 18, P['rumpfDunkel'])
        g.r(x, u - 6, 1, 6, P['rumpfTief'])
        for k in range(4):
            if (x + k) % 2:
                g.px(x, u - 19 - k * 2, P['rumpfDunkel'])
        g.px(x, o - 1, P['kontur']); g.px(x, u, P['kontur'])
        # Flutschlitze im Oberdeck (nicht druckfeste Außenhülle)
        if 140 < x < 1180 and x % 10 < 4:
            g.r(x, o + 9, 1, 2, P['kontur'])
        # Plattenstöße mit Nieten
        if x % 44 == 0:
            g.r(x, o + 4, 1, hh - 6, P['kontur']); g.r(x + 1, o + 4, 1, hh - 6, P['rumpfHell'])
        if x % 44 in (3, 41):
            for yy in range(o + 6, u - 4, 6):
                g.px(x, yy, P['niete']); g.px(x, yy + 1, P['nieteDunkel'])
        if x % 44 in (5, 6, 39) and rnd.random() < 0.5:
            ln = rnd.randint(6, 18); yy = o + 8 + rnd.randint(0, 20)
            for k in range(ln):
                g.px(x, yy + k, P['rostMitte'] if k < ln // 2 else P['rost'])
    # Satteltanks (Tauchzelle 2 und 4) seitlich am Druckkörper: helles Oval mittschiffs
    for x in range(292, 1049):
        t = (x - 670) / 380
        if abs(t) >= 1:
            continue
        unten = round(kiel_y(x)) - 1
        oben = round(206 - 30 * math.sqrt(1 - t * t) + 30)
        g.r(x, oben, 1, unten - oben, P['rumpfMitte'])
        g.px(x, oben, P['rumpfKante']); g.px(x, oben + 1, P['rumpfLicht'])
        g.r(x, unten - 8, 1, 8, P['rumpfDunkel'])
        if x % 3 == 0:
            g.px(x, oben + 12, P['kontur'])        # Flutschlitze im Satteltank
        if x % 44 == 22:
            g.r(x, oben + 2, 1, unten - oben - 4, P['kontur'])
    # Flutlöcher an der Unterkante von Tauchzelle 1 (Bug) und 5 (Heck)
    for x in list(range(1222, 1290, 9)) + list(range(40, 80, 9)):
        y = round(kiel_y(x)) - 5
        g.r(x, y, 5, 2, P['kontur'])
    # Druckkörper-Enden (gestrichelt) in Bug und Heck
    for x in range(DK_X0 - 16, DK_X0 + 4):
        if x % 3: g.px(x, DK_OBEN + (DK_X0 - x) // 2, P['rumpfTief'])
    for x in range(DK_X1 - 4, DK_X1 + 16):
        if x % 3: g.px(x, DK_OBEN + (x - DK_X1) // 2, P['rumpfTief'])
    # Kiel
    for x in range(260, 1080):
        u = round(kiel_y(x))
        g.r(x, u + 1, 1, 2, P['rumpfTief']); g.px(x, u + 3, P['kontur'])

    # ---------- Turm mit Wintergarten ----------
    for x in range(TURM0 - 26, TURM1 + 14):
        if x < TURM0:
            top = 70 + (TURM0 - x) // 4          # Wintergarten, niedriger
        elif x > TURM1 - 12:
            top = 56 + (x - (TURM1 - 12)) * 2    # abgerundete Turmfront
        else:
            top = 56
        bot = round(deck_y(x))
        if top >= bot:
            continue
        g.r(x, top, 1, bot - top, P['rumpfMitte'])
        g.px(x, top, P['rumpfKante']); g.px(x, top + 1, P['rumpfLicht'])
        g.r(x, top + 2, 1, 4, P['rumpfHell'])
        g.r(x, bot - 6, 1, 6, P['rumpfDunkel'])
        g.px(x, top - 1, P['kontur'])
    g.r(TURM0 - 27, 70, 1, 30, P['kontur'])
    # Brückenbrüstung, Windabweiser, Fenster
    g.r(TURM0 + 2, 50, TURM1 - TURM0 - 10, 2, P['metall']); g.r(TURM0 + 2, 50, TURM1 - TURM0 - 10, 1, P['metallHell'])
    for x in range(TURM0 + 6, TURM1 - 10, 12):
        g.r(x, 52, 1, 4, P['metall'])
    g.r(TURM0 + 14, 72, 70, 2, P['rumpfLicht'])
    for i in range(6):
        g.r(TURM0 + 20 + i * 10, 78, 6, 4, P['kontur']); g.px(TURM0 + 20 + i * 10, 78, P['rumpfTief'])
    # Sehrohrböcke
    g.r(SEHROHR - 3, 40, 14, 16, P['rumpfMitte']); g.px(SEHROHR - 3, 40, P['rumpfKante'])
    g.r(SEHROHR + 30, 46, 8, 10, P['rumpfMitte'])
    # 2-cm-Flak auf dem Wintergarten
    g.r(TURM0 - 20, 60, 10, 10, P['metallDunkel']); g.r(TURM0 - 18, 56, 6, 4, P['metall'])
    for k in range(14):
        g.px(TURM0 - 10 + k, 56 - k // 3, P['metallHell'])
    # Turmkennung
    for j, z in enumerate(['1001.1111', '1001.0001', '1001.0010', '1001.0100', '0110.0100']):
        for i, v in enumerate(z):
            if v == '1':
                g.r(TURM0 + 52 + i * 2, 84 + j * 2, 2, 2, P['weissDunkel'])
    for k in range(5):
        xx = TURM0 + rnd.randint(0, TURM1 - TURM0 - 14)
        for y in range(60 + rnd.randint(0, 6), 60 + rnd.randint(14, 30)):
            g.px(xx, y, P['rost'])

    # ---------- 8,8-cm-Geschütz vor dem Turm ----------
    gx = TURM1 + 56
    g.r(gx, 86, 16, 10, P['metallDunkel']); g.r(gx + 2, 78, 14, 8, P['metall']); g.r(gx + 2, 78, 14, 1, P['metallHell'])
    g.r(gx + 14, 79, 40, 3, P['metall']); g.r(gx + 14, 79, 40, 1, P['metallHell']); g.r(gx + 52, 78, 3, 5, P['metallDunkel'])
    g.r(gx + 4, 94, 12, 2, P['kontur'])
    # Netzabweiser / Antennendraht: Bug – Turm – Heck
    for (x0, y0, x1, y1) in ((1296, 150, TURM1 + 2, 44), (TURM0 - 26, 62, 40, 138)):
        n = abs(x1 - x0)
        for k in range(0, n, 2):
            t = k / n
            xx = round(x0 + (x1 - x0) * t); yy = round(y0 + (y1 - y0) * t + 6 * math.sin(math.pi * t))
            g.px(xx, yy, P['metallHell'])
    # Luken im Oberdeck: Torpedoluk vorn, Kombüsenluk, Torpedoluk achtern
    for lx in (1120, 452, 150):
        y = round(deck_y(lx))
        g.r(lx, y - 2, 14, 2, P['metallDunkel']); g.r(lx, y - 2, 14, 1, P['metallHell'])
    # Oberdeckbehälter (Klappen)
    for cx in (TURM0 - 120, TURM1 + 150):
        y = round(deck_y(cx))
        g.r(cx, y - 1, 60, 1, P['kontur']); g.px(cx, y - 2, P['rumpfKante']); g.px(cx + 59, y - 2, P['rumpfKante'])

    # ---------- Heck: Doppelruder, Tiefenruder (Schrauben zeichnet das Spiel) ----------
    g.r(8, 160, 8, 62, P['rumpfDunkel']); g.r(8, 160, 2, 62, P['rumpfHell']); g.r(7, 160, 1, 62, P['kontur'])
    g.r(15, 160, 1, 62, P['kontur']); g.r(8, 160, 8, 1, P['rumpfLicht'])
    g.r(18, 181, 30, 4, P['metall']); g.r(18, 181, 30, 1, P['metallHell']); g.r(18, 184, 30, 1, P['kontur'])
    g.r(30, 198, 34, 4, P['rumpfDunkel']); g.r(30, 198, 34, 1, P['rumpfLicht']); g.r(30, 201, 34, 1, P['kontur'])
    # Heckrohr-Mündung
    g.r(38, 172, 9, 9, P['kontur']); g.r(39, 173, 7, 7, P['rumpfTief']); g.r(39, 173, 7, 1, P['rumpfHell'])
    # ---------- Bug: Tiefenruder, vier Mündungsklappen, Gruppenhorchgerät ----------
    g.r(1188, 196, 36, 4, P['rumpfDunkel']); g.r(1188, 196, 36, 1, P['rumpfLicht']); g.r(1188, 199, 36, 1, P['kontur'])
    for i in range(4):
        tx, ty = 1262 + (i % 2) * 8, 166 + (i // 2) * 18
        g.r(tx, ty, 8, 8, P['kontur']); g.r(tx + 1, ty + 1, 6, 6, P['rumpfTief']); g.r(tx + 1, ty + 1, 6, 1, P['rumpfHell'])
    for k in range(7):
        gx_ = 1140 + k * 10
        gy = round(kiel_y(gx_)) - 4
        g.circle(gx_, gy, 2, P['rumpfKante'], ring=1)

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
