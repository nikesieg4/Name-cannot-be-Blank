/* Sehrohrtiefe – Blick durchs Sehrohr (getaucht) bzw. durchs Fernglas auf der Brücke (aufgetaucht).
   Gezeichnet in niedriger Auflösung und ohne Glättung vergrößert. Das Spiel läuft dabei weiter. */
(function (S) {
  'use strict';
  const D = S.daten;
  const $ = (id) => document.getElementById(id);
  const W = 320, H = 200, HORIZONT = 104;
  const LAENGE = { frachter: 0.13, zerstoerer: 0.1, haendler: 0.06 };   // Schiffslänge in km
  const GRAD = Math.PI / 180;

  let offen = false;
  let rel = 0;          // Blickrichtung relativ zum Bug in Grad (0 = voraus, 90 = Steuerbord)
  let stark = false;    // 6-fache statt 1,5-facher Vergrößerung
  let zeit = 0;         // Laufzeit für Wellen
  let imKreuz = null;   // Schiff im Fadenkreuz
  let landCache = null;
  let ziehen = null;
  const puffer = document.createElement('canvas');

  const sichtfeld = () => (stark ? 8 : 32) * GRAD;
  const mische = (a, b, t) => {
    const p = (h) => h[0] === '#' ? [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)] : h.match(/\d+/g).map(Number);
    const x = p(a), y = p(b);
    return 'rgb(' + x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',') + ')';
  };
  const rausch = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
  const winkel = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

  function oeffne(st) {
    const b = st.boot;
    if (b.tiefe > 15) { S.sim.log(st, 'Sehrohr geht nur bis Sehrohrtiefe (13 m).', 'warn'); return false; }
    if (b.tiefe > 4) S.sim.sehrohr(st, true);
    offen = true; S.sim.blick = true; landCache = null;
    const oben = b.tiefe <= 4;
    let h = '<h1>' + (oben ? 'Brücke · Fernglas' : 'Angriffssehrohr') + '</h1><div class="sehrohr">';
    h += '<canvas id="sehrohrBild" width="' + W + '" height="' + H + '" aria-label="Blick durch das Sehrohr"></canvas>';
    h += '<div class="knopfraster sechs">' + [[-20, '« 20°'], [-5, '‹ 5°'], [-1, '‹ 1°'], [1, '1° ›'], [5, '5° ›'], [20, '20° »']].map(([g, t]) =>
      '<button data-aktion="sehrohrDreh" data-arg="' + g + '">' + t + '</button>').join('') + '</div>';
    h += '<div class="zeile"><span id="sehrohrPeilung" class="etikett"></span><span id="sehrohrWetter" class="klein"></span></div>';
    h += '<div id="sehrohrInfo" class="nachricht"></div>';
    h += '<p><button data-aktion="sehrohrZoom" id="sehrohrZoom"></button> <button data-aktion="sehrohrZiel" id="sehrohrZiel" class="aktiv">Ziel erfassen</button> ' +
      '<button data-aktion="sehrohrEin">' + (oben ? 'Schließen' : 'Sehrohr einfahren') + '</button>' + (oben ? '' : ' <button data-aktion="modalZu">Schließen (bleibt ausgefahren)</button>') + '</p>';
    h += '<p class="klein">Drehen mit den Knöpfen, den Pfeiltasten oder durch Ziehen im Bild. Ein ausgefahrenes Sehrohr kann bei Tag aus der Nähe entdeckt werden – vor allem bei glatter See und hoher Fahrt.</p></div>';
    S.ui.oeffne(h);
    const cv = $('sehrohrBild');
    cv.addEventListener('pointerdown', (e) => { ziehen = { x: e.clientX, rel }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', (e) => {
      if (!ziehen) return;
      const gradProPx = (sichtfeld() / GRAD) / cv.getBoundingClientRect().width;
      rel = (ziehen.rel - (e.clientX - ziehen.x) * gradProPx + 360) % 360;
    });
    const los = () => { ziehen = null; };
    cv.addEventListener('pointerup', los); cv.addEventListener('pointercancel', los);
    return true;
  }

  /* Küstenlinie im Blickfeld: je Bildspalte die Entfernung bis zum ersten Land */
  function land(st, blick, weite) {
    const b = st.boot;
    const key = Math.round(blick * 300) + '|' + stark + '|' + Math.round(b.x * 2) + '|' + Math.round(b.y * 2) + '|' + Math.round(weite);
    if (landCache && landCache.key === key) return landCache.spalten;
    const spalten = [], fov = sichtfeld();
    for (let x = 0; x < W; x += 4) {
      const w = blick + (x + 2 - W / 2) / W * fov;
      let treffer = null;
      for (let d = 0.6; d < weite; d += d < 6 ? 0.4 : 1) {
        const px = b.x + Math.cos(w) * d, py = b.y + Math.sin(w) * d;
        if (px < 0 || py < 0 || px > D.WELT.B || py > D.WELT.H) break;
        if (S.sim.imLand(px, py)) { treffer = { d, n: rausch(Math.round(px / 3) * 31 + Math.round(py / 3) * 17) }; break; }
      }
      spalten.push(treffer);
    }
    landCache = { key, spalten };
    return spalten;
  }

  function zeichne(st, dtReal) {
    const cv = $('sehrohrBild');
    if (!offen) return;
    if (!cv) { geschlossen(); return; }
    zeit += dtReal;
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    const b = st.boot, w = S.sim.wetter(st), hell = S.sim.licht(st);
    const oben = b.tiefe <= 4;
    const unterWasser = !oben && !S.sim.sehrohrOben(st);
    const fov = sichtfeld(), pxRad = W / fov;
    const blick = b.kurs + rel * GRAD;
    imKreuz = null;

    if (unterWasser) {
      // Unter Sehrohrtiefe: nur noch Wasser – die Oberfläche ist nicht mehr zu sehen
      const t = Math.min(1, b.tiefe / 120);
      const gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, mische(mische('#0e2c36', '#2f7480', hell), '#03090c', t));
      gr.addColorStop(1, mische(mische('#06161c', '#134049', hell), '#010405', t));
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(200,230,230,0.25)';
      for (let i = 0; i < 40; i++) {
        const x = (rausch(i) * W + zeit * (6 + rausch(i + 9) * 10)) % W, y = (rausch(i + 50) * H + Math.sin(zeit + i) * 3 + H) % H;
        g.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    } else {
      const wank = oben ? Math.sin(zeit * 0.9) * w.seegang * 0.5 : Math.sin(zeit * 1.3) * w.seegang * 0.35;
      const hy = Math.round(HORIZONT + wank);
      // Himmel
      const tagOben = w.bedeckt ? '#7d8b93' : '#5f8fb5', tagUnten = w.bedeckt ? '#a9b2b6' : '#c4d8e2';
      const himmel = g.createLinearGradient(0, 0, 0, hy);
      himmel.addColorStop(0, mische('#05080f', tagOben, hell));
      himmel.addColorStop(1, mische('#0f1722', tagUnten, hell));
      g.fillStyle = himmel; g.fillRect(0, 0, W, hy);
      if (hell < 0.4 && !w.bedeckt) {
        g.fillStyle = 'rgba(230,235,255,' + (0.8 - hell * 2).toFixed(2) + ')';
        for (let i = 0; i < 70; i++) {
          const sw = rausch(i * 3.1) * Math.PI * 2, sx = winkel(sw - blick) * pxRad + W / 2;
          if (sx >= 0 && sx < W) g.fillRect(Math.round(sx), Math.round(rausch(i * 7.7) * (hy - 6)), 1, 1);
        }
      }
      // Land
      const weite = 32 * w.sicht * (0.35 + 0.65 * hell);
      const spalten = land(st, blick, weite);
      spalten.forEach((t, i) => {
        if (!t) return;
        const hoehe = Math.min(70, Math.max(2, (0.05 + t.n * 0.16) / t.d * pxRad));
        const dunst = Math.min(1, t.d / weite);
        g.fillStyle = mische(mische('#0c1210', '#4a5a44', hell), mische('#0f1722', tagUnten, hell), dunst * 0.85);
        g.fillRect(i * 4, hy - Math.round(hoehe), 4, Math.round(hoehe));
      });
      // See
      const see = g.createLinearGradient(0, hy, 0, H);
      see.addColorStop(0, mische('#0a141c', w.bedeckt ? '#566f78' : '#3f7186', hell));
      see.addColorStop(1, mische('#04090d', w.bedeckt ? '#27414a' : '#18435a', hell));
      g.fillStyle = see; g.fillRect(0, hy, W, H - hy);
      g.fillStyle = 'rgba(255,255,255,' + (0.05 + 0.2 * hell).toFixed(2) + ')';
      for (let i = 0; i < 26; i++) {
        const tiefe = i / 26, y = hy + 2 + Math.round(tiefe * tiefe * (H - hy));
        const lang = 3 + Math.round(tiefe * 14 * (0.5 + w.seegang / 5));
        const versatz = (zeit * (4 + tiefe * 26) + rel * pxRad * GRAD * (0.2 + tiefe)) % 64;
        for (let x = -64; x < W + 64; x += 64) g.fillRect(Math.round(x + rausch(i) * 64 - versatz + 64) % (W + 64) - 32, y, lang, 1);
      }

      // Schiffe (weit entfernt zuerst)
      const sicht = S.sim.sichtweite(st);
      const schiffe = st.schiffe.filter((s) => !s.versenkt).map((s) => ({ s, d: S.sim.dist(s, b) })).filter((e) => e.d < sicht * 1.5).sort((a, c) => c.d - a.d);
      let best = 1e9;
      for (const { s, d } of schiffe) {
        const los = Math.atan2(s.y - b.y, s.x - b.x);
        const ab = winkel(los - blick);
        const x = W / 2 + ab * pxRad;
        if (x < -80 || x > W + 80) continue;
        const kursS = Math.atan2(s.ziel.y - s.y, s.ziel.x - s.x);
        const lage = Math.sin(kursS - los);
        if (d >= sicht) {
          // Hinter der Kimm: nur die Rauchfahne verrät den Dampfer
          if (s.typ === 'zerstoerer' || hell < 0.3) continue;
          g.fillStyle = 'rgba(60,60,64,' + (0.35 * (1.5 - d / sicht) * 2).toFixed(2) + ')';
          for (let k = 0; k < 4; k++) g.fillRect(Math.round(x + k * 2 * Math.sign(lage || 1)), hy - 2 - k, 3, 2);
          continue;
        }
        const bild = S.bilder.bild('schiff_' + s.typ);
        if (!bild) continue;
        const breit = Math.max(3, Math.min(280, LAENGE[s.typ] / d * pxRad));
        const bw = Math.max(2, Math.round(breit * Math.max(0.22, Math.abs(lage))));
        const bh = Math.max(2, Math.round(breit * bild.height / bild.width));
        // Einfärben: Dunkelheit und Dunst
        puffer.width = bw; puffer.height = bh;
        const pg = puffer.getContext('2d');
        pg.imageSmoothingEnabled = false;
        pg.save();
        if (lage < 0) { pg.translate(bw, 0); pg.scale(-1, 1); }
        pg.drawImage(bild, 0, 0, bw, bh);
        pg.restore();
        pg.globalCompositeOperation = 'source-atop';
        pg.fillStyle = 'rgba(8,12,16,' + (0.85 - 0.75 * hell).toFixed(2) + ')'; pg.fillRect(0, 0, bw, bh);
        pg.fillStyle = 'rgba(170,185,190,' + (Math.min(0.8, d / sicht * 0.8) * (0.3 + 0.7 * hell)).toFixed(2) + ')'; pg.fillRect(0, 0, bw, bh);
        pg.globalCompositeOperation = 'source-over';
        const versenkt = d > sicht * 0.75 ? Math.round(bh * 0.25) : 0;   // Rumpf hinter der Kimm
        const y = hy - bh + Math.round(bh * 0.12) + versenkt + Math.round(Math.min(6, 1.2 / d * (stark ? 4 : 1)));
        g.drawImage(puffer, 0, 0, bw, bh - versenkt, Math.round(x - bw / 2), y, bw, bh - versenkt);
        if (s.typ !== 'zerstoerer' && hell > 0.2) {
          g.fillStyle = 'rgba(70,70,74,0.35)';
          for (let k = 0; k < 5; k++) g.fillRect(Math.round(x - k * 3 * Math.sign(lage || 1) - 1), y - 2 - k * 2 - Math.round(Math.sin(zeit + k) * 1), 2 + k, 2);
        }
        if (Math.abs(ab) < Math.max(1.5 * GRAD, bw / 2 / pxRad) && Math.abs(ab) < best) { best = Math.abs(ab); imKreuz = { s, d, lage }; }
      }
      // Dunst und Nebel
      if (w.sicht < 1) { g.fillStyle = 'rgba(' + (hell > 0.3 ? '190,198,200' : '30,36,42') + ',' + (w.sicht < 0.5 ? 0.55 : 0.25) + ')'; g.fillRect(0, 0, W, H); }
      // See wäscht über das Sehrohr
      if (!oben) {
        const welle = Math.sin(zeit * 0.7) + Math.sin(zeit * 1.9) * 0.5;
        const ueber = welle * w.seegang * 3 - 12 + (b.tiefe - 13) * 10;
        if (ueber > 0) { g.fillStyle = 'rgba(40,95,105,0.8)'; g.fillRect(0, H - Math.min(H, Math.round(ueber * 8)), W, H); }
      }
    }

    // Strichplatte und Okular
    g.fillStyle = 'rgba(10,14,12,0.75)';
    g.fillRect(W / 2, 20, 1, H - 40); g.fillRect(40, HORIZONT, W - 80, 1);
    for (let i = -6; i <= 6; i++) { if (!i) continue; g.fillRect(W / 2 + i * 16, HORIZONT - (i % 2 ? 2 : 4), 1, i % 2 ? 5 : 9); g.fillRect(W / 2 - (i % 2 ? 2 : 4), HORIZONT + i * 12, i % 2 ? 5 : 9, 1); }
    g.fillStyle = '#05080a';
    g.beginPath(); g.rect(0, 0, W, H); g.arc(W / 2, H / 2, 98, 0, Math.PI * 2, true); g.fill('evenodd');
    g.strokeStyle = '#1c2a2c'; g.lineWidth = 2; g.beginPath(); g.arc(W / 2, H / 2, 98, 0, Math.PI * 2); g.stroke();

    // Texte
    const wahr = ((blick / GRAD) % 360 + 360) % 360;
    const setze = (id, t) => { const el = $(id); if (el && el.textContent !== t) el.textContent = t; };
    setze('sehrohrPeilung', 'PEILUNG ' + String(Math.round(rel) % 360).padStart(3, '0') + '° · RECHTWEISEND ' + String(Math.round(wahr) % 360).padStart(3, '0') + '° · ' + (stark ? '6×' : '1,5×'));
    setze('sehrohrWetter', S.sim.wetterText(st) + ' · Sicht ' + S.sim.sichtweite(st).toFixed(1).replace('.', ',') + ' km');
    setze('sehrohrZoom', stark ? 'Vergrößerung 1,5×' : 'Vergrößerung 6×');
    let info;
    if (unterWasser) info = b.tiefe > 15 ? 'Sehrohr unter Wasser – unter Sehrohrtiefe ist von der Oberfläche nichts mehr zu sehen.' : 'Sehrohr eingefahren.';
    else if (imKreuz) {
      const e = imKreuz, typ = D.SCHIFFSTYPEN[e.s.typ];
      const schaetz = e.d * (0.88 + rausch(e.s.id) * 0.24);
      const lageGrad = Math.round(Math.acos(Math.max(-1, Math.min(1, -Math.cos(Math.atan2(e.s.ziel.y - e.s.y, e.s.ziel.x - e.s.x) - Math.atan2(e.s.y - b.y, e.s.x - b.x))))) / GRAD);
      info = 'Im Fadenkreuz: ' + typ.name + (typ.feind ? ' (feindlich)' : ' (neutral)') + ' · Lage ' + (e.lage > 0 ? 'rechts ' : 'links ') + lageGrad + '° · Entfernung etwa ' + schaetz.toFixed(1).replace('.', ',') + ' km (Strichplatte)' + (st.ziel === e.s.id ? ' · ZIEL ERFASST' : '');
    } else info = hell < 0.15 ? 'Nacht. Nur nahe Schatten sind auszumachen.' : 'Nichts im Fadenkreuz. Rundblick nehmen.';
    setze('sehrohrInfo', info);
    const zb = $('sehrohrZiel'); if (zb) zb.disabled = !imKreuz;
  }

  function aktion(st, name, arg) {
    switch (name) {
      case 'sehrohr': oeffne(st); return true;
      case 'sehrohrDreh': rel = (rel + Number(arg) * (stark ? 0.25 : 1) + 360) % 360; return true;
      case 'sehrohrZoom': stark = !stark; return true;
      case 'sehrohrZiel':
        if (imKreuz) { st.ziel = imKreuz.s.id; imKreuz.s.klass = true; S.sim.log(st, 'Ziel erfasst: ' + D.SCHIFFSTYPEN[imKreuz.s.typ].name + ' in ' + String(Math.round(rel) % 360).padStart(3, '0') + '°.', 'info'); }
        return true;
      case 'sehrohrEin': S.sim.sehrohr(st, false); geschlossen(); S.ui.schliesse(); return true;
      default: return false;
    }
  }

  function taste(st, e) {
    if (!offen || !S.ui.offen()) return false;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); aktion(st, 'sehrohrDreh', (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 10 : 2)); return true; }
    return false;
  }

  function geschlossen() { offen = false; S.sim.blick = false; ziehen = null; }

  S.sehrohr = { aktion, taste, zeichne, geschlossen, istOffen: () => offen };
})(window.Spiel = window.Spiel || {});
