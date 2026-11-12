/* Sehrohrtiefe – Erzeugung eines neuen Spielstands und kleine Helfer. */
(function (S) {
  'use strict';
  const D = S.daten;

  function zufall(a) { return a[Math.floor(Math.random() * a.length)]; }

  function neuerName(benutzt) {
    for (let i = 0; i < 200; i++) {
      const n = zufall(D.VORNAMEN) + ' ' + zufall(D.NACHNAMEN);
      if (!benutzt.has(n)) { benutzt.add(n); return n; }
    }
    return 'Matrose ' + (benutzt.size + 1);
  }

  /* Freizeit-Platz: Messe im Mannschaftsraum, Bugraum oder Heckraum (Bootseinheiten) */
  function freizeitPlatz() {
    const r = Math.random();
    if (r < 0.55) return 300 + Math.floor(Math.random() * 44);
    if (r < 0.85) return 532 + Math.floor(Math.random() * 56);
    return 50 + Math.floor(Math.random() * 22);
  }

  function neuesCrewmitglied(id, rolle, schicht, benutzt, posten) {
    const r = D.ROLLEN[rolle];
    const messeX = freizeitPlatz();
    return {
      id, rolle, name: neuerName(benutzt),
      posten: posten || (Array.isArray(r.posten) ? r.posten[0] : r.posten), schicht, koje: null,
      x: messeX, richtung: 1, laeuft: false, anim: 0,
      taetigkeit: 'frei', aktPosten: null,
      wach: 2 + Math.random() * 6, moral: 72, xp: Math.floor(Math.random() * 20), luft: 100,
      tot: false, befehl: null, messeX,
    };
  }

  function neuesSpiel() {
    const benutzt = new Set();
    const crew = [];
    let id = 1;
    // Besatzung nach Rollen: jede Rolle in ihrer Stärke, reihum auf die drei Wachen und Posten verteilt
    for (const [rolle, r] of Object.entries(D.ROLLEN)) {
      for (let k = 0; k < r.anzahl; k++) {
        const posten = Array.isArray(r.posten) ? r.posten[k % r.posten.length] : r.posten;
        crew.push(neuesCrewmitglied(id++, rolle, r.wache === 3 ? 3 : (r.wache + k) % 3, benutzt, posten));
      }
    }
    // Startaufstellung passend zum Schichtplan um 12:00 UTC
    for (const c of crew) {
      const p = D.STANDARD_SCHICHTEN[c.schicht][12];
      if (p === 'D' && D.POSTEN[c.posten].x != null) c.x = D.POSTEN[c.posten].x;
    }
    const basis = D.HAEFEN[0];
    return {
      version: 3,
      zeit: 12 * 60,           // Spielminuten seit Tag 1, 00:00 UTC
      tempo: 1,
      geld: 2500,
      ration: 3,
      alarm: false,
      naechsteId: id,
      boot: {
        x: basis.x + 4, y: basis.y - 2, kurs: 0, wegpunkt: null,
        tiefe: 0, zielTiefe: 0, zielM: 0, fahrt: 0, luft: 100,
        batterie: 100, druckluft: 100, anblasen: 0,
        abteile: D.ABTEILE.map(() => ({ wasser: 0, rumpf: 100, pumpe: true })),
        schotten: D.ABTEILE.slice(0, -1).map(() => false), // true = geschlossen
        rohre: ['G7e', 'G7e', 'G7a', 'G7a', 'G7e'], ladeTyp: 'G7e', echolot: false,
        reserveG7a: { torpedos: 2, torpedosHeck: 0, torpedosDeck: 2 }, ladeFortschritt: 0, heckFortschritt: 0, deckUebernahme: null, teileRest: 0,
        upgrades: { pumpen: 0, batterie: 0, rumpf: 0 }, ausbau: {},
      },
      ladung: { diesel: 135000, torpedos: 6, torpedosHeck: 1, torpedosDeck: 2, proviant: 3500, konserven: 5000, ersatzteile: 20, batteriezelle: 0, druckflasche: 1, sanitaet: 2, munition88: 205, munitionFlak: 1500 },
      crew,
      schichten: D.STANDARD_SCHICHTEN.map((p) => p.slice()),
      schiffe: [],
      torpedos: [],
      funk: { anfrage: null, nachrichten: [] },
      missionen: [],
      ziel: null,               // ausgewähltes Schiff für Torpedo
      gesteuert: null,          // Crew-ID unter direkter Kontrolle
      statistik: { versenkt: 0, auftraege: 0, tote: 0 },
      log: [{ zeit: 12 * 60, text: 'Boot liegt am Marinehauptstützpunkt. Funken Sie den Stützpunkt an, um einen Auftrag zu erhalten.', art: 'info' }],
      verloren: null,
      naechsteStunde: 13 * 60,
    };
  }

  /* Ältere Spielstände um neue Felder ergänzen. */
  function ergaenze(st) {
    for (const k of Object.keys(D.INVENTAR)) if (typeof st.ladung[k] !== 'number') st.ladung[k] = 0;
    if (!st.boot.ausbau) st.boot.ausbau = {};
    if (st.boot.zielM == null) st.boot.zielM = D.TIEFEN[st.boot.zielTiefe || 0].m;
    while (st.schichten.length < D.STANDARD_SCHICHTEN.length) st.schichten.push(D.STANDARD_SCHICHTEN[st.schichten.length].slice());
    return st;
  }

  S.zustand = { neuesSpiel, ergaenze, neuesCrewmitglied, freizeitPlatz, neuerName, zufall };
})(window.Spiel = window.Spiel || {});
