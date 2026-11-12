/* Sehrohrtiefe – feste Spieldaten: Abteile, Rollen, Posten, Tiefen, Karte, Waren. */
(function (S) {
  'use strict';

  /* Bootsgeometrie in Pixeln (Bootsgrafik ist 660 × 150 Pixel groß). Heck links, Bug rechts. */
  const BOOT = { B: 660, H: 150, DECKE_Y: 70, BODEN_Y: 110, WASSERLINIE_Y: 60 };

  /* Typ VII C nach dem Handbuch: acht Abteilungen im Druckkörper von 50,5 m (Heck links, Bug rechts).
     Bootseinheiten: 562 Einheiten Innenraum ≈ 50,5 m Druckkörper (≈ 11 Einheiten pro Meter). */
  const ABTEILE = [
    { id: 'heck', name: 'E-Maschinenraum', kurz: 'E-Raum', ort: 'im E-Maschinenraum', x0: 44, x1: 116 },
    { id: 'diesel', name: 'Dieselraum', kurz: 'Diesel', ort: 'im Dieselraum', x0: 116, x1: 211 },
    { id: 'kombuese', name: 'Kombüse', kurz: 'Kombüse', ort: 'in der Kombüse', x0: 211, x1: 239 },
    { id: 'uraum', name: 'Unteroffiziersraum', kurz: 'U-Raum', ort: 'im Unteroffiziersraum', x0: 239, x1: 295 },
    { id: 'zentrale', name: 'Zentrale', kurz: 'Zentrale', ort: 'in der Zentrale', x0: 295, x1: 373 },
    { id: 'funk', name: 'Kommandant, Funk & Horch', kurz: 'Funk', ort: 'im Funkraum', x0: 373, x1: 406 },
    { id: 'offiziere', name: 'Offiziersraum', kurz: 'Offiziere', ort: 'im Offiziersraum', x0: 406, x1: 484 },
    { id: 'bug', name: 'Bugtorpedoraum', kurz: 'Bugraum', ort: 'im Bugraum', x0: 484, x1: 606 },
  ];
  /* Batterie I liegt unter dem Offiziersraum, Batterie II unter dem Unteroffiziersraum (Chlorgas bei Seewasser). */
  const BATTERIERAEUME = ['offiziere', 'uraum'];

  /* Feste Punkte der Bootsgrafik in Grafikpixeln (doppelte Auflösung), passend zu grafik/boot_querschnitt.png */
  const ANKER = {
    sehrohrX: 660, turmX0: 610, turmX1: 740, kielY: 276,
    tiefenmesser: [610, 164], rechnerSchirm: [674, 190], funkLampen: [757, 170], horchSchirm: [796, 200], kombuese: [450, 180],
    bugRohre: [1197, 156], heckRohr: [96, 172], torpedoBug: [980, 213], torpedoHeck: [100, 213],
    proviantBug: [990, 154], proviantURaum: [484, 154], heckSchraube: 24,
  };

  /* Posten = Arbeitsplätze im Boot. "system" ist das, was der Posten bedient,
     "spezial" sind die Rollen, die ihn voll beherrschen (alle anderen arbeiten mit 50 %). */
  const POSTEN = {
    tiefenruder: { name: 'Tiefenruderstand', abteil: 'zentrale', x: 303, system: 'tauchen', spezial: ['li', 'tauch', 'seemann'] },
    tauchzellen: { name: 'Flut- und Entlüftungsventile', abteil: 'zentrale', x: 318, system: 'tauchen', spezial: ['tauch', 'li'] },
    sehrohr: { name: 'Sehrohr / Brückenwache', abteil: 'zentrale', x: 330, system: 'sehrohr', spezial: ['kaleu', 'wo1', 'wo2', 'nav'] },
    torpedo: { name: 'Torpedovorhaltrechner (Turm)', abteil: 'zentrale', x: 342, system: 'torpedo', spezial: ['wo1', 'kaleu'] },
    ruder: { name: 'Rudergeber (Turm)', abteil: 'zentrale', x: 360, system: 'ruder', spezial: ['ruder', 'seemann', 'nav'] },
    karte: { name: 'Kartentisch', abteil: 'zentrale', x: 369, system: 'navigation', spezial: ['nav', 'kaleu'] },
    funk: { name: 'Funkgerät', abteil: 'funk', x: 380, system: 'funk', spezial: ['funker'] },
    horch: { name: 'Horchgerät (GHG)', abteil: 'funk', x: 396, system: 'sonar', spezial: ['soni', 'funker'] },
    diesel: { name: 'Diesel & Maschinentelegraf', abteil: 'diesel', x: 164, system: 'antrieb', spezial: ['diesel', 'li'] },
    emaschine: { name: 'Fahrschalter E-Maschinen', abteil: 'heck', x: 92, system: 'antrieb', spezial: ['emasch', 'li'] },
    heckrohr: { name: 'Heckrohr nachladen', abteil: 'heck', x: 56, system: 'heckladen', spezial: ['torpedo'] },
    kombuese: { name: 'Kombüse', abteil: 'kombuese', x: 225, system: 'kombuese', spezial: ['smut'] },
    bugraum: { name: 'Bugrohre nachladen', abteil: 'bug', x: 586, system: 'nachladen', spezial: ['torpedo'] },
    leckabwehr: { name: 'Leckabwehr (wandert zum Schaden)', abteil: null, x: null, system: 'reparatur', spezial: ['bootsmann', 'seemann', 'diesel', 'emasch'] },
  };

  const SYSTEME = {
    tauchen: 'Tiefensteuerung', torpedo: 'Torpedo-Rechner', sehrohr: 'Sehrohr', ruder: 'Ruder',
    navigation: 'Navigation', funk: 'Funk', sonar: 'Horchgerät', antrieb: 'Antrieb',
    kombuese: 'Kombüse', nachladen: 'Bugrohre laden', heckladen: 'Heckrohr laden', reparatur: 'Leckabwehr',
  };

  /* Kojen: o = 0 unten, 1 oben, 2 = Hängematte. off = Offizierskoje, vorhang = Kommandantenkoje.
     Bugraum: Kojen und Hängematten für die Mannschaft, Offiziersraum: LI, I. und II. WO (und Obersteuermann),
     Kommandant hinter dem Vorhang neben Funk und Horcher, Unteroffiziersraum: Maate. Geteilt wird „warm“. */
  const KOJEN = [
    { abteil: 'uraum', x: 252, o: 0 }, { abteil: 'uraum', x: 252, o: 1 }, { abteil: 'uraum', x: 274, o: 0 }, { abteil: 'uraum', x: 274, o: 1 },
    { abteil: 'funk', x: 396, o: 1, off: true, vorhang: true, kdt: true },
    { abteil: 'offiziere', x: 418, o: 0, off: true }, { abteil: 'offiziere', x: 418, o: 1, off: true },
    { abteil: 'offiziere', x: 437, o: 0, off: true }, { abteil: 'offiziere', x: 437, o: 1, off: true },
    { abteil: 'offiziere', x: 470, o: 0 }, { abteil: 'offiziere', x: 470, o: 1 },
    { abteil: 'bug', x: 498, o: 0 }, { abteil: 'bug', x: 498, o: 1 }, { abteil: 'bug', x: 516, o: 0 }, { abteil: 'bug', x: 516, o: 1 },
    { abteil: 'bug', x: 534, o: 0 }, { abteil: 'bug', x: 534, o: 1 }, { abteil: 'bug', x: 552, o: 0 }, { abteil: 'bug', x: 552, o: 1 },
    { abteil: 'bug', x: 570, o: 0 }, { abteil: 'bug', x: 570, o: 1 },
    { abteil: 'bug', x: 507, o: 2 }, { abteil: 'bug', x: 561, o: 2 },
  ];

  /* Besatzung nach dem Handbuch (Kap. 9): rund 50 Mann – 4 Offiziere, Portepee-Unteroffiziere, Maate und Mannschaften.
     Der Kommandant geht keine feste Wache (Tagesdienst), ist aber bei jedem Alarm da.
     anzahl = Leute dieser Rolle, wache = Wache des ersten (weitere reihum über A–C; 3 = Tagesdienst),
     posten = Standard-Posten (eine Liste wird reihum verteilt), gefecht = Posten bei Gefechtsstationen.
     Reihenfolge = Reihen in grafik/crew_sheet.png. */
  const ROLLEN = {
    kaleu: { name: 'Kommandant', kurz: 'Kdt.', posten: 'sehrohr', anzahl: 1, wache: 3, farbe: '#f1ede2', offizier: true,
      text: 'Kapitänleutnant oder Oberleutnant zur See („der Alte“). Gesamtverantwortung, keine feste Wache, führt jeden getauchten Angriff selbst am Sehrohr.' },
    wo1: { name: 'I. Wachoffizier', kurz: 'I. WO', posten: 'sehrohr', gefecht: 'torpedo', anzahl: 1, wache: 0, farbe: '#d8d2bf', offizier: true,
      text: 'Stellvertreter des Kommandanten. 1. Brückenwache, Torpedowaffe und Vorhaltrechner, Schlüsselunterlagen.' },
    wo2: { name: 'II. Wachoffizier', kurz: 'II. WO', posten: 'sehrohr', anzahl: 1, wache: 1, farbe: '#c8c2ae', offizier: true,
      text: '2. Brückenwache, Geschützführer und Flak, Funkpersonal, entschlüsselt Offizierssprüche.' },
    li: { name: 'Leitender Ingenieur', kurz: 'LI', posten: 'tiefenruder', anzahl: 1, wache: 3, farbe: '#c9b27a', offizier: true,
      text: 'Tauchen, Einsteuern und Trimmen, gesamte Maschinenanlage, Leckabwehr. Station hinter den Tiefenrudergängern.' },
    nav: { name: 'Obersteuermann', kurz: 'Ostm.', posten: 'sehrohr', gefecht: 'karte', anzahl: 1, wache: 2, farbe: '#9fb7c9',
      text: 'Portepee-Unteroffizier, erfahrenster Seemann an Bord. Navigation, 3. Brückenwache, Proviant und Frischwasser.' },
    bootsmann: { name: 'Bootsmann', kurz: 'Bootsm.', posten: 'leckabwehr', anzahl: 1, wache: 0, farbe: '#c96a4a',
      text: '„Nummer Eins“. Seemännischer Dienst, Disziplin, Stauen von Proviant, leitet die Arbeit an Deck und die Leckabwehr.' },
    diesel: { name: 'Dieselpersonal', kurz: 'Diesel', posten: 'diesel', anzahl: 10, wache: 0, farbe: '#8a8f96',
      text: 'Diesel-Obermaschinist, Dieselmaate und Heizer. Betrieb und Pflege der beiden Diesel, Kompressoren und Kupplungen.' },
    emasch: { name: 'E-Personal', kurz: 'E-Masch.', posten: 'emaschine', anzahl: 6, wache: 0, farbe: '#6f8fae',
      text: 'E-Obermaschinist, E-Maate und E-Heizer. E-Maschinen, Fahrschalter, Batterien und Bordnetz.' },
    tauch: { name: 'Zentralegast', kurz: 'Zentr.', posten: 'tauchzellen', anzahl: 3, wache: 0, farbe: '#6f9bb5',
      text: 'Zentralemaat und Zentralegasten: Flut-, Entlüftungs- und Anblaseventile, Lenz- und Trimmpumpe, Regelzellen.' },
    ruder: { name: 'Rudergänger', kurz: 'Ruder', posten: 'ruder', anzahl: 3, wache: 0, farbe: '#a3b86c',
      text: 'Seitenruder am Rudergeber im Turm. Kursbefehle wiederholen und ausführen.' },
    torpedo: { name: 'Torpedomixer', kurz: 'Mixer', posten: ['bugraum', 'heckrohr', 'bugraum', 'bugraum', 'bugraum'], anzahl: 5, wache: 0, farbe: '#b8833f',
      text: 'Torpedomechaniker und Torpedogasten: Pflege, Einstellung und Laden der Aale, Rohre klarmachen.' },
    funker: { name: 'Funker', kurz: 'Funker', posten: 'funk', anzahl: 3, wache: 0, farbe: '#7fae8a',
      text: 'Funkmaat und Funkgefreiter: Funkempfang, Enigma, Sanitätsdienst. Getaucht auch Horcher.' },
    soni: { name: 'Horcher', kurz: 'Horcher', posten: 'horch', anzahl: 3, wache: 0, farbe: '#c2a0d0',
      text: 'Funker mit Horchausbildung am Gruppenhorchgerät (GHG). Getaucht die einzigen „Augen“ des Bootes.' },
    seemann: { name: 'Seemann', kurz: 'Seem.', posten: ['tiefenruder', 'leckabwehr', 'tiefenruder', 'leckabwehr', 'tiefenruder', 'leckabwehr', 'ruder', 'leckabwehr', 'tiefenruder', 'leckabwehr'], anzahl: 10, wache: 0, farbe: '#8c7a5e',
      text: 'Bootsmaate, Matrosengefreite, Matrosen: Ausguck, Tiefenruder, Rudergang, Geschütz und Flak, Leckabwehr.' },
    smut: { name: 'Smut', kurz: 'Smut', posten: 'kombuese', anzahl: 1, wache: 3, farbe: '#e6e0d0',
      text: 'Kocht für rund 50 Mann auf zwei Kochplatten, drei Mahlzeiten am Tag nach Wachen. Frischware zuerst, dann Konserven.' },
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

  /* Tauchtiefen nach dem Handbuch (Kap. 4.1): Konstruktionstauchtiefe 100 m (dauerhaft zulässig),
     Prüfungstauchtiefe 165 m (nur im Notfall), rechnerische Zerstörungstiefe 250 m (real oft etwas mehr). */
  const TIEFEN = [
    { id: 'oberflaeche', name: 'Oberfläche', m: 0 },
    { id: 'sehrohr', name: 'Sehrohrtiefe', m: 13 },
    { id: 'konstruktion', name: 'Konstruktionstiefe', m: 100 },
    { id: 'pruef', name: 'Prüfungstiefe', m: 165 },
  ];
  const KONSTRUKTIONSTIEFE = 100;
  const MAX_SICHER = 165;
  const ZERSTOERUNGSTIEFE = 250;

  /* Maschinenkommandos (Kap. 5): Stopp – Schleichfahrt – Langsame – Halbe – Große Fahrt – Äußerste Kraft.
     Leistung ~ v³: Treiböl so, dass 6.500 sm bei 12 kn reichen (≈ 4,2 L/min), Batterie so, dass 80 sm bei 4 kn reichen (20 h).
     diesel = Liter pro Minute aufgetaucht, strom = Batterie-% pro Minute getaucht. */
  function dieselVerbrauch(kn) { return 0.25 + 3.9 * Math.pow(kn / 12, 3); }
  function stromVerbrauch(kn) { return 0.004 + 0.079 * Math.pow(kn / 4, 3) * (kn > 6 ? 1.4 : 1); }
  const FAHRT = [
    { name: 'Stopp', kurz: 'Stopp', ueber: 0, unter: 0 },
    { name: 'Schleichfahrt', kurz: 'Schleich', ueber: 3, unter: 2, leise: true },
    { name: 'Langsame Fahrt', kurz: 'Langsam', ueber: 6, unter: 3 },
    { name: 'Halbe Fahrt', kurz: 'Halbe', ueber: 10, unter: 4 },
    { name: 'Große Fahrt', kurz: 'Große', ueber: 14, unter: 6 },
    { name: 'Äußerste Kraft', kurz: 'AK', ueber: 17.6, unter: 7.6 },
  ].map((f) => ({ ...f, diesel: dieselVerbrauch(f.ueber), strom: stromVerbrauch(f.unter) }));

  /* Karte: 300 × 200 km, 1 Pixel = 1 km. */
  const WELT = { B: 300, H: 200, GROSS: 100 };
  /* Großquadrate der Marinequadratkarte (je 100 km) */
  const GROSSQUADRATE = [['AM', 'AN', 'AO'], ['BE', 'BF', 'BG']];
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

  /* Torpedos (Handbuch Kap. 6.2). stufen = Fahrt in kn und Laufstrecke in km; blasen = sichtbare Blasenbahn. */
  const TORPEDOTYPEN = {
    G7e: { name: 'G7e (T II/III)', kurz: 'G7e', stufen: [[30, 5]], blasen: false, text: 'Elektrisch, keine Blasenbahn – für den Tagangriff getaucht.' },
    G7a: { name: 'G7a (T I)', kurz: 'G7a', stufen: [[44, 5], [40, 7.5], [30, 12.5]], blasen: true, text: 'Dampf-Gas, schnell, aber mit sichtbarer Blasenbahn – nachts bevorzugt.' },
  };
  const VERSAGER = 0.1;        // Frühzünder, Tiefgänger, Aufschlagzünder ohne Zündung („Torpedokrise“)
  const WABO_LAERM = 0.3;      // Pumpen und Echolot verraten das Boot

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
    munition88: { name: 'Munition 8,8 cm', einheit: 'Schuss', paket: 25 },
  };

  /* Stauraum wie auf einem VIIC – es gibt keinen Laderaum, alles ist im Boot verteilt.
     Torpedos: 5 in den Rohren, 6 Reserve im Bugraum, 1 im Heckraum, 2 in Oberdeckbehältern = 14.
     Diesel: rund 113 t ≈ 135 000 L in den Bunkern. Verpflegung (Proviant + Konserven) zusammen. */
  const STAURAUM = {
    diesel: { max: 135000, wo: 'Treibstoffbunker' },
    torpedos: { max: 6, wo: 'Bugraum (unter den Bodenplatten)' },
    torpedosHeck: { max: 1, wo: 'Heckraum' },
    torpedosDeck: { max: 2, wo: 'Oberdeckbehälter' },
    verpflegung: { max: 9000, wo: 'in jedem freien Winkel verstaut', waren: ['proviant', 'konserven'] },
    ersatzteile: { max: 60, wo: 'Werkzeugkisten' },
    batteriezelle: { max: 4, wo: 'Batterieraum' },
    druckflasche: { max: 6, wo: 'Zentrale' },
    sanitaet: { max: 6, wo: 'Offiziersraum' },
    munition88: { max: 205, wo: 'Munitionskammer (8,8 cm SK C/35)' },
    munitionFlak: { max: 1500, wo: 'Bereitschaftsmunition Flak (2 cm C/30)' },
  };

  /* Inventar: Kategorie, Bild in grafik/inventar_items.png (x, Breite) und was der Gegenstand tut. */
  const INVENTAR = {
    torpedos: { name: 'Torpedos Bugraum', kat: 'waffen', bild: [0, 48], text: 'Reserve für die vier Bugrohre. Die Torpedomechaniker laden nach, sobald ein Rohr leer ist.' },
    torpedosHeck: { name: 'Torpedo Heckraum', kat: 'waffen', bild: [0, 48], text: 'Reserve für das Heckrohr. Wird im Heckraum nachgeladen.' },
    torpedosDeck: { name: 'Oberdeckbehälter', kat: 'waffen', bild: [0, 48], text: 'Zwei Torpedos in druckfesten Behältern unter dem Oberdeck. Nur aufgetaucht bei ruhiger Fahrt ins Boot zu holen – das dauert zwei Stunden.', aktion: 'Ins Boot übernehmen' },
    diesel: { kat: 'treibstoff', bild: [48, 24], text: 'Treibstoff für die Fahrt an der Oberfläche. Die Diesel laden dabei auch die Batterie.' },
    proviant: { kat: 'proviant', bild: [72, 24], text: 'Frisches Essen. Der Smut kocht dreimal am Tag davon, so viele Rationen wie eingestellt.' },
    konserven: { kat: 'proviant', bild: [96, 24], text: 'Haltbar und verdirbt nicht im Wasser. Wird gegessen, wenn der frische Proviant aufgebraucht ist – macht etwas weniger satt und froh.' },
    ersatzteile: { kat: 'material', bild: [120, 24], text: 'Verbraucht die Leckabwehr beim Reparieren von Lecks und Rumpfschäden.' },
    batteriezelle: { kat: 'material', bild: [144, 24], text: 'Geladene Reservezelle. Einsetzen bringt sofort +30 % Batterie – auch getaucht.', aktion: 'Zelle einsetzen' },
    druckflasche: { kat: 'material', bild: [168, 24], text: 'Füllt die Druckluft fürs Notanblasen um +25 % auf – auch getaucht.', aktion: 'Anschließen' },
    munition88: { name: '8,8-cm-Munition', kat: 'waffen', bild: [168, 24], text: 'Für das 8,8-cm-Geschütz auf dem Vordeck. Nur aufgetaucht bei ruhiger See gegen einzelne Handelsschiffe – Geschützführer ist der II. WO.' },
    munitionFlak: { name: '2-cm-Flak-Munition', kat: 'waffen', bild: [168, 24], text: 'Für die 2-cm-Flak auf dem Wintergarten. Gegen Flugzeuge – die gibt es im Spiel noch nicht.' },
    sanitaet: { kat: 'material', bild: [192, 24], text: 'Wird automatisch benutzt, wenn jemand zu ertrinken droht: Er bekommt Luft und Zeit, sich zu retten.' },
  };
  const KATEGORIEN = [['alle', 'Alle'], ['waffen', 'Waffen'], ['treibstoff', 'Treibstoff'], ['proviant', 'Proviant'], ['material', 'Material']];

  /* Preise je Einheit; null = nicht im Angebot. Ankauf durch den Händler = 60 %. */
  const PREISE = {
    basis: { munition88: 8, diesel: 0.02, torpedos: 600, proviant: 1, ersatzteile: 40, konserven: 1.5, batteriezelle: 300, druckflasche: 150, sanitaet: 120 },
    kalvik: { munition88: null, diesel: 0.03, torpedos: null, proviant: 0.8, ersatzteile: 50, konserven: 1.2, batteriezelle: 350, druckflasche: null, sanitaet: 150 },
    haendler: { munition88: null, diesel: 0.06, torpedos: null, proviant: 1.5, ersatzteile: 60, konserven: 2, batteriezelle: null, druckflasche: null, sanitaet: 180 },
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
      { id: 'tieftauchen', name: 'Druckkörper C/41', bild: 1, preis: 6000, text: 'Verstärkter Druckkörper wie VII C/41: Konstruktionstiefe 120 m, Prüfungstiefe 200 m, Zerstörung 300 m.' }] },
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
      { id: 'morse', name: 'Morse-Lehrgang', bild: 12, preis: 2500, text: 'Der Funker schreibt die Schlüsselgruppe (die ersten 3 Zeichen) selbst mit.' },
      { id: 'kaffee', name: 'Bohnenkaffee', bild: 13, preis: 2000, text: '+2 Moral für alle jeden Morgen um 8 Uhr.' }] },
  ];

  const SCHIFFSTYPEN = {
    frachter: { name: 'Frachter', kn: 8, hp: 1, feind: true, kopfgeld: 500 },
    zerstoerer: { name: 'Zerstörer', kn: 12, jagdKn: 22, hp: 2, feind: true, kopfgeld: 1200 },
    haendler: { name: 'Händlerschiff', kn: 6, hp: 1, feind: false, kopfgeld: 0 },
  };

  /* Funk: Morsealphabet. Kurzwelle 3 750–15 000 kHz: Tagwelle 8–14 MHz, Nachtwelle 4–8 MHz. */
  const MORSE = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--',
    N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
    0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
  };
  const FUNK = { min: 3750, max: 15000, tag: [8000, 14000], nacht: [4000, 8000], schwach: 60 };

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
    ZERSTOERUNGSTIEFE, MAX_SICHER, KONSTRUKTIONSTIEFE, BATTERIERAEUME, FAHRT, WELT, GROSSQUADRATE, LAND, HAEFEN, FEIND_NAME, WAREN, PREISE, ANKAUF, ANKER, STAURAUM, TORPEDOTYPEN, VERSAGER, WABO_LAERM,
    UPGRADES, SKILLTREE, INVENTAR, KATEGORIEN, SCHIFFSTYPEN, MORSE, FUNK, HORCH, VORNAMEN, NACHNAMEN, stufe,
  };
})(window.Spiel = window.Spiel || {});
