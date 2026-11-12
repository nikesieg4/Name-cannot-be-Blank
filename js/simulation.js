/* Sehrohrtiefe – Spielsimulation. Alle Zeiten in Spielminuten, Strecken auf der Karte in km. */
(function (S) {
  'use strict';
  const D = S.daten;
  const Z = S.zustand;

  const sim = { eff: {} };

  /* ---------------- Helfer ---------------- */
  const klemme = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const breite = (i) => D.ABTEILE[i].x1 - D.ABTEILE[i].x0;
  const mitte = (i) => (D.ABTEILE[i].x0 + D.ABTEILE[i].x1) / 2;

  function abteilIndex(x) {
    for (let i = 0; i < D.ABTEILE.length; i++) if (x < D.ABTEILE[i].x1) return i;
    return D.ABTEILE.length - 1;
  }
  function abteilNachId(id) { return D.ABTEILE.findIndex((a) => a.id === id); }

  function uhrzeit(st) {
    const tag = Math.floor(st.zeit / 1440) + 1;
    const m = Math.floor(st.zeit % 1440);
    return { tag, stunde: Math.floor(m / 60), minute: m % 60,
      text: 'Tag ' + tag + ' · ' + String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0') + ' UTC' };
  }

  function log(st, text, art) {
    st.log.push({ zeit: st.zeit, text, art: art || 'info' });
    if (st.log.length > 80) st.log.splice(0, st.log.length - 80);
  }

  /* Marinequadrat (Kap. 8): Großquadrat aus zwei Buchstaben, darin 3 × 3 Felder (erste Ziffer),
     jedes wieder 3 × 3 (zweite Ziffer), gezählt von links oben – z. B. „AN 57“. */
  function quadratTeile(p) {
    const G = D.WELT.GROSS;
    const gx = klemme(Math.floor(p.x / G), 0, D.GROSSQUADRATE[0].length - 1), gy = klemme(Math.floor(p.y / G), 0, D.GROSSQUADRATE.length - 1);
    const lx = klemme((p.x - gx * G) / G, 0, 0.9999), ly = klemme((p.y - gy * G) / G, 0, 0.9999);
    const a = Math.floor(lx * 3), b = Math.floor(ly * 3);
    const c = Math.floor((lx * 3 - a) * 3), d = Math.floor((ly * 3 - b) * 3);
    return { name: D.GROSSQUADRATE[gy][gx], z1: b * 3 + a + 1, z2: d * 3 + c + 1 };
  }
  function planquadrat(p) { const q = quadratTeile(p); return q.name + ' ' + q.z1 + q.z2; }

  /* ---------- Wassertiefe (Bathymetrie), 1 km-Raster ----------
     Flaches Schelf vor den Küsten, offene See bis rund 300 m, ein tiefer Graben im Westen
     und eine flache Bank in der Mitte, auf die man sich legen kann. */
  let tiefenKarte = null, landAbst = null;
  function baueTiefenKarte() {
    const B = D.WELT.B, H = D.WELT.H;
    const abst = new Float32Array(B * H).fill(1e9);
    const q = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) {
      if (imLand(x + 0.5, y + 0.5)) { abst[y * B + x] = 0; q.push(y * B + x); }
    }
    // Abstand zur Küste (Chamfer, 8 Nachbarn)
    for (let k = 0; k < q.length; k++) {
      const i = q[k], x = i % B, y = (i - x) / B, d = abst[i];
      for (const [dx, dy, w] of [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.41], [-1, 1, 1.41], [1, -1, 1.41], [-1, -1, 1.41]]) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= B || Y >= H) continue;
        const j = Y * B + X;
        if (abst[j] > d + w) { abst[j] = d + w; q.push(j); }
      }
    }
    landAbst = abst;
    tiefenKarte = new Float32Array(B * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) {
      const d = abst[y * B + x];
      if (d === 0) { tiefenKarte[y * B + x] = 0; continue; }
      // Schelf (bis 10 km), Abhang (bis 25 km), offene See
      let t = d < 10 ? 8 + d * 7 : d < 25 ? 78 + (d - 10) * 9 : 213 + Math.min(1, (d - 25) / 30) * 90;
      t += Math.min(1, d / 6) * (22 * Math.sin(x / 17) * Math.cos(y / 13) + 12 * Math.sin((x + y) / 9));
      // Graben im Westen
      const g = Math.abs(x - (70 + Math.sin(y / 25) * 12));
      if (g < 9) t += (1 - g / 9) * 140;
      // flache Bank (Hiddensee-Bank) südöstlich der Insel
      const bank = Math.hypot(x - 192, y - 130);
      if (bank < 16) t = Math.min(t, 28 + bank * 6);
      tiefenKarte[y * B + x] = Math.max(4, Math.min(420, t));
    }
  }
  function wassertiefe(x, y) {
    if (!tiefenKarte) baueTiefenKarte();
    const X = Math.max(0, Math.min(D.WELT.B - 1, Math.floor(x))), Y = Math.max(0, Math.min(D.WELT.H - 1, Math.floor(y)));
    return tiefenKarte[Y * D.WELT.B + X];
  }
  function landAbstand(x, y) {
    if (!tiefenKarte) baueTiefenKarte();
    const X = Math.max(0, Math.min(D.WELT.B - 1, Math.floor(x))), Y = Math.max(0, Math.min(D.WELT.H - 1, Math.floor(y)));
    return landAbst[Y * D.WELT.B + X];
  }
  /* Tiefster Punkt, den das Boot erreichen kann, bevor der Kiel aufsetzt (Rumpfhöhe ~10 m) */
  const KIEL_M = 10;
  function grundTiefe(st) { return Math.max(0, wassertiefe(st.boot.x, st.boot.y) - KIEL_M); }

  function imLand(x, y) {
    if (x < 0 || y < 0 || x > D.WELT.B || y > D.WELT.H) return true;
    for (const poly of D.LAND) {
      let drin = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i], [xj, yj] = poly[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) drin = !drin;
      }
      if (drin) return true;
    }
    return false;
  }

  function streckeFrei(a, b) {
    const n = Math.ceil(dist(a, b) / 2);
    for (let i = 0; i <= n; i++) {
      const t = i / Math.max(1, n);
      if (imLand(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) return false;
    }
    return true;
  }

  function zufallsPunkt(x0, x1, y0, y1, von) {
    for (let i = 0; i < 60; i++) {
      const p = { x: x0 + Math.random() * (x1 - x0), y: y0 + Math.random() * (y1 - y0) };
      if (!imLand(p.x, p.y) && (!von || streckeFrei(von, p))) return p;
    }
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
  }

  function unterWasser(st) { return st.boot.tiefe > 4; }
  function antenneFrei(st) { return st.boot.tiefe <= 15; }

  function flutung(st) {
    let w = 0, g = 0;
    st.boot.abteile.forEach((a, i) => { w += a.wasser * breite(i); g += breite(i); });
    return w / g;
  }

  function minRumpf(st) { return Math.min(...st.boot.abteile.map((a) => a.rumpf)); }

  /* Ausbau aus dem Skilltree vorhanden? (Schalter oder Upgrade-Stufe) */
  function hatAusbau(st, id) {
    for (const ast of D.SKILLTREE) for (const k of ast.knoten) {
      if (k.id !== id) continue;
      return k.upgrade ? st.boot.upgrades[k.upgrade[0]] >= k.upgrade[1] : !!(st.boot.ausbau && st.boot.ausbau[id]);
    }
    return false;
  }
  /* Tauchtiefen VII C: 100 / 165 / 250 m – mit verstärktem Druckkörper wie VII C/41: 120 / 200 / 300 m */
  function konstruktionstiefe(st) { return D.KONSTRUKTIONSTIEFE + (hatAusbau(st, 'tieftauchen') ? 20 : 0); }
  function maxSicher(st) { return D.MAX_SICHER + (hatAusbau(st, 'tieftauchen') ? 35 : 0); }
  function zerstoerungstiefe(st) { return D.ZERSTOERUNGSTIEFE + (hatAusbau(st, 'tieftauchen') ? 50 : 0); }
  /* Gruppenhorchgerät (Handbuch Kap. 7): rund 20 km Einzelschiff, nur getaucht brauchbar, am besten unter 3 kn
     Eigenfahrt; nach Wasserbomben-Detonationen kurz „betäubt“. */
  function horchweite(st, eff) {
    if (eff.sonar <= 0 || !unterWasser(st) || st.boot.tiefe < 8) return 0;
    if (st.boot.ghgTaub && st.zeit < st.boot.ghgTaub) return 0;
    const kn = sim.knoten || 0;
    const fahrt = kn <= 3 ? 1 : kn <= 4 ? 0.85 : kn <= 6 ? 0.55 : 0.35;
    return 20 * Math.min(1, eff.sonar) * fahrt * (hatAusbau(st, 'horchweite') ? 1.25 : 1);
  }
  /* toter Winkel achtern (eigene Schrauben): etwa 140° bis 220° relativ zum Bug */
  function imTotenWinkel(st, s) {
    const b = st.boot;
    const rel = ((Math.atan2(s.y - b.y, s.x - b.x) - b.kurs) * 180 / Math.PI + 720) % 360;
    return rel > 140 && rel < 220;
  }
  /* Sprungschicht: Temperaturgrenze in 35–90 m, darunter liegt das Boot für ASDIC oft im Schallschatten */
  function sprungschicht(x, y) { return Math.round(60 + 18 * Math.sin(x / 37) + 12 * Math.cos(y / 23)); }

  function sichereTiefe(st) {
    return maxSicher(st) * (0.45 + 0.55 * minRumpf(st) / 100);
  }

  /* Stauraum: Lagerplatz (Schlüssel in D.STAURAUM) einer Ware, Höchstmenge und freier Platz */
  function lagerVon(ware) {
    for (const [k, v] of Object.entries(D.STAURAUM)) if (k === ware || (v.waren && v.waren.includes(ware))) return k;
    return null;
  }
  function kapazitaet(st, lager) {
    const v = D.STAURAUM[lager];
    return v.max + (lager === 'torpedos' && hatAusbau(st, 'reserve8') ? 2 : 0);
  }
  function bestand(st, lager) {
    const v = D.STAURAUM[lager];
    return v.waren ? v.waren.reduce((a, w) => a + (st.ladung[w] || 0), 0) : (st.ladung[lager] || 0);
  }
  function platz(st, ware) {
    const l = lagerVon(ware);
    return l ? Math.max(0, kapazitaet(st, l) - bestand(st, l)) : Infinity;
  }
  /* Torpedotypen in der Reserve: b.reserveG7a zählt die G7a je Lagerplatz, der Rest sind G7e */
  function reserveNehmen(st, lager, wunsch) {
    const b = st.boot;
    if (!b.reserveG7a) b.reserveG7a = { torpedos: 0, torpedosHeck: 0, torpedosDeck: 0 };
    const ges = st.ladung[lager] || 0, a = b.reserveG7a[lager] || 0;
    if (ges <= 0) return null;
    let typ = wunsch === 'G7a' ? (a > 0 ? 'G7a' : 'G7e') : (ges - a > 0 ? 'G7e' : 'G7a');
    st.ladung[lager]--;
    if (typ === 'G7a') b.reserveG7a[lager] = a - 1;
    return typ;
  }
  function reserveDazu(st, lager, typ) {
    const b = st.boot;
    if (!b.reserveG7a) b.reserveG7a = { torpedos: 0, torpedosHeck: 0, torpedosDeck: 0 };
    st.ladung[lager] = (st.ladung[lager] || 0) + 1;
    if (typ === 'G7a') b.reserveG7a[lager] = (b.reserveG7a[lager] || 0) + 1;
  }
  function torpedosGesamt(st) { return st.ladung.torpedos + st.ladung.torpedosHeck + st.ladung.torpedosDeck + st.boot.rohre.filter(Boolean).length; }

  function lebende(st) { return st.crew.filter((c) => !c.tot); }
  function crewNachId(st, id) { return st.crew.find((c) => c.id === id); }
  function lebtRolle(st, rolle) { return st.crew.some((c) => !c.tot && c.rolle === rolle); }

  /* ---------------- Crew ---------------- */
  function crewFaktor(c) {
    const moral = 0.55 + 0.45 * c.moral / 100;
    const erf = 1 + (D.stufe(c.xp) - 1) * 0.06;
    const muede = c.wach > 26 ? 0.6 : c.wach > 19 ? 0.85 : 1;
    return moral * erf * muede;
  }

  function berechneEffizienz(st) {
    const eff = {};
    for (const k of Object.keys(D.SYSTEME)) eff[k] = 0;
    for (const c of st.crew) {
      if (c.tot || c.taetigkeit === 'schlaf' || !c.aktPosten) continue;
      const p = D.POSTEN[c.aktPosten];
      const basis = p.spezial.length === 0 || p.spezial.includes(c.rolle) ? 1 : 0.5;
      eff[p.system] = Math.max(eff[p.system], Math.min(1.2, basis * crewFaktor(c)));
    }
    sim.eff = eff;
    return eff;
  }

  function schadensZiel(st) {
    let best = -1, wert = 4;
    st.boot.abteile.forEach((a, i) => {
      const w = (100 - a.rumpf) + a.wasser * 60;
      if (a.wasser < 0.6 && w > wert) { wert = w; best = i; }
    });
    return best;
  }

  /* Bei Gefechtsstationen gehen manche Rollen auf einen anderen Posten (1WO an den Vorhalterechner). */
  function postenVon(st, c) {
    const r = D.ROLLEN[c.rolle];
    return st.alarm && r && r.gefecht && c.posten === (Array.isArray(r.posten) ? c.posten : r.posten) ? r.gefecht : c.posten;
  }

  /* Wachablösung: Wer Dienst hatte, bleibt am Posten, bis jemand anderes dasselbe System übernommen hat
     (höchstens 20 Minuten in die neue Wache hinein). */
  function nochNichtAbgeloest(st, c) {
    if (c.taetigkeit !== 'dienst' || !c.aktPosten || st.zeit % 60 >= 20) return false;
    const sys = D.POSTEN[c.aktPosten].system;
    return !st.crew.some((o) => o !== c && !o.tot && o.aktPosten && o.taetigkeit !== 'schlaf' && D.POSTEN[o.aktPosten].system === sys);
  }

  function postenX(st, c) {
    if (c.posten === 'leckabwehr') {
      const i = schadensZiel(st);
      return i >= 0 ? mitte(i) + ((c.id * 7) % 16) - 8 : 300 + (c.id % 3) * 4;
    }
    // Wer denselben Posten hat, steht leicht versetzt nebeneinander
    return D.POSTEN[postenVon(st, c)].x + ((c.id * 5) % 7) - 3;
  }

  /* Hot Bunking: Kojen werden geteilt. Wer schlafen geht, nimmt eine freie Koje (Offiziere zuerst
     im Funk- und Kommandantenraum), sonst schläft er auf dem Boden (koje = null). */
  function kojeFuer(st, c) {
    const belegt = new Set();
    for (const o of st.crew) if (o !== c && !o.tot && o.koje != null) belegt.add(o.koje);
    if (c.koje != null && !belegt.has(c.koje)) return c.koje;
    const off = D.ROLLEN[c.rolle] && D.ROLLEN[c.rolle].offizier;
    let best = null, bd = 1e9;
    D.KOJEN.forEach((k, i) => {
      if (belegt.has(i) || !erreichbar(st, c.x, k.x)) return;
      if (k.off && !off) return;
      if (k.kdt && c.rolle !== 'kaleu') return;   // Kommandantenkoje hinter dem Vorhang
      const d = Math.abs(k.x - c.x) + (off && k.off ? -1000 : 0) + (c.rolle === 'kaleu' && k.kdt ? -2000 : 0);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }

  /* Weg frei? Geschlossene Schotten zwischen zwei Positionen blockieren. */
  function erreichbar(st, x0, x1) {
    const a = Math.min(x0, x1), b = Math.max(x0, x1);
    for (let i = 0; i < st.boot.schotten.length; i++) {
      const tx = D.ABTEILE[i].x1;
      if (st.boot.schotten[i] && tx > a && tx < b) return false;
    }
    return true;
  }

  function trockenesZiel(st, c) {
    let best = null, bd = 1e9;
    st.boot.abteile.forEach((a, i) => {
      if (a.wasser < 0.35 && !a.chlor && erreichbar(st, c.x, mitte(i))) {
        const d = Math.abs(mitte(i) - c.x);
        if (d < bd) { bd = d; best = mitte(i); }
      }
    });
    return best;
  }

  /* ---------- Notfall-KI: Lecks reparieren, Torpedos nachladen, volllaufende Abteile abschotten ---------- */
  function notfallPlanung(st, h) {
    const b = st.boot;
    for (const c of st.crew) { c.notfall = null; if (c.taetigkeit !== 'reparatur') c.repZiel = null; }
    const frei = (c, auchSchlaf) => !c.tot && c.befehl == null && st.gesteuert !== c.id &&
      (c.taetigkeit === 'frei' || c.taetigkeit === 'zurKoje' || c.taetigkeit === 'reparatur' || c.taetigkeit === 'nachladen' || (auchSchlaf && c.taetigkeit === 'schlaf'));

    // 1. Schäden: Leckabwehr-Trupp zusammenstellen
    const schaeden = b.abteile.map((a, i) => ({ i, w: (100 - a.rumpf) + a.wasser * 60, a }))
      .filter((x) => (x.a.rumpf < (st.ladung.ersatzteile > 0 ? 99 : 60) || x.a.wasser > 0.03) && x.a.wasser < 0.6)
      .sort((x, y) => y.w - x.w);
    const gesamt = schaeden.reduce((sum, x) => sum + x.w, 0);
    if (schaeden.length) {
      const schwer = gesamt > 25;
      const groesse = gesamt > 70 ? 4 : schwer ? 3 : 1;
      // Wer Leckabwehr-Dienst hat, ist immer dabei. Dazu kommen Helfer bis zur nötigen Truppgröße:
      // erst Wache, die frei hat (Leckabwehr-Leute, Bootsmann und Seeleute zuerst), bei schweren Schäden auch Schlafende.
      const imDienst = (c) => st.alarm || st.schichten[c.schicht][h] === 'D';
      const trupp = st.crew.filter((c) => !c.tot && c.posten === 'leckabwehr' && imDienst(c) && c.taetigkeit !== 'schlaf' && c.befehl == null && st.gesteuert !== c.id);
      const z0 = mitte(schaeden[0].i);
      const rang = (c) => (c.taetigkeit === 'schlaf' ? 2 : 0) + (c.posten === 'leckabwehr' || c.rolle === 'bootsmann' || c.rolle === 'seemann' ? 0 : 1);
      const kandidaten = st.crew.filter((c) => !trupp.includes(c) && frei(c, schwer))
        .sort((a, c) => (c.taetigkeit === 'reparatur') - (a.taetigkeit === 'reparatur') || rang(a) - rang(c) || Math.abs(a.x - z0) - Math.abs(c.x - z0));
      while (trupp.length < groesse && kandidaten.length) trupp.push(kandidaten.shift());
      const ziele = schaeden.slice(0, Math.min(schaeden.length, 2));
      trupp.forEach((c, k) => {
        // Wer schon an einem Schaden arbeitet, bleibt dort, bis er behoben ist.
        let z = c.repZiel != null ? schaeden.find((x) => x.i === c.repZiel) : null;
        if (!z) z = ziele[k % ziele.length];
        if (!erreichbar(st, c.x, mitte(z.i))) z = schaeden.find((x) => erreichbar(st, c.x, mitte(x.i)));
        if (z) { c.notfall = { x: mitte(z.i) + ((c.id * 7) % 16) - 8, art: 'reparatur' }; c.repZiel = z.i; }
      });
      if (!b.leckalarm && trupp.some((c) => c.notfall)) {
        b.leckalarm = true;
        const namen = trupp.filter((c) => c.notfall).map((c) => c.name.split(' ')[0]);
        log(st, 'Leckabwehr! ' + namen.join(', ') + ' ' + (namen.length > 1 ? 'eilen' : 'eilt') + ' ' + D.ABTEILE[schaeden[0].i].ort.replace(/^im /, 'in den ').replace(/^in der /, 'in die ') + '.', 'warn');
      }
    } else if (b.leckalarm) {
      b.leckalarm = false;
      log(st, 'Leckabwehr: Alle Schäden behoben.', 'gut');
    }

    // 2. Torpedos nachladen, wenn ein Rohr leer ist und Reserve da ist (Bugraum und Heckraum)
    for (const [posten, abteil, noetig] of [
      ['bugraum', 'bug', b.rohre.slice(0, 4).some((r) => !r) && st.ladung.torpedos > 0],
      ['heckrohr', 'heck', !b.rohre[4] && st.ladung.torpedosHeck > 0]]) {
      const merk = 'lade_' + posten;
      if (!noetig) { b[merk] = false; continue; }
      const lader = st.crew.some((c) => !c.tot && c.taetigkeit !== 'schlaf' && (c.aktPosten === posten || c.befehl != null) && abteilIndex(c.x) === abteilNachId(abteil));
      if (lader) continue;
      const zx = D.POSTEN[posten].x;
      const k = st.crew.filter((c) => !c.notfall && frei(c, false) && erreichbar(st, c.x, zx))
        .sort((a, c) => (a.rolle === 'torpedo' ? 0 : 1) - (c.rolle === 'torpedo' ? 0 : 1) || Math.abs(a.x - zx) - Math.abs(c.x - zx))[0];
      if (k) {
        k.notfall = { x: zx, art: 'nachladen' };
        if (!b[merk]) { b[merk] = true; log(st, k.name.split(' ')[0] + ' geht ' + D.ABTEILE[abteilNachId(abteil)].ort.replace(/^im /, 'in den ') + ' und lädt nach.', 'info'); }
      }
    }

    // 3. Volllaufende Abteile ohne Leute darin abschotten, später wieder öffnen
    if (!b.autoSchott) b.autoSchott = {};
    b.abteile.forEach((a, i) => {
      const leer = !st.crew.some((c) => !c.tot && (abteilIndex(c.x) === i || c.repZiel === i));
      if (a.wasser > 0.45 && leer) {
        const zu = [];
        for (const t of [i - 1, i]) if (t >= 0 && t < b.schotten.length && !b.schotten[t]) { b.schotten[t] = true; b.autoSchott[t] = true; zu.push(t); }
        if (zu.length) log(st, 'Leckabwehr schottet ' + D.ABTEILE[i].ort.replace(/^im /, 'den ').replace(/^in der /, 'die ').replace(/^in /, '') + ' ab.', 'warn');
      }
    });
    for (const t of Object.keys(b.autoSchott)) {
      const n = Number(t);
      if (b.schotten[n] && b.abteile[n].wasser < 0.25 && b.abteile[n + 1].wasser < 0.25) {
        b.schotten[n] = false; delete b.autoSchott[t];
        log(st, 'Schott zwischen ' + D.ABTEILE[n].name + ' und ' + D.ABTEILE[n + 1].name + ' wieder geöffnet.', 'info');
      } else if (!b.schotten[n]) delete b.autoSchott[t];
    }
  }

  /* Freizeit: Ziellos durchs Boot schlendern – ein Stück gehen, ein paar Minuten bleiben
     (Messe, Kameraden, Zigarette im Turm …), dann weiter. */
  function freizeitZiel(st, c) {
    const bz = c.bummel;
    if (!bz || (bz.bis != null && st.zeit >= bz.bis)) {
      const lo = D.ABTEILE[0].x0 + 8, hi = D.ABTEILE[D.ABTEILE.length - 1].x1 - 12;
      const x = Math.random() < 0.3 ? c.messeX : c.x + (Math.random() * 2 - 1) * 90;
      c.bummel = { x: klemme(x, lo, hi), bis: null };
    } else if (bz.bis == null && Math.abs(c.x - bz.x) < 0.6) bz.bis = st.zeit + 3 + Math.random() * 17;
    return { x: c.bummel.x, art: 'frei', langsam: true };
  }

  function crewZiel(st, c, h) {
    if (c.befehl != null) return { x: c.befehl, art: 'befehl' };
    const p = st.schichten[c.schicht][h];
    let z;
    // Schleichfahrt getaucht: jeder bleibt auf seiner Station (Trimm, Lärm) – außer im Notfall
    if (!c.notfall && D.FAHRT[st.boot.fahrt].leise && unterWasser(st) && c.taetigkeit && c.taetigkeit !== 'zurKoje' && c.taetigkeit !== 'flucht') {
      return { x: c.x, art: c.taetigkeit === 'schlaf' ? 'schlaf' : c.taetigkeit };
    }
    if (c.notfall) z = c.notfall;
    else if (st.alarm || p === 'D') z = { x: postenX(st, c), art: 'dienst' };
    else if (nochNichtAbgeloest(st, c)) z = { x: c.x, art: 'dienst' };
    else if (p === 'S') {
      c.koje = kojeFuer(st, c);
      z = { x: c.koje != null ? D.KOJEN[c.koje].x : c.messeX, art: 'schlaf' };
    }
    else z = freizeitZiel(st, c);
    if (z.art !== 'frei') c.bummel = null;
    // Selbstschutz: nicht in geflutete Abteile, aus vollaufenden Abteilen fliehen.
    const hier = st.boot.abteile[abteilIndex(c.x)];
    const dort = st.boot.abteile[abteilIndex(z.x)];
    if (hier.wasser > 0.55 || dort.wasser > 0.6 || hier.chlor || dort.chlor) {
      const t = trockenesZiel(st, c);
      if (t != null) z = { x: t, art: 'flucht' };
    }
    return z;
  }

  function bewege(st, c, zielX, weite) {
    const dx = zielX - c.x;
    if (Math.abs(dx) < 0.6) { c.x = zielX; c.laeuft = false; return true; }
    const dir = Math.sign(dx);
    let neu = c.x + dir * Math.min(Math.abs(dx), weite);
    for (let i = 0; i < st.boot.schotten.length; i++) {
      if (!st.boot.schotten[i]) continue;
      const tx = D.ABTEILE[i].x1;
      if (dir > 0 && c.x < tx && neu > tx - 3) neu = Math.min(neu, tx - 3);
      if (dir < 0 && c.x > tx && neu < tx + 3) neu = Math.max(neu, tx + 3);
    }
    neu = klemme(neu, D.ABTEILE[0].x0 + 3, D.ABTEILE[D.ABTEILE.length - 1].x1 - 6);
    c.laeuft = Math.abs(neu - c.x) > 0.01;
    if (c.laeuft) c.anim += Math.abs(neu - c.x) * 0.25;
    c.richtung = dir;
    c.x = neu;
    return false;
  }

  function naechsterPosten(c) {
    const a = D.ABTEILE[abteilIndex(c.x)].id;
    let best = null, bd = 10;
    for (const [id, p] of Object.entries(D.POSTEN)) {
      if (p.abteil !== a) continue;
      const d = Math.abs(p.x - c.x);
      if (d < bd) { bd = d; best = id; }
    }
    return best;
  }

  function crewSchritt(st, dt, h) {
    notfallPlanung(st, h);
    for (const c of st.crew) {
      if (c.tot) continue;
      const i = abteilIndex(c.x);
      const ab = st.boot.abteile[i];
      if (st.gesteuert !== c.id) {
        const z = crewZiel(st, c, h);
        const angekommen = bewege(st, c, z.x, 26 * (0.7 + 0.3 * c.moral / 100) * dt * (z.langsam ? 0.45 : 1));
        // Vor einem geschlossenen Schott hängen geblieben: anderes Ziel suchen
        if (z.langsam && !angekommen && !c.laeuft && c.bummel) c.bummel.bis = st.zeit;
        c.taetigkeit = z.art === 'schlaf' ? (angekommen ? 'schlaf' : 'zurKoje') : z.art;
        c.aktPosten = angekommen && c.taetigkeit !== 'schlaf' && c.taetigkeit !== 'frei' && c.taetigkeit !== 'reparatur' ? naechsterPosten(c) : null;
        if (c.taetigkeit !== 'schlaf' && c.taetigkeit !== 'zurKoje') c.koje = null;
      } else {
        c.taetigkeit = 'gesteuert';
        c.aktPosten = c.laeuft ? null : naechsterPosten(c);
      }

      // Schlaf
      if (c.taetigkeit === 'schlaf') { c.wach = Math.max(0, c.wach - 3 * dt / 60); c.moral += 0.1 * dt / 60; }
      else c.wach += dt / 60;

      // Ertrinken
      if (ab.wasser > 0.8) {
        c.luft -= 9 * dt;
        if (c.luft <= 0 && st.ladung.sanitaet > 0) {
          st.ladung.sanitaet--; c.luft = 60;
          log(st, c.name + ' wäre fast ertrunken – ein Sanitätskasten verschafft ihm Luft. Raus aus dem Wasser!', 'warn');
        }
        if (c.luft <= 0) {
          c.tot = true; c.luft = 0; c.befehl = null; c.taetigkeit = 'tot';
          if (st.gesteuert === c.id) st.gesteuert = null;
          st.statistik.tote++;
          log(st, c.name + ' (' + D.ROLLEN[c.rolle].kurz + ') ist ' + D.ABTEILE[i].ort + ' ertrunken.', 'alarm');
          for (const o of lebende(st)) o.moral -= 15;
        }
      } else c.luft = Math.min(100, c.luft + 20 * dt);

      // Moral
      let dm = 0;
      if (st.ladung.proviant <= 0 && st.ladung.konserven <= 0) dm -= 3;
      else dm += ({ 1: -1.2, 2: -0.4, 3: 0.15, 4: 0.5 })[st.ration] - (st.ladung.proviant <= 0 ? 0.3 : 0);
      if (!lebtRolle(st, 'smut')) dm -= 0.4;
      if (st.boot.luft != null && st.boot.luft < 40) dm -= st.boot.luft < 20 ? 4 : 1;
      if (c.wach > 26) dm -= 4; else if (c.wach > 19) dm -= 1.5;
      if (st.boot.tiefe > sichereTiefe(st)) dm -= 2;
      if (flutung(st) > 0.05) dm -= 1;
      if (st.alarm) dm -= 0.3;
      c.moral = klemme(c.moral + dm * dt / 60, 0, 100);
    }
  }

  /* Direkte Steuerung in Echtzeit (unabhängig vom Zeitraffer). */
  sim.steuern = function (st, sekunden, richtung) {
    const c = st.gesteuert != null ? crewNachId(st, st.gesteuert) : null;
    if (!c || c.tot) { st.gesteuert = null; return; }
    if (richtung === 0) { c.laeuft = false; return; }
    bewege(st, c, c.x + richtung * 100, 45 * sekunden);
  };

  /* ---------------- Boot: Wasser, Tiefe, Energie ---------------- */
  function wasserSchritt(st, dt, strom) {
    const b = st.boot;
    const uw = unterWasser(st);
    const rumpfSchutz = 1 - 0.15 * b.upgrades.rumpf;
    b.abteile.forEach((a, i) => {
      if (a.rumpf < 90) {
        const leck = Math.pow((90 - a.rumpf) / 90, 1.5) * 0.02 * (uw ? 1 + b.tiefe / 60 : 0.25) * rumpfSchutz;
        a.wasser += leck * dt * (70 / breite(i));
      }
    });
    // Ausgleich durch offene Schotten
    for (let i = 0; i < b.schotten.length; i++) {
      if (b.schotten[i]) continue;
      const a = b.abteile[i], c = b.abteile[i + 1];
      const diff = a.wasser - c.wasser;
      if (Math.abs(diff) < 0.001) continue;
      const vol = diff * 0.4 * Math.min(1, dt) * Math.min(breite(i), breite(i + 1));
      a.wasser -= vol / breite(i);
      c.wasser += vol / breite(i + 1);
    }
    // Lenzpumpen: brauchen Strom und jemanden im Abteil oder den LI in der Zentrale
    const liZentrale = st.crew.some((c) => !c.tot && c.rolle === 'li' && c.taetigkeit !== 'schlaf' && abteilIndex(c.x) === abteilNachId('zentrale'));
    let verbrauch = 0;
    b.abteile.forEach((a, i) => {
      if (!a.pumpe || a.wasser <= 0 || !strom) return;
      let bes = 0;
      for (const c of st.crew) if (!c.tot && c.taetigkeit !== 'schlaf' && abteilIndex(c.x) === i) bes = Math.max(bes, crewFaktor(c));
      if (liZentrale) bes = Math.max(bes, 0.6);
      if (bes <= 0) return;
      const rate = 0.012 * (1 + 0.5 * b.upgrades.pumpen) * bes * (70 / breite(i));
      a.wasser -= rate * dt;
      verbrauch += 0.01 * dt;
    });
    b.abteile.forEach((a) => { a.wasser = klemme(a.wasser, 0, 1); });
    return verbrauch;
  }

  function reparaturSchritt(st, dt) {
    const b = st.boot;
    for (const c of st.crew) {
      if (c.tot || c.laeuft || c.taetigkeit === 'schlaf' || c.taetigkeit === 'frei') continue;
      const darf = (c.posten === 'leckabwehr' && c.taetigkeit === 'dienst') || c.taetigkeit === 'reparatur' || c.taetigkeit === 'befehl' || c.taetigkeit === 'gesteuert';
      if (!darf) continue;
      const i = abteilIndex(c.x);
      const a = b.abteile[i];
      if (a.rumpf >= 100 || a.wasser > 0.6) continue;
      let rate = 0.8 * crewFaktor(c) * (c.rolle === 'bootsmann' ? 1.5 : c.rolle === 'diesel' || c.rolle === 'emasch' ? 1.3 : c.rolle === 'seemann' ? 1.2 : 1);
      if (st.ladung.ersatzteile <= 0) { if (a.rumpf >= 60) continue; rate *= 0.2; }
      a.rumpf = Math.min(100, a.rumpf + rate * dt);
      if (st.ladung.ersatzteile > 0) {
        b.teileRest += rate * dt / 5;
        while (b.teileRest >= 1 && st.ladung.ersatzteile > 0) { b.teileRest -= 1; st.ladung.ersatzteile--; }
      }
      c.xp += dt / 60;
    }
  }

  function tiefenSchritt(st, dt, eff, strom) {
    const b = st.boot;
    if (b.zielM == null) b.zielM = D.TIEFEN[b.zielTiefe || 0].m;
    const ziel = b.zielM;
    let rate = 0;
    if (eff.tauchen > 0) {
      // normal etwa 10 m pro Minute; beim Alarmtauchen schneidet der Turm in rund 30 s unter (≈ 30 m/min)
      const max = (b.alarmtauchen ? 30 : 10) * Math.min(1.2, eff.tauchen);
      rate = klemme((ziel - b.tiefe) / Math.max(dt, 0.001), -max, max);
    }
    if (b.alarmtauchen && b.tiefe >= Math.min(ziel, 20) - 0.5) {
      b.alarmtauchen = false;
      log(st, 'LI: „Boot ist eingesteuert.“', 'info');
    }
    // Gewicht durch Wasser im Boot. Ein gefluteter Endraum ist noch tragbar, Fahrt hilft mit den Tiefenrudern.
    const fl = flutung(st);
    const dynamisch = (sim.knoten || 0) * 0.04;
    let sinken = fl > 0.12 + dynamisch ? (fl - 0.12 - dynamisch) * 45 : 0;
    if (b.tiefe < 1 && fl < 0.26) sinken = 0;   // aufgetaucht trägt der Reserveauftrieb einen Endraum
    if (b.anblasen > 0) { rate = -20; sinken *= 0.3; b.anblasen = Math.max(0, b.anblasen - dt); }
    const vorher = b.tiefe;
    b.tiefe = Math.max(0, b.tiefe + (rate + sinken) * dt);
    // Meeresgrund: tiefer geht es nicht – das Boot setzt auf
    const grund = grundTiefe(st);
    if (b.tiefe >= grund && b.tiefe > 0.5) {
      const aufprall = (b.tiefe - vorher) / Math.max(dt, 0.001);
      if (vorher > grund + 1) {
        // flacher werdendes Wasser: das Boot läuft mit dem Bug auf den Grund
        const bug = b.abteile[abteilNachId('bug')];
        bug.rumpf = Math.max(0, bug.rumpf - Math.min(25, 3 + (sim.knoten || 0) * 2));
        log(st, 'Das Boot rammt den ansteigenden Grund! Bugraum beschädigt.', 'alarm');
      } else if (!b.aufGrund && aufprall > 12) {
        b.abteile[0].rumpf = Math.max(0, b.abteile[0].rumpf - aufprall);
        log(st, 'Hart auf Grund gesetzt! Heckraum beschädigt.', 'alarm');
      }
      b.tiefe = grund;
      if (!b.aufGrund) { b.aufGrund = true; log(st, 'Boot liegt auf Grund (' + Math.round(wassertiefe(b.x, b.y)) + ' m Wassertiefe).', 'info'); }
      if ((sim.knoten || 0) > 0.5) {
        const bug = b.abteile[abteilNachId('bug')];
        bug.rumpf = Math.max(0, bug.rumpf - 0.4 * sim.knoten * dt);
        if (!b.schrammt) { b.schrammt = true; log(st, 'Das Boot schrammt über den Grund! Maschinen stoppen oder höher gehen.', 'warn'); }
      } else b.schrammt = false;
    } else if (b.aufGrund && b.tiefe < grund - 1) { b.aufGrund = false; b.schrammt = false; log(st, 'Boot ist vom Grund frei.', 'info'); }
    if (b.tiefe === 0 && !unterWasser(st)) b.druckluft = Math.min(100, b.druckluft + 1.5 * dt);
    if (vorher <= 4 && b.tiefe > 4) log(st, 'Boot ist getaucht.', 'info');
    if (vorher > 4 && b.tiefe <= 4) log(st, 'Boot ist aufgetaucht.', 'info');

    // Druck (Kap. 4): bis zur Konstruktionstiefe dauerhaft zulässig, bis zur Prüfungstiefe nur im Notfall,
    // darüber hinaus beult der Druckkörper; rechnerische Zerstörungstiefe, real hielten Boote oft etwas mehr.
    const sicher = sichereTiefe(st), zt = zerstoerungstiefe(st);
    if (b.tiefe > konstruktionstiefe(st) && b.tiefe <= sicher) {
      if (!sim._knarren) { log(st, 'LI: „Wir sind unter Konstruktionstiefe. Der Druckkörper knackt.“', 'warn'); sim._knarren = true; }
      for (const c of lebende(st)) c.moral = Math.max(0, c.moral - 0.5 * dt / 60);
    } else if (b.tiefe <= konstruktionstiefe(st)) sim._knarren = false;
    if (b.tiefe > sicher) {
      const x = (b.tiefe - sicher) / Math.max(1, zt - sicher);
      b.abteile.forEach((a) => { a.rumpf = Math.max(0, a.rumpf - 0.6 * x * dt); });
      if (!sim._druckWarnung) { log(st, 'Unter Prüfungstiefe! Der Rumpf ächzt, Nieten springen. Sofort höher gehen!', 'alarm'); sim._druckWarnung = true; }
      if (Math.random() < 0.25 * x * x * x * dt) return verlieren(st, 'Der Druckkörper hat nicht standgehalten. Das Boot ist in ' + Math.round(b.tiefe) + ' m implodiert.');
    } else sim._druckWarnung = false;
    if (b.tiefe >= zt + 30) return verlieren(st, 'Das Boot ist weit unter der Zerstörungstiefe implodiert.');
    // Zwei geflutete Räume trägt das Boot nicht mehr (Lehrsatz Kap. 2)
    if (fl >= 0.3) return verlieren(st, 'Das Boot ist vollgelaufen und gesunken.');

    // Atemluft (Kap. 4.7): 72 h für 37 Mann mit Sauerstoff und Kalipatronen, aufgetaucht wird gelüftet
    if (b.luft == null) b.luft = 100;
    const mann = Math.max(1, lebende(st).length);
    if (unterWasser(st)) b.luft = Math.max(0, b.luft - 100 / (72 * 60 * 37 / mann) * dt);
    else b.luft = Math.min(100, b.luft + 6 * dt);
    if (b.luft < 40 && !sim._luftWarnung) { sim._luftWarnung = true; log(st, 'Die Luft wird schlecht: Kopfschmerzen und Atemnot. Bald auftauchen und lüften!', 'warn'); }
    if (b.luft >= 50) sim._luftWarnung = false;
    if (b.luft <= 0) return verlieren(st, 'Die Luft im Boot ist verbraucht. Die Besatzung ist erstickt.');

    // Chlorgas (Kap. 5): Seewasser in den Batteriezellen unter Offiziers- und Unteroffiziersraum
    for (const id of D.BATTERIERAEUME) {
      const i = abteilNachId(id), a = b.abteile[i];
      if (a.wasser > 0.2 && !a.chlor) { a.chlor = true; log(st, 'Chlorgas ' + D.ABTEILE[i].ort + '! Seewasser in der Batterie – Abteilung räumen!', 'alarm'); }
      if (a.chlor && a.wasser < 0.05) { a.chlor = false; log(st, 'Das Chlorgas ' + D.ABTEILE[i].ort + ' hat sich verzogen.', 'info'); }
      if (a.chlor) b.batterie = Math.max(0, b.batterie - 0.3 * dt);
    }
    return null;
  }

  function energieSchritt(st, dt, eff) {
    const b = st.boot;
    const f = D.FAHRT[b.fahrt];
    const uw = unterWasser(st);
    let kn = 0;
    if (!uw) {
      if (st.ladung.diesel > 0 && eff.antrieb > 0) {
        kn = f.ueber * (0.6 + 0.4 * Math.min(1, eff.antrieb));
        st.ladung.diesel = Math.max(0, st.ladung.diesel - f.diesel * dt * (hatAusbau(st, 'diesel') ? 0.8 : 1));
        // Laden mit Fahrt bzw. im Stand (Diesel treibt nur den Generator)
        b.batterie = Math.min(100, b.batterie + (b.fahrt === 0 ? 0.3 : 0.15) * dt);
      } else if (b.batterie > 0 && eff.antrieb > 0) {
        kn = f.unter * (0.6 + 0.4 * Math.min(1, eff.antrieb));
        b.batterie = Math.max(0, b.batterie - f.strom * dt / (1 + 0.33 * b.upgrades.batterie));
      }
    } else if (b.batterie > 0) {
      if (eff.antrieb > 0) kn = f.unter * (0.6 + 0.4 * Math.min(1, eff.antrieb));
      b.batterie = Math.max(0, b.batterie - (eff.antrieb > 0 ? f.strom : 0.004) * dt / (1 + 0.33 * b.upgrades.batterie));
    }
    sim.knoten = kn;
    return !uw || b.batterie > 0;
  }

  function fahrtSchritt(st, dt, eff) {
    const b = st.boot;
    const k = koppelOrt(st);
    if (b.wegpunkt) {
      // Gesteuert wird nach dem Koppelort – nicht nach dem wahren Standort.
      const soll = Math.atan2(b.wegpunkt.y - k.y, b.wegpunkt.x - k.x);
      let d = soll - b.kurs;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      const max = (6 * Math.PI / 180) * eff.ruder * dt * (sim.knoten > 0 ? 1 : 0.2);
      b.kurs += klemme(d, -max, max);
      if (dist(k, b.wegpunkt) < 0.6) { b.wegpunkt = null; b.fahrt = 0; log(st, 'Wegpunkt erreicht. Maschinen gestoppt.', 'info'); }
    }
    const km = sim.knoten * 1.852 / 60 * dt;
    if (km > 0) {
      const nx = b.x + Math.cos(b.kurs) * km, ny = b.y + Math.sin(b.kurs) * km;
      if (imLand(nx, ny)) {
        b.fahrt = 0; b.wegpunkt = null;
        b.abteile[abteilNachId('bug')].rumpf = Math.max(0, b.abteile[abteilNachId('bug')].rumpf - 10);
        log(st, 'Das Boot ist auf Grund gelaufen! Bugraum beschädigt.', 'alarm');
      } else { b.x = nx; b.y = ny; k.x += Math.cos(b.kurs) * km; k.y += Math.sin(b.kurs) * km; }
    }
    navSchritt(st, dt);
  }

  /* ---------------- Navigation (Kap. 8): Koppeln und Besteck ----------------
     Der Obersteuermann koppelt aus Kurs und Fahrt. Strömung versetzt das Boot unbemerkt.
     Ein Besteck gibt es nur aufgetaucht: Sterne in der Morgen- und Abenddämmerung,
     Mittagsbreite mit der Sonne, Kreuzpeilung bei Tag in Küstennähe. */
  function koppelOrt(st) {
    const b = st.boot;
    if (!b.koppel) { b.koppel = { x: b.x, y: b.y }; b.unsicher = 0.3; }
    return b.koppel;
  }
  sim.koppelOrt = koppelOrt;
  /* Wahre Position eines Kontakts so, wie sie auf der Karte eingetragen wird (relativ zum Koppelort). */
  sim.aufKarte = function (st, p) { const k = koppelOrt(st); return { x: p.x - st.boot.x + k.x, y: p.y - st.boot.y + k.y }; };
  sim.vonKarte = function (st, p) { const k = koppelOrt(st); return { x: p.x - k.x + st.boot.x, y: p.y - k.y + st.boot.y }; };

  function besteck(st, art, fehler, nurBreite, leise) {
    const b = st.boot, k = koppelOrt(st);
    const ab = nurBreite ? Math.abs(k.y - b.y) : Math.hypot(k.x - b.x, k.y - b.y);
    const w = Math.random() * Math.PI * 2, f = Math.random() * fehler;
    if (!nurBreite) k.x = b.x + Math.cos(w) * f;
    k.y = b.y + Math.sin(w) * f;
    b.unsicher = nurBreite ? Math.max(fehler, b.unsicher * 0.6) : fehler;
    b.besteck = { zeit: st.zeit, art };
    if (!leise || ab >= 1) log(st, 'Obersteuermann: ' + art + ' genommen. ' + (ab < 0.5 ? 'Koppelort stimmte.' : 'Wir standen ' + ab.toFixed(1).replace('.', ',') + ' km ' + (nurBreite ? 'in der Breite ' : '') + 'neben dem Koppelort.') + ' Boot in ' + planquadrat(k) + '.', 'info');
    for (const c of st.crew) if (!c.tot && c.rolle === 'nav') c.xp += 1;
  }

  function navSchritt(st, dt) {
    const b = st.boot, k = koppelOrt(st);
    const ort = sim.handelsort(st);
    if (ort && ort.art === 'hafen' && b.fahrt === 0) { k.x = b.x; k.y = b.y; b.unsicher = 0.2; return; }
    // Strömung (0,2–0,6 kn), dreht langsam
    if (!b.stroemung) b.stroemung = { w: Math.random() * Math.PI * 2, kn: 0.2 + Math.random() * 0.4 };
    const sr = b.stroemung;
    sr.w += (Math.random() - 0.5) * 0.004 * dt;
    sr.kn = klemme(sr.kn + (Math.random() - 0.5) * 0.002 * dt, 0.2, 0.6);
    const km = sr.kn * 1.852 / 60 * dt;
    const nx = b.x + Math.cos(sr.w) * km, ny = b.y + Math.sin(sr.w) * km;
    if (!imLand(nx, ny)) { b.x = nx; b.y = ny; }
    b.unsicher = Math.min(60, (b.unsicher || 0.3) + 0.012 * dt);

    if (unterWasser(st) || !lebtRolle(st, 'nav')) return;
    const m = st.zeit % 1440, tag = Math.floor(st.zeit / 1440);
    const daemmerung = m >= 330 && m < 420 ? 0 : m >= 1140 && m < 1230 ? 1 : -1;
    if (daemmerung >= 0 && b.besteckKey !== tag * 3 + daemmerung) {
      b.besteckKey = tag * 3 + daemmerung;
      besteck(st, daemmerung ? 'Sternbesteck in der Abenddämmerung' : 'Sternbesteck in der Morgendämmerung', 0.6);
    } else if (m >= 690 && m < 750 && b.besteckKey !== tag * 3 + 2) {
      b.besteckKey = tag * 3 + 2;
      besteck(st, 'Mittagsbreite (Sonnenhöhe)', 0.4, true);
    } else if (istTag(st) && b.unsicher > 2 && landAbstand(b.x, b.y) < 18) {
      besteck(st, 'Kreuzpeilung an Landmarken', 0.3, false, true);
    }
  }

  /* ---------------- Welt, Schiffe, Kampf ---------------- */
  function neuesSchiff(st, typ, extra) {
    const t = D.SCHIFFSTYPEN[typ];
    let start, ziel;
    if (typ === 'frachter') {
      start = Math.random() < 0.6 ? { x: 150 + Math.random() * 100, y: 199 } : { x: 228 + Math.random() * 25, y: 1 };
      ziel = { x: 248, y: 60 + Math.random() * 90 };
    } else if (typ === 'zerstoerer') {
      start = zufallsPunkt(175, 250, 30, 180);
      ziel = zufallsPunkt(170, 250, 30, 180, start);
    } else {
      start = zufallsPunkt(50, 200, 40, 190);
      ziel = zufallsPunkt(50, 200, 40, 190, start);
    }
    const s = Object.assign({
      id: st.naechsteId++, typ, x: start.x, y: start.y, ziel, kn: t.kn, hp: t.hp,
      entdeckt: 'nein', ident: 0, alarmiert: false, letzteSicht: null, nachladen: 0, versenkt: false,
    }, extra || {});
    st.schiffe.push(s);
    return s;
  }

  function weltBevoelkern(st) {
    const anzahl = (t) => st.schiffe.filter((s) => s.typ === t && !s.mission).length;
    while (anzahl('frachter') < 3) neuesSchiff(st, 'frachter');
    while (anzahl('zerstoerer') < 2) neuesSchiff(st, 'zerstoerer');
    while (anzahl('haendler') < 1) neuesSchiff(st, 'haendler');
  }

  function trefferAufBoot(st, menge) {
    const i = Math.floor(Math.random() * st.boot.abteile.length);
    const a = st.boot.abteile[i];
    a.rumpf = Math.max(0, a.rumpf - menge * (1 - 0.15 * st.boot.upgrades.rumpf));
    log(st, 'Treffer ' + D.ABTEILE[i].ort + '! Rumpf ' + Math.round(a.rumpf) + ' %.', 'alarm');
    for (const c of lebende(st)) c.moral = Math.max(0, c.moral - 2);
  }

  /* ---------- U-Jagd ----------
     Getaucht findet der Zerstörer das Boot mit dem Horchgerät (je lauter, desto weiter) und mit ASDIC
     (aktiv, bis 2,5 km, nur wenn er schon sucht). Ein Boot auf Grund ist für ASDIC kaum vom Meeresboden
     zu unterscheiden, gestoppte Maschinen hört kaum jemand. Wasserbomben reichen bis 180 m. */
  const WABO_MAX = 180;
  function zerstoererSchritt(st, s, t, d, dt) {
    const b = st.boot;
    if (s.wabos == null) { s.wabos = 15; s.waboPause = 0; }
    const uw = b.tiefe >= 4;
    let ortung = null;
    if (b.tiefe < 4 && d < 12) ortung = 'sicht';
    else if (b.tiefe <= 15 && d < 2.5 && Math.random() < 0.3 * dt) ortung = 'sicht';
    else if (uw) {
      let laerm = b.aufGrund && (sim.knoten || 0) < 0.5 ? 0.03 : D.FAHRT[b.fahrt].leise ? 0.05 : 0.08 + Math.min(1, (sim.knoten || 0) / 7.6) * 0.9;
      // Pumpen und Echolot sind laut und verraten das Boot
      if (b.abteile.some((a) => a.pumpe && a.wasser > 0.01)) laerm += D.WABO_LAERM;
      if (b.echolot) laerm += D.WABO_LAERM;
      const unterSchicht = b.tiefe > sprungschicht(b.x, b.y) + 5;
      if (unterSchicht) laerm *= 0.6;
      // Horchgerät: bei eigener Jagdfahrt ist der Zerstörer taub
      const horchR = 2 + 8 * laerm;
      if (d < horchR && s.kn <= 15 && Math.random() < 0.25 * laerm * dt) ortung = 'horch';
      // ASDIC: nur wenn er schon sucht, innen ab 150 m tote Zone
      if (s.alarmiert && d < 2.5) {
        b.asdic = st.zeit;
        if (d > 0.15) {
          let p = 0.6 * (1 - d / 2.5);
          if (b.aufGrund) p *= wassertiefe(b.x, b.y) < 80 ? 0.08 : 0.2;
          if (b.tiefe > 100) p *= 0.7;
          if (unterSchicht) p *= 0.35;   // Schallschatten unter der Sprungschicht
          if (Math.random() < p * dt) ortung = 'asdic';
        }
      }
    }
    if (ortung) {
      const fehler = ortung === 'asdic' ? 0.08 : ortung === 'horch' ? 0.6 : 0.02;
      s.letzteSicht = { x: b.x + (Math.random() * 2 - 1) * fehler, y: b.y + (Math.random() * 2 - 1) * fehler };
      s.kontaktTiefe = uw ? b.tiefe + (Math.random() * 2 - 1) * (ortung === 'asdic' ? 15 : 45) : 0;
      if (!s.alarmiert) log(st, ortung === 'sicht' ? 'Ein Zerstörer hat uns entdeckt!' : ortung === 'asdic' ? 'ASDIC-Ortung! Ein Zerstörer hat uns erfasst.' : 'Ein Zerstörer hat uns gehört und dreht auf uns zu!', 'alarm');
      else if (ortung === 'asdic' && (s.letzteOrtung || 0) < st.zeit - 10) log(st, 'ASDIC hat uns wieder erfasst!', 'alarm');
      s.letzteOrtung = st.zeit;
      s.alarmiert = true; s.suche = uw ? 60 : 30;
    } else if (s.alarmiert) {
      s.suche -= dt;
      // Kontakt verloren: rund um die letzte Position absuchen
      if (s.letzteSicht && dist(s, s.letzteSicht) < 0.3 && (s.letzteOrtung || 0) < st.zeit - 8) {
        s.letzteSicht = { x: s.letzteSicht.x + (Math.random() * 2 - 1) * 1.5, y: s.letzteSicht.y + (Math.random() * 2 - 1) * 1.5 };
      }
      if (s.suche <= 0 || s.wabos <= 0) {
        s.alarmiert = false; s.ziel = zufallsPunkt(170, 250, 30, 180, s);
        log(st, s.wabos <= 0 ? 'Der Zerstörer hat keine Wasserbomben mehr und dreht ab.' : 'Der Zerstörer hat die Suche abgebrochen.', 'gut');
      }
    }
    if (s.alarmiert && s.letzteSicht) s.ziel = s.letzteSicht;
    // langsame Suchfahrt, wenn er horcht; volle Jagdfahrt, wenn er das Boot gesehen oder frisch geortet hat
    s.kn = !s.alarmiert ? t.kn : (st.zeit - (s.letzteOrtung || 0) < 6 ? t.jagdKn : 10);
    s.nachladen = Math.max(0, s.nachladen - dt);
    s.waboPause = Math.max(0, s.waboPause - dt);
    if (s.alarmiert && b.tiefe < 4 && d < 6 && s.nachladen <= 0) {
      s.nachladen = 2;
      if (Math.random() < 0.35) trefferAufBoot(st, 12 + Math.random() * 13);
      else log(st, 'Granateinschlag neben dem Boot.', 'warn');
    }
    // Wasserbomben: über der vermuteten Position, Tiefe nach Ortung eingestellt
    if (s.alarmiert && uw && s.letzteSicht && dist(s, s.letzteSicht) < 0.25 && s.waboPause <= 0 && s.wabos > 0 && st.zeit - (s.letzteOrtung || -99) < 25) {
      s.waboPause = 8; s.wabos--;
      wasserbomben(st, s);
    }
  }

  function wasserbomben(st, s) {
    const b = st.boot;
    const einstellung = klemme(s.kontaktTiefe || 60, 20, WABO_MAX);
    let wirkung = 0;
    for (let k = 0; k < 6; k++) {
      const wx = s.x + (Math.random() * 2 - 1) * 0.12, wy = s.y + (Math.random() * 2 - 1) * 0.12;
      const h = Math.hypot(wx - b.x, wy - b.y);
      const v = Math.abs(einstellung + (Math.random() * 2 - 1) * 10 - b.tiefe);
      // wirksam bis etwa 60 m zur Seite und 30 m in der Tiefe
      wirkung += Math.max(0, 1 - h / 0.06) * Math.max(0, 1 - v / 30);
    }
    b.erschuetterung = Math.min(1, 0.25 + wirkung);
    b.ghgTaub = st.zeit + 3;   // Wasserwirbel und Luftblasen betäuben das Horchgerät
    for (const c of lebende(st)) c.moral = Math.max(0, c.moral - (wirkung > 0.3 ? 3 : 1));
    if (wirkung > 0.05) {
      const treffer = wirkung > 0.8 ? 3 : wirkung > 0.35 ? 2 : 1;
      for (let k = 0; k < treffer; k++) trefferAufBoot(st, Math.min(30, 8 + wirkung * 14));
      log(st, wirkung > 0.8 ? 'Wasserbomben direkt am Boot! Schwere Schäden!' : 'Wasserbomben liegen dicht am Boot!', 'alarm');
    } else log(st, 'Wasserbomben! Sie detonieren ' + (b.tiefe > WABO_MAX + 20 ? 'weit über uns.' : 'in einiger Entfernung.'), 'warn');
  }

  function schiffeSchritt(st, dt, eff) {
    const b = st.boot;
    const uw = unterWasser(st);
    const sicht = !uw ? 14 : (antenneFrei(st) && eff.sehrohr > 0 ? 9 * Math.min(1, eff.sehrohr) : 0);
    const sonar = horchweite(st, eff);

    for (const s of st.schiffe) {
      if (s.versenkt) continue;
      const t = D.SCHIFFSTYPEN[s.typ];
      const d = dist(s, b);

      // KI des Zerstörers: Sicht, Horchgerät, ASDIC und Wasserbomben
      if (s.typ === 'zerstoerer') zerstoererSchritt(st, s, t, d, dt);

      // Bewegung
      const zd = dist(s, s.ziel);
      const km = s.kn * 1.852 / 60 * dt;
      if (zd <= km) {
        s.x = s.ziel.x; s.y = s.ziel.y;
        if (s.typ === 'frachter') { s.angekommen = true; }
        else if (!s.alarmiert) s.ziel = s.typ === 'zerstoerer' ? zufallsPunkt(170, 250, 30, 180, s) : zufallsPunkt(50, 200, 40, 190, s);
      } else {
        const nx = s.x + (s.ziel.x - s.x) / zd * km, ny = s.y + (s.ziel.y - s.y) / zd * km;
        if (!imLand(nx, ny)) { s.x = nx; s.y = ny; } else s.ziel = zufallsPunkt(s.x - 30, s.x + 30, s.y - 30, s.y + 30, s);
      }

      // Entdeckung durch das Boot
      if (d < sicht) { s.ident = 1; s.klass = true; s.entdeckt = 'sicht'; }
      else if (d < sonar && !imTotenWinkel(st, s)) {
        // ident = Qualität der Horch-Aufnahme. Erkannt ist der Kontakt erst nach dem Abgleich im Horchraum.
        s.entdeckt = 'sonar';
        s.ident = Math.min(1, s.ident + eff.sonar * dt / 6);
        if (!s.klass && s.ident >= 0.9 && hatAusbau(st, 'feingehoer')) {
          s.klass = true;
          log(st, 'Der Horcher erkennt das Schraubengeräusch: ' + D.SCHIFFSTYPEN[s.typ].name + '.', 'gut');
        }
      } else {
        s.entdeckt = 'nein'; s.ident = Math.max(0, s.ident - dt / 120);
        if (s.ident <= 0) s.klass = false;
      }
    }

    // Frachter am Ziel verschwinden
    for (const s of st.schiffe) {
      if (s.angekommen && !s.versenkt) {
        s.versenkt = true; s.weg = true;
        if (s.mission) {
          const m = st.missionen.find((x) => x.id === s.mission);
          if (m && m.status === 'aktiv') { m.status = 'gescheitert'; log(st, 'Auftrag gescheitert: Der Frachter hat seinen Zielhafen erreicht.', 'alarm'); }
        }
      }
    }
    st.schiffe = st.schiffe.filter((s) => !s.weg || (s.versenktZeit && st.zeit - s.versenktZeit < 60));
    if (st.ziel != null && !st.schiffe.some((s) => s.id === st.ziel && !s.versenkt)) st.ziel = null;
  }

  function torpedoSchritt(st, dt) {
    for (const t of st.torpedos) {
      const s = st.schiffe.find((x) => x.id === t.ziel && !x.versenkt);
      if (!s) { t.weg = true; continue; }
      const d = dist(t, s);
      const km = (t.kn || 40) * 1.852 / 60 * dt;
      t.laufzeit += dt;
      // Blasenbahn bei Tag: Geleitfahrzeuge in der Nähe werden aufmerksam
      if (t.blasen && !t.gesehen && t.laufzeit > 0.5) {
        t.gesehen = true;
        for (const z of st.schiffe) if (z.typ === 'zerstoerer' && !z.versenkt && dist(z, st.boot) < 8) { z.alarmiert = true; z.suche = 40; z.letzteSicht = { x: st.boot.x, y: st.boot.y }; }
      }
      if (d <= km) {
        t.weg = true;
        if (Math.random() < t.chance) {
          if (Math.random() < D.VERSAGER) { log(st, 'Treffer – aber Versager! Der ' + t.typ + ' hat nicht gezündet.', 'warn'); continue; }
          s.hp--;
          if (s.typ === 'zerstoerer') { s.alarmiert = true; s.letzteSicht = { x: st.boot.x, y: st.boot.y }; s.suche = 40; }
          if (s.hp <= 0) schiffVersenkt(st, s);
          else log(st, 'Torpedotreffer auf ' + D.SCHIFFSTYPEN[s.typ].name + '! Er ist schwer beschädigt.', 'gut');
        } else log(st, 'Der ' + t.typ + ' hat das Ziel verfehlt.', 'warn');
      } else if (t.laufzeit > (t.maxZeit || 12)) {
        t.weg = true; log(st, 'Laufzeit um – der ' + t.typ + ' hat das Ziel nicht erreicht.', 'warn');
      } else {
        t.x += (s.x - t.x) / d * km; t.y += (s.y - t.y) / d * km;
      }
    }
    st.torpedos = st.torpedos.filter((t) => !t.weg);
  }

  /* 8,8-cm-Geschütz (Handbuch Kap. 6.6): nur aufgetaucht, Geschützführer II. WO, Bedienung bei Gefechtsstationen.
     Etwa 8 Schuss pro Minute; ein Frachter braucht rund 20 Treffer. */
  function geschuetzSchritt(st, dt) {
    const b = st.boot;
    if (b.geschuetz == null) return;
    const s = st.schiffe.find((x) => x.id === b.geschuetz && !x.versenkt);
    const halt = (t) => { b.geschuetz = null; log(st, 'Geschütz: ' + t, 'info'); };
    if (!s) return halt('Feuer eingestellt.');
    if (b.tiefe > 0.5) return halt('Feuer eingestellt – Boot taucht.');
    if (st.ladung.munition88 <= 0) return halt('Keine 8,8-cm-Munition mehr.');
    const d = dist(s, b);
    if (d > 6) return halt('Ziel außer Reichweite (6 km).');
    b.schussRest = (b.schussRest || 0) + 8 * dt;
    while (b.schussRest >= 1 && st.ladung.munition88 > 0) {
      b.schussRest -= 1; st.ladung.munition88--;
      if (Math.random() < klemme(0.5 - d / 12, 0.05, 0.5)) {
        s.geschuetzTreffer = (s.geschuetzTreffer || 0) + 1;
        const noetig = s.typ === 'zerstoerer' ? 30 : 20;
        if (s.geschuetzTreffer >= noetig) { schiffVersenkt(st, s); b.geschuetz = null; return; }
        if (s.geschuetzTreffer % 5 === 0) log(st, 'Geschütz: ' + s.geschuetzTreffer + ' Treffer auf dem ' + D.SCHIFFSTYPEN[s.typ].name + '.', 'gut');
      }
    }
    if (s.typ === 'zerstoerer' || st.schiffe.some((z) => z.typ === 'zerstoerer' && !z.versenkt && dist(z, b) < 12)) {
      for (const z of st.schiffe) if (z.typ === 'zerstoerer' && !z.versenkt && dist(z, b) < 15) { z.alarmiert = true; z.letzteSicht = { x: b.x, y: b.y }; z.suche = 30; }
    }
  }
  sim.geschuetz = function (st) {
    const b = st.boot;
    if (b.geschuetz != null) { b.geschuetz = null; log(st, 'Geschütz: Feuer einstellen!', 'info'); return null; }
    const s = st.schiffe.find((x) => x.id === st.ziel && !x.versenkt);
    if (!s) return 'Kein Ziel gewählt.';
    if (!D.SCHIFFSTYPEN[s.typ].feind) return 'Feuer auf neutrale Schiffe ist verboten.';
    if (b.tiefe > 0.5) return 'Das Geschütz geht nur aufgetaucht.';
    if (!st.alarm) return 'Erst Gefechtsstationen – die Geschützbedienung muss an Deck.';
    if (!lebende(st).some((c) => c.rolle === 'wo2' || c.rolle === 'wo1')) return 'Kein Geschützführer an Bord.';
    if (st.ladung.munition88 <= 0) return 'Keine 8,8-cm-Munition.';
    if (dist(s, b) > 6) return 'Ziel zu weit (Geschütz bis 6 km).';
    b.geschuetz = s.id;
    log(st, 'II. WO: „Geschütz – Feuer frei!“', 'warn');
    return null;
  };

  function schiffVersenkt(st, s) {
    const t = D.SCHIFFSTYPEN[s.typ];
    s.versenkt = true; s.weg = true; s.versenktZeit = st.zeit;
    st.geld += t.kopfgeld;
    st.statistik.versenkt++;
    log(st, t.name + ' versenkt! Prämie: ' + t.kopfgeld + ' Kr.', 'gut');
    for (const c of lebende(st)) c.moral = Math.min(100, c.moral + 6);
    if (s.mission) {
      const m = st.missionen.find((x) => x.id === s.mission);
      if (m && m.status === 'aktiv') missionErfuellt(st, m);
    }
  }

  /* Ein Kontakt gilt als erkannt, wenn er gesehen oder im Horchraum richtig abgeglichen wurde. */
  function bekannt(s) { return s.entdeckt === 'sicht' || !!s.klass; }
  sim.bekannt = bekannt;

  /* Horch-Minispiel: Der Spieler ordnet das Schraubengeräusch einer Vorlage aus der Kartei zu. */
  sim.klassifizieren = function (st, id, typ) {
    const s = st.schiffe.find((x) => x.id === id && !x.versenkt);
    if (!s || s.entdeckt !== 'sonar') return { ok: false, text: 'Der Kontakt ist nicht mehr im Horchbereich.' };
    if (bekannt(s)) return { ok: true, text: 'Kontakt ist bereits erkannt.' };
    if (sim.eff.sonar <= 0) return { ok: false, text: 'Niemand sitzt am Horchgerät.' };
    if (s.ident < 0.5) return { ok: false, text: 'Die Aufnahme ist noch zu schwach (unter 50 %).' };
    if (s.sperre && st.zeit < s.sperre) return { ok: false, text: 'Der Soni hört noch einmal hin … (' + Math.ceil(s.sperre - st.zeit) + ' min)' };
    const horcher = st.crew.filter((c) => !c.tot && c.aktPosten === 'horch');
    if (typ === s.typ) {
      s.klass = true;
      for (const c of horcher) c.xp += 3;
      log(st, 'Horchkontakt erkannt: ' + D.SCHIFFSTYPEN[s.typ].name + (D.SCHIFFSTYPEN[s.typ].feind ? ' (feindlich).' : ' (neutral).'), 'gut');
      return { ok: true, text: 'Richtig: ' + D.SCHIFFSTYPEN[s.typ].name + '.' };
    }
    s.sperre = st.zeit + 10;
    for (const c of horcher) c.moral = Math.max(0, c.moral - 3);
    log(st, 'Falsche Meldung aus dem Horchraum – das war kein ' + D.HORCH[typ].name + '.', 'warn');
    return { ok: false, text: 'Falsch gemeldet. Der Soni braucht 10 Minuten für eine neue Aufnahme.' };
  };

  function istTag(st) { const h = uhrzeit(st).stunde; return h >= 7 && h < 19; }
  sim.istTag = istTag;

  sim.feuern = function (st, typ, faecher) {
    const b = st.boot;
    const s = st.schiffe.find((x) => x.id === st.ziel && !x.versenkt);
    if (!s) return 'Kein Ziel ausgewählt. Klicke auf der Karte auf einen Kontakt.';
    if (!D.SCHIFFSTYPEN[s.typ].feind) return 'Feuer auf neutrale Schiffe ist verboten.';
    if (s.entdeckt === 'nein') return 'Ziel ist nicht erfasst.';
    if (!bekannt(s)) return 'Ziel ist nicht klassifiziert. Erst im Horchraum das Schraubengeräusch abgleichen.';
    if (b.tiefe > 15) return 'Zum Schießen auf Sehrohrtiefe oder an die Oberfläche gehen.';
    if (sim.eff.torpedo <= 0) return 'Niemand am Torpedo-Vorhalterechner.';
    const d = dist(s, b);
    if (d > 12.5) return 'Ziel zu weit entfernt (größte Laufstrecke 12,5 km mit G7a).';
    // Ziel vorn (bis 100° zur Seite) → Bugrohre 1–4, Ziel achtern → Heckrohr 5
    const rel = Math.abs(((Math.atan2(s.y - b.y, s.x - b.x) - b.kurs) * 180 / Math.PI + 540) % 360 - 180);
    const heck = rel > 100;
    const wunsch = typ || b.ladeTyp || 'G7e';
    let rohre = heck ? (b.rohre[4] ? [4] : []) : [0, 1, 2, 3].filter((i) => b.rohre[i]);
    if (!rohre.length) return heck ? 'Das Ziel liegt achteraus und das Heckrohr ist leer.' : 'Alle Bugrohre leer. Die Torpedomixer laden nach.';
    rohre.sort((x, y) => (b.rohre[x] === wunsch ? 0 : 1) - (b.rohre[y] === wunsch ? 0 : 1));
    rohre = rohre.slice(0, Math.max(1, Math.min(heck ? 1 : 4, faecher || 1)));
    const tag = istTag(st);
    let geschossen = 0;
    for (const r of rohre) {
      const t = D.TORPEDOTYPEN[b.rohre[r]] || D.TORPEDOTYPEN.G7e;
      // kleinste Fahrtstufe, deren Laufstrecke reicht
      const stufe = t.stufen.find(([, km]) => km >= d);
      if (!stufe) { if (!geschossen) return t.kurz + ': Ziel außerhalb der Laufstrecke (' + t.stufen[t.stufen.length - 1][1] + ' km).'; continue; }
      let chance = klemme(0.95 - d / 10 - (s.kn > 15 ? 0.15 : 0), 0.1, 0.95) * (0.6 + 0.4 * Math.min(1, sim.eff.torpedo)) * (hatAusbau(st, 'vorhalter') ? 1.15 : 1);
      if (rohre.length > 1) chance *= 0.8;                       // Fächer: Streuwinkel
      if (t.blasen && tag) chance *= 0.8;                        // Blasenbahn bei Tag: Gegner kann ausweichen
      st.torpedos.push({ x: b.x, y: b.y, ziel: s.id, chance: Math.min(0.98, chance), laufzeit: 0, kn: stufe[0], maxZeit: stufe[1] / (stufe[0] * 1.852 / 60), typ: t.kurz, blasen: t.blasen && tag });
      log(st, (r === 4 ? 'Heckrohr' : 'Rohr ' + (r + 1)) + ' – los! ' + t.kurz + ' mit ' + stufe[0] + ' kn, Laufzeit ' + Math.round(d / (stufe[0] * 1.852 / 60) * 60) + ' s.', 'info');
      b.rohre[r] = null;
      geschossen++;
    }
    for (const c of st.crew) if (!c.tot && c.aktPosten === 'torpedo') c.xp += 3;
    return null;
  };

  function nachladenSchritt(st, dt, eff) {
    const b = st.boot;
    // Nachladen eines Rohrs mit Flaschenzug und Laderinne: rund 10–15 Minuten (Handbuch Kap. 6.1)
    const dauer = hatAusbau(st, 'schnellladen') ? 9 : 12;
    const leer = b.rohre.slice(0, 4).findIndex((r) => !r);
    if (eff.nachladen > 0 && st.ladung.torpedos > 0 && leer >= 0) {
      b.ladeFortschritt += eff.nachladen * dt / dauer;
      if (b.ladeFortschritt >= 1) {
        b.ladeFortschritt = 0;
        b.rohre[leer] = reserveNehmen(st, 'torpedos', b.ladeTyp || 'G7e');
        log(st, 'Rohr ' + (leer + 1) + ' nachgeladen (' + b.rohre[leer] + ').', 'info');
      }
    }
    if (eff.heckladen > 0 && st.ladung.torpedosHeck > 0 && !b.rohre[4]) {
      b.heckFortschritt += eff.heckladen * dt / dauer;
      if (b.heckFortschritt >= 1) {
        b.heckFortschritt = 0;
        b.rohre[4] = reserveNehmen(st, 'torpedosHeck', b.ladeTyp || 'G7e');
        log(st, 'Heckrohr nachgeladen (' + b.rohre[4] + ').', 'info');
      }
    }
    // Torpedo aus dem Oberdeckbehälter übernehmen: nur aufgetaucht und höchstens Kleine Fahrt
    const u = b.deckUebernahme;
    if (u) {
      if (b.tiefe > 0.5 || b.fahrt > 2) { if (!u.pause) log(st, 'Übernahme aus dem Oberdeckbehälter unterbrochen – nur aufgetaucht bei Langsamer Fahrt möglich.', 'warn'); u.pause = true; }
      else {
        u.pause = false; u.rest -= dt;
        if (u.rest <= 0) {
          b.deckUebernahme = null;
          const typ = reserveNehmen(st, 'torpedosDeck', 'G7a') || 'G7a';
          reserveDazu(st, st.ladung.torpedos < kapazitaet(st, 'torpedos') ? 'torpedos' : 'torpedosHeck', typ);
          log(st, 'Torpedo aus dem Oberdeckbehälter ins Boot übernommen.', 'gut');
        }
      }
    }
  }

  /* ---------------- Funk und Aufträge ---------------- */
  function neueMission(st) {
    const id = st.naechsteId++;
    if (Math.random() < 0.55) {
      const fr = neuesSchiff(st, 'frachter', { mission: id });
      return { id, typ: 'versenken', status: 'aktiv', schiff: fr.id, belohnung: 1500 + Math.round(Math.random() * 10) * 100,
        titel: 'Frachter versenken',
        text: 'Feindlicher Frachter in Quadrat ' + planquadrat(fr) + ' gemeldet, Kurs auf die Küste von ' + D.FEIND_NAME + ' (' + planquadrat(fr.ziel) + '). Abfangen und versenken.' };
    }
    const p = zufallsPunkt(150, 255, 25, 185);
    return { id, typ: 'patrouille', status: 'aktiv', ziel: p, belohnung: 600 + Math.round(Math.random() * 6) * 50,
      titel: 'Patrouille', text: 'Patrouillieren Sie Quadrat ' + planquadrat(p) + ' und melden Sie Feindbewegungen.' };
  }


  /* ---------------- Funk (Kap. 7) ----------------
     Der BdU sendet nur zu festen Zeiten (alle 4 Stunden) einen Rundspruch auf Kurzwelle.
     Der Spruch kommt als Morse in Fünfergruppen, verschlüsselt mit der Schlüsselmaschine M
     (Tagesschlüssel aus der Schlüsseltafel, Spruchschlüssel in der Schlüsselgruppe). */
  const SENDE_ABSTAND = 240;
  function naechsteSendezeit(st) { return (Math.floor(st.zeit / SENDE_ABSTAND) + 1) * SENDE_ABSTAND; }
  sim.naechsteSendezeit = function (st) { const t = naechsteSendezeit(st); return String(Math.floor(t % 1440 / 60)).padStart(2, '0') + ':00'; };
  sim.tagesschluessel = function (st, tag) {
    if (!st.schluesselSeed) st.schluesselSeed = 1 + Math.floor(Math.random() * 1e9);
    return S.enigma.tagesschluessel(st.schluesselSeed, tag);
  };

  sim.anfunken = function (st) {
    const f = st.funk;
    if (f.anfrage) return f.anfrage.rest > 0 ? 'Es wird bereits gesendet.' : 'Die Antwort kommt mit dem nächsten Rundspruch um ' + sim.naechsteSendezeit(st) + ' Uhr.';
    if (!antenneFrei(st)) return 'Funk nur an der Oberfläche oder auf Sehrohrtiefe möglich.';
    if (sim.eff.funk <= 0) return 'Niemand sitzt am Funkgerät.';
    if (st.missionen.filter((m) => m.status === 'aktiv').length >= 3) return 'Erst laufende Aufträge erledigen.';
    f.anfrage = { rest: 8 };
    log(st, 'Kurzsignal an den BdU wird abgesetzt. Achtung: Der Gegner peilt Funksprüche ein.', 'info');
    return null;
  };

  /* Feindliche Funkpeilung (HF/DF): Ein Zerstörer in der Nähe läuft die eingepeilte Position an. */
  function eingepeilt(st) {
    const b = st.boot;
    let best = null;
    for (const z of st.schiffe) if (z.typ === 'zerstoerer' && !z.versenkt && dist(z, b) < 120 && (!best || dist(z, b) < dist(best, b))) best = z;
    if (!best || Math.random() > 0.5) return;
    const w = Math.random() * Math.PI * 2, f = 3 + Math.random() * 8;
    best.alarmiert = true; best.suche = 90;
    best.letzteSicht = { x: b.x + Math.cos(w) * f, y: b.y + Math.sin(w) * f };
  }

  function neueNachricht(st, m) {
    const n = { id: st.naechsteId++, zeit: st.zeit, mission: m, fortschritt: 0, fertig: false, ruf: true, empfangen: false };
    funkFelder(st, n);
    return n;
  }

  /* Rundspruch zur festen Sendezeit */
  function rundspruch(st) {
    const f = st.funk;
    let n = null;
    if (f.wiederholung) {
      n = f.wiederholung; f.wiederholung = null;
      n.empfangen = false; n.ruf = true;
      n.freq = funkFrequenz(st); n.f = startFrequenz(n.freq);
    } else {
      let m = null;
      const platz = st.missionen.filter((x) => x.status === 'aktiv').length < 3;
      if (f.anfrage && f.anfrage.rest <= 0) { f.anfrage = null; if (platz) m = neueMission(st); }
      else if (Math.random() < 0.55) {
        if (platz && Math.random() < 0.6) m = neueMission(st);
        else {
          const fr = neuesSchiff(st, 'frachter');
          m = { id: st.naechsteId++, typ: 'meldung', status: 'info', schiff: fr.id, belohnung: 0, titel: 'Feindmeldung',
            text: 'Feindlicher Frachter in Quadrat ' + planquadrat(fr) + ' gesichtet, Kurs ' + planquadrat(fr.ziel) + '. Angriff freigegeben.' };
        }
      }
      if (!m) return;
      n = neueNachricht(st, m);
    }
    f.nachrichten.unshift(n);
    if (f.nachrichten.length > 8) f.nachrichten.length = 8;
    f.ruf = { id: n.id, bis: st.zeit + 40 };
    log(st, 'BdU-Rundspruch auf Kurzwelle – ein Spruch für uns! Er läuft 40 Minuten.' + (antenneFrei(st) ? '' : ' Auf Sehrohrtiefe gehen, sonst geht er verloren!'), 'warn');
  }

  function funkSchritt(st, dt, eff) {
    const f = st.funk;
    const slot = Math.floor(st.zeit / SENDE_ABSTAND);
    if (f.slot == null) f.slot = slot;
    if (slot !== f.slot) { f.slot = slot; if (!f.ruf) rundspruch(st); }
    if (f.ruf) {
      const n = f.nachrichten.find((x) => x.id === f.ruf.id);
      if (!n || n.empfangen) f.ruf = null;
      else if (st.zeit > f.ruf.bis) {
        f.nachrichten.splice(f.nachrichten.indexOf(n), 1);
        f.ruf = null;
        f.wiederholung = n;
        log(st, 'Rundspruch verpasst. Der BdU wiederholt ihn um ' + sim.naechsteSendezeit(st) + ' Uhr.', 'alarm');
      }
    }
    if (f.anfrage && f.anfrage.rest > 0 && antenneFrei(st) && eff.funk > 0) {
      f.anfrage.rest -= dt * eff.funk;
      if (f.anfrage.rest <= 0) {
        eingepeilt(st);
        log(st, 'Kurzsignal abgesetzt und quittiert. Antwort mit dem Rundspruch um ' + sim.naechsteSendezeit(st) + ' Uhr.', 'info');
      }
    }
    for (const n of f.nachrichten) {
      funkFelder(st, n);
      // Ohne Minispiel: Der Funkmaat schreibt mit und schlüsselt selbst – dauert dreimal so lang.
      if (n.fertig || !n.auto || !n.empfangen || eff.funk <= 0) continue;
      n.fortschritt = Math.min(1, n.fortschritt + eff.funk * dt / 45);
      if (n.fortschritt >= 1) nachrichtFertig(st, n);
    }
  }

  function nachrichtFertig(st, n) {
    if (n.fertig) return;
    n.fertig = true; n.fortschritt = 1; n.mitgeschrieben = true;
    n.eingabe = n.spruch.replace(/ /g, '');
    if (!n.mitschrift || !n.mitschrift.includes(n.klar)) n.mitschrift = n.spruchSchl + n.klar;
    for (const c of st.crew) if (!c.tot && c.aktPosten === 'funk') c.xp += 2;
    if (n.mission.typ === 'meldung') {
      const s = st.schiffe.find((x) => x.id === n.mission.schiff && !x.versenkt);
      if (s) s.gemeldet = { x: s.x, y: s.y };
      log(st, 'Feindmeldung entschlüsselt: ' + n.mission.text + ' Auf der Karte markiert.', 'gut');
      return;
    }
    st.missionen.push(n.mission);
    log(st, 'Neuer Auftrag: ' + n.mission.titel + '. ' + n.mission.text, 'gut');
  }

  /* Kurzwelle 3 750–15 000 kHz. Tagwelle höher, Nachtwelle tiefer. */
  function funkFrequenz(st) {
    const F = D.FUNK, b = istTag(st) ? F.tag : F.nacht;
    return b[0] + 10 * Math.round(Math.random() * (b[1] - b[0]) / 10);
  }
  function startFrequenz(freq) {
    const F = D.FUNK;
    let f;
    do { f = F.min + 10 * Math.round(Math.random() * (F.max - F.min) / 10); } while (Math.abs(f - freq) < 1500);
    return f;
  }
  function quadratKlar(p) {
    const q = quadratTeile(p);
    return q.name + S.enigma.klartext(String(q.z1)) + S.enigma.klartext(String(q.z2));
  }

  /* Spruch: Klartext nach Marine-Verfahren, verschlüsselt in Fünfergruppen (auch für ältere Spielstände nachgetragen). */
  function funkFelder(st, n) {
    if (n.klar) return;
    const m = n.mission;
    const fr = m.schiff != null ? st.schiffe.find((x) => x.id === m.schiff) : null;
    const E = S.enigma;
    const klar = m.typ === 'versenken' ? 'FRACHTERXQUX' + (fr ? quadratKlar(fr) : 'UNBEKANNT') + 'XANGREIFEN'
      : m.typ === 'meldung' ? 'FEINDXQUX' + (fr ? quadratKlar(fr) : 'UNBEKANNT') + 'XANGRIFFXFREI'
        : 'PATROUILLEXQUX' + quadratKlar(m.ziel);
    n.tag = Math.floor(st.zeit / 1440) + 1;
    const sch = sim.tagesschluessel(st, n.tag);
    n.spruchSchl = '';
    for (let i = 0; i < 3; i++) n.spruchSchl += E.A[Math.floor(Math.random() * 26)];
    const v = E.verschluessele(sch, klar, n.spruchSchl);
    n.klar = v.klar;
    n.spruch = [v.kopf].concat(v.gruppen).join(' ');
    if (n.empfangen === undefined) n.empfangen = false;
    n.freq = funkFrequenz(st);
    n.f = startFrequenz(n.freq);
    n.eingabe = ''; n.mitgeschrieben = false;
    n.walzen = 'AAA'; n.mitschrift = ''; n.verlauf = []; n.lampe = null;
  }

  sim.funkSignal = function (n, st) {
    if (st && !n.empfangen && !antenneFrei(st)) return 'rauschen';
    const d = Math.abs(n.f - n.freq);
    return d === 0 ? 'klar' : d <= D.FUNK.schwach ? 'schwach' : 'rauschen';
  };
  sim.funkNachricht = function (st, id) { return st.funk.nachrichten.find((n) => n.id === id) || null; };
  sim.funkStellen = function (st, id, delta) {
    const n = sim.funkNachricht(st, id);
    if (!n || n.fertig) return null;
    if (sim.eff.funk <= 0) return 'Niemand sitzt am Funkgerät.';
    n.f = klemme(n.f + delta, D.FUNK.min, D.FUNK.max);
    if (!n.empfangen && sim.funkSignal(n, st) === 'klar') {
      n.empfangen = true;
      if (st.funk.ruf && st.funk.ruf.id === n.id) st.funk.ruf = null;
      log(st, 'Rundspruch aufgefangen. Fünfergruppen mitschreiben, dann an der Schlüsselmaschine entschlüsseln.', 'gut');
    }
    return null;
  };
  /* Morse mitschreiben (Fünfergruppen). Danach gehen Tasten an die Schlüsselmaschine. */
  sim.funkTaste = function (st, id, z) {
    const n = sim.funkNachricht(st, id);
    if (!n || n.fertig) return;
    if (n.mitgeschrieben) { sim.enigmaTaste(st, id, z); return; }
    const geheim = n.spruch.replace(/ /g, '');
    if (z === null) { n.eingabe = n.eingabe.slice(0, -1); return; }
    if (n.eingabe.length >= geheim.length) return;
    n.eingabe += z;
    if (n.eingabe === geheim) {
      n.mitgeschrieben = true;
      log(st, 'Spruch vollständig mitgeschrieben. Jetzt an der Schlüsselmaschine M entschlüsseln.', 'info');
    }
  };

  /* Schlüsselmaschine M: Walzenlage, Ringe und Stecker stellt der Funkmaat nach der Schlüsseltafel ein.
     Der Spieler stellt die Walzen, tastet und liest die Lampen ab. */
  const ZAHL = (t) => t.split('').map((c) => c.charCodeAt(0) - 65);
  const TEXT = (p) => p.map((x) => String.fromCharCode(65 + x)).join('');
  sim.enigmaTaste = function (st, id, z) {
    const n = sim.funkNachricht(st, id);
    if (!n || n.fertig || !n.mitgeschrieben) return;
    if (z === null) {
      const v = n.verlauf.pop();
      if (v) { n.walzen = v; n.mitschrift = n.mitschrift.slice(0, -1); n.lampe = null; }
      return;
    }
    if (!/^[A-Z]$/.test(z)) return;
    const m = S.enigma.maschine(sim.tagesschluessel(st, n.tag));
    const e = m.taste(z, ZAHL(n.walzen));
    n.verlauf.push(n.walzen);
    if (n.verlauf.length > 120) n.verlauf.shift();
    n.walzen = TEXT(e.pos);
    n.lampe = e.aus;
    n.mitschrift = (n.mitschrift + e.aus).slice(-120);
    if (n.mitschrift.includes(n.klar)) nachrichtFertig(st, n);
  };
  sim.enigmaGruppe = function (st, id, g) {
    const n = sim.funkNachricht(st, id);
    if (!n || n.fertig || !n.mitgeschrieben) return;
    const grp = n.spruch.split(' ')[g];
    if (grp) for (const ch of grp) { if (!n.fertig) sim.enigmaTaste(st, id, ch); }
  };
  sim.enigmaWalze = function (st, id, i, d) {
    const n = sim.funkNachricht(st, id);
    if (!n || n.fertig) return;
    const p = ZAHL(n.walzen);
    p[i] = (p[i] + d + 26) % 26;
    n.walzen = TEXT(p); n.lampe = null;
  };
  sim.enigmaNeu = function (st, id) {
    const n = sim.funkNachricht(st, id);
    if (!n || n.fertig) return;
    n.mitschrift = ''; n.verlauf = []; n.lampe = null;
  };
  sim.funkAuto = function (st, id) {
    const n = sim.funkNachricht(st, id);
    if (n && !n.fertig) {
      if (!n.empfangen) return 'Erst den Spruch auf der richtigen Frequenz auffangen.';
      n.auto = true; log(st, 'Der Funkmaat schreibt mit und schlüsselt selbst. Das dauert.', 'info');
    }
    return null;
  };

  function missionErfuellt(st, m) {
    m.status = 'erfuellt';
    st.geld += m.belohnung;
    st.statistik.auftraege++;
    for (const c of lebende(st)) c.moral = Math.min(100, c.moral + 8);
    log(st, 'Auftrag erfüllt: ' + m.titel + '. Der Stützpunkt überweist ' + m.belohnung + ' Kr.', 'gut');
  }

  function missionSchritt(st) {
    for (const m of st.missionen) {
      if (m.status !== 'aktiv') continue;
      if (m.typ === 'patrouille' && dist(st.boot, m.ziel) < 6) missionErfuellt(st, m);
    }
    st.missionen = st.missionen.filter((m) => m.status === 'aktiv' || st.missionen.indexOf(m) >= st.missionen.length - 6);
  }

  /* ---------------- Stundentakt ---------------- */
  function stundenSchritt(st) {
    const h = uhrzeit(st).stunde;
    for (const c of st.crew) if (!c.tot && c.aktPosten) c.xp += 1;
    if (h === 7 || h === 13 || h === 19) {
      const n = lebende(st).length;
      const bedarf = Math.ceil(n * st.ration / 3);
      if (st.ladung.proviant <= 0 && st.ladung.konserven <= 0) log(st, 'Kein Proviant mehr an Bord! Die Crew hungert.', 'alarm');
      else {
        const frisch = Math.min(bedarf, st.ladung.proviant);
        st.ladung.proviant -= frisch;
        if (bedarf > frisch) {
          if (st.ladung.konserven > 0 && st.ladung.proviant <= 0 && frisch === 0) log(st, 'Frischer Proviant ist alle – der Smut öffnet Konserven.', 'warn');
          st.ladung.konserven = Math.max(0, st.ladung.konserven - (bedarf - frisch));
        }
        if (st.ladung.proviant + st.ladung.konserven < n * 3) log(st, 'Der Proviant geht zur Neige.', 'warn');
      }
    }
    if (st.boot.abteile[abteilNachId('uraum')].wasser > 0.5 && st.ladung.proviant > 0) {
      st.ladung.proviant = Math.floor(st.ladung.proviant * 0.97);
      log(st, 'Wasser im Laderaum verdirbt Proviant.', 'warn');
    }
    // Frischware (Brot, Obst, Fleisch) verdirbt mit der Zeit, Konserven halten
    if (h === 0 && st.ladung.proviant > 0) {
      const weg = Math.ceil(st.ladung.proviant * 0.02);
      st.ladung.proviant -= weg;
      if (weg >= 20) log(st, 'Smut: ' + weg + ' Rationen Frischware sind verdorben.', 'info');
    }
    if (h === 8 && hatAusbau(st, 'kaffee')) for (const c of lebende(st)) c.moral = Math.min(100, c.moral + 2);
    if (st.ladung.diesel <= 0 && !unterWasser(st)) log(st, 'Kein Diesel mehr! Nur noch Batteriebetrieb.', 'warn');
    S.speicher.autosaveSchreiben(st);
  }

  function verlieren(st, grund) {
    st.verloren = grund;
    log(st, grund, 'alarm');
    S.speicher.autosaveLoeschen();
    return grund;
  }

  /* ---------------- Haupttakt ---------------- */
  sim.schritt = function (st, dtGesamt) {
    if (st.verloren) return;
    weltBevoelkern(st);
    let rest = dtGesamt;
    while (rest > 0 && !st.verloren) {
      const dt = Math.min(0.5, rest);
      rest -= dt;
      st.zeit += dt;
      const h = uhrzeit(st).stunde;
      crewSchritt(st, dt, h);
      const eff = berechneEffizienz(st);
      const strom = energieSchritt(st, dt, eff);
      const pumpStrom = wasserSchritt(st, dt, strom);
      st.boot.batterie = Math.max(0, st.boot.batterie - pumpStrom / (1 + 0.33 * st.boot.upgrades.batterie));
      reparaturSchritt(st, dt);
      if (tiefenSchritt(st, dt, eff, strom)) break;
      fahrtSchritt(st, dt, eff);
      schiffeSchritt(st, dt, eff);
      torpedoSchritt(st, dt);
      geschuetzSchritt(st, dt);
      nachladenSchritt(st, dt, eff);
      funkSchritt(st, dt, eff);
      missionSchritt(st);
      if (lebende(st).length === 0) { verlieren(st, 'Die gesamte Besatzung ist tot.'); break; }
      while (st.zeit >= st.naechsteStunde) { st.naechsteStunde += 60; stundenSchritt(st); }
    }
  };

  /* ---------------- Befehle ---------------- */
  sim.setzeTiefe = function (st, i) { st.boot.zielTiefe = i; st.boot.zielM = D.TIEFEN[i].m; log(st, 'Befehl: ' + D.TIEFEN[i].name + ' (' + D.TIEFEN[i].m + ' m).', 'info'); };
  /* Alarmtauchen (Kap. 3): Diesel aus, E-Maschinen Große Fahrt, Fluten – Turm schneidet in rund 30 s unter. */
  sim.alarmtauchen = function (st) {
    const b = st.boot;
    if (sim.eff.tauchen <= 0) return 'Niemand an Tiefenruder und Flutventilen!';
    b.alarmtauchen = true;
    b.zielM = Math.max(b.zielM, 40); b.zielTiefe = D.TIEFEN.findIndex((t) => t.m === b.zielM);
    if (b.fahrt < 4) b.fahrt = 4;
    st.alarm = true;
    log(st, 'Alaaarm! Fluten! – Diesel aus, E-Maschinen große Fahrt voraus, Turmluk ist dicht.', 'alarm');
    return null;
  };

  /* Zieltiefe in Metern frei wählen (Zeiger am Tiefenmesser oder Eingabe), bis kurz vor die Zerstörungstiefe */
  sim.setzeZielTiefe = function (st, m, still) {
    const b = st.boot;
    const neu = Math.round(klemme(Number(m) || 0, 0, zerstoerungstiefe(st) - 5));
    b.zielM = neu;
    const i = D.TIEFEN.findIndex((t) => t.m === neu);
    b.zielTiefe = i;
    if (!still) log(st, 'Befehl: Auf ' + neu + ' m gehen.' + (neu > sichereTiefe(st) ? ' Das ist tiefer als sicher!' : ''), neu > sichereTiefe(st) ? 'warn' : 'info');
    return neu;
  };
  sim.setzeFahrt = function (st, i) { st.boot.fahrt = i; };
  sim.anblasen = function (st) {
    const b = st.boot;
    if (b.anblasen > 0) return 'Es wird bereits angeblasen.';
    if (b.druckluft < 40) return 'Zu wenig Druckluft (mind. 40 %).';
    b.druckluft -= 40; b.anblasen = 4; b.zielTiefe = 0; b.zielM = 0;
    log(st, 'Notanblasen! Alle Tauchzellen werden ausgeblasen.', 'warn');
    return null;
  };
  sim.schott = function (st, i, zu) {
    st.boot.schotten[i] = zu;
    log(st, 'Schott zwischen ' + D.ABTEILE[i].name + ' und ' + D.ABTEILE[i + 1].name + (zu ? ' geschlossen.' : ' geöffnet.'), 'info');
  };
  sim.abschotten = function (st, i, zu) {
    if (i > 0) st.boot.schotten[i - 1] = zu;
    if (i < st.boot.schotten.length) st.boot.schotten[i] = zu;
    log(st, D.ABTEILE[i].name + (zu ? ' abgeschottet.' : ' wieder geöffnet.'), zu ? 'warn' : 'info');
  };
  sim.befehl = function (st, c, x) {
    if (c.tot) return;
    c.befehl = Math.round(x);
    if (st.gesteuert === c.id) st.gesteuert = null;
  };

  /* ---------------- Handel ---------------- */
  sim.handelsort = function (st) {
    const b = st.boot;
    if (b.tiefe >= 4) return null;
    for (const h of D.HAEFEN) if (dist(b, h) < 5) return { art: 'hafen', id: h.id, name: h.name, preise: D.PREISE[h.id], basis: h.typ === 'basis' };
    for (const s of st.schiffe) if (s.typ === 'haendler' && !s.versenkt && dist(b, s) < 2) return { art: 'schiff', id: 'haendler', name: 'Händlerschiff', preise: D.PREISE.haendler, basis: false };
    return null;
  };

  function rabatt() { return 1; }
  sim.kaufpreis = function (st, ort, ware) {
    const p = ort.preise[ware];
    return p == null ? null : Math.ceil(p * D.WAREN[ware].paket * rabatt(st));
  };
  sim.verkaufspreis = function (st, ort, ware) {
    const p = ort.preise[ware] != null ? ort.preise[ware] : D.PREISE.basis[ware];
    return Math.floor(p * D.WAREN[ware].paket * D.ANKAUF);
  };
  sim.kaufen = function (st, ort, ware) {
    const preis = sim.kaufpreis(st, ort, ware);
    if (preis == null) return 'Nicht im Angebot.';
    if (st.geld < preis) return 'Nicht genug Geld.';
    const w = D.WAREN[ware];
    if (ware === 'torpedos') {
      // erst Bugraum, dann Heckraum, dann Oberdeckbehälter
      const ziel = ['torpedos', 'torpedosHeck', 'torpedosDeck'].find((l) => st.ladung[l] < kapazitaet(st, l));
      if (!ziel) return 'Kein Platz mehr für Torpedos (Bug, Heck und Oberdeck voll).';
      st.geld -= preis; reserveDazu(st, ziel, st.boot.ladeTyp || 'G7e');
      return null;
    }
    if (platz(st, ware) < w.paket) return 'Dafür ist kein Platz mehr (' + D.STAURAUM[lagerVon(ware)].wo + ').';
    st.geld -= preis; st.ladung[ware] += w.paket;
    return null;
  };
  sim.verkaufen = function (st, ort, ware) {
    const w = D.WAREN[ware];
    if (ware === 'torpedos') {
      const von = ['torpedosDeck', 'torpedos', 'torpedosHeck'].find((l) => st.ladung[l] > 0);
      if (!von) return 'Keine Reserve-Torpedos an Bord.';
      st.geld += sim.verkaufspreis(st, ort, ware); reserveNehmen(st, von, 'G7e');
      return null;
    }
    if (st.ladung[ware] < w.paket) return 'Nicht genug an Bord.';
    st.geld += sim.verkaufspreis(st, ort, ware); st.ladung[ware] -= w.paket;
    return null;
  };
  sim.reparaturKosten = function (st) {
    return Math.ceil(st.boot.abteile.reduce((s, a) => s + (100 - a.rumpf), 0) * 6);
  };
  sim.werft = function (st) {
    const k = sim.reparaturKosten(st);
    if (k <= 0) return 'Der Rumpf ist unbeschädigt.';
    if (st.geld < k) return 'Nicht genug Geld.';
    st.geld -= k;
    st.boot.abteile.forEach((a) => { a.rumpf = 100; a.wasser = 0; });
    log(st, 'Die Werft hat den Rumpf instand gesetzt.', 'gut');
    return null;
  };
  sim.upgrade = function (st, id) {
    const u = D.UPGRADES[id];
    const s = st.boot.upgrades[id];
    if (s >= u.preise.length) return 'Bereits voll ausgebaut.';
    if (st.geld < u.preise[s]) return 'Nicht genug Geld.';
    st.geld -= u.preise[s]; st.boot.upgrades[id]++;
    log(st, u.name + ' auf Stufe ' + st.boot.upgrades[id] + ' ausgebaut.', 'gut');
    return null;
  };
  /* Inventar: Gegenstand benutzen oder über Bord werfen */
  sim.benutzen = function (st, ware) {
    const b = st.boot;
    if (!(st.ladung[ware] > 0)) return 'Nichts davon an Bord.';
    if (ware === 'batteriezelle') {
      if (b.batterie >= 100) return 'Die Batterie ist schon voll.';
      st.ladung.batteriezelle--; b.batterie = Math.min(100, b.batterie + 30);
      log(st, 'Reservezelle eingesetzt: Batterie ' + Math.round(b.batterie) + ' %.', 'gut');
      return null;
    }
    if (ware === 'druckflasche') {
      if (b.druckluft >= 100) return 'Die Druckluft ist schon voll.';
      st.ladung.druckflasche--; b.druckluft = Math.min(100, b.druckluft + 25);
      log(st, 'Druckluftflasche angeschlossen: Druckluft ' + Math.round(b.druckluft) + ' %.', 'gut');
      return null;
    }
    if (ware === 'torpedosDeck') {
      if (b.deckUebernahme) return 'Die Übernahme läuft schon.';
      if (b.tiefe > 0.5) return 'Nur aufgetaucht möglich.';
      if (b.fahrt > 2) return 'Erst auf Langsame Fahrt oder Stopp gehen.';
      if (st.ladung.torpedos >= kapazitaet(st, 'torpedos') && st.ladung.torpedosHeck >= 1) return 'Im Boot ist kein Platz für einen weiteren Torpedo.';
      b.deckUebernahme = { rest: 120, pause: false };
      log(st, 'Die Seeleute öffnen den Oberdeckbehälter und holen einen Torpedo ins Boot (2 Stunden).', 'info');
      return null;
    }
    return 'Dieser Gegenstand wird automatisch benutzt.';
  };
  sim.abwerfen = function (st, ware) {
    const w = D.WAREN[ware] || { paket: 1, einheit: 'Stk', name: D.INVENTAR[ware].name };
    const menge = Math.min(st.ladung[ware] || 0, w.paket);
    if (menge <= 0) return 'Nichts davon an Bord.';
    if (/^torpedos/.test(ware)) reserveNehmen(st, ware, 'G7e'); else st.ladung[ware] -= menge;
    log(st, menge + ' ' + w.einheit + ' ' + w.name + ' über Bord geworfen.', 'info');
    return null;
  };

  /* Skilltree: Knoten suchen, Status und Kauf (nur am Marinehauptstützpunkt) */
  function knoten(id) {
    for (const ast of D.SKILLTREE) {
      const i = ast.knoten.findIndex((k) => k.id === id);
      if (i >= 0) return { ast, i, k: ast.knoten[i] };
    }
    return null;
  }
  sim.ausbauStatus = function (st, id) {
    const n = knoten(id);
    if (!n) return null;
    const hat = hatAusbau(st, id);
    const frei = n.i === 0 || hatAusbau(st, n.ast.knoten[n.i - 1].id);
    return { hat, frei, knoten: n.k, ast: n.ast };
  };
  sim.ausbauen = function (st, id) {
    const z = sim.ausbauStatus(st, id);
    if (!z) return 'Unbekannter Ausbau.';
    const ort = sim.handelsort(st);
    if (!ort || !ort.basis) return 'Ausbauen geht nur in der Werft am Marinehauptstützpunkt.';
    if (z.hat) return 'Bereits eingebaut.';
    if (!z.frei) return 'Erst die Stufe davor ausbauen.';
    if (st.geld < z.knoten.preis) return 'Nicht genug Geld.';
    st.geld -= z.knoten.preis;
    if (z.knoten.upgrade) st.boot.upgrades[z.knoten.upgrade[0]] = z.knoten.upgrade[1];
    else st.boot.ausbau[id] = true;
    log(st, 'Werft: ' + z.knoten.name + ' eingebaut.', 'gut');
    return null;
  };

  sim.anheuern = function (st, totId) {
    const alt = crewNachId(st, totId);
    if (!alt || !alt.tot) return 'Nicht möglich.';
    if (st.geld < 500) return 'Nicht genug Geld.';
    st.geld -= 500;
    const benutzt = new Set(st.crew.map((c) => c.name));
    const neu = Z.neuesCrewmitglied(st.naechsteId++, alt.rolle, alt.schicht, benutzt, alt.posten);
    neu.xp = 0;
    st.crew[st.crew.indexOf(alt)] = neu;
    log(st, neu.name + ' als neuer ' + D.ROLLEN[neu.rolle].name + ' angeheuert.', 'gut');
    return null;
  };
  sim.auftanken = function (st) { st.boot.druckluft = 100; st.boot.batterie = Math.max(st.boot.batterie, 100); };

  Object.assign(sim, {
    abteilIndex, abteilNachId, uhrzeit, log, planquadrat, quadratTeile, landAbstand, imLand, flutung, minRumpf, sichereTiefe,
    hatAusbau, maxSicher, konstruktionstiefe, sprungschicht, reserveNehmen, zerstoerungstiefe, horchweite, wassertiefe, grundTiefe, KIEL_M,
    lagerVon, kapazitaet, bestand, platz, torpedosGesamt, lebende, crewNachId, crewFaktor, unterWasser, antenneFrei, dist, berechneEffizienz, verlieren,
  });
  S.sim = sim;
})(window.Spiel = window.Spiel || {});
