/* Sehrohrtiefe – Seitenleisten, Fenster und Texte. */
(function (S) {
  'use strict';
  const D = S.daten;
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const geld = (n) => Math.round(n).toLocaleString('de-DE') + ' Kr';
  const pz = (v) => Math.round(v) + ' %';
  /* Symbol aus grafik/hud_symbole.png (16 × 16): geld, moral, proviant, diesel, batterie, druckluft, rumpf, torpedo, funk, schlaf */
  const SYM = ['geld', 'moral', 'proviant', 'diesel', 'batterie', 'druckluft', 'rumpf', 'torpedo', 'funk', 'schlaf'];
  const sym = (n) => '<i class="sym" style="background-position:-' + SYM.indexOf(n) * 16 + 'px 0"></i>';
  /* Gegenstand aus grafik/inventar_items.png (Torpedo 48 × 24, sonst 24 × 24) */
  const item = (id) => D.INVENTAR[id] ? '<i class="item" style="width:' + D.INVENTAR[id].bild[1] + 'px;background-position:-' + D.INVENTAR[id].bild[0] + 'px 0"></i>' : '';


  /* Nur neu schreiben, wenn sich etwas geändert hat – sonst gehen Klicks verloren. */
  function setze(el, html) { if (el._html !== html) { el._html = html; el.innerHTML = html; } }

  function balken(wert, klasse) {
    return '<div class="balken ' + (klasse || '') + '"><i style="width:' + Math.max(0, Math.min(100, wert)) + '%"></i></div>';
  }

  const TAETIGKEIT = {
    dienst: 'im Dienst', schlaf: 'schläft', zurKoje: 'geht zur Koje', frei: 'Freizeit', befehl: 'Befehl',
    flucht: 'flieht vor Wasser', gesteuert: 'gesteuert', tot: 'tot', reparatur: 'repariert', nachladen: 'lädt Torpedos nach',
  };

  function taetigkeitText(st, c) {
    if (c.tot) return 'tot';
    let t = TAETIGKEIT[c.taetigkeit] || c.taetigkeit;
    if (c.aktPosten && c.taetigkeit !== 'schlaf') t += ' · ' + D.POSTEN[c.aktPosten].name;
    return t;
  }

  function moralKlasse(m) { return m < 30 ? 'rot' : m < 55 ? 'gelb' : ''; }

  /* ------------ linke Spalte ------------ */
  function status(st) {
    const b = st.boot;
    const leb = S.sim.lebende(st);
    const moral = leb.length ? leb.reduce((s, c) => s + c.moral, 0) / leb.length : 0;
    const tage = leb.length ? (st.ladung.proviant + st.ladung.konserven) / (leb.length * st.ration) : 0;
    const le = S.sim.ladeEinheiten(st.ladung);
    const fl = S.sim.flutung(st);
    let h = '';
    h += '<div class="zeile"><span>' + sym('geld') + 'Geld</span><b>' + geld(st.geld) + '</b></div>';
    h += '<div class="zeile"><span>' + sym('moral') + 'Moral (Schnitt)</span><b>' + pz(moral) + '</b></div>' + balken(moral, moralKlasse(moral));
    h += '<div class="zeile"><span>' + sym('proviant') + 'Proviant</span><b>' + (st.ladung.proviant + st.ladung.konserven) + ' Rat. (' + tage.toFixed(1) + ' Tage)</b></div>';
    h += '<div class="zeile"><span>' + sym('diesel') + 'Diesel</span><b>' + Math.round(st.ladung.diesel).toLocaleString('de-DE') + ' L</b></div>';
    h += '<div class="zeile"><span>' + sym('batterie') + 'Batterie</span><b>' + pz(b.batterie) + '</b></div>' + balken(b.batterie, b.batterie < 20 ? 'rot' : 'blau');
    h += '<div class="zeile"><span>' + sym('druckluft') + 'Druckluft</span><b>' + pz(b.druckluft) + '</b></div>' + balken(b.druckluft, 'blau');
    h += '<div class="zeile"><span>' + sym('rumpf') + 'Ersatzteile</span><b>' + st.ladung.ersatzteile + '</b></div>';
    h += '<div class="zeile"><span>Laderaum</span><button data-aktion="inventar" title="Inventar öffnen (I)">' + Math.round(le) + ' / ' + D.LADERAUM_LE + ' LE</button></div>';
    if (fl > 0.005) h += '<div class="zeile warnung"><span>Wasser im Boot</span><b>' + pz(fl * 100) + '</b></div>' + balken(fl / 0.7 * 100, 'rot');
    setze($('status'), h);

    const eff = S.sim.eff;
    const chips = ['tauchen', 'ruder', 'antrieb', 'sehrohr', 'sonar', 'funk', 'torpedo', 'nachladen', 'kombuese', 'reparatur']
      .map((k) => {
        const v = eff[k] || 0;
        return '<span class="chip ' + (v >= 0.75 ? 'an' : v > 0 ? 'halb' : '') + '" title="' + D.SYSTEME[k] + ': ' + Math.round(v * 100) + ' %">' + D.SYSTEME[k] + '</span>';
      }).join('');
    setze($('systeme'), chips);

    const r = $('ration');
    if (document.activeElement !== r) r.value = st.ration;
    $('rationWert').textContent = st.ration;
    const txt = { 1: 'Hungerration – Moral sinkt stark', 2: 'Knapp – Moral sinkt langsam', 3: 'Normal – Moral steigt leicht', 4: 'Reichlich – Moral steigt, Vorrat schmilzt' };
    setze($('rationInfo'), txt[st.ration] + '. Verbrauch: ' + Math.ceil(leb.length * st.ration) + ' Rationen/Tag.');
  }

  function crewListe(st, auswahl) {
    const h = st.crew.map((c) => {
      const r = D.ROLLEN[c.rolle];
      return '<div class="crew' + (c.tot ? ' tot' : '') + (auswahl.crew === c.id ? ' gewaehlt' : '') + '" data-aktion="crew" data-arg="' + c.id + '">' +
        '<span class="punkt" style="background:' + r.farbe + '"></span>' +
        '<span class="info">' + esc(c.name) + ' <small>' + r.kurz + ' · ' + esc(taetigkeitText(st, c)) + '</small></span>' +
        '<span class="moral ' + (c.moral < 30 ? 'warnung' : '') + '">' + (c.tot ? '✝' : Math.round(c.moral / 5) * 5) + '</span></div>';
    }).join('');
    setze($('crewListe'), h);
  }

  /* ------------ rechte Spalte ------------ */
  function tiefe(st) {
    const b = st.boot;
    const sicher = S.sim.sichereTiefe(st);
    const ziel = D.TIEFEN[b.zielTiefe];
    const zt = S.sim.zerstoerungstiefe(st);
    const pos = (m) => Math.min(100, m / zt * 100);
    let h = '<div class="zeile"><span>Tiefe</span><b style="font-size:24px">' + Math.round(b.tiefe) + ' m</b></div>';
    h += '<div class="tiefenskala" title="Grün: Zieltiefe · Orange: sichere Tiefe bei aktuellem Rumpfzustand · Rot: Zerstörungstiefe ' + zt + ' m">' +
      '<span class="ziel" style="left:' + pos(ziel.m) + '%"></span><span class="sicher" style="left:' + pos(sicher) + '%"></span>' +
      '<span class="marke" style="left:' + pos(b.tiefe) + '%"></span></div>';
    h += '<div class="klein">Ziel: ' + ziel.name + ' (' + ziel.m + ' m) · sicher bis ' + Math.round(sicher) + ' m</div>';
    if (b.tiefe > sicher) h += '<div class="warnung">⚠ Zu tief für den Rumpfzustand – Implosionsgefahr!</div>';
    if (S.sim.eff.tauchen <= 0) h += '<div class="warnung">Niemand an Tiefenruder oder Tauchzellen.</div>';
    if (S.sim.flutung(st) > 0.12) h += '<div class="warnung">Boot ist zu schwer und sinkt! Lenzen oder anblasen.</div>';
    setze($('tiefe'), h);
    const k = D.TIEFEN.map((t, i) => '<button data-aktion="tiefe" data-arg="' + i + '" class="' + (b.zielTiefe === i ? 'aktiv' : '') + '">' + t.name + '</button>').join('');
    setze($('tiefenKnoepfe'), k);
    const an = document.querySelector('[data-aktion="anblasen"]');
    an.textContent = b.anblasen > 0 ? 'Blase an …' : 'Notanblasen (Druckluft ' + Math.round(b.druckluft) + ' %)';
    an.classList.toggle('aktiv', b.anblasen > 0);
  }

  function fahrt(st) {
    const b = st.boot;
    const k = D.FAHRT.map((f, i) => '<button data-aktion="fahrt" data-arg="' + i + '" class="' + (b.fahrt === i ? 'aktiv' : '') + '">' + f.name + '</button>').join('');
    setze($('fahrtKnoepfe'), k);
    const grad = Math.round(((b.kurs * 180 / Math.PI) + 90 + 360) % 360);
    const uw = S.sim.unterWasser(st);
    let h = '<div class="zeile"><span>' + (uw ? 'E-Maschine' : 'Diesel') + '</span><b>' + (S.sim.knoten || 0).toFixed(1) + ' kn · ' + String(grad).padStart(3, '0') + '°</b></div>';
    if (S.sim.eff.antrieb <= 0) h += '<div class="warnung">Niemand an Diesel oder E-Maschine.</div>';
    if (b.wegpunkt && S.sim.eff.ruder <= 0) h += '<div class="warnung">Niemand am Seitenruder – Kurs wird nicht gehalten.</div>';
    if (uw && b.batterie <= 0) h += '<div class="warnung">Batterie leer! Auftauchen zum Laden.</div>';
    if (b.wegpunkt) h += '<div class="zeile"><span class="klein">Wegpunkt ' + S.sim.planquadrat(b.wegpunkt) + ', ' + S.sim.dist(b, b.wegpunkt).toFixed(1) + ' km</span><button data-aktion="kursWeg">Löschen</button></div>';
    else h += '<div class="klein">Klicke auf die Karte, um einen Kurs zu setzen.</div>';
    const ort = S.sim.handelsort(st);
    if (ort) h += '<button class="breit aktiv" data-aktion="handel">' + (ort.art === 'hafen' ? 'Anlegen: ' : 'Handeln: ') + esc(ort.name) + '</button>';
    setze($('fahrtInfo'), h);
  }

  function waffen(st) {
    const b = st.boot;
    const ziel = st.schiffe.find((s) => s.id === st.ziel);
    let h = '<div class="zeile"><span>Bugrohre</span><span class="rohre">' + b.rohre.map((v) => '<i class="' + (v ? 'voll' : '') + '"></i>').join('') + '</span></div>';
    h += '<div class="zeile"><span>Reserve</span><b>' + st.ladung.torpedos + '</b></div>';
    if (b.rohre.includes(false) && st.ladung.torpedos > 0) {
      h += S.sim.eff.nachladen > 0 ? '<div class="klein">Nachladen ' + pz(b.ladeFortschritt * 100) + '</div>' + balken(b.ladeFortschritt * 100, 'gelb')
        : '<div class="klein">Zum Nachladen jemanden in den Bugraum schicken.</div>';
    }
    if (ziel) {
      const bekannt = S.sim.bekannt(ziel);
      h += '<div class="zeile"><span>Ziel</span><b>' + (bekannt ? D.SCHIFFSTYPEN[ziel.typ].name : 'Kontakt') + ', ' + S.sim.dist(ziel, b).toFixed(1) + ' km</b></div>';
    } else h += '<div class="klein">Kein Ziel. Klicke auf der Karte auf einen Kontakt.</div>';
    h += '<button class="breit warn" data-aktion="feuern"' + (ziel ? '' : ' disabled') + '>Torpedo los!</button>';
    setze($('waffen'), h);
  }

  function verschleiert(text, fortschritt, id) {
    let s = '';
    const zeichen = 'ABCDEFGHIKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < text.length; i++) {
      const h = ((i * 2654435761 + id * 97) >>> 0) % 1000 / 1000;
      s += text[i] === ' ' || h < fortschritt ? text[i] : zeichen[(i * 7 + id) % zeichen.length];
    }
    return s;
  }

  function funk(st) {
    const f = st.funk;
    let h = '<button class="breit" data-aktion="anfunken"' + (f.anfrage ? ' disabled' : '') + '>Stützpunkt anfunken</button>';
    if (f.anfrage) h += '<div class="klein">Funkverkehr läuft … noch ' + Math.ceil(f.anfrage.rest) + ' min</div>';
    if (!S.sim.antenneFrei(st)) h += '<div class="klein">Antenne unter Wasser – kein Funkverkehr.</div>';
    for (const n of f.nachrichten.slice(0, 3)) {
      if (n.fertig) h += '<div class="nachricht"><b>' + esc(n.mission.titel) + ':</b> ' + esc(n.mission.text) + '</div>';
      else {
        h += '<div class="nachricht verschluesselt">' + esc(verschleiert(n.mission.text, n.fortschritt, n.id)) + '</div>';
        if (n.auto) {
          h += balken(n.fortschritt * 100, 'gelb');
          if (S.sim.eff.funk <= 0) h += '<div class="klein">Entschlüsselung ruht – niemand am Funkgerät.</div>';
        }
        h += '<button class="breit" data-aktion="funkgeraet" data-arg="' + n.id + '">Am Funkgerät entschlüsseln</button>';
      }
    }
    setze($('funk'), h);
  }

  function horch(st) { setze($('horch'), S.minispiele.liste(st)); }

  function auftraege(st) {
    const liste = st.missionen.slice().reverse();
    const h = liste.length ? liste.map((m) => '<div class="auftrag ' + m.status + '"><b>' + esc(m.titel) + '</b> · ' + geld(m.belohnung) +
      (m.status !== 'aktiv' ? ' · ' + (m.status === 'erfuellt' ? 'erfüllt' : 'gescheitert') : '') + '<br><span class="klein">' + esc(m.text) + '</span></div>').join('')
      : '<div class="klein">Keine Aufträge. Funke den Stützpunkt an.</div>';
    setze($('auftraege'), h);
  }

  /* Auswahl: fester Aufbau bei Wechsel, nur Werte werden laufend erneuert. */
  function auswahl(st, aus) {
    const el = $('auswahl');
    const schluessel = aus.crew != null ? 'c' + aus.crew : aus.abteil != null ? 'a' + aus.abteil : '-';
    const c = aus.crew != null ? S.sim.crewNachId(st, aus.crew) : null;
    const zustandKey = schluessel + (c ? (c.tot ? 't' : '') + (st.gesteuert === c.id ? 'g' : '') + (c.befehl != null ? 'b' : '') + c.posten + c.schicht : '') +
      (aus.abteil != null ? st.boot.abteile[aus.abteil].pumpe + '' + st.boot.schotten.join() : '');
    if (el._key !== zustandKey) {
      el._key = zustandKey;
      el.innerHTML = aufbauAuswahl(st, aus, c);
    }
    // Laufende Werte
    if (c) {
      const set = (id, t) => { const e = document.getElementById(id); if (e) e.innerHTML = t; };
      set('awT', esc(taetigkeitText(st, c)));
      set('awM', pz(c.moral) + balken(c.moral, moralKlasse(c.moral)));
      set('awW', c.wach.toFixed(1) + ' h' + (c.wach > 19 ? ' <span class="warnung">übermüdet</span>' : ''));
      set('awL', pz(c.luft));
      set('awS', 'Stufe ' + D.stufe(c.xp) + ' (' + Math.floor(c.xp) + ' EP)');
    } else if (aus.abteil != null) {
      const a = st.boot.abteile[aus.abteil];
      const set = (id, t) => { const e = document.getElementById(id); if (e) e.innerHTML = t; };
      set('abW', pz(a.wasser * 100) + balken(a.wasser * 100, 'blau'));
      set('abR', pz(a.rumpf) + balken(a.rumpf, a.rumpf < 40 ? 'rot' : a.rumpf < 75 ? 'gelb' : ''));
      const leute = st.crew.filter((x) => !x.tot && S.sim.abteilIndex(x.x) === aus.abteil).map((x) => esc(x.name.split(' ')[0]) + ' (' + D.ROLLEN[x.rolle].kurz + ')');
      set('abC', leute.length ? leute.join(', ') : '–');
    }
  }

  function aufbauAuswahl(st, aus, c) {
    if (c) {
      const r = D.ROLLEN[c.rolle];
      let h = '<div><b style="color:' + r.farbe + '">' + esc(c.name) + '</b><br><span class="klein">' + r.name + ' – ' + r.text + '</span></div>';
      h += '<div class="zeile"><span>Tätigkeit</span><span id="awT"></span></div>';
      h += '<div>Moral <span id="awM"></span></div>';
      h += '<div class="zeile"><span>Wach seit</span><span id="awW"></span></div>';
      h += '<div class="zeile"><span>Luft</span><span id="awL"></span></div>';
      h += '<div class="zeile"><span>Erfahrung</span><span id="awS"></span></div>';
      if (c.tot) return h;
      h += '<label>Dienstposten <select data-feld="posten" data-id="' + c.id + '">' + Object.entries(D.POSTEN).map(([id, p]) =>
        '<option value="' + id + '"' + (c.posten === id ? ' selected' : '') + '>' + p.name + (p.spezial.includes(c.rolle) ? ' ★' : '') + '</option>').join('') + '</select></label>';
      h += '<label>Schicht <select data-feld="schicht" data-id="' + c.id + '">' + D.SCHICHT_NAMEN.map((n, i) =>
        '<option value="' + i + '"' + (c.schicht === i ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label>';
      h += '<div class="knopfraster">';
      h += st.gesteuert === c.id ? '<button data-aktion="freigeben" class="aktiv">Freigeben</button>' : '<button data-aktion="steuern">Übernehmen</button>';
      h += '<button data-aktion="befehlWeg"' + (c.befehl == null ? ' disabled' : '') + '>Befehl aufheben</button>';
      h += '</div><div class="klein" style="margin-top:4px">Klick ins Boot: dorthin schicken. Übernommen: ◀ ▶ oder <kbd>A</kbd>/<kbd>D</kbd> laufen. Doppeltipp auf eine Figur übernimmt sie direkt.</div>';
      return h;
    }
    if (aus.abteil != null) {
      const i = aus.abteil;
      const a = st.boot.abteile[i];
      const zu = (i > 0 && st.boot.schotten[i - 1]) || (i < st.boot.schotten.length && st.boot.schotten[i]);
      let h = '<div><b>' + D.ABTEILE[i].name + '</b></div>';
      h += '<div>Wasser <span id="abW"></span></div>';
      h += '<div>Rumpf <span id="abR"></span></div>';
      h += '<div class="klein">An Bord: <span id="abC"></span></div>';
      h += '<div class="knopfraster">';
      h += '<button data-aktion="pumpe" data-arg="' + i + '" class="' + (a.pumpe ? 'aktiv' : '') + '">Lenzpumpe ' + (a.pumpe ? 'an' : 'aus') + '</button>';
      h += '<button data-aktion="abschotten" data-arg="' + i + '" class="warn ' + (zu ? 'aktiv' : '') + '">' + (zu ? 'Schotten öffnen' : 'Abschotten') + '</button>';
      h += '</div><div class="klein" style="margin-top:4px">Pumpen brauchen Strom und jemanden im Abteil (oder den LI in der Zentrale). Leckabwehr repariert mit Ersatzteilen.</div>';
      return h;
    }
    return '<div class="klein">Klicke auf ein Crewmitglied oder ein Abteil.<br>Mausrad: Zoom · Ziehen: Ansicht verschieben · Klick auf ein Schott: öffnen/schließen.</div>';
  }

  function logListe(st) {
    const h = st.log.slice(-30).reverse().map((l) => '<div class="' + l.art + '"><span class="zeit">' + S.sim.uhrzeit({ zeit: l.zeit }).text + '</span>' + esc(l.text) + '</div>').join('');
    setze($('log'), h);
  }

  function kopf(st) {
    $('uhr').textContent = S.sim.uhrzeit(st).text;
    document.querySelectorAll('#tempo button').forEach((b) => b.classList.toggle('aktiv', Number(b.dataset.arg) === st.tempo));
    $('btnAlarm').classList.toggle('aktiv', st.alarm);
  }

  function hinweis(st, aus) {
    let t = '';
    if (st.gesteuert != null) {
      const c = S.sim.crewNachId(st, st.gesteuert);
      if (c) t = 'Du steuerst ' + c.name + ' (' + D.ROLLEN[c.rolle].kurz + '): laufen mit ◀ ▶ oder A/D, „Freigeben“ beendet.';
    } else if (aus.crew != null) t = 'Klicke ins Boot, um das Crewmitglied dorthin zu schicken.';
    if (st.tempo === 0) t = '❚❚ PAUSE – ' + t;
    setze($('bootHinweis'), esc(t));
  }

  function aktualisiere(st, aus) {
    kopf(st); status(st); crewListe(st, aus); tiefe(st); fahrt(st); waffen(st); horch(st); funk(st); auftraege(st); auswahl(st, aus); logListe(st); hinweis(st, aus);
  }

  /* ------------ Fenster ------------ */
  function oeffne(html) {
    $('modalInhalt').innerHTML = html;
    $('modal').hidden = false;
    document.querySelector('#modal .schliessen').hidden = false;
  }
  function schliesse() { $('modal').hidden = true; $('modalInhalt').innerHTML = ''; }
  function offen() { return !$('modal').hidden; }

  function meldung(titel, text) {
    oeffne('<h1>' + esc(titel) + '</h1><p>' + esc(text) + '</p><button data-aktion="modalZu">OK</button>');
  }

  function schichtplan(st) {
    let h = '<h1>Schichtplan</h1><p class="klein">Klicke auf eine Stunde, um zwischen Dienst, Schlaf und Freizeit zu wechseln. Wer länger als 19 Stunden wach ist, verliert Moral.</p>';
    h += '<div class="legende"><span class="plan"><span class="D">D</span></span> Dienst (am Posten) <span class="plan"><span class="S">S</span></span> Schlaf (in der Koje) <span class="plan"><span class="F">F</span></span> Freizeit (Messe)</div>';
    h += '<table class="plan"><tr><th></th>' + Array.from({ length: 24 }, (_, i) => '<th>' + i + '</th>').join('') + '</tr>';
    st.schichten.forEach((p, s) => {
      h += '<tr><th>' + D.SCHICHT_NAMEN[s] + '</th>' + p.map((v, i) => '<td class="' + v + '"><button class="' + v + '" data-aktion="plan" data-arg="' + s + ',' + i + '">' + v + '</button></td>').join('') + '</tr>';
    });
    h += '</table>';
    h += '<h3>Besatzung</h3><table><tr><th>Name</th><th>Rolle</th><th>Schicht</th><th>Dienstposten (★ = Fachgebiet)</th></tr>';
    for (const c of st.crew) {
      if (c.tot) continue;
      h += '<tr><td>' + esc(c.name) + '</td><td>' + D.ROLLEN[c.rolle].kurz + '</td><td><select data-feld="schicht" data-id="' + c.id + '">' +
        D.SCHICHT_NAMEN.map((n, i) => '<option value="' + i + '"' + (c.schicht === i ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></td><td><select data-feld="posten" data-id="' + c.id + '">' +
        Object.entries(D.POSTEN).map(([id, p]) => '<option value="' + id + '"' + (c.posten === id ? ' selected' : '') + '>' + p.name + (p.spezial.includes(c.rolle) ? ' ★' : '') + '</option>').join('') + '</select></td></tr>';
    }
    h += '</table><p><button data-aktion="planStandard">Standardplan wiederherstellen</button></p>';
    oeffne(h);
  }

  function handel(st, ort) {
    const S2 = S.sim;
    let h = '<h1>' + esc(ort.name) + '</h1><p>Geld: <b>' + geld(st.geld) + '</b> · Laderaum: ' + Math.round(S2.ladeEinheiten(st.ladung)) + ' / ' + D.LADERAUM_LE + ' LE' +
      (S2.lebende(st).some((c) => c.rolle === 'logistik') ? ' · <span class="gut">Logistik-Maat: 10 % Rabatt</span>' : '') + '</p>';
    h += '<h3>Waren</h3><table><tr><th>Ware</th><th>An Bord</th><th>Kaufen</th><th>Verkaufen</th></tr>';
    for (const [id, w] of Object.entries(D.WAREN)) {
      const k = S2.kaufpreis(st, ort, id), v = S2.verkaufspreis(st, ort, id);
      h += '<tr><td>' + item(id) + w.name + ' <span class="klein">(' + w.paket + ' ' + w.einheit + ')</span></td><td>' + Math.round(st.ladung[id]).toLocaleString('de-DE') + ' ' + w.einheit + '</td>';
      h += '<td>' + (k == null ? '<span class="klein">nicht im Angebot</span>' : '<button data-aktion="kaufen" data-arg="' + id + '">+' + w.paket + ' für ' + geld(k) + '</button>') + '</td>';
      h += '<td><button data-aktion="verkaufen" data-arg="' + id + '"' + (st.ladung[id] < w.paket ? ' disabled' : '') + '>−' + w.paket + ' für ' + geld(v) + '</button></td></tr>';
    }
    h += '</table>';
    if (ort.art === 'hafen') {
      h += '<p class="klein">Druckluft und Batterie wurden im Hafen aufgefüllt.</p>';
      const kosten = S2.reparaturKosten(st);
      h += '<h3>Werft</h3><p>Rumpfschäden: ' + st.boot.abteile.map((a, i) => D.ABTEILE[i].name + ' ' + Math.round(a.rumpf) + ' %').join(' · ') + '</p>';
      h += '<button data-aktion="werft"' + (kosten <= 0 ? ' disabled' : '') + '>Rumpf reparieren für ' + geld(kosten) + '</button>';
    }
    if (ort.basis) {
      h += '<h3>Ausbau</h3><p>In der Werft lässt sich das Boot verbessern: Rumpf, Leckabwehr, Antrieb, Horchgerät, Waffen, Funk und Crew. <button class="aktiv" data-aktion="werftBaum">Skilltree öffnen</button></p>';
      const tote = st.crew.filter((c) => c.tot);
      if (tote.length) {
        h += '<h3>Anheuern</h3>';
        for (const c of tote) h += '<p>Ersatz für ' + esc(c.name) + ' (' + D.ROLLEN[c.rolle].name + ') <button data-aktion="anheuern" data-arg="' + c.id + '">für ' + geld(500) + ' anheuern</button></p>';
      }
    }
    h += '<p><button data-aktion="modalZu">Ablegen</button></p>';
    oeffne(h);
  }

  function hilfe() {
    oeffne('<h1>So spielst du</h1>' +
      '<p>Du bist der <b>Kaleu</b> eines U-Bootes. Funke den <b>Marinehauptstützpunkt</b> an, um Aufträge zu bekommen. Der Funker muss sie erst entschlüsseln.</p>' +
      '<h3>Boot</h3><p><b>Klick auf Crew:</b> auswählen. <b>Danach Klick ins Boot:</b> dorthin schicken (bleibt dort, bis du den Befehl aufhebst). ' +
      '<b>Übernehmen</b> (Knopf oder Doppelklick auf die Figur): selbst steuern mit <kbd>A</kbd>/<kbd>D</kbd> oder Pfeiltasten. <b>Klick auf ein Abteil:</b> Pumpe und Schotten. <b>Klick auf ein Schott:</b> öffnen/schließen. ' +
      '<b>Mausrad</b> zoomt, <b>Ziehen</b> verschiebt die Ansicht.</p>' +
      '<h3>Funk und Horchgerät</h3><p>Funksprüche vom Stützpunkt kommen verschlüsselt. Am <b>Funkgerät</b> drehst du die Frequenz (6–7 MHz), bis das Signal klar ist, und übersetzt die Morsezeichen mit der Tabelle. Oder du lässt den Funker machen – das dauert dreimal so lang. Getauchte Kontakte erkennst du im <b>Horchraum</b>: Wähle die Vorlage aus der Geräuschkartei, deren Klangprofil und Schraubentakt passen, und melde den Kontakt. Erst dann kannst du ihn torpedieren.</p>' +
      '<h3>Laderaum und Ausbau</h3><p>Im <b>Laderaum</b> siehst du, was an Bord ist, und kannst Reservezellen einsetzen, Druckluftflaschen anschließen oder Ladung über Bord werfen. Konserven isst die Crew, wenn der frische Proviant alle ist; Sanitätskästen retten automatisch vor dem Ertrinken. In der <b>Werft</b> am Stützpunkt baust du das Boot über den Skilltree aus – jede Stufe schaltet die nächste frei.</p>' +
      '<p>Systeme funktionieren nur, wenn jemand am Posten steht. Fachleute (★) arbeiten voll, alle anderen mit halber Leistung. Die Chips unter „Status“ zeigen, was gerade besetzt ist.</p>' +
      '<h3>Tauchen und Lecks</h3><p>Getroffene Abteile laufen unter Wasser voll – je tiefer, desto schneller. Pumpen lenzen, die Leckabwehr repariert mit Ersatzteilen. Mit <b>Abschotten</b> hältst du Wasser in einem Abteil – aber wer drin ist, kann ertrinken. Zu viel Wasser macht das Boot schwer: es sinkt. Ein beschädigter Rumpf hält weniger Druck aus, die sichere Tiefe sinkt (orange Marke). Notfalls: <b>Notanblasen</b>.</p>' +
      '<h3>Energie</h3><p>An der Oberfläche laufen die Diesel und laden die Batterie. Getaucht fährt das Boot mit der E-Maschine und verbraucht Batterie. Funk und Sehrohr gehen nur bis Sehrohrtiefe.</p>' +
      '<h3>Kampf</h3><p>Klicke auf der Karte auf einen Kontakt, um ihn als Ziel zu wählen. Torpedos gehen nur bis Sehrohrtiefe und bis 7 km Entfernung. Zerstörer beschießen dich an der Oberfläche – tauch ab!</p>' +
      '<h3>Crew</h3><p>Moral hängt von Essen und Schlaf ab und bestimmt, wie schnell die Crew arbeitet. Im <b>Schichtplan</b> legst du Dienst, Schlaf und Freizeit fest. Erfahrung steigt mit der Arbeit.</p>' +
      '<h3>Tasten</h3><p><kbd>Leertaste</kbd> Pause · <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> Tempo 1×/2×/4× · <kbd>+</kbd>/<kbd>−</kbd> Zoom · <kbd>I</kbd> Laderaum · <kbd>U</kbd> Ausbau · <kbd>Esc</kbd> Auswahl aufheben</p>' +
      '<h3>Speichern</h3><p>„Speichern“ lädt eine .srt-Datei herunter. Die Datei ist verschlüsselt und signiert – wird sie verändert, lässt sie sich nicht mehr laden. Zusätzlich wird jede Spielstunde automatisch im Browser gesichert.</p>' +
      '<p><button data-aktion="modalZu">Los geht\'s</button></p>');
  }

  function ende(st) {
    oeffne('<h1>Das Boot ist verloren</h1><p>' + esc(st.verloren) + '</p><p>Tag ' + S.sim.uhrzeit(st).tag + ' · Versenkt: ' + st.statistik.versenkt +
      ' · Aufträge erfüllt: ' + st.statistik.auftraege + ' · Gefallen: ' + st.statistik.tote + '</p>' +
      '<p><button data-aktion="neuJa">Neues Spiel</button> <button data-aktion="laden">Spielstand laden</button></p>');
    document.querySelector('#modal .schliessen').hidden = true;
  }

  function neuFragen() {
    oeffne('<h1>Neues Spiel?</h1><p>Der aktuelle Fortschritt geht verloren, wenn du ihn nicht gespeichert hast.</p><p><button data-aktion="neuJa" class="warn">Neues Spiel starten</button> <button data-aktion="modalZu">Abbrechen</button></p>');
  }

  S.ui = { aktualisiere, oeffne, schliesse, offen, meldung, schichtplan, handel, hilfe, ende, neuFragen };
})(window.Spiel = window.Spiel || {});
