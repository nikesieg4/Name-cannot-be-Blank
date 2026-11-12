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


def haengematte(g, xf):
    """Hängematte im Bugraum (Mannschaft), hängt an zwei Haken unter der Decke."""
    for k in range(-17, 18):
        y = 166 + round(4 * (1 - (k / 17) ** 2))
        g.px(xf + k, y, P['stoff']); g.px(xf + k, y + 1, P['stoffHell'] if k % 3 else P['stoff']); g.px(xf + k, y + 2, '#3e3528')
    for d in (-18, 18):
        for k in range(10):
            g.px(xf + d + (1 if d < 0 else -1) * (k // 4), 156 + k, '#5a4a36')


def koje(g, xf, o, vorhang):
    if o == 2:
        return haengematte(g, xf)
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
    # Batterie II unter dem Unteroffiziersraum, Batterie I unter dem Offiziersraum (je 62 Zellen)
    for (a, b) in ((482, 588), (816, 966)):
        for x in range(a, b, 9):
            g.r(x, BODEN + 7, 7, 5, '#1f2622'); g.px(x + 1, BODEN + 7, P['rotHell']); g.px(x + 5, BODEN + 7, '#3c5c46')
    # Tauchzelle 3 unter der Zentrale (im Druckkörper)
    g.r(600, BODEN + 7, 140, 6, '#1d3340'); g.r(600, BODEN + 7, 140, 1, '#2f4f60')

    # ---- E-Maschinenraum (88–232): Heckrohr, 2 E-Maschinen auf den Wellen, Schaltpulte, Notruderstand ----
    g.r(88, 152, 18, 66, '#323937'); g.r(88, 152, 1, 66, '#56605c')
    torpedorohr_innen(g, 92, 160)
    g.r(96, 186, 10, 2, P['messing'])
    g.r(108, 176, 124, 6, P['metallDunkel']); g.r(108, 176, 124, 1, P['metall'])   # Wellen
    for x0 in (150, 192):
        g.r(x0, 184, 38, 36, P['metall'])
        g.r(x0, 184, 38, 2, P['metallGlanz']); g.dither(x0, 186, 38, 3, P['metallHell'])
        for x in range(x0 + 3, x0 + 36, 3):
            g.r(x, 192, 1, 22, P['metallDunkel'])
        g.r(x0 + 10, 198, 18, 8, P['kupfer']); g.r(x0 + 10, 198, 18, 1, P['kupferHell'])
        g.r(x0, 216, 38, 4, P['metallDunkel']); g.r(x0, 219, 38, 1, P['kontur'])
    schrank(g, 160, 150, 66, 24)                                   # Schaltpulte, Fahrschalter
    g.r(164, 154, 58, 8, '#14191a')
    for i in range(8):
        g.r(166 + i * 7, 166, 3, 2, P['rotHell'] if i % 2 else P['sonar4'])
    rundanzeige(g, 216, 158, 3)
    handrad(g, 128, 198, 6, P['messingHell'], P['messingGlanz'])   # Notruderstand
    g.r(126, 205, 4, 15, P['metallDunkel'])

    # ---- Dieselraum (232–422): zwei Diesel beidseitig des Mittelgangs, Maschinentelegraf ----
    for x0 in (240, 336):
        g.r(x0, 184, 78, 36, P['metall'])
        g.r(x0, 184, 78, 2, P['metallGlanz']); g.dither(x0, 186, 78, 2, P['metallHell'])
        g.r(x0, 212, 78, 8, P['metallDunkel']); g.r(x0, 219, 78, 1, P['kontur'])
        g.r(x0 + 77, 184, 1, 36, P['kontur'])
        for k in range(6):
            kx = x0 + 4 + k * 12
            g.r(kx, 172, 9, 12, '#343a3f'); g.r(kx, 172, 9, 1, '#5b6166'); g.r(kx + 3, 167, 3, 5, '#262a2e')
            g.px(kx + 4, 166, P['rohrHell'])
        g.r(x0 - 2, 162, 82, 4, P['messing']); g.r(x0 - 2, 162, 82, 1, P['messingGlanz'])
        for k in range(6):
            g.r(x0 + 7 + k * 12, 166, 2, 6, P['messing'])
        for k in range(5):
            g.r(x0 + 8 + k * 14, 198, 8, 1, P['metallHell'])
        g.r(x0 + 4, 204, 70, 2, P['rostMitte'])
        g.dither(x0 + 4, 206, 70, 2, P['rost'])
    g.r(326, 190, 4, 30, P['messing']); g.r(326, 190, 1, 30, P['messingGlanz'])
    g.circle(328, 182, 8, P['messingHell'], ring=1.2)
    g.circle(328, 182, 7, P['anzeige']); g.circle(328, 182, 7, P['messing'], ring=1)
    for k in range(5):
        w = math.pi + k * math.pi / 4
        g.px(round(328 + math.cos(w) * 5), round(182 + math.sin(w) * 5), '#4a4436')
    g.r(327, 177, 2, 5, P['rotHell'])

    # ---- Kombüse (422–478): zwei Kochplatten, kleiner Backofen, Kombüsenluk ----
    g.r(428, 190, 36, 30, '#4e5356'); g.r(428, 190, 36, 2, P['metallGlanz'])
    g.r(432, 196, 28, 10, '#1f2224'); g.r(434, 198, 24, 6, '#33373a')
    g.r(435, 203, 22, 1, P['rotHell'])
    for k in range(3):
        g.r(434 + k * 8, 210, 5, 4, '#262a2c'); g.px(435 + k * 8, 211, P['messing'])
    g.r(432, 180, 10, 10, '#8a8f96'); g.r(432, 180, 10, 1, '#b4bac0')
    g.r(446, 184, 11, 6, '#6a6f74'); g.r(446, 184, 11, 1, '#9aa0a6')
    for k in range(3):
        g.r(430 + k * 9, 158, 1, 12, '#3a3a3a'); g.r(428 + k * 9, 170, 5, 3, P['metallHell'])
    g.r(468, DECKE - 8, 2, 88, P['metall']); g.r(474, DECKE - 8, 2, 88, P['metall'])   # Leiter zum Kombüsenluk
    for y in range(DECKE - 8, BODEN, 8):
        g.r(468, y, 8, 2, P['metallHell'])

    # ---- Unteroffiziersraum (478–590): Kojen der Maate, Spind ----
    schrank(g, 572, 158, 12, 62, '#4a3f30')
    g.r(574, 186, 8, 1, P['messing'])

    # ---- Zentrale (590–746): Tiefenruderstand, Flutventile, Luftzielsehrohr, Vorhaltrechner-Anzeige, Turmluk, Rudergeber, Kartentisch ----
    g.r(sehrohr, DECKE - 2, 8, 50, P['metall']); g.r(sehrohr, DECKE - 2, 2, 50, P['metallGlanz']); g.r(sehrohr + 6, DECKE - 2, 2, 50, P['metallDunkel'])
    g.r(sehrohr - 8, 188, 24, 6, P['metallHell']); g.r(sehrohr - 8, 188, 24, 1, P['metallGlanz'])
    g.r(sehrohr - 11, 189, 4, 4, P['kontur']); g.r(sehrohr + 15, 189, 4, 4, P['kontur'])
    g.r(sehrohr - 2, 180, 12, 8, P['metallDunkel']); g.r(sehrohr, 182, 8, 3, P['sonar0'])
    g.r(sehrohr - 4, 194, 16, 3, P['metallDunkel']); g.r(sehrohr + 2, 197, 4, 23, P['metallDunkel'])
    # Tiefenruderstand mit Tiefenmanometer (Zeiger bei 610/164 zeichnet das Spiel) und Neigungsanzeiger
    g.r(596, 150, 32, 38, '#262c2a'); g.r(596, 150, 32, 1, '#4a5450'); g.r(596, 187, 32, 1, P['kontur'])
    rundanzeige(g, 610, 164, 9)
    g.r(600, 178, 22, 3, P['anzeige']); g.px(611, 178, P['rotHell'])        # Trimm-Libelle
    handrad(g, 604, 202, 6, P['messingHell'], P['messingGlanz'])
    handrad(g, 618, 208, 5, P['messingHell'], P['messingGlanz'])
    # Flut-, Entlüftungs- und Anblaseventile
    g.r(630, 176, 22, 44, '#343a3a'); g.r(630, 176, 22, 1, '#56605c')
    for k in range(10):
        cx = 634 + (k % 4) * 5; cy = 184 + (k // 4) * 9
        g.circle(cx, cy, 1, P['rotHell'] if k % 3 == 0 else '#2f8a4c')
    g.r(632, 210, 18, 1, P['messing'])
    # Anzeige des Vorhaltrechners (Rechner steht im Turm; Schirm bei 674/190)
    g.r(670, 186, 22, 18, '#262c2a'); g.r(670, 186, 22, 1, '#4a5450')
    g.r(674, 190, 14, 7, P['sonar1']); g.r(674, 190, 14, 1, P['sonar2'])
    for k in range(3):
        g.r(675 + k * 5, 199, 3, 2, P['messing'])
    g.r(678, 204, 6, 16, '#343a3a')
    # Leiter durch das Turmluk in den Turm
    g.r(696, DECKE - 40, 2, 120, P['metall']); g.r(704, DECKE - 40, 2, 120, P['metall'])
    for y in range(DECKE - 40, BODEN, 8):
        g.r(696, y, 10, 2, P['metallHell'])
    g.r(694, 100, 14, 40, '#141a1b'); g.r(694, 100, 1, 40, P['kontur']); g.r(707, 100, 1, 40, P['kontur'])
    g.r(696, DECKE - 40, 2, 40, P['metall']); g.r(704, DECKE - 40, 2, 40, P['metall'])
    for y in range(DECKE - 40, DECKE, 8):
        g.r(696, y, 10, 2, P['metallHell'])
    # Rudergeber / Tochterkompass
    g.r(717, 200, 6, 20, P['metall']); handrad(g, 720, 192, 7, P['messingHell'], P['messingGlanz'])
    g.r(710, 166, 20, 12, '#1a1f1d'); g.r(712, 168, 16, 8, P['anzeige']); g.r(719, 168, 2, 8, P['rotHell'])
    # Kartentisch mit Kreiselkompass
    g.r(726, 200, 18, 3, P['holz']); g.r(726, 200, 18, 1, P['holzHell'])
    g.r(727, 198, 16, 2, P['anzeige']); g.px(731, 198, '#3f6f8a'); g.px(736, 199, P['rotHell'])
    g.r(728, 203, 2, 17, P['holzDunkel']); g.r(740, 203, 2, 17, P['holzDunkel'])
    g.r(738, 176, 2, 22, P['metallDunkel']); g.r(734, 174, 10, 3, '#2f6b5a'); g.r(735, 177, 8, 1, P['lampe'])
    g.r(660 + 20, DECKE + 11, 5, 3, P['rotHell']); g.px(661 + 20, DECKE + 11, P['rotGlanz'])

    # ---- Kommandant, Funk- und Horchraum (746–812) ----
    g.r(750, 200, 30, 3, P['holz']); g.r(750, 200, 30, 1, P['holzHell'])
    g.r(752, 162, 30, 38, '#2b3235'); g.r(752, 162, 30, 1, '#4c5558')
    g.r(754, 164, 26, 4, '#1c2123')
    for k in range(6):
        g.r(757 + k * 4, 170, 2, 2, '#3a2a22')  # Funk-Lämpchen (Spiel färbt sie)
    for k in range(3):
        g.circle(759 + k * 8, 180, 2, P['metallHell'], ring=1); g.px(759 + k * 8, 180, P['kontur'])
    g.r(755, 186, 24, 4, P['sonar0']); g.r(756, 187, 10, 1, P['sonar3'])
    g.r(754, 192, 26, 1, P['messing'])
    g.r(762, 194, 8, 5, '#1d1d1d'); g.r(764, 193, 4, 1, P['metall'])
    # Gruppenhorchgerät (Schirm 796/200) unter der Kommandantenkoje
    g.r(783, 188, 27, 26, '#2b3235'); g.r(783, 188, 27, 1, '#4c5558')
    g.circle(796, 200, 9, P['metallDunkel'])
    g.circle(796, 200, 8, P['sonar1'])
    g.circle(796, 200, 8, P['sonar2'], ring=1)
    g.circle(796, 200, 4, P['sonar2'], ring=1)
    g.px(796, 200, P['sonar4'])
    handrad(g, 806, 212, 3, P['messingHell'], P['messingGlanz'])
    g.r(784, 214, 2, 6, P['holzDunkel']); g.r(808, 214, 2, 6, P['holzDunkel'])

    # ---- Offiziersraum (812–968): Klapptisch als Messe, Spind ----
    g.r(896, 202, 20, 3, P['holz']); g.r(896, 202, 20, 1, P['holzHell']); g.r(905, 205, 2, 15, P['holzDunkel'])
    g.r(900, 198, 3, 4, P['weiss']); g.r(908, 199, 4, 3, P['metallHell'])
    schrank(g, 960, 150, 6, 30, '#4a3f30')

    # ---- Bugtorpedoraum (968–1212): vier Rohrverschlüsse, Ladegeschirr, Kojen und Hängematten ----
    g.r(970, DECKE + 14, 222, 2, P['metallDunkel'])
    for hx_ in (1080, 1160):
        g.r(hx_, DECKE + 16, 8, 4, P['metall']); g.r(hx_ + 3, DECKE + 20, 1, 10, '#777777'); g.r(hx_ + 1, DECKE + 30, 5, 2, '#777777')
    g.r(1192, 150, 20, 70, '#323937'); g.r(1192, 150, 1, 70, '#56605c')
    for i in range(4):
        torpedorohr_innen(g, 1194 + (i % 2) * 8, 152 + (i // 2) * 28)
    # Laderinne
    g.r(1158, 214, 34, 3, P['metall']); g.r(1158, 214, 34, 1, P['metallHell'])

    # ---- Schotten mit Rundtuer-Rahmen (Tuerblaetter zeichnet das Spiel) ----
    for i in range(1, len(ABT)):
        x = ABT[i][1] * 2
        if ABT[i][0] in ('zentrale', 'funk'):   # Kugelschotten vor und hinter der Zentrale
            g.r(x - 6, DECKE, 12, BODEN - DECKE, '#262c29')
            g.circle(x, 186, 9, P['metall'], ring=2); g.r(x - 6, DECKE, 1, BODEN - DECKE, '#46504b')
        g.r(x - 4, DECKE, 8, BODEN - DECKE, '#2a312e')
        g.r(x - 4, DECKE, 1, BODEN - DECKE, '#46504b'); g.r(x + 3, DECKE, 1, BODEN - DECKE, P['kontur'])
        g.r(x - 5, 180, 10, 2, P['messing']); g.r(x - 5, 180, 10, 1, P['messingHell'])
    g.r(bx0 - 4, DECKE, 6, BODEN - DECKE, '#2a312e'); g.r(bx1 - 2, DECKE, 6, BODEN - DECKE, '#2a312e')
    # ---- Kojen ----
    for kx, o, vorhang in KOJEN:
        koje(g, kx * 2, o, vorhang)
    g.r(bx0, DECKE, 3, BODEN - DECKE, '#00000055'); g.r(bx1 - 5, DECKE, 3, BODEN - DECKE, '#00000055')
