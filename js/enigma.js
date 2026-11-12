/* Sehrohrtiefe – Schlüsselmaschine M (Enigma M3 der Kriegsmarine).
   Walzen I–VIII mit originaler Verdrahtung, Umkehrwalze B, Ringstellung, Steckerbrett
   und Doppelschritt der mittleren Walze. Dazu der Tagesschlüssel aus der Schlüsseltafel. */
(function (S) {
  'use strict';
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const WALZEN = {
    I: ['EKMFLGDQVZNTOWYHXUSPAIBRCJ', 'Q'],
    II: ['AJDKSIRUXBLHWTMCQGZNPYFVOE', 'E'],
    III: ['BDFHJLCPRTXVZNYEIWGAKMUSQO', 'V'],
    IV: ['ESOVPZJAYQUIRHXLNFTGKDCMWB', 'J'],
    V: ['VZBRGITYUPSDNHLXAWMJQOFECK', 'Z'],
    VI: ['JPGVOUMFYQBENHZRDKASXLICTW', 'ZM'],
    VII: ['NZJHGRCXMYSWBOUFAIVLPEKQDT', 'ZM'],
    VIII: ['FKQHTLXOCBJSPDZRAMEWNIUYGV', 'ZM'],
  };
  const UKW_B = 'YRUHQSLDPXNGOKMIEBFZCWVJAT';
  const ROEMISCH = Object.keys(WALZEN);

  const n = (c) => c.charCodeAt(0) - 65;
  const mod = (x) => ((x % 26) + 26) % 26;

  /* Maschine aus Schlüssel { walzen: ['II','V','VIII'], ringe: [4,17,22] (1–26), stecker: 'AQ BW …' } */
  function maschine(sch) {
    const vor = sch.walzen.map((w) => WALZEN[w][0].split('').map(n));
    const rueck = vor.map((v) => { const r = []; v.forEach((x, i) => { r[x] = i; }); return r; });
    const kerben = sch.walzen.map((w) => WALZEN[w][1]);
    const ringe = sch.ringe.map((r) => r - 1);
    const st = A.split('').map(n);
    for (const p of (sch.stecker || '').split(/\s+/).filter(Boolean)) { st[n(p[0])] = n(p[1]); st[n(p[1])] = n(p[0]); }
    const ukw = UKW_B.split('').map(n);

    function durch(i, c, rueckwaerts, pos) {
      const o = pos[i] - ringe[i];
      const tab = rueckwaerts ? rueck[i] : vor[i];
      return mod(tab[mod(c + o)] - o);
    }
    /* Stellung weiterschalten: rechte Walze immer, mittlere am Übertrag oder im Doppelschritt. */
    function schalte(pos) {
      const p = pos.slice();
      const mitteKerbe = kerben[1].includes(A[p[1]]);
      const rechtsKerbe = kerben[2].includes(A[p[2]]);
      if (mitteKerbe) { p[0] = mod(p[0] + 1); p[1] = mod(p[1] + 1); } else if (rechtsKerbe) p[1] = mod(p[1] + 1);
      p[2] = mod(p[2] + 1);
      return p;
    }
    /* Ein Buchstabe: gibt { aus, pos } zurück (pos = neue Stellung als Zahlen). */
    function taste(buchstabe, pos) {
      const p = schalte(pos);
      let c = st[n(buchstabe)];
      for (let i = 2; i >= 0; i--) c = durch(i, c, false, p);
      c = ukw[c];
      for (let i = 0; i < 3; i++) c = durch(i, c, true, p);
      return { aus: A[st[c]], pos: p };
    }
    function text(t, stellung) {
      let pos = stellung.split('').map(n), r = '';
      for (const ch of t) { const e = taste(ch, pos); r += e.aus; pos = e.pos; }
      return r;
    }
    return { taste, text, schalte };
  }

  /* Deterministischer Zufall aus Zahl */
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

  /* Tagesschlüssel „Schlüssel M Allgemein“ für Tag t aus dem Kampagnen-Seed. */
  function tagesschluessel(seed, tag) {
    const r = zufall((seed * 31 + tag * 7919) >>> 0);
    const pool = ROEMISCH.slice(), walzen = [];
    while (walzen.length < 3) walzen.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    const ringe = [0, 0, 0].map(() => 1 + Math.floor(r() * 26));
    const frei = A.split('');
    const paare = [];
    for (let i = 0; i < 10; i++) {
      const a = frei.splice(Math.floor(r() * frei.length), 1)[0];
      const b = frei.splice(Math.floor(r() * frei.length), 1)[0];
      paare.push(a < b ? a + b : b + a);
    }
    paare.sort();
    let grund = '';
    for (let i = 0; i < 3; i++) grund += A[Math.floor(r() * 26)];
    return { tag, walzen, ringe, stecker: paare.join(' '), grund };
  }

  /* Klartext in Fünfergruppen verschlüsseln (Verfahren mit Grundstellung und Spruchschlüssel):
     Spruchschlüssel bei Grundstellung verschlüsselt = Schlüsselgruppe (3 Buchstaben),
     danach der Klartext ab Spruchschlüssel, aufgefüllt mit X auf volle Fünfergruppen. */
  function verschluessele(sch, klar, spruchSchl) {
    const m = maschine(sch);
    let k = klar;
    while (k.length % 5) k += 'X';
    const kopf = m.text(spruchSchl, sch.grund);
    const geheim = m.text(k, spruchSchl);
    return { kopf, gruppen: geheim.match(/.{5}/g), klar: k };
  }

  const ZAHLWORT = ['NULL', 'EINS', 'ZWO', 'DREI', 'VIER', 'FUENF', 'SECHS', 'SIEBEN', 'ACHT', 'NEUN'];
  /* Zahlen im Klartext ausschreiben, Satzzeichen als X (Marine-Verfahren). */
  function klartext(t) {
    return t.toUpperCase().replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE').replace(/ß/g, 'SS')
      .replace(/\d/g, (d) => ZAHLWORT[+d]).replace(/[^A-Z]+/g, 'X').replace(/^X+|X+$/g, '');
  }

  S.enigma = { maschine, tagesschluessel, verschluessele, klartext, zufall, WALZEN, ROEMISCH, A, TASTEN: ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML'] };
})(window.Spiel = window.Spiel || {});
