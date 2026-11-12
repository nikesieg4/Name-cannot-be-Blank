/* Sehrohrtiefe – Seekarte (1 Pixel = 1 km, vergrößert ohne Glättung). */
(function (S) {
  'use strict';
  const D = S.daten;
  const W = D.WELT;
  let basis = null;

  /* Grundkarte mit doppelter Auflösung (2 Pixel pro km), ausgefranste Küsten und Flachwasser. */
  const KF = 2;
  function baueBasis() {
    const bw = W.B * KF, bh = W.H * KF;
    const land = new Uint8Array(bw * bh);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      const kx = (x + 0.5) / KF, ky = (y + 0.5) / KF;
      const nx = Math.sin(ky * 0.9 + kx * 0.13) * 0.7 + Math.sin(ky * 0.31 - kx * 0.27) * 1.1;
      const ny = Math.sin(kx * 0.8 - ky * 0.11) * 0.7 + Math.sin(kx * 0.29 + ky * 0.23) * 1.1;
      land[y * bw + x] = S.sim.imLand(kx + nx, ky + ny) && kx > 0 && ky > 0 && kx < W.B && ky < W.H ? 1 : 0;
    }
    const istLand = (x, y) => x < 0 || y < 0 || x >= bw || y >= bh ? 0 : land[y * bw + x];
    const c = document.createElement('canvas');
    c.width = bw; c.height = bh;
    const g = c.getContext('2d');
    const bild = g.createImageData(bw, bh);
    const farbe = (i, hex) => { const n = parseInt(hex.slice(1), 16); bild.data[i] = n >> 16; bild.data[i + 1] = (n >> 8) & 255; bild.data[i + 2] = n & 255; bild.data[i + 3] = 255; };
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      const i = (y * bw + x) * 4;
      let naehe = 9;
      for (let dy = -5; dy <= 5 && naehe > 0; dy++) for (let dx = -5; dx <= 5; dx++) {
        if (istLand(x + dx, y + dy)) { const d = Math.max(Math.abs(dx), Math.abs(dy)); if (d < naehe) naehe = d; }
      }
      const kx = x / KF, ky = y / KF;
      if (land[y * bw + x]) {
        const kueste = !istLand(x + 1, y) || !istLand(x - 1, y) || !istLand(x, y + 1) || !istLand(x, y - 1);
        let f = (x * 7 + y * 13) % 11 === 0 ? '#4c593a' : (x + y) % 9 === 0 ? '#5d6c45' : '#55633f';
        let innen = 9;
        for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (!istLand(x + dx, y + dy)) innen = Math.min(innen, Math.max(Math.abs(dx), Math.abs(dy)));
        if (innen >= 3 && (x * 3 + y * 5) % 17 === 0) f = '#46523a';
        if (innen === 2) f = '#6a7550';
        if (kueste) f = '#a39a6e';
        farbe(i, f);
      } else {
        const feind = kx > 205;
        const dither = (x + y * 3) % 7 === 0;
        let f = feind ? (dither ? '#2a2632' : '#22222d') : (dither ? '#17384a' : '#123040');
        if (naehe <= 1) f = '#3f7f8c';
        else if (naehe <= 2) f = (x + y) % 2 ? '#2c6273' : '#22505f';
        else if (naehe <= 4) f = (x + y) % 2 ? '#1a4556' : f;
        if ((x % (W.PLAN * KF) === 0 || y % (W.PLAN * KF) === 0) && (x + y) % 3 !== 0) f = '#24515f';
        farbe(i, f);
      }
    }
    g.putImageData(bild, 0, 0);
    basis = c;
  }

  function masstab(cv) {
    const s = Math.min(cv.width / W.B, cv.height / W.H);
    return { s, ox: Math.round((cv.width - W.B * s) / 2), oy: Math.round((cv.height - W.H * s) / 2) };
  }

  function kreis(ctx, x, y, rad, farbe, strich) {
    ctx.beginPath();
    ctx.setLineDash(strich || []);
    ctx.strokeStyle = farbe;
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function zeichne(cv, st) {
    if (!basis) baueBasis();
    const ctx = cv.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#0b1a22';
    ctx.fillRect(0, 0, cv.width, cv.height);
    const m = masstab(cv);
    const P = (p) => ({ x: m.ox + p.x * m.s, y: m.oy + p.y * m.s });
    ctx.drawImage(S.bilder.bild('karte_leer') || basis, m.ox, m.oy, W.B * m.s, W.H * m.s);
    const dpr = cv.width / cv.clientWidth || 1;
    const fs = Math.round(13 * dpr);
    const symbole = S.bilder.bild('karte_symbole');
    const sg = 12 * Math.max(1, Math.round(dpr));
    /* Kartensymbol aus grafik/karte_symbole.png: 0 Boot, 1 Frachter, 2 Zerstörer, 3 Händler, 4 Unbekannt, 5 Stützpunkt, 6 Hafen, 7 Ziel */
    const symbol = (nr, p) => ctx.drawImage(symbole, nr * 12, 0, 12, 12, Math.round(p.x - sg / 2), Math.round(p.y - sg / 2), sg, sg);
    ctx.font = fs + 'px VT323, monospace';
    ctx.lineWidth = Math.max(1, dpr);

    // Planquadrat-Beschriftung
    ctx.fillStyle = 'rgba(160,200,210,0.45)';
    ctx.textAlign = 'left';
    for (let i = 0; i < 10; i++) ctx.fillText('ABCDEFGHIJ'[i], m.ox + (i * W.PLAN + 2) * m.s, m.oy + fs);
    for (let j = 0; j < 7; j++) ctx.fillText(String(j + 1), m.ox + 3, m.oy + (j * W.PLAN + 16) * m.s);
    ctx.fillStyle = 'rgba(220,120,120,0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('Hoheitsgewässer ' + D.FEIND_NAME, m.ox + 238 * m.s, m.oy + 175 * m.s);

    const b = st.boot;
    const bp = P(b);
    // Sicht- und Horchweite
    const eff = S.sim.eff;
    const sicht = !S.sim.unterWasser(st) ? 14 : (S.sim.antenneFrei(st) && eff.sehrohr > 0 ? 9 * Math.min(1, eff.sehrohr) : 0);
    const sonar = S.sim.horchweite(st, eff);
    if (sicht > 0) kreis(ctx, bp.x, bp.y, sicht * m.s, 'rgba(240,220,140,0.35)', [4 * dpr, 4 * dpr]);
    if (sonar > 0) kreis(ctx, bp.x, bp.y, sonar * m.s, 'rgba(190,150,220,0.3)', [2 * dpr, 6 * dpr]);

    // Häfen
    for (const h of D.HAEFEN) {
      const p = P(h);
      if (symbole) symbol(h.typ === 'basis' ? 5 : 6, p);
      else {
        ctx.fillStyle = h.typ === 'basis' ? '#7fd18b' : '#e0c36a';
        ctx.fillRect(Math.round(p.x - 3 * dpr), Math.round(p.y - 3 * dpr), Math.round(6 * dpr), Math.round(6 * dpr));
      }
      ctx.fillStyle = '#e8ecd8';
      ctx.textAlign = 'left';
      ctx.fillText(h.name, p.x + 6 * dpr, p.y + 4 * dpr);
    }

    // Aufträge
    for (const mi of st.missionen) {
      if (mi.status !== 'aktiv') continue;
      if (mi.typ === 'patrouille') {
        const p = P(mi.ziel);
        kreis(ctx, p.x, p.y, 6 * m.s, '#f2d16b', [3 * dpr, 3 * dpr]);
        ctx.fillStyle = '#f2d16b'; ctx.textAlign = 'center';
        ctx.fillText('Patrouille', p.x, p.y - 6 * m.s - 3 * dpr);
      }
    }

    // Kurs
    if (b.wegpunkt) {
      const w = P(b.wegpunkt);
      ctx.strokeStyle = 'rgba(127,224,138,0.8)';
      ctx.setLineDash([5 * dpr, 4 * dpr]);
      ctx.beginPath(); ctx.moveTo(bp.x, bp.y); ctx.lineTo(w.x, w.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#7fe08a';
      ctx.fillRect(Math.round(w.x - 2 * dpr), Math.round(w.y - 2 * dpr), Math.round(4 * dpr), Math.round(4 * dpr));
    }

    // Schiffe
    for (const s of st.schiffe) {
      const p = P(s);
      if (s.versenkt) {
        if (!s.versenktZeit) continue;
        ctx.strokeStyle = 'rgba(200,200,200,0.5)';
        ctx.beginPath(); ctx.moveTo(p.x - 3 * dpr, p.y - 3 * dpr); ctx.lineTo(p.x + 3 * dpr, p.y + 3 * dpr);
        ctx.moveTo(p.x + 3 * dpr, p.y - 3 * dpr); ctx.lineTo(p.x - 3 * dpr, p.y + 3 * dpr); ctx.stroke();
        continue;
      }
      if (s.entdeckt === 'nein') continue;
      const bekannt = S.sim.bekannt(s);
      const farbe = !bekannt ? '#9aa3a8' : s.typ === 'frachter' ? '#e39a4f' : s.typ === 'zerstoerer' ? '#e0574a' : '#7fd18b';
      ctx.fillStyle = farbe;
      const g = Math.round(4 * dpr);
      if (symbole) symbol(!bekannt ? 4 : s.typ === 'frachter' ? 1 : s.typ === 'zerstoerer' ? 2 : 3, p);
      else if (bekannt) {
        ctx.fillRect(Math.round(p.x - g), Math.round(p.y - g / 2), g * 2, g);
        if (s.typ === 'zerstoerer') ctx.fillRect(Math.round(p.x - g / 2), Math.round(p.y - g), g, g / 2);
      } else {
        kreis(ctx, p.x, p.y, g, farbe);
      }
      ctx.textAlign = 'center';
      let t = bekannt ? D.SCHIFFSTYPEN[s.typ].name : 'Horchkontakt ' + Math.round(s.ident * 100) + ' %' + (s.ident >= 1 ? ' – abgleichen' : '');
      if (s.mission) t += ' (Auftrag)';
      if (s.alarmiert) t += ' !';
      ctx.fillText(t, p.x, p.y - (symbole ? sg / 2 + 3 * dpr : 7 * dpr));
      if (st.ziel === s.id) kreis(ctx, p.x, p.y, 9 * dpr, '#ff6a4a');
    }

    // Torpedos
    ctx.fillStyle = '#ffffff';
    for (const t of st.torpedos) { const p = P(t); ctx.fillRect(Math.round(p.x - dpr), Math.round(p.y - dpr), Math.round(2 * dpr), Math.round(2 * dpr)); }

    // Boot
    ctx.save();
    ctx.translate(bp.x, bp.y);
    ctx.rotate(b.kurs);
    ctx.fillStyle = S.sim.unterWasser(st) ? '#6fb7d6' : '#f1ede2';
    ctx.beginPath();
    ctx.moveTo(7 * dpr, 0); ctx.lineTo(-5 * dpr, -4 * dpr); ctx.lineTo(-3 * dpr, 0); ctx.lineTo(-5 * dpr, 4 * dpr);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // Legende
    const legende = 'Tippen/Klicken: Kurs · auf Kontakt: Ziel · Boot in ' + S.sim.planquadrat(b);
    ctx.textAlign = 'left';
    const lw = ctx.measureText(legende).width;
    const lx = m.ox + 6 * dpr, ly = m.oy + W.H * m.s - 6 * dpr;
    ctx.fillStyle = 'rgba(8,18,24,0.75)';
    ctx.fillRect(lx - 3 * dpr, ly - fs + 2 * dpr, Math.min(lw, W.B * m.s - 12 * dpr) + 6 * dpr, fs + 2 * dpr);
    ctx.fillStyle = 'rgba(210,225,225,0.85)';
    ctx.fillText(legende, lx, ly, W.B * m.s - 12 * dpr);
  }

  function zuWelt(cv, sx, sy) {
    const m = masstab(cv);
    return { x: (sx - m.ox) / m.s, y: (sy - m.oy) / m.s };
  }

  function schiffBei(st, p, radiusKm) {
    let best = null, bd = radiusKm;
    for (const s of st.schiffe) {
      if (s.versenkt || s.entdeckt === 'nein') continue;
      const d = Math.hypot(s.x - p.x, s.y - p.y);
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  }

  S.karte = { zeichne, zuWelt, schiffBei, masstab };
})(window.Spiel = window.Spiel || {});
