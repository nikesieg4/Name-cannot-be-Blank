/* Sehrohrtiefe – Minispiele: Funkgerät (Frequenz suchen, Morse entschlüsseln)
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
    const sig = S.sim.funkSignal(n);
    // Morse-Lehrgang: Der Funker schreibt die ersten 3 Zeichen mit, sobald das Signal klar ist.
    if (sig === 'klar' && !n.fertig && S.sim.hatAusbau(st, 'morse') && n.eingabe.length < 3) {
      const kt = n.spruch.replace(/ /g, '');
      if (kt.startsWith(n.eingabe)) n.eingabe = kt.slice(0, 3);
    }
    const d = Math.abs(n.f - n.freq);
    const stufe = Math.max(0, 16 - Math.round(d / 30));
    const F = D.FUNK;
    const besetzt = S.sim.eff.funk > 0;
    const fach = S.sim.eff.funk >= 1 || S.sim.hatAusbau(st, 'funkpeiler');

    let h = '<h1>Funkgerät</h1>';
    h += '<div class="funk">';
    // Empfänger
    h += '<div class="empfaenger">';
    h += '<div class="zeile"><span class="etikett">KURZWELLE · EMPFÄNGER E-52</span><span class="lampe ' + sig + '">' +
      (sig === 'klar' ? 'Signal klar' : sig === 'schwach' ? 'Signal schwach' : 'Rauschen') + '</span></div>';
    h += '<div class="anzeige">' + String(n.f).replace(/^(\d)/, '$1 ') + ' <small>kHz</small></div>';
    h += '<div class="skala">';
    for (let i = 0; i <= 50; i++) h += '<i style="left:' + (i * 2) + '%;height:' + (i % 10 === 0 ? 12 : i % 5 === 0 ? 8 : 4) + 'px"></i>';
    if (fach) h += '<b class="band" style="left:' + ((F.basisVon - F.min) / (F.max - F.min) * 100) + '%;width:' + ((F.basisBis - F.basisVon) / (F.max - F.min) * 100) + '%"></b>';
    h += '<em style="left:' + ((n.f - F.min) / (F.max - F.min) * 100) + '%"></em></div>';
    h += '<div class="skalazahlen"><span>4 000</span><span>5 000</span><span>6 000</span><span>7 000</span><span>8 000</span><span>9 000</span></div>';
    h += '<div class="knopfraster vier">' + [-100, -10, 10, 100].map((x) =>
      '<button data-aktion="funkDreh" data-arg="' + x + '"' + (besetzt && !n.fertig ? '' : ' disabled') + '>' + (x < 0 ? (x === -100 ? '« ' : '‹ ') + x : '+' + x + (x === 100 ? ' »' : ' ›')) + '</button>').join('') + '</div>';
    h += '<div class="etikett">SIGNALSTÄRKE</div><div class="pegel">';
    for (let i = 0; i < 16; i++) h += '<i class="' + (i < stufe ? (i > 12 ? 'h3' : i > 8 ? 'h2' : 'h1') : '') + '" style="height:' + (20 + i * 5) + '%"></i>';
    h += '</div>';
    const text = !besetzt ? 'Niemand sitzt am Funkgerät. Schick jemanden hin, sonst lässt sich nichts einstellen.'
      : sig === 'klar' ? 'Funker: „Ich hab ihn, Herr Kaleu. Der Stützpunkt sendet.“'
        : sig === 'schwach' ? 'Funker: „Da ist was. Noch ein Stück weiter drehen.“'
          : 'Funker: „Nur Rauschen. Der Stützpunkt sendet zwischen 6 und 7 MHz.“';
    h += '<p class="funker">' + text + '</p>';
    h += '</div>';

    // Morse
    const klartext = n.spruch.replace(/ /g, '');
    h += '<div class="morse">';
    h += '<div class="etikett">EMPFANGEN</div><div class="band">';
    n.spruch.split('').forEach((ch, i) => {
      if (ch === ' ') { h += '<span class="luecke"></span>'; return; }
      const verrauscht = sig !== 'klar' && (sig === 'rauschen' || i % 2 === 1);
      const code = verrauscht ? '.-.' : D.MORSE[ch];
      h += '<span class="buchstabe ' + (sig === 'rauschen' ? 'aus' : verrauscht ? 'leise' : '') + '">' + code.split('').map((z) => '<i class="' + (z === '.' ? 'p' : 's') + '"></i>').join('') + '</span>';
    });
    h += '</div>';
    if (sig === 'klar') h += '<button data-aktion="funkHoeren">▶ Abhören</button>';

    const fehler = n.eingabe.split('').some((c, i) => c !== klartext[i]);
    h += '<div class="zeile"><span class="etikett">ENTSCHLÜSSELT</span><span class="' + (n.fertig ? 'gut' : fehler ? 'warnung' : 'klein') + '">' +
      (n.fertig ? 'Auftrag entschlüsselt' : fehler ? 'Fehler im Spruch' : n.eingabe.length + ' / ' + klartext.length) + '</span></div>';
    h += '<div class="felder">';
    let k = 0;
    for (const ch of n.spruch) {
      if (ch === ' ') { h += '<span class="luecke"></span>'; continue; }
      const e = n.fertig ? ch : n.eingabe[k]; k++;
      h += '<span class="feld ' + (!e ? '' : e === ch ? 'richtig' : 'falsch') + '">' + (e || '') + '</span>';
    }
    h += '</div>';
    if (!n.fertig) {
      h += '<div class="tasten">' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('').map((z) => '<button data-aktion="funkTaste" data-arg="' + z + '">' + z + '</button>').join('') +
        '<button class="zurueck" data-aktion="funkTaste" data-arg="" aria-label="Letztes Zeichen löschen">⌫</button></div>';
      h += '<p class="klein">Du kannst auch mit der Tastatur tippen (A–Z, 0–9, Rücktaste).</p>';
    } else {
      h += '<div class="nachricht"><b>' + esc(n.mission.titel) + ':</b> ' + esc(n.mission.text) + '</div>';
    }
    h += '<div class="tabelle">' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('').map((z) => '<span><b>' + z + '</b> ' + D.MORSE[z].replace(/\./g, '·').replace(/-/g, '−') + '</span>').join('') + '</div>';
    h += '</div></div>';
    h += '<p>' + (n.fertig ? '' : '<button data-aktion="funkAuto"' + (n.auto ? ' disabled' : '') + '>' + (n.auto ? 'Funker entschlüsselt selbst …' : 'Funker machen lassen (dauert 3× länger)') + '</button> ') +
      '<button data-aktion="modalZu">Schließen</button></p>';
    S.ui.oeffne(h);
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

  /* Liste der Horchkontakte für die rechte Seitenleiste */
  function liste(st) {
    const kontakte = st.schiffe.filter((s) => !s.versenkt && s.entdeckt === 'sonar');
    if (S.sim.eff.sonar <= 0 && !kontakte.length) return '<div class="klein">Niemand am Horchgerät.</div>';
    if (!kontakte.length) return '<div class="klein">Keine Horchkontakte.</div>';
    return kontakte.map((s) => {
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
        if (offen) { S.sim.funkAuto(st, offen.id); funkgeraet(st, offen.id); }
        return true;
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
    if (/^[a-zA-Z0-9]$/.test(k)) { aktion(st, 'funkTaste', k.toUpperCase()); return true; }
    if (k === 'Backspace') { e.preventDefault(); aktion(st, 'funkTaste', ''); return true; }
    return false;
  }

  function geschlossen() { offen = null; }

  S.minispiele = { aktion, taste, liste, geschlossen, funkgeraet, horchraum };
})(window.Spiel = window.Spiel || {});
