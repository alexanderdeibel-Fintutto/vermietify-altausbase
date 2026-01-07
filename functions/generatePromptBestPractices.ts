import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const startTime = Date.now();

        const content = `# Base44 AI Assistant - Prompt Best Practices Guide

**Zielgruppe:** Externe KI-Assistenten (wie Claude), die optimale Prompts für den base44 AI Assistant generieren sollen.

---

## 1. PROMPT-STRUKTUR

### ✅ BEVORZUGTE STRUKTUR

Der base44 Assistant bevorzugt **klare, strukturierte Prompts** mit folgender Hierarchie:

\`\`\`
1. WAS soll gebaut werden (Ziel)
2. WARUM (Kontext/Use-Case)
3. WIE (technische Details, falls relevant)
4. BEISPIELE (optional, aber sehr hilfreich)
\`\`\`

### ⚖️ PROMPT-LÄNGE

- **KURZ bis MITTEL** für einfache Aufgaben (1-3 Sätze)
- **MITTEL bis LANG** für komplexe Module (strukturiert in Abschnitte)
- **Vermeiden:** Übermäßig lange Monologe ohne Struktur

### 📋 FUNKTIONALE vs. TECHNISCHE ANFORDERUNGEN

**BEVORZUGT:** Funktionale Anforderungen mit Geschäftskontext
\`\`\`
✅ "Erstelle eine Mieterverwaltung, wo ich Mieter erfassen, 
   Verträge verwalten und automatisch Nebenkostenabrechnungen 
   erstellen kann."
\`\`\`

**AUCH OK:** Technische Details, wenn du weißt was du willst
\`\`\`
✅ "Erstelle eine Tenant-Entity mit Feldern: first_name, last_name, 
   email, phone. Verknüpfung zu LeaseContract (1:n)."
\`\`\`

**VERMEIDEN:** Zu vage
\`\`\`
❌ "Ich brauche eine Verwaltung für Sachen."
\`\`\`

---

## 2. BEISPIELE: GUTE VS. SCHLECHTE PROMPTS

### ✅ SEHR GUT - Datenbank-Erstellung

\`\`\`markdown
Erstelle eine Entity "MaintenanceRequest" für Wartungsanfragen:

FELDER:
- title (string) - Kurzbeschreibung
- description (string) - Details
- status (enum: offen, in_bearbeitung, erledigt, abgelehnt)
- priority (enum: niedrig, mittel, hoch, notfall)
- building_id (string) - Referenz zum Gebäude
- unit_id (string, optional) - Referenz zur Einheit
- created_by_tenant_id (string, optional) - Mieter der meldet
- assigned_to (string, optional) - Zugewiesener Handwerker
- due_date (date, optional) - Fälligkeitsdatum
- cost_estimate (number, optional) - Geschätzte Kosten
- actual_cost (number, optional) - Tatsächliche Kosten
- completion_date (date, optional) - Abschlussdatum
- photos (array of strings) - URLs zu Fotos

GESCHÄFTSLOGIK:
- Status-Übergänge sollen protokolliert werden
- Bei Status "notfall" soll automatisch eine Benachrichtigung erstellt werden
\`\`\`

**Warum gut?**
- Klare Struktur
- Vollständige Felddefinitionen mit Typen
- Optionale Felder markiert
- Geschäftslogik explizit genannt

### ✅ SEHR GUT - UI-Komponente

\`\`\`markdown
Erstelle eine Kachel-Ansicht für Gebäude auf dem Dashboard:

VISUELL:
- Card mit Bild (oder Placeholder)
- Gebäudename als Titel
- Adresse als Untertitel
- 3 Statistiken: Anzahl Einheiten | Vermietungsquote | Monatliche Mieteinnahmen
- Status-Badge: "Vollvermietet" (grün) / "Teilvermietung" (gelb) / "Leerstand" (rot)
- Hover-Effekt: leichte Elevation
- Click → Navigation zur Gebäude-Detailseite

DATEN:
- Hole alle Buildings
- Berechne Vermietungsquote aus LeaseContracts
- Summiere base_rent aus aktiven Verträgen

STYLING:
- Grid-Layout (responsive: 1 Spalte mobil, 2-3 Desktop)
- emerald als Primary-Color
- Lucide-Icons verwenden
\`\`\`

**Warum gut?**
- Visuelle Beschreibung klar
- Datenquellen genannt
- Interaktionen spezifiziert
- Styling-Präferenzen angegeben

### ✅ SEHR GUT - Geschäftslogik

\`\`\`markdown
Implementiere automatische Mieterhöhungen nach §558 BGB:

ANFORDERUNGEN:
1. Miete darf max. 20% in 3 Jahren erhöht werden
2. Mindestens 15 Monate seit letzter Erhöhung
3. Ankündigungsfrist: 3 Monate zum Monatsende
4. Zustimmung erforderlich (explizit oder nach 2 Monaten stillschweigend)

WORKFLOW:
1. User wählt Vertrag aus
2. System prüft ob Erhöhung zulässig
3. System berechnet maximale Erhöhung
4. User gibt gewünschte Erhöhung ein (mit Validierung)
5. System generiert Mieterhöhungsschreiben
6. System erstellt Task "Zustimmung abwarten"
7. Nach Zustimmung: System erstellt RentChange-Eintrag
8. System plant automatische Buchungsaktualisierung zum Stichtag

VALIDIERUNGEN:
- Erhöhung <= 20% in 3 Jahren
- Mindestabstand 15 Monate
- Ankündigungsfrist korrekt berechnet
\`\`\`

**Warum gut?**
- Rechtlicher Kontext gegeben
- Schritt-für-Schritt-Workflow
- Validierungen explizit
- Automatismen beschrieben

### ❌ SCHLECHT - Zu vage

\`\`\`
Ich brauche eine Möglichkeit Dokumente zu verwalten.
\`\`\`

**Problem:** Unklar was genau gemeint ist. Welche Art Dokumente? Welche Features?

**BESSER:**
\`\`\`
Erstelle ein Dokumenten-Management mit Upload, Kategorisierung 
(Verträge, Rechnungen, Protokolle), Verknüpfung zu Gebäuden/Mietern, 
und Volltextsuche.
\`\`\`

### ❌ SCHLECHT - Zu technisch ohne Kontext

\`\`\`
Erstelle einen POST-Endpoint /api/calculate mit Request-Body 
{building_id, start_date, end_date} der ein Array von Objects 
mit {category, amount, date} zurückgibt.
\`\`\`

**Problem:** Was soll berechnet werden? Wofür?

**BESSER:**
\`\`\`
Erstelle eine Funktion die für ein Gebäude und einen Zeitraum 
alle Kosten nach Kategorien summiert und zurückgibt. Das brauche 
ich für die Nebenkostenabrechnung.
\`\`\`

### ❌ SCHLECHT - Fehlender Kontext

\`\`\`
Füge ein Feld "status" zur Tenant-Tabelle hinzu.
\`\`\`

**Problem:** Was soll der Status bedeuten? Welche Werte?

**BESSER:**
\`\`\`
Füge ein status-Feld (enum) zur Tenant-Entity hinzu:
- "aktiv": Hat aktuell laufenden Vertrag
- "ausgezogen": Vertrag beendet
- "kuendigung_eingereicht": Kündigung liegt vor
- "vorgemerkt": Interessent, noch kein Vertrag

Verwende das im Mieter-Filter und in der Statistik.
\`\`\`

---

## 3. SPEZIELLE SYNTAX & SCHLÜSSELWÖRTER

### 🔑 ERKANNTE SCHLÜSSELWÖRTER

Der base44 Assistant erkennt diese Begriffe und weiß sofort was zu tun ist:

**DATENBANK:**
- "Erstelle eine Entity..."
- "Tabelle anlegen für..."
- "Beziehung 1:n / n:m / 1:1"
- "Referenz zu..." / "Verknüpfung mit..."
- "enum mit Werten..."
- "required" / "optional"

**UI/UX:**
- "Erstelle eine Seite..."
- "Komponente für..."
- "Dialog / Modal"
- "Card / Liste / Tabelle / Grid"
- "Button / Icon / Badge"
- "Navigation zu..."
- "Hover-Effekt"
- "responsive"

**GESCHÄFTSLOGIK:**
- "Validierung"
- "Berechnung"
- "Automatisch..."
- "Bei Status-Wechsel..."
- "Workflow"
- "Backend-Funktion"

**EXTERNE SERVICES:**
- "API-Integration"
- "Webhook"
- "Secrets" (für API-Keys)

### 📝 BEVORZUGTE FORMATE

**Enum-Definitionen:**
\`\`\`
status: enum["offen", "in_bearbeitung", "erledigt"]
\`\`\`

**Feld-Definitionen:**
\`\`\`
feldname (typ) - Beschreibung
feldname (typ, optional) - Beschreibung
feldname (typ, default: wert) - Beschreibung
\`\`\`

**Beziehungen:**
\`\`\`
building_id → Building (n:1)
unit_ids → Units (n:m)
\`\`\`

---

## 4. DATENBANK-ANFRAGEN

### ✅ BESTE PRAXIS - Tabellen-Struktur

\`\`\`markdown
Erstelle Entity "OperatingCostStatement":

FELDER:
- building_id (string) - Referenz zu Building
- year (number) - Abrechnungsjahr
- period_start (date) - Beginn Abrechnungszeitraum
- period_end (date) - Ende Abrechnungszeitraum
- total_costs (number) - Gesamtkosten
- allocatable_costs (number) - Umlagefähige Kosten
- status (enum: ["entwurf", "erstellt", "versendet", "abgerechnet"])
- created_at (date) - Erstellungsdatum
- sent_at (date, optional) - Versanddatum

BEZIEHUNGEN:
- building_id → Building (n:1)
- Hat mehrere OperatingCostItems (1:n)

VALIDIERUNGEN:
- year muss zwischen 2000 und 2100 liegen
- period_end > period_start
- total_costs >= allocatable_costs
\`\`\`

### 🎯 BEVORZUGTES FORMAT für Feld-Definitionen

\`\`\`
feldname (typ) [flags] - Beschreibung

Typen: string, number, boolean, date, datetime, array, object, enum
Flags: optional, required, default:wert, unique
\`\`\`

**Beispiele:**
\`\`\`
email (string, unique, required) - Email-Adresse
age (number, optional) - Alter in Jahren  
is_active (boolean, default: true) - Aktiv-Status
tags (array of strings, optional) - Schlagwörter
\`\`\`

---

## 5. UI/UX-ANFRAGEN

### ✅ BESTE PRAXIS - Komponenten-Beschreibung

**STRUKTUR:**
1. Zweck der Komponente
2. Visuelle Beschreibung (Layout, Elemente)
3. Datenquellen
4. Interaktionen
5. States / Conditions

**BEISPIEL:**
\`\`\`markdown
Erstelle eine ContractCard-Komponente:

ZWECK:
Zeigt einen Mietvertrag kompakt in einer Liste an.

LAYOUT:
- Card mit Border
- Header: Mieter-Name (bold) + Status-Badge
- Body: Adresse | Mietzeitraum | Kaltmiete
- Footer: Icons für Bearbeiten, Löschen, Dokumente anzeigen

DATEN:
- Props: contract (Object)
- Hole tenant_name via tenant_id
- Hole unit_address via unit_id

INTERAKTIONEN:
- Click auf Card → Navigation zu /contract-detail/:id
- Click auf Edit-Icon → Öffne ContractForm im Edit-Modus
- Click auf Delete-Icon → Bestätigungs-Dialog, dann löschen

CONDITIONAL RENDERING:
- Status-Badge Farbe: active=grün, terminated=rot, pending=gelb
- Wenn end_date in der Vergangenheit: graue Hintergrundfarbe
\`\`\`

### 🎨 VISUELLE BESCHREIBUNGEN

**GUT:**
- "Card-Layout mit Schatten und abgerundeten Ecken"
- "Grid mit 3 Spalten auf Desktop, 1 Spalte auf Mobil"
- "Header mit Gradient von emerald-500 zu emerald-700"
- "Icon links, Text rechts, Button rechtsbündig"

**AUCH OK:**
- ASCII-Art für einfache Layouts
- Referenzen zu bestehenden Komponenten ("Wie BuildingCard, aber mit...")

**VERMEIDEN:**
- Zu detaillierte CSS-Anweisungen (base44 verwendet Tailwind)
- Pixel-genaue Angaben (nutze Tailwind-Spacing)

---

## 6. FUNKTIONALE ANFORDERUNGEN

### 📖 USER-STORIES FORMAT

\`\`\`markdown
Als [ROLLE]
möchte ich [AKTION]
damit [NUTZEN/ZIEL]

AKZEPTANZKRITERIEN:
- [ ] ...
- [ ] ...

BEISPIELDATEN:
- ...
\`\`\`

**BEISPIEL:**
\`\`\`markdown
Als Vermieter
möchte ich Mieterhöhungen rechtssicher durchführen
damit ich die gesetzlichen Vorgaben einhalte und rechtlich abgesichert bin.

AKZEPTANZKRITERIEN:
- [ ] System prüft 20%-Regel (max. 20% in 3 Jahren)
- [ ] System prüft 15-Monats-Frist seit letzter Erhöhung
- [ ] System berechnet korrektes Ankündigungsdatum (3 Monate zum Monatsende)
- [ ] System generiert rechtssicheres Mieterhöhungsschreiben
- [ ] System trackt Zustimmung/Widerspruch
- [ ] Nach Ablauf 2 Monate: automatische Annahme

BEISPIELDATEN:
- Aktuelle Miete: 800 €
- Letzte Erhöhung: 01.01.2023
- Heute: 15.06.2024
- Gewünschte neue Miete: 880 € (+10%)
\`\`\`

---

## 7. SCHRITTWEISE VS. ALLES-AUF-EINMAL

### 🎯 EMPFEHLUNG

**FÜR KLEINE AUFGABEN:** Alles auf einmal
\`\`\`
✅ "Füge ein priority-Feld zur Task-Entity hinzu (enum: niedrig, mittel, hoch)
   und zeige es in der TaskCard als farbiges Badge an."
\`\`\`

**FÜR GROSSE MODULE:** Strukturiert, aber komplett
\`\`\`
✅ "Erstelle ein vollständiges Wartungs-Management-Modul:

1. DATENBANK:
   - MaintenanceRequest Entity (siehe Spec unten)
   - MaintenanceCategory Entity
   
2. UI:
   - Übersichtsseite mit Filtermöglichkeiten
   - Detailansicht mit Kommentar-Historie
   - Formular zum Erstellen/Bearbeiten
   
3. GESCHÄFTSLOGIK:
   - Status-Workflow (offen → in Arbeit → erledigt)
   - Automatische Benachrichtigung bei Notfall-Priorität
   - Kostentracking mit Budget-Warnung
   
[Hier dann die Details...]"
\`\`\`

**VERMEIDEN:** Vage "Ich brauche X, dann sehen wir weiter"
- Base44 fragt nach, wenn Details fehlen
- Aber strukturierte, vollständige Specs sind besser

### 🤔 WANN FRAGT BASE44 NACH?

Base44 fragt nach wenn:
- Unclear was genau gemeint ist
- Mehrere valide Interpretationen möglich
- Wichtige Details fehlen (z.B. Feldtypen bei Entity)
- Geschäftslogik unklar oder widersprüchlich

Base44 implementiert direkt wenn:
- Anfrage klar und vollständig
- Standard-Patterns erkennbar
- Nur eine sinnvolle Interpretation

---

## 8. KONTEXT-INFORMATION

### 📚 WIE VIEL KONTEXT?

**IDEAL:** Referenziere vorhandene Strukturen
\`\`\`
✅ "Erweitere die BuildingForm um ein Feld für Baujahr."
✅ "Erstelle eine FinancingCard ähnlich wie die InsuranceCard."
✅ "Wie PropertyTaxForm, aber für Versicherungen."
\`\`\`

**AUCH OK:** Minimal, wenn es offensichtlich ist
\`\`\`
✅ "Füge ein notes-Feld zu Tenant hinzu."
\`\`\`

**NÖTIG:** Bei neuen Konzepten viel Kontext
\`\`\`
✅ "Erstelle ein neues Modul 'Energieausweis-Verwaltung'. 
   Energieausweise sind gesetzlich vorgeschrieben und müssen bei 
   Vermietung vorgelegt werden. Sie enthalten Angaben zu:
   - Energieeffizienzklasse (A+ bis H)
   - Energiekennwert in kWh/(m²·a)
   - Gültigkeit (10 Jahre)
   - Art (Bedarfs- oder Verbrauchsausweis)
   ..."
\`\`\`

### 🔍 UMGANG MIT FEHLENDEN INFOS

Base44:
1. **Prüft** vorhandenen Code und Entities
2. **Nimmt sinnvolle Defaults** an (z.B. required vs optional)
3. **Fragt nach** wenn kritisch
4. **Implementiert** und zeigt dann an was gemacht wurde

**DEIN TEIL:** Gib genug Infos, aber übertreib nicht.

---

## 9. ITERATIONS-PROZESS

### 🔄 TYPISCHER ENTWICKLUNGS-ZYKLUS

\`\`\`
1. INITIAL REQUEST → base44 erstellt/ändert Code
2. REVIEW im Browser → Du testest
3. FEEDBACK → "Ändere X zu Y", "Füge Z hinzu"
4. ANPASSUNG → base44 passt an (präzise mit find_replace)
5. FINAL CHECK → Fertig oder zurück zu Schritt 2
\`\`\`

### ✏️ KORREKTURWÜNSCHE OPTIMAL FORMULIEREN

**SEHR GUT - Spezifisch:**
\`\`\`
✅ "Der Status-Badge in der ContractCard soll nicht 
   rot/grün/gelb sein, sondern emerald/slate/amber."
\`\`\`

**GUT - Mit Referenz:**
\`\`\`
✅ "Die Karten-Abstände sind zu groß. Nutze gap-4 statt gap-8."
\`\`\`

**OK - Beschreibend:**
\`\`\`
✅ "Die Formular-Buttons sollen am unteren Rand sein, nicht oben."
\`\`\`

**SCHLECHT - Vage:**
\`\`\`
❌ "Das sieht komisch aus."
❌ "Mach es schöner."
\`\`\`

---

## 10. TYPISCHE FEHLER & ANTI-PATTERNS

### ❌ HÄUFIGE FEHLER

1. **ZU VAGE**
   \`\`\`
   ❌ "Ich brauche eine Verwaltung."
   ✅ "Ich brauche eine Wartungsanfragen-Verwaltung mit..."
   \`\`\`

2. **WIDERSPRÜCHLICHE ANFORDERUNGEN**
   \`\`\`
   ❌ "Das Feld soll optional sein und beim Speichern validiert werden."
   ✅ "Das Feld ist optional, aber wenn ausgefüllt, muss es das Format X haben."
   \`\`\`

3. **ZU TECHNISCH OHNE GESCHÄFTSKONTEXT**
   \`\`\`
   ❌ "Erstelle eine 1:n Relation von A nach B."
   ✅ "Ein Gebäude hat mehrere Einheiten (1:n Beziehung)."
   \`\`\`

4. **SCHRITTWEISE OHNE GESAMTPLAN**
   \`\`\`
   ❌ "Erstell mal eine Entity." → "Jetzt brauch ich ein Formular." → "Ach, und eine Listenseite."
   ✅ "Erstelle ein vollständiges CRUD-Modul für X mit Entity, Liste, Detail, Formular."
   \`\`\`

5. **MEHRERE THEMEN VERMISCHT**
   \`\`\`
   ❌ "Erstelle die Vertrags-Verwaltung und nebenbei auch noch die Buchhaltung."
   ✅ "Erstelle die Vertrags-Verwaltung." [Dann separat:] "Erstelle die Buchhaltung."
   \`\`\`

### 🚫 ANTI-PATTERNS

- ❌ Zu viele Annahmen ("du weißt schon was ich meine")
- ❌ Inkonsistente Benennung (Contract vs. LeaseAgreement vs. Mietvertrag)
- ❌ Fehlende Beispiele bei komplexen Berechnungen
- ❌ "Mach's wie in SAP" (zu spezifisch, nicht übertragbar)
- ❌ Pixel-genaue Design-Specs (base44 nutzt Tailwind, nicht Custom CSS)

---

## 11. SPEZIELLE BASE44-FEATURES

### 💪 WAS BASE44 BESONDERS GUT KANN

1. **VOLLSTÄNDIGE CRUD-MODULE**
   - Entity + Formular + Liste + Detail in einem Rutsch

2. **DATENBANKMODELLIERUNG**
   - Komplexe Beziehungen (1:n, n:m)
   - Enums und Validierungen
   - Automatische Felder (created_date, created_by, etc.)

3. **UI-KOMPONENTEN MIT SHADCN/UI**
   - Dialog, Card, Table, Form, Button, Badge, etc.
   - Responsive Layouts (Tailwind)
   - Icons (Lucide React)

4. **BACKEND-FUNKTIONEN (Deno)**
   - API-Integrationen
   - PDF-Generierung
   - Komplexe Berechnungen
   - Scheduled Tasks

5. **QUERY-MANAGEMENT**
   - React Query automatisch eingebunden
   - Mutations mit Cache-Invalidierung

6. **DOKUMENTEN-GENERIERUNG**
   - HTML-Templates mit Platzhaltern
   - PDF-Export
   - Briefversand via LetterXpress

### 🚧 EINSCHRÄNKUNGEN

1. **NUR REACT/TAILWIND**
   - Kein Vue, Angular, Next.js
   - Kein Custom CSS (nur Tailwind)

2. **BASE44-BACKEND**
   - Keine eigene Node.js-API
   - Backend-Funktionen nur als Deno Functions

3. **KEINE NATIVEN MOBILE APPS**
   - Nur Web-Apps (responsive)

4. **NPM-PACKAGES**
   - Nur installierte Packages (siehe Liste in Instructions)
   - Neue Packages nur nach User-Genehmigung

### 🎯 WAS BASE44 AM BESTEN KANN

- **Geschäftsanwendungen** (ERP, CRM, Property Management)
- **Datenbank-intensive Apps**
- **Formulare und Listen**
- **Automatisierungen und Workflows**
- **Dokumenten-Management**
- **Deutsche Rechts-/Steuer-Compliance** (AfA, Anlage V, etc.)

### ⚠️ WAS ANDERS GELÖST WERDEN SOLLTE

- **Echtzeit-Chat** → Spezialisierte Chat-Platform
- **Video-Streaming** → Dedicated Service
- **Machine Learning Modelle** → Externe API
- **Blockchain** → Spezialisierte Blockchain-Platform

---

## 12. PROMPT-TEMPLATES FÜR HÄUFIGE AUFGABEN

### 📝 TEMPLATE: Neue Datenbank-Tabelle

\`\`\`markdown
Erstelle eine Entity "[EntityName]" für [Zweck/Beschreibung]:

FELDER:
- feldname1 (typ) [flags] - Beschreibung
- feldname2 (typ) [flags] - Beschreibung
- ...

BEZIEHUNGEN:
- referenz_id → ZielEntity (Kardinalität)

VALIDIERUNGEN:
- Regel 1
- Regel 2

BEISPIELDATEN:
- Beispiel 1
- Beispiel 2
\`\`\`

**AUSGEFÜLLT:**
\`\`\`markdown
Erstelle eine Entity "Meter" für Zählerstände (Strom, Gas, Wasser):

FELDER:
- unit_id (string, required) - Referenz zur Wohneinheit
- meter_type (enum["strom", "gas", "wasser", "heizung"], required) - Zählerart
- meter_number (string, required) - Zählernummer
- location (string) - Standort (z.B. "Keller", "Wohnung")
- installation_date (date) - Einbaudatum
- last_reading (number) - Letzter Zählerstand
- last_reading_date (date) - Datum letzter Ablesung
- is_active (boolean, default: true) - Aktiv

BEZIEHUNGEN:
- unit_id → Unit (n:1)

VALIDIERUNGEN:
- meter_number muss unique sein
- last_reading >= 0
- last_reading_date <= heute

BEISPIELDATEN:
- Stromzähler Nr. 12345, Wohnung 1.OG rechts, Stand 8542 kWh
- Wasserzähler Nr. 67890, Keller, Stand 125 m³
\`\`\`

---

### 🖼️ TEMPLATE: UI-Komponente

\`\`\`markdown
Erstelle eine [KomponentenName]-Komponente:

ZWECK:
[Wofür wird sie verwendet]

LAYOUT:
- [Element 1]
- [Element 2]
- [Element 3]

DATEN:
- Props: [Liste der Props]
- Fetch: [Datenquellen]

INTERAKTIONEN:
- [Aktion 1] → [Effekt]
- [Aktion 2] → [Effekt]

STATES:
- [Condition] → [Darstellung]

STYLING:
- [Besonderheiten]
\`\`\`

**AUSGEFÜLLT:**
\`\`\`markdown
Erstelle eine MeterReadingCard-Komponente:

ZWECK:
Zeigt einen Zählerstand in einer Liste oder Dashboard an.

LAYOUT:
- Card mit Icon (passend zum Zählertyp)
- Header: Zählerart + Zählernummer
- Body: Standort | Letzter Stand | Ablesedatum
- Footer: "Ablesung erfassen" Button

DATEN:
- Props: meter (Object)
- Fetch: unit.address via meter.unit_id

INTERAKTIONEN:
- Click auf Card → Detail-Ansicht mit Historie
- Click auf "Ablesung erfassen" → Dialog mit Formular
- Hover → Elevation-Effekt

STATES:
- Wenn last_reading_date > 365 Tage → Warnung (rotes Badge "Ablesung überfällig")
- Wenn is_active === false → graue Darstellung + Badge "Inaktiv"

STYLING:
- Icons: Zap (Strom), Flame (Gas), Droplet (Wasser), Thermometer (Heizung)
- Farben je nach Typ: blue (Wasser), yellow (Gas), purple (Strom), red (Heizung)
\`\`\`

---

### ⚙️ TEMPLATE: Geschäftslogik / Backend-Funktion

\`\`\`markdown
Implementiere [Funktionalität]:

ZWECK:
[Was soll die Funktion tun]

ANFORDERUNGEN:
1. [Anforderung 1]
2. [Anforderung 2]
...

WORKFLOW:
1. [Schritt 1]
2. [Schritt 2]
...

INPUT:
- Parameter 1 (Typ) - Beschreibung
- Parameter 2 (Typ) - Beschreibung

OUTPUT:
- [Was wird zurückgegeben]

VALIDIERUNGEN:
- [Validierung 1]
- [Validierung 2]

FEHLERBEHANDLUNG:
- [Fehlerfall 1] → [Reaktion]
- [Fehlerfall 2] → [Reaktion]
\`\`\`

**AUSGEFÜLLT:**
\`\`\`markdown
Implementiere automatische Betriebskostenabrechnung:

ZWECK:
Berechnet für einen Mietvertrag die jährliche Betriebskostenabrechnung gemäß §556 BGB.

ANFORDERUNGEN:
1. Ermittlung aller umlagefähigen Kosten für das Gebäude
2. Aufteilung nach Verteilschlüssel (Fläche, Personen, Verbrauch)
3. Berücksichtigung von Zeiträumen (anteilige Berechnung bei Mieterwechsel)
4. Guthaben/Nachzahlung gegen Vorauszahlungen

WORKFLOW:
1. Lade alle Kosten für building_id im Jahr X
2. Filtere nach allocatable === true
3. Gruppiere nach Verteilschlüssel
4. Für jeden Vertrag im Gebäude:
   - Berechne Anteil nach Fläche (m²)
   - Berechne Anteil nach Personen (z.B. Müllgebühren)
   - Berechne Anteil nach Verbrauch (Wasser, Heizung)
5. Summiere Vorauszahlungen des Mieters
6. Berechne Differenz (Nachzahlung oder Guthaben)
7. Erstelle OperatingCostStatement
8. Generiere PDF-Dokument

INPUT:
- building_id (string) - Gebäude
- year (number) - Abrechnungsjahr
- contract_id (string, optional) - Spezifischer Vertrag oder alle

OUTPUT:
- Array von {contract_id, total_costs, prepayments, balance, items: [...]}

VALIDIERUNGEN:
- year zwischen 2000 und current_year
- building_id existiert
- Mindestens ein aktiver Vertrag im Jahr

FEHLERBEHANDLUNG:
- Keine Kosten vorhanden → Warnung, leere Abrechnung
- Inkonsistente Verteilschlüssel → Fehler mit Details
- Fehlende Flächen-Angaben → Warnung, Aufteilung nach Wohneinheiten-Anzahl
\`\`\`

---

### 🔌 TEMPLATE: API-Integration

\`\`\`markdown
Integriere [Service-Name] API:

ZWECK:
[Was soll die Integration ermöglichen]

API-DETAILS:
- Base URL: [URL]
- Authentifizierung: [Methode]
- Benötigte Secrets: [API-Key, etc.]

ENDPOINTS:
1. [Endpoint 1] - [Zweck]
2. [Endpoint 2] - [Zweck]

DATENFLUSS:
1. [Schritt 1]
2. [Schritt 2]

FEHLERBEHANDLUNG:
- [HTTP-Code] → [Reaktion]

UI-INTEGRATION:
- [Wo wird es verwendet]
\`\`\`

**AUSGEFÜLLT:**
\`\`\`markdown
Integriere DHL Tracking API:

ZWECK:
Automatisches Tracking von versendeten Einschreiben und Briefen.

API-DETAILS:
- Base URL: https://api-eu.dhl.com/track/shipments
- Authentifizierung: API-Key im Header
- Benötigte Secrets: DHL_API_KEY

ENDPOINTS:
1. GET /shipments/{trackingNumber} - Liefert Status und Historie

DATENFLUSS:
1. User versendet Brief via LetterXpress → tracking_code wird in LetterShipment gespeichert
2. Scheduled Task läuft täglich:
   - Hole alle LetterShipments mit tracking_code und status !== 'delivered'
   - Für jeden: Rufe DHL API auf
   - Update status basierend auf API-Response
3. Bei Status-Änderung: Notification an User

FEHLERBEHANDLUNG:
- 404 Not Found → Tracking noch nicht aktiv, warten
- 429 Rate Limit → Retry mit Exponential Backoff
- 500 Server Error → Log error, try again later

UI-INTEGRATION:
- In PostausgangsbuchTable: Button "DHL Tracking" öffnet neues Tab mit DHL-Website
- In LetterShipment-Detail: Status-Timeline mit allen Tracking-Events
- Dashboard: Widget "Briefe in Zustellung" mit Anzahl
\`\`\`

---

### ✅ TEMPLATE: Validierung

\`\`\`markdown
Implementiere Validierung für [Feature]:

VALIDIERUNGEN:
1. [Feldname]:
   - [Regel 1]
   - [Regel 2]
   - Fehlermeldung: "[Text]"

2. [Feldname]:
   - [Regel 1]
   - Fehlermeldung: "[Text]"

CROSS-FIELD VALIDIERUNGEN:
- [Bedingung] → [Fehlermeldung]

BUSINESS RULES:
- [Regel 1] → [Fehlermeldung]
- [Regel 2] → [Fehlermeldung]

WO VALIDIERT:
- Frontend: [Welche Validierungen]
- Backend: [Welche Validierungen]
\`\`\`

**AUSGEFÜLLT:**
\`\`\`markdown
Implementiere Validierung für Mietvertrags-Erstellung:

VALIDIERUNGEN:
1. start_date:
   - Darf nicht in Vergangenheit liegen (Warnung, nicht blockierend)
   - Required
   - Fehlermeldung: "Startdatum ist erforderlich"

2. end_date:
   - Muss nach start_date liegen
   - Optional (unbefristet möglich)
   - Fehlermeldung: "Enddatum muss nach Startdatum liegen"

3. base_rent:
   - Muss > 0 sein
   - Max 2 Dezimalstellen
   - Fehlermeldung: "Kaltmiete muss größer als 0 sein"

4. tenant_id:
   - Tenant muss existieren
   - Fehlermeldung: "Mieter nicht gefunden"

CROSS-FIELD VALIDIERUNGEN:
- Wenn end_date gesetzt → is_unlimited muss false sein
- utilities + heating + base_rent muss = total_rent sein

BUSINESS RULES:
- Unit darf keinen aktiven Vertrag haben für überlappenden Zeitraum
  Fehlermeldung: "Einheit ist bereits im Zeitraum [X] bis [Y] vermietet an [Mieter]"
  
- Wenn deposit_installments > 1 → deposit/deposit_installments muss <= base_rent sein (max. 1 Warmmiete pro Rate)
  Fehlermeldung: "Kautionsraten dürfen nicht höher als eine Monatsmiete sein"

WO VALIDIERT:
- Frontend: Required-Felder, Format-Validierungen, Berechnungen
- Backend: Business Rules, Existenz-Prüfungen, Überlappungs-Checks
\`\`\`

---

### 📄 TEMPLATE: Dokument-Template

\`\`\`markdown
Erstelle ein Dokument-Template für [Dokumenttyp]:

ZWECK:
[Wofür wird das Dokument verwendet]

DATENQUELLEN:
- [Entity 1] - [Welche Felder]
- [Entity 2] - [Welche Felder]

AUFBAU:
1. HEADER:
   - [Elemente]
   
2. EMPFÄNGER:
   - [Adresse-Feld-Struktur]
   
3. BETREFF:
   - [Text]
   
4. INHALT:
   - [Absatz 1]
   - [Absatz 2]
   - [...]
   
5. FOOTER:
   - [Elemente]

PLATZHALTER:
- {{feldname}} - Beschreibung
- {{entity.feldname}} - Beschreibung

TABELLEN:
- [Wenn Tabellen nötig, beschreiben]

RECHTLICHE ANFORDERUNGEN:
- [Welche Pflichtangaben]
\`\`\`

**AUSGEFÜLLT:**
\`\`\`markdown
Erstelle ein Dokument-Template für Mieterhöhungsschreiben nach §558 BGB:

ZWECK:
Rechtssicheres Schreiben zur Ankündigung einer Mieterhöhung.

DATENQUELLEN:
- Tenant - first_name, last_name, salutation
- Unit - address, city, postal_code
- LeaseContract - base_rent (alt), new_rent (berechnet), start_date
- Building - owner_name, owner_address

AUFBAU:
1. HEADER:
   - Logo (optional)
   - Absender-Adresse
   - Datum (heute)
   
2. EMPFÄNGER:
   - {{tenant.salutation}} {{tenant.first_name}} {{tenant.last_name}}
   - {{unit.address}}
   - {{unit.postal_code}} {{unit.city}}
   
3. BETREFF:
   Mieterhöhung für {{unit.address}} gemäß § 558 BGB
   
4. INHALT:
   Sehr geehrte/r {{tenant.salutation}} {{tenant.last_name}},
   
   hiermit erhöhen wir mit Wirkung zum {{increase_date}} die monatliche
   Grundmiete für die von Ihnen gemietete Wohnung in {{unit.address}} 
   von derzeit {{contract.base_rent}} € auf {{new_rent}} €.
   
   Die Erhöhung ist nach § 558 BGB zulässig, da:
   - seit der letzten Mieterhöhung mehr als 15 Monate vergangen sind
   - die Erhöhung innerhalb der gesetzlichen Kappungsgrenze liegt
   - die neue Miete die ortsübliche Vergleichsmiete nicht übersteigt
   
   [Referenz zum Mietspiegel]
   
   Bitte teilen Sie uns bis zum {{deadline_date}} mit, ob Sie der 
   Mieterhöhung zustimmen.
   
   Mit freundlichen Grüßen
   {{building.owner_name}}
   
5. FOOTER:
   - Unterschrift-Zeile
   - Kontaktdaten

PLATZHALTER:
- {{tenant.salutation}} - Anrede (Herr/Frau)
- {{tenant.first_name}} - Vorname
- {{tenant.last_name}} - Nachname
- {{unit.address}} - Adresse der Wohnung
- {{contract.base_rent}} - Aktuelle Kaltmiete
- {{new_rent}} - Neue Kaltmiete (berechnet)
- {{increase_date}} - Datum ab wann Erhöhung gilt
- {{deadline_date}} - Frist für Zustimmung
- {{building.owner_name}} - Name Vermieter

RECHTLICHE ANFORDERUNGEN:
- § 558 BGB Referenz
- Ankündigungsfrist 3 Monate zum Monatsende
- Zustimmungsfrist 2 Monate
- Begründung der Erhöhung (Mietspiegel-Referenz)
- Kappungsgrenze (20% in 3 Jahren oder 15% in 3 Jahren je nach Region)
\`\`\`

---

## 13. META-HINWEISE FÜR EXTERNE KI-ASSISTENTEN

### 🤖 WENN DU (CLAUDE) PROMPTS FÜR BASE44 GENERIERST

1. **ANALYSIERE ZUERST** was der User wirklich braucht
2. **STRUKTURIERE** den Prompt nach obigen Templates
3. **SEI SPEZIFISCH** bei Felddefinitionen und Anforderungen
4. **GIB KONTEXT** zu Geschäftslogik und Use-Cases
5. **NUTZE BEISPIELE** wo hilfreich
6. **TEILE AUF** wenn nötig (große Features in logische Blöcke)
7. **PRÜFE** ob alle benötigten Infos im Prompt sind

### ✅ QUALITÄTS-CHECKLISTE FÜR PROMPTS

Ein guter Prompt für base44 sollte:
- [ ] Klares Ziel definieren
- [ ] Vollständige Feld-Definitionen enthalten (bei Entities)
- [ ] Typen und Flags angeben (required, optional, default)
- [ ] Beziehungen explizit nennen
- [ ] Validierungen spezifizieren
- [ ] Geschäftslogik beschreiben
- [ ] UI-Layout erklären (bei Komponenten)
- [ ] Interaktionen definieren
- [ ] Beispieldaten enthalten (wo hilfreich)
- [ ] Rechtliche/fachliche Anforderungen nennen

### 🎯 BEISPIEL-ABLAUF

**User zu Claude:**
"Ich brauche eine Lösung für Schadensmeldungen von Mietern."

**Claude analysiert:**
- Was: Schadensmeldesystem
- Wer: Mieter (melden), Vermieter (bearbeiten)
- Daten: Schaden-Details, Fotos, Status, Kosten
- Prozess: Melden → Prüfen → Beauftragen → Abschließen

**Claude generiert Prompt für base44:**
\`\`\`markdown
Erstelle ein Schadensmeldungs-System:

1. ENTITY "DamageReport":
   - unit_id (string, required) - Betroffene Einheit
   - tenant_id (string, required) - Meldender Mieter
   - title (string, required) - Kurzbeschreibung
   - description (string, required) - Detaillierte Beschreibung
   - category (enum["wasserschaden", "elektrik", "heizung", "fenster", "sonstiges"], required)
   - urgency (enum["normal", "dringend", "notfall"], default: "normal")
   - status (enum["gemeldet", "in_pruefung", "in_reparatur", "erledigt", "abgelehnt"], default: "gemeldet")
   - reported_date (date, default: today) - Meldedatum
   - photos (array of strings, optional) - URLs zu Fotos
   - estimated_cost (number, optional) - Geschätzte Kosten
   - actual_cost (number, optional) - Tatsächliche Kosten
   - completed_date (date, optional) - Abschlussdatum
   - internal_notes (string, optional) - Interne Notizen
   - tenant_liable (boolean, default: false) - Mieter haftet

2. UI-KOMPONENTEN:
   a) DamageReportForm (für Mieter):
      - Einfaches Formular mit Pflichtfeldern
      - Foto-Upload (max 5 Bilder)
      - Submit → erstellt Report mit status="gemeldet"
      - Notification an Vermieter
      
   b) DamageReportList (für Vermieter):
      - Card-Layout mit Filtern (Status, Dringlichkeit, Gebäude)
      - Badges für Status und Dringlichkeit (Farb-Coding)
      - Click → Detail-Ansicht
      
   c) DamageReportDetail (für Vermieter):
      - Vollständige Anzeige aller Infos
      - Foto-Galerie
      - Status-Workflow-Buttons
      - Kosten-Eingabe
      - Notizen-Feld

3. GESCHÄFTSLOGIK:
   - Bei status="notfall" → Sofortige Notification
   - Bei Status-Wechsel → Update Zeitstempel
   - Bei status="erledigt" → completed_date setzen
   - Statistik: Durchschnittliche Bearbeitungszeit pro Kategorie

4. BERECHTIGUNGEN:
   - Mieter: Können nur eigene Reports sehen und erstellen
   - Vermieter: Sehen alle Reports ihrer Gebäude

5. DASHBOARD-WIDGET:
   - Anzahl offener Schadensmeldungen
   - Anzahl Notfälle
   - Durchschnittliche Reaktionszeit
\`\`\`

**Base44 implementiert:**
✅ Entity erstellt
✅ UI-Komponenten erstellt
✅ Geschäftslogik implementiert
✅ Dashboard-Widget hinzugefügt

---

## 🎓 FAZIT

Base44 ist am besten wenn:
- ✅ Anfragen **klar strukturiert** sind
- ✅ **Geschäftskontext** gegeben ist
- ✅ **Beispiele** verwendet werden
- ✅ **Vollständige Specs** bei komplexen Features
- ✅ **Referenzen** zu vorhandenem Code

Base44 arbeitet **pragmatisch**:
- Nimmt sinnvolle Defaults an
- Fragt nach wenn kritisch
- Implementiert Best Practices automatisch
- Nutzt etablierte Patterns

**Als externer KI-Assistent solltest du:**
1. User-Anfragen in strukturierte Specs umwandeln
2. Templates aus diesem Dokument verwenden
3. Fehlende Infos beim User erfragen (nicht raten)
4. Komplexe Features in logische Blöcke teilen
5. Kontext aus vorhandenem Code einbeziehen
6. Deutsche Fachterminologie verwenden (bei deutschem Kontext)

---

**Version:** 1.0  
**Erstellt:** ${new Date().toISOString().split('T')[0]}  
**Für:** base44 AI Assistant  
**Von:** base44 AI Assistant (Self-Documentation)
`;

        // Erstelle oder Update die Dokumentation
        const existingDocs = await base44.entities.GeneratedDocumentation.filter({
            documentation_type: 'prompt_best_practices'
        });

        const docData = {
            documentation_type: 'prompt_best_practices',
            title: 'Base44 AI Assistant - Prompt Best Practices',
            description: 'Leitfaden für externe KI-Assistenten zur optimalen Prompt-Formulierung für base44',
            content_markdown: content,
            content_json: {
                version: '1.0',
                target_audience: 'External AI Assistants',
                language: 'German/English',
                sections: [
                    'Prompt-Struktur',
                    'Beispiele',
                    'Syntax',
                    'Datenbank-Anfragen',
                    'UI/UX-Anfragen',
                    'Funktionale Anforderungen',
                    'Schrittweise vs. Alles-auf-einmal',
                    'Kontext-Information',
                    'Iterations-Prozess',
                    'Typische Fehler',
                    'Base44-Features',
                    'Templates',
                    'Meta-Hinweise'
                ]
            },
            file_size_bytes: new Blob([content]).size,
            generation_duration_seconds: (Date.now() - startTime) / 1000,
            last_generated_at: new Date().toISOString(),
            status: 'completed',
            version_number: existingDocs.length > 0 ? (existingDocs[0].version_number || 1) + 1 : 1,
            previous_version_id: existingDocs.length > 0 ? existingDocs[0].id : null
        };

        let documentationId;
        if (existingDocs.length > 0) {
            await base44.entities.GeneratedDocumentation.update(existingDocs[0].id, docData);
            documentationId = existingDocs[0].id;
        } else {
            const newDoc = await base44.entities.GeneratedDocumentation.create(docData);
            documentationId = newDoc.id;
        }

        return Response.json({
            success: true,
            documentation_id: documentationId,
            file_size_bytes: docData.file_size_bytes,
            generation_duration_seconds: docData.generation_duration_seconds,
            version_number: docData.version_number
        });

    } catch (error) {
        console.error('Generate prompt best practices error:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});