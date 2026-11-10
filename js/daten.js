/* Sehrohrtiefe – feste Spieldaten: Abteile, Rollen, Posten, Tiefen, Karte, Waren. */
(function (S) {
  'use strict';

  /* Bootsgeometrie in Pixeln (Bootsgrafik ist 660 × 150 Pixel groß). Heck links, Bug rechts. */
  const BOOT = { B: 660, H: 150, DECKE_Y: 70, BODEN_Y: 110, WASSERLINIE_Y: 60 };

  const ABTEILE = [
    { id: 'heck', name: 'Heckraum', ort: 'im Heckraum', x0: 44, x1: 112 },
    { id: 'maschine', name: 'Maschinenraum', ort: 'im Maschinenraum', x0: 112, x1: 204 },
    { id: 'lager', name: 'Laderaum', ort: 'im Laderaum', x0: 204, x1: 268 },
    { id: 'mannschaft', name: 'Mannschaftsraum & Kombüse', ort: 'im Mannschaftsraum', x0: 268, x1: 360 },
    { id: 'zentrale', name: 'Zentrale', ort: 'in der Zentrale', x0: 360, x1: 460 },
    { id: 'funk', name: 'Funk- & Horchraum', ort: 'im Funk- und Horchraum', x0: 460, x1: 524 },
    { id: 'bug', name: 'Bugtorpedoraum', ort: 'im Bugtorpedoraum', x0: 524, x1: 606 },
  ];

  /* Posten = Arbeitsplätze im Boot. "system" ist das, was der Posten bedient,
     "spezial" sind die Rollen, die ihn voll beherrschen (alle anderen arbeiten mit 50 %). */
  const POSTEN = {
    tiefenruder: { name: 'Tiefenruder', abteil: 'zentrale', x: 370, system: 'tauchen', spezial: ['li', 'tauch'] },
    torpedo: { name: 'Torpedo-Vorhalterechner', abteil: 'zentrale', x: 384, system: 'torpedo', spezial: ['wo1', 'kaleu'] },
    tauchzellen: { name: 'Tauchzellen-Ventile', abteil: 'zentrale', x: 398, system: 'tauchen', spezial: ['tauch', 'li'] },
    sehrohr: { name: 'Sehrohr', abteil: 'zentrale', x: 412, system: 'sehrohr', spezial: ['kaleu', 'wo1'] },
    ruder: { name: 'Seitenruder', abteil: 'zentrale', x: 428, system: 'ruder', spezial: ['ruder', 'nav'] },
    karte: { name: 'Kartentisch', abteil: 'zentrale', x: 446, system: 'navigation', spezial: ['nav', 'kaleu'] },
    funk: { name: 'Funkgerät', abteil: 'funk', x: 472, system: 'funk', spezial: ['funker'] },
    horch: { name: 'Horchgerät', abteil: 'funk', x: 510, system: 'sonar', spezial: ['soni'] },
    diesel: { name: 'Diesel & Maschinentelegraf', abteil: 'maschine', x: 160, system: 'antrieb', spezial: ['maschinist'] },
    emaschine: { name: 'E-Maschine', abteil: 'heck', x: 92, system: 'antrieb', spezial: ['maschinist', 'vertau'] },
    lager: { name: 'Lagerverwaltung', abteil: 'lager', x: 236, system: 'lager', spezial: ['logistik'] },
    kombuese: { name: 'Kombüse', abteil: 'mannschaft', x: 346, system: 'kombuese', spezial: ['smutje'] },
    bugraum: { name: 'Torpedo-Nachladen', abteil: 'bug', x: 556, system: 'nachladen', spezial: [] },
    leckabwehr: { name: 'Leckabwehr (wandert zum Schaden)', abteil: null, x: null, system: 'reparatur', spezial: ['brand', 'vertau'] },
  };

  const SYSTEME = {
    tauchen: 'Tiefensteuerung', torpedo: 'Torpedo-Rechner', sehrohr: 'Sehrohr', ruder: 'Ruder',
    navigation: 'Navigation', funk: 'Funk', sonar: 'Horchgerät', antrieb: 'Antrieb',
    lager: 'Lager', kombuese: 'Kombüse', nachladen: 'Nachladen', reparatur: 'Leckabwehr',
  };

  /* Kojen: o = 0 unten, 1 oben. */
  const KOJEN = [
    { abteil: 'bug', x: 540, o: 0 }, { abteil: 'bug', x: 540, o: 1 },
    { abteil: 'bug', x: 562, o: 0 }, { abteil: 'bug', x: 562, o: 1 },
    { abteil: 'bug', x: 584, o: 0 }, { abteil: 'bug', x: 584, o: 1 },
    { abteil: 'mannschaft', x: 282, o: 0 }, { abteil: 'mannschaft', x: 282, o: 1 },
    { abteil: 'mannschaft', x: 304, o: 0 }, { abteil: 'mannschaft', x: 304, o: 1 },
    { abteil: 'funk', x: 490, o: 0 }, { abteil: 'funk', x: 490, o: 1 },
    { abteil: 'heck', x: 60, o: 0 }, { abteil: 'heck', x: 60, o: 1 },
  ];

  /* Alle Rollen von ubootworkshop.de außer Reporter und Schiffsjunge/-mädel.
     schicht: 0 = Wache A, 1 = Wache B, 2 = Tagesdienst. koje = Index in KOJEN. */
  const ROLLEN = {
    kaleu: { name: 'Kapitänleutnant', kurz: 'Kaleu', posten: 'sehrohr', schicht: 0, koje: 10, farbe: '#f1ede2', offizier: true,
      text: 'Kommandant. Verantwortlich für Auftrag und Sicherheit aller an Bord.' },
    wo1: { name: '1. Wachoffizier', kurz: '1WO', posten: 'torpedo', schicht: 1, koje: 11, farbe: '#d8d2bf', offizier: true,
      text: 'Vertritt den Kaleu, gibt Befehle weiter und leitet den Torpedoangriff.' },
    li: { name: 'Leitender Ingenieur', kurz: 'LI', posten: 'tiefenruder', schicht: 0, koje: 12, farbe: '#c9b27a', offizier: true,
      text: 'Leitet Maschinenraum und Tauchstation. Hält das Boot auf Tiefe.' },
    nav: { name: 'Navigationsoffizier', kurz: 'NAV', posten: 'ruder', schicht: 1, koje: 13, farbe: '#9fb7c9', offizier: true,
      text: 'Führt Karte und Kurs, leitet Funk, Horchraum und Ruder.' },
    brand: { name: 'Brandmeister', kurz: 'BM', posten: 'leckabwehr', schicht: 2, koje: 6, farbe: '#c96a4a',
      text: 'Führt die Leckabwehr. Repariert schneller als alle anderen.' },
    funker: { name: 'Funker-Obermaat', kurz: 'Funker', posten: 'funk', schicht: 0, koje: 7, farbe: '#7fae8a',
      text: 'Sendet, empfängt und entschlüsselt Funksprüche.' },
    logistik: { name: 'Logistik-Maat', kurz: 'Maat', posten: 'lager', schicht: 2, koje: 8, farbe: '#b59a6a',
      text: 'Verwaltet Ersatzteile, Material und Proviant. Bringt beim Handeln Rabatt.' },
    maschinist: { name: 'Maschinist', kurz: 'Masch.', posten: 'diesel', schicht: 0, koje: 9, farbe: '#8a8f96',
      text: 'Bedient den Maschinentelegrafen und die Diesel.' },
    tauch: { name: 'Tauchzellen-Gast', kurz: 'Tauch', posten: 'tauchzellen', schicht: 1, koje: 0, farbe: '#6f9bb5',
      text: 'Regelt an der Tauchstation Tiefe und Tauchgeschwindigkeit.' },
    vertau: { name: 'Vertäuungs-Gast', kurz: 'Vertäu', posten: 'emaschine', schicht: 1, koje: 1, farbe: '#8c7a5e',
      text: 'Im Hafen für Leinen zuständig, auf See an der E-Maschine und in der Leckabwehr.' },
    ruder: { name: 'Rudergänger', kurz: 'Ruder', posten: 'ruder', schicht: 0, koje: 2, farbe: '#a3b86c',
      text: 'Steuert das Boot und hält den Kurs.' },
    soni: { name: 'Horchfunker', kurz: 'Soni', posten: 'horch', schicht: 1, koje: 3, farbe: '#c2a0d0',
      text: 'Hört Schiffe am Horchgerät und erkennt sie an ihren Geräuschen.' },
    smutje: { name: 'Smutje', kurz: 'Smutje', posten: 'kombuese', schicht: 2, koje: 4, farbe: '#e6e0d0',
      text: 'Kocht. Ohne Smutje schmeckt das Essen schlechter und die Moral sinkt.' },
  };
  /* Der Admiral kommt erst mit Beobachter-Missionen an Bord (siehe README). */

  const SCHICHT_NAMEN = ['Wache A', 'Wache B', 'Tagesdienst'];

  function plan(text) { return text.replace(/\s/g, '').split(''); }
  /* D = Dienst, S = Schlaf, F = Freizeit. Je 24 Stunden ab 00:00 UTC. */
  const STANDARD_SCHICHTEN = [
    plan('DDDDDD SSSSSS DDDDDD FFFFFF'),
    plan('SSSSSS DDDDDD FFFFFF DDDDDD'),
    plan('SSSSSS FDDDDD FDDDDD DFFFSS'),
  ];

  const TIEFEN = [
    { id: 'oberflaeche', name: 'Oberfläche', m: 0 },
    { id: 'sehrohr', name: 'Sehrohrtiefe', m: 12 },
    { id: 'schleich', name: 'Schleichtiefe', m: 60 },
    { id: 'max', name: 'Max. sichere Tiefe', m: 150 },
  ];
  const ZERSTOERUNGSTIEFE = 220;
  const MAX_SICHER = 150;

  const FAHRT = [
    { name: 'Stopp', ueber: 0, unter: 0, diesel: 0.4, strom: 0.004 },
    { name: 'Kleine Fahrt', ueber: 5, unter: 2, diesel: 2, strom: 0.035 },
    { name: 'Halbe Fahrt', ueber: 10, unter: 4, diesel: 4, strom: 0.08 },
    { name: 'Volle Fahrt', ueber: 16, unter: 7, diesel: 8, strom: 0.2 },
  ];

  /* Karte: 300 × 200 km, 1 Pixel = 1 km. */
  const WELT = { B: 300, H: 200, PLAN: 30 };
  const LAND = [
    [[0, 0], [24, 0], [30, 40], [22, 80], [32, 120], [26, 150], [40, 175], [30, 200], [0, 200]],
    [[120, 80], [140, 70], [158, 82], [150, 104], [128, 108]],
    [[140, 0], [220, 0], [214, 18], [190, 26], [160, 22]],
    [[300, 0], [300, 200], [262, 200], [270, 160], [258, 120], [272, 80], [262, 40], [276, 0]],
  ];
  const HAEFEN = [
    { id: 'basis', name: 'Marinehauptstützpunkt', x: 38, y: 162, typ: 'basis' },
    { id: 'kalvik', name: 'Freihafen Kalvik', x: 182, y: 31, typ: 'frei' },
  ];
  const FEIND_NAME = 'Vardanien';

  const WAREN = {
    diesel: { name: 'Diesel', einheit: 'L', le: 1 / 100, paket: 500 },
    torpedos: { name: 'Torpedos', einheit: 'Stk', le: 5, paket: 1 },
    proviant: { name: 'Proviant', einheit: 'Rationen', le: 1 / 20, paket: 50 },
    ersatzteile: { name: 'Ersatzteile', einheit: 'Stk', le: 1 / 2, paket: 5 },
  };
  const LADERAUM_LE = 200;

  /* Preise je Einheit; null = nicht im Angebot. Ankauf durch den Händler = 60 %. */
  const PREISE = {
    basis: { diesel: 0.8, torpedos: 600, proviant: 3, ersatzteile: 40 },
    kalvik: { diesel: 0.6, torpedos: null, proviant: 2.5, ersatzteile: 50 },
    haendler: { diesel: 1.1, torpedos: null, proviant: 4, ersatzteile: 60 },
  };
  const ANKAUF = 0.6;

  const UPGRADES = {
    pumpen: { name: 'Lenzpumpen', text: '+50 % Pumpleistung je Stufe', preise: [1500, 3000, 5000] },
    batterie: { name: 'Batterie', text: '−25 % Stromverbrauch je Stufe', preise: [1200, 2500, 4500] },
    rumpf: { name: 'Rumpfverstärkung', text: '−15 % Schaden und Lecks je Stufe', preise: [2000, 4000] },
  };

  const SCHIFFSTYPEN = {
    frachter: { name: 'Frachter', kn: 8, hp: 1, feind: true, kopfgeld: 500 },
    zerstoerer: { name: 'Zerstörer', kn: 12, jagdKn: 22, hp: 2, feind: true, kopfgeld: 1200 },
    haendler: { name: 'Händlerschiff', kn: 6, hp: 1, feind: false, kopfgeld: 0 },
  };

  const VORNAMEN = ['Jonas', 'Karl', 'Emil', 'Oskar', 'Paul', 'Fritz', 'Hannes', 'Lukas', 'Moritz', 'Anton', 'Theo',
    'Jakob', 'Felix', 'Erik', 'Lene', 'Greta', 'Ida', 'Marta', 'Frieda', 'Nora', 'Wilma', 'Kurt', 'Bruno', 'Ole', 'Mats'];
  const NACHNAMEN = ['Brenner', 'Kowalski', 'Hartmann', 'Lindqvist', 'Vogt', 'Seidel', 'Albers', 'Petersen', 'Kraus',
    'Möller', 'Jansen', 'Dietrich', 'Behrens', 'Falk', 'Wendt', 'Engel', 'Röder', 'Thiel', 'Haas', 'Stark', 'Brandt', 'Lorenz'];

  function stufe(xp) { return Math.min(5, 1 + Math.floor(Math.sqrt(xp / 12))); }

  S.daten = {
    BOOT, ABTEILE, POSTEN, SYSTEME, KOJEN, ROLLEN, SCHICHT_NAMEN, STANDARD_SCHICHTEN, TIEFEN,
    ZERSTOERUNGSTIEFE, MAX_SICHER, FAHRT, WELT, LAND, HAEFEN, FEIND_NAME, WAREN, LADERAUM_LE, PREISE, ANKAUF,
    UPGRADES, SCHIFFSTYPEN, VORNAMEN, NACHNAMEN, stufe,
  };
})(window.Spiel = window.Spiel || {});
