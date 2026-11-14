/* Sehrohrtiefe – lädt die Pixel-Grafiken aus grafik/.
   Fehlt eine Datei (oder ist sie noch nicht geladen), zeichnet das Spiel weiter die Platzhalter aus dem Code. */
(function (S) {
  'use strict';
  const NAMEN = ['boot_querschnitt', 'crew_sheet', 'crew_schlaf', 'karte_leer', 'karte_symbole', 'umwelt_meeresboden', 'umwelt_wrack', 'schiff_frachter', 'schiff_zerstoerer', 'schiff_haendler'];
  const bilder = {};
  for (const n of NAMEN) {
    const img = new Image();
    img.src = 'grafik/' + n + '.png';
    bilder[n] = img;
  }
  /* Gibt das Bild nur zurück, wenn es fertig geladen ist. */
  function bild(n) {
    const img = bilder[n];
    return img && img.complete && img.naturalWidth > 0 ? img : null;
  }
  S.bilder = { bild };
})(window.Spiel = window.Spiel || {});
