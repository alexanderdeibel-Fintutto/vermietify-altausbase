import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { documentation_type } = await req.json();

        if (!documentation_type) {
            return Response.json({ error: 'documentation_type required' }, { status: 400 });
        }

        const startTime = Date.now();

        // Prüfen ob bereits Dokumentation existiert
        const existing = await base44.entities.GeneratedDocumentation.filter({
            documentation_type
        });

        let docId = existing[0]?.id;

        // Status auf "generating" setzen
        if (docId) {
            await base44.entities.GeneratedDocumentation.update(docId, {
                status: 'generating',
                error_message: null
            });
        } else {
            const created = await base44.entities.GeneratedDocumentation.create({
                documentation_type,
                title: getTitleForType(documentation_type),
                description: getDescriptionForType(documentation_type),
                status: 'generating'
            });
            docId = created.id;
        }

        // Dokumentation generieren
        let content_markdown = '';
        let content_json = {};

        try {
            // Alle Entities abrufen für die Dokumentation
            const allEntities = await getAllEntitySchemas(base44);
            
            switch (documentation_type) {
                case 'database_structure':
                    content_markdown = await generateDatabaseStructureDoc(allEntities);
                    content_json = { entities: allEntities };
                    break;
                
                case 'module_architecture':
                    content_markdown = await generateModuleArchitectureDoc(allEntities);
                    content_json = await generateModuleArchitectureJSON(allEntities);
                    break;
                
                case 'master_data':
                    content_markdown = await generateMasterDataDoc(allEntities);
                    content_json = await generateMasterDataJSON(allEntities);
                    break;
                
                case 'business_logic':
                    content_markdown = await generateBusinessLogicDoc(allEntities);
                    content_json = { business_rules: [] };
                    break;
                
                case 'external_integrations':
                    content_markdown = await generateExternalIntegrationsDoc();
                    content_json = { integrations: ['LetterXpress', 'FinAPI'] };
                    break;
                
                case 'document_generation':
                    content_markdown = await generateDocumentGenerationDoc(base44);
                    content_json = {};
                    break;
                
                case 'user_workflows':
                    content_markdown = await generateUserWorkflowsDoc();
                    content_json = {};
                    break;
                
                case 'permissions_roles':
                    content_markdown = await generatePermissionsDoc();
                    content_json = { roles: ['admin', 'user'] };
                    break;
                
                case 'error_handling':
                    content_markdown = await generateErrorHandlingDoc();
                    content_json = {};
                    break;
                
                case 'data_migration':
                    content_markdown = await generateDataMigrationDoc(allEntities);
                    content_json = {};
                    break;
                
                case 'executive_summary':
                    content_markdown = await generateExecutiveSummaryDoc(allEntities);
                    content_json = { summary: 'Immobilienverwaltungs-App' };
                    break;
                
                default:
                    throw new Error('Unknown documentation type');
            }

            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;
            const fileSize = new Blob([content_markdown]).size;

            // Dokumentation speichern
            await base44.entities.GeneratedDocumentation.update(docId, {
                content_markdown,
                content_json,
                file_size_bytes: fileSize,
                generation_duration_seconds: duration,
                last_generated_at: new Date().toISOString(),
                status: 'completed',
                error_message: null
            });

            return Response.json({
                success: true,
                documentation_id: docId,
                file_size_bytes: fileSize,
                generation_duration_seconds: duration
            });

        } catch (error) {
            // Fehler speichern
            await base44.entities.GeneratedDocumentation.update(docId, {
                status: 'error',
                error_message: error.message
            });
            throw error;
        }

    } catch (error) {
        console.error('Generate documentation error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});

// Helper Functions

async function getAllEntitySchemas(base44) {
    const entityNames = [
        'Building', 'Unit', 'Tenant', 'LeaseContract', 'Document', 'Template',
        'PropertyTax', 'Insurance', 'Financing', 'Supplier', 'BankAccount',
        'BankTransaction', 'GeneratedFinancialBooking', 'Invoice', 'CostCategory',
        'Task', 'Email', 'LetterXpressCredential', 'LetterShipment'
    ];

    const schemas = {};
    for (const name of entityNames) {
        try {
            schemas[name] = await base44.asServiceRole.entities[name].schema();
        } catch (error) {
            console.log(`Could not fetch schema for ${name}:`, error.message);
        }
    }
    return schemas;
}

function getTitleForType(type) {
    const titles = {
        'database_structure': 'Datenbankstruktur',
        'module_architecture': 'Modul-Architektur',
        'master_data': 'Master Data & Konstanten',
        'business_logic': 'Geschäftslogik & Validierungen',
        'external_integrations': 'Externe Integrationen',
        'document_generation': 'Dokumenten-Generierung',
        'user_workflows': 'User-Workflows',
        'permissions_roles': 'Berechtigungen & Rollen',
        'error_handling': 'Fehlerbehandlung & Logging',
        'data_migration': 'Daten-Migration & Historisierung',
        'executive_summary': 'Executive Summary'
    };
    return titles[type] || type;
}

function getDescriptionForType(type) {
    const descriptions = {
        'database_structure': 'Vollständige Datenbank-Dokumentation aller Tabellen, Felder, Beziehungen und Constraints',
        'module_architecture': 'Übersicht aller Module, deren Abhängigkeiten und Datenflüsse'
    };
    return descriptions[type] || '';
}

async function generateDatabaseStructureDoc(entities) {
    let doc = '# Datenbankstruktur - Immobilienverwaltung\n\n';
    doc += '## Übersicht\n\n';
    doc += `Diese Dokumentation beschreibt die vollständige Datenbankstruktur mit ${Object.keys(entities).length} Entitäten.\n\n`;
    
    // Gruppierung der Entitäten
    const groups = {
        'Objektverwaltung': ['Building', 'Unit', 'Meter', 'Gebaeude'],
        'Mieterverwaltung': ['Tenant', 'LeaseContract', 'Payment', 'RentChange'],
        'Finanzverwaltung': ['BankAccount', 'BankTransaction', 'GeneratedFinancialBooking', 'Invoice', 'FinancialItem', 'FinancialItemTransactionLink'],
        'Dokumentenverwaltung': ['Document', 'Template', 'TextBlock', 'DocumentOriginal'],
        'Kommunikation': ['Email', 'LetterXpressCredential', 'LetterShipment', 'IMAPAccount'],
        'Steuern': ['PropertyTax', 'TaxForm', 'TaxFormField', 'AnlageVSubmission', 'BuildingTaxLibrary', 'CostCategory'],
        'Verträge & Kosten': ['Insurance', 'Financing', 'Supplier', 'PurchaseContract'],
        'Aufgaben & Workflows': ['Task', 'TaskStatus', 'TaskPriority', 'Workflow', 'WorkflowStep', 'Automation'],
        'Eigentümer': ['Owner', 'Shareholder', 'OwnerRelationship'],
        'Betriebskosten': ['OperatingCostStatement', 'OperatingCostStatementItem'],
        'Sonstiges': ['Notification', 'ActivityLog', 'Recipient']
    };

    for (const [groupName, entityNames] of Object.entries(groups)) {
        const groupEntities = entityNames.filter(name => entities[name]);
        if (groupEntities.length === 0) continue;

        doc += `## ${groupName}\n\n`;

        for (const name of groupEntities) {
            const schema = entities[name];
            doc += `### ${name}\n\n`;
            
            if (schema?.properties) {
                doc += '| Feld | Typ | Pflicht | Beschreibung |\n';
                doc += '|------|-----|---------|-------------|\n';
                
                for (const [fieldName, field] of Object.entries(schema.properties)) {
                    const required = schema.required?.includes(fieldName) ? '✓' : '';
                    const type = field.type || 'unknown';
                    const enumValues = field.enum ? ` (${field.enum.join(', ')})` : '';
                    const description = (field.description || '').replace(/\n/g, ' ');
                    doc += `| ${fieldName} | ${type}${enumValues} | ${required} | ${description} |\n`;
                }
            }
            doc += '\n';
        }
    }

    doc += '## Built-in Felder\n\n';
    doc += 'Alle Entitäten haben automatisch folgende Felder:\n\n';
    doc += '- **id**: Eindeutige ID\n';
    doc += '- **created_date**: Erstellungszeitpunkt\n';
    doc += '- **updated_date**: Letzter Update-Zeitpunkt\n';
    doc += '- **created_by**: E-Mail des Erstellers\n\n';

    return doc;
}

async function generateModuleArchitectureDoc(entities) {
    let doc = '# Modul-Architektur\n\n';
    doc += '## Hauptmodule\n\n';
    doc += '### 1. Objektverwaltung\n';
    doc += '- Building (Gebäude)\n- Unit (Wohneinheiten)\n- Meter (Zähler)\n\n';
    doc += '### 2. Mieterverwaltung\n';
    doc += '- Tenant (Mieter)\n- LeaseContract (Mietverträge)\n- Payment (Zahlungen)\n\n';
    doc += '### 3. Finanzverwaltung\n';
    doc += '- BankAccount (Bankkonten)\n- BankTransaction (Transaktionen)\n- GeneratedFinancialBooking (Generierte Buchungen)\n- Invoice (Rechnungen)\n\n';
    doc += '### 4. Dokumentenverwaltung\n';
    doc += '- Document (Dokumente)\n- Template (Vorlagen)\n- TextBlock (Textbausteine)\n- DocumentOriginal (Originale)\n\n';
    doc += '### 5. Kommunikation\n';
    doc += '- Email (E-Mails)\n- LetterXpressCredential (Postversand-Zugangsdaten)\n- LetterShipment (Briefsendungen)\n\n';
    return doc;
}

async function generateModuleArchitectureJSON(entities) {
    return {
        modules: [
            {
                name: 'Objektverwaltung',
                entities: ['Building', 'Unit', 'Meter']
            },
            {
                name: 'Mieterverwaltung',
                entities: ['Tenant', 'LeaseContract', 'Payment']
            },
            {
                name: 'Finanzverwaltung',
                entities: ['BankAccount', 'BankTransaction', 'GeneratedFinancialBooking', 'Invoice']
            }
        ]
    };
}

async function generateMasterDataDoc(entities) {
    let doc = '# Master Data & Konstanten\n\n';
    doc += '## Status-Werte\n\n';
    doc += '### Dokument-Status\n';
    doc += '- zu_erledigen\n- erinnern\n- erstellt\n- geaendert\n- versendet\n- unterschrieben\n- gescannt\n\n';
    doc += '### Buchungs-Status\n';
    doc += '- Geplant\n- Gebucht\n- TeilweiseBezahlt\n- Bezahlt\n\n';
    return doc;
}

async function generateMasterDataJSON(entities) {
    return {
        document_statuses: ['zu_erledigen', 'erinnern', 'erstellt', 'geaendert', 'versendet', 'unterschrieben', 'gescannt'],
        booking_statuses: ['Geplant', 'Gebucht', 'TeilweiseBezahlt', 'Bezahlt']
    };
}

async function generateBusinessLogicDoc(entities) {
    let doc = '# Geschäftslogik & Validierungen\n\n';
    
    doc += '## 1. Automatische Buchungsgenerierung\n\n';
    doc += '### Grundsteuerbescheid\n';
    doc += '- **Quelle**: PropertyTax Entity\n';
    doc += '- **Frequenz**: Quartalsweise (Q1-Q4)\n';
    doc += '- **Logik**: `grundsteuer_quartalsrate` wird auf die jeweiligen Fälligkeitstermine gebucht\n';
    doc += '- **Kostenkategorie**: Grundsteuer\n\n';

    doc += '### Versicherungen\n';
    doc += '- **Quelle**: Insurance Entity\n';
    doc += '- **Frequenz**: Gemäß `payment_rhythm` (Monatlich, Vierteljährlich, Halbjährlich, Jährlich)\n';
    doc += '- **Logik**: `premium_amount` wird entsprechend aufgeteilt\n';
    doc += '- **Kostenkategorie**: Versicherung\n\n';

    doc += '### Kredite/Finanzierungen\n';
    doc += '- **Quelle**: Financing Entity\n';
    doc += '- **Frequenz**: Monatlich\n';
    doc += '- **Logik**: `monthly_rate` wird auf das jeweilige Monatsende gebucht\n';
    doc += '- **Kostenkategorie**: Finanzierung\n\n';

    doc += '### Versorger\n';
    doc += '- **Quelle**: Supplier Entity\n';
    doc += '- **Frequenz**: Gemäß `payment_rhythm`\n';
    doc += '- **Logik**: `monthly_amount` wird entsprechend verteilt\n';
    doc += '- **Kostenkategorie**: Je nach Versorgertyp\n\n';

    doc += '### Mietverträge\n';
    doc += '- **Quelle**: LeaseContract Entity\n';
    doc += '- **Frequenz**: Monatlich\n';
    doc += '- **Logik**: `total_rent` wird auf den `rent_due_day` gebucht\n';
    doc += '- **Kostenkategorie**: Mieteinnahme\n\n';

    doc += '## 2. Versionierung & Historisierung\n\n';
    doc += '### Entitäten mit Versionierung\n';
    doc += 'Folgende Entitäten unterstützen vollständige Versionierung:\n\n';
    doc += '- PropertyTax (version_number, predecessor_id, is_current_valid)\n';
    doc += '- Insurance (version_number, predecessor_id, is_current_valid)\n';
    doc += '- Financing (version_number, predecessor_id, is_current_valid)\n';
    doc += '- Supplier (version_number, predecessor_id, is_current_valid)\n';
    doc += '- LeaseContract (version_number, predecessor_id, is_current_valid)\n\n';

    doc += '### Logik\n';
    doc += '1. Bei Änderung wird `is_current_valid` auf false gesetzt\n';
    doc += '2. Neue Version wird erstellt mit `predecessor_id` = alte ID\n';
    doc += '3. `version_number` wird inkrementiert\n';
    doc += '4. Bestehende Buchungen bleiben unverändert\n';
    doc += '5. Neue Buchungen werden aus neuer Version generiert\n\n';

    doc += '## 3. Validierungen\n\n';
    doc += '### Mietverträge\n';
    doc += '- `start_date` muss vor `end_date` liegen (falls befristet)\n';
    doc += '- `base_rent` + `utilities` + `heating` = `total_rent`\n';
    doc += '- `deposit` maximal 3 Monatsmieten\n';
    doc += '- `rent_due_day` zwischen 1 und 31\n\n';

    doc += '### Buchungen\n';
    doc += '- `paid_amount` darf nicht größer als `amount` sein\n';
    doc += '- `outstanding_amount` = `amount` - `paid_amount`\n';
    doc += '- Status-Übergänge: Geplant → Gebucht → TeilweiseBezahlt → Bezahlt\n\n';

    doc += '## 4. Berechnungen\n\n';
    doc += '### AfA (Abschreibung)\n';
    doc += '- Lineare Abschreibung über Nutzungsdauer\n';
    doc += '- Monatsgenaue Berechnung ab Kaufdatum\n';
    doc += '- Separate Abschreibung für Gebäude und Anschaffungsnebenkosten\n\n';

    doc += '### Betriebskostenabrechnung\n';
    doc += '- Umlegbare Kosten werden nach Verteilerschlüssel aufgeteilt\n';
    doc += '- Direkte Kosten werden 1:1 zugeordnet\n';
    doc += '- Vorauszahlungen werden mit tatsächlichen Kosten verrechnet\n\n';

    return doc;
}

async function generateExternalIntegrationsDoc() {
    let doc = '# Externe Integrationen\n\n';
    doc += '## LetterXpress API\n';
    doc += '- Briefversand (national)\n';
    doc += '- Einschreiben (R1, R2)\n';
    doc += '- Tracking-Codes\n\n';
    doc += '## FinAPI\n';
    doc += '- Bank-Kontosynchronisation\n';
    doc += '- Transaktionsimport\n\n';
    return doc;
}

async function generateDocumentGenerationDoc(base44) {
    let doc = '# Dokumenten-Generierung\n\n';
    doc += '## Template-System\n';
    doc += 'Das System unterstützt HTML-basierte Templates mit Platzhaltern.\n\n';
    doc += '## PDF-Generierung\n';
    doc += 'PDFs werden via Puppeteer generiert mit Seitenzahlextraktion via pdf-lib.\n\n';
    return doc;
}

async function generateUserWorkflowsDoc() {
    let doc = '# User-Workflows\n\n';
    
    doc += '## 1. Neues Gebäude anlegen\n\n';
    doc += '**Ziel**: Erfassung eines neuen Immobilienobjekts\n\n';
    doc += '**Schritte**:\n';
    doc += '1. Navigation zu "Objekte"\n';
    doc += '2. Klick auf "Gebäude hinzufügen"\n';
    doc += '3. Eingabe der Stammdaten (Name, Adresse, PLZ, Stadt)\n';
    doc += '4. Optional: Kaufdaten erfassen\n';
    doc += '5. Optional: Eigentümer zuordnen\n';
    doc += '6. Speichern\n';
    doc += '7. System erstellt automatisch Gebäude-ID\n\n';

    doc += '## 2. Mietvertrag erstellen\n\n';
    doc += '**Ziel**: Erfassung eines neuen Mietverhältnisses\n\n';
    doc += '**Voraussetzung**: Gebäude und Wohneinheit existieren\n\n';
    doc += '**Schritte**:\n';
    doc += '1. Navigation zu "Mieter"\n';
    doc += '2. Klick auf "Neuer Vertrag"\n';
    doc += '3. Wohneinheit auswählen\n';
    doc += '4. Mieter auswählen oder neu anlegen\n';
    doc += '5. Vertragsdaten eingeben:\n';
    doc += '   - Mietbeginn\n';
    doc += '   - Befristet oder unbefristet\n';
    doc += '   - Kaltmiete, Nebenkosten, Heizkosten\n';
    doc += '   - Kaution\n';
    doc += '   - Fälligkeitstag\n';
    doc += '6. Speichern\n';
    doc += '7. System generiert automatisch monatliche Mietbuchungen\n\n';

    doc += '## 3. Dokument erstellen und versenden\n\n';
    doc += '**Ziel**: Schriftliche Kommunikation mit Mieter\n\n';
    doc += '**Schritte**:\n';
    doc += '1. Navigation zu "Dokumente"\n';
    doc += '2. Klick auf "Neues Dokument"\n';
    doc += '3. Template auswählen (z.B. Mieterhöhung, Nebenkostenabrechnung)\n';
    doc += '4. Datenquellen verknüpfen (Gebäude, Mieter, Vertrag)\n';
    doc += '5. Textbausteine hinzufügen\n';
    doc += '6. Vorschau prüfen\n';
    doc += '7. Dokument erstellen\n';
    doc += '8. PDF wird automatisch generiert\n';
    doc += '9. Optional: Per Post versenden via LetterXpress\n';
    doc += '10. System tracked Versandstatus und Zustellinformationen\n\n';

    doc += '## 4. Buchungen generieren\n\n';
    doc += '**Ziel**: Automatische Finanzplanung erstellen\n\n';
    doc += '**Schritte**:\n';
    doc += '1. Stammdaten erfassen (Grundsteuer, Versicherung, Kredit, etc.)\n';
    doc += '2. Klick auf "Buchungen generieren"\n';
    doc += '3. System analysiert Daten und erstellt Buchungsvorschläge\n';
    doc += '4. Vorschau prüfen\n';
    doc += '5. Buchungen bestätigen\n';
    doc += '6. System erstellt alle Buchungen für das Jahr\n';
    doc += '7. Buchungen erscheinen in "Generierte Buchungen"\n\n';

    doc += '## 5. Bankkonten synchronisieren\n\n';
    doc += '**Ziel**: Automatischer Import von Kontobewegungen\n\n';
    doc += '**Schritte**:\n';
    doc += '1. Navigation zu "Bank/Kasse"\n';
    doc += '2. Klick auf "Konto verbinden"\n';
    doc += '3. FinAPI-Autorisierung durchführen\n';
    doc += '4. Bank auswählen und anmelden\n';
    doc += '5. Konten importieren\n';
    doc += '6. Automatische Synchronisierung startet\n';
    doc += '7. Transaktionen werden kategorisiert\n';
    doc += '8. Matching mit generierten Buchungen\n\n';

    doc += '## 6. Betriebskostenabrechnung erstellen\n\n';
    doc += '**Ziel**: Jahresabrechnung für Mieter\n\n';
    doc += '**Schritte**:\n';
    doc += '1. Navigation zu "Betriebskosten"\n';
    doc += '2. Klick auf "Neue Abrechnung"\n';
    doc += '3. Abrechnungsjahr und Gebäude wählen\n';
    doc += '4. Mietverträge auswählen\n';
    doc += '5. Kosten erfassen oder aus Buchungen importieren\n';
    doc += '6. Verteilerschlüssel festlegen\n';
    doc += '7. System berechnet automatisch:\n';
    doc += '   - Gesamtkosten\n';
    doc += '   - Anteil pro Mieter\n';
    doc += '   - Geleistete Vorauszahlungen\n';
    doc += '   - Nach-/Rückzahlung\n';
    doc += '8. Vorschau und Plausibilitätsprüfung\n';
    doc += '9. Abrechnung finalisieren\n';
    doc += '10. Optional: Dokumente automatisch generieren\n\n';

    return doc;
}

async function generatePermissionsDoc() {
    let doc = '# Berechtigungen & Rollen\n\n';
    doc += '## Rollen\n';
    doc += '- **Admin**: Vollzugriff auf alle Funktionen\n';
    doc += '- **User**: Eingeschränkter Zugriff\n\n';
    return doc;
}

async function generateErrorHandlingDoc() {
    let doc = '# Fehlerbehandlung & Logging\n\n';
    doc += '## Fehlerbehandlung\n';
    doc += 'Fehler werden via toast-Benachrichtigungen angezeigt.\n\n';
    return doc;
}

async function generateDataMigrationDoc(entities) {
    let doc = '# Daten-Migration & Historisierung\n\n';
    doc += '## Versionierung\n';
    doc += 'Folgende Entitäten unterstützen Versionierung:\n';
    doc += '- PropertyTax (version_number, predecessor_id)\n';
    doc += '- Insurance (version_number, predecessor_id)\n';
    doc += '- Financing (version_number, predecessor_id)\n\n';
    return doc;
}

async function generateExecutiveSummaryDoc(entities) {
    let doc = '# Executive Summary - Immobilienverwaltungs-App\n\n';
    doc += '## Überblick\n';
    doc += 'Die Immobilienverwaltungs-App ist eine umfassende Lösung zur Verwaltung von Immobilien, Mietern und Finanzen.\n\n';
    doc += `## Datenbankstruktur\n`;
    doc += `- ${Object.keys(entities).length} Haupt-Entitäten\n`;
    doc += '- Vollständige Historisierung wichtiger Daten\n\n';
    doc += '## Hauptfunktionen\n';
    doc += '- Objektverwaltung mit Gebäuden und Einheiten\n';
    doc += '- Mieterverwaltung mit Verträgen\n';
    doc += '- Automatische Buchungsgenerierung\n';
    doc += '- Dokumenten-Management mit Template-System\n';
    doc += '- Postversand via LetterXpress\n';
    doc += '- Bankkonten-Synchronisation via FinAPI\n\n';
    return doc;
}