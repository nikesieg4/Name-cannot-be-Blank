/* Sehrohrtiefe – Minispiele: Funkraum (Kurzwelle suchen, Morse mitschreiben, Schlüsselmaschine M)
   und Horchraum (Schraubengeräusch mit der Geräuschkartei abgleichen). */
(function (S) {
  'use strict';
  const D = S.daten;
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  /* Welches Minispiel gerade offen ist: { art: 'funk' | 'horch', id, wahl, ergebnis } */
  let offen = null;

  function zufall(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------------- Funkgerät ---------------- */
  function funkgeraet(st, id) {
    const n = S.sim.funkNachricht(st, id);
    if (!n) { offen = null; S.ui.schliesse(); return; }
    offen = { art: 'funk', id };
    if (!n.empfangen && S.sim.funkSignal(n, st) === 'klar') S.sim.funkStellen(st, id, 0);
    const echt = S.sim.funkSignal(n, st);
    // Ein aufgefangener Spruch steht auf dem Block – er bleibt lesbar, auch wenn man weiterdreht.
    const sig = n.empfangen ? 'klar' : echt;
    const antenne = S.sim.antenneFrei(st);
    const ruf = st.funk.ruf && st.funk.ruf.id === n.id ? st.funk.ruf : null;
    const geheim = n.spruch.replace(/ /g, '');
    // Morse-Lehrgang: Der Funker schreibt die Schlüsselgruppe mit, sobald das Signal klar ist.
    if (sig === 'klar' && !n.fertig && !n.mitgeschrieben && S.sim.hatAusbau(st, 'morse') && n.eingabe.length < 3 && geheim.startsWith(n.eingabe)) n.eingabe = geheim.slice(0, 3);
    const d = Math.abs(n.f - n.freq);
    const stufe = Math.max(0, 16 - Math.round(d / 30));
    const F = D.FUNK;
    const besetzt = S.sim.eff.funk > 0;
    const fach = S.sim.eff.funk >= 1 || S.sim.hatAusbau(st, 'funkpeiler');
    const tagWelle = n.freq > F.nacht[1];
    const proz = (f) => (f - F.min) / (F.max - F.min) * 100;

    let h = '<h1>Funkraum</h1>';
    h += '<div class="funk">';
    // Empfänger
    h += '<div class="empfaenger">';
    h += '<div class="zeile"><span class="etikett">KURZWELLE · ALLWELLENEMPFÄNGER</span><span class="lampe ' + echt + '">' +
      (echt === 'klar' ? 'Signal klar' : echt === 'schwach' ? 'Signal schwach' : 'Rauschen') + '</span></div>';
    h += '<div class="anzeige">' + n.f.toLocaleString('de-DE') + ' <small>kHz</small></div>';
    h += '<div class="skala">';
    for (let f = 4000; f <= 15000; f += 500) h += '<i style="left:' + proz(f) + '%;height:' + (f % 1000 === 0 ? (f % 5000 === 0 ? 12 : 8) : 4) + 'px"></i>';
    if (fach) h += '<b class="band" style="left:' + proz((tagWelle ? F.tag : F.nacht)[0]) + '%;width:' + (proz((tagWelle ? F.tag : F.nacht)[1]) - proz((tagWelle ? F.tag : F.nacht)[0])) + '%"></b>';
    h += '<em style="left:' + proz(n.f) + '%"></em></div>';
    h += '<div class="skalazahlen"><span>3,75</span><span>6</span><span>9</span><span>12</span><span>15 MHz</span></div>';
    h += '<div class="knopfraster sechs">' + [-1000, -100, -10, 10, 100, 1000].map((x) =>
      '<button data-aktion="funkDreh" data-arg="' + x + '"' + (besetzt && !n.fertig ? '' : ' disabled') + '>' + (x > 0 ? '+' : '−') + Math.abs(x).toLocaleString('de-DE') + '</button>').join('') + '</div>';
    h += '<div class="etikett">SIGNALSTÄRKE</div><div class="pegel">';
    for (let i = 0; i < 16; i++) h += '<i class="' + (i < stufe ? (i > 12 ? 'h3' : i > 8 ? 'h2' : 'h1') : '') + '" style="height:' + (20 + i * 5) + '%"></i>';
    h += '</div>';
    const welle = tagWelle ? 'Tagwelle, 8–14 MHz' : 'Nachtwelle, 4–8 MHz';
    const text = !besetzt ? 'Niemand sitzt am Funkgerät. Schick jemanden hin, sonst lässt sich nichts einstellen.'
      : !n.empfangen && !antenne ? 'Funkmaat: „Antenne unter Wasser, Herr Kaleu. Wir müssen auf Sehrohrtiefe.“'
        : n.empfangen ? 'Funkmaat: „Spruch ist auf dem Block.“'
          : echt === 'klar' ? 'Funkmaat: „Ich hab ihn. Der BdU sendet.“'
            : echt === 'schwach' ? 'Funkmaat: „Da ist was. Noch ein Stück weiter drehen.“'
              : 'Funkmaat: „Nur Rauschen. Der Rundspruch läuft auf der ' + welle + '.“';
    h += '<p class="funker">' + text + '</p>';
    if (ruf) h += '<p class="warnung">Der BdU sendet noch ' + Math.max(0, Math.ceil(ruf.bis - st.zeit)) + ' Minuten.</p>';
    h += '</div>';

    // Morse: Fünfergruppen mitschreiben
    h += '<div class="morse">';
    h += '<div class="etikett">EMPFANGEN · SCHLÜSSELGRUPPE + FÜNFERGRUPPEN</div><div class="band">';
    n.spruch.split('').forEach((ch, i) => {
      if (ch === ' ') { h += '<span class="luecke"></span>'; return; }
      const verrauscht = sig !== 'klar' && (sig === 'rauschen' || i % 2 === 1);
      const code = verrauscht ? '.-.' : D.MORSE[ch];
      h += '<span class="buchstabe ' + (sig === 'rauschen' ? 'aus' : verrauscht ? 'leise' : '') + '">' + code.split('').map((z) => '<i class="' + (z === '.' ? 'p' : 's') + '"></i>').join('') + '</span>';
    });
    h += '</div>';
    if (sig === 'klar') h += '<button data-aktion="funkHoeren">▶ Abhören</button>';
    const fehler = !n.mitgeschrieben && n.eingabe.split('').some((c, i) => c !== geheim[i]);
    h += '<div class="zeile"><span class="etikett">FUNKBLOCK</span><span class="' + (n.mitgeschrieben ? 'gut' : fehler ? 'warnung' : 'klein') + '">' +
      (n.mitgeschrieben ? 'Mitgeschrieben' : fehler ? 'Fehler auf dem Block' : n.eingabe.length + ' / ' + geheim.length) + '</span></div>';
    h += '<div class="felder">';
    let k = 0;
    const gruppen = n.spruch.split(' ');
    gruppen.forEach((grp, gi) => {
      if (gi) h += '<span class="luecke"></span>';
      for (const ch of grp) {
        const e = n.mitgeschrieben ? ch : n.eingabe[k]; k++;
        h += '<span class="feld ' + (!e ? '' : e === ch ? 'richtig' : 'falsch') + '">' + (e || '') + '</span>';
      }
    });
    h += '</div>';
    if (!n.mitgeschrieben) {
      h += '<div class="tasten">' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((z) => '<button data-aktion="funkTaste" data-arg="' + z + '">' + z + '</button>').join('') +
        '<button class="zurueck" data-aktion="funkTaste" data-arg="" aria-label="Letztes Zeichen löschen">⌫</button></div>';
      h += '<p class="klein">Morsezeichen in Buchstaben übertragen – auch per Tastatur (A–Z, Rücktaste).</p>';
      h += '<div class="tabelle">' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((z) => '<span><b>' + z + '</b> ' + D.MORSE[z].replace(/\./g, '·').replace(/-/g, '−') + '</span>').join('') + '</div>';
    }
    h += '</div>';

    // Schlüsselmaschine M
    if (n.mitgeschrieben) h += enigma(st, n, gruppen);
    h += '</div>';
    h += '<p>' + (n.fertig ? '' : '<button data-aktion="funkAuto"' + (n.auto ? ' disabled' : '') + '>' + (n.auto ? 'Funkmaat arbeitet …' : 'Funkmaat machen lassen (dauert 3× länger)') + '</button> ') +
      '<button data-aktion="modalZu">Schließen</button></p>';
    S.ui.oeffne(h);
  }

  function enigma(st, n, gruppen) {
    const E = S.enigma;
    const sch = S.sim.tagesschluessel(st, n.tag);
    let h = '<div class="enigma">';
    h += '<div class="etikett">SCHLÜSSELMASCHINE M · SCHLÜSSELTAFEL „M ALLGEMEIN“</div>';
    h += '<table class="tafel"><tr><th>Tag</th><th>Walzenlage</th><th>Ringstellung</th><th>Steckerverbindungen</th><th>Grundstellung</th></tr>' +
      '<tr><td>' + n.tag + '</td><td>' + sch.walzen.join(' ') + '</td><td>' + sch.ringe.map((r) => String(r).padStart(2, '0')).join(' ') + '</td><td>' + sch.stecker + '</td><td><b>' + sch.grund + '</b></td></tr></table>';
    h += '<p class="klein">Walzenlage, Ringe und Stecker hat der Funkmaat schon eingestellt. Verfahren: <b>1.</b> Walzen auf die Grundstellung drehen. <b>2.</b> Die Schlüsselgruppe (3 Buchstaben) tasten – die Lampen zeigen den Spruchschlüssel. <b>3.</b> Walzen auf den Spruchschlüssel drehen. <b>4.</b> Die Fünfergruppen tasten und den Klartext ablesen.</p>';
    if (n.fertig) {
      h += '<div class="nachricht"><b>' + esc(n.mission.titel) + ':</b> ' + esc(n.mission.text) + '</div>';
      h += '<div class="mitschrift">' + esc(n.klar.replace(/X/g, ' ').trim()) + '</div></div>';
      return h;
    }
    h += '<div class="enigmafeld"><div class="walzen">';
    for (let i = 0; i < 3; i++) {
      h += '<div class="walze"><button data-aktion="enigmaWalze" data-arg="' + i + ',-1" aria-label="Walze ' + (i + 1) + ' zurück">▲</button><b>' + n.walzen[i] + '</b>' +
        '<button data-aktion="enigmaWalze" data-arg="' + i + ',1" aria-label="Walze ' + (i + 1) + ' vor">▼</button><small>' + sch.walzen[i] + '</small></div>';
    }
    h += '</div><div class="lampen">';
    for (const reihe of E.TASTEN) h += '<div>' + reihe.split('').map((z) => '<i class="' + (n.lampe === z ? 'an' : '') + '">' + z + '</i>').join('') + '</div>';
    h += '</div><div class="tastatur">';
    for (const reihe of E.TASTEN) h += '<div>' + reihe.split('').map((z) => '<button data-aktion="enigmaTaste" data-arg="' + z + '">' + z + '</button>').join('') + '</div>';
    h += '</div></div>';
    h += '<div class="etikett">SPRUCH – GRUPPE ANKLICKEN, UM SIE ZU TASTEN</div><div class="gruppen">' +
      gruppen.map((g, i) => '<button data-aktion="enigmaGruppe" data-arg="' + i + '" class="' + (i === 0 ? 'kopf' : '') + '">' + g + '</button>').join('') + '</div>';
    h += '<div class="zeile"><span class="etikett">LAMPEN MITGESCHRIEBEN</span><span><button data-aktion="enigmaTaste" data-arg="" aria-label="Letzte Taste zurück">⌫</button> <button data-aktion="enigmaNeu">Block leeren</button></span></div>';
    h += '<div class="mitschrift">' + (n.mitschrift ? esc(n.mitschrift.match(/.{1,5}/g).join(' ')) : '<span class="klein">–</span>') + '</div>';
    h += '</div>';
    return h;
  }

  /* Morse als Ton abspielen (Web Audio, 600 Hz). */
  let audio = null;
  function abhoeren(n) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = audio.currentTime + 0.05, e = 0.07;
      let t = t0;
      const osc = audio.createOscillator(), gain = audio.createGain();
      osc.frequency.value = 600; gain.gain.value = 0;
      osc.connect(gain); gain.connect(audio.destination);
      for (const ch of n.spruch) {
        if (ch === ' ') { t += e * 4; continue; }
        for (const z of D.MORSE[ch]) {
          const lang = z === '-' ? 3 * e : e;
          gain.gain.setValueAtTime(0.15, t); gain.gain.setValueAtTime(0, t + lang);
          t += lang + e;
        }
        t += e * 2;
      }
      osc.start(t0); osc.stop(t + 0.1);
    } catch (err) { /* ohne Ton weiterspielen */ }
  }

  /* Kurzes „Dit-dit-dit“, wenn der Stützpunkt ruft */
  function piep() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audio.createOscillator(), gain = audio.createGain();
      osc.frequency.value = 700; gain.gain.value = 0;
      osc.connect(gain); gain.connect(audio.destination);
      let t = audio.currentTime + 0.05;
      for (let i = 0; i < 3; i++) { gain.gain.setValueAtTime(0.12, t); gain.gain.setValueAtTime(0, t + 0.08); t += 0.16; }
      osc.start(); osc.stop(t + 0.05);
    } catch (err) { /* ohne Ton */ }
  }

  /* ---------------- Horchraum ---------------- */
  function profil(typ) {
    const v = D.HORCH[typ];
    return Array.from({ length: 24 }, (_, i) => {
      let x = v.grund;
      for (const [b, hh] of v.spitzen) x += hh * Math.max(0, 1 - Math.abs(i - b) / 1.6);
      return Math.min(100, Math.round(x));
    });
  }

  function kontaktProfil(s) {
    const r = zufall(s.id * 7919 + 13);
    const streu = 6 + (1 - s.ident) * 35;
    return profil(s.typ).map((v) => Math.max(0, Math.min(100, Math.round(v + (r() * 2 - 1) * streu))));
  }

  function uebereinstimmung(a, b) {
    const diff = a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0) / a.length;
    return Math.max(0, Math.round(100 - diff * 2.4));
  }

  /* Wasserfall-Spektrogramm des Kontakts, Rauschen je nach Qualität der Aufnahme. */
  function zeichneWasserfall(cv, s) {
    const g = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const typ = D.HORCH[s.typ];
    const r = zufall(s.id * 31 + 5);
    const rausch = 0.35 + (1 - s.ident) * 0.6;
    const farben = ['#04110a', '#0a2616', '#13432a', '#23784a', '#4fc77c', '#b8ffd0'];
    const bild = g.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let v = r() * rausch;
      for (const [lx, st] of typ.linien) if (Math.abs(x - lx - Math.sin(y / 9) * 1.2) < 1.5) v += st * (0.7 + 0.3 * (Math.floor(y / 6) % 2)) * (0.4 + 0.6 * s.ident);
      if (y % typ.takt < 1 && (s.typ !== 'haendler' || r() < 0.7)) v += 0.25;
      const f = farben[v < 0.25 ? 0 : v < 0.45 ? 1 : v < 0.7 ? 2 : v < 0.95 ? 3 : v < 1.2 ? 4 : 5];
      const n = parseInt(f.slice(1), 16), i = (y * W + x) * 4;
      bild.data[i] = n >> 16; bild.data[i + 1] = (n >> 8) & 255; bild.data[i + 2] = n & 255; bild.data[i + 3] = 255;
    }
    g.putImageData(bild, 0, 0);
  }

  function peilung(st, s) {
    const b = st.boot;
    return Math.round((Math.atan2(s.y - b.y, s.x - b.x) * 180 / Math.PI + 90 + 360) % 360);
  }

  function horchraum(st, id) {
    const s = st.schiffe.find((x) => x.id === id && !x.versenkt);
    if (!s || s.entdeckt !== 'sonar') {
      offen = null;
      S.ui.meldung('Horchraum', 'Der Kontakt ist nicht mehr im Horchbereich.');
      return;
    }
    if (!offen || offen.art !== 'horch' || offen.id !== id) offen = { art: 'horch', id, wahl: null, ergebnis: null };
    const wahl = offen.wahl;
    const kp = kontaktProfil(s);
    const ref = wahl ? profil(wahl) : null;
    const passt = ref ? uebereinstimmung(kp, ref) : 0;
    const fach = S.sim.eff.sonar >= 1 || S.sim.hatAusbau(st, 'kartei');
    const besetzt = S.sim.eff.sonar > 0;
    const erkannt = S.sim.bekannt(s);

    let h = '<h1>Horchraum · Kontakt ' + s.id + '</h1><div class="horch">';
    h += '<div class="aufnahme">';
    h += '<div class="zeile"><span class="etikett">PEILUNG ' + String(peilung(st, s)).padStart(3, '0') + '° · ' + S.sim.dist(s, st.boot).toFixed(1) + ' KM</span><span class="etikett">AUFNAHME ' + Math.round(s.ident * 100) + ' %</span></div>';
    h += '<canvas id="horchBild" width="200" height="120" aria-label="Wasserfall-Spektrogramm des Kontakts"></canvas>';
    h += '<div class="zeile"><span class="etikett">KLANGPROFIL · TIEF → HOCH</span><span class="' + (passt >= 80 ? 'gut' : 'klein') + '">' +
      (!ref ? 'Vorlage wählen' : fach ? 'Übereinstimmung ' + passt + ' %' : passt >= 80 ? 'Soni: „Klingt sehr ähnlich.“' : passt >= 60 ? 'Soni: „Ähnlich, aber …“' : 'Soni: „Passt nicht.“') + '</span></div>';
    h += '<div class="profil">' + kp.map((v, i) => '<span><i style="height:' + v + '%"></i><i class="ref" style="height:' + (ref ? ref[i] : 0) + '%"></i></span>').join('') + '</div>';
    h += '<div class="etikett">SCHRAUBENTAKT</div>';
    const r = zufall(s.id * 101);
    const takt = D.HORCH[s.typ].takt;
    h += '<div class="takt">' + Array.from({ length: 48 }, (_, i) => '<i class="' + ((i + 1) % takt === 0 && r() < 0.4 + 0.6 * s.ident ? 'an' : '') + '"></i>').join('') + '</div>';
    h += '<div class="takt ref">' + Array.from({ length: 48 }, (_, i) => '<i class="' + (wahl && (i + 1) % D.HORCH[wahl].takt === 0 ? 'an' : '') + '"></i>').join('') + '</div>';
    if (!fach && besetzt) h += '<p class="klein">Mit dem Horchfunker (Soni) am Gerät siehst du die Übereinstimmung in Prozent.</p>';
    h += '</div>';

    h += '<div class="kartei"><div class="etikett">GERÄUSCHKARTEI</div><div class="karten">';
    for (const [typ, v] of Object.entries(D.HORCH)) {
      h += '<button class="karte' + (wahl === typ ? ' aktiv' : '') + '" data-aktion="horchWahl" data-arg="' + typ + '">' +
        '<img src="grafik/horch_' + typ + '.png" alt="" width="200" height="120"><b>' + v.name + '</b><span>' + v.merkmal + '</span></button>';
    }
    h += '</div>';
    const erg = offen.ergebnis;
    h += '<div class="meldung' + (erg ? (erg.ok ? ' ok' : ' falsch') : '') + '">';
    if (erkannt) {
      h += '<img src="grafik/schiff_' + s.typ + '.png" alt="" class="schiff"><span class="gut">Erkannt: ' + D.SCHIFFSTYPEN[s.typ].name + (D.SCHIFFSTYPEN[s.typ].feind ? ' (feindlich)' : ' (neutral)') + '</span>';
    } else {
      h += '<button class="aktiv" data-aktion="horchMelden"' + (wahl && besetzt ? '' : ' disabled') + '>' + (wahl ? 'Als ' + D.HORCH[wahl].name + ' melden' : 'Melden') + '</button>';
      h += '<span>' + esc(erg ? erg.text : !besetzt ? 'Niemand sitzt am Horchgerät.' : s.ident < 0.5 ? 'Aufnahme noch zu schwach – warten, bis sie 50 % erreicht.' : 'Soni: „Schraubengeräusch in ' + String(peilung(st, s)).padStart(3, '0') + '°, Herr Kaleu.“') + '</span>';
    }
    h += '</div></div></div>';
    h += '<p><button data-aktion="modalZu">Schließen</button></p>';
    S.ui.oeffne(h);
    const cv = $('horchBild');
    if (cv) zeichneWasserfall(cv, s);
  }

  /* ---------------- Gruppenhorchgerät von Hand ----------------
     Auch ohne gemeldeten Kontakt: Peilscheibe drehen und horchen, was in dieser Richtung zu hören ist. */
  function horchgeraet(st, peil) {
    if (!offen || offen.art !== 'ghg') offen = { art: 'ghg', peil: 0, rund: null };
    if (peil != null) offen.peil = ((peil % 360) + 360) % 360;
    const p = offen.peil;
    const r = S.sim.horchen(st, p);
    const besetzt = S.sim.eff.sonar > 0;
    const laut = Math.round(r.staerke * 100);
    let text;
    if (r.grund === 'oben') text = 'Aufgetaucht hört das GHG nur die eigenen Diesel und den Seegang. Erst getaucht (ab etwa 8 m) horchen.';
    else if (r.grund === 'taub') text = 'Horcher: „Nach den Detonationen ist nichts zu hören. Es rauscht nur.“';
    else if (r.toterWinkel) text = 'Toter Winkel achtern – hier übertönen die eigenen Schrauben alles. Kurs ändern, um nach achtern zu horchen.';
    else if (r.schiff) text = 'Schraubengeräusch in ' + String(Math.round(p)).padStart(3, '0') + '°' + (S.sim.bekannt(r.schiff) ? ': ' + D.SCHIFFSTYPEN[r.schiff.typ].name + '.' : ' – noch nicht erkannt. Aufnahme ' + Math.round(r.schiff.ident * 100) + ' %.');
    else if (r.staerke > 0.05) text = 'Da ist etwas – ein Stück weiter drehen, bis das Geräusch am lautesten ist.';
    else text = r.eigen > 0.6 ? 'Nur das eigene Fahrtgeräusch. Bei weniger Fahrt hört man weiter.' : 'Nur Meeresrauschen in dieser Peilung.';

    let h = '<h1>Horchraum · Gruppenhorchgerät</h1><div class="horch ghg">';
    h += '<div class="aufnahme"><div class="zeile"><span class="etikett">PEILSCHEIBE · ' + String(Math.round(p)).padStart(3, '0') + '°</span><span class="etikett">' + (besetzt ? 'HORCHER AM GERÄT' : 'KALEU HORCHT SELBST') + '</span></div>';
    h += '<canvas id="ghgScheibe" width="220" height="220" aria-label="Peilscheibe des Horchgeräts. Tippen setzt die Peilung."></canvas>';
    h += '<div class="knopfraster sechs">' + [[-30, '« 30°'], [-10, '‹ 10°'], [-2, '‹ 2°'], [2, '2° ›'], [10, '10° ›'], [30, '30° »']].map(([g, t]) =>
      '<button data-aktion="ghgDreh" data-arg="' + g + '">' + t + '</button>').join('') + '</div></div>';
    h += '<div class="kartei"><div class="etikett">KOPFHÖRER · LAUTSTÄRKE ' + laut + ' %</div>';
    h += '<div class="pegel">' + Array.from({ length: 16 }, (_, i) => '<i class="' + (i < Math.round(r.staerke * 16) ? (i > 12 ? 'h3' : i > 8 ? 'h2' : 'h1') : '') + '" style="height:' + (20 + i * 5) + '%"></i>').join('') + '</div>';
    h += '<canvas id="horchBild" width="200" height="120" aria-label="Geräuschbild in dieser Peilung"></canvas>';
    h += '<div class="meldung"><span>' + esc(text) + '</span></div>';
    h += '<p><button data-aktion="ghgTon">▶ Abhören</button> ';
    if (r.schiff && !S.sim.bekannt(r.schiff)) h += '<button class="aktiv" data-aktion="horch" data-arg="' + r.schiff.id + '">Mit der Geräuschkartei abgleichen</button> ';
    h += '<button data-aktion="ghgRund"' + (besetzt && !r.grund ? '' : ' disabled') + '>Rundhorchen lassen</button></p>';
    if (offen.rund) h += '<div class="klein">' + (offen.rund.length ? 'Horcher: „Geräusche in ' + offen.rund.map((x) => '<button data-aktion="ghgSetz" data-arg="' + x + '">' + String(x).padStart(3, '0') + '°</button>').join(' ') + '.“' : 'Horcher: „Rundhorchen – keine Schraubengeräusche.“') + '</div>';
    else if (!besetzt) h += '<div class="klein">Ohne Horcher am Gerät musst du selbst rundhorchen.</div>';
    h += '</div></div><p><button data-aktion="modalZu">Schließen</button></p>';
    S.ui.oeffne(h);
    zeichneScheibe($('ghgScheibe'), st, p, r);
    const cv = $('horchBild');
    if (r.schiff) zeichneWasserfall(cv, { id: r.schiff.id, typ: r.schiff.typ, ident: Math.max(r.schiff.ident, r.staerke * 0.5) });
    else zeichneRauschen(cv, r);
    $('ghgScheibe').addEventListener('click', (e) => {
      const q = e.currentTarget.getBoundingClientRect();
      const w = Math.atan2(e.clientX - q.left - q.width / 2, -(e.clientY - q.top - q.height / 2)) * 180 / Math.PI;
      horchgeraet(st, Math.round(w));
    });
    offen.letztes = r;
  }

  function zeichneScheibe(cv, st, p, r) {
    const g = cv.getContext('2d'), M = 110, R = 96;
    g.fillStyle = '#0b1b12'; g.fillRect(0, 0, 220, 220);
    const pol = (grad, rad) => [M + Math.sin(grad * Math.PI / 180) * rad, M - Math.cos(grad * Math.PI / 180) * rad];
    // toter Winkel achtern
    g.fillStyle = 'rgba(224,87,74,0.22)';
    g.beginPath(); g.moveTo(M, M); g.arc(M, M, R, (140 - 90) * Math.PI / 180, (220 - 90) * Math.PI / 180); g.closePath(); g.fill();
    g.strokeStyle = '#2f6a45'; g.lineWidth = 2;
    g.beginPath(); g.arc(M, M, R, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#4fc77c'; g.font = '14px VT323, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let a = 0; a < 360; a += 10) {
      const [x1, y1] = pol(a, R), [x2, y2] = pol(a, R - (a % 30 === 0 ? 10 : 5));
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      if (a % 30 === 0) { const [tx, ty] = pol(a, R - 24); g.fillText(String(a).padStart(3, '0'), tx, ty); }
    }
    // Boot (Bug oben)
    g.fillStyle = '#23784a'; g.fillRect(M - 3, M - 22, 6, 44); g.fillRect(M - 5, M - 6, 10, 10);
    // Lautstärke rundum, soweit schon abgehorcht
    const [zx, zy] = pol(p, R - 30);
    g.strokeStyle = r.staerke > 0.05 ? '#b8ffd0' : '#4fc77c'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(M, M); g.lineTo(zx, zy); g.stroke();
    g.fillStyle = g.strokeStyle; g.beginPath(); g.arc(zx, zy, 4 + r.staerke * 6, 0, Math.PI * 2); g.fill();
  }

  function zeichneRauschen(cv, r) {
    const g = cv.getContext('2d'), W = cv.width, H = cv.height;
    const farben = ['#04110a', '#0a2616', '#13432a', '#23784a'];
    const bild = g.createImageData(W, H);
    const pegel = r.grund === 'oben' ? 0.9 : r.grund === 'taub' ? 1.1 : 0.3 + r.eigen * 0.5 + (r.toterWinkel ? 0.6 : 0) + r.staerke * 0.4;
    for (let i = 0; i < W * H; i++) {
      const v = Math.random() * pegel;
      const n = parseInt(farben[v < 0.25 ? 0 : v < 0.5 ? 1 : v < 0.8 ? 2 : 3].slice(1), 16);
      bild.data[i * 4] = n >> 16; bild.data[i * 4 + 1] = (n >> 8) & 255; bild.data[i * 4 + 2] = n & 255; bild.data[i * 4 + 3] = 255;
    }
    g.putImageData(bild, 0, 0);
  }

  /* Was der Horcher im Kopfhörer hat: Rauschen, dazu der Schraubentakt des angepeilten Schiffs. */
  function horchTon(r) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const dauer = 2.2, n = Math.floor(audio.sampleRate * dauer);
      const buf = audio.createBuffer(1, n, audio.sampleRate), d = buf.getChannelData(0);
      const rauschen = r.grund ? 0.5 : 0.12 + r.eigen * 0.3 + (r.toterWinkel ? 0.4 : 0);
      const typ = r.naechstes && r.staerke > 0.03 ? D.HORCH[r.naechstes.typ] : null;
      const schlag = typ ? Math.floor(audio.sampleRate * typ.takt * 0.045) : 0;
      let tief = 0;
      for (let i = 0; i < n; i++) {
        tief += (Math.random() * 2 - 1 - tief) * 0.08;               // dumpfes Rauschen
        let v = tief * rauschen;
        if (typ) { const ph = (i % schlag) / schlag; v += Math.sin(ph * 40) * Math.exp(-ph * 9) * r.staerke * 0.9; }
        d[i] = v * Math.min(1, i / 2000, (n - i) / 2000);
      }
      const q = audio.createBufferSource(), gain = audio.createGain();
      q.buffer = buf; gain.gain.value = 0.5; q.connect(gain); gain.connect(audio.destination); q.start();
    } catch (err) { /* ohne Ton */ }
  }

  /* Der Horcher sucht den ganzen Kreis ab und meldet die Peilungen mit Schraubengeräusch. */
  function rundhorchen(st) {
    const gefunden = [];
    let vor = 0, auf = false;
    for (let a = 0; a <= 360; a += 2) {
      const r = S.sim.horchPeilung(st, a % 360);
      if (r.staerke < vor && auf && vor > 0.05) { gefunden.push((a - 2) % 360); S.sim.horchen(st, (a - 2) % 360); }
      auf = r.staerke > vor; vor = r.staerke;
    }
    return gefunden;
  }

  /* Liste der Horchkontakte für die rechte Seitenleiste */
  function liste(st) {
    const kontakte = st.schiffe.filter((s) => !s.versenkt && s.entdeckt === 'sonar');
    const knopf = '<button class="breit" data-aktion="horchgeraet">Horchgerät bedienen</button>';
    if (S.sim.eff.sonar <= 0 && !kontakte.length) return knopf + '<div class="klein">Niemand am Horchgerät.</div>';
    if (!kontakte.length) return knopf + '<div class="klein">Keine Horchkontakte.</div>';
    return knopf + kontakte.map((s) => {
      const bek = S.sim.bekannt(s);
      return '<div class="zeile"><span>' + String(peilung(st, s)).padStart(3, '0') + '° · ' + S.sim.dist(s, st.boot).toFixed(0) + ' km · ' +
        (bek ? '<b>' + D.SCHIFFSTYPEN[s.typ].name + '</b>' : Math.round(s.ident * 100) + ' %') + '</span>' +
        (bek ? '' : '<button data-aktion="horch" data-arg="' + s.id + '">Abgleichen</button>') + '</div>' +
        (bek ? '' : '<div class="balken"><i style="width:' + Math.round(s.ident * 100) + '%"></i></div>');
    }).join('');
  }

  /* Aktionen aus main.js. Gibt true zurück, wenn die Aktion hierher gehört. */
  function aktion(st, name, arg) {
    switch (name) {
      case 'funkgeraet': funkgeraet(st, Number(arg)); return true;
      case 'funkDreh': {
        if (!offen || offen.art !== 'funk') return true;
        const f = S.sim.funkStellen(st, offen.id, Number(arg));
        if (f) S.sim.log(st, f, 'warn');
        funkgeraet(st, offen.id); return true;
      }
      case 'enigmaTaste': case 'enigmaGruppe': case 'enigmaWalze': case 'enigmaNeu':
        if (!offen || offen.art !== 'funk') return true;
        if (name === 'enigmaTaste') S.sim.enigmaTaste(st, offen.id, arg ? arg : null);
        else if (name === 'enigmaGruppe') S.sim.enigmaGruppe(st, offen.id, Number(arg));
        else if (name === 'enigmaWalze') { const [i, d] = arg.split(',').map(Number); S.sim.enigmaWalze(st, offen.id, i, d); }
        else S.sim.enigmaNeu(st, offen.id);
        funkgeraet(st, offen.id); return true;
      case 'funkTaste':
        if (!offen || offen.art !== 'funk') return true;
        S.sim.funkTaste(st, offen.id, arg ? arg : null);
        funkgeraet(st, offen.id); return true;
      case 'funkHoeren': {
        const n = offen && S.sim.funkNachricht(st, offen.id);
        if (n) abhoeren(n);
        return true;
      }
      case 'funkAuto':
        if (offen) { const f = S.sim.funkAuto(st, offen.id); if (f) S.sim.log(st, f, 'warn'); funkgeraet(st, offen.id); }
        return true;
      case 'horchgeraet': offen = null; horchgeraet(st); return true;
      case 'ghgDreh': if (offen && offen.art === 'ghg') { horchgeraet(st, offen.peil + Number(arg)); horchTon(offen.letztes); } return true;
      case 'ghgSetz': if (offen && offen.art === 'ghg') { horchgeraet(st, Number(arg)); horchTon(offen.letztes); } return true;
      case 'ghgTon': if (offen && offen.letztes) horchTon(offen.letztes); return true;
      case 'ghgRund': if (offen && offen.art === 'ghg') { offen.rund = rundhorchen(st); horchgeraet(st); } return true;
      case 'horch': horchraum(st, Number(arg)); return true;
      case 'horchWahl':
        if (offen && offen.art === 'horch') { offen.wahl = arg; offen.ergebnis = null; horchraum(st, offen.id); }
        return true;
      case 'horchMelden':
        if (offen && offen.art === 'horch' && offen.wahl) { offen.ergebnis = S.sim.klassifizieren(st, offen.id, offen.wahl); horchraum(st, offen.id); }
        return true;
      default: return false;
    }
  }

  /* Tastatur im Funkgerät */
  function taste(st, e) {
    if (!offen || offen.art !== 'funk' || !S.ui.offen()) return false;
    const k = e.key;
    if (/^[a-zA-Z]$/.test(k)) { aktion(st, 'funkTaste', k.toUpperCase()); return true; }
    if (k === 'Backspace') { e.preventDefault(); aktion(st, 'funkTaste', ''); return true; }
    return false;
  }

  function geschlossen() { offen = null; }

  S.minispiele = { piep, aktion, taste, liste, geschlossen, funkgeraet, horchraum, horchgeraet };
})(window.Spiel = window.Spiel || {});
