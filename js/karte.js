/* Sehrohrtiefe – Seekarte (1 Pixel = 1 km, vergrößert ohne Glättung). */
(function (S) {
  'use strict';
  const D = S.daten;
  const W = D.WELT;
  let basis = null;

  function baueBasis() {
    const c = document.createElement('canvas');
    c.width = W.B; c.height = W.H;
    const g = c.getContext('2d');
    for (let y = 0; y < W.H; y++) {
      for (let x = 0; x < W.B; x++) {
        const land = S.sim.imLand(x + 0.5, y + 0.5);
        let f;
        if (land) {
          const kueste = !S.sim.imLand(x + 2.5, y + 0.5) || !S.sim.imLand(x - 1.5, y + 0.5) || !S.sim.imLand(x + 0.5, y + 2.5) || !S.sim.imLand(x + 0.5, y - 1.5);
          f = kueste ? '#7c865a' : ((x + y) % 7 === 0 ? '#4f5c3c' : '#55633f');
        } else {
          const feind = x > 205;
          const dither = (x + y * 3) % 9 === 0;
          f = feind ? (dither ? '#2a2632' : '#22222d') : (dither ? '#17384a' : '#123040');
          if (x % W.PLAN === 0 || y % W.PLAN === 0) f = (x + y) % 2 ? '#1f4a5c' : f;
        }
        g.fillStyle = f;
        g.fillRect(x, y, 1, 1);
      }
    }
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
    ctx.drawImage(basis, m.ox, m.oy, W.B * m.s, W.H * m.s);
    const dpr = cv.width / cv.clientWidth || 1;
    const fs = Math.round(13 * dpr);
    ctx.font = fs + 'px VT323, monospace';
    ctx.lineWidth = Math.max(1, dpr);

    // Planquadrat-Beschriftung
    ctx.fillStyle = 'rgba(160,200,210,0.45)';
    ctx.textAlign = 'left';
    for (let i = 0; i < 10; i++) ctx.fillText('ABCDEFGHIJ'[i], m.ox + (i * W.PLAN + 2) * m.s, m.oy + fs);
    for (let j = 0; j < 7; j++) ctx.fillText(String(j + 1), m.ox + 3, m.oy + (j * W.PLAN + 16) * m.s);
    ctx.fillStyle = 'rgba(220,120,120,0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('Hoheitsgewässer ' + D.FEIND_NAME, m.ox + 238 * m.s, m.oy + 196 * m.s);

    const b = st.boot;
    const bp = P(b);
    // Sicht- und Horchweite
    const eff = S.sim.eff;
    const sicht = !S.sim.unterWasser(st) ? 14 : (S.sim.antenneFrei(st) && eff.sehrohr > 0 ? 9 * Math.min(1, eff.sehrohr) : 0);
    const sonar = eff.sonar > 0 ? (S.sim.unterWasser(st) ? 18 : 6) * Math.min(1, eff.sonar) : 0;
    if (sicht > 0) kreis(ctx, bp.x, bp.y, sicht * m.s, 'rgba(240,220,140,0.35)', [4 * dpr, 4 * dpr]);
    if (sonar > 0) kreis(ctx, bp.x, bp.y, sonar * m.s, 'rgba(190,150,220,0.3)', [2 * dpr, 6 * dpr]);

    // Häfen
    for (const h of D.HAEFEN) {
      const p = P(h);
      ctx.fillStyle = h.typ === 'basis' ? '#7fd18b' : '#e0c36a';
      ctx.fillRect(Math.round(p.x - 3 * dpr), Math.round(p.y - 3 * dpr), Math.round(6 * dpr), Math.round(6 * dpr));
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
      const bekannt = s.entdeckt === 'sicht' || s.ident >= 1;
      const farbe = !bekannt ? '#9aa3a8' : s.typ === 'frachter' ? '#e39a4f' : s.typ === 'zerstoerer' ? '#e0574a' : '#7fd18b';
      ctx.fillStyle = farbe;
      const g = Math.round(4 * dpr);
      if (bekannt) {
        ctx.fillRect(Math.round(p.x - g), Math.round(p.y - g / 2), g * 2, g);
        if (s.typ === 'zerstoerer') ctx.fillRect(Math.round(p.x - g / 2), Math.round(p.y - g), g, g / 2);
      } else {
        kreis(ctx, p.x, p.y, g, farbe);
      }
      ctx.textAlign = 'center';
      let t = bekannt ? D.SCHIFFSTYPEN[s.typ].name : 'Horchkontakt ' + Math.round(s.ident * 100) + ' %';
      if (s.mission) t += ' (Auftrag)';
      if (s.alarmiert) t += ' !';
      ctx.fillText(t, p.x, p.y - 7 * dpr);
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
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(200,220,220,0.7)';
    ctx.fillText('Klick: Kurs setzen · Klick auf Kontakt: Ziel wählen · ' + S.sim.planquadrat(b), cv.width - 6 * dpr, cv.height - 6 * dpr);
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
