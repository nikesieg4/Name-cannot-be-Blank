/* Sehrohrtiefe – Spielschleife, Eingabe, Befehle. */
(function (S) {
  'use strict';
  const D = S.daten;
  const $ = (id) => document.getElementById(id);

  let st;
  const auswahl = { crew: null, abteil: null, hover: null };
  const ansicht = { zoom: 2, cx: 330, cy: 80, gesetzt: false };
  const tasten = { links: false, rechts: false };
  let tempoVorModal = null;

  /* ---------- Start ---------- */
  function start() {
    const auto = S.speicher.autosaveLesen();
    if (auto && auto.ok && !auto.stand.verloren) {
      st = auto.stand;
      S.sim.log(st, 'Automatisch gesicherten Spielstand fortgesetzt.', 'info');
    } else {
      st = S.zustand.neuesSpiel();
      S.ui.hilfe();
      pausieren();
    }
    S.sim.berechneEffizienz(st);
  }

  function neuesSpiel() {
    S.speicher.autosaveLoeschen();
    st = S.zustand.neuesSpiel();
    S.ui.meldungenZuruecksetzen();
    auswahl.crew = auswahl.abteil = null;
    tempoVorModal = null;
    S.ui.schliesse();
    S.sim.berechneEffizienz(st);
  }

  function pausieren() { if (tempoVorModal == null) { tempoVorModal = st.tempo || 1; st.tempo = 0; } }
  function fortsetzen() { if (tempoVorModal != null) { st.tempo = tempoVorModal; tempoVorModal = null; } }

  /* ---------- Leinwände ---------- */
  const bootCv = $('boot'), karteCv = $('karte');
  const bootCtx = bootCv.getContext('2d');

  function passeAn(cv) {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(cv.clientWidth * dpr)), h = Math.max(1, Math.round(cv.clientHeight * dpr));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; return true; }
    return false;
  }

  /* Zoom in Bildschirmpixeln pro Grafikpixel. Ganzzahlige Stufen bleiben pixelgenau,
     0,5 und 0,75 gibt es nur für kleine Bildschirme. */
  const STUFEN = S.grafik.ZOOMSTUFEN;
  function passendZoom() {
    const F = S.grafik.F;
    const max = Math.min(bootCv.width / ((D.BOOT.B - 8) * F), bootCv.height / (100 * F));
    let z = STUFEN[0];
    for (const s of STUFEN) if (s <= max) z = s;
    return z;
  }
  function zoomFit() { ansicht.zoom = passendZoom(); ansicht.cx = 330; ansicht.cy = 82; }

  function zoomen(richtung, sx, sy) {
    const alt = ansicht.zoom;
    let i = STUFEN.indexOf(alt);
    if (i < 0) i = STUFEN.findIndex((s) => s >= alt);
    const neu = STUFEN[Math.max(0, Math.min(STUFEN.length - 1, i + richtung))];
    if (neu === alt) return;
    if (sx != null) {
      const p = S.grafik.zuBoot(ansicht, bootCv.width, bootCv.height, sx, sy);
      ansicht.zoom = neu;
      const q = S.grafik.zuBoot(ansicht, bootCv.width, bootCv.height, sx, sy);
      ansicht.cx += p.x - q.x; ansicht.cy += p.y - q.y;
    } else ansicht.zoom = neu;
    begrenzeAnsicht();
  }
  function begrenzeAnsicht() {
    ansicht.cx = Math.max(0, Math.min(D.BOOT.B, ansicht.cx));
    ansicht.cy = Math.max(-40, Math.min(D.BOOT.H, ansicht.cy));
  }

  /* ---------- Spielschleife ---------- */
  let letzte = performance.now();
  let uiTakt = 0;
  function schleife(jetzt) {
    const dtReal = Math.min(0.25, (jetzt - letzte) / 1000);
    letzte = jetzt;
    if (passeAn(bootCv) || !ansicht.gesetzt) { if (!ansicht.gesetzt) zoomFit(); ansicht.gesetzt = true; }
    passeAn(karteCv);

    if (st.tempo > 0 && !st.verloren) {
      S.sim.schritt(st, dtReal * st.tempo);   // 1 echte Sekunde = 1 Spielminute bei 1×
      S.sim.steuern(st, dtReal, (tasten.rechts ? 1 : 0) - (tasten.links ? 1 : 0));
    }
    if (st.verloren && !S.ui.offen()) S.ui.ende(st);
    S.grafik.zeichneBoot(bootCtx, st, ansicht, auswahl, dtReal);
    S.karte.zeichne(karteCv, st);
    uiTakt -= dtReal;
    if (uiTakt <= 0) { uiTakt = 0.15; S.ui.aktualisiere(st, auswahl); $('steuer').hidden = st.gesteuert == null; }
    requestAnimationFrame(schleife);
  }

  /* ---------- Maus und Touch im Boot ---------- */
  let druck = null;
  const zeiger = new Map();          // aktive Finger/Maus für Pinch-Zoom
  let pinch = null;
  let letzterTipp = { zeit: 0, id: null };
  function bootPunkt(e) {
    const rect = bootCv.getBoundingClientRect();
    const dpr = bootCv.width / rect.width;
    const sx = (e.clientX - rect.left) * dpr, sy = (e.clientY - rect.top) * dpr;
    return { sx, sy, p: S.grafik.zuBoot(ansicht, bootCv.width, bootCv.height, sx, sy) };
  }
  /* Mit dem Finger ist die Trefferfläche größer, abhängig vom Zoom (ca. 12 Bildschirmpunkte). */
  function toleranz(e) {
    if (e.pointerType === 'mouse') return 0;
    const dpr = bootCv.width / bootCv.getBoundingClientRect().width;
    return Math.min(8, 12 * dpr / (ansicht.zoom * S.grafik.F));
  }
  bootCv.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
    bootCv.setPointerCapture(e.pointerId);
    if (zeiger.size === 2) {
      const [p1, p2] = [...zeiger.values()];
      pinch = { abstand: Math.hypot(p1.x - p2.x, p1.y - p2.y) };
      druck = null;
      return;
    }
    if (zeiger.size === 1) druck = { x: e.clientX, y: e.clientY, cx: ansicht.cx, cy: ansicht.cy, gezogen: false, id: e.pointerId };
  });
  bootCv.addEventListener('pointermove', (e) => {
    if (zeiger.has(e.pointerId)) zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && zeiger.size >= 2) {
      const [p1, p2] = [...zeiger.values()];
      const abstand = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const rect = bootCv.getBoundingClientRect();
      const dpr = bootCv.width / rect.width;
      const mx = ((p1.x + p2.x) / 2 - rect.left) * dpr, my = ((p1.y + p2.y) / 2 - rect.top) * dpr;
      if (abstand / pinch.abstand > 1.3) { zoomen(1, mx, my); pinch.abstand = abstand; }
      else if (abstand / pinch.abstand < 0.77) { zoomen(-1, mx, my); pinch.abstand = abstand; }
      return;
    }
    if (druck && druck.id === e.pointerId) {
      const dx = e.clientX - druck.x, dy = e.clientY - druck.y;
      if (Math.hypot(dx, dy) > (e.pointerType === 'mouse' ? 5 : 10)) druck.gezogen = true;
      if (druck.gezogen) {
        const dpr = bootCv.width / bootCv.getBoundingClientRect().width;
        ansicht.cx = druck.cx - dx * dpr / (ansicht.zoom * S.grafik.F);
        ansicht.cy = druck.cy - dy * dpr / (ansicht.zoom * S.grafik.F);
        begrenzeAnsicht();
        bootCv.classList.add('ziehen');
      }
      return;
    }
    if (e.pointerType !== 'mouse') return;
    const t = S.grafik.treffer(st, bootPunkt(e).p, 0);
    auswahl.hover = t && t.art === 'crew' ? t.id : null;
    bootCv.style.cursor = t && (t.art === 'crew' || t.art === 'schott') ? 'pointer' : t && auswahl.crew != null ? 'crosshair' : '';
  });
  function zeigerEnde(e, abbruch) {
    zeiger.delete(e.pointerId);
    if (zeiger.size < 2) pinch = null;
    bootCv.classList.remove('ziehen');
    if (!druck || druck.id !== e.pointerId) return;
    const war = druck; druck = null;
    if (war.gezogen || abbruch) return;
    const p = bootPunkt(e).p;
    const t = S.grafik.treffer(st, p, toleranz(e));
    // Doppeltipp mit dem Finger auf eine Figur = übernehmen
    if (e.pointerType !== 'mouse' && t && t.art === 'crew') {
      const jetzt = performance.now();
      if (letzterTipp.id === t.id && jetzt - letzterTipp.zeit < 400) {
        letzterTipp = { zeit: 0, id: null };
        auswahl.crew = t.id; auswahl.abteil = null;
        aktion('steuern');
        return;
      }
      letzterTipp = { zeit: jetzt, id: t.id };
    }
    klickImBoot(p, toleranz(e));
  }
  bootCv.addEventListener('pointerup', (e) => zeigerEnde(e, false));
  bootCv.addEventListener('pointercancel', (e) => zeigerEnde(e, true));
  bootCv.addEventListener('wheel', (e) => {
    e.preventDefault();
    const { sx, sy } = bootPunkt(e);
    zoomen(e.deltaY < 0 ? 1 : -1, sx, sy);
  }, { passive: false });
  bootCv.addEventListener('contextmenu', (e) => e.preventDefault());
  bootCv.addEventListener('dblclick', (e) => {
    const t = S.grafik.treffer(st, bootPunkt(e).p, 0);
    if (!t || t.art !== 'crew' || st.verloren || st.gesteuert === t.id) return;
    auswahl.crew = t.id; auswahl.abteil = null;
    aktion('steuern');
  });
  // Safari: Gesten-Zoom der Seite über dem Spiel verhindern
  ['gesturestart', 'gesturechange'].forEach((n) => document.addEventListener(n, (e) => e.preventDefault()));

  /* ---------- Laufknöpfe für Touch ---------- */
  document.querySelectorAll('[data-lauf]').forEach((knopf) => {
    const richtung = Number(knopf.dataset.lauf);
    const an = (e) => { e.preventDefault(); if (richtung < 0) tasten.links = true; else tasten.rechts = true; knopf.classList.add('aktiv'); };
    const aus = () => { if (richtung < 0) tasten.links = false; else tasten.rechts = false; knopf.classList.remove('aktiv'); };
    knopf.addEventListener('pointerdown', an);
    knopf.addEventListener('pointerup', aus);
    knopf.addEventListener('pointercancel', aus);
    knopf.addEventListener('pointerleave', aus);
    knopf.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  function klickImBoot(p, tol) {
    if (st.verloren) return;
    const t = S.grafik.treffer(st, p, tol || 0);
    if (!t) { auswahl.crew = null; auswahl.abteil = null; return; }
    if (t.art === 'crew') {
      auswahl.crew = auswahl.crew === t.id ? null : t.id;
      auswahl.abteil = null;
      return;
    }
    if (t.art === 'schott') { S.sim.schott(st, t.i, !st.boot.schotten[t.i]); return; }
    if (t.art === 'abteil') {
      const c = auswahl.crew != null ? S.sim.crewNachId(st, auswahl.crew) : null;
      if (c && !c.tot) {
        if (st.gesteuert === c.id) return;
        S.sim.befehl(st, c, t.x);
        S.sim.log(st, c.name.split(' ')[0] + ' (' + D.ROLLEN[c.rolle].kurz + '): Jawohl, Herr Kaleu – ' + D.ABTEILE[t.i].name + '.', 'info');
      } else { auswahl.abteil = auswahl.abteil === t.i ? null : t.i; auswahl.crew = null; }
    }
  }

  /* ---------- Karte ---------- */
  karteCv.addEventListener('click', (e) => {
    if (st.verloren) return;
    const rect = karteCv.getBoundingClientRect();
    const dpr = karteCv.width / rect.width;
    const p = S.karte.zuWelt(karteCv, (e.clientX - rect.left) * dpr, (e.clientY - rect.top) * dpr);
    const m = S.karte.masstab(karteCv);
    const s = S.karte.schiffBei(st, p, 8 * dpr / m.s + 2);
    if (s) { st.ziel = s.id; return; }
    if (p.x < 0 || p.y < 0 || p.x > D.WELT.B || p.y > D.WELT.H) return;
    if (S.sim.imLand(p.x, p.y)) { S.sim.log(st, 'Der Navigator: Dort ist Land, Herr Kaleu.', 'warn'); return; }
    st.boot.wegpunkt = { x: p.x, y: p.y };
    if (st.boot.fahrt === 0) st.boot.fahrt = 2;
    S.sim.log(st, 'Neuer Kurs auf Planquadrat ' + S.sim.planquadrat(p) + '.', 'info');
  });

  /* ---------- Tastatur ---------- */
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
    if (S.minispiele.taste(st, e)) { S.ui.aktualisiere(st, auswahl); return; }
    const k = e.key;
    if (k === 'a' || k === 'A' || k === 'ArrowLeft') { tasten.links = true; if (st.gesteuert != null) e.preventDefault(); }
    if (k === 'd' || k === 'D' || k === 'ArrowRight') { tasten.rechts = true; if (st.gesteuert != null) e.preventDefault(); }
    if (S.ui.offen()) { if (k === 'Escape') aktion('modalZu'); return; }
    if (k === ' ') { e.preventDefault(); aktion('tempo', st.tempo === 0 ? String(tempoVorModal || 1) : '0'); tempoVorModal = null; }
    if (k === '1') aktion('tempo', '1');
    if (k === '2') aktion('tempo', '2');
    if (k === '3') aktion('tempo', '4');
    if (k === 'i' || k === 'I') aktion('inventar');
    if (k === 'u' || k === 'U') aktion('werftBaum');
    if (k === '+') zoomen(1);
    if (k === '-') zoomen(-1);
    if (k === 'm' || k === 'M') aktion('panel', 'karte');
    if (k === 'c' || k === 'C') aktion('panel', 'links');
    if (k === 'k' || k === 'K') aktion('panel', 'rechts');
    if (k === 'l' || k === 'L') aktion('panel', 'log');
    if (k === 'Escape') {
      const offenePanels = ['karte', 'links', 'rechts', 'log'].filter((p) => document.body.classList.contains('zeige-' + p));
      if (offenePanels.length) offenePanels.forEach((p) => document.body.classList.remove('zeige-' + p));
      else if (st.gesteuert != null) st.gesteuert = null;
      else { auswahl.crew = null; auswahl.abteil = null; }
    }
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key;
    if (k === 'a' || k === 'A' || k === 'ArrowLeft') tasten.links = false;
    if (k === 'd' || k === 'D' || k === 'ArrowRight') tasten.rechts = false;
  });
  window.addEventListener('blur', () => { tasten.links = tasten.rechts = false; });

  /* ---------- Befehle aus Knöpfen ---------- */
  function fehler(t) { if (t) S.sim.log(st, t, 'warn'); }

  function aktion(name, arg) {
    const c = auswahl.crew != null ? S.sim.crewNachId(st, auswahl.crew) : null;
    switch (name) {
      case 'tempo': if (st.verloren) return; st.tempo = Number(arg); tempoVorModal = null; break;
      case 'alarm':
        st.alarm = !st.alarm;
        S.sim.log(st, st.alarm ? 'Gefechtsstationen! Alle Mann auf ihre Posten.' : 'Gefechtsstationen aufgehoben. Normaler Wachbetrieb.', st.alarm ? 'warn' : 'info');
        break;
      case 'zoom': if (arg === '0') zoomFit(); else zoomen(Number(arg)); break;
      case 'tiefe': S.sim.setzeTiefe(st, Number(arg)); break;
      case 'fahrt': S.sim.setzeFahrt(st, Number(arg)); break;
      case 'anblasen': fehler(S.sim.anblasen(st)); break;
      case 'kursWeg': st.boot.wegpunkt = null; break;
      case 'panel': document.body.classList.toggle('zeige-' + arg); break;
      case 'auswahlZu': auswahl.crew = null; auswahl.abteil = null; break;
      case 'zielWeg': st.ziel = null; break;
      case 'feuern': fehler(S.sim.feuern(st)); break;
      case 'anfunken': fehler(S.sim.anfunken(st)); break;
      case 'crew': auswahl.crew = auswahl.crew === Number(arg) ? null : Number(arg); auswahl.abteil = null; break;
      case 'steuern':
        if (c && !c.tot) { st.gesteuert = c.id; c.befehl = null; S.sim.log(st, 'Du übernimmst ' + c.name + '.', 'info'); }
        break;
      case 'freigeben':
        if (c && st.gesteuert === c.id) { st.gesteuert = null; c.befehl = Math.round(c.x); }
        break;
      case 'befehlWeg': if (c) c.befehl = null; break;
      case 'loslassen': {
        const g = st.gesteuert != null ? S.sim.crewNachId(st, st.gesteuert) : null;
        if (g) { st.gesteuert = null; g.befehl = Math.round(g.x); }
        break;
      }
      case 'pumpe': { const a = st.boot.abteile[Number(arg)]; a.pumpe = !a.pumpe; break; }
      case 'abschotten': {
        const i = Number(arg);
        const zu = (i > 0 && st.boot.schotten[i - 1]) || (i < st.boot.schotten.length && st.boot.schotten[i]);
        S.sim.abschotten(st, i, !zu);
        break;
      }
      case 'handel': {
        const ort = S.sim.handelsort(st);
        if (!ort) return;
        if (ort.art === 'hafen') S.sim.auftanken(st);
        pausieren();
        S.ui.handel(st, ort);
        break;
      }
      case 'kaufen': case 'verkaufen': case 'werft': case 'upgrade': case 'anheuern': {
        const ort = S.sim.handelsort(st);
        if (!ort) { S.ui.schliesse(); fortsetzen(); return; }
        const r = name === 'kaufen' ? S.sim.kaufen(st, ort, arg) : name === 'verkaufen' ? S.sim.verkaufen(st, ort, arg)
          : name === 'werft' ? S.sim.werft(st) : name === 'upgrade' ? S.sim.upgrade(st, arg) : S.sim.anheuern(st, Number(arg));
        S.ui.handel(st, ort);
        if (r) {
          const p = document.createElement('p'); p.className = 'warnung'; p.textContent = r;
          $('modalInhalt').querySelector('h1').after(p);
        }
        break;
      }
      case 'schichtplan': pausieren(); S.ui.schichtplan(st); break;
      case 'plan': {
        const [s, h] = arg.split(',').map(Number);
        const folge = { D: 'S', S: 'F', F: 'D' };
        st.schichten[s][h] = folge[st.schichten[s][h]];
        S.ui.schichtplan(st);
        break;
      }
      case 'planStandard': st.schichten = D.STANDARD_SCHICHTEN.map((p) => p.slice()); S.ui.schichtplan(st); break;
      case 'speichern': S.speicher.herunterladen(st); S.sim.log(st, 'Spielstand gespeichert.', 'gut'); break;
      case 'laden': $('dateiLaden').click(); break;
      case 'neu': pausieren(); S.ui.neuFragen(); break;
      case 'neuJa': neuesSpiel(); break;
      case 'hilfe': pausieren(); S.ui.hilfe(); break;
      case 'modalZu':
        if (st.verloren) return;
        S.minispiele.geschlossen(); S.laderaum.geschlossen();
        S.ui.schliesse(); fortsetzen();
        break;
      case 'funkgeraet': case 'horch':
        if (!S.ui.offen()) pausieren();
        S.minispiele.aktion(st, name, arg);
        break;
      case 'inventar': case 'werftBaum':
        if (!S.ui.offen()) pausieren();
        S.laderaum.aktion(st, name, arg);
        break;
      default: if (!S.minispiele.aktion(st, name, arg)) S.laderaum.aktion(st, name, arg); break;
    }
    S.ui.aktualisiere(st, auswahl);
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-aktion]');
    if (!el || el.disabled) return;
    aktion(el.dataset.aktion, el.dataset.arg);
  });
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.id === 'ration') { st.ration = Number(el.value); return; }
    if (!el.dataset || !el.dataset.feld) return;
    const c = S.sim.crewNachId(st, Number(el.dataset.id));
    if (!c) return;
    if (el.dataset.feld === 'posten') c.posten = el.value;
    if (el.dataset.feld === 'schicht') c.schicht = Number(el.value);
    c.befehl = null;
  });
  $('ration').addEventListener('input', (e) => { st.ration = Number(e.target.value); });
  $('modal').addEventListener('click', (e) => { if (e.target.id === 'modal' && !st.verloren) aktion('modalZu'); });

  $('dateiLaden').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    const leser = new FileReader();
    leser.onload = () => {
      const r = S.speicher.importieren(leser.result);
      if (!r.ok) { pausieren(); S.ui.meldung('Laden fehlgeschlagen', r.grund); return; }
      st = r.stand;
      S.ui.meldungenZuruecksetzen();
      auswahl.crew = auswahl.abteil = null;
      tempoVorModal = null;
      st.tempo = 0;
      S.ui.schliesse();
      S.sim.berechneEffizienz(st);
      S.sim.log(st, 'Spielstand „' + f.name + '“ geladen. Spiel ist pausiert.', 'gut');
      S.speicher.autosaveSchreiben(st);
    };
    leser.readAsText(f);
  });

  start();
  requestAnimationFrame(schleife);
  S.debug = { get st() { return st; }, auswahl, ansicht, aktion };
})(window.Spiel = window.Spiel || {});
