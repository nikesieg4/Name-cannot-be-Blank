/* Sehrohrtiefe – Spielstände als Datei.
   Aufbau: SRT1.<Salz>.<verschleierte Daten>.<HMAC-SHA256>
   - Die Daten werden mit einem aus Schlüssel und Salz erzeugten Schlüsselstrom per XOR verschleiert,
     damit man sie nicht einfach im Texteditor lesen und ändern kann.
   - Die HMAC-Signatur erkennt jede Veränderung der Datei.
   Ehrlicher Hinweis: Da das Spiel komplett im Browser läuft, steckt der Schlüssel im Code.
   Das hält Gelegenheits-Schummler sicher ab, aber nicht jemanden, der den Code auseinandernimmt. */
(function (S) {
  'use strict';
  const K = S.krypto;
  const KENNUNG = 'SRT1';
  const AUTOSAVE = 'sehrohrtiefe.autosave';

  /* Schlüssel wird zur Laufzeit aus Teilen zusammengesetzt, damit er nicht als Klartext im Code steht. */
  function schluessel() {
    const t = [[0x53, 0x65, 0x68, 0x72], [0x6f, 0x68, 0x72, 0x2d], [0x54, 0x69, 0x65, 0x66], [0x65, 0x21, 0x37, 0x31]];
    const s = t.map((a) => a.map((c) => String.fromCharCode(c)).join('')).join('');
    return K.sha256(K.utf8(s + '|' + [3, 1, 4, 1, 5, 9, 2, 6].join('')));
  }

  function schluesselstrom(key, salz, laenge) {
    const aus = new Uint8Array(laenge);
    const basis = K.verbinde(key, salz);
    let pos = 0;
    for (let n = 0; pos < laenge; n++) {
      const z = new Uint8Array([n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255]);
      const block = K.sha256(K.verbinde(basis, z));
      for (let i = 0; i < 32 && pos < laenge; i++) aus[pos++] = block[i];
    }
    return aus;
  }

  function zufallsBytes(n) {
    const b = new Uint8Array(n);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(b);
    else for (let i = 0; i < n; i++) b[i] = Math.floor(Math.random() * 256);
    return b;
  }

  function exportieren(st) {
    const key = schluessel();
    const salz = zufallsBytes(16);
    const klar = K.utf8(JSON.stringify(st));
    const strom = schluesselstrom(key, salz, klar.length);
    const versch = new Uint8Array(klar.length);
    for (let i = 0; i < klar.length; i++) versch[i] = klar[i] ^ strom[i];
    const sig = K.hex(K.hmac(key, K.verbinde(K.utf8(KENNUNG), K.verbinde(salz, versch))));
    return [KENNUNG, K.zuBase64(salz), K.zuBase64(versch), sig].join('.');
  }

  /* Liefert { ok: true, stand } oder { ok: false, grund }. */
  function importieren(text) {
    try {
      const teile = String(text).trim().split('.');
      if (teile.length !== 4 || teile[0] !== KENNUNG) return { ok: false, grund: 'Das ist keine Spielstand-Datei von Sehrohrtiefe.' };
      const key = schluessel();
      const salz = K.ausBase64(teile[1]);
      const versch = K.ausBase64(teile[2]);
      const erwartet = K.hex(K.hmac(key, K.verbinde(K.utf8(KENNUNG), K.verbinde(salz, versch))));
      if (!K.gleich(erwartet, teile[3])) return { ok: false, grund: 'Der Spielstand wurde verändert oder ist beschädigt.' };
      const strom = schluesselstrom(key, salz, versch.length);
      const klar = new Uint8Array(versch.length);
      for (let i = 0; i < versch.length; i++) klar[i] = versch[i] ^ strom[i];
      const stand = JSON.parse(K.text(klar));
      if (!stand || stand.version !== 1) return { ok: false, grund: 'Unbekannte Spielstand-Version.' };
      return { ok: true, stand: S.zustand.ergaenze(stand) };
    } catch (e) {
      return { ok: false, grund: 'Der Spielstand konnte nicht gelesen werden.' };
    }
  }

  function herunterladen(st) {
    const daten = exportieren(st);
    const blob = new Blob([daten], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sehrohrtiefe-tag' + (Math.floor(st.zeit / 1440) + 1) + '.srt';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  function autosaveSchreiben(st) {
    try { localStorage.setItem(AUTOSAVE, exportieren(st)); } catch (e) { /* Speicher nicht verfügbar */ }
  }
  function autosaveLesen() {
    try {
      const t = localStorage.getItem(AUTOSAVE);
      return t ? importieren(t) : null;
    } catch (e) { return null; }
  }
  function autosaveLoeschen() {
    try { localStorage.removeItem(AUTOSAVE); } catch (e) { /* egal */ }
  }

  S.speicher = { exportieren, importieren, herunterladen, autosaveSchreiben, autosaveLesen, autosaveLoeschen };
})(window.Spiel = window.Spiel || {});
