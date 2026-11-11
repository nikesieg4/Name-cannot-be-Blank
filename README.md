# Sehrohrtiefe – U-Boot-Simulation (Arbeitstitel)

Ein 2D-U-Boot-Spiel im Pixel-Look für den Browser. Du bist der **Kaleu** (Kapitänleutnant) eines U-Bootes, siehst das Boot im Querschnitt von der Seite und gibst deiner Crew Befehle. Aufträge kommen per Funk vom **Marinehauptstützpunkt**. Das Spiel gehört später zu Maiskolbistan, ist aber vorerst kostenlos und ohne Login spielbar.

**▶ Prototyp spielen:** über GitHub Pages (Branch `main`, Ordner `/ (root)`) oder lokal einfach `index.html` öffnen.

---

## Inhalt

1. [Spielidee](#spielidee)
2. [Ansicht und Steuerung](#ansicht-und-steuerung)
3. [Werte](#werte)
4. [Crew](#crew)
5. [Boot](#boot)
6. [Welt, Aufträge und Kampf](#welt-aufträge-und-kampf)
7. [Hafen und Handel](#hafen-und-handel)
8. [Spielstände](#spielstände)
9. [Technik](#technik)
10. [Stand des Prototyps](#stand-des-prototyps)
11. [Fahrplan](#fahrplan)
12. [Offene Fragen](#offene-fragen)

---

## Spielidee

| | |
|---|---|
| **Genre** | U-Boot-Simulation mit Crew- und Ressourcenmanagement |
| **Perspektive** | 2D, dritte Person, Seitenansicht (Querschnitt durch das Boot) |
| **Grafik** | Pixel-Art. Das Design des Bootes orientiert sich an [False Echo](https://store.steampowered.com/app/4418080/False_Echo/) (nur der Look, nicht das Gameplay). |
| **Spielmodus** | Endlos-Modus: Man funkt den Marinehauptstützpunkt an und bekommt Aufträge. |
| **Verlieren** | Das Boot sinkt (läuft voll Wasser) oder implodiert (zu tief bzw. Rumpf zu schwach). |
| **Plattform** | Webspiel ohne Datenbank, Spielstände lädt man als Datei herunter. |
| **Sprache** | Deutsch |

## Ansicht und Steuerung

- In der Mitte ist das Boot in der **Seitenansicht**. Man kann **hineinzoomen** (Mausrad oder +/−) und die Ansicht **ziehen**.
- Unter dem Boot liegt die **Seekarte**. Ein Klick setzt den Kurs, ein Klick auf einen Kontakt wählt ihn als Torpedoziel.
- **Crewmitglieder anklicken** wählt sie aus. Ein Klick ins Boot schickt sie dorthin, sie bleiben dort, bis man den Befehl aufhebt.
- Man spielt als Kaleu, kann aber **jedes Crewmitglied übernehmen** (Doppelklick oder Knopf „Übernehmen“) und es dann selbst mit `A`/`D` bzw. den Pfeiltasten steuern.
- An den Seiten ist die UI:
  - **links:** Statistiken (Geld, Moral, Proviant, Diesel, Batterie, Druckluft …), Rationen und die Crewliste
  - **rechts:** Tiefensteuerung, Fahrt, Torpedos, Funk, Aufträge und Details zur Auswahl
- **Zeit:** Das Spiel läuft in einer eigenen Bordzeit (UTC). Man kann **pausieren** und zwischen **1×, 2× und 4×** wechseln. Bei 1× entspricht 1 Sekunde einer Spielminute.

| Taste | Wirkung |
|---|---|
| `Leertaste` | Pause an/aus |
| `1` / `2` / `3` | Tempo 1× / 2× / 4× |
| `+` / `−` | Zoom |
| `A` / `D`, `←` / `→` | Übernommenes Crewmitglied laufen lassen |
| `Esc` | Auswahl bzw. Übernahme aufheben, Fenster schließen |

**Tablet und Touch (z. B. iPad):** Tippen wählt aus und gibt Befehle, **Doppeltipp** auf eine Figur übernimmt sie, mit zwei Fingern **zoomen**, mit einem Finger **ziehen**. Beim Übernehmen erscheinen Laufknöpfe **◀ ▶**. Im Hochformat liegen Boot und Karte oben, darunter die beiden Seitenleisten.

## Werte

| Wert | Bedeutung |
|---|---|
| **Moral** | Entscheidet, wie motiviert die Crew ist und wie schnell sie arbeitet (je Crewmitglied). Hängt vor allem von **Essen** und **Schlaf** ab. Gefallene Kameraden senken sie, Erfolge heben sie. |
| **Geld** | Spielgeld. Damit kauft man im Hafen Upgrades, Reparaturen und Waren und handelt mit anderen Schiffen. Man verdient es mit Aufträgen und versenkten Schiffen. |
| **Essen** | Proviant an Bord. Man legt fest, wie viele **Rationen pro Person und Tag** ausgegeben werden (Minimum 1, Maximum 4). Der Smutje kocht dreimal täglich. |
| **Schlaf** | Jedes Crewmitglied hat einen eigenen Wach-Zähler. Wer zu lange ohne Schlaf ist (über 19 Stunden), verliert Moral und arbeitet langsamer. |
| **Diesel** | Treibstoff für die Fahrt an der Oberfläche. Wird im **Laderaum** gelagert. |
| **Batterie** | Strom für die E-Maschine unter Wasser und für die Pumpen. Lädt an der Oberfläche über die Diesel. |
| **Druckluft** | Für das **Notanblasen** (schnelles Auftauchen). Füllt sich an der Oberfläche wieder auf. |
| **Rumpf** | Zustand **pro Abteil**. Ein beschädigter Rumpf leckt und hält weniger Druck aus. |

## Crew

Jedes Crewmitglied hat einen **Namen**, eine **Rolle**, **Moral**, einen **Wach-Zähler** und **Erfahrung** (Stufe 1–5, macht schneller). Crewmitglieder können **ertrinken**. Krankheiten gibt es vorerst nicht.

Die Rollen stammen von [ubootworkshop.de/rollen.php](https://www.ubootworkshop.de/rollen.php), ohne Reporter und Schiffsjunge/-mädel:

| Rolle | Aufgabe im Spiel | Standard-Posten |
|---|---|---|
| Kapitänleutnant (Kaleu) | Spielfigur. Kommandant, bedient das Sehrohr | Sehrohr |
| 1. Wachoffizier (1WO) | Vertritt den Kaleu, leitet den Torpedoangriff | Torpedo-Vorhalterechner |
| Leitender Ingenieur (LI) | Tiefensteuerung, steuert die Pumpen aus der Zentrale | Tiefenruder |
| Navigationsoffizier (NAV) | Karte und Kurs, kann das Ruder übernehmen | Seitenruder |
| Brandmeister | Leckabwehr, repariert am schnellsten | Leckabwehr (geht automatisch zum Schaden) |
| Funker-Obermaat | Funk senden, empfangen und **entschlüsseln** | Funkgerät |
| Logistik-Maat | Lager, Proviant, Ersatzteile, 10 % Rabatt beim Handeln | Lagerverwaltung |
| Maschinist | Diesel und Maschinentelegraf | Diesel |
| Tauchzellen-Gast | Tauchstation | Tauchzellen-Ventile |
| Vertäuungs-Gast | Leinen im Hafen, auf See E-Maschine und Leckabwehr | E-Maschine |
| Rudergänger | Steuert das Boot | Seitenruder |
| Horchfunker (Soni) | Horchgerät, erkennt Schiffe an ihren Geräuschen | Horchgerät |
| Smutje | Kocht, ohne Smutje sinkt die Moral | Kombüse |
| Admiral | **Nicht von Anfang an an Bord.** Kommt bei bestimmten Aufträgen im Hafen als Beobachter dazu (geplant). | – |

**Posten:** Ein System funktioniert nur, wenn jemand am passenden Posten steht. Fachleute (★) arbeiten mit voller Leistung, alle anderen mit halber. So kann man Ausfälle mit anderen Leuten überbrücken.

**Schichten:** Es gibt drei frei einstellbare Schichtgruppen (Wache A, Wache B, Tagesdienst). Für jede Stunde des Tages legt man **Dienst**, **Schlaf** oder **Freizeit** fest und ordnet jedem Crewmitglied eine Schicht und einen Dienstposten zu. **Gefechtsstationen** schickt alle sofort auf ihre Posten, dann schläft aber niemand mehr.

## Boot

Das Boot hat sieben Abteile (Heck → Bug): **Heckraum** (E-Maschine), **Maschinenraum** (Diesel), **Laderaum**, **Mannschaftsraum & Kombüse**, **Zentrale** (mit Turm und Sehrohr), **Funk- & Horchraum**, **Bugtorpedoraum**.

- **Rumpf pro Abteil:** Treffer beschädigen einzelne Abteile. Beschädigte Abteile lecken, unter Wasser umso stärker, je tiefer man ist.
- **Abschotten:** Schotten zwischen den Abteilen lassen sich einzeln oder für ein ganzes Abteil schließen. Das hält das Wasser auf, sperrt aber auch die Crew ein.
- **Auspumpen:** Jedes Abteil hat eine Lenzpumpe. Sie braucht Strom und jemanden im Abteil oder den LI in der Zentrale.
- **Reparieren:** Die Leckabwehr verbraucht dabei Ersatzteile.
- **Gewicht:** Zu viel Wasser im Boot macht es schwer, es sinkt. Ab 70 % Flutung ist es verloren.

**Tiefen:**

| Stufe | Tiefe |
|---|---|
| Oberfläche | 0 m |
| Sehrohrtiefe | 12 m (Funk, Sehrohr und Torpedos möglich) |
| Schleichtiefe | 60 m |
| Max. sichere Tiefe | 150 m |
| Zerstörungstiefe | 220 m (**nicht wählbar**) |

Die **sichere Tiefe sinkt mit dem Rumpfzustand**. Ist das schwächste Abteil beschädigt, wird es schon über der „maximalen sicheren Tiefe“ gefährlich. Je weiter man darüber liegt, desto höher ist die Chance zu implodieren.

## Welt, Aufträge und Kampf

- **Seekarte** mit Planquadraten (A1–J7), dem Marinehauptstützpunkt, dem Freihafen Kalvik und den Hoheitsgewässern des Feindes (Arbeitsname „Vardanien“).
- **Aufträge** bekommt man, indem man den Stützpunkt über den **Funker** anfunkt. Das geht nur bis Sehrohrtiefe. Die Antwort kommt **verschlüsselt** und muss vom Funker am Funkgerät entschlüsselt werden.
  - **Patrouille:** ein Planquadrat aufsuchen
  - **Frachter versenken:** einen gemeldeten Frachter abfangen, bevor er seinen Zielhafen erreicht
  - geplant: **Admiral als Beobachter** an Bord nehmen und mit ihm einen Auftrag fahren
- **Entdecken:** An der Oberfläche sieht man weit, auf Sehrohrtiefe nur mit jemandem am Sehrohr. Getaucht hilft nur das Horchgerät, und der Soni muss Kontakte erst identifizieren.
- **Kampf:** Torpedos (4 Bugrohre plus Reserve im Laderaum) gehen bis 7 km Entfernung und bis Sehrohrtiefe. Nachgeladen wird im Bugraum. **Zerstörer** jagen das Boot und beschießen es an der Oberfläche. **Wasserbomben** kommen erst nach Version 1.0.

## Hafen und Handel

- Häfen sind Orte auf der Karte. Fährt man an der Oberfläche hin, kann man **anlegen** und kommt in den **Handelsbildschirm**.
- Auch mit **Händlerschiffen** auf See kann man handeln, wenn man neben ihnen auftaucht.
- **Waren:** Diesel, Torpedos, Proviant, Ersatzteile. Der Laderaum hat eine begrenzte Kapazität (Ladeeinheiten).
- **Marinehauptstützpunkt:** zusätzlich Werft (Rumpfreparatur), Ausbau (Lenzpumpen, Batterie, Rumpfverstärkung) und neue Crew für Gefallene anheuern.

## Spielstände

- Gespeichert wird **ohne Datenbank**: „Speichern“ lädt eine `.srt`-Datei herunter, „Laden“ liest sie wieder ein.
- Die Datei ist **verschleiert** (XOR mit einem SHA-256-Schlüsselstrom und zufälligem Salz) und **signiert** (HMAC-SHA256). Wird auch nur ein Zeichen verändert, lehnt das Spiel die Datei ab.
- Zusätzlich sichert das Spiel jede Spielstunde automatisch im Browser (`localStorage`).
- **Ehrliche Grenze:** Weil alles im Browser läuft, steckt der Schlüssel im Code. Gelegenheitsschummler hält das sicher ab, jemanden, der den Code auseinandernimmt, aber nicht. Das ist in Ordnung, solange das Geld reines Spielgeld ist. Sobald echte Maisdollar oder Ranglisten dazukommen, müssen die Spielstände auf einen Server (z. B. das Maiskolbistan-Supabase).

## Technik

- **Reines HTML, CSS und JavaScript**, kein Build-Schritt, keine Abhängigkeiten. Der Ordner kann so wie er ist auf **GitHub Pages** oder **Netlify** hochgeladen werden und läuft auch per Doppelklick auf `index.html`.
- **Grafik:** Canvas mit ganzzahligem Zoom ohne Glättung, damit die Pixel scharf bleiben. Die Spiellogik rechnet in Bootseinheiten (660 × 150), gezeichnet wird mit **doppelter Auflösung**: Das Boot ist **1320 × 300 Pixel** groß, eine Figur **12 × 28 Pixel**. Auf einem 1080p-Bildschirm passt das ganze Boot gerade Pixel für Pixel in die Mitte. Für kleine Bildschirme gibt es zusätzlich die Zoomstufen 0,5 und 0,75 (dann geglättet). Die Karte hat 600 × 400 Pixel (2 Pixel = 1 km).
- **Schriften:** Silkscreen und VT323 von Google Fonts, ohne Internet greift eine Monospace-Schrift.

```
index.html        Seite und Aufbau der Oberfläche
css/stil.css      Gestaltung
js/krypto.js      SHA-256 und HMAC (für Spielstände)
js/daten.js       feste Spieldaten: Abteile, Rollen, Posten, Tiefen, Karte, Waren, Preise
js/zustand.js     neuen Spielstand erzeugen
js/speicher.js    Spielstände verschleiern, signieren, herunterladen, laden
js/simulation.js  Spiellogik: Crew, Wasser, Tiefe, Energie, Fahrt, Schiffe, Kampf, Funk, Aufträge, Handel
js/bilder.js      lädt die PNG-Grafiken aus grafik/
js/grafik.js      Pixel-Grafik des Bootes und der Crew
js/karte.js       Seekarte
js/ui.js          Seitenleisten und Fenster
js/minispiele.js  Funkgerät (Frequenz + Morse) und Horchraum (Schraubengeräusch abgleichen)
js/main.js        Spielschleife, Maus, Tastatur, Befehle
grafik/           Pixel-Grafiken (PNG)
werkzeuge/pixelart/  Python-Skripte, die die PNGs erzeugen
```

**Grafiken:** Boot-Querschnitt, Crew, Seekarte, Kartensymbole, Status-Symbole, Waren- und Ausbau-Symbole sowie die Horch-Spektrogramme liegen als PNG in `grafik/` und werden von `js/bilder.js` geladen. Fehlt eine Datei, zeichnet das Spiel die alten Platzhalter aus `js/grafik.js`. Neu erzeugen mit `python3 werkzeuge/pixelart/boot.py grafik` (ebenso `crew.py`, `extra.py`, `extra2.py`; braucht Pillow und numpy). Für eigene Grafiken gilt:
- Boot-Querschnitt als **ein PNG mit 1320 × 300 Pixeln**. Die Abteilgrenzen stehen in `js/daten.js` (`ABTEILE`, in Bootseinheiten, also × 2 rechnen), der Boden liegt bei y = 220, die Decke bei y = 140.
- Crew als **Spritesheet mit 12 × 28 Pixeln pro Bild** (`grafik/crew_sheet.png`: Stehen, 2 Laufbilder, Arbeiten am Posten), eine Reihe pro Rolle in der Reihenfolge von `ROLLEN`. Schlafende Figuren liegen in `grafik/crew_schlaf.png` (28 × 12 je Rolle). Die Platzhalter-Figuren sind als Pixel-Raster in `js/grafik.js` definiert (`OBEN`, `BEINE`) und lassen sich dort direkt bearbeiten.
- Hintergrund, Wasser und Licht bleiben im Code, damit Tiefe und Tageszeit sie verändern können.

## Stand des Prototyps

**Version 0.1, spielbar:**

- [x] Boot im Querschnitt mit Zoom und Ziehen
- [x] Crew anklicken, Befehle geben, Crewmitglieder übernehmen und selbst steuern
- [x] 13 Rollen mit Posten, Fachgebieten und Erfahrung
- [x] Schichtplan (3 Gruppen × 24 Stunden), Dienstposten frei wählbar, Gefechtsstationen
- [x] Moral aus Essen und Schlaf, Rationen 1–4 pro Tag, Smutje
- [x] Wasser, Lecks, Rumpf pro Abteil, Schotten, Pumpen, Reparatur, Ertrinken
- [x] Tiefensteuerung mit vier Stufen, Druck, Implosion, Sinken, Notanblasen
- [x] Diesel, Batterie, Druckluft, Laderaum
- [x] Seekarte mit Kurs, Häfen, Feindgebiet, Sicht- und Horchweite
- [x] Funk mit Entschlüsselung, Aufträge (Patrouille, Frachter versenken)
- [x] Pixel-Grafiken für Boot, Crew, Karte und Symbole
- [x] Funk-Minispiel: Frequenz suchen, Morse entschlüsseln (oder den Funker machen lassen, dreimal langsamer)
- [x] Horch-Minispiel: Schraubengeräusch mit der Geräuschkartei abgleichen, erst dann ist ein getauchter Kontakt erkannt
- [x] Torpedos mit Nachladen, Frachter, Zerstörer (Beschuss), Händlerschiffe
- [x] Handel im Hafen und mit Händlerschiffen, Werft, Upgrades, Anheuern
- [x] Pause, 1×, 2×, 4×, eigene Bordzeit (UTC) mit Tag und Nacht
- [x] Speichern und Laden als Datei mit Manipulationsschutz, Autosave

## Fahrplan

**Bis 1.0**
- [ ] Animationen (Crew-Arbeitsbewegungen, Schraube, Blasen)
- [ ] Inventar-Bildschirm und Skilltree (Entwürfe im Claude-Design-Canvas)
- [ ] Admiral-Aufträge (im Hafen aufnehmen, als Beobachter mitfahren)
- [ ] Mehr Auftragsarten (Geleitzug, Aufklärung, Transport)
- [ ] Soundeffekte (Sonar-Ping, Alarm, Ächzen des Rumpfes)
- [ ] Balancing (Preise, Verbrauch, Schaden)
- [ ] Bessere Bedienung am Handy und Tablet

**Nach 1.0**
- [ ] Wasserbomben und Ausweichmanöver
- [ ] Feuer an Bord (Brandmeister), Krankheiten
- [ ] Meuterei bei sehr niedriger Moral
- [ ] Anbindung an Maiskolbistan (Login, Spielstände auf dem Server)

## Offene Fragen

- **Name:** „Sehrohrtiefe“ ist ein Arbeitstitel. Vorschläge für Spiel und Repository: `sehrohrtiefe`, `stille-fahrt`, `kaleu`, `abteil-sieben`, `tiefenruder`.
- **Feind und Setting:** Wer ist der Gegner? Gibt es eine Geschichte? „Vardanien“ ist nur ein Platzhalter.
- **Pixelgröße:** Passt das Raster (Figur 12 × 28 Pixel, Boot 1320 × 300 Pixel) zu deinen Grafiken aus Claude Design?
