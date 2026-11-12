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

  function planquadrat(p) {
    const sp = 'ABCDEFGHIJ'[klemme(Math.floor(p.x / D.WELT.PLAN), 0, 9)];
    return sp + (klemme(Math.floor(p.y / D.WELT.PLAN), 0, 6) + 1);
  }

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
  function maxSicher(st) { return D.MAX_SICHER + (hatAusbau(st, 'tieftauchen') ? 20 : 0); }
  function zerstoerungstiefe(st) { return D.ZERSTOERUNGSTIEFE + (hatAusbau(st, 'tieftauchen') ? 20 : 0); }
  function horchweite(st, eff) {
    if (eff.sonar <= 0) return 0;
    return (unterWasser(st) ? 18 : 6) * Math.min(1, eff.sonar) * (hatAusbau(st, 'horchweite') ? 1.25 : 1);
  }

  function sichereTiefe(st) {
    return maxSicher(st) * (0.45 + 0.55 * minRumpf(st) / 100);
  }

  function ladeEinheiten(l) {
    let s = 0;
    for (const k of Object.keys(D.WAREN)) s += (l[k] || 0) * D.WAREN[k].le;
    return s;
  }

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

  function postenX(st, c) {
    if (c.posten === 'leckabwehr') {
      const i = schadensZiel(st);
      return i >= 0 ? mitte(i) + ((c.id * 7) % 16) - 8 : 300 + (c.id % 3) * 4;
    }
    return D.POSTEN[c.posten].x;
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
      if (a.wasser < 0.35 && erreichbar(st, c.x, mitte(i))) {
        const d = Math.abs(mitte(i) - c.x);
        if (d < bd) { bd = d; best = mitte(i); }
      }
    });
    return best;
  }

  /* ---------- Notfall-KI: Lecks reparieren, Torpedos nachladen, volllaufende Abteile abschotten ---------- */
  function notfallPlanung(st) {
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
      const trupp = [];
      // zuerst alle, die fest auf Leckabwehr eingeteilt sind (bei schweren Schäden auch aus der Koje)
      for (const c of st.crew) {
        if (c.posten !== 'leckabwehr' || c.tot || c.befehl != null || st.gesteuert === c.id) continue;
        if (c.taetigkeit === 'schlaf' && !schwer) continue;
        trupp.push(c);
      }
      // dann Helfer: zuerst wer Freizeit hat, bei schweren Schäden auch Schlafende; Brandmeister und Vertäuer bevorzugt
      const kandidaten = st.crew.filter((c) => !trupp.includes(c) && frei(c, schwer))
        .sort((a, c) => ((a.rolle === 'brand' || a.rolle === 'vertau' ? 0 : 1) - (c.rolle === 'brand' || c.rolle === 'vertau' ? 0 : 1)) ||
          ((a.taetigkeit === 'schlaf') - (c.taetigkeit === 'schlaf')) || Math.abs(a.x - mitte(schaeden[0].i)) - Math.abs(c.x - mitte(schaeden[0].i)));
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

    // 2. Torpedos nachladen, wenn ein Rohr leer ist und Reserve da ist
    if (b.rohre.includes(false) && st.ladung.torpedos > 0) {
      const lader = st.crew.some((c) => !c.tot && c.taetigkeit !== 'schlaf' && (c.posten === 'bugraum' || c.befehl != null) && abteilIndex(c.x) === abteilNachId('bug'));
      if (!lader) {
        const zx = D.POSTEN.bugraum.x;
        const k = st.crew.filter((c) => !c.notfall && frei(c, false) && erreichbar(st, c.x, zx))
          .sort((a, c) => Math.abs(a.x - zx) - Math.abs(c.x - zx))[0];
        if (k) {
          k.notfall = { x: zx, art: 'nachladen' };
          if (!b.ladeauftrag) { b.ladeauftrag = true; log(st, k.name.split(' ')[0] + ' geht in den Bugraum und lädt nach.', 'info'); }
        }
      }
    } else b.ladeauftrag = false;

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

  function crewZiel(st, c, h) {
    if (c.befehl != null) return { x: c.befehl, art: 'befehl' };
    const p = st.schichten[c.schicht][h];
    let z;
    if (c.notfall) z = c.notfall;
    else if (st.alarm || p === 'D') z = { x: postenX(st, c), art: 'dienst' };
    else if (p === 'S') z = { x: D.KOJEN[c.koje].x, art: 'schlaf' };
    else z = { x: c.messeX, art: 'frei' };
    // Selbstschutz: nicht in geflutete Abteile, aus vollaufenden Abteilen fliehen.
    const hier = st.boot.abteile[abteilIndex(c.x)];
    const dort = st.boot.abteile[abteilIndex(z.x)];
    if (hier.wasser > 0.55 || dort.wasser > 0.6) {
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
    notfallPlanung(st);
    for (const c of st.crew) {
      if (c.tot) continue;
      const i = abteilIndex(c.x);
      const ab = st.boot.abteile[i];
      if (st.gesteuert !== c.id) {
        const z = crewZiel(st, c, h);
        const angekommen = bewege(st, c, z.x, 26 * (0.7 + 0.3 * c.moral / 100) * dt);
        c.taetigkeit = z.art === 'schlaf' ? (angekommen ? 'schlaf' : 'zurKoje') : z.art;
        c.aktPosten = angekommen && c.taetigkeit !== 'schlaf' && c.taetigkeit !== 'frei' && c.taetigkeit !== 'reparatur' ? naechsterPosten(c) : null;
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
      if (!lebtRolle(st, 'smutje')) dm -= 0.4;
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
    const liZentrale = st.crew.some((c) => !c.tot && c.rolle === 'li' && c.taetigkeit !== 'schlaf' && abteilIndex(c.x) === 4);
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
      let rate = 0.8 * crewFaktor(c) * (c.rolle === 'brand' ? 1.5 : c.rolle === 'vertau' ? 1.2 : 1);
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
    const ziel = D.TIEFEN[b.zielTiefe].m;
    let rate = 0;
    if (eff.tauchen > 0) {
      const max = 5 * eff.tauchen;
      rate = klemme((ziel - b.tiefe) / Math.max(dt, 0.001), -max, max);
    }
    const fl = flutung(st);
    let sinken = fl > 0.12 ? (fl - 0.12) * 45 : 0;
    if (b.anblasen > 0) { rate = -14; sinken *= 0.3; b.anblasen = Math.max(0, b.anblasen - dt); }
    const vorher = b.tiefe;
    b.tiefe = Math.max(0, b.tiefe + (rate + sinken) * dt);
    if (b.tiefe === 0 && !unterWasser(st)) b.druckluft = Math.min(100, b.druckluft + 1.5 * dt);
    if (vorher <= 4 && b.tiefe > 4) log(st, 'Boot ist getaucht.', 'info');
    if (vorher > 4 && b.tiefe <= 4) log(st, 'Boot ist aufgetaucht.', 'info');

    // Druck
    const sicher = sichereTiefe(st);
    if (b.tiefe > sicher) {
      const x = (b.tiefe - sicher) / Math.max(1, zerstoerungstiefe(st) - sicher);
      b.abteile.forEach((a) => { a.rumpf = Math.max(0, a.rumpf - 0.6 * x * dt); });
      if (!sim._druckWarnung) { log(st, 'Der Rumpf ächzt unter dem Druck! Sofort höher gehen!', 'alarm'); sim._druckWarnung = true; }
      if (Math.random() < 0.25 * x * x * x * dt) return verlieren(st, 'Der Rumpf hat dem Druck nicht standgehalten. Das Boot ist in ' + Math.round(b.tiefe) + ' m implodiert.');
    } else sim._druckWarnung = false;
    if (b.tiefe >= zerstoerungstiefe(st)) return verlieren(st, 'Das Boot hat die Zerstörungstiefe erreicht und ist implodiert.');
    if (fl >= 0.7) return verlieren(st, 'Das Boot ist vollgelaufen und gesunken.');
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
        b.batterie = Math.min(100, b.batterie + 0.15 * dt);
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
    if (b.wegpunkt) {
      const soll = Math.atan2(b.wegpunkt.y - b.y, b.wegpunkt.x - b.x);
      let d = soll - b.kurs;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      const max = (6 * Math.PI / 180) * eff.ruder * dt * (sim.knoten > 0 ? 1 : 0.2);
      b.kurs += klemme(d, -max, max);
      if (dist(b, b.wegpunkt) < 0.6) { b.wegpunkt = null; b.fahrt = 0; log(st, 'Wegpunkt erreicht. Maschinen gestoppt.', 'info'); }
    }
    const km = sim.knoten * 1.852 / 60 * dt;
    if (km > 0) {
      const nx = b.x + Math.cos(b.kurs) * km, ny = b.y + Math.sin(b.kurs) * km;
      if (imLand(nx, ny)) {
        b.fahrt = 0; b.wegpunkt = null;
        b.abteile[6].rumpf = Math.max(0, b.abteile[6].rumpf - 10);
        log(st, 'Das Boot ist auf Grund gelaufen! Bugraum beschädigt.', 'alarm');
      } else { b.x = nx; b.y = ny; }
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

  function schiffeSchritt(st, dt, eff) {
    const b = st.boot;
    const uw = unterWasser(st);
    const sicht = !uw ? 14 : (antenneFrei(st) && eff.sehrohr > 0 ? 9 * Math.min(1, eff.sehrohr) : 0);
    const sonar = horchweite(st, eff);

    for (const s of st.schiffe) {
      if (s.versenkt) continue;
      const t = D.SCHIFFSTYPEN[s.typ];
      const d = dist(s, b);

      // KI des Zerstörers
      if (s.typ === 'zerstoerer') {
        const siehtBoot = (b.tiefe < 4 && d < 12) || (b.tiefe <= 15 && d < 2.5 && Math.random() < 0.3 * dt);
        if (siehtBoot) {
          if (!s.alarmiert) log(st, 'Ein Zerstörer hat uns entdeckt!', 'alarm');
          s.alarmiert = true; s.letzteSicht = { x: b.x, y: b.y }; s.suche = 30;
        } else if (s.alarmiert) {
          s.suche -= dt;
          if (s.suche <= 0) { s.alarmiert = false; s.ziel = zufallsPunkt(170, 250, 30, 180, s); log(st, 'Der Zerstörer hat die Suche abgebrochen.', 'gut'); }
        }
        if (s.alarmiert && s.letzteSicht) s.ziel = s.letzteSicht;
        s.kn = s.alarmiert ? t.jagdKn : t.kn;
        s.nachladen = Math.max(0, s.nachladen - dt);
        if (s.alarmiert && b.tiefe < 4 && d < 6 && s.nachladen <= 0) {
          s.nachladen = 2;
          if (Math.random() < 0.35) trefferAufBoot(st, 12 + Math.random() * 13);
          else log(st, 'Granateinschlag neben dem Boot.', 'warn');
        }
      }

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
      else if (d < sonar) {
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
      const km = 40 * 1.852 / 60 * dt;
      t.laufzeit += dt;
      if (d <= km || t.laufzeit > 12) {
        t.weg = true;
        if (d <= km && Math.random() < t.chance) {
          s.hp--;
          if (s.typ === 'zerstoerer') { s.alarmiert = true; s.letzteSicht = { x: st.boot.x, y: st.boot.y }; s.suche = 40; }
          if (s.hp <= 0) schiffVersenkt(st, s);
          else log(st, 'Torpedotreffer auf ' + D.SCHIFFSTYPEN[s.typ].name + '! Er ist schwer beschädigt.', 'gut');
        } else log(st, 'Torpedo hat das Ziel verfehlt.', 'warn');
      } else {
        t.x += (s.x - t.x) / d * km; t.y += (s.y - t.y) / d * km;
      }
    }
    st.torpedos = st.torpedos.filter((t) => !t.weg);
  }

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

  sim.feuern = function (st) {
    const b = st.boot;
    const s = st.schiffe.find((x) => x.id === st.ziel && !x.versenkt);
    if (!s) return 'Kein Ziel ausgewählt. Klicke auf der Karte auf einen Kontakt.';
    if (!D.SCHIFFSTYPEN[s.typ].feind) return 'Feuer auf neutrale Schiffe ist verboten.';
    if (s.entdeckt === 'nein') return 'Ziel ist nicht erfasst.';
    if (!bekannt(s)) return 'Ziel ist nicht klassifiziert. Erst im Horchraum das Schraubengeräusch abgleichen.';
    if (b.tiefe > 15) return 'Zum Schießen auf Sehrohrtiefe oder an die Oberfläche gehen.';
    if (sim.eff.torpedo <= 0) return 'Niemand am Torpedo-Vorhalterechner.';
    const rohr = b.rohre.indexOf(true);
    if (rohr < 0) return 'Alle Rohre leer. Jemand muss im Bugraum nachladen.';
    const d = dist(s, b);
    if (d > 7) return 'Ziel zu weit entfernt (max. 7 km).';
    b.rohre[rohr] = false;
    const chance = Math.min(0.98, klemme(0.95 - d / 10 - (s.kn > 15 ? 0.15 : 0), 0.1, 0.95) * (0.6 + 0.4 * Math.min(1, sim.eff.torpedo)) * (hatAusbau(st, 'vorhalter') ? 1.15 : 1));
    st.torpedos.push({ x: b.x, y: b.y, ziel: s.id, chance, laufzeit: 0 });
    log(st, 'Rohr ' + (rohr + 1) + ' – los! Torpedo läuft.', 'info');
    for (const c of st.crew) if (!c.tot && c.aktPosten === 'torpedo') c.xp += 3;
    return null;
  };

  function nachladenSchritt(st, dt, eff) {
    const b = st.boot;
    if (eff.nachladen <= 0 || st.ladung.torpedos <= 0 || !b.rohre.includes(false)) return;
    b.ladeFortschritt += eff.nachladen * dt / (hatAusbau(st, 'schnellladen') ? 14 : 20);
    if (b.ladeFortschritt >= 1) {
      b.ladeFortschritt = 0;
      b.rohre[b.rohre.indexOf(false)] = true;
      st.ladung.torpedos--;
      log(st, 'Torpedorohr nachgeladen.', 'info');
    }
  }

  /* ---------------- Funk und Aufträge ---------------- */
  function neueMission(st) {
    const id = st.naechsteId++;
    if (Math.random() < 0.55) {
      const fr = neuesSchiff(st, 'frachter', { mission: id });
      return { id, typ: 'versenken', status: 'aktiv', schiff: fr.id, belohnung: 1500 + Math.round(Math.random() * 10) * 100,
        titel: 'Frachter versenken',
        text: 'Feindlicher Frachter in Planquadrat ' + planquadrat(fr) + ' gemeldet, Kurs auf die Küste von ' + D.FEIND_NAME + ' (' + planquadrat(fr.ziel) + '). Abfangen und versenken.' };
    }
    const p = zufallsPunkt(150, 255, 25, 185);
    return { id, typ: 'patrouille', status: 'aktiv', ziel: p, belohnung: 600 + Math.round(Math.random() * 6) * 50,
      titel: 'Patrouille', text: 'Patrouillieren Sie Planquadrat ' + planquadrat(p) + ' und melden Sie Feindbewegungen.' };
  }


  sim.anfunken = function (st) {
    if (st.funk.anfrage) return 'Es läuft bereits ein Funkspruch.';
    if (!antenneFrei(st)) return 'Funk nur an der Oberfläche oder auf Sehrohrtiefe möglich.';
    if (sim.eff.funk <= 0) return 'Niemand sitzt am Funkgerät.';
    if (st.missionen.filter((m) => m.status === 'aktiv').length >= 3) return 'Stützpunkt: Erst laufende Aufträge erledigen.';
    st.funk.anfrage = { rest: 8 };
    log(st, 'Funkspruch an den Marinehauptstützpunkt abgesetzt.', 'info');
    return null;
  };

  function funkSchritt(st, dt, eff) {
    const f = st.funk;
    if (f.anfrage && antenneFrei(st) && eff.funk > 0) {
      f.anfrage.rest -= dt * eff.funk;
      if (f.anfrage.rest <= 0) {
        f.anfrage = null;
        const m = neueMission(st);
        f.nachrichten.unshift({ id: st.naechsteId++, zeit: st.zeit, mission: m, fortschritt: 0, fertig: false });
        funkFelder(st, f.nachrichten[0]);
        if (f.nachrichten.length > 8) f.nachrichten.length = 8;
        log(st, 'Verschlüsselter Funkspruch vom Stützpunkt empfangen. Am Funkgerät entschlüsseln.', 'info');
      }
    }
    for (const n of f.nachrichten) {
      funkFelder(st, n);
      // Ohne Minispiel: der Funker entschlüsselt selbst, aber dreimal langsamer.
      if (n.fertig || !n.auto || eff.funk <= 0) continue;
      n.fortschritt = Math.min(1, n.fortschritt + eff.funk * dt / 45);
      if (n.fortschritt >= 1) nachrichtFertig(st, n);
    }
  }

  function nachrichtFertig(st, n) {
    if (n.fertig) return;
    n.fertig = true; n.fortschritt = 1;
    st.missionen.push(n.mission);
    for (const c of st.crew) if (!c.tot && c.aktPosten === 'funk') c.xp += 2;
    log(st, 'Neuer Auftrag: ' + n.mission.titel + '. ' + n.mission.text, 'gut');
  }

  /* Funk-Minispiel: Frequenz und Klartext des Spruchs (auch für ältere Spielstände nachgetragen). */
  function funkFelder(st, n) {
    if (n.spruch) return;
    const m = n.mission;
    const fr = m.typ === 'versenken' ? st.schiffe.find((x) => x.id === m.schiff) : null;
    n.spruch = m.typ === 'versenken' ? 'FRACHTER ' + (fr ? planquadrat(fr) : 'X') : 'PATROUILLE ' + planquadrat(m.ziel);
    const F = D.FUNK;
    n.freq = F.basisVon + 10 * Math.round(Math.random() * (F.basisBis - F.basisVon) / 10);
    do { n.f = F.min + 10 * Math.round(Math.random() * (F.max - F.min) / 10); } while (Math.abs(n.f - n.freq) < 400);
    n.eingabe = '';
  }

  sim.funkSignal = function (n) {
    const d = Math.abs(n.f - n.freq);
    return d === 0 ? 'klar' : d <= D.FUNK.schwach ? 'schwach' : 'rauschen';
  };
  sim.funkNachricht = function (st, id) { return st.funk.nachrichten.find((n) => n.id === id) || null; };
  sim.funkStellen = function (st, id, delta) {
    const n = sim.funkNachricht(st, id);
    if (!n || n.fertig) return null;
    if (sim.eff.funk <= 0) return 'Niemand sitzt am Funkgerät.';
    n.f = klemme(n.f + delta, D.FUNK.min, D.FUNK.max);
    return null;
  };
  sim.funkTaste = function (st, id, z) {
    const n = sim.funkNachricht(st, id);
    if (!n || n.fertig) return;
    const klar = n.spruch.replace(/ /g, '');
    if (z === null) { n.eingabe = n.eingabe.slice(0, -1); return; }
    if (n.eingabe.length >= klar.length) return;
    n.eingabe += z;
    if (n.eingabe === klar) nachrichtFertig(st, n);
  };
  sim.funkAuto = function (st, id) {
    const n = sim.funkNachricht(st, id);
    if (n && !n.fertig) { n.auto = true; log(st, 'Der Funker entschlüsselt den Spruch selbst. Das dauert.', 'info'); }
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
          if (st.ladung.konserven > 0 && st.ladung.proviant <= 0 && frisch === 0) log(st, 'Frischer Proviant ist alle – der Smutje öffnet Konserven.', 'warn');
          st.ladung.konserven = Math.max(0, st.ladung.konserven - (bedarf - frisch));
        }
        if (st.ladung.proviant + st.ladung.konserven < n * 3) log(st, 'Der Proviant geht zur Neige.', 'warn');
      }
    }
    if (st.boot.abteile[2].wasser > 0.5 && st.ladung.proviant > 0) {
      st.ladung.proviant = Math.floor(st.ladung.proviant * 0.97);
      log(st, 'Wasser im Laderaum verdirbt Proviant.', 'warn');
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
      nachladenSchritt(st, dt, eff);
      funkSchritt(st, dt, eff);
      missionSchritt(st);
      if (lebende(st).length === 0) { verlieren(st, 'Die gesamte Besatzung ist tot.'); break; }
      while (st.zeit >= st.naechsteStunde) { st.naechsteStunde += 60; stundenSchritt(st); }
    }
  };

  /* ---------------- Befehle ---------------- */
  sim.setzeTiefe = function (st, i) { st.boot.zielTiefe = i; log(st, 'Befehl: ' + D.TIEFEN[i].name + ' (' + D.TIEFEN[i].m + ' m).', 'info'); };
  sim.setzeFahrt = function (st, i) { st.boot.fahrt = i; };
  sim.anblasen = function (st) {
    const b = st.boot;
    if (b.anblasen > 0) return 'Es wird bereits angeblasen.';
    if (b.druckluft < 40) return 'Zu wenig Druckluft (mind. 40 %).';
    b.druckluft -= 40; b.anblasen = 4; b.zielTiefe = 0;
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

  function rabatt(st) { return lebtRolle(st, 'logistik') ? 0.9 : 1; }
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
    if (ladeEinheiten(st.ladung) + w.paket * w.le > D.LADERAUM_LE + 1e-9) return 'Der Laderaum ist voll.';
    st.geld -= preis; st.ladung[ware] += w.paket;
    return null;
  };
  sim.verkaufen = function (st, ort, ware) {
    const w = D.WAREN[ware];
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
    return 'Dieser Gegenstand wird automatisch benutzt.';
  };
  sim.abwerfen = function (st, ware) {
    const w = D.WAREN[ware];
    const menge = Math.min(st.ladung[ware] || 0, w.paket);
    if (menge <= 0) return 'Nichts davon an Bord.';
    st.ladung[ware] -= menge;
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
    if (id === 'rohr5') st.boot.rohre.push(false);
    log(st, 'Werft: ' + z.knoten.name + ' eingebaut.', 'gut');
    return null;
  };

  sim.anheuern = function (st, totId) {
    const alt = crewNachId(st, totId);
    if (!alt || !alt.tot) return 'Nicht möglich.';
    if (st.geld < 500) return 'Nicht genug Geld.';
    st.geld -= 500;
    const benutzt = new Set(st.crew.map((c) => c.name));
    const neu = Z.neuesCrewmitglied(st.naechsteId++, alt.rolle, alt.koje, benutzt);
    neu.xp = 0;
    st.crew[st.crew.indexOf(alt)] = neu;
    log(st, neu.name + ' als neuer ' + D.ROLLEN[neu.rolle].name + ' angeheuert.', 'gut');
    return null;
  };
  sim.auftanken = function (st) { st.boot.druckluft = 100; st.boot.batterie = Math.max(st.boot.batterie, 100); };

  Object.assign(sim, {
    abteilIndex, abteilNachId, uhrzeit, log, planquadrat, imLand, flutung, minRumpf, sichereTiefe,
    hatAusbau, maxSicher, zerstoerungstiefe, horchweite,
    ladeEinheiten, lebende, crewNachId, crewFaktor, unterWasser, antenneFrei, dist, berechneEffizienz, verlieren,
  });
  S.sim = sim;
})(window.Spiel = window.Spiel || {});
