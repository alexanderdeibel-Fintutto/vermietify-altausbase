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
    doc += '**Metadaten:**\n';
    doc += `- Generiert am: ${new Date().toLocaleString('de-DE')}\n`;
    doc += '- Dateityp: Datenbank-Dokumentation\n';
    doc += '- Verwendungszweck: Diese Dokumentation kann an KI-Assistenten wie Claude übergeben werden\n\n';
    doc += '---\n\n';
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
    doc += '**Metadaten:**\n';
    doc += `- Generiert am: ${new Date().toLocaleString('de-DE')}\n`;
    doc += '- Verwendungszweck: KI-Assistent Kontextinformation\n\n';
    doc += '---\n\n';
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
    doc += '**Metadaten:**\n';
    doc += `- Generiert am: ${new Date().toLocaleString('de-DE')}\n\n`;
    doc += '---\n\n';
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
    doc += '**Metadaten:**\n';
    doc += `- Generiert am: ${new Date().toLocaleString('de-DE')}\n\n`;
    doc += '---\n\n';
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
    
    doc += '## 1. LetterXpress API\n\n';
    doc += '**Zweck**: Automatisierter Postversand von Dokumenten\n\n';
    doc += '**Base URL**: https://api.letterxpress.de/v1\n\n';
    doc += '**Authentifizierung**: API-Key + Username\n\n';
    doc += '**Funktionen**:\n';
    doc += '- `check_balance`: Aktuelles Guthaben abrufen\n';
    doc += '- `calculate_price`: Kosten für einen Brief berechnen\n';
    doc += '- `send_letter`: Brief versenden\n';
    doc += '- `get_job`: Job-Status und Tracking-Code abrufen\n\n';

    doc += '**Versandoptionen**:\n';
    doc += '- Normal: Standard-Briefversand\n';
    doc += '- R1 (Einschreiben Einwurf): +3,69 EUR\n';
    doc += '- R2 (Einschreiben): +4,05 EUR\n\n';

    doc += '**Druckoptionen**:\n';
    doc += '- Farbe: Schwarzweiß (1) oder Farbe (4)\n';
    doc += '- Modus: Simplex (einseitig) oder Duplex (doppelseitig)\n\n';

    doc += '**Workflow**:\n';
    doc += '1. PDF hochladen und MD5-Checksum berechnen\n';
    doc += '2. Brief erstellen mit `send_letter`\n';
    doc += '3. Job-ID und Kosten erhalten\n';
    doc += '4. In LetterShipment Entity speichern\n';
    doc += '5. Periodisch Status mit `get_job` abrufen\n';
    doc += '6. Tracking-Code aktualisieren sobald verfügbar\n\n';

    doc += '**Rate Limits**: 1 Request pro Sekunde, 60 Sekunden Timeout bei Überschreitung\n\n';

    doc += '## 2. FinAPI\n\n';
    doc += '**Zweck**: Bankkonten-Synchronisation und Transaktionsimport\n\n';
    doc += '**Base URL**: Über Environment-Variable `FINAPI_BASE_URL`\n\n';
    doc += '**Authentifizierung**: OAuth 2.0 mit Client-ID und Client-Secret\n\n';
    doc += '**Funktionen**:\n';
    doc += '- `finapiConnect`: Neue Bankverbindung herstellen\n';
    doc += '- `finapiImportAccounts`: Konten importieren\n';
    doc += '- `finapiSync`: Transaktionen synchronisieren\n\n';

    doc += '**Workflow**:\n';
    doc += '1. User autorisiert FinAPI-Zugriff\n';
    doc += '2. Bank-Login über FinAPI Web Form\n';
    doc += '3. Konten werden importiert und in BankAccount gespeichert\n';
    doc += '4. Connection-ID und User-ID werden gespeichert\n';
    doc += '5. Automatische/manuelle Synchronisation lädt neue Transaktionen\n';
    doc += '6. Transaktionen werden in BankTransaction gespeichert\n';
    doc += '7. AI-gestütztes Matching mit generierten Buchungen\n\n';

    doc += '**Datenfluss**:\n';
    doc += '```\n';
    doc += 'FinAPI → BankTransaction → AI-Matching → PaymentTransactionLink → GeneratedFinancialBooking\n';
    doc += '```\n\n';

    doc += '## 3. Base44 Core Integrations\n\n';
    doc += '**InvokeLLM**: KI-gestützte Datenanalyse\n';
    doc += '- Dokumentenanalyse (PDF-Extraktion)\n';
    doc += '- E-Mail-Analyse für Task-Erstellung\n';
    doc += '- Intelligente Transaktions-Kategorisierung\n\n';

    doc += '**SendEmail**: E-Mail-Versand\n';
    doc += '- Benachrichtigungen\n';
    doc += '- Erinnerungen\n';
    doc += '- Automatische Reports\n\n';

    doc += '**UploadFile**: Datei-Upload\n';
    doc += '- Dokument-PDFs\n';
    doc += '- Originale (gescannte Dokumente)\n';
    doc += '- Logos und Assets\n\n';

    doc += '**GenerateImage**: KI-Bildgenerierung\n';
    doc += '- Platzhalter-Bilder\n';
    doc += '- Marketing-Material\n\n';

    doc += '**ExtractDataFromUploadedFile**: Datenextraktion\n';
    doc += '- CSV-Import\n';
    doc += '- PDF-Datenextraktion\n';
    doc += '- Strukturierte Datenübernahme\n\n';

    return doc;
}

async function generateDocumentGenerationDoc(base44) {
    let doc = '# Dokumenten-Generierung\n\n';
    
    doc += '## Architektur-Übersicht\n\n';
    doc += '```\n';
    doc += 'Template + Datenquellen + Textbausteine → HTML → Puppeteer → PDF → Storage\n';
    doc += '```\n\n';

    doc += '## 1. Template-System\n\n';
    doc += '**Entity**: Template\n\n';
    doc += '**Struktur**:\n';
    doc += '- `header_html`: Kopfbereich (Logo, Absenderadresse)\n';
    doc += '- `content`: Hauptinhalt mit Platzhaltern\n';
    doc += '- `footer_html`: Fußbereich (Kontaktdaten, rechtliche Hinweise)\n';
    doc += '- `styles`: CSS-Styling (Schriftarten, Farben, Layout)\n';
    doc += '- `tables`: Tabellendefinitionen für strukturierte Daten\n';
    doc += '- `required_data_sources`: Benötigte Datenquellen (building, tenant, contract, etc.)\n\n';

    doc += '**Platzhalter-Syntax**:\n';
    doc += '- `{{building.name}}` - Gebäudename\n';
    doc += '- `{{tenant.first_name}}` - Vorname des Mieters\n';
    doc += '- `{{contract.base_rent}}` - Kaltmiete\n';
    doc += '- `{{current_date}}` - Aktuelles Datum\n';
    doc += '- `{{textblock:id}}` - Textbaustein einbinden\n\n';

    doc += '**Standard-Templates**:\n';
    doc += '- Mieterhöhung\n';
    doc += '- Nebenkostenabrechnung\n';
    doc += '- Kündigung\n';
    doc += '- Mietvertrag\n';
    doc += '- Übergabeprotokoll\n';
    doc += '- Zahlungserinnerung\n\n';

    doc += '## 2. Textbausteine\n\n';
    doc += '**Entity**: TextBlock\n\n';
    doc += '**Zweck**: Wiederverwendbare Textpassagen\n\n';
    doc += '**Kategorien**:\n';
    doc += '- Begrüßungen\n';
    doc += '- Rechtliche Hinweise\n';
    doc += '- Kündigungsfristen\n';
    doc += '- Zahlungshinweise\n';
    doc += '- Grußformeln\n\n';

    doc += '**Verwendung**:\n';
    doc += '- User wählt relevante Textbausteine aus\n';
    doc += '- System fügt sie in Template ein\n';
    doc += '- Platzhalter werden ersetzt\n\n';

    doc += '## 3. PDF-Generierung\n\n';
    doc += '**Funktion**: `generatePDF`\n\n';
    doc += '**Technologie**: Puppeteer (Headless Chrome)\n\n';
    doc += '**Prozess**:\n';
    doc += '1. HTML-Inhalt wird zusammengestellt\n';
    doc += '2. Puppeteer startet Headless Browser\n';
    doc += '3. HTML wird gerendert\n';
    doc += '4. PDF wird generiert mit:\n';
    doc += '   - A4-Format\n';
    doc += '   - Seitenränder (20mm)\n';
    doc += '   - Kopf-/Fußzeilen\n';
    doc += '   - Seitenzahlen\n';
    doc += '5. PDF-Buffer wird erstellt\n';
    doc += '6. pdf-lib extrahiert Metadaten (Seitenzahl)\n';
    doc += '7. PDF wird zu Storage hochgeladen\n';
    doc += '8. URL und Metadaten werden zurückgegeben\n\n';

    doc += '**Rückgabe**:\n';
    doc += '```json\n';
    doc += '{\n';
    doc += '  "file_url": "https://...",\n';
    doc += '  "fileName": "dokument.pdf",\n';
    doc += '  "pages": 3\n';
    doc += '}\n';
    doc += '```\n\n';

    doc += '## 4. Dokument-Workflow\n\n';
    doc += '**Wizard-Steps**:\n\n';
    doc += '**Step 1: Template-Auswahl**\n';
    doc += '- User wählt Template-Typ\n';
    doc += '- System filtert passende Templates\n\n';

    doc += '**Step 2: Datenquellen**\n';
    doc += '- User verknüpft Gebäude, Mieter, Vertrag, etc.\n';
    doc += '- System lädt benötigte Daten\n';
    doc += '- Empfängeradresse wird automatisch befüllt\n\n';

    doc += '**Step 3: Textbausteine**\n';
    doc += '- User wählt relevante Textbausteine\n';
    doc += '- Vorschau zeigt kombinierten Text\n\n';

    doc += '**Step 4: Preview & Erstellen**\n';
    doc += '- System generiert HTML-Vorschau\n';
    doc += '- User prüft und bestätigt\n';
    doc += '- Dokument wird erstellt:\n';
    doc += '  - Document Entity wird gespeichert\n';
    doc += '  - PDF wird generiert\n';
    doc += '  - Seitenzahl wird gespeichert\n';
    doc += '  - Change History wird angelegt\n';
    doc += '  - Data Snapshot wird gespeichert\n\n';

    doc += '## 5. Versand-Integration\n\n';
    doc += '**Post-Versand (LetterXpress)**:\n';
    doc += '- PDF wird an LetterXpress gesendet\n';
    doc += '- Versandart wählbar (Normal, R1, R2)\n';
    doc += '- Tracking-Code wird gespeichert\n';
    doc += '- Versandstatus wird aktualisiert\n\n';

    doc += '**E-Mail-Versand**:\n';
    doc += '- PDF als Anhang\n';
    doc += '- Automatische Versandbestätigung\n\n';

    return doc;
}

async function generateUserWorkflowsDoc() {
    let doc = '# User-Workflows\n\n';
    doc += '**Metadaten:**\n';
    doc += `- Generiert am: ${new Date().toLocaleString('de-DE')}\n\n`;
    doc += '---\n\n';
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
    
    doc += '## Rollen-System\n\n';
    doc += '**Built-in User Entity Felder**:\n';
    doc += '- `email`: Eindeutige E-Mail-Adresse\n';
    doc += '- `full_name`: Vollständiger Name\n';
    doc += '- `role`: Rolle (admin oder user)\n\n';

    doc += '## Rollen-Definitionen\n\n';
    doc += '### Admin\n';
    doc += '**Berechtigungen**:\n';
    doc += '- Vollzugriff auf alle Daten\n';
    doc += '- CRUD-Operationen auf allen Entitäten\n';
    doc += '- Zugriff auf alle Backend-Funktionen\n';
    doc += '- User-Verwaltung (Einladungen versenden)\n';
    doc += '- Systemeinstellungen verwalten\n';
    doc += '- Entwickler-Dokumentation generieren\n';
    doc += '- Scheduled Tasks verwalten\n\n';

    doc += '### User (Standard)\n';
    doc += '**Berechtigungen**:\n';
    doc += '- Lesen: Alle Daten\n';
    doc += '- Erstellen: Alle Entitäten außer User\n';
    doc += '- Aktualisieren: Alle Entitäten außer User\n';
    doc += '- Löschen: Alle Entitäten außer User\n';
    doc += '- Eigenes Profil bearbeiten\n';
    doc += '- Keine System-Einstellungen\n\n';

    doc += '## User Entity Security\n\n';
    doc += '**Spezielle Regel für User Entity**:\n';
    doc += '- Nur Admin kann andere User listen, erstellen, bearbeiten oder löschen\n';
    doc += '- Regular User kann nur sein eigenes User-Objekt lesen und bearbeiten\n';
    doc += '- User-Einladungen können nur von Admin versendet werden\n\n';

    doc += '## Authentifizierung\n\n';
    doc += '**Login-Flow**:\n';
    doc += '1. User navigiert zur App\n';
    doc += '2. Base44 prüft Authentifizierung\n';
    doc += '3. Falls nicht authentifiziert: Redirect zu Login\n';
    doc += '4. Nach Login: Redirect zurück zur ursprünglichen URL\n\n';

    doc += '**Session-Handling**:\n';
    doc += '- JWT-Token in Cookies\n';
    doc += '- Automatische Token-Refresh\n';
    doc += '- Logout via `base44.auth.logout()`\n\n';

    doc += '## Backend-Funktionen\n\n';
    doc += '**User-Context**:\n';
    doc += '```javascript\n';
    doc += 'const base44 = createClientFromRequest(req);\n';
    doc += 'const user = await base44.auth.me();\n';
    doc += '// user.email, user.role\n';
    doc += '```\n\n';

    doc += '**Service-Role**:\n';
    doc += '```javascript\n';
    doc += '// Für Admin-Operationen\n';
    doc += 'await base44.asServiceRole.entities.User.list();\n';
    doc += '```\n\n';

    doc += '## Admin-Only Funktionen\n\n';
    doc += '**Backend-Funktionen die Admin-Rechte erfordern**:\n';
    doc += '- `updateLetterTrackingCodes` (Scheduled Task)\n';
    doc += '- Alle Scheduled Task-Funktionen\n';
    doc += '- User-Einladungen\n';
    doc += '- System-Migrations\n\n';

    doc += '**Implementierung**:\n';
    doc += '```javascript\n';
    doc += 'const user = await base44.auth.me();\n';
    doc += 'if (user?.role !== "admin") {\n';
    doc += '  return Response.json(\n';
    doc += '    { error: "Forbidden: Admin access required" },\n';
    doc += '    { status: 403 }\n';
    doc += '  );\n';
    doc += '}\n';
    doc += '```\n\n';

    doc += '## App-Sichtbarkeit\n\n';
    doc += '**Public App**:\n';
    doc += '- App ist öffentlich zugänglich\n';
    doc += '- Login-Flow für geschützte Bereiche\n';
    doc += '- Gastbesucher können Landing-Pages sehen\n\n';

    return doc;
}

async function generateErrorHandlingDoc() {
    let doc = '# Fehlerbehandlung & Logging\n\n';
    
    doc += '## Frontend-Fehlerbehandlung\n\n';
    doc += '**Toast-Benachrichtigungen (Sonner)**:\n';
    doc += '```javascript\n';
    doc += 'import { toast } from "sonner";\n\n';
    doc += 'toast.success("Erfolgreich gespeichert");\n';
    doc += 'toast.error("Fehler beim Speichern: " + error.message);\n';
    doc += 'toast.info("Hinweis: Bitte prüfen");\n';
    doc += 'toast.warning("Warnung: Guthaben niedrig");\n';
    doc += '```\n\n';

    doc += '**React Query Error Handling**:\n';
    doc += '```javascript\n';
    doc += 'const mutation = useMutation({\n';
    doc += '  mutationFn: async (data) => { ... },\n';
    doc += '  onSuccess: () => {\n';
    doc += '    toast.success("Gespeichert");\n';
    doc += '  },\n';
    doc += '  onError: (error) => {\n';
    doc += '    toast.error("Fehler: " + error.message);\n';
    doc += '  }\n';
    doc += '});\n';
    doc += '```\n\n';

    doc += '## Backend-Fehlerbehandlung\n\n';
    doc += '**Standard-Pattern**:\n';
    doc += '```javascript\n';
    doc += 'Deno.serve(async (req) => {\n';
    doc += '  try {\n';
    doc += '    const base44 = createClientFromRequest(req);\n';
    doc += '    const user = await base44.auth.me();\n';
    doc += '    \n';
    doc += '    if (!user) {\n';
    doc += '      return Response.json(\n';
    doc += '        { error: "Unauthorized" },\n';
    doc += '        { status: 401 }\n';
    doc += '      );\n';
    doc += '    }\n';
    doc += '    \n';
    doc += '    // Business Logic\n';
    doc += '    \n';
    doc += '    return Response.json({ success: true });\n';
    doc += '  } catch (error) {\n';
    doc += '    console.error("Function error:", error);\n';
    doc += '    return Response.json(\n';
    doc += '      { error: error.message },\n';
    doc += '      { status: 500 }\n';
    doc += '    );\n';
    doc += '  }\n';
    doc += '});\n';
    doc += '```\n\n';

    doc += '**HTTP Status Codes**:\n';
    doc += '- `200`: Erfolg\n';
    doc += '- `400`: Bad Request (ungültige Parameter)\n';
    doc += '- `401`: Unauthorized (nicht authentifiziert)\n';
    doc += '- `403`: Forbidden (keine Berechtigung)\n';
    doc += '- `404`: Not Found\n';
    doc += '- `429`: Too Many Requests (Rate Limit)\n';
    doc += '- `500`: Internal Server Error\n\n';

    doc += '## Logging\n\n';
    doc += '**Console Logging**:\n';
    doc += '```javascript\n';
    doc += 'console.log("Info message");\n';
    doc += 'console.warn("Warning message");\n';
    doc += 'console.error("Error message", error);\n';
    doc += '```\n\n';

    doc += '**Strukturiertes Logging**:\n';
    doc += '```javascript\n';
    doc += 'console.log("Processing payment", {\n';
    doc += '  transaction_id: tx.id,\n';
    doc += '  amount: tx.amount,\n';
    doc += '  status: tx.status\n';
    doc += '});\n';
    doc += '```\n\n';

    doc += '## Activity Log\n\n';
    doc += '**Entity**: ActivityLog\n\n';
    doc += '**Zweck**: Audit-Trail für wichtige Aktionen\n\n';
    doc += '**Verwendung**:\n';
    doc += '```javascript\n';
    doc += 'await base44.entities.ActivityLog.create({\n';
    doc += '  action: "document_sent",\n';
    doc += '  entity_type: "Document",\n';
    doc += '  entity_id: doc.id,\n';
    doc += '  details: {\n';
    doc += '    recipient: doc.recipient_name,\n';
    doc += '    method: "letterxpress"\n';
    doc += '  }\n';
    doc += '});\n';
    doc += '```\n\n';

    doc += '## Notifications\n\n';
    doc += '**Entity**: Notification\n\n';
    doc += '**Typen**:\n';
    doc += '- `info`: Informationen\n';
    doc += '- `success`: Erfolgsmeldungen\n';
    doc += '- `warning`: Warnungen\n';
    doc += '- `error`: Fehlermeldungen\n\n';

    doc += '**Benachrichtigungs-Center**:\n';
    doc += '- Bell-Icon im Header\n';
    doc += '- Ungelesene Benachrichtigungen (Badge)\n';
    doc += '- Als gelesen markieren\n';
    doc += '- Filtern nach Typ\n\n';

    doc += '## Fehler-Szenarien\n\n';
    doc += '### LetterXpress Fehler\n';
    doc += '- `400`: PDF ungültig → "PDF-Format ungültig"\n';
    doc += '- `401`: Auth fehlgeschlagen → "API-Key prüfen"\n';
    doc += '- `403`: Kein Guthaben → "Guthaben aufladen"\n';
    doc += '- `429`: Rate Limit → "60 Sekunden warten"\n';
    doc += '- `500`: Server-Error → "Später erneut versuchen"\n\n';

    doc += '### FinAPI Fehler\n';
    doc += '- Connection fehlgeschlagen\n';
    doc += '- Bank-Login ungültig\n';
    doc += '- Session abgelaufen\n\n';

    doc += '### Datenbank-Fehler\n';
    doc += '- Constraint-Violations\n';
    doc += '- Duplicate-Keys\n';
    doc += '- Foreign-Key-Violations\n\n';

    return doc;
}

async function generateDataMigrationDoc(entities) {
    let doc = '# Daten-Migration & Historisierung\n\n';
    
    doc += '## Versionierungs-System\n\n';
    doc += '### Entitäten mit Versionierung\n\n';
    doc += 'Folgende Entitäten unterstützen vollständige Versionierung:\n\n';
    doc += '| Entity | Version-Felder |\n';
    doc += '|--------|----------------|\n';
    doc += '| PropertyTax | version_number, predecessor_id, is_current_valid |\n';
    doc += '| Insurance | version_number, predecessor_id, is_current_valid |\n';
    doc += '| Financing | version_number, predecessor_id, is_current_valid |\n';
    doc += '| Supplier | version_number, predecessor_id, is_current_valid |\n';
    doc += '| LeaseContract | version_number, predecessor_id, is_current_valid |\n\n';

    doc += '### Versionierungs-Workflow\n\n';
    doc += '**Bei Änderung eines versionierten Objekts**:\n\n';
    doc += '1. **Alte Version archivieren**:\n';
    doc += '   ```javascript\n';
    doc += '   await base44.entities.PropertyTax.update(oldId, {\n';
    doc += '     is_current_valid: false\n';
    doc += '   });\n';
    doc += '   ```\n\n';

    doc += '2. **Neue Version erstellen**:\n';
    doc += '   ```javascript\n';
    doc += '   const newVersion = await base44.entities.PropertyTax.create({\n';
    doc += '     ...updatedData,\n';
    doc += '     version_number: oldVersion.version_number + 1,\n';
    doc += '     predecessor_id: oldVersion.id,\n';
    doc += '     is_current_valid: true\n';
    doc += '   });\n';
    doc += '   ```\n\n';

    doc += '3. **Buchungen beibehalten**:\n';
    doc += '   - Alte Buchungen bleiben mit `source_id` = alte Version\n';
    doc += '   - Neue Buchungen werden mit `source_id` = neue Version erstellt\n';
    doc += '   - Historische Buchungen bleiben unverändert\n\n';

    doc += '## Change History\n\n';
    doc += '**Dokument Change-Tracking**: Dokumentiert alle Änderungen mit Zeitstempel, User und Änderungstyp\n\n';

    doc += '## Data Snapshots\n\n';
    doc += '**Dokumente**: `data_snapshot` speichert alle verwendeten Daten zum Erstellungszeitpunkt\n\n';

    doc += '## Migration-Funktionen\n\n';
    doc += '### Vorhandene Migrations\n';
    doc += '1. migrateInvoicesToFinancialModel\n';
    doc += '2. migratePaymentsToFinancialItems\n';
    doc += '3. migrateUnitsToGebaeude\n';
    doc += '4. migrateUnitsToBuildingFlaechen\n\n';

    doc += '## Soft-Delete Pattern\n\n';
    doc += '**Implementierung**: `is_cancelled`, `cancelled_at`, `cancelled_by`, `cancellation_reason`\n\n';

    return doc;
}

async function generateExecutiveSummaryDoc(entities) {
    let doc = '# Executive Summary - Immobilienverwaltungs-App\n\n';
    doc += '_Kompakte Gesamtübersicht der App-Architektur (generiert am ' + new Date().toLocaleDateString('de-DE') + ')_\n\n';
    
    doc += '## 🏢 Überblick\n\n';
    doc += 'Die Immobilienverwaltungs-App ist eine umfassende Full-Stack-Lösung zur professionellen Verwaltung von Immobilienportfolios, Mietern und Finanzen. Die Anwendung digitalisiert und automatisiert alle wesentlichen Prozesse der Immobilienverwaltung.\n\n';
    
    doc += '## 📊 Technologie-Stack\n\n';
    doc += '**Frontend**:\n';
    doc += '- React 18 mit TypeScript\n';
    doc += '- Tailwind CSS für Styling\n';
    doc += '- shadcn/ui Komponenten\n';
    doc += '- React Query für State Management\n';
    doc += '- React Router für Navigation\n\n';

    doc += '**Backend**:\n';
    doc += '- Base44 BaaS (Backend-as-a-Service)\n';
    doc += '- Deno Runtime für serverless Functions\n';
    doc += '- PostgreSQL Datenbank\n';
    doc += '- RESTful API\n\n';

    doc += '**Integrationen**:\n';
    doc += '- LetterXpress (Postversand)\n';
    doc += '- FinAPI (Banking)\n';
    doc += '- Puppeteer (PDF-Generierung)\n';
    doc += '- Base44 Core (LLM, Email, File Upload)\n\n';

    doc += `## 🗄️ Datenbankstruktur\n\n`;
    doc += `- **${Object.keys(entities).length} Haupt-Entitäten**\n`;
    doc += '- Vollständige Historisierung und Versionierung\n';
    doc += '- Referentielle Integrität\n';
    doc += '- Soft-Delete für kritische Daten\n';
    doc += '- Automatische Timestamps (created_date, updated_date)\n';
    doc += '- User-Tracking (created_by)\n\n';

    doc += '## ⚡ Kernfunktionen\n\n';
    
    doc += '### 1. Objektverwaltung\n';
    doc += '- Gebäude mit vollständigen Stammdaten\n';
    doc += '- Wohneinheiten und Flächen-Management\n';
    doc += '- Zählerverwaltung (Strom, Gas, Wasser)\n';
    doc += '- Kaufverträge und Eigentümerstrukturen\n\n';

    doc += '### 2. Mieterverwaltung\n';
    doc += '- Digitale Mietverträge\n';
    doc += '- Automatische Mietforderungen\n';
    doc += '- Mieterhöhungen mit Historisierung\n';
    doc += '- Nebenkostenabrechnungen\n\n';

    doc += '### 3. Finanzmanagement\n';
    doc += '- Automatische Buchungsgenerierung aus:\n';
    doc += '  - Grundsteuerbescheiden (quartalsweise)\n';
    doc += '  - Versicherungen (flexibler Rhythmus)\n';
    doc += '  - Krediten (monatlich)\n';
    doc += '  - Versorgern (variabel)\n';
    doc += '  - Mietverträgen (monatlich)\n';
    doc += '- Bankkonten-Synchronisation via FinAPI\n';
    doc += '- Intelligentes Transaction-Matching\n';
    doc += '- Rechnungsverwaltung\n';
    doc += '- Kostenkategorien nach SKR03/SKR04\n\n';

    doc += '### 4. Dokumentenverwaltung\n';
    doc += '- Template-basierte Dokumentenerstellung\n';
    doc += '- HTML zu PDF-Konvertierung (Puppeteer)\n';
    doc += '- Wiederverwendbare Textbausteine\n';
    doc += '- Automatische Platzhalter-Ersetzung\n';
    doc += '- Versionshistorie und Snapshots\n';
    doc += '- Original-Dokumente (Scans) verwalten\n\n';

    doc += '### 5. Kommunikation\n';
    doc += '- Postversand via LetterXpress API\n';
    doc += '- Einschreiben (R1, R2) mit Tracking\n';
    doc += '- E-Mail-Integration (IMAP)\n';
    doc += '- KI-gestützte E-Mail-Analyse\n';
    doc += '- Postausgangsbuch\n\n';

    doc += '### 6. Aufgabenverwaltung\n';
    doc += '- Task-Management mit Prioritäten\n';
    doc += '- Workflows und Automatisierungen\n';
    doc += '- E-Mail-basierte Task-Erstellung\n';
    doc += '- Benachrichtigungen und Erinnerungen\n\n';

    doc += '### 7. Steuer-Modul\n';
    doc += '- Anlage V Erstellung (Vermietung & Verpachtung)\n';
    doc += '- AfA-Berechnung (Abschreibungen)\n';
    doc += '- Steuerliche Bibliothek (SKR03/SKR04)\n';
    doc += '- Kostenkategorien nach Steuerrecht\n';
    doc += '- EÜR-Vorbereitung\n\n';

    doc += '## 🔄 Automatisierung\n\n';
    doc += '**Scheduled Tasks**:\n';
    doc += '- Automatische Tracking-Code-Updates (täglich)\n';
    doc += '- E-Mail-Synchronisation\n';
    doc += '- Bankkonten-Updates\n';
    doc += '- Zahlungserinnerungen\n\n';

    doc += '**Trigger-basierte Automatisierung**:\n';
    doc += '- Buchungsgenerierung bei Vertragserstellung\n';
    doc += '- Dokumentenerstellung bei Status-Änderungen\n';
    doc += '- Benachrichtigungen bei wichtigen Events\n\n';

    doc += '## 🔐 Sicherheit & Berechtigungen\n\n';
    doc += '- Rollenbasiertes System (Admin, User)\n';
    doc += '- JWT-basierte Authentifizierung\n';
    doc += '- Sichere API-Integration mit Secrets\n';
    doc += '- Audit-Trail (ActivityLog)\n';
    doc += '- Verschlüsselte Credentials (API-Keys)\n\n';

    doc += '## 📈 Besondere Features\n\n';
    doc += '1. **Intelligente Versionierung**: Vollständige Historie bei Vertragsänderungen\n';
    doc += '2. **Data Snapshots**: Dokumente bleiben reproduzierbar\n';
    doc += '3. **KI-Integration**: LLM für Datenanalyse und Extraktion\n';
    doc += '4. **Entwickler-Dokumentation**: Automatische App-Dokumentation\n';
    doc += '5. **Responsive Design**: Mobile-first Approach\n\n';

    doc += '## 🎯 Zielgruppe\n\n';
    doc += '- Private Vermieter (1-50 Einheiten)\n';
    doc += '- Hausverwaltungen (Klein bis Mittel)\n';
    doc += '- Eigentümergemeinschaften (GbR, GmbH)\n';
    doc += '- Immobilien-Investoren\n\n';

    doc += '## 📦 Deployment\n\n';
    doc += '- Hosted auf Base44 Platform\n';
    doc += '- Serverless Functions (Deno Deploy)\n';
    doc += '- CDN für statische Assets\n';
    doc += '- Automatische Backups\n';
    doc += '- High Availability\n\n';

    doc += '## 🚀 Performance\n\n';
    doc += '- React Query Caching\n';
    doc += '- Optimistic Updates\n';
    doc += '- Lazy Loading\n';
    doc += '- Batch Operations\n';
    doc += '- Efficient Database Queries\n\n';

    doc += '---\n\n';
    doc += '_Diese Zusammenfassung gibt einen Überblick über die wichtigsten Aspekte der Immobilienverwaltungs-App. Für detaillierte Informationen siehe die spezifischen Dokumentations-Bereiche._\n';

    return doc;
}