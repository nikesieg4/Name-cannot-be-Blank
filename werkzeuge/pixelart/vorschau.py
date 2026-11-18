"""Vorschaubild für Spieleportale: U-Boot auf Sehrohrtiefe, das Sehrohr durchbricht die Oberfläche,
am Horizont ein Frachter in der Abenddämmerung.

grafik/vorschau.png        512 × 512 (quadratische Kachel, 1×1 und 2×2)
grafik/vorschau_breit.png 1024 × 512 (breite Kachel 2×1, Hintergrund „Fenster zu klein“)

Gezeichnet in 128 × 128 bzw. 256 × 128 Pixeln und 4-fach ohne Glättung vergrößert.
Die wichtigen Teile liegen im mittleren Band (y 32–96), damit auch ein Zuschnitt auf 2:1 trägt.
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(__file__))
from px import Can, mix, hx  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'grafik')

HIMMEL = ['#0b1430', '#1b2350', '#3a2f63', '#6b3f68', '#a8545e', '#de7d4f', '#f3b25a']
WASSER_OBEN = '#2e7a86'
WASSER_UNTEN = '#030a12'


def verlauf(farben, t):
    t = max(0.0, min(0.9999, t))
    i = int(t * (len(farben) - 1))
    return mix(farben[i], farben[i + 1], t * (len(farben) - 1) - i)


def szene(W, H, seed=7):
    rnd = random.Random(seed)
    c = Can(W, H)
    WL = 46                      # Wasserlinie
    mx = W // 2                  # Bildmitte
    # --- Himmel: Abenddämmerung, nach unten heller und wärmer
    for y in range(WL):
        t = y / WL
        for x in range(W):
            f = verlauf(HIMMEL, t ** 1.35)
            # grobe Farbbänder mit Schachbrett-Übergang (Pixel-Look)
            if (x + y) % 2 and y % 4 == 3:
                f = verlauf(HIMMEL, ((y + 1) / WL) ** 1.35)
            c.px(x, y, f)
    # Sterne oben
    for _ in range(W // 6):
        x, y = rnd.randrange(W), rnd.randrange(0, 16)
        c.px(x, y, '#e8ecff' if rnd.random() < 0.4 else '#8f97c8')
    # Sonne halb hinter der Kimm (links)
    sx = int(W * 0.24)
    for y in range(-9, 1):
        for x in range(-9, 10):
            if x * x + y * y <= 81:
                c.px(sx + x, WL - 1 + y, '#ffd27a' if x * x + y * y < 45 else '#ffb45e')
    # Wolkenstreifen
    for (wx, wy, wl) in [(0.08, 13, 0.30), (0.55, 9, 0.38), (0.7, 21, 0.25), (0.18, 26, 0.2)]:
        x0 = int(W * wx)
        lang = int(W * wl)
        c.r(x0, wy, lang, 1, '#c86a63')
        c.r(x0 + 3, wy + 1, lang - 8, 1, '#8c4c66')

    # --- Frachter am Horizont (Silhouette) mit Rauchfahne, rechts der Sonne
    fx = int(W * 0.07) if W > H else 6
    fl = 34
    by = WL - 1
    sil = '#1a1426'
    c.r(fx + 2, by - 3, fl - 4, 3, sil)          # Rumpf
    c.r(fx, by - 4, 5, 2, sil)                   # Heck
    c.r(fx + fl - 5, by - 5, 5, 3, sil)          # Bug
    c.r(fx + 13, by - 7, 8, 4, sil)              # Brückenhaus
    c.r(fx + 15, by - 9, 4, 2, sil)
    c.r(fx + 16, by - 12, 2, 3, sil)             # Schornstein
    c.vline(fx + 7, by - 12, 9, sil)             # Masten
    c.vline(fx + 27, by - 12, 9, sil)
    c.hline(fx + 5, by - 9, 5, sil)
    c.hline(fx + 25, by - 9, 5, sil)
    for k in range(9):                           # Rauch zieht nach links
        c.r(fx + 15 - k * 2, by - 14 - (k // 2), 3, 2, mix('#3b3046', HIMMEL[3], k / 10)[:3] + (int(220 - k * 18),))

    # --- Oberfläche mit Wellen und Sonnenglitzern
    for x in range(W):
        c.px(x, WL, '#c7d9d6' if (x // 3) % 3 == 0 else '#7bb3b5')
        c.px(x, WL + 1, '#4e9aa3' if (x // 2) % 4 else '#9ccbc8')
    for k in range(18):
        gx = sx + rnd.randint(-10, 10)
        c.hline(gx, WL + 1 + rnd.randint(0, 1), rnd.randint(1, 3), '#ffd27a')

    # --- Unter Wasser: Verlauf, Lichtfinger
    for y in range(WL + 2, H):
        t = (y - WL) / (H - WL)
        f = mix(WASSER_OBEN, WASSER_UNTEN, t ** 0.7)
        for x in range(W):
            g = f
            if y % 3 == 0 and (x + y) % 2 == 0:
                g = mix(WASSER_OBEN, WASSER_UNTEN, min(1, ((y + 2 - WL) / (H - WL))) ** 0.7)
            c.px(x, y, g)
    for k in range(6 if W > H else 4):
        x0 = int(W * (0.12 + k * 0.17)) + rnd.randint(-4, 4)
        for y in range(WL + 2, H - 20):
            t = (y - WL) / (H - WL)
            a = int(46 * (1 - t))
            for w in range(4):
                c.px(x0 + w - int((y - WL) * 0.45), y, (150, 220, 215, a))

    # --- Meeresgrund
    for x in range(W):
        h = 10 + int(3 * math.sin(x / 9) + 2 * math.sin(x / 4.3 + 1))
        for y in range(H - h, H):
            d = y - (H - h)
            f = '#2a3a33' if d == 0 else ('#1a2621' if (x + y) % 3 else '#22302a') if d < 4 else '#121a17'
            c.px(x, y, f)
    for _ in range(W // 10):                     # Steine
        x = rnd.randrange(W)
        c.r(x, H - 12 + rnd.randint(0, 4), rnd.randint(2, 4), 2, '#334139')
    for _ in range(W // 18):                     # Seegras
        x = rnd.randrange(W)
        hh = rnd.randint(6, 13)
        for y in range(hh):
            c.px(x + int(math.sin(y / 2.5) * 1.2), H - 10 - y, '#2c6a4a' if y % 3 else '#3f8a5e')

    # --- U-Boot Typ VII C in Seitenansicht, Bug rechts, auf Sehrohrtiefe
    L = 92
    x0 = mx - L // 2 + 2
    dy = 66                                      # Oberdeck
    kontur, dunkel, mitte, hell, licht = '#05090c', '#13201f', '#203230', '#33504b', '#5f8a7f'
    ober, unter = {}, {}
    for i in range(L):
        t = i / (L - 1)
        # Rumpf unten: Druckkörper mit Satteltanks in der Mitte, spitz an den Enden
        prof = max(0.0, 1 - abs(2 * t - 1) ** 3.2)
        sattel = 1.6 if 0.3 < t < 0.68 else 0
        unter[i] = dy + 2 + int(round(9.5 * math.sqrt(prof) + sattel))
        # Oberdeck: leichter Sprung zum Bug, Heck flach abfallend
        ober[i] = dy - (2 if t > 0.94 else 1 if t > 0.86 else 0) + (1 if t < 0.05 else 0)
    for i in range(L):
        x = x0 + i
        for y in range(ober[i], unter[i] + 1):
            rel = (y - ober[i]) / max(1, unter[i] - ober[i])
            f = hell if rel < 0.18 else mitte if rel < 0.55 else dunkel
            c.px(x, y, f)
        c.px(x, ober[i] - 1, kontur)
        c.px(x, ober[i], licht if 0.04 < i / L < 0.97 else hell)
        c.px(x, unter[i] + 1, kontur)
    # Flutschlitze im Oberdecksbereich
    for i in range(10, L - 10, 3):
        c.px(x0 + i, dy + 3, kontur)
    # Bug- und Hecktiefenruder, Schraube, Ruder
    c.r(x0 + L - 10, dy + 6, 6, 1, kontur)
    c.r(x0 + 1, unter[2] - 2, 5, 1, kontur)
    c.r(x0 - 3, unter[2] - 4, 2, 5, '#6e5a2a')    # Schraube (Bronze)
    c.r(x0 - 4, unter[2] - 7, 1, 7, kontur)
    # Turm
    tx0, tx1 = x0 + int(L * 0.42), x0 + int(L * 0.58)
    th = 8
    c.r(tx0, dy - th, tx1 - tx0, th, mitte)
    c.r(tx0 + 1, dy - th, tx1 - tx0 - 2, 1, licht)
    c.r(tx0 - 1, dy - th + 1, 1, th - 1, kontur)
    for y in range(th):                           # gerundete Turmfront
        c.px(tx1 + (1 if y > 2 else 0), dy - th + y, mitte)
        c.px(tx1 + (2 if y > 2 else 1), dy - th + y, kontur)
    c.hline(tx0 - 1, dy - th - 1, tx1 - tx0 + 2, kontur)
    # Wintergarten mit Flak hinter dem Turm
    c.r(tx0 - 6, dy - 4, 6, 1, kontur)
    c.r(tx0 - 6, dy - 3, 1, 3, kontur)
    c.r(tx0 - 4, dy - 6, 3, 1, '#1b2726')
    c.vline(tx0 - 3, dy - 7, 2, kontur)
    # 8,8-cm-Geschütz vor dem Turm
    gx = tx1 + 7
    c.r(gx, dy - 3, 3, 2, dunkel)
    c.r(gx + 2, dy - 4, 7, 1, kontur)
    # Sehrohr durchbricht die Oberfläche
    px_ = tx0 + 5
    for y in range(WL - 6, dy - th):
        c.px(px_, y, '#8fa6a3' if y < WL else '#4d6863')
        c.px(px_ + 1, y, '#3d524f')
    c.r(px_ - 1, WL - 7, 3, 2, '#2a3a38')
    c.px(px_ + 2, WL - 6, '#c8e6ff')              # Glas blitzt
    # Schaumfeder hinter dem Sehrohr
    for k in range(9):
        c.hline(px_ - 2 - k * 2, WL - (1 if k < 3 else 0), 2, '#f2fbff' if k < 4 else '#bfe0e0')
    c.px(px_ + 2, WL - 1, '#f2fbff')
    # Netzabweiser vom Bug über den Turm zum Heck
    for x in range(tx1 + 2, x0 + L - 2):
        t = (x - tx1 - 2) / (x0 + L - 4 - tx1)
        if x % 2 == 0:
            c.px(x, dy - th + int(round(t * (th - 2))) - 1, '#2b3b3a')
    for x in range(x0 + 2, tx0 - 1):
        t = (x - x0 - 2) / (tx0 - x0 - 3)
        if x % 2 == 0:
            c.px(x, dy - 1 - int(round(t * (th - 2))), '#2b3b3a')
    # Kennung am Turm
    for (ax, ay) in [(0, 0), (0, 1), (0, 2), (1, 2), (2, 2), (2, 1), (2, 0), (4, 0), (5, 0), (6, 0), (6, 1), (5, 2)]:   # „U7“
        c.px(tx0 + 4 + ax, dy - th + 3 + ay, '#a9bdb6')

    # --- Luftblasen
    for _ in range(14):
        bx = x0 + rnd.randint(-6, L)
        byy = rnd.randint(WL + 4, dy + 8)
        c.px(bx, byy, '#a6dcdc')
        if rnd.random() < 0.4:
            c.px(bx + 1, byy - 1, '#d4f4f0')
    # Fischschwarm unten rechts
    for k in range(7):
        fxx = int(W * 0.78) + rnd.randint(-8, 8)
        fyy = H - 26 + rnd.randint(-5, 5)
        c.hline(fxx, fyy, 2, '#4a7a86')
        c.px(fxx - 1, fyy, '#2c5560')
    # dunkler Rand (Vignette) für Kachel-Look
    for y in range(H):
        for x in range(W):
            d = min(x, y, W - 1 - x, H - 1 - y)
            if d < 3:
                c.px(x, y, (0, 0, 0, 70 - d * 22))
    return c


if __name__ == '__main__':
    szene(128, 128).save(os.path.join(OUT, 'vorschau.png'), 4)
    szene(256, 128).save(os.path.join(OUT, 'vorschau_breit.png'), 4)
    print('vorschau.png 512x512, vorschau_breit.png 1024x512')
