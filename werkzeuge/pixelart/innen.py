"""Innenraum des Typ VIIC im Schnitt (Grafikpixel, 1320 x 300). Koordinaten passend zu js/daten.js."""
import math
from px import dark
from pal import P

DECKE, BODEN = 140, 220


def handrad(g, cx, cy, rad, c, hell):
    g.circle(cx, cy, rad, c, ring=1.3)
    for i in range(-rad + 1, rad):
        g.px(cx + i, cy, c); g.px(cx, cy + i, c)
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


def schrank(g, x, y, w, h, f=None):
    g.r(x, y, w, h, f or P['metallDunkel']); g.r(x, y, w, 1, P['metallHell'])
    g.r(x, y + h - 1, w, 1, P['kontur']); g.r(x + w - 1, y, 1, h, P['kontur'])


def torpedorohr_innen(g, x, y, lang=22):
    """Rohrverschluss (Bodenstueck) eines Torpedorohrs, von innen."""
    g.r(x, y, 8, lang, '#212726'); g.r(x + 1, y + 1, 6, lang - 2, '#2c3432')
    g.circle(x + 4, y + lang // 2, 3, P['messingHell'], ring=1); g.px(x + 4, y + lang // 2, P['kontur'])
    g.r(x + 3, y + 4, 2, 2, '#1a1a1a')


def innenraum(g, ABT, KOJEN, WAND, sehrohr):
    # Waende, Spanten, Rohre und Lampen je Abteil
    for i, (aid, a0, a1) in enumerate(ABT):
        x0, x1 = a0 * 2, a1 * 2
        w = x1 - x0
        base = WAND[i]
        g.r(x0, DECKE, w, BODEN - DECKE, base)
        for x in range(x0 + 10, x1 - 4, 20):
            g.r(x, DECKE + 12, 3, BODEN - DECKE - 12, dark(base, 0.72))
            g.px(x, DECKE + 12, dark(base, 1.25))
            g.r(x + 3, DECKE + 12, 1, BODEN - DECKE - 12, dark(base, 0.85))
        g.r(x0, BODEN - 30, w, 30, '#0000002a')
        g.r(x0, BODEN - 12, w, 12, '#00000026')
        g.dither(x0, BODEN - 32, w, 2, '#00000033')
        g.r(x0, DECKE, w, 3, P['rohrDunkel'])
        g.r(x0, DECKE + 3, w, 3, P['rohr']); g.r(x0, DECKE + 3, w, 1, P['rohrHell'])
        g.r(x0, DECKE + 6, w, 2, P['messing']); g.r(x0, DECKE + 6, w, 1, P['messingHell'])
        if i % 2 == 0:
            g.r(x0, DECKE + 8, w, 2, P['rot']); g.r(x0, DECKE + 8, w, 1, P['rotHell'])
        else:
            g.r(x0, DECKE + 8, w, 2, '#2f4a5a'); g.r(x0, DECKE + 8, w, 1, '#46697a')
        g.r(x0, DECKE + 10, w, 2, P['wand0'])
        for x in range(x0 + 12, x1 - 4, 26):
            g.r(x, DECKE, 2, 12, P['kontur'])
        for x in range(x0 + 30, x1 - 20, 70):
            g.circle(x, DECKE + 4, 3, P['rotHell'], ring=1); g.px(x, DECKE + 4, P['kontur'])
        g.r(x0, DECKE + 12, w, 2, '#0000004d')
        lx = [x0 + w / 3, x0 + 2 * w / 3] if w > 160 else [x0 + w / 2]
        for l in lx:
            xx = round(l) - 3
            g.r(xx, DECKE + 11, 7, 1, P['kontur']); g.r(xx + 1, DECKE + 12, 5, 4, P['lampe'])
            g.r(xx + 1, DECKE + 15, 5, 1, P['lampeWarm'])
            g.px(xx + 1, DECKE + 13, P['kontur']); g.px(xx + 5, DECKE + 13, P['kontur']); g.px(xx + 3, DECKE + 13, P['messing'])
            g.r(xx + 1, DECKE + 16, 5, 1, P['kontur'])
            for k in range(1, 30):
                a = int(22 * (1 - k / 30))
                g.r(xx + 3 - k // 2 - 2, DECKE + 16 + k, k + 5, 1, (255, 190, 110, a))
    # Boden mit Gitterrost, Bilge, Batterien unter dem Boden
    bx0, bx1 = ABT[0][1] * 2, ABT[-1][2] * 2
    g.r(bx0, BODEN, bx1 - bx0, 6, P['boden'])
    for x in range(bx0, bx1, 4):
        g.r(x, BODEN + 1, 2, 4, P['rost_gitter'])
    g.r(bx0, BODEN, bx1 - bx0, 1, '#5d6660')
    g.r(bx0, BODEN + 6, bx1 - bx0, 10, P['bilge'])
    g.r(bx0, BODEN + 12, bx1 - bx0, 2, P['bilgeWasser'])
    g.dither(bx0, BODEN + 11, bx1 - bx0, 1, '#22484a')
    # Batterie II unter dem U-Raum, Batterie I unter Offiziers- und Oberfeldwebelraum
    for (a, b) in ((452, 590), (824, 984)):
        for x in range(a, b, 14):
            g.r(x, BODEN + 7, 10, 4, '#1f2622'); g.px(x + 2, BODEN + 7, P['rotHell']); g.px(x + 7, BODEN + 7, '#3c5c46')

    # ---- Heck- und E-Maschinenraum (88–256): Heckrohr, 2 E-Maschinen, Koje ----
    g.r(88, 152, 18, 66, '#323937'); g.r(88, 152, 1, 66, '#56605c')
    torpedorohr_innen(g, 92, 160)
    g.r(96, 186, 10, 2, P['messing'])
    g.r(160, 176, 96, 6, P['metallDunkel']); g.r(160, 176, 96, 1, P['metall'])  # Welle
    for x0 in (172, 214):
        g.r(x0, 184, 38, 36, P['metall'])
        g.r(x0, 184, 38, 2, P['metallGlanz']); g.dither(x0, 186, 38, 3, P['metallHell'])
        for x in range(x0 + 3, x0 + 36, 3):
            g.r(x, 192, 1, 22, P['metallDunkel'])
        g.r(x0 + 10, 198, 18, 8, P['kupfer']); g.r(x0 + 10, 198, 18, 1, P['kupferHell'])
        g.r(x0, 216, 38, 4, P['metallDunkel']); g.r(x0, 219, 38, 1, P['kontur'])
    schrank(g, 186, 152, 52, 22)
    g.r(190, 156, 44, 8, '#14191a')
    for i in range(6):
        g.r(192 + i * 7, 168, 3, 2, P['rotHell'] if i % 2 else P['sonar4'])
    rundanzeige(g, 224, 160, 3)

    # ---- Dieselraum (256–448): zwei MAN-Diesel, Maschinentelegraf in der Mitte ----
    for x0 in (262, 364):
        g.r(x0, 184, 80, 36, P['metall'])
        g.r(x0, 184, 80, 2, P['metallGlanz']); g.dither(x0, 186, 80, 2, P['metallHell'])
        g.r(x0, 212, 80, 8, P['metallDunkel']); g.r(x0, 219, 80, 1, P['kontur'])
        g.r(x0 + 79, 184, 1, 36, P['kontur'])
        for k in range(6):
            kx = x0 + 4 + k * 13
            g.r(kx, 172, 9, 12, '#343a3f'); g.r(kx, 172, 9, 1, '#5b6166'); g.r(kx + 3, 167, 3, 5, '#262a2e')
            g.px(kx + 4, 166, P['rohrHell'])
        g.r(x0 - 2, 162, 84, 4, P['messing']); g.r(x0 - 2, 162, 84, 1, P['messingGlanz'])
        for k in range(6):
            g.r(x0 + 7 + k * 13, 166, 2, 6, P['messing'])
        for k in range(5):
            g.r(x0 + 8 + k * 15, 198, 8, 1, P['metallHell'])
        g.r(x0 + 4, 204, 72, 2, P['rostMitte'])
        g.dither(x0 + 4, 206, 72, 2, P['rost'])
    g.r(350, 190, 4, 30, P['messing']); g.r(350, 190, 1, 30, P['messingGlanz'])
    g.circle(352, 182, 9, P['messingHell'], ring=1.2)
    g.circle(352, 182, 8, P['anzeige']); g.circle(352, 182, 8, P['messing'], ring=1)
    for k in range(5):
        w = math.pi + k * math.pi / 4
        g.px(round(352 + math.cos(w) * 6), round(182 + math.sin(w) * 6), '#4a4436')
    g.r(351, 176, 2, 6, P['rotHell'])

    # ---- Unteroffiziersraum & Kombuese (448–594): Kombuese achtern, Kojen, Spind ----
    g.r(456, 190, 34, 30, '#4e5356'); g.r(456, 190, 34, 2, P['metallGlanz'])
    g.r(460, 196, 26, 10, '#1f2224'); g.r(462, 198, 22, 6, '#33373a')
    g.r(463, 203, 20, 1, P['rotHell'])
    for k in range(3):
        g.r(462 + k * 8, 210, 5, 4, '#262a2c'); g.px(463 + k * 8, 211, P['messing'])
    g.r(460, 180, 10, 10, '#8a8f96'); g.r(460, 180, 10, 1, '#b4bac0')
    g.r(472, 184, 11, 6, '#6a6f74'); g.r(472, 184, 11, 1, '#9aa0a6')
    for k in range(4):
        g.r(458 + k * 8, 158, 1, 12, '#3a3a3a'); g.r(456 + k * 8, 170, 5, 3, P['metallHell'])
    schrank(g, 580, 158, 12, 62, '#4a3f30')  # Spind
    g.r(582, 186, 8, 1, P['messing'])

    # ---- Zentrale (594–752): Tiefensteuerstand, Rechner, Ventile, Sehrohr, Ruder, Kartentisch, Leiter ----
    g.r(sehrohr, DECKE - 2, 8, 50, P['metall']); g.r(sehrohr, DECKE - 2, 2, 50, P['metallGlanz']); g.r(sehrohr + 6, DECKE - 2, 2, 50, P['metallDunkel'])
    g.r(sehrohr - 8, 188, 24, 6, P['metallHell']); g.r(sehrohr - 8, 188, 24, 1, P['metallGlanz'])
    g.r(sehrohr - 11, 189, 4, 4, P['kontur']); g.r(sehrohr + 15, 189, 4, 4, P['kontur'])
    g.r(sehrohr - 2, 180, 12, 8, P['metallDunkel']); g.r(sehrohr, 182, 8, 3, P['sonar0'])
    g.r(sehrohr - 4, 194, 16, 3, P['metallDunkel']); g.r(sehrohr + 2, 197, 4, 23, P['metallDunkel'])
    # Tiefensteuerstand (Zeiger bei 614/164 zeichnet das Spiel)
    g.r(600, 150, 52, 38, '#262c2a'); g.r(600, 150, 52, 1, '#4a5450'); g.r(600, 187, 52, 1, P['kontur'])
    rundanzeige(g, 614, 164, 9)
    rundanzeige(g, 634, 162, 6)
    for i in range(4):
        g.r(604 + i * 11, 180, 6, 3, '#2f6b42' if i < 2 else '#6b2f2f')
        g.px(604 + i * 11, 180, P['sonar4'] if i < 2 else P['rotGlanz'])
    handrad(g, 610, 202, 7, P['messingHell'], P['messingGlanz'])
    handrad(g, 600, 208, 5, P['messingHell'], P['messingGlanz'])
    # Torpedo-Vorhalterechner (Schirm 628/190)
    g.r(624, 186, 22, 18, '#262c2a'); g.r(624, 186, 22, 1, '#4a5450')
    g.r(628, 190, 14, 7, P['sonar1']); g.r(628, 190, 14, 1, P['sonar2'])
    for k in range(3):
        g.r(629 + k * 5, 199, 3, 2, P['messing'])
    g.r(632, 204, 6, 16, '#343a3a')
    # Flutventile (Tauchzellen)
    g.r(652, 178, 20, 42, '#343a3a'); g.r(652, 178, 20, 1, '#56605c')
    for k in range(8):
        cx = 655 + (k % 4) * 4; cy = 186 + (k // 4) * 10
        g.circle(cx, cy, 1, P['rotHell'] if k % 3 == 0 else '#2f8a4c')
    g.r(654, 206, 16, 1, P['messing'])
    # Leiter zum Turm, Turmluke
    g.r(696, DECKE - 40, 2, 120, P['metall']); g.r(704, DECKE - 40, 2, 120, P['metall'])
    for y in range(DECKE - 40, BODEN, 8):
        g.r(696, y, 10, 2, P['metallHell'])
    g.r(694, 100, 14, 40, '#141a1b'); g.r(694, 100, 1, 40, P['kontur']); g.r(707, 100, 1, 40, P['kontur'])
    g.r(696, DECKE - 40, 2, 40, P['metall']); g.r(704, DECKE - 40, 2, 40, P['metall'])
    for y in range(DECKE - 40, DECKE, 8):
        g.r(696, y, 10, 2, P['metallHell'])
    # Seitenruder
    g.r(709, 200, 6, 20, P['metall']); handrad(g, 712, 192, 8, P['messingHell'], P['messingGlanz'])
    g.r(702, 166, 20, 12, '#1a1f1d'); g.r(704, 168, 16, 8, P['anzeige']); g.r(711, 168, 2, 8, P['rotHell'])
    # Kartentisch
    g.r(724, 200, 26, 3, P['holz']); g.r(724, 200, 26, 1, P['holzHell'])
    g.r(726, 198, 22, 2, P['anzeige']); g.px(732, 198, '#3f6f8a'); g.px(738, 199, P['rotHell'])
    g.r(728, 203, 2, 17, P['holzDunkel']); g.r(744, 203, 2, 17, P['holzDunkel'])
    g.r(742, 176, 2, 22, P['metallDunkel']); g.r(738, 174, 10, 3, '#2f6b5a'); g.r(739, 177, 8, 1, P['lampe'])
    g.r(660, DECKE + 11, 5, 3, P['rotHell']); g.px(661, DECKE + 11, P['rotGlanz'])

    # ---- Funk- und Horchraum (752–820) ----
    g.r(756, 200, 30, 3, P['holz']); g.r(756, 200, 30, 1, P['holzHell'])
    g.r(758, 162, 30, 38, '#2b3235'); g.r(758, 162, 30, 1, '#4c5558')
    g.r(760, 164, 26, 4, '#1c2123')
    for k in range(6):
        g.r(763 + k * 4, 170, 2, 2, '#3a2a22')  # Funk-Laempchen (Spiel faerbt sie)
    for k in range(3):
        g.circle(765 + k * 8, 180, 2, P['metallHell'], ring=1); g.px(765 + k * 8, 180, P['kontur'])
    g.r(761, 186, 24, 4, P['sonar0']); g.r(762, 187, 10, 1, P['sonar3'])
    g.r(760, 192, 26, 1, P['messing'])
    g.r(770, 194, 8, 5, '#1d1d1d'); g.r(772, 193, 4, 1, P['metall'])
    # Horchgeraet (Schirm 802/184)
    g.r(790, 200, 28, 3, P['holz']); g.r(790, 200, 28, 1, P['holzHell'])
    g.r(790, 168, 28, 32, '#2b3235'); g.r(790, 168, 28, 1, '#4c5558')
    g.circle(802, 184, 10, P['metallDunkel'])
    g.circle(802, 184, 9, P['sonar1'])
    g.circle(802, 184, 9, P['sonar2'], ring=1)
    g.circle(802, 184, 5, P['sonar2'], ring=1)
    g.px(802, 184, P['sonar4']); g.px(808, 179, P['sonar5'])
    handrad(g, 813, 196, 3, P['messingHell'], P['messingGlanz'])
    for x in (792, 814):
        g.r(x, 203, 2, 17, P['holzDunkel'])

    # ---- Offiziersraum (820–910): Tisch zwischen den Kojen, Waschbecken ----
    g.r(858, 202, 14, 3, P['holz']); g.r(858, 202, 14, 1, P['holzHell']); g.r(864, 205, 2, 15, P['holzDunkel'])
    g.r(860, 198, 3, 4, P['weiss'])

    # ---- Oberfeldwebelraum (910–988): Spinde ----
    schrank(g, 912, 150, 6, 30, '#4a3f30')
    schrank(g, 982, 150, 6, 30, '#4a3f30')

    # ---- Bugtorpedoraum (988–1212): 4 Rohrverschluesse, Ladegeschirr, Kojen ----
    g.r(988, DECKE + 14, 204, 2, P['metallDunkel'])  # Laufschiene fuer das Ladegeschirr
    for hx in (1060, 1140):
        g.r(hx, DECKE + 16, 8, 4, P['metall']); g.r(hx + 3, DECKE + 20, 1, 10, '#777777'); g.r(hx + 1, DECKE + 30, 5, 2, '#777777')
    g.r(1192, 150, 20, 70, '#323937'); g.r(1192, 150, 1, 70, '#56605c')
    for i in range(4):
        torpedorohr_innen(g, 1194 + (i % 2) * 8, 152 + (i // 2) * 28)

    # ---- Schotten mit Rundtuer-Rahmen (Tuerblaetter zeichnet das Spiel) ----
    for i in range(1, len(ABT)):
        x = ABT[i][1] * 2
        g.r(x - 4, DECKE, 8, BODEN - DECKE, '#2a312e')
        g.r(x - 4, DECKE, 1, BODEN - DECKE, '#46504b'); g.r(x + 3, DECKE, 1, BODEN - DECKE, P['kontur'])
        g.r(x - 5, 180, 10, 2, P['messing']); g.r(x - 5, 180, 10, 1, P['messingHell'])
    g.r(bx0 - 4, DECKE, 6, BODEN - DECKE, '#2a312e'); g.r(bx1 - 2, DECKE, 6, BODEN - DECKE, '#2a312e')
    # ---- Kojen ----
    for kx, o, vorhang in KOJEN:
        koje(g, kx * 2, o, vorhang)
    g.r(bx0, DECKE, 3, BODEN - DECKE, '#00000055'); g.r(bx1 - 5, DECKE, 3, BODEN - DECKE, '#00000055')
