/* Sehrohrtiefe – Pixel-Grafik des Bootes im Querschnitt.
   Alles wird in Bootspixeln (660 × 150) gezeichnet und mit ganzzahligem Zoom
   ohne Glättung vergrößert. Die Grafiken hier sind Platzhalter aus Code und
   können später durch PNG-Sprites ersetzt werden (siehe README). */
(function (S) {
  'use strict';
  const D = S.daten;
  const B = D.BOOT;
  const PX_PRO_M = 1.4;

  const FARBE = {
    rumpf: '#33403e', rumpfHell: '#43524f', rumpfDunkel: '#1f2827', kontur: '#0c1211', niete: '#56645f',
    deck: '#2a3331', turm: '#3a4846', decke: '#5c6259', messing: '#9a7b42', boden: '#242927', bilge: '#181d1c',
    schott: '#2b3230', tuerOffen: '#141917', tuerZu: '#7d3d2f', rad: '#d0a64e', holz: '#7a5a36', holzDunkel: '#5a4128',
    metall: '#5d646a', metallHell: '#7c858b', haut: '#d8a47c', hose: '#2a2f38', schuh: '#151515',
    uniformOff: '#2f3b52', uniform: '#4d5d6e', decken: '#6b5d4a', matratze: '#a89c86', lampe: '#ffd27a',
  };
  const WANDFARBEN = ['#3e4944', '#46493f', '#4a473d', '#4a4a3f', '#3e4a4c', '#3f464d', '#44473e'];

  function rumpfHalb(x) {
    const t = Math.abs((x - 330) / 314);
    if (t >= 1) return 0;
    const v = Math.pow(1 - Math.pow(t, 3.2), 1 / 3.2);
    return 40 * v * (x > 330 ? 1 : 0.96);
  }

  let statisch = null;

  function r(g, x, y, w, h, f) { g.fillStyle = f; g.fillRect(x, y, w, h); }

  function koje(g, x, o) {
    const y = o ? 92 : 104;
    r(g, x - 9, y, 18, 2, FARBE.holzDunkel);
    r(g, x - 8, y - 1, 16, 1, FARBE.matratze);
    r(g, x - 9, y - 6, 1, 8, FARBE.holzDunkel);
    r(g, x + 8, y - 6, 1, 8, FARBE.holzDunkel);
  }

  function anzeige(g, x, y) {
    r(g, x, y, 5, 5, '#1a1f1d');
    r(g, x + 1, y + 1, 3, 3, '#d9d2b8');
    r(g, x + 2, y + 2, 1, 1, '#a33');
  }

  function baueStatisch() {
    const c = document.createElement('canvas');
    c.width = B.B; c.height = B.H;
    const g = c.getContext('2d');

    // Außenhülle Spalte für Spalte
    for (let x = 14; x < 646; x++) {
      const h = rumpfHalb(x);
      if (h <= 0) continue;
      const oben = Math.round(90 - h), unten = Math.round(90 + h);
      r(g, x, oben, 1, unten - oben, FARBE.rumpf);
      r(g, x, oben, 1, 2, FARBE.rumpfHell);
      r(g, x, unten - 6, 1, 6, FARBE.rumpfDunkel);
      r(g, x, oben - 1, 1, 1, FARBE.kontur);
      r(g, x, unten, 1, 1, FARBE.kontur);
      if (x % 12 === 0) for (let y = oben + 4; y < unten - 2; y += 6) r(g, x, y, 1, 1, FARBE.niete);
      // Oberdeck
      if (x > 84 && x < 590) {
        const dt = Math.min(oben - 3, 51);
        r(g, x, dt, 1, oben - dt, FARBE.deck);
        r(g, x, dt - 1, 1, 1, FARBE.kontur);
      }
    }
    // Turm
    for (let x = 380; x < 448; x++) {
      let top = 30;
      if (x < 390) top += (390 - x) * 1.6;
      if (x > 438) top += (x - 438) * 1.4;
      top = Math.round(top);
      r(g, x, top, 1, 52 - top, FARBE.turm);
      r(g, x, top, 1, 1, FARBE.kontur);
      if (x % 6 === 0) r(g, x, top - 3, 1, 3, FARBE.kontur); // Reling
    }
    r(g, 388, 27, 50, 1, FARBE.kontur);
    r(g, 398, 40, 30, 1, FARBE.rumpfHell);
    // Ruder und Wellenbock am Heck, Torpedoklappen am Bug
    r(g, 4, 78, 4, 26, FARBE.rumpfDunkel); r(g, 3, 78, 1, 26, FARBE.kontur);
    r(g, 8, 89, 12, 3, FARBE.metall);
    for (let i = 0; i < 4; i++) r(g, 624 + (i % 2) * 6, 84 + Math.floor(i / 2) * 9, 4, 4, FARBE.kontur);

    // Innenraum (Schnitt)
    D.ABTEILE.forEach((a, i) => {
      r(g, a.x0, B.DECKE_Y, a.x1 - a.x0, B.BODEN_Y - B.DECKE_Y, WANDFARBEN[i]);
      for (let x = a.x0; x < a.x1; x += 8) r(g, x, B.DECKE_Y + 4, 1, B.BODEN_Y - B.DECKE_Y - 4, 'rgba(0,0,0,0.08)');
      r(g, a.x0, B.DECKE_Y, a.x1 - a.x0, 3, FARBE.decke);
      r(g, a.x0, B.DECKE_Y + 3, a.x1 - a.x0, 1, FARBE.messing);
      r(g, a.x0, B.DECKE_Y + 4, a.x1 - a.x0, 2, 'rgba(0,0,0,0.25)');
    });
    r(g, 44, B.BODEN_Y, 562, 3, FARBE.boden);
    for (let x = 44; x < 606; x += 2) r(g, x, B.BODEN_Y, 1, 1, '#353b38');
    r(g, 44, B.BODEN_Y + 3, 562, 4, FARBE.bilge);

    // Heckraum: E-Maschine + Kojen
    r(g, 80, 94, 26, 16, FARBE.metall); r(g, 80, 94, 26, 2, FARBE.metallHell); r(g, 84, 99, 18, 1, FARBE.kontur);
    r(g, 104, 100, 8, 3, FARBE.messing);
    koje(g, 60, 0); koje(g, 60, 1);
    // Maschinenraum: zwei Diesel und Telegraf
    for (const x0 of [118, 170]) {
      r(g, x0, 92, 30, 18, FARBE.metall); r(g, x0, 92, 30, 2, FARBE.metallHell);
      for (let k = 0; k < 5; k++) r(g, x0 + 2 + k * 6, 86, 4, 6, '#3b4045');
      r(g, x0, 80, 30, 2, FARBE.messing); r(g, x0 + 4, 82, 1, 4, FARBE.messing);
    }
    r(g, 159, 96, 2, 14, FARBE.messing); r(g, 156, 91, 8, 6, '#1a1f1d'); r(g, 157, 92, 6, 4, '#d9d2b8'); r(g, 160, 92, 1, 3, '#a33');
    // Laderaum: Regale
    r(g, 206, 84, 60, 1, FARBE.holzDunkel); r(g, 206, 97, 60, 1, FARBE.holzDunkel);
    // Mannschaftsraum: Kojen, Tisch, Kombüse
    koje(g, 282, 0); koje(g, 282, 1); koje(g, 304, 0); koje(g, 304, 1);
    r(g, 316, 101, 24, 2, FARBE.holz); r(g, 318, 103, 1, 7, FARBE.holzDunkel); r(g, 337, 103, 1, 7, FARBE.holzDunkel);
    r(g, 342, 96, 16, 14, '#55595c'); r(g, 342, 96, 16, 1, '#7c858b'); r(g, 344, 93, 4, 3, '#8a8f96'); r(g, 351, 92, 5, 4, '#6a6f74');
    // Zentrale
    r(g, 410, B.DECKE_Y, 4, 40, FARBE.metall); r(g, 410, B.DECKE_Y, 1, 40, FARBE.metallHell); r(g, 407, 96, 10, 3, FARBE.metallHell);
    for (let k = 0; k < 4; k++) anzeige(g, 364 + k * 7, 80);
    r(g, 363, 88, 30, 1, FARBE.messing);
    r(g, 366, 92, 8, 18, '#3a4040'); r(g, 394, 92, 8, 18, '#3a4040'); r(g, 396, 94, 4, 1, '#c33'); r(g, 396, 96, 4, 1, '#3c3');
    r(g, 380, 94, 9, 6, '#2a302e'); r(g, 381, 95, 7, 3, '#3a6b48');
    r(g, 424, 92, 8, 8, FARBE.rad); r(g, 426, 94, 4, 4, WANDFARBEN[4]); r(g, 427, 100, 2, 10, FARBE.metall);
    for (let y = B.DECKE_Y; y < B.BODEN_Y; y += 4) r(g, 434, y, 4, 1, FARBE.metallHell);
    r(g, 434, B.DECKE_Y, 1, 40, FARBE.metall); r(g, 437, B.DECKE_Y, 1, 40, FARBE.metall);
    r(g, 440, 100, 16, 2, FARBE.holz); r(g, 441, 99, 14, 1, '#cfc6a6'); r(g, 442, 102, 1, 8, FARBE.holzDunkel); r(g, 453, 102, 1, 8, FARBE.holzDunkel);
    // Funk- & Horchraum
    r(g, 463, 100, 18, 2, FARBE.holz); r(g, 464, 84, 16, 14, '#30373a'); r(g, 465, 85, 14, 5, '#1c2123');
    r(g, 466, 92, 3, 3, '#d9d2b8'); r(g, 471, 92, 3, 3, '#d9d2b8');
    koje(g, 490, 0); koje(g, 490, 1);
    r(g, 502, 100, 18, 2, FARBE.holz); r(g, 504, 86, 14, 12, '#30373a'); r(g, 507, 88, 8, 8, '#1c2123'); r(g, 510, 91, 2, 2, '#7fd18b');
    // Bugtorpedoraum
    koje(g, 540, 0); koje(g, 540, 1); koje(g, 562, 0); koje(g, 562, 1); koje(g, 584, 0); koje(g, 584, 1);
    r(g, 596, 76, 10, 34, '#3b4240');
    for (let i = 0; i < 4; i++) { r(g, 597 + (i % 2) * 4, 80 + Math.floor(i / 2) * 14, 4, 8, FARBE.messing); }

    // Schotten
    for (let i = 0; i < D.ABTEILE.length - 1; i++) {
      const x = D.ABTEILE[i].x1;
      r(g, x - 2, B.DECKE_Y, 4, B.BODEN_Y - B.DECKE_Y, FARBE.schott);
      r(g, x - 2, B.DECKE_Y, 1, B.BODEN_Y - B.DECKE_Y, '#3a423f');
    }
    // Endwände
    r(g, 42, B.DECKE_Y, 3, 40, FARBE.schott); r(g, 605, B.DECKE_Y, 3, 40, FARBE.schott);
    statisch = c;
  }

  /* ------- Crew-Figuren ------- */
  function figur(g, c, zeit) {
    const rolle = D.ROLLEN[c.rolle];
    const x = Math.round(c.x) - 3;
    const f = c.laeuft ? Math.floor(c.anim) % 2 : 0;
    const uni = rolle.offizier ? FARBE.uniformOff : FARBE.uniform;
    if (c.tot) {
      const y = B.BODEN_Y - 3;
      r(g, x - 4, y, 14, 3, '#6a6a6a'); r(g, x + 8, y - 1, 4, 4, '#9a9a9a');
      return;
    }
    if (c.taetigkeit === 'schlaf') {
      const k = D.KOJEN[c.koje];
      const y = k.o ? 88 : 100;
      r(g, k.x - 7, y + 1, 11, 3, FARBE.decken);
      r(g, k.x + 3, y, 4, 4, FARBE.haut);
      r(g, k.x + 3, y, 4, 1, rolle.farbe);
      if (Math.floor(zeit * 1.5 + c.id) % 3 === 0) r(g, k.x + 6, y - 4, 2, 1, '#e8e8e8');
      return;
    }
    const y = B.BODEN_Y - 14;
    // Mütze
    r(g, x + 1, y, 4, 1, rolle.farbe);
    r(g, x + (c.richtung > 0 ? 1 : 0), y + 1, 5, 1, rolle.offizier ? '#222' : rolle.farbe);
    // Kopf
    r(g, x + 1, y + 2, 4, 3, FARBE.haut);
    r(g, x + (c.richtung > 0 ? 4 : 1), y + 3, 1, 1, '#2a1a10');
    // Körper
    r(g, x + 1, y + 5, 4, 1, uni);
    r(g, x, y + 6, 6, 4, uni);
    r(g, x + 2, y + 6, 2, 1, rolle.farbe);
    r(g, x, y + 9, 6, 1, '#1b1f25');
    // Arme
    const arm = c.laeuft ? (f ? 1 : -1) : 0;
    r(g, x - 1, y + 6 + Math.max(0, arm), 1, 3, uni);
    r(g, x + 6, y + 6 + Math.max(0, -arm), 1, 3, uni);
    // Beine
    if (f === 0) { r(g, x + 1, y + 10, 2, 3, FARBE.hose); r(g, x + 3, y + 10, 2, 3, FARBE.hose); }
    else { r(g, x, y + 10, 2, 3, FARBE.hose); r(g, x + 4, y + 10, 2, 3, FARBE.hose); }
    r(g, x + (f ? 0 : 1), y + 13, 2, 1, FARBE.schuh); r(g, x + (f ? 4 : 3), y + 13, 2, 1, FARBE.schuh);
  }

  /* ------- Hintergrund: Himmel, Meer, Schwebeteilchen ------- */
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
  for (let i = 0; i < 90; i++) teilchen.push({ x: Math.random(), y: Math.random(), s: Math.random() < 0.2 ? 2 : 1 });
  let teilchenVersatz = 0;

  function hintergrund(ctx, st, W, H, ans, dtReal) {
    const licht = tageslicht(st);
    const oberY = Math.round(H / 2 + (B.WASSERLINIE_Y - st.boot.tiefe * PX_PRO_M - ans.cy) * ans.zoom);
    if (oberY > 0) {
      const g = ctx.createLinearGradient(0, 0, 0, oberY);
      g.addColorStop(0, mische('#0a1020', '#5d7f97', licht));
      g.addColorStop(1, mische('#1a2436', '#a9bccb', licht));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, oberY);
    }
    const tiefenAnteil = Math.min(1, st.boot.tiefe / 160);
    const wasserOben = mische(mische('#10283a', '#2f6f86', licht), '#071723', tiefenAnteil);
    const wasserUnten = mische(mische('#081722', '#16445a', licht), '#02080d', tiefenAnteil);
    const g2 = ctx.createLinearGradient(0, Math.max(0, oberY), 0, H);
    g2.addColorStop(0, wasserOben);
    g2.addColorStop(1, wasserUnten);
    ctx.fillStyle = g2;
    ctx.fillRect(0, Math.max(0, oberY), W, H - Math.max(0, oberY));
    if (oberY > 0 && oberY < H) {
      const z = ans.zoom;
      ctx.fillStyle = mische('#5f8ea3', '#cfe3ea', licht);
      const welle = (performance.now() / 300) % 16;
      for (let x = -16 * z; x < W + 16 * z; x += 8 * z) {
        const ox = Math.round(x + welle * z);
        ctx.fillRect(ox, oberY - z, 4 * z, z);
        ctx.fillRect(ox + 4 * z, oberY, 4 * z, z);
      }
    }
    // Schwebeteilchen zeigen die Fahrt
    teilchenVersatz += (S.sim.knoten || 0) * dtReal * 0.004 * st.tempo;
    ctx.fillStyle = 'rgba(190,220,230,0.25)';
    for (const p of teilchen) {
      const x = (((p.x - teilchenVersatz) % 1) + 1) % 1 * W;
      const y = p.y * H;
      if (y < oberY) continue;
      ctx.fillRect(Math.round(x), Math.round(y), p.s * Math.max(1, ans.zoom / 2), p.s * Math.max(1, ans.zoom / 2));
    }
  }

  /* ------- Boot zeichnen ------- */
  function zeichneBoot(ctx, st, ans, auswahl, dtReal) {
    if (!statisch) baueStatisch();
    const W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    hintergrund(ctx, st, W, H, ans, dtReal);

    const z = ans.zoom;
    const tx = Math.round(W / 2 - ans.cx * z), ty = Math.round(H / 2 - ans.cy * z);
    ctx.setTransform(z, 0, 0, z, tx, ty);
    const zeit = performance.now() / 1000;
    const b = st.boot;

    // Sehrohr
    const sehrohrOben = S.sim.eff.sehrohr > 0 && b.tiefe <= 15;
    r(ctx, 411, sehrohrOben ? 4 : 18, 2, sehrohrOben ? 26 : 12, FARBE.metallHell);
    r(ctx, 410, sehrohrOben ? 4 : 18, 4, 2, FARBE.metall);
    r(ctx, 401, 12, 1, 16, '#888');
    ctx.drawImage(statisch, 0, 0);

    // Schraube
    const dreh = S.sim.knoten > 0 ? Math.floor(zeit * 12) % 2 : 0;
    r(ctx, 12, dreh ? 82 : 86, 3, dreh ? 18 : 10, FARBE.messing);

    // Ladung im Laderaum
    const le = S.sim.ladeEinheiten(st.ladung) / D.LADERAUM_LE;
    const kisten = Math.round(le * 16);
    for (let k = 0; k < kisten; k++) {
      const reihe = k < 8 ? 0 : 1;
      const kx = 208 + (k % 8) * 7, ky = reihe ? 90 : 103;
      r(ctx, kx, ky, 6, 7, k % 3 === 0 ? '#5d6a4a' : FARBE.holz);
      r(ctx, kx, ky, 6, 1, FARBE.holzDunkel);
    }
    // Reservetorpedos im Bugraum
    for (let k = 0; k < Math.min(4, st.ladung.torpedos); k++) {
      r(ctx, 528 + k * 16, 107, 14, 3, '#55625a');
      r(ctx, 528 + k * 16, 107, 2, 3, '#7d6a3a');
    }
    // Rohre geladen?
    b.rohre.forEach((voll, i) => {
      r(ctx, 598 + (i % 2) * 4, 82 + Math.floor(i / 2) * 14, 2, 4, voll ? '#7fd18b' : '#3a1a1a');
    });
    // Funk-Lämpchen
    if (st.funk.anfrage || st.funk.nachrichten.some((n) => !n.fertig)) {
      if (Math.floor(zeit * 3) % 2) r(ctx, 476, 92, 2, 2, '#ff6a4a');
    }

    // Schotten / Türen
    b.schotten.forEach((zu, i) => {
      const x = D.ABTEILE[i].x1;
      if (zu) {
        r(ctx, x - 2, 86, 4, 24, FARBE.tuerZu);
        r(ctx, x - 1, 96, 2, 3, FARBE.rad);
      } else r(ctx, x - 1, 86, 2, 24, FARBE.tuerOffen);
      r(ctx, x - 2, 85, 4, 1, '#1b1f1d');
    });

    // Lampen
    const strom = !S.sim.unterWasser(st) || b.batterie > 0;
    D.ABTEILE.forEach((a) => {
      const mx = Math.round((a.x0 + a.x1) / 2);
      r(ctx, mx - 1, 74, 3, 2, strom ? FARBE.lampe : '#5a2020');
    });

    // Crew
    const sortiert = st.crew.slice().sort((a, c) => (a.id === auswahl.crew) - (c.id === auswahl.crew));
    for (const c of sortiert) figur(ctx, c, zeit);

    // Wasser in den Abteilen
    b.abteile.forEach((a, i) => {
      if (a.wasser <= 0.002) return;
      const ab = D.ABTEILE[i];
      const h = Math.max(1, Math.round(a.wasser * (B.BODEN_Y + 3 - B.DECKE_Y)));
      const y = B.BODEN_Y + 3 - h;
      ctx.fillStyle = 'rgba(44,118,158,0.6)';
      ctx.fillRect(ab.x0, y, ab.x1 - ab.x0, h + 4);
      ctx.fillStyle = 'rgba(160,215,235,0.8)';
      for (let x = ab.x0; x < ab.x1; x += 4) ctx.fillRect(x + (Math.floor(zeit * 4 + x) % 2), y, 2, 1);
    });
    // Tropfende Lecks
    if (S.sim.unterWasser(st)) {
      b.abteile.forEach((a, i) => {
        if (a.rumpf >= 90) return;
        const ab = D.ABTEILE[i];
        const n = Math.ceil((90 - a.rumpf) / 15);
        ctx.fillStyle = '#9fd4ea';
        for (let k = 0; k < n; k++) {
          const x = ab.x0 + 4 + ((k * 37 + i * 13) % (ab.x1 - ab.x0 - 8));
          const y = 76 + ((zeit * 28 + k * 17) % 34);
          ctx.fillRect(x, Math.round(y), 1, 2);
        }
      });
    }

    // Abdunkelung und Alarmlicht
    if (!strom) { ctx.fillStyle = 'rgba(40,0,0,0.5)'; ctx.fillRect(44, B.DECKE_Y, 562, 44); }
    if (st.alarm) {
      ctx.fillStyle = 'rgba(255,40,30,' + (0.08 + 0.06 * Math.sin(zeit * 5)) + ')';
      ctx.fillRect(44, B.DECKE_Y, 562, 44);
    }

    // Auswahl
    if (auswahl.abteil != null) {
      const ab = D.ABTEILE[auswahl.abteil];
      ctx.strokeStyle = '#f2d16b'; ctx.lineWidth = 1 / z * Math.max(1, Math.floor(z / 2));
      ctx.strokeRect(ab.x0 + 0.5, B.DECKE_Y + 0.5, ab.x1 - ab.x0 - 1, B.BODEN_Y - B.DECKE_Y + 2);
    }
    for (const c of st.crew) {
      if (c.tot) continue;
      const aus = c.id === auswahl.crew, ges = c.id === st.gesteuert;
      if (!aus && !ges) continue;
      const k = c.taetigkeit === 'schlaf' ? D.KOJEN[c.koje] : null;
      const px = k ? k.x + 4 : Math.round(c.x);
      const py = k ? (k.o ? 84 : 96) : B.BODEN_Y - 17;
      ctx.fillStyle = ges ? '#7fe08a' : '#f2d16b';
      ctx.fillRect(px - 2, py - 1, 5, 1); ctx.fillRect(px - 1, py, 3, 1); ctx.fillRect(px, py + 1, 1, 1);
      if (c.befehl != null && !ges) { ctx.fillStyle = 'rgba(242,209,107,0.6)'; ctx.fillRect(c.befehl, B.BODEN_Y, 1, 3); }
    }

    // Beschriftungen im Bildschirmraum
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const schrift = Math.max(10, Math.round(z * 3.2));
    ctx.font = schrift + 'px VT323, monospace';
    ctx.textAlign = 'center';
    if (z >= 2) {
      D.ABTEILE.forEach((a, i) => {
        const sx = tx + (a.x0 + a.x1) / 2 * z, sy = ty + (B.DECKE_Y + 11) * z;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        const w = ctx.measureText(a.name).width;
        if (w > (a.x1 - a.x0) * z - 4) return;
        ctx.fillRect(sx - w / 2 - 3, sy - schrift + 2, w + 6, schrift);
        ctx.fillStyle = i === auswahl.abteil ? '#f2d16b' : '#cfd8cc';
        ctx.fillText(a.name, sx, sy);
      });
    }
    for (const c of st.crew) {
      if (c.tot || (c.id !== auswahl.crew && c.id !== auswahl.hover)) continue;
      const k = c.taetigkeit === 'schlaf' ? D.KOJEN[c.koje] : null;
      const sx = tx + (k ? k.x + 2 : c.x) * z;
      const sy = ty + (k ? (k.o ? 82 : 94) : B.BODEN_Y - 19) * z;
      const t = c.name + ' · ' + D.ROLLEN[c.rolle].kurz;
      const w = ctx.measureText(t).width;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(sx - w / 2 - 3, sy - schrift + 1, w + 6, schrift + 1);
      ctx.fillStyle = '#f2d16b';
      ctx.fillText(t, sx, sy);
    }
    return { tx, ty };
  }

  /* Bildschirm -> Bootspixel */
  function zuBoot(ans, W, H, sx, sy) {
    const z = ans.zoom;
    const tx = Math.round(W / 2 - ans.cx * z), ty = Math.round(H / 2 - ans.cy * z);
    return { x: (sx - tx) / z, y: (sy - ty) / z };
  }

  /* Was liegt unter dem Zeiger? */
  function treffer(st, p) {
    for (const c of st.crew.slice().reverse()) {
      if (c.tot) continue;
      if (c.taetigkeit === 'schlaf') {
        const k = D.KOJEN[c.koje];
        const y = k.o ? 88 : 100;
        if (p.x >= k.x - 8 && p.x <= k.x + 8 && p.y >= y - 2 && p.y <= y + 5) return { art: 'crew', id: c.id };
      } else if (p.x >= c.x - 4 && p.x <= c.x + 4 && p.y >= B.BODEN_Y - 16 && p.y <= B.BODEN_Y + 1) return { art: 'crew', id: c.id };
    }
    for (let i = 0; i < D.ABTEILE.length - 1; i++) {
      const x = D.ABTEILE[i].x1;
      if (Math.abs(p.x - x) <= 3 && p.y >= 84 && p.y <= B.BODEN_Y) return { art: 'schott', i };
    }
    if (p.y >= B.DECKE_Y && p.y <= B.BODEN_Y + 3 && p.x >= D.ABTEILE[0].x0 && p.x <= D.ABTEILE[D.ABTEILE.length - 1].x1) {
      return { art: 'abteil', i: S.sim.abteilIndex(p.x), x: p.x };
    }
    return null;
  }

  S.grafik = { zeichneBoot, zuBoot, treffer, FARBE };
})(window.Spiel = window.Spiel || {});
