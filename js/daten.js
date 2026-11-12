/* Sehrohrtiefe – feste Spieldaten: Abteile, Rollen, Posten, Tiefen, Karte, Waren. */
(function (S) {
  'use strict';

  /* Bootsgeometrie in Pixeln (Bootsgrafik ist 660 × 150 Pixel groß). Heck links, Bug rechts. */
  const BOOT = { B: 660, H: 150, DECKE_Y: 70, BODEN_Y: 110, WASSERLINIE_Y: 60 };

  /* Typ VIIC, Heck links, Bug rechts. 1 Bootseinheit ≈ 10 cm (67,1 m Länge ≈ 660 Einheiten). */
  const ABTEILE = [
    { id: 'heck', name: 'Heck- & E-Maschinenraum', kurz: 'E-Maschinen', ort: 'im Heckraum', x0: 44, x1: 128 },
    { id: 'diesel', name: 'Dieselraum', kurz: 'Diesel', ort: 'im Dieselraum', x0: 128, x1: 224 },
    { id: 'uraum', name: 'Unteroffiziersraum & Kombüse', kurz: 'U-Raum', ort: 'im Unteroffiziersraum', x0: 224, x1: 297 },
    { id: 'zentrale', name: 'Zentrale', kurz: 'Zentrale', ort: 'in der Zentrale', x0: 297, x1: 376 },
    { id: 'funk', name: 'Funk- & Horchraum', kurz: 'Funk', ort: 'im Funkraum', x0: 376, x1: 410 },
    { id: 'offiziere', name: 'Offiziersraum', kurz: 'Offiziere', ort: 'im Offiziersraum', x0: 410, x1: 455 },
    { id: 'feldwebel', name: 'Oberfeldwebelraum', kurz: 'O-Feldwebel', ort: 'im Oberfeldwebelraum', x0: 455, x1: 494 },
    { id: 'bug', name: 'Bugtorpedoraum', kurz: 'Bugraum', ort: 'im Bugraum', x0: 494, x1: 606 },
  ];

  /* Feste Punkte der Bootsgrafik in Grafikpixeln (doppelte Auflösung), passend zu grafik/boot_querschnitt.png */
  const ANKER = {
    sehrohrX: 682, turmX0: 616, turmX1: 744,
    tiefenmesser: [614, 164], rechnerSchirm: [628, 190], funkLampen: [763, 170], horchSchirm: [802, 184], kombuese: [474, 180],
    bugRohre: [1197, 156], heckRohr: [96, 172], torpedoBug: [1000, 213], torpedoHeck: [96, 213],
    proviantBug: [1004, 154], proviantURaum: [500, 154],
  };

  /* Posten = Arbeitsplätze im Boot. "system" ist das, was der Posten bedient,
     "spezial" sind die Rollen, die ihn voll beherrschen (alle anderen arbeiten mit 50 %). */
  const POSTEN = {
    tiefenruder: { name: 'Tiefenruder', abteil: 'zentrale', x: 305, system: 'tauchen', spezial: ['li', 'tauch'] },
    torpedo: { name: 'Torpedo-Vorhalterechner', abteil: 'zentrale', x: 318, system: 'torpedo', spezial: ['wo1', 'kaleu', 'wo2'] },
    tauchzellen: { name: 'Tauchzellen-Ventile', abteil: 'zentrale', x: 331, system: 'tauchen', spezial: ['tauch', 'li'] },
    sehrohr: { name: 'Sehrohr', abteil: 'zentrale', x: 343, system: 'sehrohr', spezial: ['kaleu', 'wo1', 'wo2'] },
    ruder: { name: 'Seitenruder', abteil: 'zentrale', x: 356, system: 'ruder', spezial: ['ruder', 'nav'] },
    karte: { name: 'Kartentisch', abteil: 'zentrale', x: 368, system: 'navigation', spezial: ['nav', 'kaleu'] },
    funk: { name: 'Funkgerät', abteil: 'funk', x: 384, system: 'funk', spezial: ['funker'] },
    horch: { name: 'Horchgerät', abteil: 'funk', x: 401, system: 'sonar', spezial: ['soni'] },
    diesel: { name: 'Diesel & Maschinentelegraf', abteil: 'diesel', x: 176, system: 'antrieb', spezial: ['maschinist', 'li'] },
    emaschine: { name: 'E-Maschine', abteil: 'heck', x: 100, system: 'antrieb', spezial: ['maschinist'] },
    heckrohr: { name: 'Heckrohr nachladen', abteil: 'heck', x: 56, system: 'heckladen', spezial: ['torpedo'] },
    lager: { name: 'Vorräte', abteil: 'uraum', x: 266, system: 'lager', spezial: ['logistik'] },
    kombuese: { name: 'Kombüse', abteil: 'uraum', x: 236, system: 'kombuese', spezial: ['smutje'] },
    bugraum: { name: 'Bugrohre nachladen', abteil: 'bug', x: 556, system: 'nachladen', spezial: ['torpedo'] },
    leckabwehr: { name: 'Leckabwehr (wandert zum Schaden)', abteil: null, x: null, system: 'reparatur', spezial: ['brand', 'vertau'] },
  };

  const SYSTEME = {
    tauchen: 'Tiefensteuerung', torpedo: 'Torpedo-Rechner', sehrohr: 'Sehrohr', ruder: 'Ruder',
    navigation: 'Navigation', funk: 'Funk', sonar: 'Horchgerät', antrieb: 'Antrieb',
    lager: 'Vorräte', kombuese: 'Kombüse', nachladen: 'Bugrohre laden', heckladen: 'Heckrohr laden', reparatur: 'Leckabwehr',
  };

  /* Kojen: o = 0 unten, 1 oben. off = Offizierskoje. 23 Kojen für 44 Mann – es wird geteilt (Hot Bunking). */
  const KOJEN = [
    { abteil: 'heck', x: 74, o: 0 }, { abteil: 'heck', x: 74, o: 1 },
    { abteil: 'uraum', x: 258, o: 0 }, { abteil: 'uraum', x: 258, o: 1 }, { abteil: 'uraum', x: 280, o: 0 }, { abteil: 'uraum', x: 280, o: 1 },
    { abteil: 'offiziere', x: 422, o: 0, off: true, vorhang: true }, { abteil: 'offiziere', x: 422, o: 1, off: true },
    { abteil: 'offiziere', x: 443, o: 0, off: true }, { abteil: 'offiziere', x: 443, o: 1, off: true },
    { abteil: 'feldwebel', x: 466, o: 0 }, { abteil: 'feldwebel', x: 466, o: 1 }, { abteil: 'feldwebel', x: 484, o: 0 }, { abteil: 'feldwebel', x: 484, o: 1 },
    { abteil: 'bug', x: 512, o: 0 }, { abteil: 'bug', x: 512, o: 1 }, { abteil: 'bug', x: 532, o: 0 }, { abteil: 'bug', x: 532, o: 1 },
    { abteil: 'bug', x: 552, o: 0 }, { abteil: 'bug', x: 552, o: 1 }, { abteil: 'bug', x: 572, o: 0 }, { abteil: 'bug', x: 572, o: 1 },
  ];

  /* Rollen (nach ubootworkshop.de, ohne Reporter und Schiffsjunge/-mädel) mit realistischer Stärke
     wie auf einem Typ-VIIC-Boot der Kriegsmarine: 44 Mann, davon 5 Offiziere.
     anzahl = Leute dieser Rolle an Bord, wache = Wache des ersten (weitere reihum über A–C; 3 = Tagesdienst),
     posten = Standard-Posten (eine Liste wird reihum verteilt), gefecht = Posten bei Gefechtsstationen. Reihenfolge = Reihen in grafik/crew_sheet.png. */
  const ROLLEN = {
    kaleu: { name: 'Kapitänleutnant', kurz: 'Kaleu', posten: 'sehrohr', anzahl: 1, wache: 0, farbe: '#f1ede2', offizier: true,
      text: 'Kommandant. Verantwortlich für Auftrag und Sicherheit aller an Bord.' },
    wo1: { name: '1. Wachoffizier', kurz: '1WO', posten: 'sehrohr', gefecht: 'torpedo', anzahl: 1, wache: 1, farbe: '#d8d2bf', offizier: true,
      text: 'Vertritt den Kaleu, führt eine Wache und leitet den Torpedoangriff.' },
    li: { name: 'Leitender Ingenieur', kurz: 'LI', posten: 'tiefenruder', anzahl: 1, wache: 0, farbe: '#c9b27a', offizier: true,
      text: 'Leitet Maschinenraum und Tauchstation. Hält das Boot auf Tiefe.' },
    nav: { name: 'Obersteuermann', kurz: 'NAV', posten: 'karte', anzahl: 1, wache: 1, farbe: '#9fb7c9', offizier: true,
      text: 'Führt Karte und Kurs, kann das Ruder übernehmen.' },
    brand: { name: 'Brandmeister', kurz: 'BM', posten: 'leckabwehr', anzahl: 2, wache: 0, farbe: '#c96a4a',
      text: 'Führt die Leckabwehr. Repariert schneller als alle anderen.' },
    funker: { name: 'Funker', kurz: 'Funker', posten: 'funk', anzahl: 3, wache: 0, farbe: '#7fae8a',
      text: 'Sendet, empfängt und entschlüsselt Funksprüche. Ein Funker pro Wache.' },
    logistik: { name: 'Logistik-Maat', kurz: 'Maat', posten: 'lager', anzahl: 1, wache: 3, farbe: '#b59a6a',
      text: 'Verwaltet Ersatzteile, Material und Proviant. Bringt beim Handeln Rabatt.' },
    maschinist: { name: 'Maschinist', kurz: 'Masch.', posten: ['diesel', 'emaschine'], anzahl: 14, wache: 0, farbe: '#8a8f96',
      text: 'Diesel- und E-Maschinen-Personal. Fast ein Drittel der Besatzung.' },
    tauch: { name: 'Tauchzellen-Gast', kurz: 'Tauch', posten: 'tauchzellen', anzahl: 3, wache: 0, farbe: '#6f9bb5',
      text: 'Regelt an der Tauchstation Tiefe und Tauchgeschwindigkeit.' },
    vertau: { name: 'Seemann', kurz: 'Seem.', posten: 'leckabwehr', anzahl: 4, wache: 1, farbe: '#8c7a5e',
      text: 'Im Hafen an den Leinen, auf See Ausguck, Leckabwehr und überall, wo Hände fehlen.' },
    ruder: { name: 'Rudergänger', kurz: 'Ruder', posten: 'ruder', anzahl: 3, wache: 0, farbe: '#a3b86c',
      text: 'Steuert das Boot und hält den Kurs. Einer pro Wache.' },
    soni: { name: 'Horchfunker', kurz: 'Soni', posten: 'horch', anzahl: 3, wache: 0, farbe: '#c2a0d0',
      text: 'Hört Schiffe am Horchgerät und erkennt sie an ihren Geräuschen.' },
    smutje: { name: 'Smutje', kurz: 'Smutje', posten: 'kombuese', anzahl: 1, wache: 3, farbe: '#e6e0d0',
      text: 'Kocht. Ohne Smutje schmeckt das Essen schlechter und die Moral sinkt.' },
    wo2: { name: '2. Wachoffizier', kurz: '2WO', posten: 'sehrohr', anzahl: 1, wache: 2, farbe: '#c8c2ae', offizier: true,
      text: 'Führt die dritte Wache und vertritt den 1WO.' },
    torpedo: { name: 'Torpedomechaniker', kurz: 'Torp.', posten: ['bugraum', 'heckrohr', 'bugraum', 'bugraum', 'bugraum'], anzahl: 5, wache: 0, farbe: '#b8833f',
      text: 'Wartet die Torpedos und lädt im Bugraum nach.' },
  };
  /* Der Admiral kommt erst mit Beobachter-Missionen an Bord (siehe README). */

  const SCHICHT_NAMEN = ['Wache A', 'Wache B', 'Wache C', 'Tagesdienst'];

  function plan(text) { return text.replace(/\s/g, '').split(''); }
  /* D = Dienst, S = Schlaf, F = Freizeit. Je 24 Stunden ab 00:00 UTC.
     Drei-Wachen-System: 4 Stunden Wache, 4 Stunden Schlaf, 4 Stunden frei – immer schläft nur ein Drittel. */
  const STANDARD_SCHICHTEN = [
    plan('DDDD SSSS FFFF DDDD SSSS FFFF'),
    plan('FFFF DDDD SSSS FFFF DDDD SSSS'),
    plan('SSSS FFFF DDDD SSSS FFFF DDDD'),
    plan('SSSSSS FDDDDD FDDDDD DFFFSS'),
  ];

  /* Typ VIIC: Prüftiefe 220 m, Zerstörungstiefe je nach Quelle 250–295 m. */
  const TIEFEN = [
    { id: 'oberflaeche', name: 'Oberfläche', m: 0 },
    { id: 'sehrohr', name: 'Sehrohrtiefe', m: 13 },
    { id: 'schleich', name: 'Schleichtiefe', m: 80 },
    { id: 'max', name: 'Prüftiefe', m: 220 },
  ];
  const ZERSTOERUNGSTIEFE = 260;
  const MAX_SICHER = 220;

  /* Typ VIIC: 17,7 kn aufgetaucht (2 × MAN-Diesel), 7,6 kn getaucht (2 × E-Maschine).
     diesel = Liter pro Minute, strom = Batterie-% pro Minute (Volle Fahrt getaucht leert sie in gut einer Stunde). */
  const FAHRT = [
    { name: 'Stopp', ueber: 0, unter: 0, diesel: 0.3, strom: 0.004 },
    { name: 'Kleine Fahrt', ueber: 5, unter: 2, diesel: 1, strom: 0.026 },
    { name: 'Halbe Fahrt', ueber: 10, unter: 4, diesel: 2.7, strom: 0.083 },
    { name: 'Volle Fahrt', ueber: 17.7, unter: 7.6, diesel: 12, strom: 1.4 },
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

  /* Waren, die man kaufen kann. paket = Menge pro Kauf. */
  const WAREN = {
    diesel: { name: 'Diesel', einheit: 'L', paket: 5000 },
    torpedos: { name: 'Torpedos', einheit: 'Stk', paket: 1 },
    proviant: { name: 'Proviant', einheit: 'Rationen', paket: 500 },
    konserven: { name: 'Konserven', einheit: 'Rationen', paket: 200 },
    ersatzteile: { name: 'Ersatzteile', einheit: 'Stk', paket: 5 },
    batteriezelle: { name: 'Batteriezelle', einheit: 'Stk', paket: 1 },
    druckflasche: { name: 'Druckluftflasche', einheit: 'Stk', paket: 1 },
    sanitaet: { name: 'Sanitätskasten', einheit: 'Stk', paket: 1 },
  };

  /* Stauraum wie auf einem VIIC – es gibt keinen Laderaum, alles ist im Boot verteilt.
     Torpedos: 5 in den Rohren, 6 Reserve im Bugraum, 1 im Heckraum, 2 in Oberdeckbehältern = 14.
     Diesel: rund 113 t ≈ 135 000 L in den Bunkern. Verpflegung (Proviant + Konserven) zusammen. */
  const STAURAUM = {
    diesel: { max: 135000, wo: 'Treibstoffbunker' },
    torpedos: { max: 6, wo: 'Bugraum (unter den Bodenplatten)' },
    torpedosHeck: { max: 1, wo: 'Heckraum' },
    torpedosDeck: { max: 2, wo: 'Oberdeckbehälter' },
    verpflegung: { max: 5000, wo: 'überall im Boot verstaut', waren: ['proviant', 'konserven'] },
    ersatzteile: { max: 60, wo: 'Werkzeugkisten' },
    batteriezelle: { max: 4, wo: 'Batterieraum' },
    druckflasche: { max: 6, wo: 'Zentrale' },
    sanitaet: { max: 6, wo: 'Offiziersraum' },
  };

  /* Inventar: Kategorie, Bild in grafik/inventar_items.png (x, Breite) und was der Gegenstand tut. */
  const INVENTAR = {
    torpedos: { name: 'Torpedos Bugraum', kat: 'waffen', bild: [0, 48], text: 'Reserve für die vier Bugrohre. Die Torpedomechaniker laden nach, sobald ein Rohr leer ist.' },
    torpedosHeck: { name: 'Torpedo Heckraum', kat: 'waffen', bild: [0, 48], text: 'Reserve für das Heckrohr. Wird im Heckraum nachgeladen.' },
    torpedosDeck: { name: 'Oberdeckbehälter', kat: 'waffen', bild: [0, 48], text: 'Zwei Torpedos in druckfesten Behältern unter dem Oberdeck. Nur aufgetaucht bei ruhiger Fahrt ins Boot zu holen – das dauert zwei Stunden.', aktion: 'Ins Boot übernehmen' },
    diesel: { kat: 'treibstoff', bild: [48, 24], text: 'Treibstoff für die Fahrt an der Oberfläche. Die Diesel laden dabei auch die Batterie.' },
    proviant: { kat: 'proviant', bild: [72, 24], text: 'Frisches Essen. Der Smutje kocht dreimal am Tag davon, so viele Rationen wie eingestellt.' },
    konserven: { kat: 'proviant', bild: [96, 24], text: 'Haltbar und verdirbt nicht im Wasser. Wird gegessen, wenn der frische Proviant aufgebraucht ist – macht etwas weniger satt und froh.' },
    ersatzteile: { kat: 'material', bild: [120, 24], text: 'Verbraucht die Leckabwehr beim Reparieren von Lecks und Rumpfschäden.' },
    batteriezelle: { kat: 'material', bild: [144, 24], text: 'Geladene Reservezelle. Einsetzen bringt sofort +30 % Batterie – auch getaucht.', aktion: 'Zelle einsetzen' },
    druckflasche: { kat: 'material', bild: [168, 24], text: 'Füllt die Druckluft fürs Notanblasen um +25 % auf – auch getaucht.', aktion: 'Anschließen' },
    sanitaet: { kat: 'material', bild: [192, 24], text: 'Wird automatisch benutzt, wenn jemand zu ertrinken droht: Er bekommt Luft und Zeit, sich zu retten.' },
  };
  const KATEGORIEN = [['alle', 'Alle'], ['waffen', 'Waffen'], ['treibstoff', 'Treibstoff'], ['proviant', 'Proviant'], ['material', 'Material']];

  /* Preise je Einheit; null = nicht im Angebot. Ankauf durch den Händler = 60 %. */
  const PREISE = {
    basis: { diesel: 0.02, torpedos: 600, proviant: 1, ersatzteile: 40, konserven: 1.5, batteriezelle: 300, druckflasche: 150, sanitaet: 120 },
    kalvik: { diesel: 0.03, torpedos: null, proviant: 0.8, ersatzteile: 50, konserven: 1.2, batteriezelle: 350, druckflasche: null, sanitaet: 150 },
    haendler: { diesel: 0.06, torpedos: null, proviant: 1.5, ersatzteile: 60, konserven: 2, batteriezelle: null, druckflasche: null, sanitaet: 180 },
  };
  const ANKAUF = 0.6;

  const UPGRADES = {
    pumpen: { name: 'Lenzpumpen', text: '+50 % Pumpleistung je Stufe', preise: [1500, 3000, 5000] },
    batterie: { name: 'Batterie', text: '−25 % Stromverbrauch je Stufe', preise: [1200, 2500, 4500] },
    rumpf: { name: 'Rumpfverstärkung', text: '−15 % Schaden und Lecks je Stufe', preise: [2000, 4000] },
  };

  /* Skilltree der Werft: 6 Äste mit je 3 Stufen, jede Stufe setzt die vorige voraus.
     upgrade: [Schlüssel in boot.upgrades, Stufe] – sonst ein Schalter in boot.ausbau. bild = Index in grafik/skill_symbole.png. */
  const SKILLTREE = [
    { id: 'rumpf', name: 'Rumpf', farbe: '#86a3a0', knoten: [
      { id: 'rumpf1', name: 'Rumpf I', bild: 0, preis: 2000, text: '−15 % Schaden und Lecks bei Treffern.', upgrade: ['rumpf', 1] },
      { id: 'rumpf2', name: 'Rumpf II', bild: 0, preis: 4000, text: 'Nochmals −15 % Schaden und Lecks.', upgrade: ['rumpf', 2] },
      { id: 'tieftauchen', name: 'Tieftauchen', bild: 1, preis: 6000, text: 'Sichere Tiefe 150 → 170 m, Zerstörungstiefe 220 → 240 m.' }] },
    { id: 'leck', name: 'Leckabwehr', farbe: '#6aa8c8', knoten: [
      { id: 'pumpen1', name: 'Lenzpumpen I', bild: 2, preis: 1500, text: '+50 % Pumpleistung.', upgrade: ['pumpen', 1] },
      { id: 'pumpen2', name: 'Lenzpumpen II', bild: 2, preis: 3000, text: 'Nochmals +50 % Pumpleistung.', upgrade: ['pumpen', 2] },
      { id: 'pumpen3', name: 'Lenzpumpen III', bild: 3, preis: 5000, text: 'Nochmals +50 % Pumpleistung.', upgrade: ['pumpen', 3] }] },
    { id: 'antrieb', name: 'Antrieb', farbe: '#4fc77c', knoten: [
      { id: 'batterie1', name: 'Batterie I', bild: 4, preis: 1200, text: '−25 % Stromverbrauch.', upgrade: ['batterie', 1] },
      { id: 'batterie2', name: 'Batterie II', bild: 4, preis: 2500, text: 'Nochmals −25 % Stromverbrauch.', upgrade: ['batterie', 2] },
      { id: 'diesel', name: 'Sparsame Diesel', bild: 5, preis: 4500, text: 'Batterie III (−25 % Strom) und −20 % Dieselverbrauch.', upgrade: ['batterie', 3] }] },
    { id: 'horch', name: 'Horchgerät', farbe: '#b8ffd0', knoten: [
      { id: 'horchweite', name: 'Horchweite', bild: 6, preis: 2000, text: 'Horchweite +25 %. Kontakte tauchen früher auf.' },
      { id: 'kartei', name: 'Kartei', bild: 7, preis: 3000, text: 'Der Horchraum zeigt die Übereinstimmung immer in Prozent, auch ohne Soni.' },
      { id: 'feingehoer', name: 'Feingehör', bild: 7, preis: 5000, text: 'Ab 90 % Aufnahme erkennt der Horcher den Kontakt selbst.' }] },
    { id: 'waffen', name: 'Waffen', farbe: '#ff8a6a', knoten: [
      { id: 'schnellladen', name: 'Schnellladen', bild: 9, preis: 2500, text: 'Nachladen im Bugraum 30 % schneller.' },
      { id: 'vorhalter', name: 'Vorhalterechner', bild: 8, preis: 3500, text: 'Torpedos treffen um 15 % besser.' },
      { id: 'reserve8', name: 'Torpedohalter', bild: 10, preis: 6000, text: 'Zwei zusätzliche Reserve-Torpedos im Bugraum (6 → 8).' }] },
    { id: 'funk', name: 'Funk & Crew', farbe: '#efd086', knoten: [
      { id: 'funkpeiler', name: 'Funkpeiler', bild: 11, preis: 1500, text: 'Das Sendeband des Stützpunkts ist auf der Skala markiert.' },
      { id: 'morse', name: 'Morse-Lehrgang', bild: 12, preis: 2500, text: 'Der Funker trägt die ersten 3 Zeichen eines Spruchs selbst ein.' },
      { id: 'kaffee', name: 'Bohnenkaffee', bild: 13, preis: 2000, text: '+2 Moral für alle jeden Morgen um 8 Uhr.' }] },
  ];

  const SCHIFFSTYPEN = {
    frachter: { name: 'Frachter', kn: 8, hp: 1, feind: true, kopfgeld: 500 },
    zerstoerer: { name: 'Zerstörer', kn: 12, jagdKn: 22, hp: 2, feind: true, kopfgeld: 1200 },
    haendler: { name: 'Händlerschiff', kn: 6, hp: 1, feind: false, kopfgeld: 0 },
  };

  /* Funk: Morsealphabet. Der Stützpunkt sendet zwischen 6 000 und 7 000 kHz. */
  const MORSE = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--',
    N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
    0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
  };
  const FUNK = { min: 4000, max: 9000, basisVon: 6000, basisBis: 7000, schwach: 60 };

  /* Horchgerät: Geräuschkartei. linien = Frequenzlinien im Wasserfall (0–200), takt = Zeilen pro Schraubenschlag,
     spitzen = Klangprofil [Band 0–23, Stärke], grund = Grundrauschen. Das U-Boot dient als Fehlerquelle. */
  const HORCH = {
    frachter: { name: 'Frachter', merkmal: 'Langsamer Takt ~80/min, tiefer Grundton, gleichmäßige Linien', linien: [[38, 1], [76, 0.7], [114, 0.45], [152, 0.3]], takt: 8, spitzen: [[4, 85], [9, 60], [14, 40], [19, 26]], grund: 10 },
    zerstoerer: { name: 'Zerstörer', merkmal: 'Schneller Takt ~220/min, hohe Töne, zwei Schrauben', linien: [[62, 0.8], [124, 1], [186, 0.6]], takt: 3, spitzen: [[7, 60], [14, 85], [21, 55]], grund: 14 },
    haendler: { name: 'Händler', merkmal: 'Dieselklopfen, unruhiger Takt ~130/min, Doppellinie', linien: [[30, 0.9], [90, 0.6], [100, 0.4]], takt: 5, spitzen: [[3, 75], [10, 50], [11, 40]], grund: 12 },
    uboot: { name: 'U-Boot', merkmal: 'Sehr leise, eine schwache Linie, Takt ~60/min', linien: [[50, 0.45]], takt: 11, spitzen: [[6, 30]], grund: 6 },
  };

  const VORNAMEN = ['Jonas', 'Karl', 'Emil', 'Oskar', 'Paul', 'Fritz', 'Hannes', 'Lukas', 'Moritz', 'Anton', 'Theo',
    'Jakob', 'Felix', 'Erik', 'Lene', 'Greta', 'Ida', 'Marta', 'Frieda', 'Nora', 'Wilma', 'Kurt', 'Bruno', 'Ole', 'Mats'];
  const NACHNAMEN = ['Brenner', 'Kowalski', 'Hartmann', 'Lindqvist', 'Vogt', 'Seidel', 'Albers', 'Petersen', 'Kraus',
    'Möller', 'Jansen', 'Dietrich', 'Behrens', 'Falk', 'Wendt', 'Engel', 'Röder', 'Thiel', 'Haas', 'Stark', 'Brandt', 'Lorenz'];

  function stufe(xp) { return Math.min(5, 1 + Math.floor(Math.sqrt(xp / 12))); }

  S.daten = {
    BOOT, ABTEILE, POSTEN, SYSTEME, KOJEN, ROLLEN, SCHICHT_NAMEN, STANDARD_SCHICHTEN, TIEFEN,
    ZERSTOERUNGSTIEFE, MAX_SICHER, FAHRT, WELT, LAND, HAEFEN, FEIND_NAME, WAREN, PREISE, ANKAUF, ANKER, STAURAUM,
    UPGRADES, SKILLTREE, INVENTAR, KATEGORIEN, SCHIFFSTYPEN, MORSE, FUNK, HORCH, VORNAMEN, NACHNAMEN, stufe,
  };
})(window.Spiel = window.Spiel || {});
