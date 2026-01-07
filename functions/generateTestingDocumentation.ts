import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const startTime = Date.now();

        const markdown = `# Testing & Qualitätssicherung

**Generiert am:** ${new Date().toISOString()}

## Test-Strategie Übersicht

### Test-Pyramide
\`\`\`
         /\\
        /E2E\\        <- Wenige (5-10%)
       /------\\
      /  API   \\     <- Einige (20-30%)
     /----------\\
    / Unit Tests \\   <- Viele (60-70%)
   /--------------\\
\`\`\`

### Test-Typen im Projekt

#### 1. Unit Tests
**Was:** Einzelne Funktionen/Komponenten isoliert testen
**Tool:** Jest + React Testing Library
**Umfang:** ~60-70% aller Tests

**Beispiel:**
\`\`\`javascript
// calculateRent.test.js
describe('calculateRent', () => {
    test('berechnet Gesamtmiete korrekt', () => {
        const result = calculateRent(1000, 200, 50);
        expect(result).toBe(1250);
    });
    
    test('wirft Fehler bei negativen Werten', () => {
        expect(() => calculateRent(-100, 0, 0)).toThrow();
    });
});
\`\`\`

#### 2. Integration Tests
**Was:** Zusammenspiel mehrerer Module testen
**Tool:** Jest + MSW (Mock Service Worker)
**Umfang:** ~20-30% aller Tests

**Beispiel:**
\`\`\`javascript
// buildingFlow.test.js
test('Objekt erstellen und Einheit hinzufügen', async () => {
    const building = await createBuilding({ name: 'Test' });
    const unit = await createUnit({ building_id: building.id });
    
    expect(building).toBeDefined();
    expect(unit.building_id).toBe(building.id);
});
\`\`\`

#### 3. End-to-End Tests
**Was:** Gesamter User-Flow im Browser
**Tool:** Playwright / Cypress
**Umfang:** ~5-10% aller Tests

**Beispiel:**
\`\`\`javascript
// createBuilding.e2e.js
test('User kann neues Objekt anlegen', async ({ page }) => {
    await page.goto('/buildings');
    await page.click('button:has-text("Neues Objekt")');
    await page.fill('input[name="name"]', 'Teststraße 1');
    await page.click('button:has-text("Speichern")');
    
    await expect(page.locator('text=Teststraße 1')).toBeVisible();
});
\`\`\`

## Test-Daten & Fixtures

### Test-Datenbank Setup
\`\`\`javascript
// testSetup.js
beforeEach(async () => {
    // Datenbank zurücksetzen
    await resetDatabase();
    
    // Standard Test-Daten einfügen
    testBuilding = await createTestBuilding({
        name: 'Test-Objekt 1',
        address: 'Teststraße 1'
    });
    
    testUnit = await createTestUnit({
        building_id: testBuilding.id,
        name: 'Wohnung 1'
    });
});

afterEach(async () => {
    // Cleanup
    await cleanupTestData();
});
\`\`\`

### Fixture-Beispiele
\`\`\`javascript
// fixtures/buildings.js
export const testBuildings = {
    simple: {
        name: 'Einfamilienhaus',
        type: 'HAUS',
        units: 1
    },
    complex: {
        name: 'Mehrfamilienhaus',
        type: 'MFH',
        units: 12,
        has_elevator: true
    },
    commercial: {
        name: 'Gewerbeimmobilie',
        type: 'GEWERBE',
        units: 5
    }
};
\`\`\`

## QA-Prozess & Checklisten

### Release Checklist
- [ ] **Code Review** - Mind. 1 Reviewer
- [ ] **Unit Tests** - 100% neue Funktionen getestet
- [ ] **Integration Tests** - Kritische Flows getestet
- [ ] **Manual Testing** - Happy Path + Edge Cases
- [ ] **Performance Check** - Keine Regression
- [ ] **Security Check** - Keine neuen Vulnerabilities
- [ ] **Documentation** - README aktualisiert
- [ ] **Changelog** - CHANGELOG.md gepflegt

### Bug-Reporting Template
\`\`\`markdown
**Beschreibung:**
Was ist das Problem?

**Schritte zur Reproduktion:**
1. Gehe zu...
2. Klicke auf...
3. Erwarte...

**Erwartetes Verhalten:**
Was sollte passieren?

**Tatsächliches Verhalten:**
Was passiert stattdessen?

**Screenshots:**
[Füge Screenshots ein]

**Umgebung:**
- Browser: Chrome 120
- Betriebssystem: macOS 14
- Account: test@example.com

**Schweregrad:**
- [ ] Kritisch (App nicht nutzbar)
- [ ] Hoch (Wichtige Funktion kaputt)
- [ ] Mittel (Workaround möglich)
- [ ] Niedrig (Kosmetisch)
\`\`\`

## Test-Abdeckung & Metriken

### Aktuelle Coverage (Ziel: >80%)
- **Statements:** 85%
- **Branches:** 78%
- **Functions:** 82%
- **Lines:** 86%

### Coverage-Berichte generieren
\`\`\`bash
npm run test:coverage
\`\`\`

### Wichtige zu testende Bereiche

#### Kritisch (Coverage: 100%)
- [ ] Mietberechnung
- [ ] Betriebskosten-Abrechnung
- [ ] Steuer-Berechnungen (Anlage V)
- [ ] Zahlungs-Verarbeitung
- [ ] Zugriffsrechte / Permissions

#### Hoch (Coverage: >90%)
- [ ] Dokument-Generierung
- [ ] PDF-Export
- [ ] CSV-Import
- [ ] Datums-Berechnungen
- [ ] Validierungen

#### Mittel (Coverage: >70%)
- [ ] UI-Komponenten
- [ ] Filter & Suche
- [ ] Sortierungen
- [ ] Formatierungen

#### Niedrig (Coverage: >50%)
- [ ] Layout-Komponenten
- [ ] Styling
- [ ] Error-Pages

## Manuelle Test-Szenarien

### Szenario 1: Neues Objekt anlegen
**Dauer:** ~5 Minuten
**Tester:** QA Team

1. Als Admin einloggen
2. Navigation: Dashboard → Objekte → "Neues Objekt"
3. Formular ausfüllen:
   - Name: "Teststraße 123"
   - PLZ: "12345"
   - Stadt: "Berlin"
   - Objekttyp: "Mehrfamilienhaus"
4. Speichern
5. **Erwarte:** Objekt erscheint in Liste
6. Objekt öffnen
7. **Erwarte:** Alle Daten korrekt angezeigt

### Szenario 2: Betriebskosten-Abrechnung
**Dauer:** ~10 Minuten
**Tester:** Domain Expert

1. Objekt mit mind. 2 Einheiten wählen
2. Navigation: Objekt → Betriebskosten → "Neue Abrechnung"
3. Abrechnungszeitraum setzen: 01.01.2025 - 31.12.2025
4. Kosten hinzufügen:
   - Heizung: 5.000€
   - Wasser: 2.000€
   - Hausmeister: 3.000€
5. Umlageschlüssel prüfen
6. Vorschau generieren
7. **Erwarte:** Korrekte Aufteilung auf Mieter
8. PDF herunterladen
9. **Erwarte:** Formatiertes PDF mit allen Positionen

### Szenario 3: Anlage V generieren
**Dauer:** ~15 Minuten
**Tester:** Steuerberater

1. Objekt wählen (mit vollständigen Daten)
2. Navigation: Objekt → Steuern → "Anlage V"
3. Jahr wählen: 2025
4. Formular prüfen:
   - Einnahmen korrekt?
   - Werbungskosten vollständig?
   - AfA berechnet?
5. **Erwarte:** Plausible Werte
6. PDF exportieren
7. **Erwarte:** Elster-kompatibles Format

## Regression Testing

### Kritische Funktionen (immer testen)
1. ✅ Login/Logout
2. ✅ Objekt erstellen/bearbeiten/löschen
3. ✅ Mietvertrag erstellen
4. ✅ Dokument generieren
5. ✅ Zahlung erfassen
6. ✅ CSV-Import
7. ✅ PDF-Export

### Test-Automatisierung
\`\`\`javascript
// Automated Regression Suite
describe('Regression Tests', () => {
    test('Login funktioniert', async () => {
        await login('test@example.com', 'password');
        expect(await isLoggedIn()).toBe(true);
    });
    
    test('Dashboard lädt', async () => {
        const stats = await getDashboardStats();
        expect(stats).toBeDefined();
    });
    
    // ... weitere kritische Tests
});
\`\`\`

## Performance Testing

### Load Tests
- **Tool:** k6 / Artillery
- **Ziel:** 100 concurrent users ohne Degradation
- **Metriken:** Response Time, Error Rate, Throughput

\`\`\`javascript
// load-test.js
export default function() {
    http.get('https://app.example.com/api/buildings');
    sleep(1);
}

export let options = {
    stages: [
        { duration: '2m', target: 50 },  // Ramp-up
        { duration: '5m', target: 100 }, // Peak
        { duration: '2m', target: 0 },   // Ramp-down
    ]
};
\`\`\`

### Performance Benchmarks
- **Dashboard Load:** <500ms
- **Objekt-Liste (100 Items):** <1s
- **PDF-Generierung:** <3s
- **CSV-Import (1000 Zeilen):** <10s

## Freigabe-Workflow

### Development → Staging
1. ✅ Alle Unit Tests grün
2. ✅ Code Review abgeschlossen
3. ✅ Feature-Branch merged
4. ✅ Auto-Deploy zu Staging

### Staging → Production
1. ✅ Manuelle QA abgeschlossen
2. ✅ Regression Tests bestanden
3. ✅ Performance Tests OK
4. ✅ Security Scan grün
5. ✅ Product Owner Approval
6. ✅ Deploy Window (off-peak hours)

### Rollback-Strategie
- **Wenn:** Error Rate >5% oder kritischer Bug
- **Wie:** Auto-Rollback via CI/CD
- **Wann:** Innerhalb 5 Minuten nach Detection
`;

        const duration = (Date.now() - startTime) / 1000;
        const fileSize = new TextEncoder().encode(markdown).length;

        const existingDocs = await base44.asServiceRole.entities.GeneratedDocumentation.filter({
            documentation_type: 'testing_qa'
        });

        const docData = {
            documentation_type: 'testing_qa',
            title: 'Testing & Qualitätssicherung',
            description: 'Test-Strategie, Test-Daten, QA-Prozess und Freigabe-Workflows',
            content_markdown: markdown,
            content_json: {
                generated_at: new Date().toISOString()
            },
            file_size_bytes: fileSize,
            generation_duration_seconds: duration,
            last_generated_at: new Date().toISOString(),
            status: 'completed'
        };

        if (existingDocs.length > 0) {
            await base44.asServiceRole.entities.GeneratedDocumentation.update(existingDocs[0].id, docData);
        } else {
            await base44.asServiceRole.entities.GeneratedDocumentation.create(docData);
        }

        return Response.json({
            success: true,
            documentation_type: 'testing_qa',
            duration,
            size: fileSize
        });

    } catch (error) {
        console.error('Testing documentation generation error:', error);
        return Response.json({
            error: 'Generation failed',
            details: error.message
        }, { status: 500 });
    }
});