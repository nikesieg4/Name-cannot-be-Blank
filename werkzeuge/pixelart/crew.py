"""Crew-Spritesheet: 13 Rollen x 4 Bilder (stehen, laufen 1, laufen 2, arbeiten), je 12 x 28 px,
plus Schlaf-Sprite je Rolle (28 x 12). Blickrichtung rechts, das Spiel spiegelt fuer links."""
from px import Can, dark
from pal import P

ROLLEN = [  # id, Name, Rollenfarbe, Kopf, Koerper, Haut, Haar
    ('kaleu', 'Kapitänleutnant', '#f1ede2', 'kaleu', 'offizier', '#e2b08a', '#3a2a1c'),
    ('wo1', '1. Wachoffizier', '#d8d2bf', 'schirm', 'offizier', '#c98f66', '#1e1a18'),
    ('li', 'Leitender Ingenieur', '#c9b27a', 'schirm', 'offizier', '#f0c8a8', '#7a5530'),
    ('nav', 'Navigationsoffizier', '#9fb7c9', 'schirm', 'offizier', '#9b6a46', '#1e1a18'),
    ('brand', 'Brandmeister', '#c96a4a', 'muetze', 'overall', '#e2b08a', '#8a3a22'),
    ('funker', 'Funker-Obermaat', '#7fae8a', 'kopfhoerer', 'pullover', '#c98f66', '#3a2a1c'),
    ('logistik', 'Logistik-Maat', '#b59a6a', 'muetze', 'pullover', '#f0c8a8', '#c9a35a'),
    ('maschinist', 'Maschinist', '#8a8f96', 'muetze', 'overall', '#9b6a46', '#1e1a18'),
    ('tauch', 'Tauchzellen-Gast', '#6f9bb5', 'muetze', 'pullover', '#e2b08a', '#7a5530'),
    ('vertau', 'Vertäuungs-Gast', '#8c7a5e', 'muetze', 'pullover', '#c98f66', '#c9a35a'),
    ('ruder', 'Rudergänger', '#a3b86c', 'muetze', 'pullover', '#f0c8a8', '#3a2a1c'),
    ('soni', 'Horchfunker', '#c2a0d0', 'kopfhoerer', 'pullover', '#e2b08a', '#8a3a22'),
    ('smutje', 'Smutje', '#e6e0d0', 'koch', 'schuerze', '#c98f66', '#7a5530'),
    ('wo2', '2. Wachoffizier', '#c8c2ae', 'schirm', 'offizier', '#e2b08a', '#c9a35a'),
    ('torpedo', 'Torpedomechaniker', '#b8833f', 'muetze', 'overall', '#c98f66', '#3a2a1c'),
]

KOEPFE = {
    'kaleu': ['....kkkkk...', '...kcccccck.', '...kcCyCCck.', '..kbbbbbbbbk'],
    'schirm': ['....kkkkk...', '...kcccccck.', '...kCCyCCCk.', '..kbbbbbbbbk'],
    'muetze': ['............', '....kkkkkk..', '...kcCcCcCk.', '...kcccccck.'],
    'koch': ['...kkkkkk...', '..kwwwwwwwk.', '..kwwwwwwwk.', '...kWWWWWWk.'],
    'kopfhoerer': ['....kkkkk...', '...kcccchhk.', '...khhhhhhk.', '...khhhhhhk.'],
}
GESICHT = ['...khsssssk.', '...khsssesk.', '...ksssssSk.', '...kssssmsk.', '....kSSSSk..', '.....kssk...']
GESICHT_KH = ['...kcCssssk.', '...kCCssesk.', '...kssssssk.', '...kssssmsk.', '....kSSSSk..', '.....kssk...']

KOERPER = {
    'stehen': ['...kwuuuwk..', '..kuuuuuuuk.', '.kUuuurruuUk', '.kUuuuwuuuUk', '.kUuuuuuuuUk', '.kUuuuwuuuUk',
               '.kSuuuuuuuSk', '.kkgggggggkk'],
    'arbeiten': ['...kwuuuwk..', '..kuuuuuuuk.', '..kuuurrUUUk', '..kuuuuwUUSk', '..kuuuuuuuk.', '..kuuuuwuuk.',
                 '..kuuuuuuuk.', '..kkgggggkk.'],
}
BEINE = [
    ['..kpppppppk.', '..kpppkpppk.', '..kpPpkpPpk.', '..kpPpkpPpk.', '..kpPpkpPpk.', '..kpppkpppk.',
     '..kpppkpppk.', '..kfffkffffk', '..kkkkkkkkk.', '............'],
    ['..kppppppk..', '.kpppkkpppk.', '.kpPk..kpPk.', 'kpPk....kpPk', 'kppk....kppk', 'kppk....kppk',
     'kffk...kfffk', 'kkkk...kkkkk', '............', '............'],
    ['..kpppppppk.', '..kpppkpppk.', '..kpPpkpPpk.', '...kpPkpPk..', '...kppkppk..', '...kppkppk..',
     '...kppkffffk', '...kfffkkkk.', '...kkkk.....', '............'],
]


def pal_fuer(r):
    rid, name, farbe, kopf, koerper, haut, haar = r
    p = dict(k=P['kontur'], h=haar, s=haut, S=dark(haut, 0.82), e='#1a1410', m=dark(haut, 0.62),
             p=P['hose'], P=P['hoseHell'], f=P['schuh'], y=P['messingHell'])
    if kopf in ('kaleu',):
        p.update(c=P['weiss'], C=P['weissDunkel'], b='#14161a')
    elif kopf == 'schirm':
        p.update(c=P['uniformOffHell'], C=P['uniformOff'], b='#14161a')
    elif kopf == 'muetze':
        p.update(c=farbe, C=dark(farbe, 0.72))
    elif kopf == 'koch':
        p.update(w=P['weiss'], W=P['weissDunkel'])
    elif kopf == 'kopfhoerer':
        p.update(c='#1d1d1d', C='#3a3a3a')
    if koerper == 'offizier':
        p.update(u=P['uniformOff'], U=P['uniformOffHell'], w=P['messingHell'], r=farbe, g=P['messing'])
    elif koerper == 'pullover':
        p.update(u=P['pullover'], U=P['pulloverHell'], w=dark(farbe, 0.9), r=farbe, g='#2a241c')
    elif koerper == 'overall':
        p.update(u=dark(farbe, 0.55), U=dark(farbe, 0.7), w=P['metallHell'], r=P['rost'], g='#2a241c',
                 p=dark(farbe, 0.45), P=dark(farbe, 0.6))
    elif koerper == 'schuerze':
        p.update(u=P['weiss'], U=P['pulloverHell'], w=P['weissDunkel'], r=P['weissDunkel'], g=P['weissDunkel'])
    return p


def bild(r, nr):
    rid, name, farbe, kopf, koerper, haut, haar = r
    p = pal_fuer(r)
    gesicht = GESICHT_KH if kopf == 'kopfhoerer' else GESICHT
    rows = KOEPFE[kopf] + gesicht + KOERPER['arbeiten' if nr == 3 else 'stehen'] + BEINE[0 if nr == 3 else nr]
    if kopf == 'koch':
        # Kochmuetze: Haarzeile weg
        rows[4] = '...ksssssk.'.ljust(12, '.') if False else rows[4]
    c = Can(12, 28)
    dy = 0
    c.grid(rows, p, 0, dy)
    return c


def schlaf(r):
    rid, name, farbe, kopf, koerper, haut, haar = r
    c = Can(28, 12)
    # Decke
    c.r(1, 5, 21, 6, P['stoff']); c.r(1, 5, 21, 1, P['stoffHell']); c.r(1, 10, 21, 1, '#3e3528')
    c.r(10, 5, 2, 6, dark(farbe, 0.8))
    c.px(0, 6, P['kontur']); c.r(0, 6, 1, 4, P['kontur'])
    # Kopf auf dem Kissen
    c.r(21, 5, 6, 5, haut); c.r(21, 4, 6, 2, haar); c.px(22, 7, '#1a1410'); c.px(23, 7, '#1a1410')
    c.r(26, 6, 1, 3, dark(haut, 0.8))
    c.r(20, 9, 8, 2, P['weiss'])
    # Zzz
    c.grid(['zzzz', '..z.', '.z..', 'zzzz'], {'z': P['weiss']}, 23, 0)
    return c


def sheet():
    S = Can(12 * 4, 28 * len(ROLLEN))
    for i, r in enumerate(ROLLEN):
        for n in range(4):
            S.paste(bild(r, n), n * 12, i * 28)
    return S


def schlaf_sheet():
    S = Can(28, 12 * len(ROLLEN))
    for i, r in enumerate(ROLLEN):
        S.paste(schlaf(r), 0, i * 12)
    return S


if __name__ == '__main__':
    import sys
    out = sys.argv[1]
    sheet().save(out + '/crew_sheet.png')
    schlaf_sheet().save(out + '/crew_schlaf.png')
    sheet().save(out + '/crew_sheet_x4.png', 4)
    # einzelne Rollenkarten in 6x fuer das Board
    for r in ROLLEN:
        c = Can(12 * 4 + 3 * 4, 28)
        for n in range(4):
            c.paste(bild(r, n), n * 16, 0)
        c.save(out + f'/crew_{r[0]}_x5.png', 5)
