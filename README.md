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

- Das Boot füllt den **ganzen Bildschirm** (Seitenansicht im Querschnitt). Man kann **hineinzoomen** (Mausrad oder +/−) und die Ansicht **ziehen**.
- Im normalen Blick ist nur das **HUD** sichtbar:
  - **unten links:** Maschinentelegraf (Stopp, Kleine, Halbe, Volle) mit Knoten und Kurs, daneben der runde **Tiefenmesser** mit Prüftiefe, rotem Bereich, Zieltiefe und Tiefenknöpfen (Oberfläche, Sehrohrtiefe, Schleichtiefe, Prüftiefe, Anblasen)
  - **unten rechts:** Zähler für Torpedos (Rohre und Reserve), Rationen (Tage), Diesel, Batterie, Druckluft, Moral, Rumpf bzw. Wasser im Boot und die Kasse; ein Klick öffnet das passende Fenster
  - **darüber:** das gewählte Ziel mit „Torpedo los!“
  - **oben:** kurze Meldungen und der **Funkruf** des Stützpunkts mit Knopf zum Funkgerät
- Alles andere klappt bei Bedarf auf: **Karte** (`M`), **Besatzung** mit Status, Verpflegung und Crewliste (`C`), **Kommando** mit Tiefe, Fahrt, Torpedos, Horchgerät, Funk und Aufträgen (`K`), **Vorräte** (`I`), **Ausbau** (`U`), **Wachen** (Schichtplan) und **Meldungen** (`L`).
- Auf der Karte setzt ein Klick den Kurs, ein Klick auf einen Kontakt wählt ihn als Torpedoziel.
- **Crewmitglieder anklicken** wählt sie aus (Karte oben links). Ein Klick ins Boot schickt sie dorthin, sie bleiben dort, bis man den Befehl aufhebt.
- Man spielt als Kaleu, kann aber **jedes Crewmitglied übernehmen** (Doppelklick oder Knopf „Übernehmen“) und es dann selbst mit `A`/`D` bzw. den Pfeiltasten steuern.
- **Zeit:** Das Spiel läuft in einer eigenen Bordzeit (UTC). Man kann **pausieren** und zwischen **1×, 2× und 4×** wechseln. Bei 1× entspricht 1 Sekunde einer Spielminute.

| Taste | Wirkung |
|---|---|
| `Leertaste` | Pause an/aus |
| `1` / `2` / `3` | Tempo 1× / 2× / 4× |
| `+` / `−` | Zoom |
| `A` / `D`, `←` / `→` | Übernommenes Crewmitglied laufen lassen |
| `T` | Alarmtauchen |
| `M` / `C` / `K` / `L` | Karte, Besatzung, Kommando, Meldungen auf- und zuklappen |
| `I` / `U` | Vorräte, Ausbau |
| `Esc` | Aufgeklapptes schließen, sonst Auswahl bzw. Übernahme aufheben |

**Tablet und Touch (z. B. iPad):** Tippen wählt aus und gibt Befehle, **Doppeltipp** auf eine Figur übernimmt sie, mit zwei Fingern **zoomen**, mit einem Finger **ziehen**. Beim Übernehmen erscheinen Laufknöpfe **◀ ▶**. Im Hochformat liegen Boot und Karte oben, darunter die beiden Seitenleisten.

## Werte

| Wert | Bedeutung |
|---|---|
| **Moral** | Entscheidet, wie motiviert die Crew ist und wie schnell sie arbeitet (je Crewmitglied). Hängt vor allem von **Essen** und **Schlaf** ab. Gefallene Kameraden senken sie, Erfolge heben sie. |
| **Geld** | Spielgeld. Damit kauft man im Hafen Upgrades, Reparaturen und Waren und handelt mit anderen Schiffen. Man verdient es mit Aufträgen und versenkten Schiffen. |
| **Essen** | Proviant an Bord. Man legt fest, wie viele **Rationen pro Person und Tag** ausgegeben werden (Minimum 1, Maximum 4). Der Smut kocht dreimal täglich. |
| **Schlaf** | Jedes Crewmitglied hat einen eigenen Wach-Zähler. Wer zu lange ohne Schlaf ist (über 19 Stunden), verliert Moral und arbeitet langsamer. |
| **Diesel** | Treibstoff für die Fahrt an der Oberfläche. Wird im **Laderaum** gelagert. |
| **Batterie** | Strom für die E-Maschine unter Wasser und für die Pumpen. Lädt an der Oberfläche über die Diesel. |
| **Druckluft** | Für das **Notanblasen** (schnelles Auftauchen). Füllt sich an der Oberfläche wieder auf. |
| **Rumpf** | Zustand **pro Abteil**. Ein beschädigter Rumpf leckt und hält weniger Druck aus. |

## Crew

Jedes Crewmitglied hat einen **Namen**, eine **Rolle**, **Moral**, einen **Wach-Zähler** und **Erfahrung** (Stufe 1–5, macht schneller). Crewmitglieder können **ertrinken**. Krankheiten gibt es vorerst nicht.

Die Besatzung folgt dem **Handbuch U-Boot Typ VII C** (Kapitel 9): **50 Mann** – 4 Offiziere, Portepee-Unteroffiziere, Maate und Mannschaften. Der Kommandant führt über vier Bereichsleiter (I. WO, II. WO, LI, Obersteuermann).

| Rolle | Anzahl | Aufgabe im Spiel | Standard-Posten |
|---|---|---|---|
| Kommandant | 1 | Spielfigur, Gesamtverantwortung, **keine feste Wache** (Tagesdienst), bei jedem Alarm da | Sehrohr |
| I. Wachoffizier | 1 | 1. Brückenwache, Torpedowaffe – bei Gefechtsstationen am Vorhaltrechner | Sehrohr (Gefecht: Vorhaltrechner) |
| II. Wachoffizier | 1 | 2. Brückenwache, Geschütz und Flak, Funkpersonal | Sehrohr |
| Leitender Ingenieur | 1 | Tauchen, Trimmen, Maschine, Leckabwehr; Pumpen aus der Zentrale | Tiefenruderstand |
| Obersteuermann | 1 | 3. Brückenwache, Navigation, Proviant | Sehrohr (Gefecht: Kartentisch) |
| Bootsmann | 1 | „Nummer Eins“, seemännischer Dienst, führt die Leckabwehr | Leckabwehr |
| Dieselpersonal | 10 | Obermaschinist, Dieselmaate, Heizer | Diesel |
| E-Personal | 6 | E-Obermaschinist, E-Maate, E-Heizer | Fahrschalter E-Maschinen |
| Zentralegast | 3 | Zentralemaat und -gasten: Flut-, Entlüftungs- und Anblaseventile | Flutventile |
| Rudergänger | 3 | Rudergeber im Turm | Rudergeber |
| Torpedomixer | 5 | Torpedomechaniker und -gasten, laden nach (4 im Bug, 1 im Heck) | Bugraum / Heckrohr |
| Funker | 3 | Funkmaat und Funkgefreite, rund um die Uhr | Funkgerät |
| Horcher | 3 | Funker mit Horchausbildung am GHG | Horchgerät |
| Seemann | 10 | Tiefenruder, Rudergang, Ausguck, Geschütz, Leckabwehr | Tiefenruder / Leckabwehr |
| Smut | 1 | Kocht drei Mahlzeiten am Tag, Frischware zuerst (Tagesdienst) | Kombüse |

**Posten:** Ein System funktioniert nur, wenn jemand am passenden Posten steht. Fachleute (★) arbeiten mit voller Leistung, alle anderen mit halber.

**Wachen:** Drei Brückenwachen à 4 Stunden (I. WO, II. WO, Obersteuermann), dazwischen 4 Stunden Schlaf und 4 Stunden frei; Tagesdienst für Kommandant, LI und Smut. Beim Wachwechsel bleibt die alte Wache am Posten, bis die Ablösung da ist. **Gefechtsstationen** schickt alle auf ihre Gefechtsposten.

**Kojen** werden „warm“ geteilt: 22 Kojen und Hängematten – Bugraum für die Mannschaft, Offiziersraum für LI, I. und II. WO und Obersteuermann, Unteroffiziersraum für die Maate, die **Kommandantenkoje hinter dem Vorhang** neben Funk und Horcher. Wer keine findet, schläft auf dem Boden.

**Proviant:** Für eine Feindfahrt von 8–10 Wochen: 3 500 Rationen Frischware und 5 000 Rationen Konserven, in jedem freien Winkel verstaut (bis 9 000). Frischware verdirbt (2 % am Tag) und wird zuerst gegessen.

## Boot

Das Boot ist ein **Typ VII C** der Kriegsmarine nach dem *Handbuch U-Boot Typ VII C*: Einhüllen-Boot mit Satteltanks, 67,1 m lang, Druckkörper 50,5 m × 4,7 m. Die Außenansicht folgt der Risszeichnung: Druckkörper mit acht Abteilungen, nicht druckfeste Außenhülle mit Oberdeck und Flutschlitzen, Satteltanks (Tauchzelle 2 und 4) mittschiffs, Tauchzelle 1 im Bug und 5 im Heck, Turm mit Wintergarten und 2-cm-Flak, 8,8-cm-Geschütz vor dem Turm, Gruppenhorchgerät unter dem Vorschiff, Netzabweiser vom Bug über den Turm zum Heck.

**Acht Abteilungen** (Heck → Bug): **E-Maschinenraum** (2 E-Maschinen, Schaltpulte, Heckrohr, Notruderstand), **Dieselraum** (2 Diesel beidseitig des Mittelgangs, Maschinentelegraf), **Kombüse** (zwei Kochplatten, Kombüsenluk), **Unteroffiziersraum** (Kojen der Maate, darunter Batterie II), **Zentrale** (Tiefenruderstand, Flut- und Entlüftungsventile, Luftzielsehrohr, Kartentisch, darunter Tauchzelle 3, darüber der Turm mit Angriffssehrohr, Vorhaltrechner und Rudergeber), **Kommandant, Funk und Horch**, **Offiziersraum** (darunter Batterie I), **Bugtorpedoraum** (4 Rohre, Reserveaale, Kojen und Hängematten). Vor und hinter der Zentrale liegen die Kugelschotten.

- **Torpedos (14):** 4 Bugrohre und 1 Heckrohr geladen, 6 Reserve unter den Bodenplatten im Bugraum, 1 im Heckraum, 2 in Oberdeckbehältern. Vorn (bis 100° zur Seite) feuern die Bugrohre, achtern das Heckrohr. Die Oberdeckbehälter lassen sich nur aufgetaucht bei Langsamer Fahrt ins Boot holen (2 Stunden).
- **Stauraum:** Treiböl rund 113 t (135 000 L), Verpflegung in jedem freien Winkel (bis 9 000 Rationen), Material in Kisten.
- **Antrieb:** Aufgetaucht 2 Diesel (bis 17,6 kn, laden dabei die Batterie; im Stand schneller), getaucht 2 E-Maschinen aus 124 Zellen (bis 7,6 kn). Maschinenkommandos: Stopp – Schleichfahrt – Langsame – Halbe – Große Fahrt – Äußerste Kraft. Verbrauch nach P ~ v³: 6.500 sm bei 12 kn aufgetaucht, 80 sm bei 4 kn getaucht (20 h), AK getaucht nur gut 2 Stunden.
- **Alarmtauchen** (Taste `T`): Diesel aus, E-Maschinen Große Fahrt, Fluten – der Turm schneidet in rund 30 s unter, dann steuert der LI auf 40 m ein. Normal taucht das Boot etwa 10 m pro Minute.
- **Atemluft:** 72 h für 37 Mann (bei 50 Mann rund 53 h), aufgetaucht wird gelüftet. Unter 40 % Kopfschmerzen und sinkende Moral, bei 0 erstickt die Besatzung.
- **Chlorgas:** Dringt Seewasser in Batterie I (Offiziersraum) oder II (Unteroffiziersraum), entsteht Chlorgas – die Abteilung wird geräumt, die Batterie verliert Ladung.
- **Rumpf pro Abteil, Abschotten, Lenzen, Reparieren:** Treffer beschädigen einzelne Abteile, beschädigte lecken umso stärker, je tiefer man ist.
- **Schwimmfähigkeit:** Ein gefluteter Endraum (Bug- oder E-Raum) lässt das Boot aufgetaucht noch schwimmfähig, getaucht wird es schwer und braucht Fahrt; **zwei geflutete Räume nicht mehr** (ab 30 % Flutung sinkt es).

**Wassertiefe:** Jede Stelle der Karte hat eine eigene Tiefe (1-km-Raster): flaches Schelf bis 10 km vor der Küste (8–80 m), dann ein Abhang bis gut 200 m und offene See um 210–300 m, dazu ein tiefer Graben im Westen und eine flache Bank (~28 m) südöstlich der Insel. Die Karte zeigt Tiefenlinien bei 20, 50, 100, 200 und 300 m, die Legende die Tiefe am Boot und unter dem Mauszeiger.

- **Auf Grund legen:** Will das Boot tiefer als der Grund, setzt es auf und liegt still. Mit Fahrt schrammt es über den Grund (Schaden am Bug), fährt es in flacheres Wasser, rammt es den Hang. Der Tiefenmesser zeigt den Grund als braune Marke.
- **Sicht:** Die Oberfläche sieht man nur bis etwa 45 m Tiefe (Licht), den Grund nur, wenn er höchstens rund 70 m unter dem Kiel liegt. Je tiefer, desto dunkler.

**Tauchtiefen** (Handbuch, Kap. 4):

| Begriff | Tiefe | Bedeutung |
|---|---|---|
| Sehrohrtiefe | 13 m | Angriff, Funk und Rundblick getaucht |
| Konstruktionstauchtiefe | 100 m | dauerhaft zulässig |
| Prüfungstauchtiefe | 165 m | nur im Notfall – darunter beult der Druckkörper und es gibt Schäden |
| Rechnerische Zerstörungstiefe | 250 m | Druckkörper versagt rechnerisch, real hielten Boote oft etwas mehr |

Die Prüfungstiefe sinkt mit dem Rumpfzustand. Der Tiefenmesser zeigt den Bereich unter der Konstruktionstiefe gelb und unter der Prüfungstiefe rot. Mit dem Ausbau „Druckkörper C/41“ gelten die Werte des VII C/41 (120 / 200 / 300 m).

## Welt, Aufträge und Kampf

- **Seekarte** mit Planquadraten (A1–J7), dem Marinehauptstützpunkt, dem Freihafen Kalvik und den Hoheitsgewässern des Feindes (Arbeitsname „Vardanien“).
- **Funkrufe:** Der Stützpunkt ruft alle paar Stunden von selbst – mit neuen Aufträgen oder Feindmeldungen. Eine Meldung oben mit Knopf „Zum Funkgerät“ und ein kurzes Morsezeichen kündigen das an. Der Spruch läuft **40 Minuten** und muss in dieser Zeit am Funkgerät auf der richtigen Frequenz aufgefangen werden – nur an der Oberfläche oder auf Sehrohrtiefe. Wer ihn verpasst, bekommt ihn erst Stunden später wieder. Feindmeldungen markieren die gemeldete Position auf der Karte.
- **Aufträge** bekommt man außerdem, indem man den Stützpunkt über den **Funker** anfunkt. Das geht nur bis Sehrohrtiefe. Die Antwort kommt **verschlüsselt** und muss vom Funker am Funkgerät entschlüsselt werden.
  - **Patrouille:** ein Planquadrat aufsuchen
  - **Frachter versenken:** einen gemeldeten Frachter abfangen, bevor er seinen Zielhafen erreicht
  - geplant: **Admiral als Beobachter** an Bord nehmen und mit ihm einen Auftrag fahren
- **Entdecken:** An der Oberfläche sieht man weit, auf Sehrohrtiefe nur mit jemandem am Sehrohr. Getaucht hilft nur das Horchgerät, und der Soni muss Kontakte erst identifizieren.
- **Kampf:** Torpedos (4 Bugrohre plus Reserve im Laderaum) gehen bis 7 km Entfernung und bis Sehrohrtiefe. Nachgeladen wird im Bugraum. **Zerstörer** jagen das Boot und beschießen es an der Oberfläche. **Wasserbomben** kommen erst nach Version 1.0.
- **Torpedos** (Handbuch Kap. 6): **G7e** (elektrisch, 30 kn / 5 km, keine Blasenbahn – für den Tagangriff) und **G7a** (Dampf-Gas, 44 kn / 5 km, 40 kn / 7,5 km oder 30 kn / 12,5 km – die Fahrtstufe wählt sich nach der Entfernung; bei Tag verrät die Blasenbahn das Boot und der Gegner kann ausweichen). Der gewählte Typ gilt für Schuss und Nachladen. **Fächer** aus zwei Rohren erhöht die Trefferchance. Etwa jeder zehnte Treffer ist ein **Versager** („Torpedokrise“). Nachladen dauert 10–15 Minuten.
- **8,8-cm-Geschütz** (205 Schuss): nur aufgetaucht und bei Gefechtsstationen, bis 6 km, etwa 8 Schuss pro Minute, ein Frachter braucht rund 20 Treffer. Geschützfeuer lockt Zerstörer an. Die **2-cm-Flak** (1.500 Schuss) ist da, Flugzeuge gibt es aber noch nicht.
- **Gruppenhorchgerät (GHG):** hört nur getaucht (ab etwa 8 m), rund 20 km weit bei bis zu 3 kn Eigenfahrt, bei Großer Fahrt und AK deutlich weniger. **Toter Winkel achtern** (140°–220°, eigene Schrauben). Nach Wasserbomben ist es einige Minuten taub.
- **Schleichfahrt:** getaucht fast lautlos – jeder bleibt auf seiner Station (Trimm), nur Notfälle zählen. **Pumpen und Echolot sind laut** und verraten das Boot.
- **Sprungschicht:** In 40–90 m liegt eine Temperaturgrenze (HUD zeigt sie getaucht an). Darunter liegt das Boot für ASDIC oft im Schallschatten.
- **Echolot:** zeigt die Wassertiefe und den Grund am Tiefenmesser – ist aber zu hören. Ausgeschaltet steht dort „Grund ?“.
- **U-Jagd:** Zerstörer suchen auch getauchte Boote. Mit dem **Horchgerät** hören sie das Boot – je schneller es fährt, desto weiter (bei eigener Jagdfahrt sind sie taub). Haben sie Verdacht, orten sie mit **ASDIC** bis 2,5 km (direkt über dem Boot gibt es eine tote Zone). Über der vermuteten Position werfen sie **Wasserbomben** (6 pro Wurf, wirksam bis etwa 60 m zur Seite und 30 m in der Tiefe, einstellbar bis 180 m; 15 Würfe, dann dreht der Zerstörer ab). Das HUD warnt bei ASDIC-Ortung, Wasserbomben erschüttern das Bild.
- **Taktik:** Ein Boot **auf Grund mit gestoppten Maschinen** ist für ASDIC kaum vom Meeresboden zu unterscheiden (in flachem Wasser noch weniger) und für das Horchgerät fast lautlos – im Test wurde es rund zehnmal seltener geortet und kaum getroffen. Tiefer als 180 m reichen die Wasserbomben nicht mehr ganz heran.

## Hafen und Handel

- Häfen sind Orte auf der Karte. Fährt man an der Oberfläche hin, kann man **anlegen** und kommt in den **Handelsbildschirm**.
- Auch mit **Händlerschiffen** auf See kann man handeln, wenn man neben ihnen auftaucht.
- **Waren:** Diesel, Torpedos, Proviant, Ersatzteile. Der Laderaum hat eine begrenzte Kapazität (Ladeeinheiten).
- **Marinehauptstützpunkt:** zusätzlich Werft (Rumpfreparatur), Ausbau über den Skilltree und neue Crew für Gefallene anheuern.

**Inventar:** Der Laderaum fasst 200 LE in 40 Fächern. Konserven isst die Crew, wenn der frische Proviant alle ist (etwas weniger Moral); sie verderben nicht im Wasser. Batteriezellen (+30 % Batterie) und Druckluftflaschen (+25 % Druckluft) setzt man im Inventar ein, auch getaucht. Sanitätskästen werden automatisch benutzt, wenn jemand zu ertrinken droht.

**Skilltree (Werft):** Jede Stufe setzt die vorige im selben Ast voraus. Ansehen geht überall, ausbauen nur am Stützpunkt.

| Ast | Stufe 1 | Stufe 2 | Stufe 3 |
|---|---|---|---|
| Rumpf | Rumpf I (2 000 Kr): −15 % Schaden | Rumpf II (4 000 Kr): −15 % Schaden | Tieftauchen (6 000 Kr): sicher 170 m, Zerstörung 240 m |
| Leckabwehr | Lenzpumpen I (1 500 Kr) | Lenzpumpen II (3 000 Kr) | Lenzpumpen III (5 000 Kr), je +50 % Pumpleistung |
| Antrieb | Batterie I (1 200 Kr) | Batterie II (2 500 Kr) | Sparsame Diesel (4 500 Kr): Batterie III und −20 % Diesel |
| Horchgerät | Horchweite +25 % (2 000 Kr) | Kartei: Übereinstimmung immer in % (3 000 Kr) | Feingehör: ab 90 % Aufnahme automatisch erkannt (5 000 Kr) |
| Waffen | Schnellladen: Nachladen 30 % schneller (2 500 Kr) | Vorhalterechner: +15 % Trefferchance (3 500 Kr) | 5. Rohr (6 000 Kr) |
| Funk & Crew | Funkpeiler: Sendeband markiert (1 500 Kr) | Morse-Lehrgang: erste 3 Zeichen automatisch (2 500 Kr) | Bohnenkaffee: +2 Moral täglich um 8 Uhr (2 000 Kr) |

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
js/laderaum.js    Inventar (Laderaum) und Skilltree (Werft)
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
- [x] Moral aus Essen und Schlaf, Rationen 1–4 pro Tag, Smut
- [x] Wasser, Lecks, Rumpf pro Abteil, Schotten, Pumpen, Reparatur, Ertrinken
- [x] Tiefensteuerung mit vier Stufen, Druck, Implosion, Sinken, Notanblasen
- [x] Diesel, Batterie, Druckluft, Laderaum
- [x] Seekarte mit Kurs, Häfen, Feindgebiet, Sicht- und Horchweite
- [x] Funk mit Entschlüsselung, Aufträge (Patrouille, Frachter versenken)
- [x] Pixel-Grafiken für Boot, Crew, Karte und Symbole
- [x] Funk-Minispiel: Frequenz suchen, Morse entschlüsseln (oder den Funker machen lassen, dreimal langsamer)
- [x] Horch-Minispiel: Schraubengeräusch mit der Geräuschkartei abgleichen, erst dann ist ein getauchter Kontakt erkannt
- [x] Inventar (Taste `I`): Laderaum in 40 Fächern à 5 LE, Gegenstände benutzen oder über Bord werfen; neue Waren Konserven, Batteriezelle, Druckluftflasche, Sanitätskasten
- [x] Skilltree in der Werft (Taste `U`): 6 Äste mit je 3 Stufen
- [x] Torpedos mit Nachladen, Frachter, Zerstörer (Beschuss), Händlerschiffe
- [x] Handel im Hafen und mit Händlerschiffen, Werft, Upgrades, Anheuern
- [x] Pause, 1×, 2×, 4×, eigene Bordzeit (UTC) mit Tag und Nacht
- [x] Speichern und Laden als Datei mit Manipulationsschutz, Autosave

## Fahrplan

**Bis 1.0**
- [ ] Animationen (Crew-Arbeitsbewegungen, Schraube, Blasen)
- [ ] Admiral-Aufträge (im Hafen aufnehmen, als Beobachter mitfahren)
- [ ] Mehr Auftragsarten (Geleitzug, Aufklärung, Transport)
- [ ] Soundeffekte (Sonar-Ping, Alarm, Ächzen des Rumpfes)
- [ ] Balancing (Preise, Verbrauch, Schaden)
- [ ] Bessere Bedienung am Handy und Tablet

**Nach 1.0**
- [ ] Ausweichmanöver und Täuschkörper (Bold)
- [ ] Feuer an Bord, Krankheiten
- [ ] Meuterei bei sehr niedriger Moral
- [ ] Anbindung an Maiskolbistan (Login, Spielstände auf dem Server)

## Offene Fragen

- **Name:** „Sehrohrtiefe“ ist ein Arbeitstitel. Vorschläge für Spiel und Repository: `sehrohrtiefe`, `stille-fahrt`, `kaleu`, `abteil-sieben`, `tiefenruder`.
- **Feind und Setting:** Wer ist der Gegner? Gibt es eine Geschichte? „Vardanien“ ist nur ein Platzhalter.
- **Pixelgröße:** Passt das Raster (Figur 12 × 28 Pixel, Boot 1320 × 300 Pixel) zu deinen Grafiken aus Claude Design?
