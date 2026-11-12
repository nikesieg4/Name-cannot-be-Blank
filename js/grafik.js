/* Sehrohrtiefe – Pixel-Grafik des Bootes im Querschnitt.
   Die Spiellogik rechnet in Bootseinheiten (660 × 150). Gezeichnet wird mit
   doppelter Auflösung: F = 2 Grafikpixel pro Einheit, das Boot ist also
   1320 × 300 Pixel groß, eine Figur 12 × 28 Pixel.
   Alle Grafiken hier sind Platzhalter aus Code und können später durch
   PNG-Sprites in derselben Auflösung ersetzt werden (siehe README). */
(function (S) {
  'use strict';
  const D = S.daten;
  const B = D.BOOT;
  const F = 2;
  const GB = B.B * F, GH = B.H * F;
  const DECKE = B.DECKE_Y * F, BODEN = B.BODEN_Y * F;
  const MITTE_Y = 90 * F;
  const PX_PRO_M = 1.4 * F;

  const FARBE = {
    rumpf: '#34413f', rumpfHell: '#4a5a56', rumpfLicht: '#63746e', rumpfDunkel: '#222b2a', rumpfTief: '#171e1d',
    kontur: '#0b100f', niete: '#5b6a65', nieteDunkel: '#1c2423', naht: '#2a3433',
    deck: '#2c3533', planke: '#4f4434', plankeDunkel: '#3d3428', turm: '#3b4846', turmHell: '#51605c',
    decke: '#5c6259', rohr: '#6f7670', rohrHell: '#9aa19a', messing: '#a4823f', messingHell: '#d2ad5c', kupfer: '#9a5a36',
    rot: '#8e2f25', rotHell: '#c44a39', boden: '#2b302e', bodenHell: '#3d4441', bilge: '#141918',
    schott: '#2d3532', schottHell: '#3f4945', tuerOffen: '#0f1312', tuerZu: '#7d3d2f', tuerZuHell: '#9c5240', rad: '#d0a64e',
    holz: '#7a5a36', holzHell: '#94703f', holzDunkel: '#523b24', metall: '#5d646a', metallHell: '#868f95', metallDunkel: '#40464b',
    hose: '#272c35', hoseHell: '#363d49', schuh: '#121212', matratze: '#b5a98f', decken: '#6b5d4a', deckenHell: '#82725b',
    uniformOff: '#2c3850', uniformOffHell: '#3a4866', uniform: '#4b5b6c', uniformHell: '#5d6f82',
    lampe: '#ffe0a0', glas: '#2f6b5a', anzeige: '#ddd5b9', schirm: '#3fae6a',
  };
  const WANDFARBEN = ['#3e4944', '#46493f', '#4a473d', '#4a4a3f', '#3e4a4c', '#3f464d', '#44473e'];
  const HAUT = ['#e2b08a', '#c98f66', '#9b6a46', '#f0c8a8'];
  const HAAR = ['#3a2a1c', '#7a5530', '#c9a35a', '#1e1a18', '#8a3a22'];

  function r(g, x, y, w, h, f) { g.fillStyle = f; g.fillRect(x, y, w, h); }
  function px(g, x, y, f) { g.fillStyle = f; g.fillRect(x, y, 1, 1); }
  /* Schachbrett-Raster für weiche Übergänge im Pixel-Look */
  function raster(g, x, y, w, h, f) {
    g.fillStyle = f;
    for (let j = 0; j < h; j++) for (let i = (j + x + y) % 2; i < w; i += 2) g.fillRect(x + i, y + j, 1, 1);
  }
  function hash(a, b) { let h = (a * 374761393 + b * 668265263) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return (h ^ (h >>> 16)) / 4294967296; }

  function rumpfHalb(xf) {
    const t = Math.abs((xf - GB / 2) / (314 * F));
    if (t >= 1) return 0;
    return 40 * F * Math.pow(1 - Math.pow(t, 3.2), 1 / 3.2) * (xf > GB / 2 ? 1 : 0.96);
  }

  /* ---------------- Bauteile ---------------- */
  function rundanzeige(g, cx, cy, rad) {
    for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) {
      const d = Math.hypot(x, y);
      if (d <= rad + 0.3) px(g, cx + x, cy + y, d > rad - 1 ? FARBE.messing : d > rad - 1.8 ? '#1a1f1d' : FARBE.anzeige);
    }
    if (rad >= 5) for (let a = 0; a < 8; a++) { const w = Math.PI * 0.75 + a * Math.PI * 1.5 / 7; px(g, Math.round(cx + Math.cos(w) * (rad - 2.5)), Math.round(cy + Math.sin(w) * (rad - 2.5)), '#555'); }
  }

  function handrad(g, cx, cy, rad, f) {
    for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) {
      const d = Math.hypot(x, y);
      if (d <= rad + 0.3 && d > rad - 1.2) px(g, cx + x, cy + y, f);
    }
    for (let i = -rad + 1; i < rad; i++) { px(g, cx + i, cy, f); px(g, cx, cy + i, f); }
    px(g, cx, cy, FARBE.kontur);
  }

  function koje(g, xf, o, vorhang) {
    const y = o ? 184 : 208;
    r(g, xf - 18, y, 36, 3, FARBE.holzDunkel);
    r(g, xf - 18, y, 36, 1, FARBE.holz);
    r(g, xf - 17, y - 3, 34, 3, FARBE.matratze);
    r(g, xf - 17, y - 3, 34, 1, '#cbbfa4');
    r(g, xf + 9, y - 5, 7, 2, '#e8e2d2');
    r(g, xf - 19, y - 12, 2, 18, FARBE.holzDunkel);
    r(g, xf + 17, y - 12, 2, 18, FARBE.holzDunkel);
    if (vorhang) {
      r(g, xf - 17, y - 22, 34, 1, FARBE.messing);
      for (let i = 0; i < 12; i++) r(g, xf - 17 + i, y - 21, 1, 18, i % 3 === 0 ? '#2f4a36' : '#3c5c44');
    }
  }

  function kiste(g, x, y, art) {
    if (art === 0) {
      r(g, x, y, 12, 12, FARBE.holz); r(g, x, y, 12, 1, FARBE.holzHell);
      r(g, x, y + 4, 12, 1, FARBE.holzDunkel); r(g, x, y + 8, 12, 1, FARBE.holzDunkel);
      r(g, x, y, 1, 12, FARBE.holzDunkel); r(g, x + 11, y, 1, 12, FARBE.holzDunkel);
    } else if (art === 1) {
      r(g, x + 1, y, 10, 12, '#4e5c46'); r(g, x + 1, y, 2, 12, '#62735a');
      r(g, x + 1, y + 2, 10, 1, '#2f382b'); r(g, x + 1, y + 9, 10, 1, '#2f382b');
      r(g, x + 4, y + 5, 4, 2, '#c9b86a');
    } else {
      r(g, x, y + 2, 12, 10, '#6e5a3a'); r(g, x + 2, y, 8, 2, '#d9cfb0');
      r(g, x, y + 6, 12, 1, '#4a3a24');
    }
  }

  /* ---------------- Statisches Bild des Bootes ---------------- */
  let statisch = null;

  function baueStatisch() {
    const c = document.createElement('canvas');
    c.width = GB; c.height = GH;
    const g = c.getContext('2d');

    // Außenhülle Spalte für Spalte, mit Raster-Schattierung, Plattennähten und Nieten
    for (let x = 28; x < GB - 28; x++) {
      const h = rumpfHalb(x);
      if (h <= 0) continue;
      const oben = Math.round(MITTE_Y - h), unten = Math.round(MITTE_Y + h), hoehe = unten - oben;
      r(g, x, oben, 1, hoehe, FARBE.rumpf);
      r(g, x, oben, 1, 3, FARBE.rumpfLicht);
      r(g, x, oben + 3, 1, 4, FARBE.rumpfHell);
      if ((x + oben) % 2) px(g, x, oben + 7, FARBE.rumpfHell);
      r(g, x, unten - 16, 1, 16, FARBE.rumpfDunkel);
      r(g, x, unten - 6, 1, 6, FARBE.rumpfTief);
      for (let k = 0; k < 4; k++) if ((x + k) % 2) px(g, x, unten - 17 - k * 2, FARBE.rumpfDunkel);
      px(g, x, oben - 1, FARBE.kontur);
      px(g, x, unten, FARBE.kontur);
      // Längsnaht
      const naht = Math.round(MITTE_Y + h * 0.5);
      px(g, x, naht, FARBE.naht);
      if (x % 8 === 0) px(g, x, naht - 2, FARBE.niete);
      // Plattenstöße
      if (x % 56 === 0) for (let y = oben + 4; y < unten - 3; y++) {
        px(g, x, y, FARBE.naht);
        if (y % 6 === 0) { px(g, x - 2, y, FARBE.niete); px(g, x + 2, y, FARBE.niete); }
      }
      // Oberdeck mit Holzplanken und Flutschlitzen
      if (x > 170 && x < 1180) {
        const dt = Math.min(oben - 6, 102);
        r(g, x, dt, 1, oben - dt, FARBE.deck);
        px(g, x, dt, x % 14 === 0 ? FARBE.plankeDunkel : FARBE.planke);
        px(g, x, dt + 1, FARBE.plankeDunkel);
        px(g, x, dt - 1, FARBE.kontur);
        if (oben - dt > 7 && x % 10 < 4) r(g, x, oben - 5, 1, 2, FARBE.kontur);
      }
      // Kiel
      if (x > 260 && x < 1080) { r(g, x, unten + 1, 1, 3, FARBE.rumpfTief); px(g, x, unten + 4, FARBE.kontur); }
    }
    // Reling vorn und hinten
    for (const [a, b] of [[300, 740], [920, 1140]]) {
      r(g, a, 92, b - a, 1, '#5b6863');
      for (let x = a; x <= b; x += 18) r(g, x, 92, 1, 10, '#5b6863');
    }
    // Turm
    for (let x = 760; x < 896; x++) {
      let top = 60;
      if (x < 780) top += (780 - x) * 1.6;
      if (x > 876) top += (x - 876) * 1.4;
      top = Math.round(top);
      r(g, x, top, 1, 104 - top, FARBE.turm);
      r(g, x, top, 1, 2, FARBE.turmHell);
      r(g, x, 98, 1, 6, FARBE.rumpfDunkel);
      px(g, x, top - 1, FARBE.kontur);
      if (x % 28 === 0) for (let y = top + 3; y < 100; y++) { px(g, x, y, FARBE.naht); if (y % 6 === 0) px(g, x + 2, y, FARBE.niete); }
      if (x % 10 === 0 && x > 780 && x < 876) r(g, x, top - 7, 1, 7, '#5b6863');
    }
    r(g, 778, 53, 98, 1, '#5b6863');
    r(g, 790, 74, 64, 2, FARBE.rumpfLicht);
    for (let i = 0; i < 5; i++) r(g, 796 + i * 11, 80, 6, 4, '#1a2523');
    // Turmkennung „7“ in Pixelschrift
    ['1111', '0001', '0010', '0100', '0100'].forEach((z, j) => z.split('').forEach((v, i) => { if (v === '1') r(g, 840 + i * 2, 86 + j * 2, 2, 2, '#c9c2a8'); }));
    // Deckgeschütz vor dem Turm
    r(g, 976, 92, 14, 10, FARBE.metallDunkel); r(g, 978, 86, 10, 6, FARBE.metall); r(g, 978, 86, 10, 1, FARBE.metallHell);
    r(g, 988, 87, 26, 3, FARBE.metall); r(g, 988, 87, 26, 1, FARBE.metallHell); r(g, 1012, 86, 3, 5, FARBE.metallDunkel);
    // Heck: Ruder, Wellenbock, Tiefenruder; Bug: Torpedoklappen und Bugtiefenruder
    r(g, 6, 156, 8, 52, FARBE.rumpfDunkel); r(g, 6, 156, 2, 52, FARBE.rumpfHell); r(g, 5, 156, 1, 52, FARBE.kontur);
    r(g, 16, 177, 26, 5, FARBE.metall); r(g, 16, 177, 26, 1, FARBE.metallHell);
    r(g, 30, 196, 26, 4, FARBE.rumpfDunkel); r(g, 30, 196, 26, 1, FARBE.rumpfHell);
    r(g, 1196, 194, 30, 4, FARBE.rumpfDunkel); r(g, 1196, 194, 30, 1, FARBE.rumpfHell);
    for (let i = 0; i < 4; i++) {
      const tx = 1246 + (i % 2) * 12, ty = 166 + Math.floor(i / 2) * 18;
      r(g, tx, ty, 8, 8, FARBE.kontur); r(g, tx + 1, ty + 1, 6, 6, '#1d2625'); r(g, tx + 1, ty + 1, 6, 1, FARBE.rumpfHell);
    }

    // Innenraum (Schnitt)
    D.ABTEILE.forEach((a, i) => {
      const x0 = a.x0 * F, x1 = a.x1 * F, w = x1 - x0;
      r(g, x0, DECKE, w, BODEN - DECKE, WANDFARBEN[i]);
      r(g, x0, BODEN - 26, w, 26, 'rgba(0,0,0,0.12)');
      r(g, x0, BODEN - 27, w, 1, 'rgba(255,255,255,0.06)');
      for (let x = x0 + 12; x < x1 - 4; x += 24) {
        r(g, x, DECKE + 10, 3, BODEN - DECKE - 10, 'rgba(0,0,0,0.18)');
        r(g, x, DECKE + 10, 1, BODEN - DECKE - 10, 'rgba(255,255,255,0.06)');
        for (let y = DECKE + 14; y < BODEN - 2; y += 9) px(g, x + 1, y, 'rgba(255,255,255,0.12)');
      }
      r(g, x0, DECKE, w, 4, FARBE.rohr); r(g, x0, DECKE, w, 1, FARBE.rohrHell);
      r(g, x0, DECKE + 4, w, 3, FARBE.messing); r(g, x0, DECKE + 4, w, 1, FARBE.messingHell);
      if (i % 2 === 0) { r(g, x0, DECKE + 7, w, 2, FARBE.rot); r(g, x0, DECKE + 7, w, 1, FARBE.rotHell); }
      r(g, x0, DECKE + 9, w, 2, '#262b29');
      for (let x = x0 + 3; x < x1; x += 4) px(g, x, DECKE + 9, '#4a4f4c');
      for (let x = x0 + 16; x < x1 - 4; x += 30) r(g, x, DECKE, 2, 11, FARBE.kontur);
      r(g, x0, DECKE + 11, w, 2, 'rgba(0,0,0,0.3)');
      for (const lx of lampenX(a)) {
        const xx = Math.round(lx) - 3;
        r(g, xx, DECKE + 11, 7, 1, FARBE.kontur); r(g, xx + 1, DECKE + 12, 5, 4, '#e8c77a');
        px(g, xx + 1, DECKE + 13, FARBE.kontur); px(g, xx + 5, DECKE + 13, FARBE.kontur); r(g, xx + 1, DECKE + 16, 5, 1, FARBE.kontur);
      }
    });
    // Boden mit Gitterrost, Bilge darunter
    const bx0 = D.ABTEILE[0].x0 * F, bx1 = D.ABTEILE[D.ABTEILE.length - 1].x1 * F;
    r(g, bx0, BODEN, bx1 - bx0, 6, FARBE.boden);
    for (let x = bx0; x < bx1; x++) for (let y = 0; y < 6; y++) if ((x + y * 2) % 4 === 0) px(g, x, BODEN + y, FARBE.bodenHell);
    r(g, bx0, BODEN, bx1 - bx0, 1, '#59615c');
    r(g, bx0, BODEN + 6, bx1 - bx0, 9, FARBE.bilge);
    r(g, bx0, BODEN + 10, bx1 - bx0, 2, '#2c3230');

    /* Heckraum: E-Maschine, Schalttafel, Kojen */
    r(g, 158, 186, 52, 34, FARBE.metall);
    raster(g, 158, 186, 52, 4, FARBE.metallHell); r(g, 158, 186, 52, 1, FARBE.metallHell);
    for (let x = 162; x < 206; x += 3) r(g, x, 194, 1, 20, FARBE.metallDunkel);
    r(g, 176, 198, 16, 8, FARBE.kupfer); r(g, 176, 198, 16, 1, '#c07a4a');
    r(g, 160, 216, 48, 4, FARBE.metallDunkel);
    r(g, 210, 198, 14, 6, FARBE.messing); r(g, 210, 198, 14, 1, FARBE.messingHell);
    r(g, 168, 156, 34, 22, '#2b3130'); r(g, 168, 156, 34, 1, '#4a524f');
    rundanzeige(g, 176, 165, 5); rundanzeige(g, 192, 165, 5);
    for (let i = 0; i < 4; i++) r(g, 172 + i * 8, 173, 3, 2, i % 2 ? '#c33' : '#3c3');
    koje(g, 120, 0); koje(g, 120, 1);

    /* Maschinenraum: zwei Diesel mit Zylinderköpfen, Auspuffleitung, Telegraf */
    for (const x0 of [236, 340]) {
      r(g, x0, 186, 60, 34, FARBE.metall);
      r(g, x0, 186, 60, 2, FARBE.metallHell); raster(g, x0, 188, 60, 2, FARBE.metallHell);
      r(g, x0, 212, 60, 8, FARBE.metallDunkel);
      for (let k = 0; k < 6; k++) {
        const kx = x0 + 3 + k * 9;
        r(g, kx, 174, 7, 12, '#3b4045'); r(g, kx, 174, 7, 1, '#5b6166'); r(g, kx + 2, 170, 3, 4, '#2c3034');
        px(g, kx + 1, 178, FARBE.messingHell); px(g, kx + 5, 178, FARBE.messingHell);
      }
      r(g, x0 - 2, 162, 64, 4, FARBE.messing); r(g, x0 - 2, 162, 64, 1, FARBE.messingHell);
      for (let k = 0; k < 6; k++) r(g, x0 + 5 + k * 9, 166, 3, 4, FARBE.messing);
      for (let k = 0; k < 4; k++) r(g, x0 + 8 + k * 14, 199, 8, 1, FARBE.metallHell);
    }
    r(g, 318, 192, 4, 28, FARBE.messing); r(g, 318, 192, 1, 28, FARBE.messingHell);
    r(g, 310, 176, 20, 18, '#1a1f1d'); r(g, 312, 178, 16, 14, FARBE.anzeige);
    for (let k = 0; k < 4; k++) r(g, 312, 181 + k * 3, 16, 1, '#b8ae90');
    r(g, 319, 179, 2, 8, '#a33'); r(g, 310, 176, 20, 1, FARBE.messingHell);

    /* Laderaum: Regalbretter mit Stützen */
    for (const y of [168, 194]) { r(g, 412, y, 120, 3, FARBE.holzDunkel); r(g, 412, y, 120, 1, FARBE.holz); }
    for (const x of [412, 470, 528]) r(g, x, 160, 3, 60, FARBE.holzDunkel);

    /* Mannschaftsraum: Kojen, Back mit Bänken, Kombüse */
    koje(g, 564, 0); koje(g, 564, 1); koje(g, 608, 0); koje(g, 608, 1);
    r(g, 632, 200, 48, 3, FARBE.holz); r(g, 632, 200, 48, 1, FARBE.holzHell);
    r(g, 636, 203, 2, 17, FARBE.holzDunkel); r(g, 674, 203, 2, 17, FARBE.holzDunkel);
    r(g, 628, 210, 8, 2, FARBE.holz); r(g, 676, 210, 8, 2, FARBE.holz);
    r(g, 642, 196, 4, 4, '#d8d0bc'); r(g, 646, 197, 1, 2, '#d8d0bc'); r(g, 660, 197, 6, 3, '#9aa19a');
    r(g, 684, 190, 32, 30, '#55595c'); r(g, 684, 190, 32, 2, '#868f95');
    r(g, 688, 196, 24, 10, '#2c2f31'); r(g, 690, 198, 20, 6, '#3c4043');
    for (let k = 0; k < 3; k++) r(g, 690 + k * 7, 210, 4, 4, '#2a2d2f');
    r(g, 688, 182, 9, 8, '#8a8f96'); r(g, 688, 182, 9, 1, '#a7adb3'); r(g, 700, 184, 11, 6, '#6a6f74'); r(g, 698, 186, 2, 1, '#6a6f74');
    for (let k = 0; k < 4; k++) r(g, 686 + k * 8, 160, 1, 12, '#3a3a3a');

    /* Zentrale */
    r(g, 820, DECKE, 8, 80, FARBE.metall); r(g, 820, DECKE, 2, 80, FARBE.metallHell); r(g, 826, DECKE, 2, 80, FARBE.metallDunkel);
    r(g, 812, 188, 24, 6, FARBE.metallHell); r(g, 812, 188, 24, 1, '#aab3b8'); r(g, 810, 189, 3, 4, FARBE.kontur); r(g, 835, 189, 3, 4, FARBE.kontur);
    r(g, 818, 180, 12, 8, FARBE.metallDunkel); r(g, 820, 182, 8, 3, '#1a1f1d');
    r(g, 726, 152, 66, 36, '#2a302e'); r(g, 726, 152, 66, 1, '#48514d'); r(g, 726, 187, 66, 1, FARBE.kontur);
    rundanzeige(g, 737, 164, 8); rundanzeige(g, 759, 164, 6); rundanzeige(g, 777, 164, 6);
    for (let i = 0; i < 6; i++) r(g, 730 + i * 10, 180, 6, 3, i < 3 ? '#3a6b48' : '#6b3a3a');
    r(g, 736, 196, 10, 24, '#3a4040'); r(g, 736, 196, 10, 1, '#56605c');
    handrad(g, 734, 196, 7, FARBE.rotHell); handrad(g, 750, 200, 6, FARBE.rad);
    r(g, 760, 188, 18, 14, '#2a302e'); r(g, 762, 190, 14, 7, '#16261b'); r(g, 762, 190, 14, 1, '#2d4a35');
    for (let k = 0; k < 3; k++) r(g, 763 + k * 5, 199, 3, 2, FARBE.messing);
    r(g, 766, 202, 6, 18, '#3a4040');
    r(g, 786, 180, 22, 40, '#3a4040'); r(g, 786, 180, 22, 1, '#56605c');
    for (let k = 0; k < 8; k++) r(g, 789 + (k % 4) * 5, 186 + Math.floor(k / 4) * 10, 3, 6, k % 3 === 0 ? FARBE.rotHell : '#3c9c55');
    r(g, 788, 206, 18, 1, FARBE.messing);
    r(g, 853, 200, 6, 20, FARBE.metall); handrad(g, 856, 192, 8, FARBE.rad);
    r(g, 846, 168, 20, 10, '#1a1f1d'); r(g, 848, 170, 16, 6, FARBE.anzeige); r(g, 855, 170, 2, 6, '#a33');
    r(g, 868, DECKE - 6, 2, 86, FARBE.metall); r(g, 876, DECKE - 6, 2, 86, FARBE.metall);
    for (let y = DECKE; y < BODEN; y += 8) r(g, 868, y, 10, 2, FARBE.metallHell);
    r(g, 864, DECKE, 18, 2, FARBE.kontur);
    r(g, 880, 200, 32, 3, FARBE.holz); r(g, 880, 200, 32, 1, FARBE.holzHell);
    r(g, 882, 198, 28, 2, '#d8cfae'); px(g, 890, 198, '#3f6f8a'); px(g, 896, 199, '#a33');
    r(g, 884, 203, 2, 17, FARBE.holzDunkel); r(g, 906, 203, 2, 17, FARBE.holzDunkel);
    r(g, 900, 176, 2, 22, FARBE.metallDunkel); r(g, 896, 174, 10, 3, FARBE.glas);

    /* Funk- & Horchraum */
    r(g, 926, 200, 36, 3, FARBE.holz); r(g, 926, 200, 36, 1, FARBE.holzHell); r(g, 928, 203, 2, 17, FARBE.holzDunkel);
    r(g, 928, 164, 32, 36, '#30373a'); r(g, 928, 164, 32, 1, '#4c5558');
    r(g, 930, 166, 28, 12, '#1c2123'); r(g, 932, 168, 24, 6, '#26302f');
    for (let k = 0; k < 4; k++) rundanzeige(g, 934 + k * 7, 186, 2);
    r(g, 930, 192, 28, 1, FARBE.messing);
    r(g, 944, 194, 8, 5, '#222'); px(g, 943, 194, '#222'); px(g, 952, 194, '#222');
    koje(g, 980, 0, true); koje(g, 980, 1);
    r(g, 1004, 200, 36, 3, FARBE.holz); r(g, 1004, 200, 36, 1, FARBE.holzHell); r(g, 1036, 203, 2, 17, FARBE.holzDunkel);
    r(g, 1008, 170, 30, 30, '#30373a'); r(g, 1008, 170, 30, 1, '#4c5558');
    for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) {
      const d = Math.hypot(x, y);
      if (d <= 9.3) px(g, 1023 + x, 184 + y, d > 8 ? FARBE.messing : d > 7 ? '#111' : '#0f2a1a');
    }
    for (let k = 0; k < 3; k++) for (let a = 0; a < 40; a++) { const w = a / 40 * Math.PI * 2; if (a % 2) px(g, Math.round(1023 + Math.cos(w) * (2 + k * 2.3)), Math.round(184 + Math.sin(w) * (2 + k * 2.3)), '#1f5a36'); }

    /* Bugtorpedoraum: Kojen, Laufkatze, Rohrklappen */
    koje(g, 1080, 0); koje(g, 1080, 1); koje(g, 1124, 0); koje(g, 1124, 1); koje(g, 1168, 0); koje(g, 1168, 1);
    r(g, 1052, DECKE + 14, 140, 2, FARBE.metallDunkel);
    r(g, 1120, DECKE + 16, 8, 4, FARBE.metall); r(g, 1123, DECKE + 20, 1, 10, '#777'); r(g, 1121, DECKE + 30, 5, 2, '#777');
    r(g, 1192, 152, 20, 68, '#3b4240'); r(g, 1192, 152, 1, 68, '#56605c');
    for (let i = 0; i < 4; i++) {
      const tx = 1194 + (i % 2) * 8, ty = 158 + Math.floor(i / 2) * 28;
      for (let y = 0; y < 14; y++) for (let x = 0; x < 8; x++) if (Math.hypot(x - 3.5, y - 6.5) < 4.2 || (y > 2 && y < 11 && x > 0 && x < 7)) px(g, tx + x, ty + y, (x + y) % 5 === 0 ? FARBE.messingHell : FARBE.messing);
      r(g, tx + 3, ty + 5, 2, 4, FARBE.kontur);
    }

    /* Schotten mit Nieten */
    for (let i = 0; i < D.ABTEILE.length - 1; i++) {
      const x = D.ABTEILE[i].x1 * F;
      r(g, x - 4, DECKE, 8, BODEN - DECKE, FARBE.schott);
      r(g, x - 4, DECKE, 1, BODEN - DECKE, FARBE.schottHell);
      r(g, x + 3, DECKE, 1, BODEN - DECKE, FARBE.kontur);
      for (let y = DECKE + 4; y < 164; y += 5) { px(g, x - 2, y, FARBE.niete); px(g, x + 1, y, FARBE.niete); }
    }
    r(g, 84, DECKE, 6, BODEN - DECKE, FARBE.schott); r(g, 1210, DECKE, 6, BODEN - DECKE, FARBE.schott);
    statisch = c;
  }

  function lampenX(a) {
    const x0 = a.x0 * F, w = (a.x1 - a.x0) * F;
    return w > 160 ? [x0 + w / 3, x0 + 2 * w / 3] : [x0 + w / 2];
  }

  /* ---------------- Crew-Sprites (12 × 28) ---------------- */
  /* k Kontur · c/C Mütze · b Mützenschirm · h Haar · s/S Haut · e Auge · m Mund
     w Kragen/Knöpfe · u/U Uniform · r Abzeichen (Rollenfarbe) · g Gürtel · p/P Hose · f Schuh */
  const OBEN = [
    '....kkkkk...',
    '...kcccccck.',
    '...kcCCCCck.',
    '..kbbbbbbbbk',
    '...khsssssk.',
    '...khsssesk.',
    '...ksssssSk.',
    '...kssssmsk.',
    '....kSSSSk..',
    '.....kssk...',
    '...kwuuuwk..',
    '..kuuuuuuuk.',
    '.kuUuurruuUk',
    '.kuUuuwuuuUk',
    '.kuUuuuuuuUk',
    '.kuUuuwuuuUk',
    '.kUuuuuuuuUk',
    '.ksgggggggsk',
  ];
  const BEINE = [
    [ // stehen
      '..kpppppppk.',
      '..kpppkpppk.',
      '..kpPpkpPpk.',
      '..kpPpkpPpk.',
      '..kpPpkpPpk.',
      '..kpppkpppk.',
      '..kpppkpppk.',
      '..kfffkffffk',
      '..kkkkkkkkk.',
      '............',
    ],
    [ // Schritt
      '..kppppppk..',
      '.kpppkkpppk.',
      '.kpPk..kpPk.',
      'kpPk....kpPk',
      'kppk....kppk',
      'kppk....kppk',
      'kffk...kfffk',
      'kkkk...kkkkk',
      '............',
      '............',
    ],
    [ // Beine kreuzen
      '..kpppppppk.',
      '..kpppkpppk.',
      '..kpPpkpPpk.',
      '...kpPkpPk..',
      '...kppkppk..',
      '...kppkppk..',
      '...kppkffffk',
      '...kfffkkkk.',
      '...kkkk.....',
      '............',
    ],
  ];

  const spriteCache = new Map();

  function dunkler(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const ch = (s) => Math.round(((n >> s) & 255) * f);
    return '#' + ((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0');
  }

  function sprite(c, bild) {
    const rolle = D.ROLLEN[c.rolle];
    const schluessel = c.rolle + ':' + c.id + ':' + bild;
    let cv = spriteCache.get(schluessel);
    if (cv) return cv;
    const haut = HAUT[c.id % HAUT.length], haar = HAAR[(c.id * 7) % HAAR.length];
    const off = rolle.offizier;
    const pal = {
      k: '#0e1012', c: rolle.farbe, C: dunkler(rolle.farbe, 0.78), b: off ? '#16181c' : dunkler(rolle.farbe, 0.55),
      h: haar, s: haut, S: dunkler(haut, 0.82), e: '#1a1410', m: dunkler(haut, 0.62),
      w: off ? '#d9d4c2' : '#9aa6b2', u: off ? FARBE.uniformOff : FARBE.uniform, U: off ? FARBE.uniformOffHell : FARBE.uniformHell,
      r: rolle.farbe, g: off ? '#b0903f' : '#2a241c', p: FARBE.hose, P: FARBE.hoseHell, f: FARBE.schuh,
    };
    const zeilen = OBEN.concat(BEINE[bild]);
    cv = document.createElement('canvas');
    cv.width = 12; cv.height = 28;
    const g = cv.getContext('2d');
    zeilen.forEach((z, y) => { for (let x = 0; x < 12; x++) { const k = z[x]; if (k !== '.' && pal[k]) px(g, x, y, pal[k]); } });
    spriteCache.set(schluessel, cv);
    return cv;
  }

  function figur(g, c, zeit) {
    const rolle = D.ROLLEN[c.rolle];
    const haut = HAUT[c.id % HAUT.length];
    if (c.tot) {
      const x = Math.round(c.x * F), y = BODEN - 6;
      r(g, x - 12, y + 1, 18, 5, '#3c4450'); r(g, x - 12, y + 4, 18, 1, '#2a3038');
      r(g, x - 16, y + 2, 4, 3, '#272c35');
      r(g, x + 6, y, 6, 6, '#9a9a9a'); r(g, x + 6, y, 6, 2, '#6a6a6a');
      return;
    }
    const reihe = Object.keys(D.ROLLEN).indexOf(c.rolle);
    const blatt = reihe >= 0 && reihe < 13 ? S.bilder.bild('crew_sheet') : null;
    const schlafBlatt = reihe >= 0 && reihe < 13 ? S.bilder.bild('crew_schlaf') : null;
    if (c.taetigkeit === 'schlaf' && schlafBlatt) {
      // Pixel-Grafik: 28 × 12 je Rolle, Kopf rechts auf dem Kissen
      const k = D.KOJEN[c.koje];
      const kx = k.x * F, y = (k.o ? 184 : 208) - 3;
      g.drawImage(schlafBlatt, 0, reihe * 12, 28, 12, kx - 13, y - 11, 28, 12);
      return;
    }
    if (c.taetigkeit === 'schlaf') {
      const k = D.KOJEN[c.koje];
      const kx = k.x * F, y = (k.o ? 184 : 208) - 3;
      r(g, kx + 8, y - 5, 7, 5, haut); r(g, kx + 8, y - 5, 7, 1, HAAR[(c.id * 7) % HAAR.length]);
      px(g, kx + 9, y - 3, '#1a1410');
      r(g, kx - 15, y - 6, 23, 6, FARBE.decken); r(g, kx - 15, y - 6, 23, 1, FARBE.deckenHell);
      r(g, kx - 5, y - 6, 2, 6, dunkler(rolle.farbe, 0.8));
      r(g, kx - 15, y - 1, 23, 1, '#4a3f31');
      const zz = Math.floor(zeit * 1.2 + c.id) % 3;
      if (zz > 0) { r(g, kx + 14, y - 10, 3, 1, '#e8e8e8'); px(g, kx + 15, y - 11, '#e8e8e8'); }
      if (zz > 1) { r(g, kx + 18, y - 15, 3, 1, '#c8c8c8'); px(g, kx + 19, y - 16, '#c8c8c8'); }
      return;
    }
    const bild = c.laeuft ? 1 + (Math.floor(c.anim) % 2) : 0;
    if (blatt) {
      // Pixel-Grafik: Bilder stehen, laufen 1, laufen 2, arbeiten (am Posten)
      const nr = c.laeuft ? bild : ((c.aktPosten && c.taetigkeit !== 'frei') || c.taetigkeit === 'reparatur' ? 3 : 0);
      const bx = Math.round(c.x * F) - 6, by = BODEN - 28 + (nr === 1 ? 1 : 0);
      if (c.richtung < 0) {
        g.save(); g.translate(bx + 12, by); g.scale(-1, 1); g.drawImage(blatt, nr * 12, reihe * 28, 12, 28, 0, 0, 12, 28); g.restore();
      } else g.drawImage(blatt, nr * 12, reihe * 28, 12, 28, bx, by, 12, 28);
      return;
    }
    const sp = sprite(c, bild);
    const x = Math.round(c.x * F) - 6, y = BODEN - 28 + (bild === 1 ? 1 : 0);
    if (c.richtung < 0) {
      g.save(); g.translate(x + 12, y); g.scale(-1, 1); g.drawImage(sp, 0, 0); g.restore();
    } else g.drawImage(sp, x, y);
  }

  /* ---------------- Hintergrund ---------------- */
  function mische(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
    return '#' + ((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0');
  }

  function tageslicht(st) {
    const h = (st.zeit % 1440) / 60;
    if (h < 5 || h > 21) return 0;
    if (h < 8) return (h - 5) / 3;
    if (h > 18) return (21 - h) / 3;
    return 1;
  }

  const teilchen = [];
  for (let i = 0; i < 140; i++) teilchen.push({ x: Math.random(), y: Math.random(), s: Math.random() < 0.2 ? 2 : 1 });
  let teilchenVersatz = 0;

  function transform(ans, W, H) {
    const z = ans.zoom;
    return { z, tx: Math.round(W / 2 - ans.cx * F * z), ty: Math.round(H / 2 - ans.cy * F * z) };
  }

  function hintergrund(ctx, st, W, H, t, dtReal) {
    const licht = tageslicht(st);
    const oberY = Math.round(t.ty + (B.WASSERLINIE_Y * F - st.boot.tiefe * PX_PRO_M) * t.z);
    if (oberY > 0) {
      const g = ctx.createLinearGradient(0, 0, 0, oberY);
      g.addColorStop(0, mische('#0a1020', '#5d7f97', licht));
      g.addColorStop(1, mische('#1a2436', '#a9bccb', licht));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, oberY);
    }
    const tiefe = Math.min(1, st.boot.tiefe / 160);
    const g2 = ctx.createLinearGradient(0, Math.max(0, oberY), 0, H);
    g2.addColorStop(0, mische(mische('#10283a', '#2f6f86', licht), '#071723', tiefe));
    g2.addColorStop(1, mische(mische('#081722', '#16445a', licht), '#02080d', tiefe));
    ctx.fillStyle = g2;
    ctx.fillRect(0, Math.max(0, oberY), W, H - Math.max(0, oberY));
    const p = Math.max(1, Math.round(t.z));
    if (oberY > 0 && oberY < H) {
      ctx.fillStyle = mische('#5f8ea3', '#cfe3ea', licht);
      const welle = (performance.now() / 160) % 24;
      for (let x = -24 * p; x < W + 24 * p; x += 12 * p) {
        const ox = Math.round(x + welle * p);
        ctx.fillRect(ox, oberY - p, 6 * p, p);
        ctx.fillRect(ox + 6 * p, oberY, 6 * p, p);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(0, oberY + p, W, 2 * p);
    }
    teilchenVersatz += (S.sim.knoten || 0) * dtReal * 0.004 * st.tempo;
    ctx.fillStyle = 'rgba(190,220,230,0.22)';
    for (const q of teilchen) {
      const x = (((q.x - teilchenVersatz) % 1) + 1) % 1 * W, y = q.y * H;
      if (y < oberY) continue;
      ctx.fillRect(Math.round(x), Math.round(y), q.s * p, q.s * p);
    }
  }

  let glanz = null;
  function lichtschein() {
    if (glanz) return glanz;
    glanz = document.createElement('canvas');
    glanz.width = 96; glanz.height = 72;
    const g = glanz.getContext('2d');
    const gr = g.createRadialGradient(48, 0, 2, 48, 0, 72);
    gr.addColorStop(0, 'rgba(255,214,140,0.2)');
    gr.addColorStop(1, 'rgba(255,214,140,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 96, 72);
    return glanz;
  }

  /* ---------------- Boot zeichnen ---------------- */
  function zeichneBoot(ctx, st, ans, auswahl, dtReal) {
    if (!statisch) baueStatisch();
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const t = transform(ans, W, H);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    hintergrund(ctx, st, W, H, t, dtReal);
    ctx.imageSmoothingEnabled = t.z < 1;
    ctx.setTransform(t.z, 0, 0, t.z, t.tx, t.ty);
    const zeit = performance.now() / 1000;
    const b = st.boot;
    const uw = S.sim.unterWasser(st);
    const strom = !uw || b.batterie > 0;

    // Sehrohr und Antenne
    const sehrohrOben = S.sim.eff.sehrohr > 0 && b.tiefe <= 15;
    const sy = sehrohrOben ? 6 : 34;
    r(ctx, 822, sy, 4, 60 - sy, FARBE.metallHell); r(ctx, 822, sy, 1, 60 - sy, '#aab3b8');
    r(ctx, 820, sy, 8, 4, FARBE.metall); r(ctx, 826, sy + 1, 3, 2, '#1a2523');
    r(ctx, 802, 22, 1, 34, '#8a8f95'); r(ctx, 798, 22, 9, 1, '#8a8f95');
    ctx.drawImage(S.bilder.bild('boot_querschnitt') || statisch, 0, 0);

    // Schraube
    const drehung = S.sim.knoten > 0 ? Math.floor(zeit * 14) % 3 : 0;
    const blatt = [[162, 34], [168, 22], [156, 46]][drehung];
    r(ctx, 26, blatt[0], 5, blatt[1], FARBE.messing); r(ctx, 26, blatt[0], 1, blatt[1], FARBE.messingHell);
    r(ctx, 24, 175, 9, 8, FARBE.messing);
    if (S.sim.knoten > 0 && uw) {
      ctx.fillStyle = 'rgba(210,235,245,0.5)';
      for (let k = 0; k < 8; k++) { const bx = 18 - ((zeit * 40 + k * 23) % 90); ctx.fillRect(Math.round(bx), 168 + ((k * 13) % 22), 2, 2); }
    }

    // Laderaum: Kisten, Fässer, hängender Proviant
    const le = S.sim.ladeEinheiten(st.ladung) / D.LADERAUM_LE;
    const kisten = Math.round(le * 18);
    for (let k = 0; k < kisten; k++) {
      const reihe = Math.floor(k / 9);
      kiste(ctx, 416 + (k % 9) * 12 + (reihe === 1 ? 2 : 0), reihe ? 182 : 208, (k * 5 + reihe) % 3);
    }
    const proviant = Math.min(10, Math.ceil(st.ladung.proviant / 60));
    for (let k = 0; k < proviant; k++) {
      const hx = 418 + k * 11, lang = k % 3 === 1;
      r(ctx, hx + 2, DECKE + 13, 1, 4, '#5a4a36');
      r(ctx, hx, DECKE + 17, lang ? 4 : 6, lang ? 10 : 7, lang ? '#8a4a2a' : '#b07a4a');
      r(ctx, hx, DECKE + 17, 1, lang ? 10 : 7, lang ? '#a65d37' : '#cc9360');
    }
    // Reservetorpedos unter den Kojen
    for (let k = 0; k < Math.min(4, st.ladung.torpedos); k++) {
      const tx = 1058 + k * 32, ty = 213;
      r(ctx, tx, ty, 28, 6, '#5a675e'); r(ctx, tx, ty, 28, 1, '#7a877e'); r(ctx, tx + 24, ty, 4, 6, '#454f48');
      r(ctx, tx, ty + 1, 3, 4, '#8a7440'); r(ctx, tx + 8, ty, 1, 6, '#3a433d');
    }
    // Rohre geladen?
    b.rohre.forEach((voll, i) => { r(ctx, 1197 + (i % 2) * 8, 156 + Math.floor(i / 2) * 28, 2, 2, voll ? '#7fd18b' : '#5a1a1a'); });
    // Tiefenmesser-Zeiger
    const w = Math.PI * 0.75 + Math.min(1, b.tiefe / D.ZERSTOERUNGSTIEFE) * Math.PI * 1.5;
    for (let k = 1; k <= 6; k++) px(ctx, Math.round(737 + Math.cos(w) * k), Math.round(164 + Math.sin(w) * k), '#b22');
    // Funk-Lämpchen, Horch- und Rechnerschirm
    const funkAktiv = st.funk.anfrage || st.funk.nachrichten.some((n) => !n.fertig);
    for (let k = 0; k < 6; k++) r(ctx, 933 + k * 4, 170, 2, 2, funkAktiv && (Math.floor(zeit * 4) + k) % 3 === 0 ? '#ff6a4a' : '#3a2a22');
    if (S.sim.eff.sonar > 0) {
      const ww = zeit * 1.6;
      for (let k = 1; k < 8; k++) px(ctx, Math.round(1023 + Math.cos(ww) * k), Math.round(184 + Math.sin(ww) * k), '#7fe08a');
    }
    if (S.sim.eff.torpedo > 0) r(ctx, 763 + Math.floor(zeit * 3) % 12, 192, 2, 3, '#7fe08a');
    // Dampf über der Kombüse
    if (S.sim.eff.kombuese > 0) {
      ctx.fillStyle = 'rgba(230,230,230,0.45)';
      for (let k = 0; k < 4; k++) { const dy = (zeit * 10 + k * 5) % 18; ctx.fillRect(Math.round(703 + Math.sin(zeit * 2 + k) * 2), Math.round(180 - dy), 2, 2); }
    }

    // Lichtschein der Lampen
    if (strom) {
      ctx.globalCompositeOperation = 'lighter';
      const gl = lichtschein();
      for (const a of D.ABTEILE) for (const lx of lampenX(a)) ctx.drawImage(gl, Math.round(lx) - 48, DECKE + 14);
      ctx.globalCompositeOperation = 'source-over';
    }

    // Schotten / Türen
    b.schotten.forEach((zu, i) => {
      const x = D.ABTEILE[i].x1 * F;
      const oy = 168, oh = BODEN - oy;
      if (zu) {
        r(ctx, x - 4, oy, 8, oh, FARBE.tuerZu);
        r(ctx, x - 4, oy, 1, oh, FARBE.tuerZuHell);
        for (let y = oy + 3; y < BODEN; y += 8) { px(ctx, x - 2, y, '#5a2a20'); px(ctx, x + 2, y, '#5a2a20'); }
        handrad(ctx, x, oy + 22, 3, FARBE.rad);
      } else {
        r(ctx, x - 3, oy + 2, 6, oh - 2, FARBE.tuerOffen);
        r(ctx, x - 2, oy, 4, 2, FARBE.tuerOffen);
      }
      r(ctx, x - 4, oy - 2, 8, 2, '#1b1f1d');
    });

    // Crew (ausgewählte Person zuletzt)
    const sortiert = st.crew.slice().sort((a, c) => (a.id === auswahl.crew) - (c.id === auswahl.crew));
    for (const c of sortiert) figur(ctx, c, zeit);

    // Wasser in den Abteilen
    b.abteile.forEach((a, i) => {
      if (a.wasser <= 0.002) return;
      const ab = D.ABTEILE[i], x0 = ab.x0 * F, x1 = ab.x1 * F;
      const h = Math.max(1, Math.round(a.wasser * (BODEN + 6 - DECKE)));
      const y = BODEN + 6 - h;
      ctx.fillStyle = 'rgba(40,112,152,0.58)';
      ctx.fillRect(x0, y, x1 - x0, h + 8);
      ctx.fillStyle = 'rgba(170,220,240,0.85)';
      for (let x = x0; x < x1; x += 6) ctx.fillRect(x + (Math.floor(zeit * 5 + x) % 3), y - (Math.floor(zeit * 3 + x / 6) % 2), 3, 1);
      ctx.fillStyle = 'rgba(170,220,240,0.25)';
      ctx.fillRect(x0, y + 2, x1 - x0, 1);
    });
    // Tropfende Lecks
    if (uw) {
      b.abteile.forEach((a, i) => {
        if (a.rumpf >= 90) return;
        const ab = D.ABTEILE[i], x0 = ab.x0 * F, wd = (ab.x1 - ab.x0) * F;
        const n = Math.ceil((90 - a.rumpf) / 10);
        ctx.fillStyle = '#9fd4ea';
        for (let k = 0; k < n; k++) {
          const x = x0 + 8 + Math.floor(hash(k, i) * (wd - 16));
          const y = DECKE + 13 + ((zeit * 60 + k * 31) % 66);
          ctx.fillRect(x, Math.round(y), 1, 3);
        }
      });
    }

    // Abdunkelung und Alarmlicht
    const bx0 = D.ABTEILE[0].x0 * F, bw = D.ABTEILE[D.ABTEILE.length - 1].x1 * F - bx0;
    if (!strom) { ctx.fillStyle = 'rgba(40,0,0,0.55)'; ctx.fillRect(bx0, DECKE, bw, BODEN + 6 - DECKE); }
    if (st.alarm) {
      ctx.fillStyle = 'rgba(255,40,30,' + (0.08 + 0.06 * Math.sin(zeit * 5)) + ')';
      ctx.fillRect(bx0, DECKE, bw, BODEN + 6 - DECKE);
    }

    // Auswahl
    if (auswahl.abteil != null) {
      const ab = D.ABTEILE[auswahl.abteil];
      ctx.strokeStyle = '#f2d16b';
      ctx.lineWidth = Math.max(1, 2 / t.z);
      ctx.strokeRect(ab.x0 * F + 1, DECKE + 1, (ab.x1 - ab.x0) * F - 2, BODEN - DECKE + 4);
    }
    for (const c of st.crew) {
      if (c.tot) continue;
      const aus = c.id === auswahl.crew, ges = c.id === st.gesteuert;
      if (!aus && !ges) continue;
      const k = c.taetigkeit === 'schlaf' ? D.KOJEN[c.koje] : null;
      const mx = k ? k.x * F + 10 : Math.round(c.x * F);
      const my = k ? (k.o ? 184 : 208) - 18 : BODEN - 36 - Math.floor(zeit * 3) % 2;
      const f = ges ? '#7fe08a' : '#f2d16b';
      r(ctx, mx - 4, my, 9, 2, f); r(ctx, mx - 2, my + 2, 5, 2, f); r(ctx, mx - 1, my + 4, 3, 1, f);
      if (c.befehl != null && !ges) { ctx.fillStyle = 'rgba(242,209,107,0.7)'; ctx.fillRect(c.befehl * F - 1, BODEN, 2, 5); }
    }

    // Beschriftungen im Bildschirmraum
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const zf = t.z * F;
    const schrift = Math.max(11, Math.round(zf * 3.4));
    ctx.font = schrift + 'px VT323, monospace';
    ctx.textAlign = 'center';
    if (zf >= 1.5) {
      D.ABTEILE.forEach((a, i) => {
        const sx = t.tx + (a.x0 + a.x1) / 2 * zf, syy = t.ty + (B.DECKE_Y + 13) * zf;
        const wtxt = ctx.measureText(a.name).width;
        if (wtxt > (a.x1 - a.x0) * zf - 6) return;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(sx - wtxt / 2 - 3, syy - schrift + 2, wtxt + 6, schrift);
        ctx.fillStyle = i === auswahl.abteil ? '#f2d16b' : '#cfd8cc';
        ctx.fillText(a.name, sx, syy);
      });
    }
    for (const c of st.crew) {
      if (c.tot || (c.id !== auswahl.crew && c.id !== auswahl.hover)) continue;
      const k = c.taetigkeit === 'schlaf' ? D.KOJEN[c.koje] : null;
      const sx = t.tx + (k ? k.x + 4 : c.x) * zf;
      const syy = t.ty + (k ? (k.o ? 80 : 92) : B.BODEN_Y - 20) * zf;
      const txt = c.name + ' · ' + D.ROLLEN[c.rolle].kurz;
      const wtxt = ctx.measureText(txt).width;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(sx - wtxt / 2 - 3, syy - schrift + 1, wtxt + 6, schrift + 1);
      ctx.fillStyle = '#f2d16b';
      ctx.fillText(txt, sx, syy);
    }
  }

  /* Bildschirm -> Bootseinheiten */
  function zuBoot(ans, W, H, sx, sy) {
    const t = transform(ans, W, H);
    return { x: (sx - t.tx) / t.z / F, y: (sy - t.ty) / t.z / F };
  }

  /* tol: zusätzliche Trefferfläche in Bootseinheiten (für Finger). Die nächste Figur gewinnt. */
  function treffer(st, p, tol) {
    tol = tol || 0;
    let beste = null, bd = Infinity;
    for (const c of st.crew) {
      if (c.tot) continue;
      let mx, my, bx, by;
      if (c.taetigkeit === 'schlaf') {
        const k = D.KOJEN[c.koje];
        mx = k.x; my = k.o ? 89 : 101; bx = 9; by = 4.5;
      } else { mx = c.x; my = B.BODEN_Y - 7; bx = 4; by = 8; }
      const dx = Math.abs(p.x - mx), dy = Math.abs(p.y - my);
      if (dx <= bx + tol && dy <= by + tol) {
        const d = Math.hypot(dx / bx, dy / by);
        if (d < bd) { bd = d; beste = c; }
      }
    }
    if (beste) return { art: 'crew', id: beste.id };
    for (let i = 0; i < D.ABTEILE.length - 1; i++) {
      const x = D.ABTEILE[i].x1;
      if (Math.abs(p.x - x) <= 3 + tol / 2 && p.y >= 84 && p.y <= B.BODEN_Y) return { art: 'schott', i };
    }
    if (p.y >= B.DECKE_Y && p.y <= B.BODEN_Y + 3 && p.x >= D.ABTEILE[0].x0 && p.x <= D.ABTEILE[D.ABTEILE.length - 1].x1) {
      return { art: 'abteil', i: S.sim.abteilIndex(p.x), x: p.x };
    }
    return null;
  }

  S.grafik = { zeichneBoot, zuBoot, treffer, FARBE, F, ZOOMSTUFEN: [0.5, 0.75, 1, 2, 3, 4, 5, 6] };
})(window.Spiel = window.Spiel || {});
