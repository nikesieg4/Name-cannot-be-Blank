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

  function neuesCrewmitglied(id, rolle, koje, benutzt) {
    const r = D.ROLLEN[rolle];
    const k = D.KOJEN[koje];
    return {
      id, rolle, name: neuerName(benutzt),
      posten: r.posten, schicht: r.schicht, koje,
      x: k.x, richtung: 1, laeuft: false, anim: 0,
      taetigkeit: 'frei', aktPosten: null,
      wach: 2 + Math.random() * 6, moral: 72, xp: Math.floor(Math.random() * 20), luft: 100,
      tot: false, befehl: null, messeX: 314 + Math.floor(Math.random() * 26),
    };
  }

  function neuesSpiel() {
    const benutzt = new Set();
    const crew = [];
    let id = 1;
    for (const rolle of Object.keys(D.ROLLEN)) crew.push(neuesCrewmitglied(id++, rolle, D.ROLLEN[rolle].koje, benutzt));
    // Startaufstellung passend zum Schichtplan um 12:00 UTC
    for (const c of crew) {
      const p = D.STANDARD_SCHICHTEN[c.schicht][12];
      if (p === 'D' && D.POSTEN[c.posten].x != null) c.x = D.POSTEN[c.posten].x;
      else if (p === 'F') c.x = c.messeX;
    }
    const basis = D.HAEFEN[0];
    return {
      version: 1,
      zeit: 12 * 60,           // Spielminuten seit Tag 1, 00:00 UTC
      tempo: 1,
      geld: 2500,
      ration: 3,
      alarm: false,
      naechsteId: id,
      boot: {
        x: basis.x + 4, y: basis.y - 2, kurs: 0, wegpunkt: null,
        tiefe: 0, zielTiefe: 0, fahrt: 0,
        batterie: 100, druckluft: 100, anblasen: 0,
        abteile: D.ABTEILE.map(() => ({ wasser: 0, rumpf: 100, pumpe: true })),
        schotten: D.ABTEILE.slice(0, -1).map(() => false), // true = geschlossen
        rohre: [true, true, true, true], ladeFortschritt: 0, teileRest: 0,
        upgrades: { pumpen: 0, batterie: 0, rumpf: 0 },
      },
      ladung: { diesel: 9000, torpedos: 6, proviant: 600, ersatzteile: 20 },
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

  S.zustand = { neuesSpiel, neuesCrewmitglied, neuerName, zufall };
})(window.Spiel = window.Spiel || {});
