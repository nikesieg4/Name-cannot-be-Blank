/* Sehrohrtiefe – Inventar (Laderaum) und Skilltree (Werft). */
(function (S) {
  'use strict';
  const D = S.daten;
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const geld = (n) => Math.round(n).toLocaleString('de-DE') + ' Kr';
  const zahl = (n) => (Math.round(n * 10) / 10).toLocaleString('de-DE');

  /* Laderaum: 200 LE = 40 Fächer à 5 LE */
  const FACH_LE = 5, FAECHER = D.LADERAUM_LE / FACH_LE;

  let offen = null; // { art: 'inventar', wahl, filter } | { art: 'werft', wahl }

  /* Bild eines Gegenstands aus grafik/inventar_items.png in Faktor f */
  function itemBild(ware, f, extra) {
    const [x, w] = D.INVENTAR[ware].bild;
    const g = ware === 'torpedos' ? Math.max(1, f / 2) : f;
    return '<i class="itembild ' + (extra || '') + '" aria-hidden="true" style="width:' + w * g + 'px;height:' + 24 * g + 'px;background-size:' + 216 * g + 'px ' + 24 * g + 'px;background-position:-' + x * g + 'px 0"></i>';
  }

  function menge(ware, n) {
    const w = D.WAREN[ware];
    return Math.round(n).toLocaleString('de-DE') + ' ' + (w.einheit === 'Stk' ? 'Stück' : w.einheit);
  }

  /* ---------------- Inventar ---------------- */
  function inventar(st) {
    if (!offen || offen.art !== 'inventar') offen = { art: 'inventar', wahl: 'torpedos', filter: 'alle' };
    const l = st.ladung;
    const belegt = S.sim.ladeEinheiten(l);
    const waren = Object.keys(D.INVENTAR).filter((k) => l[k] > 0);
    if (!waren.includes(offen.wahl)) offen.wahl = waren[0] || 'torpedos';

    let h = '<h1>Laderaum</h1>';
    h += '<div class="zeile"><span>Belegt</span><b>' + zahl(belegt) + ' / ' + D.LADERAUM_LE + ' LE</b></div>';
    h += '<div class="balken gelb"><i style="width:' + Math.min(100, belegt / D.LADERAUM_LE * 100) + '%"></i></div>';
    h += '<div class="reiter">' + D.KATEGORIEN.map(([id, name]) =>
      '<button data-aktion="invFilter" data-arg="' + id + '" class="' + (offen.filter === id ? 'aktiv' : '') + '">' + name + '</button>').join('') + '</div>';

    h += '<div class="inventar"><div class="faecher">';
    let n = 0;
    for (const ware of waren) {
      if (offen.filter !== 'alle' && D.INVENTAR[ware].kat !== offen.filter) continue;
      const le = l[ware] * D.WAREN[ware].le;
      const anzahl = Math.max(1, Math.round(le / FACH_LE));
      for (let i = 0; i < anzahl && n < FAECHER; i++, n++) {
        h += '<button class="fach' + (offen.wahl === ware ? ' gewaehlt' : '') + (i > 0 ? ' folge' : '') + '" data-aktion="invWahl" data-arg="' + ware + '" aria-label="' + esc(D.WAREN[ware].name + ', ' + menge(ware, l[ware])) + '">' +
          itemBild(ware, 2) + (i === 0 ? '<span class="anzahl">' + (D.WAREN[ware].einheit === 'L' ? zahl(l[ware] / 1000) + 'k L' : Math.round(l[ware])) + '</span>' : '') + '</button>';
      }
    }
    const frei = Math.max(0, Math.floor((D.LADERAUM_LE - belegt) / FACH_LE));
    for (let i = 0; i < frei && n < FAECHER; i++, n++) h += '<span class="fach leer"></span>';
    h += '</div>';

    // Details
    const w = offen.wahl, inf = D.INVENTAR[w], ware = D.WAREN[w];
    h += '<div class="detail">';
    if (l[w] > 0) {
      h += '<div class="gross">' + itemBild(w, 4) + '</div>';
      h += '<span class="etikett">' + D.KATEGORIEN.find((k) => k[0] === inf.kat)[1].toUpperCase() + '</span>';
      h += '<b class="name">' + ware.name + '</b>';
      h += '<span>' + menge(w, l[w]) + ' · ' + zahl(l[w] * ware.le) + ' LE</span>';
      h += '<p>' + esc(inf.text) + '</p>';
      if (w === 'proviant' || w === 'konserven') {
        const leb = S.sim.lebende(st).length;
        h += '<p class="klein">Reicht zusammen ' + ((l.proviant + l.konserven) / Math.max(1, leb * st.ration)).toFixed(1) + ' Tage bei ' + st.ration + ' Rationen.</p>';
      }
      h += '<div class="aktionen">';
      if (inf.aktion) h += '<button class="aktiv" data-aktion="invNutzen">' + inf.aktion + '</button>';
      h += '<button class="warn" data-aktion="invAbwerfen">Über Bord werfen (−' + Math.min(l[w], ware.paket) + ' ' + ware.einheit + ')</button>';
      h += '</div>';
    } else h += '<p class="klein">Der Laderaum ist leer.</p>';
    if (offen.meldung) h += '<p class="' + (offen.meldung.ok ? 'gut' : 'warnung') + '">' + esc(offen.meldung.text) + '</p>';
    h += '</div></div>';
    h += '<p><button data-aktion="modalZu">Schließen</button></p>';
    S.ui.oeffne(h);
  }

  /* ---------------- Skilltree ---------------- */
  function skillBild(i, f) {
    return '<i class="skillbild" aria-hidden="true" style="width:' + 24 * f + 'px;height:' + 24 * f + 'px;background-size:' + 360 * f + 'px ' + 24 * f + 'px;background-position:-' + i * 24 * f + 'px 0"></i>';
  }

  function werft(st) {
    if (!offen || offen.art !== 'werft') offen = { art: 'werft', wahl: D.SKILLTREE[0].knoten[0].id };
    const ort = S.sim.handelsort(st);
    const inWerft = !!(ort && ort.basis);
    let h = '<h1>Werft · Ausbau</h1>';
    h += '<div class="zeile"><span>' + (inWerft ? 'Jede Stufe schaltet die nächste frei.' : 'Ansehen geht überall – ausbauen nur in der Werft am Marinehauptstützpunkt.') +
      '</span><b class="kasse">' + geld(st.geld) + '</b></div>';
    h += '<div class="baum">';
    for (const ast of D.SKILLTREE) {
      h += '<div class="ast"><span class="astname" style="color:' + ast.farbe + '">' + ast.name + '</span>';
      ast.knoten.forEach((k, i) => {
        const z = S.sim.ausbauStatus(st, k.id);
        if (i > 0) h += '<i class="linie' + (z.hat ? ' hat' : z.frei ? ' frei' : '') + '"></i>';
        h += '<button class="knoten' + (z.hat ? ' hat' : z.frei ? ' frei' : ' gesperrt') + (offen.wahl === k.id ? ' gewaehlt' : '') + '" data-aktion="werftWahl" data-arg="' + k.id + '">' +
          skillBild(k.bild, 2) + '<span>' + k.name + '</span><small>' + (z.hat ? '✓ eingebaut' : geld(k.preis)) + '</small></button>';
      });
      h += '</div>';
    }
    h += '</div>';
    const z = S.sim.ausbauStatus(st, offen.wahl), k = z.knoten;
    const kann = inWerft && !z.hat && z.frei && st.geld >= k.preis;
    const hinweis = z.hat ? 'Bereits eingebaut.' : !z.frei ? 'Erst die Stufe davor ausbauen.' : !inWerft ? 'Nur in der Werft am Marinehauptstützpunkt.' : st.geld < k.preis ? 'Nicht genug Geld in der Kasse.' : 'Bereit zum Einbau.';
    h += '<div class="werftdetail">' + skillBild(k.bild, 3) + '<div><b class="name">' + k.name + '</b> <span class="etikett">' + z.ast.name.toUpperCase() + '</span>' +
      '<p>' + esc(k.text) + '</p><span class="klein">' + hinweis + '</span>' +
      (offen.meldung ? '<p class="' + (offen.meldung.ok ? 'gut' : 'warnung') + '">' + esc(offen.meldung.text) + '</p>' : '') + '</div>' +
      '<button class="aktiv" data-aktion="werftBau"' + (kann ? '' : ' disabled') + '>' + (z.hat ? 'Eingebaut' : 'Ausbauen · ' + geld(k.preis)) + '</button></div>';
    h += '<p>' + (inWerft ? '<button data-aktion="handel">Zurück zum Hafen</button> ' : '') + '<button data-aktion="modalZu">Schließen</button></p>';
    S.ui.oeffne(h);
  }

  /* Aktionen aus main.js. Gibt true zurück, wenn die Aktion hierher gehört. */
  function aktion(st, name, arg) {
    switch (name) {
      case 'inventar': offen = null; inventar(st); return true;
      case 'invFilter': if (offen && offen.art === 'inventar') { offen.filter = arg; offen.meldung = null; inventar(st); } return true;
      case 'invWahl': if (offen && offen.art === 'inventar') { offen.wahl = arg; offen.meldung = null; inventar(st); } return true;
      case 'invNutzen': case 'invAbwerfen': {
        if (!offen || offen.art !== 'inventar') return true;
        const f = name === 'invNutzen' ? S.sim.benutzen(st, offen.wahl) : S.sim.abwerfen(st, offen.wahl);
        offen.meldung = f ? { ok: false, text: f } : null;
        inventar(st); return true;
      }
      case 'werftBaum': offen = null; werft(st); return true;
      case 'werftWahl': if (offen && offen.art === 'werft') { offen.wahl = arg; offen.meldung = null; werft(st); } return true;
      case 'werftBau': {
        if (!offen || offen.art !== 'werft') return true;
        const f = S.sim.ausbauen(st, offen.wahl);
        offen.meldung = f ? { ok: false, text: f } : { ok: true, text: 'Eingebaut.' };
        werft(st); return true;
      }
      default: return false;
    }
  }

  function geschlossen() { offen = null; }

  S.laderaum = { aktion, geschlossen, itemBild, inventar, werft };
})(window.Spiel = window.Spiel || {});
