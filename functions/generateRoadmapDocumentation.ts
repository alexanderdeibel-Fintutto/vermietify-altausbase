import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const startTime = Date.now();

        const content = `# Roadmap & Tech-Debt Dokumentation

**Generiert am:** ${new Date().toISOString().split('T')[0]}  
**Version:** 1.0  
**Stand:** Q1 2026

---

## 1. IN ENTWICKLUNG (AKTUELL)

### 🚧 Features in Arbeit

**1. Automatische Buchungs-Aktualisierung bei Vertragsänderungen**
- **Status:** 🟡 In Arbeit (80% fertig)
- **Beschreibung:** Wenn ein Mietvertrag geändert wird (z.B. Miete erhöht), werden zukünftige Buchungen automatisch aktualisiert
- **Komponenten:**
  - UpdateWarningDialog (✅ fertig)
  - Automatische Erkennung von Änderungen (✅ fertig)
  - Bulk-Update-Logik (🚧 in Arbeit)
- **ETA:** Ende Januar 2026
- **Priorität:** 🔴 Hoch

**2. Background-Jobs für BK-Abrechnung**
- **Status:** 🟡 In Planung/Design-Phase
- **Beschreibung:** Betriebskostenabrechnungen laufen im Hintergrund, User bekommt Email wenn fertig
- **Komponenten:**
  - Job-Queue-System (🚧 in Arbeit)
  - Progress-Tracking (📋 geplant)
  - Email-Benachrichtigung (📋 geplant)
- **ETA:** Februar 2026
- **Priorität:** 🟠 Mittel-Hoch

**3. PDF-Generierung Optimierung**
- **Status:** 🟡 Erste Tests laufen
- **Beschreibung:** Schnellere PDF-Generierung durch Caching und optimiertes Rendering
- **Technische Details:**
  - Template-Caching implementiert (✅ fertig)
  - Lazy-Loading von Bildern (🚧 in Arbeit)
  - Dedizierter PDF-Worker (📋 geplant)
- **ETA:** Ende Februar 2026
- **Priorität:** 🟠 Mittel

**4. Erweiterte AI-Kategorisierung für Rechnungen**
- **Status:** 🟢 Beta-Testing
- **Beschreibung:** Bessere automatische Kategorisierung mit Lerneffekt
- **Features:**
  - Erkennung von Rechnungstypen (✅ fertig)
  - Vorschläge basierend auf Historie (✅ fertig)
  - User-Feedback-Loop (🚧 in Arbeit)
- **ETA:** Ende Januar 2026
- **Priorität:** 🟡 Mittel

---

## 2. GEPLANT (NÄCHSTE 3-6 MONATE)

### 📅 Q1 2026 (Januar - März)

**1. Mieter-Portal (Self-Service)**
- **Priorität:** 🔴🔴🔴 Sehr hoch (Top-Request von Usern)
- **Beschreibung:** Mieter können sich einloggen und:
  - Zählerstände selbst eingeben
  - Dokumente (BK-Abrechnung, Mietverträge) abrufen
  - Reparaturmeldungen erstellen
  - Miete-Zahlungen einsehen
- **Technische Umsetzung:**
  - Separater Login-Bereich für Mieter
  - Neues Permission-System (Mieter darf nur eigene Daten sehen)
  - Email-Benachrichtigungen
- **Aufwand:** 15 Arbeitstage
- **ETA:** März 2026

**2. Automatische Mahnungs-Workflows**
- **Priorität:** 🔴 Hoch
- **Beschreibung:** Automatische Erinnerungen und Mahnungen bei Zahlungsverzug
- **Features:**
  - Stufe 1: Freundliche Erinnerung (7 Tage nach Fälligkeit)
  - Stufe 2: Erste Mahnung (14 Tage nach Fälligkeit)
  - Stufe 3: Zweite Mahnung (28 Tage nach Fälligkeit)
  - Automatische Dokumenten-Generierung
  - Optional: Automatischer Versand per LetterXpress
- **Aufwand:** 10 Arbeitstage
- **ETA:** Februar 2026

**3. Verbessertes Dashboard mit Widgets**
- **Priorität:** 🟠 Mittel-Hoch
- **Beschreibung:** Konfigurierbares Dashboard mit Drag & Drop
- **Features:**
  - Widgets frei positionierbar
  - Auswahl welche Widgets angezeigt werden
  - Custom-Zeiträume für Statistiken
  - Export als PDF/Excel
- **Aufwand:** 8 Arbeitstage
- **ETA:** März 2026

**4. Mobile-App (PWA)**
- **Priorität:** 🟡 Mittel
- **Beschreibung:** Progressive Web App für bessere Mobile-Experience
- **Features:**
  - Offline-Funktionalität (limitiert)
  - Push-Notifications
  - Kamera-Integration (Belege fotografieren)
  - Installierbar auf Smartphone
- **Aufwand:** 12 Arbeitstage
- **ETA:** März 2026

---

### 📅 Q2 2026 (April - Juni)

**1. Erweiterte Steuer-Features**
- **Priorität:** 🔴 Hoch
- **Beschreibung:** Mehr Steuerformulare und Automatisierung
- **Features:**
  - EÜR (Einnahmen-Überschuss-Rechnung) für Gewerbliche
  - Gewerbesteuer-Erklärung
  - Umsatzsteuer-Voranmeldung automatisch aus Daten
  - ELSTER-Export (XML)
  - AfA-Übersicht mit Restbuchwerten
- **Aufwand:** 20 Arbeitstage
- **ETA:** Juni 2026

**2. Vertrags-Management Erweiterungen**
- **Priorität:** 🟠 Mittel-Hoch
- **Beschreibung:** Bessere Verwaltung von Vertragsänderungen
- **Features:**
  - Indexmiete mit automatischer Anpassung
  - Staffelmiete-Unterstützung
  - Vertragsverlängerungs-Wizard
  - Automatische Erinnerung bei auslaufenden Verträgen
  - Kündigungsfristen-Berechnung
- **Aufwand:** 10 Arbeitstage
- **ETA:** Mai 2026

**3. Reporting & Analytics**
- **Priorität:** 🟠 Mittel-Hoch
- **Beschreibung:** Erweiterte Auswertungen und Reports
- **Features:**
  - Rendite-Berechnung (ROI, Cash-on-Cash Return)
  - Vermietungsquote über Zeit
  - Kostenentwicklung (Trends)
  - Vergleich mehrerer Objekte
  - Custom-Reports (Excel/PDF)
- **Aufwand:** 12 Arbeitstage
- **ETA:** Juni 2026

**4. Dokumenten-Management Verbesserungen**
- **Priorität:** 🟡 Mittel
- **Beschreibung:** Bessere Organisation von Dokumenten
- **Features:**
  - Ordner-Struktur
  - Tags/Labels
  - Volltext-Suche in PDFs (OCR)
  - Versionierung
  - Digitale Signatur
- **Aufwand:** 8 Arbeitstage
- **ETA:** Juni 2026

---

### 📅 Q3 2026 (Juli - September)

**1. Multi-User / Team-Funktionalität**
- **Priorität:** 🟠 Mittel-Hoch
- **Beschreibung:** Mehrere Verwalter können zusammenarbeiten
- **Features:**
  - Rollen-System (Admin, Buchhalter, Techniker, etc.)
  - Aufgaben-Zuweisung
  - Aktivitäts-Log (wer hat was gemacht)
  - Kommentare/Notizen
  - Rechteverwaltung pro Objekt
- **Aufwand:** 15 Arbeitstage
- **ETA:** August 2026

**2. Eigene PSD2-Bank-Anbindung (ohne finAPI)**
- **Priorität:** 🟡 Mittel (langfristig wichtig)
- **Beschreibung:** Direkte Bank-Anbindung spart Kosten und Abhängigkeit
- **Technische Umsetzung:**
  - PSD2-API-Integration
  - OAuth2-Flow für Bank-Autorisierung
  - Unterstützung für deutsche Banken
  - Migration von finAPI zu eigener Lösung
- **Aufwand:** 30 Arbeitstage (großes Projekt)
- **ETA:** September 2026

**3. WEG-Verwaltung (Wohnungseigentümergemeinschaft)**
- **Priorität:** 🟡 Mittel (Nischen-Feature, aber wichtig)
- **Beschreibung:** Spezielle Features für WEG-Verwalter
- **Features:**
  - Eigentümer-Versammlungen (Protokolle, Beschlüsse)
  - Hausgeld-Verwaltung
  - Instandhaltungsrücklagen
  - Stimmrechte und Anteile
  - Wirtschaftsplan
- **Aufwand:** 20 Arbeitstage
- **ETA:** September 2026

---

## 3. LANGFRISTIG (VISION 2026-2027)

### 🔮 Große Vision

**Ziel:** Die umfassendste, KI-gestützte Immobilienverwaltungs-Plattform für Deutschland

---

### 💡 GEPLANTE GROSSE FEATURES

**1. Vollständige Automatisierung (AI-First)**
- **Vision:** KI übernimmt 80% der Routine-Arbeiten
- **Features:**
  - AI-Assistent beantwortet Mieter-Anfragen automatisch
  - Automatische Rechnungs-Verarbeitung (OCR → Kategorisierung → Buchung)
  - Automatische Vertragsverlängerungen
  - Predictive Maintenance (KI sagt Reparaturen voraus)
  - Automatische Optimierungs-Vorschläge (Kosten senken, Einnahmen erhöhen)
- **ETA:** 2027

**2. Marktplatz / Integrations-Hub**
- **Vision:** Ökosystem mit Third-Party-Integrationen
- **Features:**
  - Handwerker-Portal (Aufträge direkt vergeben)
  - Versicherungs-Vergleich (automatisch bessere Angebote finden)
  - Energieausweis-Service
  - Immobilien-Bewertung (automatisch)
  - Makler-Integration (Vermarktung von Leerständen)
- **ETA:** 2027

**3. Portfolio-Management für Investoren**
- **Vision:** Profi-Tool für Portfolio-Investoren
- **Features:**
  - Multi-Objekt-Dashboard (100+ Objekte)
  - Advanced Analytics (ROI, IRR, Cash-Flow-Projektionen)
  - Szenario-Planung ("Was-wäre-wenn" Analysen)
  - Benchmarking (Vergleich mit Markt)
  - Automatische Investment-Reports
- **ETA:** 2027

**4. Blockchain-basierte Mietverträge (Smart Contracts)**
- **Vision:** Mietverträge als Smart Contracts auf Blockchain
- **Features:**
  - Unveränderbare Vertrags-Historie
  - Automatische Mietzahlung (Krypto oder SEPA)
  - Kautions-Verwaltung via Smart Contract
  - Digitale Identität für Mieter
- **ETA:** 2027+ (experimentell)

**5. Nachhaltigkeits-Tracking**
- **Vision:** CO2-Fußabdruck von Immobilien tracken
- **Features:**
  - Energie-Monitoring (Smart Meter Integration)
  - CO2-Bilanz pro Objekt
  - Optimierungs-Vorschläge (z.B. Solaranlage)
  - ESG-Reporting (für institutionelle Investoren)
  - EU-Taxonomie-Konformität
- **ETA:** 2027

**6. Voice-Interface (Alexa/Google Home)**
- **Vision:** "Alexa, wie hoch ist meine Mietrendite?"
- **Features:**
  - Sprach-gesteuerte Abfragen
  - Sprach-Eingabe (Rechnungen diktieren)
  - Notifications via Smart Speaker
- **ETA:** 2027+

**7. VR/AR für Immobilien-Begehungen**
- **Vision:** Virtuelle Objektbegehungen mit AR-Anmerkungen
- **Features:**
  - 360°-Touren erstellen
  - Reparatur-Markierungen in AR
  - Virtuelle Staging (für Leerstandswohnungen)
- **ETA:** 2027+

---

## 4. BEKANNTE TECH-DEBT

### 🔧 CODE-QUALITÄT & REFACTORING

**1. N+1 Query Problem in Listen-Komponenten**
- **Problem:** Viele Komponenten laden Daten ineffizient (N+1 Queries)
- **Betroffene Komponenten:**
  - ContractsList (lädt Tenant + Unit pro Vertrag einzeln)
  - InvoicesList (lädt Building pro Rechnung einzeln)
  - DocumentsList (lädt Building + Tenant einzeln)
- **Impact:** Performance-Problem ab >100 Einträgen
- **Lösung:** Eager-Loading mit GraphQL-Style Queries
- **Aufwand:** 3 Arbeitstage
- **Priorität:** 🔴 Hoch

**2. Inkonsistente State-Management**
- **Problem:** Mix aus React Query, useState, Context
- **Betroffene Bereiche:** Finanz-Module, Dokumente
- **Impact:** Bugs durch inkonsistenten State, schwer zu debuggen
- **Lösung:** Vollständig auf React Query migrieren
- **Aufwand:** 5 Arbeitstage
- **Priorität:** 🟠 Mittel-Hoch

**3. Duplikate Code in Formularen**
- **Problem:** Ähnliche Formulare (z.B. BuildingForm, UnitForm) haben viel duplizierten Code
- **Impact:** Schwer zu warten, Inkonsistenzen
- **Lösung:** 
  - Generischer FormBuilder
  - Shared Validation-Logic
  - JSON-Schema-basierte Formulare
- **Aufwand:** 8 Arbeitstage
- **Priorität:** 🟡 Mittel

**4. Fehlende Unit-Tests**
- **Problem:** Kritische Business-Logic nicht getestet
- **Betroffene Bereiche:**
  - AfA-Berechnungen
  - BK-Abrechnung (Umlageschlüssel)
  - Mieterhöhungs-Validierung
- **Impact:** Bugs in komplexer Logic werden erst spät entdeckt
- **Lösung:** Test-Suite aufbauen (Jest + React Testing Library)
- **Aufwand:** 10 Arbeitstage
- **Priorität:** 🟠 Mittel-Hoch

**5. Monolithische Seiten (zu groß)**
- **Problem:** Einige Pages sind >800 Zeilen (z.B. BuildingDetail, Finanzen)
- **Impact:** Unübersichtlich, schwer zu warten
- **Lösung:** 
  - Aufteilen in kleinere Sub-Components
  - Custom Hooks für Logic
  - Feature-basierte Ordner-Struktur
- **Aufwand:** 5 Arbeitstage
- **Priorität:** 🟡 Mittel

**6. Fehlende Error-Boundaries**
- **Problem:** Fehler in Komponenten crashen die ganze App
- **Impact:** Schlechte User-Experience bei Fehlern
- **Lösung:** Error-Boundaries auf Page-Level + Sentry-Integration
- **Aufwand:** 2 Arbeitstage
- **Priorität:** 🟠 Mittel-Hoch

---

### 🏗️ ARCHITEKTUR & INFRASTRUKTUR

**1. Fehlende Backend-Function-Organisation**
- **Problem:** Alle Functions in einem Ordner (functions/), keine Struktur
- **Impact:** Unübersichtlich, schwer zu finden
- **Lösung:** 
  - Ordner-Struktur: functions/finance/, functions/documents/, etc.
  - Shared-Logic auslagern
- **Aufwand:** 2 Arbeitstage
- **Priorität:** 🟡 Mittel

**2. Keine CI/CD Pipeline**
- **Problem:** Manuelle Deployments, keine automatischen Tests
- **Impact:** Fehleranfällig, langsam
- **Lösung:** 
  - GitHub Actions für Tests
  - Automatische Deployments (Staging + Production)
  - Preview-Deployments für PRs
- **Aufwand:** 5 Arbeitstage
- **Priorität:** 🟠 Mittel-Hoch

**3. Fehlende Monitoring & Logging**
- **Problem:** Keine zentralen Logs, kein Error-Tracking
- **Impact:** Bugs werden spät erkannt, schwer zu debuggen
- **Lösung:** 
  - Sentry für Error-Tracking
  - Structured Logging (JSON)
  - Performance-Monitoring (Web Vitals)
- **Aufwand:** 3 Arbeitstage
- **Priorität:** 🟠 Mittel-Hoch

**4. Keine Rate-Limiting für Backend-Functions**
- **Problem:** User können theoretisch DoS-Angriff machen
- **Impact:** Sicherheitsrisiko, Kosten-Explosion
- **Lösung:** Rate-Limiting pro User/IP
- **Aufwand:** 2 Arbeitstage
- **Priorität:** 🟠 Mittel-Hoch

---

### 📚 DATENBANK & DATA-MODEL

**1. Fehlende Soft-Deletes**
- **Problem:** Gelöschte Daten sind wirklich weg (keine Wiederherstellung)
- **Impact:** Datenverlust bei versehentlichem Löschen
- **Lösung:** 
  - Soft-Delete-Flag (deleted_at) für alle Entities
  - Wiederherstellen-Funktion
- **Aufwand:** 5 Arbeitstage
- **Priorität:** 🟠 Mittel-Hoch

**2. Fehlende Audit-Logs**
- **Problem:** Keine Historie wer was wann geändert hat
- **Impact:** Nicht nachvollziehbar bei Fehlern oder Streitfällen
- **Lösung:** 
  - ActivityLog für alle kritischen Änderungen
  - Automatisches Logging via Datenbank-Triggers
- **Aufwand:** 3 Arbeitstage
- **Priorität:** 🟡 Mittel

**3. Inkonsistente Benennung**
- **Problem:** Mix aus Englisch/Deutsch in Entity-Namen und Feldern
- **Impact:** Verwirrend für Entwickler
- **Lösung:** 
  - Konvention festlegen (z.B. Entity-Namen englisch, Labels deutsch)
  - Schrittweise Migration
- **Aufwand:** 5 Arbeitstage
- **Priorität:** 🟢 Niedrig (kosmetisch)

**4. Fehlende Datenbank-Indizes**
- **Problem:** Queries auf large tables ohne Index sind langsam
- **Betroffene Felder:**
  - Invoice.building_id
  - GeneratedFinancialBooking.due_date
  - BankTransaction.booking_date
- **Impact:** Performance-Problem ab >1.000 Einträgen
- **Lösung:** Indizes hinzufügen
- **Aufwand:** 1 Arbeitstag
- **Priorität:** 🔴 Hoch

---

### 🎨 UI/UX

**1. Inkonsistentes Design-System**
- **Problem:** Mix aus verschiedenen Button-Styles, Spacing, etc.
- **Impact:** Uneinheitliches Look & Feel
- **Lösung:** 
  - Design-System dokumentieren
  - Storybook für UI-Komponenten
  - Tailwind-Config standardisieren
- **Aufwand:** 5 Arbeitstage
- **Priorität:** 🟡 Mittel

**2. Fehlende Loading-States**
- **Problem:** Einige Komponenten zeigen keinen Loader während Daten geladen werden
- **Impact:** User denkt App ist kaputt
- **Lösung:** Konsistente Loading-Skeleton-Komponenten
- **Aufwand:** 2 Arbeitstage
- **Priorität:** 🟠 Mittel-Hoch

**3. Fehlende Empty-States**
- **Problem:** Leere Listen zeigen nur "Keine Einträge"
- **Impact:** User weiß nicht was zu tun ist
- **Lösung:** Hilfreiche Empty-States mit CTAs
- **Aufwand:** 2 Arbeitstage
- **Priorität:** 🟡 Mittel

---

### 🔐 SICHERHEIT

**1. Fehlende Input-Validierung (Frontend + Backend)**
- **Problem:** User-Input wird nicht überall validiert
- **Impact:** Potenzielle XSS/SQL-Injection-Angriffe
- **Lösung:** 
  - Zod-Schema für alle Formulare
  - Backend-Validierung in allen Functions
- **Aufwand:** 5 Arbeitstage
- **Priorität:** 🔴 Hoch

**2. Fehlende CSRF-Protection**
- **Problem:** Keine CSRF-Tokens
- **Impact:** Potenzielle CSRF-Angriffe
- **Lösung:** CSRF-Token-System implementieren
- **Aufwand:** 2 Arbeitstage
- **Priorität:** 🟠 Mittel-Hoch

**3. Secrets in Frontend-Code**
- **Problem:** API-Keys werden teilweise im Frontend verwendet
- **Impact:** Sicherheitsrisiko
- **Lösung:** Alle API-Calls über Backend-Functions
- **Aufwand:** 3 Arbeitstage
- **Priorität:** 🔴 Hoch

---

## 5. PRIORISIERUNG (GESAMT)

### 🔥 KRITISCH (Sofort angehen)
1. N+1 Query Problem
2. Fehlende Datenbank-Indizes
3. Input-Validierung (Security)
4. Secrets in Frontend-Code

### 🔴 HOCH (Q1 2026)
1. Automatische Buchungs-Aktualisierung
2. Mieter-Portal
3. Automatische Mahnungen
4. Error-Boundaries
5. Soft-Deletes

### 🟠 MITTEL-HOCH (Q2 2026)
1. Erweiterte Steuer-Features
2. Reporting & Analytics
3. CI/CD Pipeline
4. Monitoring & Logging
5. Inkonsistentes State-Management

### 🟡 MITTEL (Q3 2026)
1. Multi-User / Team
2. WEG-Verwaltung
3. Dokumenten-Management Verbesserungen
4. Duplikate Code in Formularen

### 🟢 NIEDRIG (Später)
1. Inkonsistente Benennung
2. Inkonsistentes Design-System
3. Empty-States

---

## 6. TECHNOLOGIE-TRENDS DIE WIR IM AUGE BEHALTEN

**AI/ML:**
- GPT-5 / Claude 4 (wenn verfügbar)
- Local LLMs (für Privacy)
- Multi-Modal AI (Vision + Text)

**Web-Technologien:**
- React Server Components
- Edge-Computing
- WebAssembly (für Performance)

**Blockchain:**
- Smart Contracts für Mietverträge
- Decentralized Storage (IPFS für Dokumente)

**IoT:**
- Smart Meter Integration
- Smart Home Integration (Heizung, etc.)

---

**Ende der Dokumentation**

Diese Roadmap wird quartalsweise aktualisiert und ist nicht in Stein gemeißelt. Prioritäten können sich basierend auf User-Feedback ändern.
`;

        const duration = (Date.now() - startTime) / 1000;

        // Speichere Dokumentation
        const doc = await base44.entities.GeneratedDocumentation.create({
            documentation_type: 'roadmap_techdebt',
            title: 'Roadmap & Tech-Debt Dokumentation (STATISCH)',
            description: 'Snapshot: In Entwicklung, Geplante Features, Langfristige Vision und bekannte Tech-Debt. Für Live-Daten siehe 🚀 Projekt-Management.',
            content_markdown: content,
            content_json: {
                in_development: [
                    'Automatische Buchungs-Aktualisierung',
                    'Background-Jobs für BK-Abrechnung',
                    'PDF-Optimierung',
                    'Erweiterte AI-Kategorisierung'
                ],
                planned_q1: [
                    'Mieter-Portal',
                    'Automatische Mahnungen',
                    'Dashboard-Widgets',
                    'Mobile-App (PWA)'
                ],
                planned_q2: [
                    'Erweiterte Steuer-Features',
                    'Vertrags-Management',
                    'Reporting & Analytics',
                    'Dokumenten-Management'
                ],
                planned_q3: [
                    'Multi-User / Team',
                    'Eigene PSD2-Anbindung',
                    'WEG-Verwaltung'
                ],
                vision_2027: [
                    'AI-First Automatisierung',
                    'Marktplatz / Integrations-Hub',
                    'Portfolio-Management',
                    'Blockchain Smart Contracts',
                    'Nachhaltigkeits-Tracking'
                ],
                tech_debt_critical: [
                    'N+1 Query Problem',
                    'Fehlende Datenbank-Indizes',
                    'Input-Validierung',
                    'Secrets in Frontend'
                ],
                tech_debt_high: [
                    'Inkonsistentes State-Management',
                    'Fehlende Unit-Tests',
                    'Error-Boundaries',
                    'Soft-Deletes'
                ]
            },
            file_size_bytes: new Blob([content]).size,
            generation_duration_seconds: duration,
            last_generated_at: new Date().toISOString(),
            status: 'completed'
        });

        return Response.json({
            success: true,
            documentation_id: doc.id,
            file_size_bytes: doc.file_size_bytes,
            generation_duration_seconds: duration
        });

    } catch (error) {
        console.error('Generate roadmap documentation error:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});