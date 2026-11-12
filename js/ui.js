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
    const fl = S.sim.flutung(st);
    let h = '';
    h += '<div class="zeile"><span>' + sym('geld') + 'Geld</span><b>' + geld(st.geld) + '</b></div>';
    h += '<div class="zeile"><span>' + sym('moral') + 'Moral (Schnitt)</span><b>' + pz(moral) + '</b></div>' + balken(moral, moralKlasse(moral));
    h += '<div class="zeile"><span>' + sym('proviant') + 'Proviant</span><b>' + (st.ladung.proviant + st.ladung.konserven) + ' Rat. (' + tage.toFixed(1) + ' Tage)</b></div>';
    h += '<div class="zeile"><span>' + sym('diesel') + 'Diesel</span><b>' + Math.round(st.ladung.diesel).toLocaleString('de-DE') + ' L</b></div>';
    h += '<div class="zeile"><span>' + sym('batterie') + 'Batterie</span><b>' + pz(b.batterie) + '</b></div>' + balken(b.batterie, b.batterie < 20 ? 'rot' : 'blau');
    h += '<div class="zeile"><span>' + sym('druckluft') + 'Druckluft</span><b>' + pz(b.druckluft) + '</b></div>' + balken(b.druckluft, 'blau');
    h += '<div class="zeile"><span>' + sym('rumpf') + 'Ersatzteile</span><b>' + st.ladung.ersatzteile + '</b></div>';
    h += '<div class="zeile"><span>' + sym('torpedo') + 'Torpedos</span><button data-aktion="inventar" title="Vorräte öffnen (I)">' + S.sim.torpedosGesamt(st) + ' / 14</button></div>';
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
    // nach Rollen gruppiert, mit Überschrift und Stärke je Rolle
    const reihen = Object.keys(D.ROLLEN);
    const liste = st.crew.slice().sort((a, c) => reihen.indexOf(a.rolle) - reihen.indexOf(c.rolle) || a.id - c.id);
    let vorher = null;
    const h = liste.map((c) => {
      const r = D.ROLLEN[c.rolle];
      let kopf = '';
      if (c.rolle !== vorher) {
        vorher = c.rolle;
        const alle = st.crew.filter((x) => x.rolle === c.rolle), leb = alle.filter((x) => !x.tot).length;
        kopf = '<div class="crewGruppe">' + r.name + (alle.length > 1 ? ' <span>' + leb + (leb < alle.length ? ' / ' + alle.length : '') + '</span>' : '') + '</div>';
      }
      return kopf + '<div class="crew' + (c.tot ? ' tot' : '') + (auswahl.crew === c.id ? ' gewaehlt' : '') + '" data-aktion="crew" data-arg="' + c.id + '">' +
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
    const ziel = { name: b.zielTiefe >= 0 && D.TIEFEN[b.zielTiefe] ? D.TIEFEN[b.zielTiefe].name : 'Befohlen', m: b.zielM };
    const zt = S.sim.zerstoerungstiefe(st);
    const pos = (m) => Math.min(100, m / zt * 100);
    let h = '<div class="zeile"><span>Tiefe</span><b style="font-size:24px">' + Math.round(b.tiefe) + ' m</b></div>';
    h += '<div class="tiefenskala" title="Grün: Zieltiefe · Orange: sichere Tiefe bei aktuellem Rumpfzustand · Rot: Zerstörungstiefe ' + zt + ' m">' +
      '<span class="ziel" style="left:' + pos(ziel.m) + '%"></span><span class="sicher" style="left:' + pos(sicher) + '%"></span>' +
      '<span class="marke" style="left:' + pos(b.tiefe) + '%"></span></div>';
    h += '<div class="klein">Ziel: ' + ziel.name + ' (' + ziel.m + ' m) · sicher bis ' + Math.round(sicher) + ' m</div>';
    h += '<div class="klein">Wassertiefe hier ' + Math.round(S.sim.wassertiefe(b.x, b.y)) + ' m' + (b.aufGrund ? ' · Boot liegt auf Grund' : '') + '</div>';
    if (b.tiefe > sicher) h += '<div class="warnung">⚠ Zu tief für den Rumpfzustand – Implosionsgefahr!</div>';
    if (S.sim.eff.tauchen <= 0) h += '<div class="warnung">Niemand an Tiefenruder oder Tauchzellen.</div>';
    if (S.sim.flutung(st) > 0.12) h += '<div class="warnung">Boot ist zu schwer und sinkt! Lenzen oder anblasen.</div>';
    setze($('tiefe'), h);
    const k = D.TIEFEN.map((t, i) => '<button data-aktion="tiefe" data-arg="' + i + '" class="' + (b.zielTiefe === i ? 'aktiv' : '') + '">' + t.name + '</button>').join('');
    setze($('tiefenKnoepfe'), k);
    const an = document.querySelector('#rechts [data-aktion="anblasen"]');
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
    if (b.wegpunkt) h += '<div class="zeile"><span class="klein">Wegpunkt ' + S.sim.planquadrat(b.wegpunkt) + ', ' + S.sim.dist(S.sim.koppelOrt(st), b.wegpunkt).toFixed(1) + ' km</span><button data-aktion="kursWeg">Löschen</button></div>';
    else h += '<div class="klein">Klicke auf die Karte, um einen Kurs zu setzen.</div>';
    const ort = S.sim.handelsort(st);
    if (ort) h += '<button class="breit aktiv" data-aktion="handel">' + (ort.art === 'hafen' ? 'Anlegen: ' : 'Handeln: ') + esc(ort.name) + '</button>';
    setze($('fahrtInfo'), h);
  }

  /* Rohr-Kästchen mit Torpedotyp: grün G7e, orange G7a, leer rot */
  const rohrI = (v, extra) => '<i class="' + (v ? 'voll ' + v : '') + (extra || '') + '" title="' + (v || 'leer') + '"></i>';

  function waffen(st) {
    const b = st.boot;
    const ziel = st.schiffe.find((s) => s.id === st.ziel && !s.versenkt);
    const l = st.ladung, a = b.reserveG7a || { torpedos: 0, torpedosHeck: 0, torpedosDeck: 0 };
    let h = '<div class="zeile"><span>Bugrohre 1–4</span><span class="rohre">' + b.rohre.slice(0, 4).map((v) => rohrI(v)).join('') + '</span></div>';
    h += '<div class="zeile"><span>Heckrohr 5</span><span class="rohre">' + rohrI(b.rohre[4]) + '</span></div>';
    const res = (k) => (l[k] - (a[k] || 0)) + ' e / ' + (a[k] || 0) + ' a';
    h += '<div class="zeile klein"><span>Reserve Bug</span><span>' + res('torpedos') + '</span></div>';
    h += '<div class="zeile klein"><span>Reserve Heck · Oberdeck</span><span>' + res('torpedosHeck') + ' · ' + res('torpedosDeck') + '</span></div>';
    h += '<div class="zeile"><span>Typ für Schuss und Nachladen</span><button data-aktion="ladeTyp" title="' + esc(D.TORPEDOTYPEN[b.ladeTyp || 'G7e'].text) + '">' + (b.ladeTyp || 'G7e') + ' ⇄</button></div>';
    if (b.rohre.slice(0, 4).some((r) => !r) && l.torpedos > 0) h += '<div class="klein">Bugrohre laden ' + pz(b.ladeFortschritt * 100) + '</div>' + balken(b.ladeFortschritt * 100, 'gelb');
    if (!b.rohre[4] && l.torpedosHeck > 0) h += '<div class="klein">Heckrohr laden ' + pz(b.heckFortschritt * 100) + '</div>' + balken(b.heckFortschritt * 100, 'gelb');
    if (ziel) {
      const bekannt = S.sim.bekannt(ziel);
      h += '<div class="zeile"><span>Ziel</span><b>' + (bekannt ? D.SCHIFFSTYPEN[ziel.typ].name : 'Kontakt') + ', ' + S.sim.dist(ziel, b).toFixed(1) + ' km</b></div>';
    } else h += '<div class="klein">Kein Ziel. Klicke auf der Karte auf einen Kontakt.</div>';
    h += '<div class="knopfraster"><button class="warn" data-aktion="feuern" data-arg="1"' + (ziel ? '' : ' disabled') + '>Einzelschuss</button>' +
      '<button class="warn" data-aktion="feuern" data-arg="2"' + (ziel ? '' : ' disabled') + '>Fächer (2)</button></div>';
    h += '<div class="zeile" style="margin-top:6px"><span>8,8 cm · ' + l.munition88 + ' Schuss</span><button data-aktion="geschuetz"' + (ziel || b.geschuetz != null ? '' : ' disabled') + ' class="' + (b.geschuetz != null ? 'aktiv' : '') + '">' + (b.geschuetz != null ? 'Feuer einstellen' : 'Geschütz') + '</button></div>';
    h += '<div class="zeile klein"><span>2-cm-Flak</span><span>' + l.munitionFlak + ' Schuss</span></div>';
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
    let h = '<div class="klein">BdU-Rundspruch alle 4 Stunden · nächster um ' + S.sim.naechsteSendezeit(st) + ' Uhr</div>';
    h += '<button class="breit" data-aktion="anfunken"' + (f.anfrage ? ' disabled' : '') + ' title="Funksprüche können vom Gegner eingepeilt werden">Kurzsignal an BdU</button>';
    if (f.anfrage) h += '<div class="klein">' + (f.anfrage.rest > 0 ? 'Kurzsignal wird gesendet … noch ' + Math.ceil(f.anfrage.rest) + ' min' : 'Quittiert – Antwort mit dem nächsten Rundspruch.') + '</div>';
    if (!S.sim.antenneFrei(st)) h += '<div class="klein">Antenne unter Wasser – kein Funkverkehr.</div>';
    for (const n of f.nachrichten.slice(0, 3)) {
      if (n.fertig) h += '<div class="nachricht"><b>' + esc(n.mission.titel) + ':</b> ' + esc(n.mission.text) + '</div>';
      else {
        h += '<div class="nachricht verschluesselt">' + (n.empfangen ? esc(verschleiert(n.mission.text, n.fortschritt, n.id)) : (n.ruf ? 'Rundspruch läuft – noch nicht aufgefangen' : 'Spruch liegt an – Frequenz suchen')) + '</div>';
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

  /* ------------ HUD: Maschinentelegraf, Tiefenmesser, Zähler ------------ */
  function hudFahrt(st) {
    const b = st.boot, uw = S.sim.unterWasser(st);
    const grad = Math.round(((b.kurs * 180 / Math.PI) + 90 + 360) % 360);
    let h = '<h2>Maschine · ' + (uw ? 'E-Maschinen' : 'Diesel') + '</h2><div class="telegraf"><div class="hebel">';
    for (let i = D.FAHRT.length - 1; i >= 0; i--) {
      h += '<button data-aktion="fahrt" data-arg="' + i + '" class="' + (b.fahrt === i ? 'aktiv' : '') + '">' + D.FAHRT[i].kurz + '</button>';
    }
    h += '</div><div class="fahrtwert"><b>' + (S.sim.knoten || 0).toFixed(1) + '</b><span>Knoten</span><span>Kurs ' + String(grad).padStart(3, '0') + '°</span>' +
      (b.wegpunkt ? '<span>→ Qu. ' + S.sim.planquadrat(b.wegpunkt) + ' · ' + S.sim.dist(S.sim.koppelOrt(st), b.wegpunkt).toFixed(0) + ' km</span>' : '<span>kein Kurs</span>') + '</div></div>';
    if (S.sim.eff.antrieb <= 0) h += '<div class="warnung">Niemand an der Maschine!</div>';
    else if (uw && b.batterie <= 0) h += '<div class="warnung">Batterie leer!</div>';
    setze($('hudFahrt'), h);
  }

  function tiefenSVG(st) {
    const b = st.boot, zt = S.sim.zerstoerungstiefe(st), sicher = S.sim.sichereTiefe(st);
    const w = (m) => (135 + Math.min(1, Math.max(0, m / zt)) * 270) * Math.PI / 180;
    const p = (m, r) => (50 + Math.cos(w(m)) * r).toFixed(1) + ' ' + (50 + Math.sin(w(m)) * r).toFixed(1);
    const bogen = (a, z, r) => 'M ' + p(a, r) + ' A ' + r + ' ' + r + ' 0 ' + ((z - a) / zt * 270 > 180 ? 1 : 0) + ' 1 ' + p(z, r);
    let s = '<svg viewBox="0 0 100 100" role="img" aria-label="Tiefenmesser ' + Math.round(b.tiefe) + ' Meter">';
    s += '<circle cx="50" cy="50" r="48" fill="#86662a"/><circle cx="50" cy="50" r="45" fill="#d9cfae"/>';
    // gelb: unter Konstruktionstiefe (nur im Notfall), rot: unter Prüfungstiefe
    const kt = S.sim.konstruktionstiefe(st);
    if (kt < sicher) s += '<path d="' + bogen(kt, sicher, 40) + '" stroke="#c29a45" stroke-width="5" fill="none"/>';
    s += '<path d="' + bogen(sicher, zt, 40) + '" stroke="#c8392b" stroke-width="5" fill="none"/>';
    for (let m = 0; m <= zt; m += 20) {
      const lang = m % 100 === 0;
      s += '<path d="M ' + p(m, 44) + ' L ' + p(m, lang ? 36 : 40) + '" stroke="#2a261c" stroke-width="' + (lang ? 1.6 : 0.8) + '"/>';
    }
    for (const m of [0, 50, 100, 150, 200, 250]) if (m <= zt) {
      const xy = p(m, 29).split(' ');
      s += '<text x="' + xy[0] + '" y="' + (Number(xy[1]) + 3) + '" font-size="8" text-anchor="middle" fill="#2a261c" font-family="VT323, monospace">' + m + '</text>';
    }
    // Meeresgrund (braun), falls er auf der Skala liegt
    const grund = S.sim.grundTiefe(st);
    if (b.echolot && grund <= zt) s += '<path d="M ' + p(grund, 48) + ' L ' + p(grund, 36) + '" stroke="#6b4a2a" stroke-width="4"/>';
    // Zieltiefe (grün) und Zeiger
    // Soll-Zeiger (grün, gewünschte Tiefe) und Ist-Zeiger (rot)
    const ziel = b.zielM;
    s += '<path d="M ' + p(ziel, -4) + ' L ' + p(ziel, 44) + '" stroke="#2f8a4c" stroke-width="3.2" stroke-linecap="round" opacity="0.9"/>';
    s += '<circle cx="' + p(ziel, 44).split(' ')[0] + '" cy="' + p(ziel, 44).split(' ')[1] + '" r="2.6" fill="#2f8a4c"/>';
    s += '<path d="M ' + p(b.tiefe, -6) + ' L ' + p(b.tiefe, 40) + '" stroke="#8e1e14" stroke-width="2.4" stroke-linecap="round"/>';
    s += '<circle cx="50" cy="50" r="4" fill="#86662a"/>';
    s += '<text x="50" y="76" font-size="13" text-anchor="middle" fill="#1d1912" font-family="VT323, monospace">' + Math.round(b.tiefe) + ' m</text>';
    return s + '</svg>';
  }

  /* Tiefenmesser im HUD. Das Gerüst wird einmal gebaut, damit das Eingabefeld beim Tippen nicht neu entsteht. */
  function hudTiefe(st) {
    const box = $('hudTiefe');
    if (!box.dataset.gebaut) {
      box.dataset.gebaut = '1';
      box.innerHTML = '<h2 id="hudTiefeKopf"></h2><div class="tiefe"><div id="tiefenUhr" title="Ziehen oder tippen: gewünschte Tiefe setzen"></div>' +
        '<div class="tiefenwahl"><div id="hudTiefenKnoepfe" class="tiefenwahl"></div>' +
        '<div class="tiefeneingabe"><button data-aktion="zielPlus" data-arg="-10" aria-label="10 m flacher">−10</button>' +
        '<label class="unsichtbar" for="zielEingabe">Gewünschte Tiefe in Metern</label><input id="zielEingabe" type="number" inputmode="numeric" min="0" step="5">' +
        '<button data-aktion="zielPlus" data-arg="10" aria-label="10 m tiefer">+10</button></div>' +
        '<div class="tiefeneingabe"><button data-aktion="echolot" id="hudEcholot" title="Echolot: zeigt die Wassertiefe, ist aber zu hören"></button></div>' +
        '<div class="tiefeneingabe"><button data-aktion="alarmtauchen" class="warn" title="Alarmtauchen (T)">Alarm!</button><button data-aktion="anblasen" class="warn" id="hudAnblasen"></button></div></div></div><div id="hudTiefeWarn"></div>';
    }
    const b = st.boot, sicher = S.sim.sichereTiefe(st);
    const wt = S.sim.wassertiefe(b.x, b.y);
    const schicht = S.sim.unterWasser(st) && b.tiefe > 15 ? ' · Schicht ~' + S.sim.sprungschicht(b.x, b.y) + ' m' : '';
    setze($('hudTiefeKopf'), 'Tiefe · Soll ' + b.zielM + ' m · Grund ' + (b.echolot ? Math.round(wt) + ' m' : '?') + schicht + ' · Prüf. ' + Math.round(sicher) + ' m');
    setze($('hudEcholot'), b.echolot ? 'Echolot an' : 'Echolot aus');
    $('hudEcholot').classList.toggle('aktiv', !!b.echolot);
    setze($('tiefenUhr'), tiefenSVG(st));
    setze($('hudTiefenKnoepfe'), D.TIEFEN.map((t, i) => '<button data-aktion="tiefe" data-arg="' + i + '" class="' + (b.zielTiefe === i ? 'aktiv' : '') + '">' + t.name + ' <small>' + t.m + '</small></button>').join(''));
    const ein = $('zielEingabe');
    if (document.activeElement !== ein && String(ein.value) !== String(b.zielM)) ein.value = b.zielM;
    ein.max = S.sim.zerstoerungstiefe(st) - 5;
    setze($('hudAnblasen'), 'Anblasen');
    const luecke = S.sim.grundTiefe(st) - b.tiefe;
    let h = '';
    if (b.asdic != null && st.zeit - b.asdic < 2) h += '<div class="warnung blink">ASDIC-Ortung! Schleichfahrt, Pumpen und Echolot aus</div>';
    if (b.ghgTaub && st.zeit < b.ghgTaub) h += '<div class="warnung">Horchgerät nach Detonationen taub</div>';
    if (b.tiefe > sicher) h += '<div class="warnung">⚠ Unter Prüfungstiefe – Implosionsgefahr!</div>';
    else if (b.tiefe > S.sim.konstruktionstiefe(st)) h += '<div class="warnung">Unter Konstruktionstiefe – nur im Notfall</div>';
    else if (b.alarmtauchen) h += '<div class="warnung blink">Alarmtauchen!</div>';
    else if (b.aufGrund) h += '<div class="' + (b.schrammt ? 'warnung' : 'gut') + '">' + (b.schrammt ? 'Schrammt über den Grund!' : 'Liegt auf Grund') + '</div>';
    else if (b.tiefe > 4 && luecke < 25 && b.echolot) h += '<div class="warnung">Echolot: Grund ' + Math.round(luecke) + ' m unter dem Kiel</div>';
    else if (S.sim.flutung(st) > 0.12) h += '<div class="warnung">Boot zu schwer – es sinkt!</div>';
    else if (S.sim.eff.tauchen <= 0) h += '<div class="warnung">Niemand an der Tiefensteuerung!</div>';
    if (b.zielM > sicher && !(b.tiefe > sicher)) h += '<div class="warnung">Soll-Tiefe liegt unter der sicheren Tiefe!</div>';
    setze($('hudTiefeWarn'), h);
  }

  /* Winkel am Tiefenmesser → Meter (0 m unten links, Zerstörungstiefe unten rechts, 270°) */
  function tiefeAusZeiger(st, el, clientX, clientY) {
    const r = el.getBoundingClientRect();
    const dx = clientX - (r.left + r.width / 2), dy = clientY - (r.top + r.height / 2);
    let a = ((Math.atan2(dy, dx) * 180 / Math.PI) - 135 + 720) % 360;
    if (a > 270) a = a > 315 ? 0 : 270;
    return a / 270 * S.sim.zerstoerungstiefe(st);
  }

  function zaehler(aktion, arg, sym_, name, wert, klein, klasse) {
    return '<button class="zaehler ' + (klasse || '') + '" data-aktion="' + aktion + '"' + (arg ? ' data-arg="' + arg + '"' : '') + '><span class="k">' + sym(sym_) + name + '</span><b>' + wert + '</b>' + (klein ? '<small>' + klein + '</small>' : '') + '</button>';
  }

  function hudZaehler(st) {
    const b = st.boot, l = st.ladung, leb = S.sim.lebende(st);
    const moral = leb.length ? leb.reduce((a, c) => a + c.moral, 0) / leb.length : 0;
    const rationen = l.proviant + l.konserven, tage = rationen / Math.max(1, leb.length * st.ration);
    const reserve = l.torpedos + l.torpedosHeck + l.torpedosDeck;
    const fl = S.sim.flutung(st), rumpf = S.sim.minRumpf(st);
    const rohre = '<span class="rohrreihe">' + b.rohre.map((v, i) => rohrI(v, i === 4 ? ' heck' : '')).join('') + '</span>';
    let h = '<button class="zaehler" data-aktion="inventar"><span class="k">' + sym('torpedo') + 'Torpedos</span>' + rohre + '<small>Reserve ' + reserve + '</small></button>';
    h += zaehler('inventar', '', 'proviant', 'Rationen', tage.toFixed(1) + ' T', rationen.toLocaleString('de-DE') + ' · ' + Math.ceil(leb.length * st.ration) + '/Tag', tage < 3 ? 'alarm' : tage < 7 ? 'warn' : '');
    const dp = l.diesel / D.STAURAUM.diesel.max * 100;
    h += zaehler('inventar', '', 'diesel', 'Diesel', pz(dp), Math.round(l.diesel / 1000) + 'k L', dp < 10 ? 'alarm' : dp < 25 ? 'warn' : '');
    h += zaehler('panel', 'rechts', 'batterie', 'Batterie', pz(b.batterie), S.sim.unterWasser(st) ? 'getaucht' : 'lädt', b.batterie < 10 ? 'alarm' : b.batterie < 30 ? 'warn' : '');
    h += zaehler('panel', 'rechts', 'druckluft', 'Druckluft', pz(b.druckluft), 'Anblasen ab 40 %', b.druckluft < 40 ? 'warn' : '');
    const luft = b.luft == null ? 100 : b.luft;
    const stunden = luft / (100 / (72 * 37 / Math.max(1, leb.length)));
    h += zaehler('panel', 'rechts', 'schlaf', 'Atemluft', pz(luft), S.sim.unterWasser(st) ? 'noch ~' + Math.floor(stunden) + ' h' : 'wird gelüftet', luft < 20 ? 'alarm' : luft < 40 ? 'warn' : '');
    h += zaehler('panel', 'links', 'moral', 'Moral', pz(moral), leb.length + ' Mann', moral < 30 ? 'alarm' : moral < 50 ? 'warn' : '');
    h += fl > 0.005 ? zaehler('panel', 'rechts', 'rumpf', 'Wasser', pz(fl * 100), 'Rumpf ' + pz(rumpf), 'alarm')
      : zaehler('panel', 'rechts', 'rumpf', 'Rumpf', pz(rumpf), 'schwächstes Abteil', rumpf < 50 ? 'alarm' : rumpf < 80 ? 'warn' : '');
    h += zaehler('werftBaum', '', 'geld', 'Kasse', Math.round(st.geld).toLocaleString('de-DE'), 'Kr');
    setze($('hudZaehler'), h);

    const ziel = st.schiffe.find((x) => x.id === st.ziel && !x.versenkt);
    let z = '';
    if (ziel) {
      const bek = S.sim.bekannt(ziel);
      z = '<div class="zielkarte"><span>Ziel: <b>' + (bek ? D.SCHIFFSTYPEN[ziel.typ].name : 'Kontakt') + '</b> · ' + S.sim.dist(ziel, b).toFixed(1) + ' km</span>' +
        '<button data-aktion="ladeTyp" title="Torpedotyp für Schuss und Nachladen">' + (b.ladeTyp || 'G7e') + '</button>' +
        '<button class="warn" data-aktion="feuern" data-arg="1">Torpedo los!</button><button class="warn" data-aktion="feuern" data-arg="2">Fächer</button>' +
        (b.tiefe < 0.5 ? '<button data-aktion="geschuetz" class="' + (b.geschuetz != null ? 'aktiv' : '') + '">' + (b.geschuetz != null ? 'Feuer halt' : '8,8 cm') + '</button>' : '') +
        '<button data-aktion="zielWeg" aria-label="Ziel aufheben">✕</button></div>';
    }
    setze($('hudZiel'), z);
  }

  /* ------------ Meldungen als kurze Einblendungen ------------ */
  let gesehen = null;
  function meldungen(st) {
    const box = $('meldungen');
    if (!box) return;
    const log = st.log;
    let ab = gesehen ? log.indexOf(gesehen) + 1 : log.length;
    if (gesehen && ab === 0) ab = Math.max(0, log.length - 3);
    for (let i = ab; i < log.length; i++) {
      const l = log[i];
      const el = document.createElement('div');
      el.className = 'toast ' + l.art;
      el.textContent = l.text;
      box.appendChild(el);
      const dauer = l.art === 'alarm' ? 9000 : l.art === 'info' ? 4500 : 6500;
      setTimeout(() => { el.classList.add('weg'); setTimeout(() => el.remove(), 700); }, dauer);
    }
    gesehen = log[log.length - 1] || null;
    // Funkruf vom Stützpunkt: bleibt stehen, bis der Spruch aufgefangen oder verpasst ist
    const ruf = st.funk.ruf;
    let el = box.querySelector('.funkruf');
    if (ruf) {
      const rest = Math.max(0, Math.ceil(ruf.bis - st.zeit));
      const text = 'RUNDSPRUCH: Der BdU sendet für uns! Noch ' + rest + ' min' + (S.sim.antenneFrei(st) ? '' : ' – auf Sehrohrtiefe gehen!');
      if (!el || el.dataset.id !== String(ruf.id)) {
        if (el) el.remove();
        el = document.createElement('div');
        el.className = 'toast funkruf'; el.dataset.id = ruf.id;
        el.innerHTML = '<span></span><button data-aktion="funkgeraet" data-arg="' + ruf.id + '">Zum Funkgerät</button>';
        box.prepend(el);
        S.minispiele.piep();
      }
      el.firstChild.textContent = text;
    } else if (el) el.remove();
    const toasts = box.querySelectorAll('.toast:not(.funkruf)');
    for (let i = 0; i < toasts.length - 4; i++) toasts[i].remove();
  }
  function meldungenZuruecksetzen() { gesehen = null; const box = $('meldungen'); if (box) box.querySelectorAll('.toast:not(.funkruf)').forEach((t) => t.remove()); }

  function aktualisiere(st, aus) {
    kopf(st); status(st); crewListe(st, aus); tiefe(st); fahrt(st); waffen(st); horch(st); funk(st); auftraege(st); auswahl(st, aus); logListe(st); hinweis(st, aus);
    hudFahrt(st); hudTiefe(st); hudZaehler(st); meldungen(st);
    $('auswahlKarte').hidden = aus.crew == null && aus.abteil == null;
    for (const k of document.querySelectorAll('#panelKnoepfe [data-aktion="panel"]')) k.classList.toggle('aktiv', document.body.classList.contains('zeige-' + k.dataset.arg));
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
    let h = '<h1>' + esc(ort.name) + '</h1><p>Geld: <b>' + geld(st.geld) + '</b> · Verpflegung: ' + S2.bestand(st, 'verpflegung').toLocaleString('de-DE') + ' / ' + S2.kapazitaet(st, 'verpflegung').toLocaleString('de-DE') + ' Rationen' +
'</p>';
    h += '<h3>Waren</h3><table><tr><th>Ware</th><th>An Bord</th><th>Kaufen</th><th>Verkaufen</th></tr>';
    for (const [id, w] of Object.entries(D.WAREN)) {
      const k = S2.kaufpreis(st, ort, id), v = S2.verkaufspreis(st, ort, id);
      h += '<tr><td>' + item(id) + w.name + ' <span class="klein">(' + w.paket + ' ' + w.einheit + ')</span></td><td>' + Math.round(id === 'torpedos' ? st.ladung.torpedos + st.ladung.torpedosHeck + st.ladung.torpedosDeck : st.ladung[id]).toLocaleString('de-DE') + ' ' + w.einheit + '</td>';
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
      '<h3>Ansicht</h3><p>Im normalen Blick siehst du nur Maschinentelegraf, Tiefenmesser und die wichtigsten Zähler. Karte, Besatzung, Kommando, Vorräte, Ausbau, Wachen und Meldungen klappst du oben oder per Taste auf.</p>' +
      '<h3>Funk, Enigma und Navigation</h3><p>Der BdU sendet nur zu festen Zeiten – alle 4 Stunden ein Rundspruch auf Kurzwelle. Liegt ein Spruch für dich an, erscheint oben eine Meldung. Er läuft 40 Minuten; verpasst du ihn, wiederholt der BdU ihn beim nächsten Termin. Am <b>Funkgerät</b> suchst du die Welle (3,75–15 MHz, Tagwelle 8–14, Nachtwelle 4–8 MHz) und schreibst die Morsezeichen als Fünfergruppen mit. Dann entschlüsselst du sie an der <b>Schlüsselmaschine M</b>: Walzen auf die Grundstellung aus der Schlüsseltafel, Schlüsselgruppe tasten, Walzen auf den Spruchschlüssel, Gruppen tasten. Ein eigenes Kurzsignal an den BdU kann der Gegner einpeilen. Deinen Standort kennst du nur aus dem <b>Koppeln</b>: Strömung versetzt das Boot. Aufgetaucht nimmt der Obersteuermann in der Dämmerung ein Sternbesteck, mittags die Mittagsbreite und bei Tag in Küstennähe Peilungen. Die Karte ist in Marinequadrate geteilt (z. B. „AN 57“). Getauchte Kontakte erkennst du im <b>Horchraum</b> mit der Geräuschkartei.</p>' +
      '<h3>Laderaum und Ausbau</h3><p>Im <b>Laderaum</b> siehst du, was an Bord ist, und kannst Reservezellen einsetzen, Druckluftflaschen anschließen oder Ladung über Bord werfen. Konserven isst die Crew, wenn der frische Proviant alle ist; Sanitätskästen retten automatisch vor dem Ertrinken. In der <b>Werft</b> am Stützpunkt baust du das Boot über den Skilltree aus – jede Stufe schaltet die nächste frei.</p>' +
      '<p>Systeme funktionieren nur, wenn jemand am Posten steht. Fachleute (★) arbeiten voll, alle anderen mit halber Leistung. Die Chips unter „Status“ zeigen, was gerade besetzt ist.</p>' +
      '<h3>Tauchen und Lecks</h3><p>Die gewünschte Tiefe stellst du mit den Knöpfen ein, mit −10/+10, als Zahl im Feld oder indem du den grünen Soll-Zeiger am Tiefenmesser ziehst. Getroffene Abteile laufen unter Wasser voll – je tiefer, desto schneller. Pumpen lenzen, die Leckabwehr repariert mit Ersatzteilen. Mit <b>Abschotten</b> hältst du Wasser in einem Abteil – aber wer drin ist, kann ertrinken. Zu viel Wasser macht das Boot schwer: es sinkt. Ein beschädigter Rumpf hält weniger Druck aus, die sichere Tiefe sinkt (orange Marke). Notfalls: <b>Notanblasen</b>.</p>' +
      '<h3>Energie</h3><p>An der Oberfläche laufen die Diesel und laden die Batterie. Getaucht fährt das Boot mit der E-Maschine und verbraucht Batterie. Funk und Sehrohr gehen nur bis Sehrohrtiefe.</p>' +
      '<h3>Kampf</h3><p>Klicke auf der Karte auf einen Kontakt, um ihn als Ziel zu wählen. Torpedos gehen nur bis Sehrohrtiefe und bis 7 km Entfernung. Zerstörer beschießen dich an der Oberfläche und jagen dich getaucht mit Horchgerät, ASDIC und Wasserbomben. Leg dich auf Grund und stopp die Maschinen – dann finden sie dich kaum.</p>' +
      '<h3>Crew</h3><p>Moral hängt von Essen und Schlaf ab und bestimmt, wie schnell die Crew arbeitet. Im <b>Schichtplan</b> legst du Dienst, Schlaf und Freizeit fest. Erfahrung steigt mit der Arbeit.</p>' +
      '<h3>Tasten</h3><p><kbd>Leertaste</kbd> Pause · <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> Tempo 1×/2×/4× · <kbd>+</kbd>/<kbd>−</kbd> Zoom · <kbd>M</kbd> Karte · <kbd>C</kbd> Besatzung · <kbd>K</kbd> Kommando · <kbd>L</kbd> Meldungen · <kbd>I</kbd> Vorräte · <kbd>U</kbd> Ausbau · <kbd>Esc</kbd> Auswahl aufheben</p>' +
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

  S.ui = { tiefeAusZeiger, aktualisiere, meldungenZuruecksetzen, oeffne, schliesse, offen, meldung, schichtplan, handel, hilfe, ende, neuFragen };
})(window.Spiel = window.Spiel || {});
