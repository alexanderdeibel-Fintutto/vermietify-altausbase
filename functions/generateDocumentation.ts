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
        let versionNumber = 1;
        let previousVersionId = null;

        // Wenn bereits eine Version existiert, archivieren wir die alte
        if (existing[0]) {
            versionNumber = (existing[0].version_number || 1) + 1;
            previousVersionId = existing[0].id;
        }

        // Hole unverarbeitete Changes für Metadaten
        const bereichMapping = {
            'database_structure': 'database',
            'module_architecture': 'modules',
            'master_data': 'masterdata',
            'business_logic': 'businesslogic',
            'external_integrations': 'integrations',
            'document_generation': 'documents',
            'user_workflows': 'workflows',
            'permissions_roles': 'permissions',
            'error_handling': 'errors',
            'data_migration': 'migration',
            'executive_summary': 'database'
        };

        const bereich = bereichMapping[documentation_type];
        const changes = bereich ? await base44.entities.DocumentationChange.filter({
            bereich,
            doku_aktualisiert: false
        }) : [];

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
                    content_markdown = await generateDatabaseStructureDoc(allEntities, changes, versionNumber);
                    content_json = { entities: allEntities };
                    break;
                
                case 'module_architecture':
                    content_markdown = await generateModuleArchitectureDoc(allEntities, changes, versionNumber);
                    content_json = await generateModuleArchitectureJSON(allEntities);
                    break;
                
                case 'master_data':
                    content_markdown = await generateMasterDataDoc(allEntities, changes, versionNumber);
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
                error_message: null,
                version_number: versionNumber,
                previous_version_id: previousVersionId,
                changes_summary: changes.length > 0 ? changes.map(c => c.aenderung_beschreibung).join('; ') : null
            });

            // Markiere Changes als verarbeitet
            if (bereich && changes.length > 0) {
                for (const change of changes) {
                    await base44.entities.DocumentationChange.update(change.id, {
                        doku_aktualisiert: true
                    });
                }
            }

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

async function generateDatabaseStructureDoc(entities, changes = [], versionNumber = 1) {
    let doc = '# Datenbankstruktur - Immobilienverwaltung\n\n';
    doc += '**Metadaten:**\n';
    doc += `- Generiert am: ${new Date().toLocaleString('de-DE')}\n`;
    doc += `- Dokumentations-Version: ${versionNumber}\n`;
    doc += `- Anzahl Tabellen: ${Object.keys(entities).length}\n`;
    doc += `- Anzahl Änderungen seit letzter Version: ${changes.length}\n`;
    doc += '- Dateityp: Datenbank-Dokumentation\n\n';
    doc += '**Verwendungszweck:**\n';
    doc += 'Diese Dokumentation kann an KI-Assistenten wie Claude (Anthropic) übergeben werden,\n';
    doc += 'um vollständiges Verständnis der App-Struktur zu ermöglichen.\n\n';
    
    if (changes.length > 0) {
        doc += '**Änderungen seit letzter Version:**\n';
        changes.forEach(change => {
            doc += `- ${change.aenderung_beschreibung}`;
            if (change.betroffene_entitaet) {
                doc += ` (${change.betroffene_entitaet})`;
            }
            doc += '\n';
        });
        doc += '\n';
    }
    
    doc += '**Wichtiger Hinweis:**\n';
    doc += 'Diese Dokumentation wurde automatisch generiert. Manuelle Änderungen werden\n';
    doc += 'bei erneuter Generierung überschrieben.\n\n';
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
                doc += '| Feldname | Datentyp | Pflichtfeld | Standardwert | Beschreibung |\n';
                doc += '|----------|----------|-------------|--------------|-------------|\n';

                for (const [fieldName, field] of Object.entries(schema.properties)) {
                    const required = schema.required?.includes(fieldName) ? 'Ja' : 'Nein';
                    const type = field.type || 'unknown';
                    const enumValues = field.enum ? ` (${field.enum.join(', ')})` : '';
                    const defaultValue = field.default !== undefined ? String(field.default) : '-';
                    const description = (field.description || '').replace(/\n/g, ' ');
                    doc += `| ${fieldName} | ${type}${enumValues} | ${required} | ${defaultValue} | ${description} |\n`;
                }
            }

            // Beziehungen dokumentieren
            const relationships = [];
            if (schema?.properties) {
                for (const [fieldName, field] of Object.entries(schema.properties)) {
                    if (fieldName.endsWith('_id') && fieldName !== 'id') {
                        const relatedEntity = fieldName.slice(0, -3).split('_').map(w => 
                            w.charAt(0).toUpperCase() + w.slice(1)
                        ).join('');
                        relationships.push(`- **${fieldName}**: Referenz zu ${relatedEntity} (n:1)`);
                    }
                }
            }

            if (relationships.length > 0) {
                doc += '\n**Beziehungen:**\n';
                doc += relationships.join('\n') + '\n';
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

async function generateModuleArchitectureDoc(entities, changes = [], versionNumber = 1) {
    const moduleCount = 10;
    let doc = '# Modul-Architektur - Immobilienverwaltung\n\n';
    doc += '**Metadaten:**\n';
    doc += `- Generiert am: ${new Date().toLocaleString('de-DE')}\n`;
    doc += `- Dokumentations-Version: ${versionNumber}\n`;
    doc += `- Anzahl Module: ${moduleCount}\n`;
    doc += `- Anzahl Änderungen seit letzter Version: ${changes.length}\n\n`;
    doc += '**Verwendungszweck:**\n';
    doc += 'Diese Dokumentation kann an KI-Assistenten wie Claude (Anthropic) übergeben werden,\n';
    doc += 'um vollständiges Verständnis der App-Struktur zu ermöglichen.\n\n';
    
    if (changes.length > 0) {
        doc += '**Änderungen seit letzter Version:**\n';
        changes.forEach(change => {
            doc += `- ${change.aenderung_beschreibung}`;
            if (change.betroffene_entitaet) {
                doc += ` (${change.betroffene_entitaet})`;
            }
            doc += '\n';
        });
        doc += '\n';
    }
    
    doc += '**Wichtiger Hinweis:**\n';
    doc += 'Diese Dokumentation wurde automatisch generiert. Manuelle Änderungen werden\n';
    doc += 'bei erneuter Generierung überschrieben.\n\n';
    doc += '---\n\n';
    
    doc += '## Übersicht\n\n';
    doc += 'Die Immobilienverwaltungs-App ist modular aufgebaut und besteht aus 10 Hauptmodulen,\n';
    doc += 'die jeweils spezifische Aufgabenbereiche abdecken und eng miteinander verzahnt sind.\n\n';
    
    doc += '## Hauptmodule\n\n';
    
    doc += '### 1. Objektverwaltung\n\n';
    doc += '**Hauptfunktion:** Verwaltung von Immobilien, Wohneinheiten und Zählern\n\n';
    doc += '**Datenbank-Tabellen:**\n';
    doc += '- Building (Gebäude-Stammdaten)\n';
    doc += '- Unit (Wohneinheiten)\n';
    doc += '- Meter (Zähler für Strom, Gas, Wasser)\n';
    doc += '- Gebaeude (Erweiterte Gebäudestruktur)\n';
    doc += '- PurchaseContract (Kaufverträge)\n\n';
    doc += '**Abhängigkeiten von:**\n';
    doc += '- Eigentümer-Modul (Owner, Shareholder)\n';
    doc += '- Steuer-Modul (BuildingTaxLibrary)\n\n';
    doc += '**Liefert Daten an:**\n';
    doc += '- Mieterverwaltung (Unit → LeaseContract)\n';
    doc += '- Finanzverwaltung (Building → GeneratedFinancialBooking)\n';
    doc += '- Steuern (Building → PropertyTax, AnlageV)\n';
    doc += '- Betriebskosten (Building → OperatingCostStatement)\n\n';
    doc += '**Nutzergruppen:** Verwalter, Eigentümer\n\n';
    doc += '**Haupt-Workflows:**\n';
    doc += '- Neues Gebäude anlegen mit Stammdaten, Adresse und Eigentümerstruktur\n';
    doc += '- Wohneinheiten erstellen und Gebäude zuordnen\n';
    doc += '- Zähler erfassen und Wohneinheiten zuweisen\n';
    doc += '- Kaufverträge dokumentieren und AfA-Berechnung starten\n\n';
    
    doc += '### 2. Mieterverwaltung\n\n';
    doc += '**Hauptfunktion:** Verwaltung von Mietern, Mietverträgen und Mietforderungen\n\n';
    doc += '**Datenbank-Tabellen:**\n';
    doc += '- Tenant (Mieter-Stammdaten)\n';
    doc += '- LeaseContract (Mietverträge)\n';
    doc += '- Payment (Mietforderungen)\n';
    doc += '- RentChange (Mieterhöhungen)\n\n';
    doc += '**Abhängigkeiten von:**\n';
    doc += '- Objektverwaltung (Unit)\n';
    doc += '- Dokumentenverwaltung (Document, Template)\n\n';
    doc += '**Liefert Daten an:**\n';
    doc += '- Finanzverwaltung (Payment → BankTransaction Matching)\n';
    doc += '- Betriebskosten (LeaseContract → Abrechnung)\n';
    doc += '- Dokumentenverwaltung (Mietvertrag, Nebenkostenabrechnung)\n\n';
    doc += '**Nutzergruppen:** Verwalter\n\n';
    doc += '**Haupt-Workflows:**\n';
    doc += '- Mieter anlegen mit Kontaktdaten\n';
    doc += '- Mietvertrag erstellen und Wohneinheit zuordnen\n';
    doc += '- Automatische Generierung monatlicher Mietforderungen\n';
    doc += '- Mieterhöhung dokumentieren mit Versionierung\n';
    doc += '- Mietverhältnis kündigen und Auszugstermin festlegen\n\n';
    
    doc += '### 3. Finanzverwaltung\n\n';
    doc += '**Hauptfunktion:** Verwaltung von Finanzen, Buchungen, Zahlungen und Banking\n\n';
    doc += '**Datenbank-Tabellen:**\n';
    doc += '- BankAccount (Bankkonten)\n';
    doc += '- BankTransaction (Banktransaktionen)\n';
    doc += '- GeneratedFinancialBooking (Geplante Buchungen)\n';
    doc += '- Invoice (Rechnungen)\n';
    doc += '- FinancialItem (Finanzposten)\n';
    doc += '- PaymentTransactionLink (Zuordnung Zahlung ↔ Transaktion)\n';
    doc += '- FinancialItemTransactionLink (Zuordnung Item ↔ Transaktion)\n\n';
    doc += '**Abhängigkeiten von:**\n';
    doc += '- Objektverwaltung (Building)\n';
    doc += '- Mieterverwaltung (LeaseContract, Payment)\n';
    doc += '- Verträge & Kosten (PropertyTax, Insurance, Financing, Supplier)\n';
    doc += '- Steuer-Modul (CostCategory, BuildingTaxLibrary)\n\n';
    doc += '**Liefert Daten an:**\n';
    doc += '- Steuern (Buchungen → Anlage V, EÜR)\n';
    doc += '- Betriebskosten (Buchungen → Abrechnung)\n\n';
    doc += '**Nutzergruppen:** Verwalter, Steuerberater\n\n';
    doc += '**Haupt-Workflows:**\n';
    doc += '- Bankkonto verbinden via FinAPI\n';
    doc += '- Transaktionen automatisch importieren\n';
    doc += '- Buchungen aus Verträgen generieren (Miete, Grundsteuer, etc.)\n';
    doc += '- Transaktionen mit Buchungen matchen (AI-gestützt)\n';
    doc += '- Rechnungen erfassen und Kosten kategorisieren\n';
    doc += '- Zahlungsströme analysieren und Reports erstellen\n\n';
    
    doc += '### 4. Dokumentenverwaltung\n\n';
    doc += '**Hauptfunktion:** Erstellung und Verwaltung von Dokumenten mit Template-System\n\n';
    doc += '**Datenbank-Tabellen:**\n';
    doc += '- Document (Dokumente)\n';
    doc += '- Template (Dokumentvorlagen)\n';
    doc += '- TextBlock (Textbausteine)\n';
    doc += '- DocumentOriginal (Gescannte Originale)\n\n';
    doc += '**Abhängigkeiten von:**\n';
    doc += '- Objektverwaltung (Building, Unit)\n';
    doc += '- Mieterverwaltung (Tenant, LeaseContract)\n';
    doc += '- Kommunikation (LetterXpress für Versand)\n\n';
    doc += '**Liefert Daten an:**\n';
    doc += '- Kommunikation (PDF für Postversand)\n';
    doc += '- Aufgaben & Workflows (Dokument → Task)\n\n';
    doc += '**Nutzergruppen:** Verwalter\n\n';
    doc += '**Haupt-Workflows:**\n';
    doc += '- Template erstellen mit Platzhaltern und Styling\n';
    doc += '- Textbausteine für Wiederverwendung definieren\n';
    doc += '- Dokument erstellen (Wizard): Template + Datenquellen + Textbausteine\n';
    doc += '- PDF generieren mit Puppeteer\n';
    doc += '- Dokument per Post versenden via LetterXpress\n';
    doc += '- Original-Dokumente hochladen und verlinken\n\n';
    
    doc += '### 5. Kommunikation\n\n';
    doc += '**Hauptfunktion:** Postversand, E-Mail-Integration und Korrespondenzverwaltung\n\n';
    doc += '**Datenbank-Tabellen:**\n';
    doc += '- Email (E-Mails)\n';
    doc += '- LetterXpressCredential (API-Zugangsdaten)\n';
    doc += '- LetterShipment (Briefsendungen)\n';
    doc += '- IMAPAccount (E-Mail-Konten)\n\n';
    doc += '**Abhängigkeiten von:**\n';
    doc += '- Dokumentenverwaltung (Document → PDF)\n';
    doc += '- Externe Integration: LetterXpress API\n\n';
    doc += '**Liefert Daten an:**\n';
    doc += '- Aufgaben & Workflows (E-Mail → Task-Erstellung)\n';
    doc += '- Dokumentenverwaltung (Versandstatus-Update)\n\n';
    doc += '**Nutzergruppen:** Verwalter\n\n';
    doc += '**Haupt-Workflows:**\n';
    doc += '- LetterXpress-Account konfigurieren\n';
    doc += '- Dokument per Post versenden (Normal, R1, R2)\n';
    doc += '- Tracking-Codes automatisch abrufen\n';
    doc += '- Postausgangsbuch führen\n';
    doc += '- E-Mail-Konten verbinden via IMAP\n';
    doc += '- E-Mails automatisch analysieren und Tasks erstellen\n\n';
    
    doc += '### 6. Steuern\n\n';
    doc += '**Hauptfunktion:** Steuerliche Verwaltung, Anlage V, AfA-Berechnung\n\n';
    doc += '**Datenbank-Tabellen:**\n';
    doc += '- PropertyTax (Grundsteuerbescheide)\n';
    doc += '- TaxForm (Steuerformulare)\n';
    doc += '- TaxFormField (Formularfelder)\n';
    doc += '- AnlageVSubmission (Anlage V Abgaben)\n';
    doc += '- BuildingTaxLibrary (Steuerliche Bibliothek)\n';
    doc += '- CostCategory (Kostenkategorien)\n';
    doc += '- AfASchedule (AfA-Pläne)\n\n';
    doc += '**Abhängigkeiten von:**\n';
    doc += '- Objektverwaltung (Building, PurchaseContract)\n';
    doc += '- Finanzverwaltung (GeneratedFinancialBooking, Invoice)\n';
    doc += '- Mieterverwaltung (LeaseContract → Einnahmen)\n\n';
    doc += '**Liefert Daten an:**\n';
    doc += '- Finanzverwaltung (Kostenkategorien für Buchungen)\n';
    doc += '- Externe Integration: ELSTER (geplant)\n\n';
    doc += '**Nutzergruppen:** Verwalter, Steuerberater, Eigentümer\n\n';
    doc += '**Haupt-Workflows:**\n';
    doc += '- Steuerliche Bibliothek initialisieren (SKR03/SKR04)\n';
    doc += '- Grundsteuerbescheid erfassen\n';
    doc += '- AfA-Plan aus Kaufvertrag generieren\n';
    doc += '- Anlage V erstellen für ein Gebäude\n';
    doc += '- Einnahmen und Werbungskosten automatisch berechnen\n';
    doc += '- Anlage V als PDF exportieren\n\n';
    
    doc += '### 7. Verträge & Kosten\n\n';
    doc += '**Hauptfunktion:** Verwaltung von Versicherungen, Krediten und Versorgern\n\n';
    doc += '**Datenbank-Tabellen:**\n';
    doc += '- Insurance (Versicherungen)\n';
    doc += '- Financing (Kredite/Finanzierungen)\n';
    doc += '- Supplier (Versorger)\n\n';
    doc += '**Abhängigkeiten von:**\n';
    doc += '- Objektverwaltung (Building)\n';
    doc += '- Steuer-Modul (CostCategory)\n\n';
    doc += '**Liefert Daten an:**\n';
    doc += '- Finanzverwaltung (Buchungen generieren)\n';
    doc += '- Betriebskosten (Umlegbare Kosten)\n\n';
    doc += '**Nutzergruppen:** Verwalter\n\n';
    doc += '**Haupt-Workflows:**\n';
    doc += '- Versicherung erfassen (Gebäude, Haftpflicht, etc.)\n';
    doc += '- Kredit/Finanzierung dokumentieren\n';
    doc += '- Versorger anlegen (Strom, Gas, Wasser, etc.)\n';
    doc += '- Automatische Buchungsgenerierung aus Verträgen\n';
    doc += '- Verträge aktualisieren mit Versionierung\n\n';
    
    doc += '### 8. Aufgaben & Workflows\n\n';
    doc += '**Hauptfunktion:** Task-Management und Workflow-Automatisierung\n\n';
    doc += '**Datenbank-Tabellen:**\n';
    doc += '- Task (Aufgaben)\n';
    doc += '- TaskStatus (Status-Definitionen)\n';
    doc += '- TaskPriority (Prioritäten)\n';
    doc += '- Workflow (Workflows)\n';
    doc += '- WorkflowStep (Workflow-Schritte)\n';
    doc += '- Automation (Automatisierungen)\n\n';
    doc += '**Abhängigkeiten von:**\n';
    doc += '- Dokumentenverwaltung (Document → Task)\n';
    doc += '- Kommunikation (Email → Task-Analyse)\n';
    doc += '- Alle Module (Tasks können überall erstellt werden)\n\n';
    doc += '**Liefert Daten an:**\n';
    doc += '- Benachrichtigungen (Task → Notification)\n';
    doc += '- Dokumentenverwaltung (Task → Dokument erstellen)\n\n';
    doc += '**Nutzergruppen:** Verwalter\n\n';
    doc += '**Haupt-Workflows:**\n';
    doc += '- Task manuell erstellen\n';
    doc += '- Task automatisch aus E-Mail generieren (AI)\n';
    doc += '- Workflow definieren (z.B. Mieterhöhung-Prozess)\n';
    doc += '- Automatisierung einrichten (Trigger → Aktion)\n';
    doc += '- Tasks filtern, sortieren und verwalten\n';
    doc += '- Kanban-Board und Kalender-Ansicht nutzen\n\n';
    
    doc += '### 9. Eigentümer\n\n';
    doc += '**Hauptfunktion:** Verwaltung von Eigentümern und Gesellschafterstrukturen\n\n';
    doc += '**Datenbank-Tabellen:**\n';
    doc += '- Owner (Eigentümer)\n';
    doc += '- Shareholder (Gesellschafter)\n';
    doc += '- OwnerRelationship (Eigentümer-Beziehungen)\n\n';
    doc += '**Abhängigkeiten von:**\n';
    doc += '- Objektverwaltung (Building)\n\n';
    doc += '**Liefert Daten an:**\n';
    doc += '- Steuern (Eigentümer → Anlage V)\n';
    doc += '- Finanzverwaltung (Eigentümeranteile für Aufteilung)\n\n';
    doc += '**Nutzergruppen:** Verwalter\n\n';
    doc += '**Haupt-Workflows:**\n';
    doc += '- Einzeleigentümer anlegen\n';
    doc += '- Gesellschaft (GbR, GmbH) erstellen\n';
    doc += '- Gesellschafter mit Anteilen definieren\n';
    doc += '- Eigentümer zu Gebäuden zuordnen\n';
    doc += '- Eigentümerwechsel dokumentieren\n\n';
    
    doc += '### 10. Betriebskosten\n\n';
    doc += '**Hauptfunktion:** Erstellung von Betriebskostenabrechnungen\n\n';
    doc += '**Datenbank-Tabellen:**\n';
    doc += '- OperatingCostStatement (Abrechnungen)\n';
    doc += '- OperatingCostStatementItem (Abrechnungspositionen)\n\n';
    doc += '**Abhängigkeiten von:**\n';
    doc += '- Objektverwaltung (Building, Unit)\n';
    doc += '- Mieterverwaltung (LeaseContract)\n';
    doc += '- Finanzverwaltung (GeneratedFinancialBooking)\n';
    doc += '- Verträge & Kosten (Supplier)\n\n';
    doc += '**Liefert Daten an:**\n';
    doc += '- Dokumentenverwaltung (Abrechnung als PDF)\n';
    doc += '- Mieterverwaltung (Nachzahlung/Guthaben → Payment)\n\n';
    doc += '**Nutzergruppen:** Verwalter\n\n';
    doc += '**Haupt-Workflows:**\n';
    doc += '- Abrechnungszeitraum und Gebäude wählen\n';
    doc += '- Mietverträge für Abrechnung auswählen\n';
    doc += '- Kosten erfassen oder aus Buchungen importieren\n';
    doc += '- Verteilerschlüssel festlegen (Fläche, Personen, etc.)\n';
    doc += '- Abrechnung automatisch berechnen\n';
    doc += '- Vorschau prüfen und finalisieren\n';
    doc += '- PDF-Dokumente für jeden Mieter generieren\n\n';
    
    doc += '## Modul-Abhängigkeiten Diagramm\n\n';
    doc += '```\n';
    doc += '┌─────────────────┐\n';
    doc += '│  Eigentümer     │\n';
    doc += '└────────┬────────┘\n';
    doc += '         │\n';
    doc += '         ↓\n';
    doc += '┌─────────────────┐      ┌─────────────────┐\n';
    doc += '│ Objektverwaltung│──────│  Verträge &     │\n';
    doc += '│                 │      │  Kosten         │\n';
    doc += '└────────┬────────┘      └────────┬────────┘\n';
    doc += '         │                        │\n';
    doc += '         ↓                        │\n';
    doc += '┌─────────────────┐               │\n';
    doc += '│ Mieterverwaltung│               │\n';
    doc += '└────────┬────────┘               │\n';
    doc += '         │                        │\n';
    doc += '         ↓                        ↓\n';
    doc += '┌──────────────────────────────────────┐\n';
    doc += '│        Finanzverwaltung              │\n';
    doc += '└────────┬─────────────────────────────┘\n';
    doc += '         │\n';
    doc += '    ┌────┴────┐\n';
    doc += '    ↓         ↓\n';
    doc += '┌─────────┐ ┌──────────────┐\n';
    doc += '│ Steuern │ │ Betriebskost.│\n';
    doc += '└─────────┘ └──────────────┘\n';
    doc += '\n';
    doc += '┌─────────────────┐      ┌─────────────────┐\n';
    doc += '│ Dokumentenverw. │◄─────│  Kommunikation  │\n';
    doc += '└─────────────────┘      └─────────────────┘\n';
    doc += '\n';
    doc += '┌─────────────────────────────────────────┐\n';
    doc += '│    Aufgaben & Workflows (übergreifend)  │\n';
    doc += '└─────────────────────────────────────────┘\n';
    doc += '```\n\n';
    
    doc += '## Datenfluss-Beispiele\n\n';
    doc += '### Beispiel 1: Neuer Mietvertrag\n';
    doc += '1. **Objektverwaltung:** Unit wird ausgewählt\n';
    doc += '2. **Mieterverwaltung:** LeaseContract wird erstellt\n';
    doc += '3. **Finanzverwaltung:** Monatliche Mietforderungen (Payment) werden automatisch generiert\n';
    doc += '4. **Steuern:** Mieteinnahmen fließen in Anlage V ein\n\n';
    
    doc += '### Beispiel 2: Grundsteuerbescheid erfassen\n';
    doc += '1. **Objektverwaltung:** Building wird ausgewählt\n';
    doc += '2. **Verträge & Kosten:** PropertyTax wird erfasst\n';
    doc += '3. **Finanzverwaltung:** Quartalsweise Buchungen werden generiert\n';
    doc += '4. **Steuern:** Grundsteuer wird als Werbungskosten in Anlage V übernommen\n\n';
    
    doc += '### Beispiel 3: Betriebskostenabrechnung\n';
    doc += '1. **Betriebskosten:** OperatingCostStatement wird erstellt\n';
    doc += '2. **Objektverwaltung:** Building und Units werden ausgewählt\n';
    doc += '3. **Mieterverwaltung:** LeaseContracts definieren Abrechnungszeitraum\n';
    doc += '4. **Finanzverwaltung:** Kosten aus GeneratedFinancialBooking werden importiert\n';
    doc += '5. **Dokumentenverwaltung:** PDF wird generiert\n';
    doc += '6. **Kommunikation:** Abrechnung wird per Post versendet\n\n';
    
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

async function generateMasterDataDoc(entities, changes = [], versionNumber = 1) {
    // Zähle alle Enum-Felder
    let totalEnums = 0;
    for (const schema of Object.values(entities)) {
        if (schema?.properties) {
            for (const field of Object.values(schema.properties)) {
                if (field.enum) totalEnums++;
            }
        }
    }

    let doc = '# Master Data & Konstanten - Immobilienverwaltung\n\n';
    doc += '**Metadaten:**\n';
    doc += `- Generiert am: ${new Date().toLocaleString('de-DE')}\n`;
    doc += `- Dokumentations-Version: ${versionNumber}\n`;
    doc += `- Anzahl Konstanten-Gruppen: ${totalEnums}\n`;
    doc += `- Anzahl Änderungen seit letzter Version: ${changes.length}\n\n`;
    doc += '**Verwendungszweck:**\n';
    doc += 'Diese Dokumentation kann an KI-Assistenten wie Claude (Anthropic) übergeben werden,\n';
    doc += 'um vollständiges Verständnis der App-Struktur zu ermöglichen.\n\n';
    
    if (changes.length > 0) {
        doc += '**Änderungen seit letzter Version:**\n';
        changes.forEach(change => {
            doc += `- ${change.aenderung_beschreibung}`;
            if (change.betroffene_entitaet) {
                doc += ` (${change.betroffene_entitaet})`;
            }
            doc += '\n';
        });
        doc += '\n';
    }
    
    doc += '**Wichtiger Hinweis:**\n';
    doc += 'Diese Dokumentation wurde automatisch generiert. Manuelle Änderungen werden\n';
    doc += 'bei erneuter Generierung überschrieben.\n\n';
    doc += '---\n\n';
    
    doc += '## Übersicht\n\n';
    doc += 'Diese Dokumentation enthält alle Master Data und Konstanten der Immobilienverwaltungs-App.\n';
    doc += 'Master Data sind vordefinierte Auswahloptionen und Kategorien, die in Dropdown-Feldern,\n';
    doc += 'Validierungen und Geschäftslogik verwendet werden.\n\n';
    
    // Gruppierung nach Verwendungsbereich
    const groups = {
        'Dokumente & Kommunikation': ['Document', 'Template', 'LetterShipment', 'Task'],
        'Finanzen & Buchungen': ['GeneratedFinancialBooking', 'Invoice', 'BankTransaction', 'Payment'],
        'Immobilien & Verträge': ['Building', 'LeaseContract', 'PropertyTax', 'Insurance', 'Financing', 'Supplier'],
        'Kostenkategorien & Steuern': ['CostCategory', 'BuildingTaxLibrary', 'TaxForm'],
        'Organisationsformen': ['Owner', 'Building']
    };
    
    for (const [groupName, entityNames] of Object.entries(groups)) {
        const groupEntities = entityNames.filter(name => entities[name]);
        if (groupEntities.length === 0) continue;
        
        doc += `## ${groupName}\n\n`;
        
        for (const entityName of groupEntities) {
            const schema = entities[entityName];
            if (!schema?.properties) continue;
            
            let hasEnums = false;
            for (const [fieldName, field] of Object.entries(schema.properties)) {
                if (field.enum) {
                    if (!hasEnums) {
                        doc += `### ${entityName}\n\n`;
                        hasEnums = true;
                    }
                    
                    doc += `**${fieldName}**\n\n`;
                    doc += `*Verwendungszweck:* ${field.description || 'Auswahlfeld'}\n\n`;
                    doc += '| Anzeigetext | Interner Wert | Beschreibung |\n';
                    doc += '|-------------|---------------|-------------|\n';
                    
                    field.enum.forEach(value => {
                        let displayText = value;
                        let description = '';
                        
                        // Spezifische Übersetzungen
                        switch(fieldName) {
                            case 'status':
                                if (entityName === 'Document') {
                                    const statusMap = {
                                        'zu_erledigen': ['Zu erledigen', 'Dokument muss noch bearbeitet werden'],
                                        'erinnern': ['Erinnern', 'Erinnerung für dieses Dokument setzen'],
                                        'erstellt': ['Erstellt', 'Dokument wurde erstellt'],
                                        'geaendert': ['Geändert', 'Dokument wurde nach Erstellung geändert'],
                                        'versendet': ['Versendet', 'Dokument wurde per Post/Email versendet'],
                                        'unterschrieben': ['Unterschrieben', 'Dokument wurde unterschrieben'],
                                        'gescannt': ['Gescannt', 'Original wurde eingescannt']
                                    };
                                    if (statusMap[value]) {
                                        displayText = statusMap[value][0];
                                        description = statusMap[value][1];
                                    }
                                } else if (entityName === 'LeaseContract') {
                                    const statusMap = {
                                        'active': ['Aktiv', 'Mietvertrag ist aktuell gültig'],
                                        'terminated': ['Gekündigt', 'Mietvertrag wurde gekündigt'],
                                        'expired': ['Abgelaufen', 'Mietvertrag ist ausgelaufen']
                                    };
                                    if (statusMap[value]) {
                                        displayText = statusMap[value][0];
                                        description = statusMap[value][1];
                                    }
                                } else if (entityName === 'GeneratedFinancialBooking') {
                                    const statusMap = {
                                        'Geplant': ['Geplant', 'Buchung ist geplant, noch nicht bezahlt'],
                                        'Gebucht': ['Gebucht', 'Buchung wurde gebucht'],
                                        'TeilweiseBezahlt': ['Teilweise bezahlt', 'Buchung wurde teilweise bezahlt'],
                                        'Bezahlt': ['Bezahlt', 'Buchung wurde vollständig bezahlt']
                                    };
                                    if (statusMap[value]) {
                                        displayText = statusMap[value][0];
                                        description = statusMap[value][1];
                                    }
                                } else if (entityName === 'Task') {
                                    const statusMap = {
                                        'offen': ['Offen', 'Task muss noch erledigt werden'],
                                        'in_bearbeitung': ['In Bearbeitung', 'Task wird gerade bearbeitet'],
                                        'wartend': ['Wartend', 'Task wartet auf externe Aktion'],
                                        'erledigt': ['Erledigt', 'Task wurde abgeschlossen'],
                                        'abgebrochen': ['Abgebrochen', 'Task wurde abgebrochen']
                                    };
                                    if (statusMap[value]) {
                                        displayText = statusMap[value][0];
                                        description = statusMap[value][1];
                                    }
                                }
                                break;
                            case 'category':
                                if (entityName === 'Document' || entityName === 'Template') {
                                    const catMap = {
                                        'Mietrecht': ['Mietrecht', 'Dokumente rund um Mietverträge und Mietrecht'],
                                        'Verwaltung': ['Verwaltung', 'Verwaltungsdokumente'],
                                        'Finanzen': ['Finanzen', 'Finanzielle Dokumente'],
                                        'Übergabeprotokolle': ['Übergabeprotokolle', 'Wohnungsübergabe-Protokolle'],
                                        'Sonstiges': ['Sonstiges', 'Andere Dokumententypen']
                                    };
                                    if (catMap[value]) {
                                        displayText = catMap[value][0];
                                        description = catMap[value][1];
                                    }
                                }
                                break;
                            case 'category_type':
                                const typeMap = {
                                    'ERHALTUNG': ['Erhaltung', 'Erhaltungsaufwendungen (sofort absetzbar)'],
                                    'HERSTELLUNG': ['Herstellung', 'Herstellungskosten (nur über AfA absetzbar)'],
                                    'BETRIEB': ['Betrieb', 'Betriebskosten (umlagefähig)'],
                                    'FINANZIERUNG': ['Finanzierung', 'Finanzierungskosten (Zinsen)']
                                };
                                if (typeMap[value]) {
                                    displayText = typeMap[value][0];
                                    description = typeMap[value][1];
                                }
                                break;
                            case 'tax_treatment':
                                const taxMap = {
                                    'SOFORT': ['Sofort absetzbar', 'Kann sofort als Werbungskosten abgesetzt werden'],
                                    'AFA': ['AfA', 'Nur über Abschreibung (AfA) absetzbar'],
                                    'VERTEILT': ['Verteilt', 'Wird auf mehrere Jahre verteilt abgesetzt'],
                                    'NICHT_ABSETZBAR': ['Nicht absetzbar', 'Steuerlich nicht absetzbar']
                                };
                                if (taxMap[value]) {
                                    displayText = taxMap[value][0];
                                    description = taxMap[value][1];
                                }
                                break;
                            case 'versandart':
                                const versandMap = {
                                    'normal': ['Normal', 'Standard-Briefversand'],
                                    'r1': ['Einschreiben Einwurf', 'Mit Zustellnachweis (R1)'],
                                    'r2': ['Einschreiben', 'Mit persönlicher Zustellung (R2)']
                                };
                                if (versandMap[value]) {
                                    displayText = versandMap[value][0];
                                    description = versandMap[value][1];
                                }
                                break;
                            case 'source_type':
                                const sourceMap = {
                                    'Versorger': ['Versorger', 'Strom, Gas, Wasser, etc.'],
                                    'Grundsteuer': ['Grundsteuer', 'Grundsteuerbescheid'],
                                    'Versicherung': ['Versicherung', 'Gebäudeversicherung, Haftpflicht, etc.'],
                                    'Kredit': ['Kredit', 'Kreditrate/Finanzierung'],
                                    'AfA': ['AfA', 'Abschreibung'],
                                    'Kaufvertrag': ['Kaufvertrag', 'Aus Kaufvertrag generiert'],
                                    'Mietvertrag': ['Mietvertrag', 'Mieteinnahmen']
                                };
                                if (sourceMap[value]) {
                                    displayText = sourceMap[value][0];
                                    description = sourceMap[value][1];
                                }
                                break;
                            case 'payment_rhythm':
                                const rhythmMap = {
                                    'Monatlich': ['Monatlich', 'Zahlung jeden Monat'],
                                    'Vierteljährlich': ['Vierteljährlich', 'Zahlung alle 3 Monate'],
                                    'Halbjährlich': ['Halbjährlich', 'Zahlung alle 6 Monate'],
                                    'Jährlich': ['Jährlich', 'Zahlung einmal pro Jahr']
                                };
                                if (rhythmMap[value]) {
                                    displayText = rhythmMap[value][0];
                                    description = rhythmMap[value][1];
                                }
                                break;
                            case 'legal_form':
                                const legalMap = {
                                    'PRIVATPERSON': ['Privatperson', 'Einzelperson als Eigentümer'],
                                    'GBR': ['GbR', 'Gesellschaft bürgerlichen Rechts'],
                                    'GMBH': ['GmbH', 'Gesellschaft mit beschränkter Haftung'],
                                    'AG': ['AG', 'Aktiengesellschaft']
                                };
                                if (legalMap[value]) {
                                    displayText = legalMap[value][0];
                                    description = legalMap[value][1];
                                }
                                break;
                            case 'account_framework':
                                const accountMap = {
                                    'SKR03': ['SKR03', 'Standardkontenrahmen 03 (Prozessgliederung)'],
                                    'SKR04': ['SKR04', 'Standardkontenrahmen 04 (Abschlussgliederung)']
                                };
                                if (accountMap[value]) {
                                    displayText = accountMap[value][0];
                                    description = accountMap[value][1];
                                }
                                break;
                        }
                        
                        doc += `| ${displayText} | \`${value}\` | ${description} |\n`;
                    });
                    doc += '\n';
                }
            }
        }
    }
    
    doc += '## Abhängigkeiten zwischen Konstanten\n\n';
    doc += '### CostCategory.applicable_for_legal_form\n';
    doc += 'Kostenkategorien können auf bestimmte Rechtsformen beschränkt sein:\n';
    doc += '- `ALLE`: Für alle Rechtsformen anwendbar\n';
    doc += '- `PRIVATPERSON`: Nur für Privatpersonen\n';
    doc += '- `GBR`: Nur für GbR\n';
    doc += '- `GMBH`: Nur für GmbH\n';
    doc += '- `AG`: Nur für AG\n\n';
    
    doc += '### CostCategory.applicable_for_usage\n';
    doc += 'Kostenkategorien können auf bestimmte Nutzungsarten beschränkt sein:\n';
    doc += '- `ALLE`: Für alle Nutzungsarten\n';
    doc += '- `WOHNUNG`: Nur für Wohnungen\n';
    doc += '- `GEWERBE`: Nur für Gewerbeimmobilien\n';
    doc += '- `GEMISCHT`: Nur für gemischte Nutzung\n\n';
    
    doc += '### Document.status → Workflow\n';
    doc += 'Der Dokumentenstatus folgt typischerweise diesem Workflow:\n';
    doc += '1. `zu_erledigen` → Initialer Status\n';
    doc += '2. `erstellt` → Nach Generierung\n';
    doc += '3. `geaendert` → Falls Änderungen vorgenommen wurden\n';
    doc += '4. `versendet` → Nach Versand per Post/Email\n';
    doc += '5. `unterschrieben` → Wenn Unterschrift vorliegt\n';
    doc += '6. `gescannt` → Wenn Original eingescannt wurde\n\n';
    
    doc += '### GeneratedFinancialBooking.booking_status → Zahlungsstatus\n';
    doc += 'Der Buchungsstatus folgt dem Zahlungsfluss:\n';
    doc += '1. `Geplant` → Buchung ist geplant\n';
    doc += '2. `Gebucht` → Buchung wurde gebucht\n';
    doc += '3. `TeilweiseBezahlt` → Teilzahlung erfolgt\n';
    doc += '4. `Bezahlt` → Vollständig bezahlt\n\n';
    
    doc += '## Verwendung in der App\n\n';
    doc += '### Frontend (React)\n';
    doc += 'Master Data werden in Select-Komponenten verwendet:\n';
    doc += '```jsx\n';
    doc += '<Select value={status} onValueChange={setStatus}>\n';
    doc += '  <SelectTrigger><SelectValue /></SelectTrigger>\n';
    doc += '  <SelectContent>\n';
    doc += '    <SelectItem value="zu_erledigen">Zu erledigen</SelectItem>\n';
    doc += '    <SelectItem value="erstellt">Erstellt</SelectItem>\n';
    doc += '    // ...\n';
    doc += '  </SelectContent>\n';
    doc += '</Select>\n';
    doc += '```\n\n';
    
    doc += '### Backend (Validierung)\n';
    doc += 'Die Enum-Werte werden automatisch durch die JSON-Schema-Validierung geprüft.\n';
    doc += 'Ungültige Werte werden beim Speichern abgelehnt.\n\n';
    
    return doc;
}

async function generateMasterDataJSON(entities) {
    return {
        document_statuses: ['zu_erledigen', 'erinnern', 'erstellt', 'geaendert', 'versendet', 'unterschrieben', 'gescannt'],
        booking_statuses: ['Geplant', 'Gebucht', 'TeilweiseBezahlt', 'Bezahlt']
    };
}

async function generateBusinessLogicDoc(entities) {
    let doc = '# Geschäftslogik & Validierungen - Immobilienverwaltung\n\n';
    doc += '**Metadaten:**\n';
    doc += `- Generiert am: ${new Date().toLocaleString('de-DE')}\n`;
    doc += '- Verwendungszweck: KI-Assistent Kontextinformation\n\n';
    doc += '---\n\n';
    
    doc += '## Übersicht\n\n';
    doc += 'Diese Dokumentation beschreibt alle Geschäftsregeln, Validierungen, Berechnungen\n';
    doc += 'und Automatismen der Immobilienverwaltungs-App.\n\n';
    
    doc += '## 1. Automatische Buchungsgenerierung\n\n';
    doc += '### 1.1 Grundsteuerbescheid (PropertyTax)\n\n';
    doc += '**Quelle**: PropertyTax Entity\n\n';
    doc += '**Trigger**: Button "Buchungen generieren" auf PropertyTax-Formular\n\n';
    doc += '**Generierungslogik**:\n';
    doc += '- Erstellt 4 Buchungen für Q1-Q4\n';
    doc += '- Betrag pro Buchung: `grundsteuer_quartalsrate`\n';
    doc += '- Fälligkeitsdatum: `faelligkeit_q1`, `faelligkeit_q2`, `faelligkeit_q3`, `faelligkeit_q4`\n';
    doc += '- Kostenkategorie: Grundsteuer (automatisch zugeordnet)\n';
    doc += '- Beschreibung: "Grundsteuer Q[1-4] {jahr} - {building_name}"\n\n';
    doc += '**Validierungen**:\n';
    doc += '- ✅ BLOCKER: `grundsteuerbescheid_jahr` muss gesetzt sein\n';
    doc += '- ✅ BLOCKER: `grundsteuer_quartalsrate` muss > 0 sein\n';
    doc += '- ✅ BLOCKER: Alle 4 Fälligkeitstermine müssen gesetzt sein\n';
    doc += '- ⚠️ WARNING: Falls bereits Buchungen existieren (`bookings_created = true`)\n\n';
    doc += '**Berechnungen**:\n';
    doc += '```javascript\n';
    doc += 'grundsteuer_quartalsrate = grundsteuer_jahresbetrag / 4\n';
    doc += '```\n\n';
    
    doc += '### 1.2 Versicherungen (Insurance)\n\n';
    doc += '**Quelle**: Insurance Entity\n\n';
    doc += '**Trigger**: Button "Buchungen generieren"\n\n';
    doc += '**Generierungslogik**:\n';
    doc += '- Anzahl Buchungen abhängig von `payment_rhythm`:\n';
    doc += '  - Monatlich: 12 Buchungen\n';
    doc += '  - Vierteljährlich: 4 Buchungen\n';
    doc += '  - Halbjährlich: 2 Buchungen\n';
    doc += '  - Jährlich: 1 Buchung\n';
    doc += '- Betrag pro Buchung: `premium_amount` / Anzahl Buchungen\n';
    doc += '- Fälligkeitsdatum: Ab `start_date` im jeweiligen Rhythmus\n';
    doc += '- Kostenkategorie: Versicherung\n\n';
    doc += '**Validierungen**:\n';
    doc += '- ✅ BLOCKER: `premium_amount` muss > 0 sein\n';
    doc += '- ✅ BLOCKER: `start_date` muss gesetzt sein\n';
    doc += '- ✅ BLOCKER: `payment_rhythm` muss gewählt sein\n';
    doc += '- ⚠️ WARNING: `end_date` sollte in der Zukunft liegen (falls gesetzt)\n\n';
    
    doc += '### 1.3 Kredite/Finanzierungen (Financing)\n\n';
    doc += '**Quelle**: Financing Entity\n\n';
    doc += '**Generierungslogik**:\n';
    doc += '- Monatliche Buchungen von `start_date` bis `end_date`\n';
    doc += '- Betrag: `monthly_rate`\n';
    doc += '- Fälligkeitsdatum: Jeweils Monatsende\n';
    doc += '- Kostenkategorie: Finanzierungskosten (Zinsen)\n\n';
    doc += '**Validierungen**:\n';
    doc += '- ✅ BLOCKER: `monthly_rate` muss > 0 sein\n';
    doc += '- ✅ BLOCKER: `start_date` muss vor `end_date` liegen\n';
    doc += '- ✅ BLOCKER: Laufzeit maximal 50 Jahre (Plausibilitätsprüfung)\n\n';
    doc += '**Berechnungen** (informativ):\n';
    doc += '```javascript\n';
    doc += 'total_interest = (monthly_rate * anzahl_monate) - loan_amount\n';
    doc += 'gesamt_rueckzahlung = monthly_rate * anzahl_monate\n';
    doc += '```\n\n';
    
    doc += '### 1.4 Versorger (Supplier)\n\n';
    doc += '**Quelle**: Supplier Entity\n\n';
    doc += '**Generierungslogik**:\n';
    doc += '- Buchungen entsprechend `payment_rhythm`\n';
    doc += '- Betrag: `monthly_amount` angepasst an Rhythmus\n';
    doc += '- Kostenkategorie: Abhängig von `supplier_type` (Strom, Gas, Wasser, etc.)\n\n';
    doc += '**Validierungen**:\n';
    doc += '- ✅ BLOCKER: `monthly_amount` muss > 0 sein\n';
    doc += '- ✅ BLOCKER: `supplier_type` muss gewählt sein\n';
    doc += '- ⚠️ WARNING: `contract_date` sollte in der Vergangenheit liegen\n\n';
    
    doc += '### 1.5 Mietverträge (LeaseContract)\n\n';
    doc += '**Quelle**: LeaseContract Entity\n\n';
    doc += '**Generierungslogik**:\n';
    doc += '- Monatliche Mietforderungen (Payment Entity)\n';
    doc += '- Betrag: `total_rent`\n';
    doc += '- Fälligkeitsdatum: `rent_due_day` jeden Monats\n';
    doc += '- Automatische Erstellung bei Vertragserstellung\n\n';
    doc += '**Validierungen**:\n';
    doc += '- ✅ BLOCKER: `base_rent` > 0\n';
    doc += '- ✅ BLOCKER: `total_rent` = `base_rent` + `utilities` + `heating`\n';
    doc += '- ✅ BLOCKER: `start_date` muss gesetzt sein\n';
    doc += '- ✅ BLOCKER: Bei befristet: `end_date` muss nach `start_date` liegen\n';
    doc += '- ✅ BLOCKER: `rent_due_day` zwischen 1 und 31\n';
    doc += '- ⚠️ WARNING: `deposit` sollte ≤ 3 * `base_rent` sein (gesetzliche Vorgabe)\n';
    doc += '- ⚠️ WARNING: Bei Kündigung: `termination_date` + `notice_period_months` = letzter Miettag\n\n';
    
    doc += '### 1.6 Kaufvertrag & AfA (PurchaseContract)\n\n';
    doc += '**Quelle**: PurchaseContract Entity\n\n';
    doc += '**Generierungslogik**:\n';
    doc += '- Jährliche AfA-Buchungen (Abschreibung)\n';
    doc += '- Separate Berechnung für Gebäude und Anschaffungsnebenkosten\n';
    doc += '- Monatsgenaue anteilige Berechnung im ersten Jahr\n\n';
    doc += '**Validierungen**:\n';
    doc += '- ✅ BLOCKER: `purchase_price` > 0\n';
    doc += '- ✅ BLOCKER: `purchase_date` muss gesetzt sein\n';
    doc += '- ⚠️ WARNING: `land_value` sollte < `purchase_price` sein\n';
    doc += '- ⚠️ WARNING: Gebäude-Wert sollte plausibel sein (70-90% des Kaufpreises)\n\n';
    doc += '**Berechnungen**:\n';
    doc += '```javascript\n';
    doc += '// AfA nur für Gebäude, nicht für Grundstück\n';
    doc += 'gebaeude_wert = purchase_price - land_value\n';
    doc += 'afa_rate = 0.02 // 2% linear für Wohngebäude\n';
    doc += 'jaehrliche_afa = gebaeude_wert * afa_rate\n';
    doc += '\n';
    doc += '// Erstes Jahr anteilig\n';
    doc += 'monate_im_ersten_jahr = 13 - purchase_date.month\n';
    doc += 'afa_erstes_jahr = jaehrliche_afa * (monate_im_ersten_jahr / 12)\n';
    doc += '```\n\n';
    
    doc += '## 2. Versionierung & Historisierung\n\n';
    doc += '### 2.1 Entitäten mit Versionierung\n\n';
    doc += 'Folgende Entitäten unterstützen vollständige Versionierung:\n\n';
    doc += '| Entity | Version-Felder | Zweck |\n';
    doc += '|--------|----------------|-------|\n';
    doc += '| PropertyTax | version_number, predecessor_id, is_current_valid | Grundsteueränderungen nachvollziehen |\n';
    doc += '| Insurance | version_number, predecessor_id, is_current_valid | Versicherungswechsel dokumentieren |\n';
    doc += '| Financing | version_number, predecessor_id, is_current_valid | Umschuldungen tracken |\n';
    doc += '| Supplier | version_number, predecessor_id, is_current_valid | Versorgerwechsel nachvollziehen |\n';
    doc += '| LeaseContract | version_number, predecessor_id, is_current_valid | Mieterhöhungen historisieren |\n\n';
    
    doc += '### 2.2 Versionierungs-Workflow\n\n';
    doc += '**Trigger**: User ändert eine versionierte Entity\n\n';
    doc += '**Ablauf**:\n';
    doc += '1. System setzt `is_current_valid = false` bei alter Version\n';
    doc += '2. Neue Version wird erstellt mit:\n';
    doc += '   - `version_number = alte_version + 1`\n';
    doc += '   - `predecessor_id = alte_id`\n';
    doc += '   - `is_current_valid = true`\n';
    doc += '3. Bereits generierte Buchungen bleiben unverändert und referenzieren weiterhin alte Version\n';
    doc += '4. Neue Buchungen (ab Änderungsdatum) werden aus neuer Version generiert\n\n';
    doc += '**Validierungen**:\n';
    doc += '- ✅ BLOCKER: Nur aktuelle Version (`is_current_valid = true`) kann geändert werden\n';
    doc += '- ⚠️ WARNING: Bei Änderung mit bestehenden Buchungen: Hinweis, dass alte Buchungen erhalten bleiben\n\n';
    
    doc += '## 3. Detaillierte Validierungen nach Modul\n\n';
    
    doc += '### 3.1 Mieterverwaltung\n\n';
    doc += '**LeaseContract**:\n';
    doc += '- ✅ BLOCKER: `unit_id` muss existieren und verfügbar sein\n';
    doc += '- ✅ BLOCKER: `tenant_id` muss existieren\n';
    doc += '- ✅ BLOCKER: `base_rent`, `utilities`, `heating` müssen ≥ 0 sein\n';
    doc += '- ✅ BLOCKER: `total_rent = base_rent + utilities + heating` (automatisch berechnet)\n';
    doc += '- ✅ BLOCKER: Keine überlappenden Verträge für dieselbe Unit\n';
    doc += '- ⚠️ WARNING: `deposit ≤ 3 * base_rent` (gesetzliche Obergrenze)\n';
    doc += '- ⚠️ WARNING: Bei `deposit_installments > 1`: Rate sollte plausibel sein\n\n';
    doc += '**RentChange (Mieterhöhung)**:\n';
    doc += '- ✅ BLOCKER: `new_rent > old_rent` (keine Mietsenkung über RentChange)\n';
    doc += '- ✅ BLOCKER: `effective_date` muss in der Zukunft liegen\n';
    doc += '- ⚠️ WARNING: Erhöhung > 20% innerhalb 3 Jahre → Hinweis auf Mietpreisbremse\n';
    doc += '- ⚠️ WARNING: Erhöhung ohne Begründung bei > 10% → Hinweis auf Begründungspflicht\n\n';
    
    doc += '### 3.2 Finanzverwaltung\n\n';
    doc += '**GeneratedFinancialBooking**:\n';
    doc += '- ✅ BLOCKER: `amount > 0`\n';
    doc += '- ✅ BLOCKER: `due_date` muss gesetzt sein\n';
    doc += '- ✅ BLOCKER: `building_id` muss existieren\n';
    doc += '- ✅ BLOCKER: `source_type` und `source_id` müssen gesetzt sein\n';
    doc += '- ✅ BLOCKER: Status-Übergang nur vorwärts: Geplant → Gebucht → TeilweiseBezahlt → Bezahlt\n';
    doc += '- ✅ BLOCKER: `paid_amount ≤ amount`\n';
    doc += '- ✅ BLOCKER: `outstanding_amount = amount - paid_amount` (automatisch berechnet)\n\n';
    doc += '**Invoice**:\n';
    doc += '- ✅ BLOCKER: `invoice_date` muss gesetzt sein\n';
    doc += '- ✅ BLOCKER: `total_amount > 0`\n';
    doc += '- ✅ BLOCKER: `cost_category_id` muss existieren (in BuildingTaxLibrary)\n';
    doc += '- ⚠️ WARNING: Duplikate-Erkennung bei gleicher `invoice_number` vom selben Supplier\n\n';
    doc += '**BankTransaction Matching**:\n';
    doc += '- ⚠️ AI-SUGGESTION: Bei ähnlichen Beträgen und Terminen → Matching-Vorschlag\n';
    doc += '- ⚠️ WARNING: Transaction > 30 Tage ohne Zuordnung\n';
    doc += '- ⚠️ WARNING: Mehrfach-Zuordnung einer Transaction nicht möglich\n\n';
    
    doc += '### 3.3 Steuern\n\n';
    doc += '**Anlage V (Vermietung & Verpachtung)**:\n';
    doc += '- ✅ BLOCKER: Gebäude muss vollständig erfasst sein (Adresse, Kaufdatum, etc.)\n';
    doc += '- ✅ BLOCKER: Abrechnungsjahr muss gewählt sein\n';
    doc += '- ⚠️ WARNING: Einnahmen = 0 → Hinweis auf fehlende Mietverträge\n';
    doc += '- ⚠️ WARNING: Werbungskosten > Einnahmen → Verlust, steuerlich relevant\n';
    doc += '- ⚠️ WARNING: AfA fehlt trotz Kaufvertrag → Hinweis\n\n';
    doc += '**15%-Regel (Erhaltung vs. Herstellung)**:\n';
    doc += '```javascript\n';
    doc += '// Automatische Prüfung bei Rechnungserfassung\n';
    doc += 'summe_instandhaltung_3_jahre = sum(erhaltungskosten)\n';
    doc += 'gebaeude_wert = purchase_price - land_value\n';
    doc += '\n';
    doc += 'if (summe_instandhaltung_3_jahre > gebaeude_wert * 0.15) {\n';
    doc += '  → ⚠️ WARNING: "15%-Grenze überschritten - Herstellungskosten prüfen!"\n';
    doc += '}\n';
    doc += '```\n\n';
    
    doc += '### 3.4 Betriebskosten\n\n';
    doc += '**OperatingCostStatement**:\n';
    doc += '- ✅ BLOCKER: Abrechnungszeitraum muss 12 Monate umfassen\n';
    doc += '- ✅ BLOCKER: Mindestens 1 LeaseContract muss ausgewählt sein\n';
    doc += '- ✅ BLOCKER: Verteilerschlüssel müssen für alle Positionen definiert sein\n';
    doc += '- ⚠️ WARNING: Vorauszahlungen fehlen → Hinweis auf incomplete Abrechnung\n';
    doc += '- ⚠️ WARNING: Kosten-Abweichung > 30% zum Vorjahr → Plausibilitätsprüfung\n\n';
    doc += '**Verteilerschlüssel-Berechnung**:\n';
    doc += '```javascript\n';
    doc += '// Nach Wohnfläche\n';
    doc += 'anteil_unit = unit.flaeche / gesamt_wohnflaeche\n';
    doc += 'kosten_unit = gesamtkosten * anteil_unit\n';
    doc += '\n';
    doc += '// Nach Personen\n';
    doc += 'anteil_unit = contract.number_of_persons / gesamt_personen\n';
    doc += 'kosten_unit = gesamtkosten * anteil_unit\n';
    doc += '\n';
    doc += '// Nach Verbrauch (Zähler)\n';
    doc += 'anteil_unit = (zaehlerstand_end - zaehlerstand_start) / gesamt_verbrauch\n';
    doc += 'kosten_unit = gesamtkosten * anteil_unit\n';
    doc += '```\n\n';
    
    doc += '### 3.5 Dokumentenverwaltung\n\n';
    doc += '**Document**:\n';
    doc += '- ✅ BLOCKER: `name` muss gesetzt sein\n';
    doc += '- ✅ BLOCKER: Bei Versand: `recipient_address` muss vollständig sein\n';
    doc += '- ⚠️ WARNING: Dokument ohne PDF → kann nicht versendet werden\n';
    doc += '- ⚠️ WARNING: Status "versendet" aber kein LetterShipment → Inkonsistenz\n\n';
    doc += '**Template**:\n';
    doc += '- ✅ BLOCKER: `content` darf nicht leer sein\n';
    doc += '- ✅ BLOCKER: Platzhalter müssen korrekte Syntax haben: `{{entity.field}}`\n';
    doc += '- ⚠️ WARNING: Unbekannte Platzhalter → werden nicht ersetzt\n\n';
    
    doc += '## 4. Berechnungslogiken\n\n';
    
    doc += '### 4.1 AfA (Abschreibung für Abnutzung)\n\n';
    doc += '**Berechnung**:\n';
    doc += '```javascript\n';
    doc += '// Lineare Abschreibung Wohngebäude\n';
    doc += 'nutzungsdauer = 50 // Jahre\n';
    doc += 'afa_rate = 1 / nutzungsdauer // 2% pro Jahr\n';
    doc += '\n';
    doc += '// Nur Gebäudewert, nicht Grundstück\n';
    doc += 'gebaeude_wert = purchase_price - land_value\n';
    doc += '\n';
    doc += '// Jährliche AfA\n';
    doc += 'jaehrliche_afa = gebaeude_wert * afa_rate\n';
    doc += '\n';
    doc += '// Erstes Jahr: Anteilig ab Kaufmonat\n';
    doc += 'monate_im_ersten_jahr = 12 - purchase_month + 1\n';
    doc += 'afa_erstes_jahr = jaehrliche_afa * (monate_im_ersten_jahr / 12)\n';
    doc += '\n';
    doc += '// Separate AfA für Anschaffungsnebenkosten\n';
    doc += 'anschaffungsnebenkosten = notary_fees + broker_fees + land_transfer_tax\n';
    doc += 'afa_nebenkosten = anschaffungsnebenkosten * afa_rate\n';
    doc += '```\n\n';
    
    doc += '### 4.2 Mieteinnahmen (Anlage V)\n\n';
    doc += '**Berechnung**:\n';
    doc += '```javascript\n';
    doc += '// Alle aktiven Mietverträge im Abrechnungsjahr\n';
    doc += 'contracts = LeaseContract.filter(year, building_id)\n';
    doc += '\n';
    doc += 'gesamt_einnahmen = 0\n';
    doc += 'for (contract of contracts) {\n';
    doc += '  // Anzahl Monate im Abrechnungsjahr\n';
    doc += '  monate = calculate_months_in_year(contract, year)\n';
    doc += '  einnahmen += contract.total_rent * monate\n';
    doc += '}\n';
    doc += '\n';
    doc += '// Berücksichtigung: Mietrückstände, Nachzahlungen, Kautionsverwendung\n';
    doc += '```\n\n';
    
    doc += '### 4.3 Werbungskosten (Anlage V)\n\n';
    doc += '**Kategorisierung**:\n';
    doc += '```javascript\n';
    doc += '// Sofort absetzbare Werbungskosten\n';
    doc += 'erhaltungskosten = sum(invoices where tax_treatment = "SOFORT")\n';
    doc += '\n';
    doc += '// Beispiele:\n';
    doc += '- Grundsteuer\n';
    doc += '- Versicherungen\n';
    doc += '- Hausverwaltung\n';
    doc += '- Reparaturen (Erhaltung)\n';
    doc += '- Nebenkosten die nicht umgelegt werden\n';
    doc += '\n';
    doc += '// Nur über AfA absetzbar\n';
    doc += 'herstellungskosten = sum(invoices where tax_treatment = "AFA")\n';
    doc += '\n';
    doc += '// Beispiele:\n';
    doc += '- Sanierung\n';
    doc += '- Anbau\n';
    doc += '- Wesentliche Modernisierung\n';
    doc += '\n';
    doc += '// Gesamt-Werbungskosten für Anlage V\n';
    doc += 'werbungskosten = erhaltungskosten + afa_betrag + zinsen\n';
    doc += '```\n\n';
    
    doc += '### 4.4 Betriebskostenabrechnung\n\n';
    doc += '**Berechnung pro Mieter**:\n';
    doc += '```javascript\n';
    doc += '// 1. Gesamtkosten ermitteln\n';
    doc += 'gesamtkosten = sum(alle_positionen)\n';
    doc += '\n';
    doc += '// 2. Umlegbare vs. nicht umlegbare Kosten trennen\n';
    doc += 'umlegbare_kosten = sum(positionen where umlegbar = true)\n';
    doc += '\n';
    doc += '// 3. Anteil pro Wohnung berechnen\n';
    doc += 'for (position of positionen) {\n';
    doc += '  if (position.verteilerschluessel == "Fläche") {\n';
    doc += '    anteil = unit.flaeche / gesamt_wohnflaeche\n';
    doc += '  } else if (position.verteilerschluessel == "Personen") {\n';
    doc += '    anteil = contract.number_of_persons / gesamt_personen\n';
    doc += '  } else if (position.verteilerschluessel == "Verbrauch") {\n';
    doc += '    anteil = verbrauch_unit / gesamt_verbrauch\n';
    doc += '  }\n';
    doc += '  \n';
    doc += '  kosten_unit += position.betrag * anteil\n';
    doc += '}\n';
    doc += '\n';
    doc += '// 4. Vorauszahlungen verrechnen\n';
    doc += 'geleistete_vorauszahlungen = contract.utilities * 12\n';
    doc += 'nachzahlung_oder_guthaben = kosten_unit - geleistete_vorauszahlungen\n';
    doc += '```\n\n';
    
    doc += '### 4.5 Kreditberechnung (informativ)\n\n';
    doc += '**Annuitätendarlehen**:\n';
    doc += '```javascript\n';
    doc += '// Monatliche Rate berechnen\n';
    doc += 'p = loan_amount // Darlehensbetrag\n';
    doc += 'i = interest_rate / 12 / 100 // Monatlicher Zinssatz\n';
    doc += 'n = duration_years * 12 // Anzahl Monate\n';
    doc += '\n';
    doc += 'monthly_rate = p * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1)\n';
    doc += '\n';
    doc += '// Zinsen und Tilgung pro Rate\n';
    doc += 'zinsen_monat_1 = p * i\n';
    doc += 'tilgung_monat_1 = monthly_rate - zinsen_monat_1\n';
    doc += '```\n\n';
    
    doc += '## 5. Fehlermeldungen & User Feedback\n\n';
    
    doc += '### 5.1 Blocker (Kritische Fehler)\n\n';
    doc += 'Verhindern das Speichern/Fortfahren:\n';
    doc += '- "Pflichtfeld darf nicht leer sein"\n';
    doc += '- "Betrag muss größer als 0 sein"\n';
    doc += '- "Enddatum muss nach Startdatum liegen"\n';
    doc += '- "Unit ist bereits vermietet in diesem Zeitraum"\n';
    doc += '- "Summe der Miete stimmt nicht überein"\n\n';
    
    doc += '### 5.2 Warnings (Hinweise)\n\n';
    doc += 'Lassen Speichern zu, warnen aber:\n';
    doc += '- "⚠️ Kaution überschreitet gesetzliche Obergrenze (3 Monatsmieten)"\n';
    doc += '- "⚠️ Mieterhöhung > 20% in 3 Jahren - Mietpreisbremse beachten!"\n';
    doc += '- "⚠️ 15%-Regel überschritten - Prüfung auf Herstellungskosten empfohlen"\n';
    doc += '- "⚠️ Bereits Buchungen vorhanden - alte Buchungen bleiben bestehen"\n';
    doc += '- "⚠️ Keine Buchungen für dieses Jahr - Anlage V unvollständig"\n\n';
    
    doc += '### 5.3 Info (Informationen)\n\n';
    doc += 'Reine Informationen ohne Warnung:\n';
    doc += '- "ℹ️ Buchungen erfolgreich generiert (4 Quartale)"\n';
    doc += '- "ℹ️ Neue Version erstellt - alte Version archiviert"\n';
    doc += '- "ℹ️ Automatisches Matching gefunden: 3 Transaktionen"\n\n';
    
    doc += '## 6. Automatische Plausibilitätsprüfungen\n\n';
    
    doc += '### 6.1 Finanzen\n';
    doc += '- Transaktion > €10.000 ohne Kategorie → Hinweis\n';
    doc += '- Negative Einnahmen → Storno-Vermerk erforderlich\n';
    doc += '- Doppelte Rechnungsnummer vom gleichen Lieferanten → Duplikat-Warnung\n';
    doc += '- Rechnungsdatum in der Zukunft → Plausibilitätsprüfung\n\n';
    
    doc += '### 6.2 Verträge\n';
    doc += '- Mietvertrag ohne Kaution → Hinweis (unüblich)\n';
    doc += '- Miete < €100 oder > €10.000 → Plausibilitätsprüfung\n';
    doc += '- Versicherungssumme deutlich < Gebäudewert → Unterversicherung-Warnung\n\n';
    
    doc += '### 6.3 Steuern\n';
    doc += '- Verlust aus Vermietung > 3 Jahre → Hinweis auf Liebhaberei-Prüfung\n';
    doc += '- AfA > Gebäudewert → Berechnungsfehler\n';
    doc += '- Keine Einnahmen trotz Mietverträgen → Daten unvollständig\n\n';
    
    return doc;
}

async function generateExternalIntegrationsDoc() {
    let doc = '# Externe Integrationen - Immobilienverwaltung\n\n';
    doc += '**Metadaten:**\n';
    doc += `- Generiert am: ${new Date().toLocaleString('de-DE')}\n`;
    doc += '- Verwendungszweck: KI-Assistent Kontextinformation\n\n';
    doc += '---\n\n';
    
    doc += '## Übersicht\n\n';
    doc += 'Die Immobilienverwaltungs-App integriert 3 Haupt-Dienste:\n';
    doc += '1. **LetterXpress** - Automatisierter Postversand\n';
    doc += '2. **FinAPI** - Multi-Banking und Transaktions-Import\n';
    doc += '3. **Base44 Core Services** - LLM, E-Mail, Dateien, Bildgenerierung\n\n';
    
    doc += '---\n\n';
    
    doc += '## 1. LetterXpress API (Postversand)\n\n';
    
    doc += '### 1.1 Service-Identifikation\n\n';
    doc += '- **Offizieller Name**: LetterXpress.de API\n';
    doc += '- **Version**: v1\n';
    doc += '- **Base URL**: `https://api.letterxpress.de/v1`\n';
    doc += '- **Anbieter**: LetterXpress GmbH, Deutschland\n';
    doc += '- **Zweck**: Automatisierter Versand von Briefen per Post (normal, Einschreiben R1/R2) ohne manuelle Postaufgabe\n\n';
    
    doc += '### 1.2 Verwendung in der App\n\n';
    doc += '**Module**: Dokumentenverwaltung, Kommunikation\n\n';
    doc += '**User-Aktionen die API-Calls triggern**:\n';
    doc += '- User klickt "Per Post versenden" bei einem Dokument\n';
    doc += '- Scheduled Task läuft täglich: `updateLetterTrackingCodes` (Admin-only)\n';
    doc += '- User prüft Guthaben in LetterXpress-Einstellungen\n\n';
    doc += '**Häufigkeit**: Auf Abruf (pro Dokument), täglich für Tracking-Updates\n\n';
    
    doc += '### 1.3 Datenfluss OUTBOUND (App → LetterXpress)\n\n';
    doc += '**Endpoint**: `POST https://api.letterxpress.de/v1/send`\n\n';
    doc += '**Datenformat**: JSON + Base64-encoded PDF\n\n';
    doc += '**Datenquellen**:\n';
    doc += '- `Document` Entity: name, recipient_name, recipient_address, pdf_url\n';
    doc += '- `LetterXpressCredential` Entity: username, api_key, mode\n\n';
    doc += '**Beispiel-Request**:\n';
    doc += '```json\n';
    doc += '{\n';
    doc += '  "auth": {\n';
    doc += '    "username": "user@example.com",\n';
    doc += '    "apikey": "abc123xyz456"\n';
    doc += '  },\n';
    doc += '  "letter": {\n';
    doc += '    "base64_file": "JVBERi0xLjcKJeLjz9...",\n';
    doc += '    "base64_checksum": "a3f2e1d4c5b6a7",\n';
    doc += '    "specification": {\n';
    doc += '      "color": "1",          // 1=SW, 4=Farbe\n';
    doc += '      "mode": "simplex",     // simplex oder duplex\n';
    doc += '      "ship": "national"     // national oder international\n';
    doc += '    },\n';
    doc += '    "attaching": {\n';
    doc += '      "send": "r2"           // normal, r1 (Einwurf), r2 (Einschreiben)\n';
    doc += '    },\n';
    doc += '    "notice": "Mieterhöhung - Gebäude Hauptstraße 1"\n';
    doc += '  }\n';
    doc += '}\n';
    doc += '```\n\n';
    
    doc += '**Daten-Mapping (App → API)**:\n';
    doc += '| App-Feld | API-Parameter | Transformation |\n';
    doc += '|----------|---------------|----------------|\n';
    doc += '| Document.pdf_url | letter.base64_file | PDF fetchen, base64 encoden |\n';
    doc += '| - (calculated) | letter.base64_checksum | SHA-256 Hash (32 chars) |\n';
    doc += '| Document.versandart | letter.attaching.send | "normal" / "r1" / "r2" |\n';
    doc += '| LetterXpressCredential.username | auth.username | Direkt |\n';
    doc += '| LetterXpressCredential.api_key | auth.apikey | Direkt |\n';
    doc += '| Document.name | letter.notice | Optional, für interne Referenz |\n\n';
    
    doc += '### 1.4 Datenfluss INBOUND (LetterXpress → App)\n\n';
    doc += '**Beispiel-Response (send_letter)**:\n';
    doc += '```json\n';
    doc += '{\n';
    doc += '  "job": {\n';
    doc += '    "id": 12345678,\n';
    doc += '    "status": "queue",\n';
    doc += '    "price": {\n';
    doc += '      "net": 1.20,\n';
    doc += '      "gross": 1.43\n';
    doc += '    },\n';
    doc += '    "letter": {\n';
    doc += '      "pages": 3,\n';
    doc += '      "filename": "Mieterhoehung_2024.pdf"\n';
    doc += '    }\n';
    doc += '  }\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Beispiel-Response (get_job mit Tracking)**:\n';
    doc += '```json\n';
    doc += '{\n';
    doc += '  "job": {\n';
    doc += '    "id": 12345678,\n';
    doc += '    "status": "sent",\n';
    doc += '    "tracking_code": "1234567890DE",\n';
    doc += '    "dispatch_date": "2024-01-07"\n';
    doc += '  }\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Daten-Mapping (API-Response → App)**:\n';
    doc += '| API-Feld | App-Feld | Entity |\n';
    doc += '|----------|----------|--------|\n';
    doc += '| job.id | lxp_job_id | LetterShipment |\n';
    doc += '| job.status | status | LetterShipment (queue/hold/done/sent) |\n';
    doc += '| job.price.net | cost_net | LetterShipment |\n';
    doc += '| job.price.gross | cost_gross | LetterShipment |\n';
    doc += '| job.letter.pages | pages | LetterShipment |\n';
    doc += '| job.tracking_code | tracking_code | LetterShipment |\n';
    doc += '| job.dispatch_date | dispatch_date | LetterShipment |\n';
    doc += '| - | versandstatus="versendet" | Document |\n';
    doc += '| - | versandt_am=now() | Document |\n\n';
    
    doc += '### 1.5 Authentifizierung\n\n';
    doc += '- **Methode**: API-Key Authentication (im Request-Body)\n';
    doc += '- **Credentials-Speicherung**: `LetterXpressCredential` Entity (1 Account pro App)\n';
    doc += '- **Felder**:\n';
    doc += '  - `username`: LetterXpress-E-Mail\n';
    doc += '  - `api_key`: API-Key (verschlüsselt in DB)\n';
    doc += '  - `mode`: "test" oder "live"\n';
    doc += '- **Token-Refresh**: Nicht erforderlich (statischer API-Key)\n\n';
    
    doc += '### 1.6 Fehlerbehandlung\n\n';
    doc += '**Mögliche Fehler**:\n';
    doc += '- `400 Bad Request`: PDF ungültig, fehlende Parameter\n';
    doc += '- `401 Unauthorized`: API-Key falsch oder abgelaufen\n';
    doc += '- `403 Forbidden`: Kein Guthaben\n';
    doc += '- `429 Too Many Requests`: Rate Limit überschritten (> 1 req/sec)\n';
    doc += '- `500 Internal Server Error`: LetterXpress-Systemfehler\n\n';
    doc += '**App-Reaktion**:\n';
    doc += '```javascript\n';
    doc += 'try {\n';
    doc += '  const response = await axios.post(url, data);\n';
    doc += '} catch (error) {\n';
    doc += '  if (error.response?.status === 403) {\n';
    doc += '    return { error: "Kein Guthaben - bitte aufladen" };\n';
    doc += '  } else if (error.response?.status === 429) {\n';
    doc += '    // Warte 60 Sekunden und retry\n';
    doc += '    await sleep(60000);\n';
    doc += '    return retry();\n';
    doc += '  } else {\n';
    doc += '    return { error: "Versand fehlgeschlagen: " + error.message };\n';
    doc += '  }\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Logging**: Alle Requests/Responses werden in LetterShipment Entity gespeichert\n\n';
    doc += '**Timeouts**: 30 Sekunden pro Request (Axios default)\n\n';
    
    doc += '### 1.7 Compliance & Rechtliches\n\n';
    doc += '- **DSGVO**: ✅ Konform (deutscher Anbieter, Server in Deutschland)\n';
    doc += '- **Übertragene Daten**: Empfänger-Name, Adresse, Dokumenteninhalt (PDF)\n';
    doc += '- **AV-Vertrag**: Erforderlich (muss User mit LetterXpress abschließen)\n';
    doc += '- **Datenspeicherung**: LetterXpress speichert PDFs 30 Tage, dann automatische Löschung\n\n';
    
    doc += '### 1.8 Kosten & Limits\n\n';
    doc += '**Preismodell**: Pay-per-Letter (Guthaben-System)\n';
    doc += '- 1-2 Seiten SW: ~€0,70-1,00 netto\n';
    doc += '- Einschreiben Einwurf (R1): +€3,69\n';
    doc += '- Einschreiben (R2): +€4,05\n';
    doc += '- Farbdruck: +€0,10 pro Seite\n\n';
    doc += '**Rate Limits**: Max. 1 Request/Sekunde (automatischer 60s Timeout bei Überschreitung)\n\n';
    doc += '**Sonstiges**: Test-Mode kostenlos, aber keine echte Zustellung\n\n';
    
    doc += '---\n\n';
    
    doc += '## 2. FinAPI (Multi-Banking)\n\n';
    
    doc += '### 2.1 Service-Identifikation\n\n';
    doc += '- **Offizieller Name**: finAPI Access B2C (finleap connect GmbH)\n';
    doc += '- **Version**: API v1\n';
    doc += '- **Base URL**: Konfiguriert via `FINAPI_BASE_URL` Secret (z.B. https://sandbox.finapi.io)\n';
    doc += '- **Anbieter**: finleap connect GmbH (Teil von finAPI)\n';
    doc += '- **Zweck**: PSD2-konforme Multi-Banking-Integration für Transaktions-Import und Kontostandsabfragen\n\n';
    
    doc += '### 2.2 Verwendung in der App\n\n';
    doc += '**Module**: Finanzverwaltung, Banking\n\n';
    doc += '**User-Aktionen**:\n';
    doc += '- User klickt "Bankkonto verbinden" → `finapiConnect`\n';
    doc += '- User wählt Bank aus und gibt Zugangsdaten ein (im FinAPI Web Form)\n';
    doc += '- User klickt "Konten importieren" → `finapiImportAccounts`\n';
    doc += '- User klickt "Transaktionen synchronisieren" oder automatischer Sync → `finapiSync`\n\n';
    doc += '**Häufigkeit**: Täglich automatisch (Scheduled Task) + manuell auf Abruf\n\n';
    
    doc += '### 2.3 Datenfluss OUTBOUND (App → FinAPI)\n\n';
    doc += '#### 2.3.1 Verbindung herstellen (finapiConnect)\n\n';
    doc += '**Endpoint**: `POST /api/v1/bankConnections/import`\n\n';
    doc += '**Beispiel-Request**:\n';
    doc += '```json\n';
    doc += '{\n';
    doc += '  "bankId": 280,\n';
    doc += '  "credentials": [\n';
    doc += '    { "label": "Onlinebanking-Nutzer", "value": "12345678" },\n';
    doc += '    { "label": "PIN", "value": "****" }\n';
    doc += '  ],\n';
    doc += '  "storeSecrets": true,\n';
    doc += '  "skipPositionsDownload": false\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Datenquellen**: User-Input im Frontend (Bank-Auswahl, Zugangsdaten)\n\n';
    
    doc += '#### 2.3.2 Konten importieren (finapiImportAccounts)\n\n';
    doc += '**Endpoint**: `GET /api/v1/accounts`\n\n';
    doc += '**Query-Parameter**:\n';
    doc += '```\n';
    doc += '?ids={bankConnectionId}\n';
    doc += '```\n\n';
    
    doc += '#### 2.3.3 Transaktionen synchronisieren (finapiSync)\n\n';
    doc += '**Endpoint**: `POST /api/v1/bankConnections/update`\n\n';
    doc += '**Beispiel-Request**:\n';
    doc += '```json\n';
    doc += '{\n';
    doc += '  "bankConnectionId": 12345,\n';
    doc += '  "skipPositionsDownload": false,\n';
    doc += '  "loadOwnerData": false\n';
    doc += '}\n';
    doc += '```\n\n';
    
    doc += '### 2.4 Datenfluss INBOUND (FinAPI → App)\n\n';
    doc += '**Beispiel-Response (Konten)**:\n';
    doc += '```json\n';
    doc += '{\n';
    doc += '  "accounts": [\n';
    doc += '    {\n';
    doc += '      "id": 123456,\n';
    doc += '      "accountName": "Girokonto",\n';
    doc += '      "iban": "DE89370400440532013000",\n';
    doc += '      "accountType": "CHECKING",\n';
    doc += '      "balance": 5432.10,\n';
    doc += '      "currency": "EUR"\n';
    doc += '    }\n';
    doc += '  ]\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Beispiel-Response (Transaktionen)**:\n';
    doc += '```json\n';
    doc += '{\n';
    doc += '  "transactions": [\n';
    doc += '    {\n';
    doc += '      "id": 987654,\n';
    doc += '      "amount": -350.00,\n';
    doc += '      "purpose": "Miete Januar 2024",\n';
    doc += '      "counterpartName": "Max Mustermann",\n';
    doc += '      "counterpartIban": "DE12345678901234567890",\n';
    doc += '      "bankBookingDate": "2024-01-05",\n';
    doc += '      "valueDate": "2024-01-05"\n';
    doc += '    }\n';
    doc += '  ]\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Daten-Mapping (API → App)**:\n';
    doc += '| FinAPI-Feld | App-Feld | Entity |\n';
    doc += '|-------------|----------|--------|\n';
    doc += '| account.id | finapi_connection_id | BankAccount |\n';
    doc += '| account.accountName | name | BankAccount |\n';
    doc += '| account.iban | iban | BankAccount |\n';
    doc += '| account.balance | current_balance | BankAccount |\n';
    doc += '| transaction.id | finapi_transaction_id | BankTransaction |\n';
    doc += '| transaction.amount | amount | BankTransaction |\n';
    doc += '| transaction.purpose | purpose | BankTransaction |\n';
    doc += '| transaction.counterpartName | counterpart_name | BankTransaction |\n';
    doc += '| transaction.counterpartIban | counterpart_iban | BankTransaction |\n';
    doc += '| transaction.bankBookingDate | booking_date | BankTransaction |\n\n';
    
    doc += '### 2.5 Authentifizierung\n\n';
    doc += '- **Methode**: OAuth 2.0 Client Credentials Flow\n';
    doc += '- **Secrets**:\n';
    doc += '  - `FINAPI_CLIENT_ID`: OAuth Client-ID\n';
    doc += '  - `FINAPI_CLIENT_SECRET`: OAuth Client-Secret\n';
    doc += '  - `FINAPI_BASE_URL`: API-Endpunkt\n';
    doc += '- **Token-Refresh**:\n';
    doc += '```javascript\n';
    doc += 'const tokenResponse = await axios.post(\n';
    doc += '  `${FINAPI_BASE_URL}/oauth/token`,\n';
    doc += '  new URLSearchParams({\n';
    doc += '    grant_type: "client_credentials",\n';
    doc += '    client_id: FINAPI_CLIENT_ID,\n';
    doc += '    client_secret: FINAPI_CLIENT_SECRET\n';
    doc += '  })\n';
    doc += ');\n';
    doc += 'const accessToken = tokenResponse.data.access_token;\n';
    doc += '```\n\n';
    doc += '- **Berechtigungen**: Voller Zugriff auf Bank-Konten und Transaktionen (im User-Scope)\n\n';
    
    doc += '### 2.6 Fehlerbehandlung\n\n';
    doc += '**Mögliche Fehler**:\n';
    doc += '- `400 Bad Request`: Ungültige Bank-ID oder Credentials\n';
    doc += '- `401 Unauthorized`: OAuth-Token abgelaufen\n';
    doc += '- `403 Forbidden`: Bank-Zugang gesperrt oder TAN erforderlich\n';
    doc += '- `451 Unavailable For Legal Reasons`: PSD2-Limit erreicht (90 Tage)\n';
    doc += '- `500 Internal Server Error`: FinAPI-Systemfehler\n';
    doc += '- `503 Service Unavailable`: Bank-Server nicht erreichbar\n\n';
    doc += '**App-Reaktion**:\n';
    doc += '- Bei 401: Token automatisch erneuern und Request wiederholen\n';
    doc += '- Bei 403/451: User-Benachrichtigung, manuelle Neuverbindung erforderlich\n';
    doc += '- Bei 503: Retry nach 5 Minuten (max. 3 Versuche)\n\n';
    doc += '**Logging**: Alle Sync-Vorgänge werden in ActivityLog gespeichert\n\n';
    
    doc += '### 2.7 Compliance & Rechtliches\n\n';
    doc += '- **PSD2**: ✅ Voll konform (BaFin-lizenziert)\n';
    doc += '- **DSGVO**: ✅ Konform (EU-Server)\n';
    doc += '- **Übertragene Daten**: Bank-Zugangsdaten, Transaktionen, Kontostände\n';
    doc += '- **Datenspeicherung**: Zugangsdaten verschlüsselt bei FinAPI, Transaktionen lokal in App\n';
    doc += '- **90-Tage-Regel**: PSD2 erfordert Neuverbindung alle 90 Tage (TAN-Eingabe)\n';
    doc += '- **Lizenz**: FinAPI ist als Zahlungsauslösedienst bei BaFin registriert\n\n';
    
    doc += '### 2.8 Kosten & Limits\n\n';
    doc += '**Preismodell**: Typischerweise Abo-Modell (z.B. €X/User/Monat)\n';
    doc += '- Sandbox: Kostenlos (Test-Banken)\n';
    doc += '- Produktiv: Lizenzgebühr (abhängig vom Vertrag)\n\n';
    doc += '**Rate Limits**:\n';
    doc += '- Sandbox: 100 Requests/Minute\n';
    doc += '- Produktiv: Je nach Vertrag (typischerweise höher)\n\n';
    doc += '**PSD2-Limits**: Max. 4 Transaktions-Abrufe pro Tag pro Konto\n\n';
    
    doc += '---\n\n';
    
    doc += '## 3. Base44 Core Services\n\n';
    
    doc += '### 3.1 InvokeLLM (KI-Assistent)\n\n';
    doc += '**Zweck**: LLM-basierte Datenanalyse, Extraktion, Kategorisierung\n\n';
    doc += '**Verwendung**:\n';
    doc += '- PDF-Extraktion (Rechnungen, Bescheide)\n';
    doc += '- E-Mail-Analyse für automatische Task-Erstellung\n';
    doc += '- Transaktions-Kategorisierung (AI-Matching)\n';
    doc += '- Template-Vorschlag aus PDF-Upload\n\n';
    doc += '**Beispiel-Request**:\n';
    doc += '```javascript\n';
    doc += 'const result = await base44.integrations.Core.InvokeLLM({\n';
    doc += '  prompt: "Extrahiere aus diesem PDF: Rechnungsnummer, Datum, Betrag, Lieferant",\n';
    doc += '  file_urls: ["https://storage.../rechnung.pdf"],\n';
    doc += '  response_json_schema: {\n';
    doc += '    type: "object",\n';
    doc += '    properties: {\n';
    doc += '      invoice_number: { type: "string" },\n';
    doc += '      invoice_date: { type: "string", format: "date" },\n';
    doc += '      total_amount: { type: "number" },\n';
    doc += '      supplier_name: { type: "string" }\n';
    doc += '    }\n';
    doc += '  }\n';
    doc += '});\n';
    doc += '```\n\n';
    doc += '**Response**: Strukturiertes JSON-Objekt (kein Parsing nötig)\n\n';
    
    doc += '### 3.2 SendEmail\n\n';
    doc += '**Zweck**: Transaktionale E-Mails versenden\n\n';
    doc += '**Verwendung**:\n';
    doc += '- Benachrichtigungen (Dokument versendet, Zahlung eingegangen)\n';
    doc += '- Erinnerungen (Miete fällig, Aufgabe überfällig)\n';
    doc += '- Reports (Monats-Übersicht)\n\n';
    doc += '**Beispiel-Request**:\n';
    doc += '```javascript\n';
    doc += 'await base44.integrations.Core.SendEmail({\n';
    doc += '  from_name: "ImmoVerwalter",\n';
    doc += '  to: "verwalter@example.com",\n';
    doc += '  subject: "Neue Mietzahlung eingegangen",\n';
    doc += '  body: "Mieter Max Mustermann hat €850 überwiesen."\n';
    doc += '});\n';
    doc += '```\n\n';
    
    doc += '### 3.3 UploadFile\n\n';
    doc += '**Zweck**: Dateien zu Cloud-Storage hochladen\n\n';
    doc += '**Verwendung**:\n';
    doc += '- Generierte PDFs speichern\n';
    doc += '- Gescannte Original-Dokumente speichern\n';
    doc += '- Logos und Assets hochladen\n\n';
    doc += '**Beispiel-Request**:\n';
    doc += '```javascript\n';
    doc += 'const { file_url } = await base44.integrations.Core.UploadFile({\n';
    doc += '  file: pdfBlob\n';
    doc += '});\n';
    doc += '// file_url: "https://storage.base44.com/files/user123/doc456.pdf"\n';
    doc += '```\n\n';
    
    doc += '### 3.4 GenerateImage\n\n';
    doc += '**Zweck**: KI-Bildgenerierung (DALL-E, Stable Diffusion)\n\n';
    doc += '**Verwendung**:\n';
    doc += '- Platzhalter-Bilder für Objekte ohne Foto\n';
    doc += '- Marketing-Material generieren\n\n';
    doc += '**Beispiel-Request**:\n';
    doc += '```javascript\n';
    doc += 'const { url } = await base44.integrations.Core.GenerateImage({\n';
    doc += '  prompt: "Moderne Wohnanlage, 3 Stockwerke, Fotorealistisch"\n';
    doc += '});\n';
    doc += '```\n\n';
    
    doc += '### 3.5 ExtractDataFromUploadedFile\n\n';
    doc += '**Zweck**: Strukturierte Daten aus Dateien extrahieren\n\n';
    doc += '**Verwendung**:\n';
    doc += '- CSV-Import (Bulk-Daten)\n';
    doc += '- PDF-Tabellen extrahieren (z.B. Betriebskostenabrechnung vom Vorjahr)\n';
    doc += '- Excel-Import\n\n';
    doc += '**Beispiel-Request**:\n';
    doc += '```javascript\n';
    doc += 'const result = await base44.integrations.Core.ExtractDataFromUploadedFile({\n';
    doc += '  file_url: "https://storage.../nk-abrechnung-2023.pdf",\n';
    doc += '  json_schema: {\n';
    doc += '    type: "object",\n';
    doc += '    properties: {\n';
    doc += '      items: {\n';
    doc += '        type: "array",\n';
    doc += '        items: {\n';
    doc += '          type: "object",\n';
    doc += '          properties: {\n';
    doc += '            kostenart: { type: "string" },\n';
    doc += '            betrag: { type: "number" }\n';
    doc += '          }\n';
    doc += '        }\n';
    doc += '      }\n';
    doc += '    }\n';
    doc += '  }\n';
    doc += '});\n';
    doc += '// result: { status: "success", output: [...] }\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
    doc += '## 4. Geplante Integrationen (nicht implementiert)\n\n';
    
    doc += '### 4.1 ELSTER (Steuer-Übermittlung)\n\n';
    doc += '**Zweck**: Elektronische Steuererklärung (Anlage V) an Finanzamt übermitteln\n\n';
    doc += '**Status**: 🚧 Geplant, nicht implementiert\n\n';
    doc += '**Anforderungen**:\n';
    doc += '- ELSTER-Zertifikat erforderlich (kostenpflichtig)\n';
    doc += '- ERiC (ELSTER Rich Client) Integration\n';
    doc += '- Validierung nach offiziellen XSD-Schemas\n';
    doc += '- Test-Übermittlung an Clearingstelle erforderlich\n\n';
    
    doc += '### 4.2 OCR-Services (Dokumenten-Scanning)\n\n';
    doc += '**Zweck**: Gescannte Dokumente automatisch auslesen\n\n';
    doc += '**Status**: 🚧 Teilweise via InvokeLLM implementiert (Vision-Modelle)\n\n';
    doc += '**Alternative**: Google Cloud Vision API, AWS Textract\n\n';
    
    doc += '---\n\n';
    
    doc += '## 5. Service-Abhängigkeiten\n\n';
    
    doc += '### 5.1 Dokumenten-Versand Workflow\n\n';
    doc += '```\n';
    doc += '1. User erstellt Dokument (Template + Daten)\n';
    doc += '2. App generiert HTML\n';
    doc += '3. Puppeteer (lokal) → PDF\n';
    doc += '4. Base44.UploadFile → PDF zu Storage\n';
    doc += '5. LetterXpress.send_letter → Postversand\n';
    doc += '6. LetterShipment Entity speichern\n';
    doc += '7. Scheduled Task: LetterXpress.get_job → Tracking-Update\n';
    doc += '```\n\n';
    doc += '**Abhängigkeiten**: UploadFile muss vor LetterXpress erfolgen\n\n';
    doc += '**Rollback**: Bei Fehler in Schritt 5 → PDF bleibt gespeichert, Dokument-Status "erstellt"\n\n';
    
    doc += '### 5.2 Banking & Matching Workflow\n\n';
    doc += '```\n';
    doc += '1. User verbindet Bank via FinAPI\n';
    doc += '2. FinAPI → Konten importieren → BankAccount\n';
    doc += '3. FinAPI → Transaktionen abrufen → BankTransaction\n';
    doc += '4. Scheduled Task oder manuell: Sync\n';
    doc += '5. AI-Matching (InvokeLLM):\n';
    doc += '   - Transaktions-Text analysieren\n';
    doc += '   - Mit GeneratedFinancialBooking abgleichen\n';
    doc += '   - PaymentTransactionLink erstellen\n';
    doc += '6. User bestätigt Matches oder korrigiert\n';
    doc += '```\n\n';
    doc += '**Abhängigkeiten**: FinAPI-Sync muss vor AI-Matching erfolgen\n\n';
    doc += '**Rollback**: Matches können jederzeit gelöscht werden (PaymentTransactionLink.delete)\n\n';
    
    doc += '### 5.3 Rechnungs-Extraktion Workflow\n\n';
    doc += '```\n';
    doc += '1. User lädt Rechnungs-PDF hoch\n';
    doc += '2. Base44.UploadFile → PDF zu Storage\n';
    doc += '3. InvokeLLM (mit file_urls):\n';
    doc += '   - PDF analysieren\n';
    doc += '   - Strukturierte Daten extrahieren (Betrag, Datum, Lieferant, etc.)\n';
    doc += '4. Invoice Entity erstellen mit extrahierten Daten\n';
    doc += '5. Optional: Automatische Buchung generieren (GeneratedFinancialBooking)\n';
    doc += '```\n\n';
    doc += '**Abhängigkeiten**: UploadFile vor InvokeLLM\n\n';
    doc += '**Fallback**: Bei LLM-Fehler → Manuelle Eingabe erforderlich\n\n';
    
    doc += '---\n\n';
    
    doc += '## 6. Zusammenfassung: Service-Matrix\n\n';
    doc += '| Service | Zweck | Auth | Rate Limit | Kosten | Status |\n';
    doc += '|---------|-------|------|------------|--------|--------|\n';
    doc += '| LetterXpress | Postversand | API-Key | 1/sec | Pay-per-Letter | ✅ Aktiv |\n';
    doc += '| FinAPI | Multi-Banking | OAuth2 | 100/min | Abo | ✅ Aktiv |\n';
    doc += '| Base44 InvokeLLM | KI-Analyse | Built-in | - | Inkludiert | ✅ Aktiv |\n';
    doc += '| Base44 SendEmail | E-Mail | Built-in | - | Inkludiert | ✅ Aktiv |\n';
    doc += '| Base44 UploadFile | Storage | Built-in | - | Inkludiert | ✅ Aktiv |\n';
    doc += '| ELSTER | Steuer | Zertifikat | - | Zertifikat | 🚧 Geplant |\n\n';
    
    return doc;
}

async function generateDocumentGenerationDoc(base44) {
    let doc = '# Dokumenten-Generierung - Vollständige System-Dokumentation\n\n';
    doc += '**Metadaten:**\n';
    doc += `- Generiert am: ${new Date().toLocaleString('de-DE')}\n`;
    doc += '- Verwendungszweck: KI-Assistent Kontextinformation\n\n';
    doc += '---\n\n';
    
    doc += '## Architektur-Übersicht\n\n';
    doc += '```\n';
    doc += 'Template → Datenquellen-Auswahl → Textbausteine → HTML-Rendering\n';
    doc += '    ↓\n';
    doc += 'Platzhalter-Ersetzung → Puppeteer (Headless Chrome)\n';
    doc += '    ↓\n';
    doc += 'PDF-Buffer → Base44.UploadFile → Storage URL\n';
    doc += '    ↓\n';
    doc += 'Document Entity + Data Snapshot → Optional: LetterXpress Versand\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
    doc += '## 1. BETRIEBSKOSTENABRECHNUNG (Operating Cost Statement)\n\n';
    
    doc += '### 1.1 Dokument-Identifikation\n\n';
    doc += '- **Dokumentname**: Betriebskostenabrechnung / Nebenkostenabrechnung\n';
    doc += '- **Kategorie**: Abrechnung (jährlich)\n';
    doc += '- **Dateiformat**: PDF\n';
    doc += '- **Rechtlicher Status**: ✅ Rechtlich bindend (§556 BGB), Widerspruchsfrist 12 Monate\n';
    doc += '- **Behördlich anerkannt**: N/A (privates Vertragsverhältnis)\n\n';
    
    doc += '### 1.2 Trigger & Zeitpunkt\n\n';
    doc += '- **Trigger**: User-Aktion (Button "Neue Abrechnung erstellen")\n';
    doc += '- **Zeitpunkt**: Typischerweise jährlich (bis spätestens 12 Monate nach Abrechnungsende)\n';
    doc += '- **Voraussetzungen**:\n';
    doc += '  - Building existiert\n';
    doc += '  - Mindestens 1 LeaseContract im Abrechnungszeitraum\n';
    doc += '  - Abrechnungszeitraum = 12 Monate\n';
    doc += '  - Kosten erfasst (aus GeneratedFinancialBooking oder manuell)\n';
    doc += '- **Validierungen**:\n';
    doc += '  - ✅ BLOCKER: Abrechnungszeitraum exakt 12 Monate\n';
    doc += '  - ✅ BLOCKER: Mindestens 1 Kostenposition\n';
    doc += '  - ⚠️ WARNING: Keine Vorauszahlungen hinterlegt → unvollständig\n';
    doc += '  - ⚠️ WARNING: Kosten-Abweichung > 30% zum Vorjahr\n\n';
    
    doc += '### 1.3 Datenquellen (KOMPLETT)\n\n';
    doc += '**Tabelle 1: Building**\n';
    doc += '- name, address, zip_code, city (Objektdaten)\n\n';
    doc += '**Tabelle 2: Unit**\n';
    doc += '- name, flaeche (für Verteilerschlüssel)\n\n';
    doc += '**Tabelle 3: LeaseContract**\n';
    doc += '- start_date, end_date, utilities, heating (Vorauszahlungen)\n';
    doc += '- number_of_persons (für Personen-Schlüssel)\n\n';
    doc += '**Tabelle 4: Tenant**\n';
    doc += '- first_name, last_name, address (Empfänger)\n\n';
    doc += '**Tabelle 5: GeneratedFinancialBooking**\n';
    doc += '- amount, description, cost_category_id (Kosten)\n';
    doc += '- Filter: building_id, due_date im Abrechnungszeitraum\n\n';
    doc += '**Tabelle 6: CostCategory** (via BuildingTaxLibrary)\n';
    doc += '- name, allocatable (umlagefähig?)\n\n';
    doc += '**Aggregationen**:\n';
    doc += '```javascript\n';
    doc += 'gesamt_wohnflaeche = sum(Unit.flaeche) where building_id\n';
    doc += 'gesamt_personen = sum(LeaseContract.number_of_persons)\n';
    doc += 'umlegbare_kosten = sum(Booking.amount) where cost_category.allocatable = true\n';
    doc += '```\n\n';
    
    doc += '### 1.4 Template-Struktur\n\n';
    doc += '**Seite 1: Deckblatt**\n';
    doc += '- Absenderadresse (Owner-Daten)\n';
    doc += '- Empfängeradresse (Tenant)\n';
    doc += '- Betreff: "Betriebskostenabrechnung {{year}} - {{unit_name}}"\n';
    doc += '- Datum\n\n';
    doc += '**Seite 2-3: Abrechnungsübersicht**\n';
    doc += '- Abrechnungszeitraum\n';
    doc += '- Gesamtkosten-Tabelle (alle Kostenpositionen)\n';
    doc += '- Verteilerschlüssel-Erklärung\n';
    doc += '- Anteil dieser Wohnung\n\n';
    doc += '**Seite 4: Berechnung Mieteranteil**\n';
    doc += '- Tatsächliche Kosten (nach Umlageschlüssel)\n';
    doc += '- Geleistete Vorauszahlungen\n';
    doc += '- Nachzahlung/Guthaben (farblich markiert)\n';
    doc += '- Zahlungshinweis\n\n';
    doc += '**Seite 5+: Anlagen**\n';
    doc += '- Einzelbelege (optional)\n';
    doc += '- Zählerstände (optional)\n';
    doc += '- Rechtliche Hinweise\n\n';
    
    doc += '### 1.5 Template-Variablen Mapping\n\n';
    doc += '| Variable | Tabelle | Feld | Datentyp | Formatierung | Fallback | Beispiel |\n';
    doc += '|----------|---------|------|----------|--------------|----------|----------|\n';
    doc += '| {{building.name}} | Building | name | string | - | "Objekt" | "Hauptstraße 1" |\n';
    doc += '| {{building.address}} | Building | address | string | - | - | "Hauptstraße 1" |\n';
    doc += '| {{building.zip_code}} | Building | zip_code | string | - | - | "10115" |\n';
    doc += '| {{building.city}} | Building | city | string | - | - | "Berlin" |\n';
    doc += '| {{unit.name}} | Unit | name | string | - | "Wohnung" | "Whg. 1.OG links" |\n';
    doc += '| {{unit.flaeche}} | Unit | flaeche | number | 2 Dezimalen + " m²" | "0 m²" | "65,50 m²" |\n';
    doc += '| {{tenant.full_name}} | Tenant | first_name + last_name | string | - | "Mieter" | "Max Mustermann" |\n';
    doc += '| {{tenant.address}} | Tenant | address | string | - | - | "Musterstraße 5" |\n';
    doc += '| {{contract.utilities}} | LeaseContract | utilities | number | Währung "€" | "0,00 €" | "150,00 €" |\n';
    doc += '| {{contract.heating}} | LeaseContract | heating | number | Währung "€" | "0,00 €" | "80,00 €" |\n';
    doc += '| {{year}} | OperatingCostStatement | year | number | - | current_year | "2023" |\n';
    doc += '| {{period_start}} | OperatingCostStatement | period_start | date | DD.MM.YYYY | - | "01.01.2023" |\n';
    doc += '| {{period_end}} | OperatingCostStatement | period_end | date | DD.MM.YYYY | - | "31.12.2023" |\n';
    doc += '| {{total_costs}} | Aggregation | sum(items.amount) | number | Währung "€" | "0,00 €" | "4.523,80 €" |\n';
    doc += '| {{unit_share}} | Berechnung | unit.flaeche / total_area | number | Prozent "%" | "0%" | "18,50%" |\n';
    doc += '| {{unit_costs}} | Berechnung | total * unit_share | number | Währung "€" | "0,00 €" | "836,90 €" |\n';
    doc += '| {{prepayments}} | Berechnung | (utilities + heating) * 12 | number | Währung "€" | "0,00 €" | "2.760,00 €" |\n';
    doc += '| {{balance}} | Berechnung | unit_costs - prepayments | number | Währung "€" | "0,00 €" | "-1.923,10 €" |\n';
    doc += '| {{current_date}} | System | - | date | DD.MM.YYYY | - | "07.01.2024" |\n\n';
    
    doc += '### 1.6 Generierungs-Prozess\n\n';
    doc += '**Schritt 1: Daten laden**\n';
    doc += '```javascript\n';
    doc += 'const building = await Building.get(building_id);\n';
    doc += 'const units = await Unit.filter({ building_id });\n';
    doc += 'const contracts = await LeaseContract.filter({ unit_id: IN units });\n';
    doc += 'const bookings = await GeneratedFinancialBooking.filter({\n';
    doc += '  building_id,\n';
    doc += '  due_date: { $gte: period_start, $lte: period_end }\n';
    doc += '});\n';
    doc += '```\n\n';
    doc += '**Schritt 2: Berechnungen**\n';
    doc += '```javascript\n';
    doc += '// Pro Kostenposition\n';
    doc += 'for (const item of items) {\n';
    doc += '  const category = getCostCategory(item.cost_category_id);\n';
    doc += '  \n';
    doc += '  if (!category.allocatable) continue; // Nicht umlegbar\n';
    doc += '  \n';
    doc += '  // Verteilung nach Schlüssel\n';
    doc += '  if (item.distribution_key === "Fläche") {\n';
    doc += '    for (const unit of units) {\n';
    doc += '      const share = unit.flaeche / total_area;\n';
    doc += '      unit_costs[unit.id] += item.amount * share;\n';
    doc += '    }\n';
    doc += '  }\n';
    doc += '}\n';
    doc += '\n';
    doc += '// Vorauszahlungen vs. Ist-Kosten\n';
    doc += 'for (const contract of contracts) {\n';
    doc += '  const prepayments = (contract.utilities + contract.heating) * 12;\n';
    doc += '  const actual = unit_costs[contract.unit_id];\n';
    doc += '  const balance = actual - prepayments;\n';
    doc += '  // Positiv = Nachzahlung, Negativ = Guthaben\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Schritt 3: Template befüllen**\n';
    doc += '- Alle Platzhalter {{variable}} werden durch Werte ersetzt\n';
    doc += '- Tabellen werden dynamisch generiert (1 Zeile pro Kostenposition)\n';
    doc += '- Bedingte Abschnitte (z.B. "Guthaben" vs "Nachzahlung")\n\n';
    doc += '**Schritt 4: PDF generieren**\n';
    doc += '- HTML → Puppeteer → PDF-Buffer\n';
    doc += '- PDF hochladen → file_url erhalten\n\n';
    doc += '**Schritt 5: Speichern**\n';
    doc += '```javascript\n';
    doc += 'await Document.create({\n';
    doc += '  name: "NK-Abrechnung 2023 - Whg. 1",\n';
    doc += '  template_id: template.id,\n';
    doc += '  category: "Verwaltung",\n';
    doc += '  status: "erstellt",\n';
    doc += '  content: html,\n';
    doc += '  pdf_url: file_url,\n';
    doc += '  building_id: building.id,\n';
    doc += '  unit_id: unit.id,\n';
    doc += '  contract_id: contract.id,\n';
    doc += '  tenant_id: tenant.id,\n';
    doc += '  recipient_name: tenant.full_name,\n';
    doc += '  recipient_address: tenant.address,\n';
    doc += '  seitenanzahl: pages,\n';
    doc += '  data_snapshot: { /* alle verwendeten Daten */ }\n';
    doc += '});\n';
    doc += '```\n\n';
    
    doc += '### 1.7 Nach-Generierung\n\n';
    doc += '- **Automatischer Versand**: Optional (User-Entscheidung)\n';
    doc += '- **Download**: Sofort verfügbar über pdf_url\n';
    doc += '- **Archivierung**: Document bleibt permanent in DB\n';
    doc += '- **Rückschreibung**:\n';
    doc += '  - OperatingCostStatement.status = "finalized"\n';
    doc += '  - Optional: Payment-Einträge für Nachzahlungen/Guthaben erstellen\n\n';
    
    doc += '### 1.8 Aktualisierungs-Logik\n\n';
    doc += '- **Regenerierung**: ✅ Möglich\n';
    doc += '- **Bei geänderten Daten**: Warnung anzeigen, neues Dokument erstellen (nicht überschreiben)\n';
    doc += '- **Versionierung**: Jede Generierung → neue Document-Entity mit change_history\n';
    doc += '- **Verknüpfte Daten**: Bleiben unverändert (data_snapshot bewahrt Ursprungsdaten)\n\n';
    
    doc += '### 1.9 Beispiel-Dokument\n\n';
    doc += '```\n';
    doc += '┌─────────────────────────────────────────────────────┐\n';
    doc += '│  Hausverwaltung Müller GmbH                         │\n';
    doc += '│  Verwaltungsstraße 10, 10115 Berlin                 │\n';
    doc += '├─────────────────────────────────────────────────────┤\n';
    doc += '│                                                     │\n';
    doc += '│  Max Mustermann                          07.01.2024│\n';
    doc += '│  Hauptstraße 1, Whg. 1.OG links                    │\n';
    doc += '│  10115 Berlin                                       │\n';
    doc += '│                                                     │\n';
    doc += '│  BETRIEBSKOSTENABRECHNUNG 2023                     │\n';
    doc += '│  Objekt: Hauptstraße 1                             │\n';
    doc += '│  Abrechnungszeitraum: 01.01.2023 - 31.12.2023     │\n';
    doc += '│                                                     │\n';
    doc += '│  Sehr geehrter Herr Mustermann,                    │\n';
    doc += '│                                                     │\n';
    doc += '│  anbei erhalten Sie die Betriebskostenabrechnung   │\n';
    doc += '│  für oben genannte Wohnung.                        │\n';
    doc += '│                                                     │\n';
    doc += '│  GESAMTKOSTEN DES OBJEKTS:                         │\n';
    doc += '│  ┌──────────────────────┬──────────┬──────────┐    │\n';
    doc += '│  │ Kostenart            │ Betrag   │ Umlage   │    │\n';
    doc += '│  ├──────────────────────┼──────────┼──────────┤    │\n';
    doc += '│  │ Grundsteuer          │ 1.200 €  │ Fläche   │    │\n';
    doc += '│  │ Gebäudeversicherung  │   850 €  │ Fläche   │    │\n';
    doc += '│  │ Müllabfuhr           │   420 €  │ Personen │    │\n';
    doc += '│  │ Hausmeister          │ 1.200 €  │ Fläche   │    │\n';
    doc += '│  │ Gartenpflege         │   480 €  │ Fläche   │    │\n';
    doc += '│  │ Allgemeinstrom       │   373 €  │ Fläche   │    │\n';
    doc += '│  ├──────────────────────┼──────────┼──────────┤    │\n';
    doc += '│  │ SUMME UMLEGBAR       │ 4.523 €  │          │    │\n';
    doc += '│  └──────────────────────┴──────────┴──────────┘    │\n';
    doc += '│                                                     │\n';
    doc += '│  IHR ANTEIL:                                        │\n';
    doc += '│  Wohnfläche: 65,50 m² von 354 m² = 18,50%         │\n';
    doc += '│  Personen: 2 von 11 = 18,18%                       │\n';
    doc += '│                                                     │\n';
    doc += '│  Ihre Kosten (nach Umlageschlüssel): 836,90 €     │\n';
    doc += '│  Geleistete Vorauszahlungen:        2.760,00 €    │\n';
    doc += '│  ───────────────────────────────────────────────   │\n';
    doc += '│  GUTHABEN:                          1.923,10 €     │\n';
    doc += '│                                                     │\n';
    doc += '│  Das Guthaben wird mit der nächsten Miete          │\n';
    doc += '│  verrechnet.                                        │\n';
    doc += '└─────────────────────────────────────────────────────┘\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
    doc += '## 2. ANLAGE V (Vermietung & Verpachtung)\n\n';
    
    doc += '### 2.1 Dokument-Identifikation\n\n';
    doc += '- **Dokumentname**: Anlage V zur Einkommensteuererklärung\n';
    doc += '- **Kategorie**: Steuerformular (jährlich)\n';
    doc += '- **Dateiformat**: PDF\n';
    doc += '- **Rechtlicher Status**: ✅ Behördlich vorgeschrieben (Bundesfinanzministerium)\n';
    doc += '- **Behördlich anerkannt**: ✅ Ja (offizielle Formulare)\n\n';
    
    doc += '### 2.2 Trigger & Zeitpunkt\n\n';
    doc += '- **Trigger**: User-Aktion (Button "Anlage V erstellen")\n';
    doc += '- **Zeitpunkt**: Nach Jahresende, vor Steuererklärungsfrist (31.07. Folgejahr)\n';
    doc += '- **Voraussetzungen**:\n';
    doc += '  - Building mit vollständigen Stammdaten\n';
    doc += '  - BuildingTaxLibrary initialisiert\n';
    doc += '  - Mietverträge im Steuerjahr\n';
    doc += '  - Buchungen kategorisiert\n';
    doc += '- **Validierungen**:\n';
    doc += '  - ✅ BLOCKER: Building.address vollständig\n';
    doc += '  - ✅ BLOCKER: Steuerjahr gewählt\n';
    doc += '  - ⚠️ WARNING: Keine Mieteinnahmen → eventuell Liebhaberei\n';
    doc += '  - ⚠️ WARNING: Verlust > 3 Jahre → steuerliche Prüfung\n\n';
    
    doc += '### 2.3 Datenquellen (KOMPLETT)\n\n';
    doc += '**Tabelle 1: Building**\n';
    doc += '- address, zip_code, city (Zeile 4-6)\n';
    doc += '- purchase_date, land_value (für AfA-Berechnung)\n\n';
    doc += '**Tabelle 2: LeaseContract**\n';
    doc += '- total_rent, start_date, end_date (Einnahmen Zeile 9)\n\n';
    doc += '**Tabelle 3: GeneratedFinancialBooking**\n';
    doc += '- amount, cost_category_id (Werbungskosten Zeilen 16-48)\n';
    doc += '- Filter: building_id, year, cost_category.tax_treatment\n\n';
    doc += '**Tabelle 4: CostCategory** (via BuildingTaxLibrary)\n';
    doc += '- tax_treatment (SOFORT, AFA, NICHT_ABSETZBAR)\n';
    doc += '- account_number, tax_line (Zuordnung zu Anlage V Zeilen)\n\n';
    doc += '**Tabelle 5: AfASchedule**\n';
    doc += '- afa_amount (Zeile 33: AfA für Gebäude)\n';
    doc += '- Filter: building_id, year\n\n';
    doc += '**Tabelle 6: Financing**\n';
    doc += '- Zinsen (Zeile 37: Schuldzinsen)\n\n';
    doc += '**Aggregationen**:\n';
    doc += '```javascript\n';
    doc += '// Einnahmen (Zeile 9)\n';
    doc += 'einnahmen = sum(\n';
    doc += '  LeaseContract.total_rent * months_in_year\n';
    doc += ') WHERE building_id AND year\n';
    doc += '\n';
    doc += '// Werbungskosten gesamt\n';
    doc += 'werbungskosten = sum(\n';
    doc += '  GeneratedFinancialBooking.amount\n';
    doc += ') WHERE cost_category.tax_treatment = "SOFORT"\n';
    doc += '\n';
    doc += '// AfA\n';
    doc += 'afa_betrag = AfASchedule.afa_amount WHERE year\n';
    doc += '\n';
    doc += '// Überschuss/Verlust (Zeile 49)\n';
    doc += 'ergebnis = einnahmen - werbungskosten - afa_betrag\n';
    doc += '```\n\n';
    
    doc += '### 2.4 Template-Struktur (Anlage V 2023)\n\n';
    doc += '**Seite 1: Objekt-Angaben**\n';
    doc += '- Zeile 4: Straße, Hausnummer\n';
    doc += '- Zeile 5: PLZ, Ort\n';
    doc += '- Zeile 6: Art des Objekts (Wohnung, Haus, etc.)\n';
    doc += '- Zeile 7: Eigentumsanteil\n\n';
    doc += '**Seite 2: Einnahmen**\n';
    doc += '- Zeile 9: Einnahmen aus Vermietung\n';
    doc += '- Zeile 10-11: Sonstige Einnahmen (Umlagen, etc.)\n\n';
    doc += '**Seite 3-4: Werbungskosten**\n';
    doc += '- Zeile 16: AfA (Gebäude)\n';
    doc += '- Zeile 17-32: Diverse Kostenarten\n';
    doc += '- Zeile 33: Grundsteuer\n';
    doc += '- Zeile 34: Versicherungen\n';
    doc += '- Zeile 35: Geldbeschaffungskosten\n';
    doc += '- Zeile 36: Erhaltungsaufwendungen\n';
    doc += '- Zeile 37: Schuldzinsen\n';
    doc += '- Zeile 38-48: Weitere Kosten\n\n';
    doc += '**Seite 5: Ergebnis**\n';
    doc += '- Zeile 49: Summe Werbungskosten\n';
    doc += '- Zeile 50: Überschuss/Verlust\n\n';
    
    doc += '### 2.5 Zeilen-Mapping (Anlage V → App)\n\n';
    doc += '| Zeile | Bezeichnung | Berechnung | Quelle |\n';
    doc += '|-------|-------------|------------|--------|\n';
    doc += '| 4-6 | Objektadresse | building.address | Building |\n';
    doc += '| 9 | Einnahmen | sum(contract.total_rent * monate) | LeaseContract |\n';
    doc += '| 16 | AfA Gebäude | AfASchedule.afa_amount | AfASchedule |\n';
    doc += '| 33 | Grundsteuer | sum(bookings) WHERE category="Grundsteuer" | GeneratedFinancialBooking |\n';
    doc += '| 34 | Versicherungen | sum(bookings) WHERE category="Versicherung" | GeneratedFinancialBooking |\n';
    doc += '| 36 | Erhaltungsaufwendungen | sum(invoices) WHERE tax_treatment="SOFORT" | Invoice |\n';
    doc += '| 37 | Schuldzinsen | sum(financing.monthly_rate * 12) - tilgung | Financing |\n';
    doc += '| 49 | Summe Werbungskosten | sum(Zeilen 16-48) | Aggregation |\n';
    doc += '| 50 | Überschuss/Verlust | Zeile 9 - Zeile 49 | Berechnung |\n\n';
    
    doc += '### 2.6 Besondere Logiken\n\n';
    doc += '**15%-Regel (Erhaltung vs. Herstellung)**:\n';
    doc += '```javascript\n';
    doc += '// Automatische Prüfung\n';
    doc += 'const erhaltung_3_jahre = sum(invoices WHERE tax_treatment="SOFORT" AND last_3_years);\n';
    doc += 'const gebaeude_wert = purchase_price - land_value;\n';
    doc += '\n';
    doc += 'if (erhaltung_3_jahre > gebaeude_wert * 0.15) {\n';
    doc += '  // ⚠️ WARNING: "15%-Grenze überschritten!"\n';
    doc += '  // → Kosten müssen als Herstellungskosten (AfA) behandelt werden\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Anteilige Vermietung** (nicht ganzjährig):\n';
    doc += '```javascript\n';
    doc += '// Mietvertrag läuft nur 8 Monate im Jahr\n';
    doc += 'const monate = calculateMonthsInYear(contract, year);\n';
    doc += 'einnahmen = contract.total_rent * monate; // z.B. 800€ * 8 = 6.400€\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
    doc += '## 3. MIETERHÖHUNG (Rent Increase Letter)\n\n';
    
    doc += '### 3.1 Dokument-Identifikation\n\n';
    doc += '- **Dokumentname**: Mieterhöhungsschreiben\n';
    doc += '- **Kategorie**: Mietrecht (rechtlich bindend)\n';
    doc += '- **Dateiformat**: PDF\n';
    doc += '- **Rechtlicher Status**: ✅ Rechtlich bindend (§558 BGB)\n';
    doc += '- **Besonderheit**: Formvorschriften (Schriftform, Begründung, Fristen)\n\n';
    
    doc += '### 3.2 Trigger & Zeitpunkt\n\n';
    doc += '- **Trigger**: User-Aktion (Dokument-Wizard mit Template "Mieterhöhung")\n';
    doc += '- **Zeitpunkt**: Bei beabsichtigter Mieterhöhung (gesetzliche Fristen beachten)\n';
    doc += '- **Voraussetzungen**:\n';
    doc += '  - LeaseContract existiert und aktiv\n';
    doc += '  - Letzte Erhöhung > 12 Monate her (gesetzliche Sperrfrist)\n';
    doc += '- **Validierungen**:\n';
    doc += '  - ✅ BLOCKER: Erhöhung maximal bis Mietspiegel-Obergrenze\n';
    doc += '  - ✅ BLOCKER: Erhöhung maximal 20% in 3 Jahren (Mietpreisbremse)\n';
    doc += '  - ⚠️ WARNING: Begründung erforderlich bei > 10% Erhöhung\n\n';
    
    doc += '### 3.3 Datenquellen\n\n';
    doc += '**Tabellen**: LeaseContract, Tenant, Unit, Building\n\n';
    doc += '**Felder**:\n';
    doc += '- contract.base_rent (alt), new_base_rent (neu berechnet)\n';
    doc += '- tenant.first_name, last_name (Empfänger)\n';
    doc += '- unit.name (Wohnung)\n';
    doc += '- building.address (Objektadresse)\n\n';
    doc += '**Berechnungen**:\n';
    doc += '```javascript\n';
    doc += 'erhoehung_betrag = new_base_rent - contract.base_rent;\n';
    doc += 'erhoehung_prozent = (erhoehung_betrag / contract.base_rent) * 100;\n';
    doc += 'effective_date = add_months(today, 3); // Ankündigungsfrist 3 Monate\n';
    doc += '```\n\n';
    
    doc += '### 3.4 Template-Variablen\n\n';
    doc += '| Variable | Quelle | Formatierung | Beispiel |\n';
    doc += '|----------|--------|--------------|----------|\n';
    doc += '| {{tenant.full_name}} | Tenant | - | "Max Mustermann" |\n';
    doc += '| {{unit.name}} | Unit | - | "Whg. 1.OG links" |\n';
    doc += '| {{contract.base_rent}} | LeaseContract | €-Format | "750,00 €" |\n';
    doc += '| {{new_base_rent}} | User-Input | €-Format | "825,00 €" |\n';
    doc += '| {{increase_amount}} | Berechnung | €-Format | "75,00 €" |\n';
    doc += '| {{increase_percent}} | Berechnung | %-Format (1 Dez.) | "10,0%" |\n';
    doc += '| {{effective_date}} | Berechnung | DD.MM.YYYY | "01.04.2024" |\n';
    doc += '| {{current_date}} | System | DD.MM.YYYY | "07.01.2024" |\n\n';
    
    doc += '### 3.5 Nach-Generierung\n\n';
    doc += '- **Versand**: Einschreiben (R1 oder R2) via LetterXpress (Beweispflicht!)\n';
    doc += '- **Rückschreibung**:\n';
    doc += '  - RentChange Entity erstellen (Historisierung)\n';
    doc += '  - LeaseContract versionieren (neue Version mit new_base_rent)\n';
    doc += '  - Task erstellen: "Mieterreaktion abwarten" (Frist 2 Monate)\n\n';
    
    doc += '---\n\n';
    
    doc += '## 4. MIETVERTRAG (Lease Contract)\n\n';
    
    doc += '### 4.1 Dokument-Identifikation\n\n';
    doc += '- **Dokumentname**: Mietvertrag (Wohnraum)\n';
    doc += '- **Kategorie**: Vertrag (rechtlich bindend)\n';
    doc += '- **Dateiformat**: PDF\n';
    doc += '- **Rechtlicher Status**: ✅ Rechtlich bindend (BGB)\n';
    doc += '- **Besonderheit**: Unterschriften erforderlich (Vermieter + Mieter)\n\n';
    
    doc += '### 4.2 Datenquellen\n\n';
    doc += '**Tabellen**: Building, Unit, Tenant, Owner, TextBlock\n\n';
    doc += '**Pflicht-Angaben (rechtlich vorgeschrieben)**:\n';
    doc += '- Vermieter (Name, Adresse)\n';
    doc += '- Mieter (Name, Adresse)\n';
    doc += '- Mietobjekt (Adresse, Wohnung)\n';
    doc += '- Miete (Kaltmiete, Nebenkosten, Heizung separat)\n';
    doc += '- Kaution\n';
    doc += '- Mietbeginn\n';
    doc += '- Kündigungsfrist\n\n';
    
    doc += '### 4.3 Bedingte Abschnitte\n\n';
    doc += '```javascript\n';
    doc += '// Im Template\n';
    doc += '{{#if contract.is_unlimited}}\n';
    doc += '  "Der Mietvertrag ist unbefristet."\n';
    doc += '{{else}}\n';
    doc += '  "Der Mietvertrag endet am {{contract.end_date}}."\n';
    doc += '{{/if}}\n';
    doc += '\n';
    doc += '{{#if contract.deposit > 0}}\n';
    doc += '  "Die Kaution beträgt {{contract.deposit}} und ist in {{contract.deposit_installments}} Raten zu zahlen."\n';
    doc += '{{/if}}\n';
    doc += '```\n\n';
    
    doc += '### 4.4 Textbausteine\n\n';
    doc += 'User kann aus vorgefertigten Klauseln wählen:\n';
    doc += '- Schönheitsreparaturen (verschiedene Modelle)\n';
    doc += '- Tierhaltung (erlaubt/verboten/mit Zustimmung)\n';
    doc += '- Untervermietung (Regelungen)\n';
    doc += '- Kündigung (ordentlich/außerordentlich)\n\n';
    
    doc += '---\n\n';
    
    doc += '## 5. ÜBERGABEPROTOKOLL\n\n';
    
    doc += '### 5.1 Dokument-Identifikation\n\n';
    doc += '- **Dokumentname**: Wohnungsübergabeprotokoll\n';
    doc += '- **Kategorie**: Protokoll\n';
    doc += '- **Dateiformat**: PDF\n';
    doc += '- **Rechtlicher Status**: ✅ Beweismittel bei Streitigkeiten\n\n';
    doc += '### 5.2 Template-Struktur\n\n';
    doc += '- Checkboxen für Raum-Status (Küche, Bad, Wohnzimmer, etc.)\n';
    doc += '- Zählerstände (Strom, Gas, Wasser)\n';
    doc += '- Schlüsselübergabe (Anzahl)\n';
    doc += '- Mängel-Liste (Freitext)\n';
    doc += '- Unterschriften (Vermieter, Mieter, Zeugen)\n\n';
    
    doc += '---\n\n';
    
    doc += '## 6. PDF-GENERIERUNG (Technisches Detail)\n\n';
    
    doc += '### 6.1 Backend-Funktion: generatePDF\n\n';
    doc += '**Input**:\n';
    doc += '```javascript\n';
    doc += '{\n';
    doc += '  html: "<html>...</html>",\n';
    doc += '  fileName: "dokument.pdf",\n';
    doc += '  format: "A4", // optional\n';
    doc += '  margins: { top: "20mm", bottom: "20mm", left: "20mm", right: "20mm" } // optional\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Prozess**:\n';
    doc += '```javascript\n';
    doc += '// 1. Puppeteer starten\n';
    doc += 'const browser = await puppeteer.launch({\n';
    doc += '  headless: true,\n';
    doc += '  args: ["--no-sandbox", "--disable-setuid-sandbox"]\n';
    doc += '});\n';
    doc += '\n';
    doc += '// 2. HTML rendern\n';
    doc += 'const page = await browser.newPage();\n';
    doc += 'await page.setContent(html, { waitUntil: "networkidle0" });\n';
    doc += '\n';
    doc += '// 3. PDF generieren\n';
    doc += 'const pdfBuffer = await page.pdf({\n';
    doc += '  format: "A4",\n';
    doc += '  margin: { top: "20mm", bottom: "20mm", left: "20mm", right: "20mm" },\n';
    doc += '  printBackground: true,\n';
    doc += '  displayHeaderFooter: true,\n';
    doc += '  headerTemplate: "<div></div>",\n';
    doc += '  footerTemplate: `<div style="font-size:10px; text-align:center; width:100%;">\n';
    doc += '    Seite <span class="pageNumber"></span> von <span class="totalPages"></span>\n';
    doc += '  </div>`\n';
    doc += '});\n';
    doc += '\n';
    doc += '// 4. Metadaten extrahieren\n';
    doc += 'const pdfDoc = await PDFDocument.load(pdfBuffer);\n';
    doc += 'const pages = pdfDoc.getPageCount();\n';
    doc += '\n';
    doc += '// 5. Upload zu Storage\n';
    doc += 'const file = new File([pdfBuffer], fileName, { type: "application/pdf" });\n';
    doc += 'const { file_url } = await base44.integrations.Core.UploadFile({ file });\n';
    doc += '\n';
    doc += '// 6. Return\n';
    doc += 'return { file_url, fileName, pages };\n';
    doc += '```\n\n';
    doc += '**Performance**: ~2-5 Sekunden (abhängig von Seitenzahl und Komplexität)\n\n';
    
    doc += '### 6.2 HTML-Template-Engine\n\n';
    doc += '**Platzhalter-Ersetzung**:\n';
    doc += '```javascript\n';
    doc += 'let html = template.content;\n';
    doc += '\n';
    doc += '// Einfache Platzhalter\n';
    doc += 'html = html.replace(/{{building\\.name}}/g, building.name);\n';
    doc += 'html = html.replace(/{{tenant\\.full_name}}/g, tenant.first_name + " " + tenant.last_name);\n';
    doc += '\n';
    doc += '// Formatierte Werte\n';
    doc += 'html = html.replace(/{{contract\\.base_rent}}/g, formatCurrency(contract.base_rent));\n';
    doc += 'html = html.replace(/{{current_date}}/g, formatDate(new Date(), "DD.MM.YYYY"));\n';
    doc += '\n';
    doc += '// Textbausteine\n';
    doc += 'for (const blockId of selected_text_blocks) {\n';
    doc += '  const block = await TextBlock.get(blockId);\n';
    doc += '  html = html.replace(`{{textblock:${blockId}}}`, block.content);\n';
    doc += '}\n';
    doc += '\n';
    doc += '// Schleifen (Tabellen)\n';
    doc += 'let tableRows = "";\n';
    doc += 'for (const item of cost_items) {\n';
    doc += '  tableRows += `<tr>\n';
    doc += '    <td>${item.description}</td>\n';
    doc += '    <td>${formatCurrency(item.amount)}</td>\n';
    doc += '  </tr>`;\n';
    doc += '}\n';
    doc += 'html = html.replace("{{cost_items_table}}", tableRows);\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
    doc += '## 7. DOCUMENT-WIZARD (User-Workflow)\n\n';
    
    doc += '### Step 1: Template-Auswahl\n\n';
    doc += '**UI**: Karten-Grid mit Template-Kategorien\n\n';
    doc += '**Daten**: Template.list() gefiltert nach category\n\n';
    doc += '**User wählt**: Template (z.B. "Mieterhöhung")\n\n';
    doc += '**System lädt**: template.required_data_sources\n\n';
    
    doc += '### Step 2: Datenquellen verknüpfen\n\n';
    doc += '**UI**: Dropdown-Felder für jede erforderliche Quelle\n\n';
    doc += '**Beispiel für Mieterhöhung**:\n';
    doc += '- Gebäude auswählen (Building)\n';
    doc += '- Wohneinheit auswählen (Unit, gefiltert nach building_id)\n';
    doc += '- Mietvertrag auswählen (LeaseContract, gefiltert nach unit_id)\n';
    doc += '- Mieter wird automatisch geladen (tenant_id aus contract)\n\n';
    doc += '**Auto-Fill**:\n';
    doc += '```javascript\n';
    doc += '// Empfängeradresse automatisch befüllen\n';
    doc += 'if (contract && tenant) {\n';
    doc += '  recipient_name = `${tenant.first_name} ${tenant.last_name}`;\n';
    doc += '  recipient_address = `${unit.name}\\n${building.address}\\n${building.zip_code} ${building.city}`;\n';
    doc += '}\n';
    doc += '```\n\n';
    
    doc += '### Step 3: Textbausteine hinzufügen\n\n';
    doc += '**UI**: Checkbox-Liste verfügbarer TextBlocks\n\n';
    doc += '**Filter**: TextBlock.category = template.category\n\n';
    doc += '**User wählt**: Relevante Bausteine (z.B. "Kündigungsfristen", "Zahlungshinweis")\n\n';
    
    doc += '### Step 4: Preview & Erstellen\n\n';
    doc += '**Vorschau**: HTML-Rendering im Browser (wie PDF aussehen wird)\n\n';
    doc += '**User bestätigt**: Klick auf "Dokument erstellen"\n\n';
    doc += '**Generierung**:\n';
    doc += '1. Document Entity erstellen (status="erstellt")\n';
    doc += '2. HTML finalisieren (Platzhalter ersetzen)\n';
    doc += '3. PDF generieren via generatePDF-Funktion\n';
    doc += '4. Document.update: pdf_url, seitenanzahl speichern\n';
    doc += '5. Data Snapshot speichern (alle verwendeten Daten für Reproduzierbarkeit)\n\n';
    
    doc += '---\n\n';
    
    doc += '## 8. VERSAND-INTEGRATION\n\n';
    
    doc += '### 8.1 LetterXpress Post-Versand\n\n';
    doc += '**Workflow nach PDF-Generierung**:\n';
    doc += '```\n';
    doc += '1. User klickt "Per Post versenden" auf Dokument\n';
    doc += '2. SendLetterDialog öffnet sich\n';
    doc += '3. User wählt:\n';
    doc += '   - Versandart (Normal / R1 / R2)\n';
    doc += '   - Farbdruck (Ja/Nein)\n';
    doc += '   - Duplex (Ja/Nein)\n';
    doc += '4. System berechnet Kosten (calculatePrice API-Call)\n';
    doc += '5. User bestätigt\n';
    doc += '6. PDF wird von Storage heruntergeladen\n';
    doc += '7. PDF wird base64-encoded\n';
    doc += '8. MD5-Checksum berechnet (SHA256, 32 chars)\n';
    doc += '9. LetterXpress.send_letter API-Call\n';
    doc += '10. LetterShipment Entity erstellt:\n';
    doc += '    - lxp_job_id\n';
    doc += '    - document_id\n';
    doc += '    - status="queue"\n';
    doc += '    - cost_net, cost_gross\n';
    doc += '11. Document.update:\n';
    doc += '    - versandstatus="in_versand"\n';
    doc += '    - lxp_job_id gespeichert\n';
    doc += '12. Scheduled Task (täglich):\n';
    doc += '    - LetterXpress.get_job(job_id)\n';
    doc += '    - tracking_code aktualisieren\n';
    doc += '    - status aktualisieren (queue→done→sent)\n';
    doc += '13. Bei status="sent":\n';
    doc += '    - Document.versandstatus="versendet"\n';
    doc += '    - Document.versandt_am=now()\n';
    doc += '```\n\n';
    
    doc += '### 8.2 Fehler-Szenarien\n\n';
    doc += '**PDF ungültig (400)**:\n';
    doc += '- User-Meldung: "PDF-Format ungültig - bitte neu generieren"\n';
    doc += '- Rollback: LetterShipment wird nicht erstellt\n\n';
    doc += '**Kein Guthaben (403)**:\n';
    doc += '- User-Meldung: "Guthaben aufladen - aktuell {{balance}} €"\n';
    doc += '- Fallback: Dokument bleibt "erstellt", kann später versendet werden\n\n';
    doc += '**Rate Limit (429)**:\n';
    doc += '- Automatischer Retry nach 60 Sekunden\n';
    doc += '- User-Info: "Versand pausiert - wird automatisch fortgesetzt"\n\n';
    
    doc += '---\n\n';
    
    doc += '## 9. DATA SNAPSHOT & REPRODUZIERBARKEIT\n\n';
    
    doc += '### 9.1 Zweck\n\n';
    doc += 'Dokumente müssen später exakt reproduzierbar sein, auch wenn sich Stammdaten ändern.\n\n';
    doc += '### 9.2 Was wird gespeichert?\n\n';
    doc += '```javascript\n';
    doc += 'data_snapshot = {\n';
    doc += '  building: { name, address, zip_code, city },\n';
    doc += '  unit: { name, flaeche },\n';
    doc += '  tenant: { first_name, last_name, address },\n';
    doc += '  contract: { base_rent, utilities, heating, start_date, end_date },\n';
    doc += '  selected_text_blocks: [ /* TextBlock IDs */ ],\n';
    doc += '  generation_date: "2024-01-07T15:30:00Z",\n';
    doc += '  generated_by: "user@example.com"\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += 'Wird in Document.data_snapshot (JSON) gespeichert.\n\n';
    
    doc += '---\n\n';
    
    doc += '## 10. PERFORMANCE & OPTIMIERUNG\n\n';
    
    doc += '### 10.1 Generierungs-Dauer\n\n';
    doc += '| Dokumenttyp | Seiten | Datenquellen | Durchschnitt |\n';
    doc += '|-------------|--------|--------------|-------------|\n';
    doc += '| Mietvertrag | 8-12 | 4 Tabellen | ~3-4 Sek |\n';
    doc += '| Mieterhöhung | 2-3 | 4 Tabellen | ~2 Sek |\n';
    doc += '| Betriebskosten | 5-8 | 6+ Tabellen | ~4-6 Sek |\n';
    doc += '| Anlage V | 4-5 | 8+ Tabellen | ~5-8 Sek |\n';
    doc += '| Übergabeprotokoll | 3-4 | 3 Tabellen | ~2-3 Sek |\n\n';
    
    doc += '**Bottlenecks**:\n';
    doc += '- Puppeteer-Launch: ~1-2 Sekunden\n';
    doc += '- HTML-Rendering: ~0,5-1 Sekunde\n';
    doc += '- PDF-Upload: ~0,5 Sekunde\n\n';
    
    doc += '### 10.2 Caching\n\n';
    doc += '- Templates werden im Frontend gecacht (React Query)\n';
    doc += '- Textbausteine werden gecacht\n';
    doc += '- Puppeteer-Browser kann warm gehalten werden (Produktiv-Optimierung)\n\n';
    
    doc += '---\n\n';
    
    doc += '## 11. MULTI-DOKUMENT-GENERIERUNG\n\n';
    
    doc += '### 11.1 Betriebskosten für alle Mieter\n\n';
    doc += '**Trigger**: Button "Abrechnungen für alle Mieter erstellen"\n\n';
    doc += '**Prozess**:\n';
    doc += '```javascript\n';
    doc += 'const contracts = await LeaseContract.filter({ building_id, status: "active" });\n';
    doc += '\n';
    doc += 'for (const contract of contracts) {\n';
    doc += '  // Pro Mieter:\n';
    doc += '  const tenant = await Tenant.get(contract.tenant_id);\n';
    doc += '  const unit = await Unit.get(contract.unit_id);\n';
    doc += '  \n';
    doc += '  // Kosten berechnen\n';
    doc += '  const unit_costs = calculateCostsForUnit(unit, contract, all_costs);\n';
    doc += '  \n';
    doc += '  // Dokument generieren\n';
    doc += '  const html = fillTemplate(template, { building, unit, tenant, contract, costs: unit_costs });\n';
    doc += '  const { file_url, pages } = await generatePDF({ html, fileName: `NK-${tenant.last_name}-${year}.pdf` });\n';
    doc += '  \n';
    doc += '  // Speichern\n';
    doc += '  await Document.create({ /* ... */ });\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Performance**: ~3-5 Sekunden pro Mieter (bei 10 Mietern: ~30-50 Sekunden)\n\n';
    
    doc += '---\n\n';
    
    doc += '## 12. TEMPLATE-SYSTEM (Details)\n\n';
    
    doc += '### 12.1 Template Entity\n\n';
    doc += '**Struktur**:\n';
    doc += '```javascript\n';
    doc += '{\n';
    doc += '  name: "Mieterhöhung",\n';
    doc += '  category: "Mietrecht",\n';
    doc += '  header_html: "<div class=\\"header\\">...</div>",\n';
    doc += '  content: "<div class=\\"main\\">{{content}}</div>",\n';
    doc += '  footer_html: "<div class=\\"footer\\">...</div>",\n';
    doc += '  required_data_sources: ["building", "unit", "tenant", "contract"],\n';
    doc += '  available_text_blocks: ["tb_kuendigung", "tb_zahlung"],\n';
    doc += '  page_format: "A4",\n';
    doc += '  margins: { top: "20mm", bottom: "20mm", left: "20mm", right: "20mm" },\n';
    doc += '  logo_url: "https://...",\n';
    doc += '  styles: {\n';
    doc += '    font_family: "Arial, sans-serif",\n';
    doc += '    font_size: "11pt",\n';
    doc += '    primary_color: "#000000",\n';
    doc += '    secondary_color: "#666666"\n';
    doc += '  },\n';
    doc += '  tables: [\n';
    doc += '    {\n';
    doc += '      id: "cost_breakdown",\n';
    doc += '      title: "Kostenübersicht",\n';
    doc += '      data_source: "cost_items",\n';
    doc += '      columns: [\n';
    doc += '        { field: "description", label: "Kostenart", width: "60%" },\n';
    doc += '        { field: "amount", label: "Betrag", width: "40%" }\n';
    doc += '      ]\n';
    doc += '    }\n';
    doc += '  ]\n';
    doc += '}\n';
    doc += '```\n\n';
    
    doc += '### 12.2 System-Templates (nicht löschbar)\n\n';
    doc += '- `is_system_template = true`\n';
    doc += '- Werden beim App-Start initialisiert (seedInitialData)\n';
    doc += '- User kann sie duplizieren und anpassen\n\n';
    
    doc += '---\n\n';
    
    doc += '## 13. RECHTLICHE ANFORDERUNGEN\n\n';
    
    doc += '### 13.1 Pflichtangaben nach Dokumenttyp\n\n';
    doc += '**Mietvertrag (BGB)**:\n';
    doc += '- ✅ Vermieter-Identität (Name, Adresse)\n';
    doc += '- ✅ Mieter-Identität\n';
    doc += '- ✅ Mietobjekt (genaue Bezeichnung)\n';
    doc += '- ✅ Miete (Kalt + Neben getrennt ausgewiesen)\n';
    doc += '- ✅ Mietbeginn\n';
    doc += '- ✅ Kündigungsfrist\n\n';
    doc += '**Betriebskostenabrechnung (§556 BGB)**:\n';
    doc += '- ✅ Abrechnungszeitraum (12 Monate)\n';
    doc += '- ✅ Gesamtkosten und Verteilerschlüssel\n';
    doc += '- ✅ Anteil des Mieters\n';
    doc += '- ✅ Geleistete Vorauszahlungen\n';
    doc += '- ✅ Nachzahlung/Guthaben\n';
    doc += '- ✅ Frist für Widerspruch (12 Monate)\n\n';
    doc += '**Mieterhöhung (§558 BGB)**:\n';
    doc += '- ✅ Schriftform (PDF = ausreichend)\n';
    doc += '- ✅ Begründung (Mietspiegel, Vergleichswohnungen, etc.)\n';
    doc += '- ✅ Neue Miete und Erhöhungsbetrag\n';
    doc += '- ✅ Frist (Erhöhung frühestens nach 3 Monaten wirksam)\n\n';
    
    doc += '### 13.2 Unterschrifts-Felder\n\n';
    doc += '**In Templates**:\n';
    doc += '```html\n';
    doc += '<div class="signature-section">\n';
    doc += '  <div class="signature-block">\n';
    doc += '    <p>Ort, Datum</p>\n';
    doc += '    <div class="signature-line">_______________________</div>\n';
    doc += '    <p>Unterschrift Vermieter</p>\n';
    doc += '  </div>\n';
    doc += '  <div class="signature-block">\n';
    doc += '    <p>Ort, Datum</p>\n';
    doc += '    <div class="signature-line">_______________________</div>\n';
    doc += '    <p>Unterschrift Mieter</p>\n';
    doc += '  </div>\n';
    doc += '</div>\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    doc += '## 14. EDGE CASES & FEHLERBEHANDLUNG\n\n';
    
    doc += '### 14.1 Fehlende Daten\n\n';
    doc += '**Szenario**: Tenant.address ist leer\n\n';
    doc += '**Reaktion**:\n';
    doc += '- ✅ BLOCKER vor Generierung: "Empfängeradresse fehlt"\n';
    doc += '- User muss Tenant-Daten vervollständigen\n\n';
    doc += '**Szenario**: Keine Kosten in Betriebskosten-Abrechnung\n\n';
    doc += '**Reaktion**:\n';
    doc += '- ⚠️ WARNING: "Keine Kosten erfasst - Abrechnung unvollständig"\n';
    doc += '- Generierung möglich, aber sinnlos\n\n';
    
    doc += '### 14.2 Puppeteer-Fehler\n\n';
    doc += '**Timeout (> 30s)**:\n';
    doc += '- Retry 1x\n';
    doc += '- Bei erneutem Fehler: "PDF-Generierung fehlgeschlagen - Support kontaktieren"\n\n';
    doc += '**Out of Memory**:\n';
    doc += '- Bei sehr großen Dokumenten (> 50 Seiten)\n';
    doc += '- Fallback: Dokument in Teile splitten\n\n';
    
    doc += '### 14.3 Datenänderungen nach Generierung\n\n';
    doc += '**Szenario**: Betriebskosten-Abrechnung erstellt, dann ändern sich Kosten\n\n';
    doc += '**Verhalten**:\n';
    doc += '- Bereits erstelltes Dokument bleibt unverändert (data_snapshot!)\n';
    doc += '- User erhält Hinweis: "⚠️ Quelldaten haben sich geändert"\n';
    doc += '- Option: "Dokument neu generieren" (erstellt neue Version)\n';
    doc += '- Change History dokumentiert: "Neu generiert wegen Kostenänderung"\n\n';
    
    doc += '---\n\n';
    
    doc += '## 15. ZUSAMMENFASSUNG: DOKUMENTTYPEN-MATRIX\n\n';
    doc += '| Dokumenttyp | Trigger | Datenquellen | Seiten | Rechtsstatus | Versand |\n';
    doc += '|-------------|---------|--------------|--------|--------------|--------|\n';
    doc += '| Mietvertrag | Manuell | 4 Tabellen | 8-12 | ✅ Bindend | Post (Einschreiben) |\n';
    doc += '| Mieterhöhung | Manuell | 4 Tabellen | 2-3 | ✅ Bindend | Post (Einschreiben) |\n';
    doc += '| Betriebskosten | Jährlich | 6+ Tabellen | 5-8 | ✅ Bindend | Post (Normal) |\n';
    doc += '| Kündigung | Manuell | 4 Tabellen | 2 | ✅ Bindend | Post (Einschreiben) |\n';
    doc += '| Übergabeprotokoll | Bei Ein-/Auszug | 4 Tabellen | 3-4 | ✅ Beweismittel | - |\n';
    doc += '| Zahlungserinnerung | Manuell | 3 Tabellen | 1-2 | ℹ️ Hinweis | Post (Normal) |\n';
    doc += '| Anlage V | Jährlich | 8+ Tabellen | 4-5 | ✅ Behörde | - (Download) |\n\n';
    
    doc += '---\n\n';
    
    doc += '## 16. WORKFLOW-DIAGRAMM (Gesamtprozess)\n\n';
    doc += '```\n';
    doc += 'START: User klickt "Neues Dokument"\n';
    doc += '  ↓\n';
    doc += '[STEP 1] Template wählen\n';
    doc += '  ↓\n';
    doc += '[STEP 2] Datenquellen verknüpfen (Building, Unit, Tenant, Contract)\n';
    doc += '  ↓\n';
    doc += 'System lädt alle benötigten Daten aus DB\n';
    doc += '  ↓\n';
    doc += '[STEP 3] Textbausteine auswählen (optional)\n';
    doc += '  ↓\n';
    doc += '[STEP 4] Preview anzeigen (HTML-Rendering)\n';
    doc += '  ↓\n';
    doc += 'User bestätigt\n';
    doc += '  ↓\n';
    doc += '[BACKEND] Document Entity erstellen (status="generating")\n';
    doc += '  ↓\n';
    doc += '[BACKEND] Platzhalter ersetzen → finales HTML\n';
    doc += '  ↓\n';
    doc += '[BACKEND] Puppeteer → PDF-Buffer generieren\n';
    doc += '  ↓\n';
    doc += '[BACKEND] PDF-Buffer → Base44.UploadFile → file_url\n';
    doc += '  ↓\n';
    doc += '[BACKEND] Document.update: pdf_url, seitenanzahl, status="erstellt"\n';
    doc += '  ↓\n';
    doc += '[BACKEND] Data Snapshot speichern\n';
    doc += '  ↓\n';
    doc += '[FRONTEND] Success-Meldung + Dokument in Liste anzeigen\n';
    doc += '  ↓\n';
    doc += '[OPTIONAL] User klickt "Per Post versenden"\n';
    doc += '  ↓\n';
    doc += '[BACKEND] LetterXpress.send_letter\n';
    doc += '  ↓\n';
    doc += '[BACKEND] LetterShipment erstellen\n';
    doc += '  ↓\n';
    doc += '[SCHEDULED TASK] Täglich: Tracking-Codes updaten\n';
    doc += '  ↓\n';
    doc += 'END: Dokument versendet, Tracking verfügbar\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
    doc += '## 17. ABHÄNGIGKEITEN ZWISCHEN DOKUMENTEN\n\n';
    
    doc += '### 17.1 Betriebskosten → Anlage V\n\n';
    doc += '- Betriebskosten-Abrechnung generiert Nachzahlungen\n';
    doc += '- Nachzahlungen werden als Einnahmen in Anlage V erfasst (Folgejahr)\n\n';
    doc += '### 17.2 Kaufvertrag → AfA-Plan → Anlage V\n';
    doc += '- PurchaseContract → AfASchedule generieren\n';
    doc += '- AfASchedule → Anlage V Zeile 16 (jährlich)\n\n';
    
    doc += '---\n\n';
    
    doc += '## 18. VOLLSTÄNDIGES BEISPIEL: MIETERHÖHUNG\n\n';
    doc += '### 18.1 Ausgangsdaten\n\n';
    doc += '```javascript\n';
    doc += 'building = { name: "Hauptstraße 1", address: "Hauptstraße 1", zip_code: "10115", city: "Berlin" }\n';
    doc += 'unit = { name: "Whg. 1.OG links", flaeche: 65.5 }\n';
    doc += 'tenant = { first_name: "Max", last_name: "Mustermann", address: "Musterstraße 5, 12345 Musterstadt" }\n';
    doc += 'contract = { base_rent: 750, utilities: 150, heating: 80, total_rent: 980, start_date: "2020-01-01" }\n';
    doc += '```\n\n';
    doc += '### 18.2 User-Input\n\n';
    doc += '```javascript\n';
    doc += 'new_base_rent = 825 // User gibt neue Miete ein\n';
    doc += 'effective_date = "2024-04-01" // Frühestens 3 Monate nach Zustellung\n';
    doc += 'reason = "Mietspiegel Berlin 2023" // Begründung\n';
    doc += '```\n\n';
    doc += '### 18.3 Berechnungen\n\n';
    doc += '```javascript\n';
    doc += 'increase = 825 - 750 = 75 €\n';
    doc += 'increase_percent = (75 / 750) * 100 = 10,0%\n';
    doc += 'new_total_rent = 825 + 150 + 80 = 1.055 €\n';
    doc += '```\n\n';
    doc += '### 18.4 Generiertes Dokument (Auszug)\n\n';
    doc += '```\n';
    doc += 'Betreff: Mieterhöhung gemäß §558 BGB\n';
    doc += '\n';
    doc += 'Sehr geehrter Herr Mustermann,\n';
    doc += '\n';
    doc += 'hiermit erhöhe ich die monatliche Nettokaltmiete für die\n';
    doc += 'von Ihnen gemietete Wohnung "Whg. 1.OG links" im Objekt\n';
    doc += '"Hauptstraße 1, 10115 Berlin" von derzeit 750,00 € auf\n';
    doc += '825,00 €.\n';
    doc += '\n';
    doc += 'Die Erhöhung beträgt somit 75,00 € (10,0%).\n';
    doc += '\n';
    doc += 'Begründung:\n';
    doc += 'Die Erhöhung orientiert sich am Mietspiegel Berlin 2023.\n';
    doc += 'Vergleichbare Wohnungen in der Umgebung werden zu einem\n';
    doc += 'durchschnittlichen Quadratmeterpreis von 12,60 € vermietet.\n';
    doc += '\n';
    doc += 'Die Erhöhung wird zum 01.04.2024 wirksam.\n';
    doc += '\n';
    doc += 'Ihre neue Gesamtmiete (Warmmiete) beträgt ab diesem Zeitpunkt:\n';
    doc += '- Nettokaltmiete:    825,00 €\n';
    doc += '- Nebenkosten:       150,00 €\n';
    doc += '- Heizkosten:         80,00 €\n';
    doc += '──────────────────────────────\n';
    doc += 'Gesamt:            1.055,00 €\n';
    doc += '```\n\n';
    
    doc += '### 18.5 Nach-Prozess\n\n';
    doc += '1. Dokument generiert → Document Entity\n';
    doc += '2. Versand per Einschreiben (R2) → LetterShipment\n';
    doc += '3. RentChange Entity erstellt:\n';
    doc += '```javascript\n';
    doc += '{\n';
    doc += '  contract_id: contract.id,\n';
    doc += '  old_rent: 750,\n';
    doc += '  new_rent: 825,\n';
    doc += '  effective_date: "2024-04-01",\n';
    doc += '  reason: "Mietspiegel Berlin 2023",\n';
    doc += '  document_id: document.id,\n';
    doc += '  sent_date: "2024-01-07"\n';
    doc += '}\n';
    doc += '```\n';
    doc += '4. Task erstellt: "Mieterreaktion abwarten" (Fällig: 01.03.2024)\n';
    doc += '5. Bei Zustimmung/Fristablauf → LeaseContract versionieren:\n';
    doc += '```javascript\n';
    doc += '// Alte Version\n';
    doc += 'await LeaseContract.update(old_id, { is_current_valid: false });\n';
    doc += '\n';
    doc += '// Neue Version\n';
    doc += 'await LeaseContract.create({\n';
    doc += '  ...old_contract,\n';
    doc += '  base_rent: 825,\n';
    doc += '  total_rent: 1055,\n';
    doc += '  version_number: 2,\n';
    doc += '  predecessor_id: old_id,\n';
    doc += '  is_current_valid: true\n';
    doc += '});\n';
    doc += '```\n\n';
    
    return doc;
}

async function generateUserWorkflowsDoc() {
    let doc = '# User-Workflows - Immobilienverwaltung (Vollständig)\n\n';
    doc += '**Metadaten:**\n';
    doc += `- Generiert am: ${new Date().toLocaleString('de-DE')}\n`;
    doc += '- Verwendungszweck: Detaillierte Schritt-für-Schritt Anleitung aller Workflows\n';
    doc += '- Anzahl dokumentierter Workflows: 18\n\n';
    doc += '---\n\n';
    
    doc += '## WORKFLOW 1: NEUES OBJEKT ANLEGEN\n\n';
    
    doc += '### 1.1 Workflow-Identifikation\n\n';
    doc += '- **Workflow-Name**: Gebäude anlegen (komplett)\n';
    doc += '- **Hauptziel**: Ein neues Immobilienobjekt vollständig im System erfassen\n';
    doc += '- **User-Typ**: Verwalter, Admin\n';
    doc += '- **Häufigkeit**: Bei Neuakquise (einmalig pro Objekt)\n';
    doc += '- **Komplexität**: ⭐⭐⭐ Mittel bis Komplex\n';
    doc += '- **Geschätzte Dauer**: 10-20 Minuten (je nach Datenverfügbarkeit)\n\n';
    
    doc += '### 1.2 Voraussetzungen\n\n';
    doc += '- Berechtigung: User oder Admin\n';
    doc += '- Optional sinnvoll: Eigentümer-Daten verfügbar\n';
    doc += '- Optional sinnvoll: Kaufvertrag/Grundbuch zur Hand\n\n';
    
    doc += '### 1.3 Schritt-für-Schritt Prozess\n\n';
    doc += '**SCHRITT 1: Navigation**\n';
    doc += '- User klickt in Sidebar auf "Objekte"\n';
    doc += '- Seite: `pages/Buildings`\n';
    doc += '- Anzeige: Liste bestehender Gebäude oder Empty State\n\n';
    
    doc += '**SCHRITT 2: Neues Gebäude starten**\n';
    doc += '- User klickt Button "Gebäude hinzufügen" (rechts oben)\n';
    doc += '- UI: BuildingForm-Dialog öffnet sich\n';
    doc += '- Hintergrund: Keine DB-Operation\n\n';
    
    doc += '**SCHRITT 3: Stammdaten eingeben**\n';
    doc += '- Angezeigt werden folgende Felder:\n\n';
    doc += '| Feld | Typ | Pflicht | Beispiel |\n';
    doc += '|------|-----|---------|----------|\n';
    doc += '| Name | Text | ✅ Ja | "Hauptstraße 1" |\n';
    doc += '| Straße | Text | ✅ Ja | "Hauptstraße" |\n';
    doc += '| Hausnummer | Text | ✅ Ja | "1" |\n';
    doc += '| PLZ | Text | ✅ Ja | "12345" |\n';
    doc += '| Stadt | Text | ✅ Ja | "Berlin" |\n';
    doc += '| Baujahr | Zahl | ❌ Nein | "1985" |\n';
    doc += '| Wohnfläche gesamt | Zahl | ❌ Nein | "350" |\n';
    doc += '| Anzahl Einheiten | Zahl | ❌ Nein | "5" |\n\n';
    doc += '- Validierung: Echtzeitprüfung bei Eingabe (rote Rahmen bei ungültigen Werten)\n';
    doc += '- Fehlermeldung: "PLZ muss 5 Ziffern haben"\n';
    doc += '- Zurück: Ja, über "Abbrechen"-Button\n\n';
    
    doc += '**SCHRITT 4: Eigentümer zuordnen (Optional)**\n';
    doc += '- Dropdown: Bestehende Eigentümer\n';
    doc += '- Oder: Button "Neuer Eigentümer" → Öffnet OwnerForm\n';
    doc += '- Hintergrund: Owner.list() API-Call\n';
    doc += '- Kann übersprungen werden (später zuordnen)\n\n';
    
    doc += '**SCHRITT 5: Speichern**\n';
    doc += '- User klickt "Gebäude anlegen"\n';
    doc += '- Validierung: Alle Pflichtfelder ausgefüllt?\n';
    doc += '- Hintergrund:\n';
    doc += '  ```javascript\n';
    doc += '  await base44.entities.Building.create({\n';
    doc += '    name: "Hauptstraße 1",\n';
    doc += '    street: "Hauptstraße",\n';
    doc += '    house_number: "1",\n';
    doc += '    postal_code: "12345",\n';
    doc += '    city: "Berlin",\n';
    doc += '    owner_id: selectedOwnerId || null\n';
    doc += '  });\n';
    doc += '  ```\n';
    doc += '- Success: Toast "Gebäude erfolgreich angelegt"\n';
    doc += '- Redirect: Zu BuildingDetail-Seite\n\n';
    
    doc += '**SCHRITT 6: Wohneinheiten anlegen**\n';
    doc += '- Auf BuildingDetail-Seite: Tab "Einheiten"\n';
    doc += '- Button "Einheit hinzufügen"\n';
    doc += '- UnitForm öffnet sich\n';
    doc += '- Felder:\n';
    doc += '  - Wohnungsnummer (Pflicht): "Whg. 3"\n';
    doc += '  - Fläche in m² (Pflicht): 75.5\n';
    doc += '  - Zimmeranzahl: 3\n';
    doc += '  - Stockwerk: 2\n';
    doc += '- Hintergrund:\n';
    doc += '  ```javascript\n';
    doc += '  await base44.entities.Unit.create({\n';
    doc += '    building_id: building.id, // Automatisch gesetzt\n';
    doc += '    unit_number: "Whg. 3",\n';
    doc += '    flaeche: 75.5,\n';
    doc += '    rooms: 3\n';
    doc += '  });\n';
    doc += '  ```\n';
    doc += '- Wiederholbar für alle Wohnungen\n\n';
    
    doc += '**SCHRITT 7: Kaufvertrag erfassen (Optional)**\n';
    doc += '- Tab "Finanzen" auf BuildingDetail\n';
    doc += '- Button "Kaufvertrag hinzufügen"\n';
    doc += '- Felder:\n';
    doc += '  - Kaufpreis (Pflicht)\n';
    doc += '  - Kaufdatum (Pflicht)\n';
    doc += '  - Grundstückswert (für AfA-Berechnung)\n';
    doc += '  - Notarkosten, Maklergebühren, Grunderwerbsteuer\n';
    doc += '- Automatismus: System bietet an "AfA-Plan generieren"\n';
    doc += '- Hintergrund: PurchaseContract erstellen + AfASchedule generieren\n\n';
    
    doc += '**SCHRITT 8: Steuerliche Bibliothek initialisieren**\n';
    doc += '- Dialog erscheint: "Steuerliche Bibliothek installieren?"\n';
    doc += '- User wählt:\n';
    doc += '  - Rechtsform (Privatperson, GbR, GmbH)\n';
    doc += '  - Kontenrahmen (SKR03 oder SKR04)\n';
    doc += '- System erstellt BuildingTaxLibrary mit allen Kostenkategorien\n';
    doc += '- Dauer: ~2 Sekunden\n\n';
    
    doc += '### 1.4 Ausgabe/Ergebnis\n\n';
    doc += '**Erstellte Datensätze**:\n';
    doc += '- 1x Building\n';
    doc += '- Nx Unit (je nach Anzahl Wohnungen)\n';
    doc += '- 1x PurchaseContract (optional)\n';
    doc += '- 1x AfASchedule (optional, wenn Kaufvertrag)\n';
    doc += '- 1x BuildingTaxLibrary (optional)\n\n';
    
    doc += '### 1.5 Fehlerszenarien\n\n';
    doc += '- ❌ "PLZ muss 5 Ziffern haben" → Formular korrigieren\n';
    doc += '- ❌ "Gebäude mit dieser Adresse existiert bereits" → Duplikat-Warnung\n';
    doc += '- ⚠️ "Baujahr liegt in der Zukunft" → Warnung, aber speicherbar\n\n';
    
    doc += '### 1.6 Tipps & Best Practices\n\n';
    doc += '- ✅ Kaufvertrag IMMER erfassen (für korrekte AfA-Berechnung)\n';
    doc += '- ✅ Steuerliche Bibliothek sofort initialisieren (sonst später kompliziert)\n';
    doc += '- ✅ Alle Wohnungen auf einmal anlegen (nicht nach und nach)\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 2: NEUEN EIGENTÜMER ANLEGEN\n\n';
    
    doc += '### 2.1 Workflow-Identifikation\n\n';
    doc += '- **Workflow-Name**: Eigentümer-Struktur definieren\n';
    doc += '- **Hauptziel**: Eigentümerverhältnisse korrekt abbilden (Einzelperson, GbR, GmbH)\n';
    doc += '- **User-Typ**: Verwalter, Admin\n';
    doc += '- **Häufigkeit**: Einmalig (bei Neuanlage oder Eigentümerwechsel)\n';
    doc += '- **Komplexität**: ⭐⭐ Einfach bis Mittel (je nach Rechtsform)\n';
    doc += '- **Dauer**: 2-15 Minuten\n\n';
    
    doc += '### 2.2 Voraussetzungen\n\n';
    doc += '- Berechtigung: User oder Admin\n';
    doc += '- Building sollte existieren (kann aber auch direkt bei Building-Erstellung erfolgen)\n\n';
    
    doc += '### 2.3 Varianten\n\n';
    
    doc += '#### VARIANTE A: Einzelperson (Privatperson)\n\n';
    doc += '**SCHRITT 1**: Navigation zu Building → Tab "Eigentümer"\n';
    doc += '**SCHRITT 2**: Klick "Eigentümer hinzufügen"\n';
    doc += '**SCHRITT 3**: SimpleOwnerForm öffnet sich\n';
    doc += '**Felder**:\n';
    doc += '- Name (Pflicht): "Max Mustermann"\n';
    doc += '- Rechtsform (Auto): "PRIVATPERSON"\n';
    doc += '- Adresse (Optional)\n';
    doc += '- Steuer-ID (Optional)\n';
    doc += '**SCHRITT 4**: Speichern\n';
    doc += '- Hintergrund: Owner.create() + OwnerRelationship.create(building_id, owner_id)\n';
    doc += '**Ergebnis**: 1x Owner, 1x OwnerRelationship\n\n';
    
    doc += '#### VARIANTE B: GbR (Gesellschaft bürgerlichen Rechts)\n\n';
    doc += '**SCHRITT 1-2**: Wie Variante A\n';
    doc += '**SCHRITT 3**: Rechtsform "GbR" wählen\n';
    doc += '**SCHRITT 4**: System zeigt zusätzlich GesellschafterManager\n';
    doc += '**SCHRITT 5**: Gesellschafter hinzufügen (Button "Gesellschafter hinzufügen")\n';
    doc += '**Felder pro Gesellschafter**:\n';
    doc += '- Name (Pflicht): "Peter Schmidt"\n';
    doc += '- Anteil in % (Pflicht): 50\n';
    doc += '- Adresse\n';
    doc += '- Steuer-ID\n';
    doc += '**SCHRITT 6**: Weitere Gesellschafter hinzufügen (z.B. "Anna Müller", 50%)\n';
    doc += '**Validierung**: Summe aller Anteile muss 100% ergeben\n';
    doc += '- ❌ BLOCKER: "Anteile ergeben nur 80% - bitte auf 100% korrigieren"\n';
    doc += '**SCHRITT 7**: Speichern\n';
    doc += '**Hintergrund**:\n';
    doc += '```javascript\n';
    doc += 'const owner = await Owner.create({\n';
    doc += '  name: "Mustermann & Schmidt GbR",\n';
    doc += '  legal_form: "GBR"\n';
    doc += '});\n';
    doc += '\n';
    doc += 'await Shareholder.create({\n';
    doc += '  owner_id: owner.id,\n';
    doc += '  name: "Peter Schmidt",\n';
    doc += '  share_percentage: 50\n';
    doc += '});\n';
    doc += '\n';
    doc += 'await Shareholder.create({\n';
    doc += '  owner_id: owner.id,\n';
    doc += '  name: "Anna Müller",\n';
    doc += '  share_percentage: 50\n';
    doc += '});\n';
    doc += '```\n';
    doc += '**Ergebnis**: 1x Owner + 2x Shareholder + 1x OwnerRelationship\n\n';
    
    doc += '#### VARIANTE C: GmbH\n\n';
    doc += '**Unterschied zu GbR**:\n';
    doc += '- Rechtsform "GMBH"\n';
    doc += '- Zusätzliche Felder: Handelsregisternummer, Geschäftsführer\n';
    doc += '- Gesellschafter können juristische Personen sein\n\n';
    
    doc += '### 1.4 Entscheidungs-Punkte\n\n';
    doc += '**IF Rechtsform = "PRIVATPERSON"**:\n';
    doc += '- THEN: Einfaches Formular, keine Gesellschafter\n';
    doc += '**ELSE IF Rechtsform = "GBR" oder "GMBH"**:\n';
    doc += '- THEN: Gesellschafter-Manager anzeigen, Anteile müssen 100% ergeben\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 3: EIGENTÜMERWECHSEL DURCHFÜHREN\n\n';
    
    doc += '### 3.1 Workflow-Identifikation\n\n';
    doc += '- **Workflow-Name**: Eigentümerwechsel (Verkauf)\n';
    doc += '- **Hauptziel**: Neuen Eigentümer zuordnen, alte Beziehung archivieren\n';
    doc += '- **User-Typ**: Verwalter, Admin\n';
    doc += '- **Häufigkeit**: Selten (bei Verkauf/Übertragung)\n';
    doc += '- **Komplexität**: ⭐⭐ Mittel\n';
    doc += '- **Dauer**: 5-10 Minuten\n\n';
    
    doc += '### 3.2 Schritt-für-Schritt\n\n';
    doc += '**SCHRITT 1**: Building Detail → Tab "Eigentümer"\n';
    doc += '**SCHRITT 2**: Bei bestehendem Owner: Button "Eigentümer wechseln"\n';
    doc += '**SCHRITT 3**: Dialog öffnet sich\n';
    doc += '- Anzeige: Aktueller Eigentümer (schreibgeschützt)\n';
    doc += '- Feld: Neuer Eigentümer (Dropdown oder "Neu anlegen")\n';
    doc += '- Feld: Wechseldatum (Pflicht)\n';
    doc += '- Feld: Notizen (Optional)\n';
    doc += '**SCHRITT 4**: Neuen Eigentümer auswählen oder anlegen\n';
    doc += '**SCHRITT 5**: Bestätigen\n';
    doc += '**Hintergrund**:\n';
    doc += '```javascript\n';
    doc += '// Alte Beziehung archivieren\n';
    doc += 'await OwnerRelationship.update(old_relation_id, {\n';
    doc += '  is_active: false,\n';
    doc += '  end_date: wechseldatum\n';
    doc += '});\n';
    doc += '\n';
    doc += '// Neue Beziehung erstellen\n';
    doc += 'await OwnerRelationship.create({\n';
    doc += '  building_id: building.id,\n';
    doc += '  owner_id: new_owner_id,\n';
    doc += '  start_date: wechseldatum,\n';
    doc += '  is_active: true\n';
    doc += '});\n';
    doc += '```\n';
    doc += '**Ergebnis**: Historisierung erhalten, neuer Eigentümer aktiv\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 4: MIETVERTRAG ERSTELLEN\n\n';
    
    doc += '### 4.1 Workflow-Identifikation\n\n';
    doc += '- **Workflow-Name**: Mietvertrag erfassen\n';
    doc += '- **Hauptziel**: Neues Mietverhältnis dokumentieren\n';
    doc += '- **User-Typ**: Verwalter\n';
    doc += '- **Häufigkeit**: Bei jeder Neuvermietung\n';
    doc += '- **Komplexität**: ⭐⭐⭐ Mittel\n';
    doc += '- **Dauer**: 5-10 Minuten\n\n';
    
    doc += '### 4.2 Voraussetzungen\n\n';
    doc += '- ✅ Building existiert\n';
    doc += '- ✅ Unit existiert und ist verfügbar\n';
    doc += '- ✅ Tenant existiert (oder wird neu angelegt)\n\n';
    
    doc += '### 4.3 Schritt-für-Schritt\n\n';
    doc += '**SCHRITT 1**: Navigation zu "Mieter" (Sidebar)\n';
    doc += '**SCHRITT 2**: Klick "Neuer Vertrag" (rechts oben)\n';
    doc += '**SCHRITT 3**: ContractForm öffnet sich\n\n';
    doc += '**Formular-Felder (Seite 1/3)**:\n';
    doc += '| Feld | Pflicht | Typ | Beispiel |\n';
    doc += '|------|---------|-----|----------|\n';
    doc += '| Gebäude | ✅ | Dropdown | "Hauptstraße 1" |\n';
    doc += '| Wohneinheit | ✅ | Dropdown (gefiltert) | "Whg. 3" |\n';
    doc += '| Mieter | ✅ | Dropdown + "Neu" | "Klaus Schmidt" |\n\n';
    doc += '- Validierung: Unit muss verfügbar sein (kein aktiver Vertrag)\n';
    doc += '- Bei Konflikt: ❌ "Wohnung ist bereits vermietet bis DD.MM.YYYY"\n\n';
    doc += '**SCHRITT 4**: Falls Mieter neu → TenantForm inline\n';
    doc += '- Vorname, Nachname (Pflicht)\n';
    doc += '- Anrede (Herr/Frau)\n';
    doc += '- Geburtsdatum\n';
    doc += '- Vollständige Adresse (wichtig für Dokumente!)\n';
    doc += '- E-Mail, Telefon\n';
    doc += '- Speichern → Tenant wird erstellt und automatisch ausgewählt\n\n';
    doc += '**SCHRITT 5**: Weiter zu Vertragsdaten (Seite 2/3)\n';
    doc += '| Feld | Pflicht | Typ | Beispiel | Validierung |\n';
    doc += '|------|---------|-----|----------|-------------|\n';
    doc += '| Mietbeginn | ✅ | Datum | 01.02.2024 | - |\n';
    doc += '| Befristet? | ✅ | Radio | Nein | - |\n';
    doc += '| Mietende | ❌ | Datum | - | Nur wenn befristet |\n';
    doc += '| Kaltmiete | ✅ | Währung | 650,00 € | > 0 |\n';
    doc += '| Nebenkosten | ✅ | Währung | 150,00 € | ≥ 0 |\n';
    doc += '| Heizkosten | ✅ | Währung | 80,00 € | ≥ 0 |\n';
    doc += '| Warmmiete | - | Auto | 880,00 € | = Summe |\n\n';
    doc += '- Automatismus: Warmmiete wird live berechnet\n';
    doc += '- Validierung: Warmmiete muss Summe entsprechen\n\n';
    doc += '**SCHRITT 6**: Weiter zu Kaution & Sonstiges (Seite 3/3)\n';
    doc += '| Feld | Pflicht | Typ | Beispiel |\n';
    doc += '|------|---------|-----|----------|\n';
    doc += '| Kaution | ❌ | Währung | 1.950,00 € |\n';
    doc += '| Kaution in Raten | ❌ | Dropdown | 3 Raten |\n';
    doc += '| Fälligkeitstag | ✅ | Zahl (1-31) | 3 |\n';
    doc += '| Kündigungsfrist | ✅ | Dropdown | 3 Monate |\n';
    doc += '| Anzahl Personen | ❌ | Zahl | 2 |\n\n';
    doc += '- Validierung: Kaution ≤ 3x Kaltmiete (sonst Warning)\n';
    doc += '- Tooltip bei Kaution: "Gesetzlich max. 3 Monatsmieten"\n\n';
    doc += '**SCHRITT 7**: Speichern\n';
    doc += '**Hintergrund**:\n';
    doc += '```javascript\n';
    doc += '// 1. Contract erstellen\n';
    doc += 'const contract = await base44.entities.LeaseContract.create({\n';
    doc += '  unit_id: selectedUnit.id,\n';
    doc += '  tenant_id: selectedTenant.id,\n';
    doc += '  start_date: "2024-02-01",\n';
    doc += '  is_unlimited: true,\n';
    doc += '  base_rent: 650,\n';
    doc += '  utilities: 150,\n';
    doc += '  heating: 80,\n';
    doc += '  total_rent: 880,\n';
    doc += '  deposit: 1950,\n';
    doc += '  deposit_installments: 3,\n';
    doc += '  rent_due_day: 3,\n';
    doc += '  notice_period_months: 3,\n';
    doc += '  status: "active"\n';
    doc += '});\n';
    doc += '\n';
    doc += '// 2. Automatisch: Buchungen generieren\n';
    doc += 'await generateBookingsFromSource({\n';
    doc += '  sourceType: "Mietvertrag",\n';
    doc += '  sourceId: contract.id\n';
    doc += '});\n';
    doc += '// → Erstellt monatliche Mietbuchungen ab start_date\n';
    doc += '```\n';
    doc += '**Ergebnis**: \n';
    doc += '- 1x LeaseContract\n';
    doc += '- 12x GeneratedFinancialBooking (Mieteinnahmen für 1 Jahr)\n';
    doc += '- Optional: 3x GeneratedFinancialBooking (Kaution in 3 Raten)\n\n';
    
    doc += '### 4.4 Automatismen\n\n';
    doc += '- ✅ Warmmiete = Auto-Summe aus Kalt + NK + Heizung\n';
    doc += '- ✅ Mietbuchungen werden automatisch ab start_date erstellt\n';
    doc += '- ✅ Unit.status wird auf "vermietet" gesetzt\n';
    doc += '- ✅ Falls Kaution > 0: Separate Buchungen für Raten\n\n';
    
    doc += '### 4.5 Fehlerszenarien\n\n';
    doc += '- ❌ "Wohnung bereits vermietet" → User muss anderen Unit wählen\n';
    doc += '- ❌ "Warmmiete stimmt nicht überein" → System-Fehler, sollte nicht auftreten\n';
    doc += '- ⚠️ "Kaution > 3x Kaltmiete" → Warning, aber speicherbar\n';
    doc += '- ⚠️ "Mietbeginn liegt in Vergangenheit" → Warning, aber OK bei rückwirkender Erfassung\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 5: MIETER EIN-/AUSZUG\n\n';
    
    doc += '### 5.1 EINZUG (Vertrag starten)\n\n';
    doc += '**SCHRITT 1**: Mietvertrag erstellen (siehe Workflow 4)\n';
    doc += '**SCHRITT 2**: Optional: Übergabeprotokoll generieren\n';
    doc += '- Navigation: Dokumente → "Neues Dokument"\n';
    doc += '- Template: "Übergabeprotokoll Einzug"\n';
    doc += '- Datenquellen: Building, Unit, Tenant, Contract\n';
    doc += '- Zusätzlich: Zählerstände erfassen\n';
    doc += '**SCHRITT 3**: Übergabe vor Ort\n';
    doc += '- Protokoll ausdrucken\n';
    doc += '- Wohnung begehen\n';
    doc += '- Mängel notieren\n';
    doc += '- Unterschriften (Vermieter + Mieter)\n';
    doc += '**SCHRITT 4**: Protokoll einscannen und hochladen\n';
    doc += '- DocumentOriginal erstellen\n';
    doc += '- Mit Document verlinken\n\n';
    
    doc += '### 5.2 AUSZUG (Vertrag beenden)\n\n';
    doc += '**SCHRITT 1**: Contract Detail → Button "Kündigung"\n';
    doc += '**SCHRITT 2**: Kündigungs-Dialog\n';
    doc += '- Kündigungsdatum (Pflicht)\n';
    doc += '- Kündigungsgrund (Optional)\n';
    doc += '- Auszugsdatum wird automatisch berechnet:\n';
    doc += '  ```javascript\n';
    doc += '  auszugsdatum = add_months(kuendigungsdatum, notice_period_months)\n';
    doc += '  // Auf Monatsende gerundet\n';
    doc += '  ```\n';
    doc += '**SCHRITT 3**: Bestätigen\n';
    doc += '**Hintergrund**:\n';
    doc += '```javascript\n';
    doc += 'await LeaseContract.update(contract.id, {\n';
    doc += '  status: "terminated",\n';
    doc += '  termination_date: "2024-03-15",\n';
    doc += '  end_date: "2024-06-30" // Nach 3 Monaten Frist\n';
    doc += '});\n';
    doc += '\n';
    doc += '// Mietbuchungen ab end_date stoppen\n';
    doc += 'await updateFutureBookings(contract.id, end_date);\n';
    doc += '```\n';
    doc += '**SCHRITT 4**: Übergabeprotokoll Auszug generieren\n';
    doc += '**SCHRITT 5**: Kaution abrechnen\n';
    doc += '- Offene Forderungen prüfen\n';
    doc += '- Schäden vom Protokoll abziehen\n';
    doc += '- Rest-Kaution auszahlen\n';
    doc += '**SCHRITT 6**: Unit freigeben\n';
    doc += '- Unit.status = "verfügbar"\n';
    doc += '- Bereit für Neuvermietung\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 6: RECHNUNG/BELEG ERFASSEN\n\n';
    
    doc += '### 6.1 VARIANTE A: Manuelle Eingabe\n\n';
    doc += '**SCHRITT 1**: Navigation zu "Rechnungen & Belege"\n';
    doc += '**SCHRITT 2**: Klick "Neue Rechnung"\n';
    doc += '**SCHRITT 3**: InvoiceForm\n';
    doc += '| Feld | Pflicht | Beispiel |\n';
    doc += '|------|---------|----------|\n';
    doc += '| Gebäude | ✅ | "Hauptstraße 1" |\n';
    doc += '| Rechnungsnummer | ✅ | "RE-2024-001" |\n';
    doc += '| Rechnungsdatum | ✅ | 15.01.2024 |\n';
    doc += '| Lieferant | ✅ | "Elektro Müller GmbH" |\n';
    doc += '| Betrag netto | ✅ | 450,00 € |\n';
    doc += '| MwSt. % | ✅ | 19% |\n';
    doc += '| Betrag brutto | Auto | 535,50 € |\n';
    doc += '| Kostenkategorie | ✅ | Dropdown aus Tax Library |\n';
    doc += '| Beschreibung | ❌ | "Elektroarbeiten Treppenhaus" |\n\n';
    doc += '**Automatismus**: Brutto = Netto * (1 + MwSt.)\n';
    doc += '**SCHRITT 4**: PDF hochladen (Optional)\n';
    doc += '- Drag & Drop oder File-Picker\n';
    doc += '- PDF wird zu Storage hochgeladen\n';
    doc += '- URL wird in Invoice.pdf_url gespeichert\n';
    doc += '**SCHRITT 5**: Speichern\n';
    doc += '**Hintergrund**: Invoice.create()\n\n';
    
    doc += '### 6.2 VARIANTE B: Intelligenter Wizard (PDF-Upload)\n\n';
    doc += '**SCHRITT 1**: "Rechnungen & Belege" → "Intelligenter Upload"\n';
    doc += '**SCHRITT 2**: PDF hochladen (Drag & Drop)\n';
    doc += '**SCHRITT 3**: System analysiert PDF mit InvokeLLM\n';
    doc += '```javascript\n';
    doc += 'const extracted = await base44.integrations.Core.InvokeLLM({\n';
    doc += '  prompt: "Extrahiere: Rechnungsnummer, Datum, Lieferant, Netto, Brutto, MwSt",\n';
    doc += '  file_urls: [pdf_url],\n';
    doc += '  response_json_schema: invoiceSchema\n';
    doc += '});\n';
    doc += '```\n';
    doc += '**SCHRITT 4**: Vorausgefülltes Formular anzeigen\n';
    doc += '- Alle extrahierten Felder sind befüllt\n';
    doc += '- User prüft und korrigiert falls nötig\n';
    doc += '- Kostenkategorie muss User manuell wählen (KI schlägt vor)\n';
    doc += '**SCHRITT 5**: Speichern\n';
    doc += '**Dauer**: ~30 Sekunden (inkl. KI-Analyse)\n';
    doc += '**Vorteil**: 80% weniger Tipparbeit\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 7: BELEG KATEGORISIEREN & ZUORDNEN\n\n';
    
    doc += '### 7.1 Workflow-Identifikation\n\n';
    doc += '- **Workflow-Name**: Rechnungskategorisierung für Steuern\n';
    doc += '- **Hauptziel**: Korrekte steuerliche Behandlung sicherstellen\n';
    doc += '- **Komplexität**: ⭐⭐ Mittel (erfordert Steuerkenntnis)\n';
    doc += '- **Dauer**: 1-2 Minuten pro Rechnung\n\n';
    
    doc += '### 7.2 Schritt-für-Schritt\n\n';
    doc += '**SCHRITT 1**: Invoice in Liste anklicken\n';
    doc += '**SCHRITT 2**: Kostenkategorie wählen (CostCategorySelector)\n';
    doc += '- UI zeigt: Kategorien aus BuildingTaxLibrary\n';
    doc += '- Gefiltert nach:\n';
    doc += '  - Rechtsform des Gebäudes\n';
    doc += '  - Nutzungsart (Wohnung/Gewerbe)\n';
    doc += '- Jede Kategorie zeigt:\n';
    doc += '  - Name (z.B. "Grundsteuer")\n';
    doc += '  - Steuerliche Behandlung (Sofort / AfA / Nicht absetzbar)\n';
    doc += '  - SKR-Konto (z.B. "4110")\n';
    doc += '  - Umlagefähig? (Ja/Nein)\n';
    doc += '**SCHRITT 3**: Kategorie auswählen\n';
    doc += '**SCHRITT 4**: System prüft 15%-Regel\n';
    doc += '```javascript\n';
    doc += 'if (category.tax_treatment === "SOFORT" && category.type === "ERHALTUNG") {\n';
    doc += '  const summe_3_jahre = await check15PercentRule(building_id);\n';
    doc += '  if (summe_3_jahre.exceeded) {\n';
    doc += '    toast.warning("⚠️ 15%-Grenze überschritten - prüfen Sie Herstellungskosten!");\n';
    doc += '  }\n';
    doc += '}\n';
    doc += '```\n';
    doc += '**SCHRITT 5**: Speichern\n';
    doc += '- Invoice.cost_category_id wird gesetzt\n';
    doc += '- Invoice.tax_treatment wird übernommen\n';
    doc += '- Optional: GeneratedFinancialBooking aus Invoice erstellen\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 8: BETRIEBSKOSTENABRECHNUNG ERSTELLEN (KOMPLETT)\n\n';
    
    doc += '### 8.1 Workflow-Identifikation\n\n';
    doc += '- **Workflow-Name**: Betriebskosten-Wizard (5-Schritt-Prozess)\n';
    doc += '- **Hauptziel**: Rechtskonforme NK-Abrechnung für alle Mieter\n';
    doc += '- **User-Typ**: Verwalter\n';
    doc += '- **Häufigkeit**: Jährlich (pro Gebäude)\n';
    doc += '- **Komplexität**: ⭐⭐⭐⭐ Komplex\n';
    doc += '- **Dauer**: 30-60 Minuten (bei 10 Wohnungen)\n\n';
    
    doc += '### 8.2 Voraussetzungen\n\n';
    doc += '- ✅ Building mit Units\n';
    doc += '- ✅ Mindestens 1 aktiver LeaseContract im Abrechnungsjahr\n';
    doc += '- ✅ Kosten erfasst (GeneratedFinancialBooking oder manuell)\n';
    doc += '- ✅ Vorauszahlungen in Contracts hinterlegt\n\n';
    
    doc += '### 8.3 Schritt-für-Schritt (Wizard)\n\n';
    
    doc += '**SCHRITT 1: Gebäude & Zeitraum**\n';
    doc += '- Seite: "Betriebskosten" → "Neue Abrechnung"\n';
    doc += '- Component: Step1BuildingSelection\n';
    doc += '- Felder:\n';
    doc += '  - Gebäude (Dropdown, Pflicht)\n';
    doc += '  - Abrechnungsjahr (Dropdown 2020-2026, Pflicht)\n';
    doc += '- Automatismus: System prüft ob Building vollständig\n';
    doc += '- Validierung: Gebäude muss Units haben\n';
    doc += '- Button "Weiter" → Schritt 2\n';
    doc += '- Hintergrund:\n';
    doc += '  ```javascript\n';
    doc += '  const units = await base44.entities.Unit.filter({ building_id });\n';
    doc += '  const contracts = await base44.entities.LeaseContract.filter({\n';
    doc += '    unit_id: { $in: units.map(u => u.id) },\n';
    doc += '    // Verträge die im Jahr aktiv waren\n';
    doc += '  });\n';
    doc += '  ```\n\n';
    
    doc += '**SCHRITT 2: Mietverträge auswählen**\n';
    doc += '- Component: Step2ContractSelection\n';
    doc += '- UI: Tabelle aller Verträge im gewählten Jahr\n';
    doc += '- Spalten: Wohnung, Mieter, Zeitraum, Vorauszahlungen\n';
    doc += '- Checkboxen: User wählt abzurechnende Verträge\n';
    doc += '- Automatisch vorselektiert: Alle Verträge die ≥ 1 Monat im Jahr aktiv\n';
    doc += '- Info-Text: "5 Verträge gefunden, 5 ausgewählt"\n';
    doc += '- Button "Weiter" (disabled wenn keine Auswahl)\n\n';
    
    doc += '**SCHRITT 3: Kosten erfassen**\n';
    doc += '- Component: Step3CostSelection\n';
    doc += '- UI: Zwei Optionen (Radio-Buttons):\n\n';
    doc += '  **OPTION A: Aus Buchungen importieren**\n';
    doc += '  - System lädt GeneratedFinancialBooking im Zeitraum\n';
    doc += '  - Filtert nur umlagefähige Kategorien\n';
    doc += '  - Zeigt Preview-Tabelle\n';
    doc += '  - User kann Positionen an/abwählen\n\n';
    doc += '  **OPTION B: Manuell erfassen**\n';
    doc += '  - Tabelle mit Eingabezeilen\n';
    doc += '  - Felder: Kostenart, Betrag, Verteilerschlüssel\n';
    doc += '  - Button "Position hinzufügen" für weitere Zeilen\n\n';
    doc += '- Verteilerschlüssel-Dropdown pro Position:\n';
    doc += '  - Fläche (Standard)\n';
    doc += '  - Personen\n';
    doc += '  - Gleichmäßig\n';
    doc += '  - Verbrauch (nur bei Zählern)\n';
    doc += '- Button "Weiter"\n\n';
    
    doc += '**SCHRITT 4: Direkte Kosten (Zähler)**\n';
    doc += '- Component: Step4DirectCosts\n';
    doc += '- UI: Nur bei Kosten mit Verteilerschlüssel "Verbrauch"\n';
    doc += '- Pro Wohnung:\n';
    doc += '  - Zählerstand Anfang\n';
    doc += '  - Zählerstand Ende\n';
    doc += '  - Verbrauch (auto berechnet)\n';
    doc += '- Kann übersprungen werden falls keine Verbrauchskosten\n\n';
    doc += '**SCHRITT 5: Zusammenfassung & Berechnung**\n';
    doc += '- Component: Step5Summary\n';
    doc += '- UI: Detaillierte Übersicht\n\n';
    doc += '**Anzeige**:\n';
    doc += '```\n';
    doc += '┌─────────────────────────────────────────────┐\n';
    doc += '│ GESAMTÜBERSICHT                             │\n';
    doc += '├─────────────────────────────────────────────┤\n';
    doc += '│ Gesamtkosten:              4.523,80 €       │\n';
    doc += '│ Umlagefähig:               4.200,00 €       │\n';
    doc += '│ Nicht umlagefähig:           323,80 €       │\n';
    doc += '│                                             │\n';
    doc += '│ PRO MIETER:                                 │\n';
    doc += '│ ┌─────────────┬──────┬────────┬─────────┐  │\n';
    doc += '│ │ Mieter      │ Kost.│  VZ    │  Saldo  │  │\n';
    doc += '│ ├─────────────┼──────┼────────┼─────────┤  │\n';
    doc += '│ │ Mustermann  │ 836€ │ 1800€  │ -964€ G │  │\n';
    doc += '│ │ Schmidt     │ 920€ │ 1800€  │ -880€ G │  │\n';
    doc += '│ │ Müller      │ 715€ │ 1500€  │ -785€ G │  │\n';
    doc += '│ └─────────────┴──────┴────────┴─────────┘  │\n';
    doc += '└─────────────────────────────────────────────┘\n';
    doc += '```\n';
    doc += '- Legende: G = Guthaben, N = Nachzahlung\n';
    doc += '- Button "Abrechnung finalisieren"\n\n';
    
    doc += '**SCHRITT 6: Finalisierung**\n';
    doc += '**Hintergrund**:\n';
    doc += '```javascript\n';
    doc += '// 1. OperatingCostStatement erstellen\n';
    doc += 'const statement = await OperatingCostStatement.create({\n';
    doc += '  building_id,\n';
    doc += '  abrechnungsjahr: 2023,\n';
    doc += '  status: "finalized",\n';
    doc += '  gesamtkosten: 4523.80\n';
    doc += '});\n';
    doc += '\n';
    doc += '// 2. Alle Items speichern\n';
    doc += 'for (const item of items) {\n';
    doc += '  await OperatingCostStatementItem.create({\n';
    doc += '    statement_id: statement.id,\n';
    doc += '    kostenart: item.name,\n';
    doc += '    betrag: item.amount,\n';
    doc += '    verteilerschluessel: item.key,\n';
    doc += '    umlegbar: item.allocatable\n';
    doc += '  });\n';
    doc += '}\n';
    doc += '```\n\n';
    
    doc += '**SCHRITT 7: Dokumente generieren (Optional)**\n';
    doc += '- Dialog: "Dokumente für alle Mieter erstellen?"\n';
    doc += '- Optionen:\n';
    doc += '  - Ja, jetzt erstellen\n';
    doc += '  - Nein, später manuell\n';
    doc += '- Bei JA: Bulk-PDF-Generierung startet\n';
    doc += '  - Pro Mieter: ~3 Sekunden\n';
    doc += '  - 10 Mieter = ~30 Sekunden\n';
    doc += '  - Progress-Bar anzeigen\n\n';
    
    doc += '**SCHRITT 8: Versand (Optional)**\n';
    doc += '- Dialog: "Alle Abrechnungen per Post versenden?"\n';
    doc += '- Versandart wählen (Normal / R1)\n';
    doc += '- Kosten-Übersicht anzeigen\n';
    doc += '- Bei Bestätigung: Bulk-Versand via LetterXpress\n\n';
    
    doc += '### 8.4 Ausgabe/Ergebnis\n\n';
    doc += '**Erstellte Datensätze**:\n';
    doc += '- 1x OperatingCostStatement\n';
    doc += '- Nx OperatingCostStatementItem (je nach Kostenpositionen)\n';
    doc += '- Mx Document (1 pro Mieter)\n';
    doc += '- Optional: Mx LetterShipment (bei Versand)\n\n';
    
    doc += '### 8.5 Fehlerszenarien\n\n';
    doc += '- ❌ "Zeitraum muss 12 Monate sein" → Year-Picker korrigieren\n';
    doc += '- ❌ "Keine Verträge im Zeitraum" → Gebäude/Jahr ändern\n';
    doc += '- ⚠️ "Vorauszahlungen fehlen bei 2 Verträgen" → Hinweis, aber fortsetzbar\n';
    doc += '- ⚠️ "Kosten 40% höher als Vorjahr" → Plausibilitätsprüfung\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 9: ANLAGE V GENERIEREN & PRÜFEN\n\n';
    
    doc += '### 9.1 Workflow-Identifikation\n\n';
    doc += '- **Workflow-Name**: Steuerformular Anlage V erstellen\n';
    doc += '- **Hauptziel**: Einkünfte aus Vermietung für Steuererklärung\n';
    doc += '- **User-Typ**: Verwalter, Eigentümer, Steuerberater\n';
    doc += '- **Häufigkeit**: Jährlich (pro Gebäude)\n';
    doc += '- **Komplexität**: ⭐⭐⭐⭐ Komplex\n';
    doc += '- **Dauer**: 10-20 Minuten\n\n';
    
    doc += '### 9.2 Schritt-für-Schritt\n\n';
    
    doc += '**SCHRITT 1**: Navigation zu "Steuerformulare"\n';
    doc += '**SCHRITT 2**: Klick "Neue Anlage V"\n';
    doc += '**SCHRITT 3**: AnlageVWizard öffnet sich\n\n';
    
    doc += '**STEP 1: Objekt & Jahr wählen**\n';
    doc += '- Gebäude-Dropdown (nur Gebäude mit Tax Library)\n';
    doc += '- Steuerjahr-Dropdown (2020-2025)\n';
    doc += '- Validierung:\n';
    doc += '  ```javascript\n';
    doc += '  const validation = await validateAnlageV(building_id, year);\n';
    doc += '  // Prüft: Adresse vollständig? Kaufdatum vorhanden? Mietverträge?\n';
    doc += '  ```\n';
    doc += '- Bei Fehler: Liste der fehlenden Daten anzeigen\n\n';
    
    doc += '**STEP 2: Einnahmen berechnen**\n';
    doc += '- System lädt automatisch alle LeaseContracts des Jahres\n';
    doc += '- Berechnung:\n';
    doc += '  ```javascript\n';
    doc += '  const result = await calculateAnlageVEinnahmen(building_id, year);\n';
    doc += '  // result = {\n';
    doc += '  //   zeile_9: 10800, // Mieteinnahmen\n';
    doc += '  //   zeile_10: 0,    // Sonstige Einnahmen\n';
    doc += '  //   details: [...]  // Pro Vertrag aufgeschlüsselt\n';
    doc += '  // }\n';
    doc += '  ```\n';
    doc += '- UI zeigt:\n';
    doc += '  - Tabellarische Übersicht pro Vertrag\n';
    doc += '  - Zeile 9 (Gesamteinnahmen): 10.800,00 €\n';
    doc += '- User kann Werte manuell korrigieren (z.B. Mietrückstände abziehen)\n\n';
    
    doc += '**STEP 3: Werbungskosten berechnen**\n';
    doc += '- System ruft calculateAnlageVWerbungskosten auf\n';
    doc += '- Lädt:\n';
    doc += '  - PropertyTax → Zeile 40\n';
    doc += '  - Insurance → Zeile 41\n';
    doc += '  - Invoices (SOFORT) → Zeile 42\n';
    doc += '  - Financing (nur Zinsen) → Zeile 43\n';
    doc += '  - AfASchedule → Zeile 33\n';
    doc += '- UI: Formular mit allen Anlage V Zeilen\n';
    doc += '- Pro Zeile:\n';
    doc += '  - Bezeichnung (z.B. "Zeile 40: Grundsteuer")\n';
    doc += '  - Vorausgefüllter Betrag\n';
    doc += '  - Editierbar (falls Korrekturen nötig)\n';
    doc += '  - Tooltip: Erklärung der Zeile\n\n';
    
    doc += '**STEP 4: Validierung & Plausibilität**\n';
    doc += '- System prüft:\n';
    doc += '  - ✅ Einnahmen > 0?\n';
    doc += '  - ⚠️ Verlust > Einnahmen? (Liebhaberei-Hinweis)\n';
    doc += '  - ⚠️ AfA fehlt trotz Kaufvertrag?\n';
    doc += '  - ⚠️ 15%-Regel überschritten?\n';
    doc += '- Component: AnlageVValidationResults\n';
    doc += '- UI: Liste aller Prüfungen mit ✅/⚠️/❌\n';
    doc += '- Bei Blockern: "Weiter" disabled\n';
    doc += '- Bei Warnings: "Trotzdem fortfahren" möglich\n\n';
    
    doc += '**STEP 5: Zusammenfassung & Export**\n';
    doc += '- UI: Finale Übersicht\n';
    doc += '```\n';
    doc += 'Anlage V 2023 - Hauptstraße 1\n';
    doc += '\n';
    doc += 'Einnahmen (Zeile 9):           10.800,00 €\n';
    doc += 'AfA (Zeile 33):                 1.200,00 €\n';
    doc += 'Grundsteuer (Zeile 40):           480,00 €\n';
    doc += 'Versicherungen (Zeile 41):        650,00 €\n';
    doc += 'Erhaltung (Zeile 42):           2.100,00 €\n';
    doc += 'Schuldzinsen (Zeile 43):        1.800,00 €\n';
    doc += 'Sonstige (Zeile 48):              320,00 €\n';
    doc += '─────────────────────────────────────────────\n';
    doc += 'Summe Werbungskosten:           6.550,00 €\n';
    doc += '\n';
    doc += 'Überschuss/Verlust:            +4.250,00 €\n';
    doc += '```\n';
    doc += '- Buttons:\n';
    doc += '  - "Als PDF exportieren" → downloadAnlageVPDF\n';
    doc += '  - "Speichern" → AnlageVSubmission erstellen\n';
    doc += '  - "Zurück" → Zu Step 4\n\n';
    
    doc += '### 9.3 Ausgabe/Ergebnis\n\n';
    doc += '**Erstellte Datensätze**:\n';
    doc += '- 1x AnlageVSubmission mit allen berechneten Werten\n';
    doc += '- 1x PDF-Datei (optional, zum Download)\n\n';
    doc += '**Verwendung**:\n';
    doc += '- PDF an Steuerberater senden\n';
    doc += '- Daten in ELSTER übernehmen (manuell oder später automatisch)\n';
    doc += '- Als Anlage zur Steuererklärung\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 10: EIGENTÜMERABRECHNUNG ERSTELLEN\n\n';
    
    doc += '### 10.1 Workflow-Identifikation\n\n';
    doc += '- **Workflow-Name**: Jahresabrechnung für Eigentümer\n';
    doc += '- **Hauptziel**: Einnahmen/Ausgaben pro Eigentümer aufschlüsseln\n';
    doc += '- **Komplexität**: ⭐⭐⭐ Mittel bis Komplex (bei Gesellschaften)\n';
    doc += '- **Dauer**: 15-30 Minuten\n\n';
    
    doc += '### 10.2 Besonderheit bei Miteigentum (GbR, GmbH)\n\n';
    doc += '**SCHRITT 1**: Analytics/Reporting-Modul\n';
    doc += '**SCHRITT 2**: "Eigentümerabrechnung" auswählen\n';
    doc += '**SCHRITT 3**: Gebäude + Jahr wählen\n';
    doc += '**SCHRITT 4**: System berechnet:\n';
    doc += '```javascript\n';
    doc += '// Alle Einnahmen und Ausgaben des Jahres\n';
    doc += 'const einnahmen = sum(Mieteinnahmen)\n';
    doc += 'const ausgaben = sum(Alle Kosten)\n';
    doc += 'const ergebnis = einnahmen - ausgaben\n';
    doc += '\n';
    doc += '// Bei Gesellschaft: Pro Gesellschafter\n';
    doc += 'for (const shareholder of shareholders) {\n';
    doc += '  const anteil = shareholder.share_percentage / 100\n';
    doc += '  shareholder_einnahmen = einnahmen * anteil\n';
    doc += '  shareholder_ausgaben = ausgaben * anteil\n';
    doc += '  shareholder_ergebnis = ergebnis * anteil\n';
    doc += '}\n';
    doc += '```\n';
    doc += '**SCHRITT 5**: PDF generieren mit Aufteilung pro Gesellschafter\n';
    doc += '**Verwendung**: Für Anlage V der einzelnen Gesellschafter\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 11: DOKUMENT MIT TEMPLATE ERSTELLEN\n\n';
    
    doc += '### 11.1 Workflow-Identifikation\n\n';
    doc += '- **Workflow-Name**: Document-Wizard (Standard)\n';
    doc += '- **Hauptziel**: Beliebiges Dokument aus Template generieren\n';
    doc += '- **Häufigkeit**: Häufig (mehrmals pro Woche)\n';
    doc += '- **Komplexität**: ⭐⭐ Mittel\n';
    doc += '- **Dauer**: 3-5 Minuten\n\n';
    
    doc += '### 11.2 Schritt-für-Schritt\n\n';
    
    doc += '**SCHRITT 1: Start**\n';
    doc += '- Seite: "Dokumente"\n';
    doc += '- Klick: "Neues Dokument"\n';
    doc += '- Component: DocumentCreateWizard\n';
    doc += '- 4 Steps mit Progress-Bar\n\n';
    
    doc += '**SCHRITT 2: Template wählen**\n';
    doc += '- UI: Grid-Layout mit Template-Karten\n';
    doc += '- Kategorien als Tabs:\n';
    doc += '  - Mietrecht (Mieterhöhung, Kündigung, Abmahnung)\n';
    doc += '  - Verwaltung (NK-Abrechnung, Zahlungserinnerung)\n';
    doc += '  - Finanzen (Eigentümerabrechnung)\n';
    doc += '  - Übergabeprotokolle\n';
    doc += '  - Sonstiges\n';
    doc += '- Jede Karte zeigt:\n';
    doc += '  - Template-Name\n';
    doc += '  - Icon\n';
    doc += '  - Kurzbeschreibung\n';
    doc += '  - Benötigte Datenquellen (Icons)\n';
    doc += '- User klickt Template → "Weiter"\n\n';
    
    doc += '**SCHRITT 3: Datenquellen verknüpfen**\n';
    doc += '- System zeigt nur erforderliche Dropdowns (aus required_data_sources)\n';
    doc += '- Beispiel für "Mieterhöhung":\n';
    doc += '  - Gebäude (Dropdown, lädt alle Buildings)\n';
    doc += '  - Wohneinheit (Dropdown, gefiltert nach building_id)\n';
    doc += '  - Mietvertrag (Dropdown, gefiltert nach unit_id)\n';
    doc += '  - Mieter (Auto-geladen aus contract.tenant_id)\n';
    doc += '- Empfängeradresse wird automatisch befüllt:\n';
    doc += '  ```javascript\n';
    doc += '  recipient_name = `${tenant.first_name} ${tenant.last_name}`\n';
    doc += '  recipient_address = `${unit.name}\\n${building.street} ${building.house_number}\\n${building.postal_code} ${building.city}`\n';
    doc += '  ```\n';
    doc += '- Editierbar falls Korrektur nötig\n';
    doc += '- "Weiter"\n\n';
    
    doc += '**SCHRITT 4: Textbausteine**\n';
    doc += '- UI: Liste verfügbarer TextBlocks für diese Kategorie\n';
    doc += '- Checkbox-Liste:\n';
    doc += '  □ Begrüßung (formal)\n';
    doc += '  □ Kündigungsfristen-Hinweis\n';
    doc += '  □ Zahlungshinweis mit IBAN\n';
    doc += '  □ Grußformel\n';
    doc += '- User wählt relevante Bausteine (Multi-Select)\n';
    doc += '- Live-Preview zeigt kombinierten Text\n';
    doc += '- "Weiter"\n\n';
    
    doc += '**SCHRITT 5: Preview & Erstellen**\n';
    doc += '- UI: HTML-Vorschau des Dokuments (wie PDF aussehen wird)\n';
    doc += '- Alle Platzhalter bereits ersetzt\n';
    doc += '- Buttons:\n';
    doc += '  - "Zurück" → Änderungen möglich\n';
    doc += '  - "Dokument erstellen" → Finale Generierung\n';
    doc += '- Bei Klick auf "Erstellen":\n';
    doc += '  1. Document Entity erstellen (status="erstellt")\n';
    doc += '  2. Backend-Call: generatePDF({ html })\n';
    doc += '  3. Progress-Spinner anzeigen (~3 Sekunden)\n';
    doc += '  4. Success: "Dokument erfolgreich erstellt"\n';
    doc += '  5. Redirect zu Document-Detailansicht\n\n';
    
    doc += '### 11.3 Nach Generierung\n\n';
    doc += '**Aktionen auf Document-Detail**:\n';
    doc += '- 👁️ Vorschau (PDF im Browser öffnen)\n';
    doc += '- ⬇️ Download (PDF herunterladen)\n';
    doc += '- ✉️ Per E-Mail senden (Dialog mit Empfänger-Auswahl)\n';
    doc += '- 📮 Per Post versenden (zu Workflow 15)\n';
    doc += '- ✏️ Status ändern (zu_erledigen → erstellt → versendet → unterschrieben)\n';
    doc += '- 🗑️ Löschen (nur wenn nicht versendet)\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 12: E-MAIL EMPFANGEN & AUTOMATISCH VERARBEITEN\n\n';
    
    doc += '### 12.1 Workflow-Identifikation\n\n';
    doc += '- **Workflow-Name**: Intelligente E-Mail-Verarbeitung\n';
    doc += '- **Hauptziel**: E-Mails automatisch in Tasks umwandeln\n';
    doc += '- **Häufigkeit**: Automatisch (Scheduled Task)\n';
    doc += '- **Komplexität**: ⭐⭐⭐ Komplex (KI-gestützt)\n';
    doc += '- **Dauer**: Automatisch im Hintergrund\n\n';
    
    doc += '### 12.2 Setup (einmalig)\n\n';
    doc += '**SCHRITT 1**: Navigation zu "Kommunikation" → Tab "Emails"\n';
    doc += '**SCHRITT 2**: Sub-Tab "Einstellungen"\n';
    doc += '**SCHRITT 3**: Klick "E-Mail-Konto hinzufügen"\n';
    doc += '**SCHRITT 4**: IMAPAccountForm\n';
    doc += '| Feld | Beispiel |\n';
    doc += '|------|----------|\n';
    doc += '| Name | "Verwaltung Hauptkonto" |\n';
    doc += '| E-Mail | "verwaltung@example.com" |\n';
    doc += '| IMAP-Server | "imap.gmail.com" |\n';
    doc += '| IMAP-Port | 993 |\n';
    doc += '| Benutzername | "verwaltung@example.com" |\n';
    doc += '| Passwort | "***" (verschlüsselt gespeichert) |\n';
    doc += '| SSL | ✅ Ja (Checkbox) |\n';
    doc += '| KI-Analyse aktivieren | ✅ Ja (Opt-in!) |\n\n';
    doc += '**SCHRITT 5**: "Verbindung testen"\n';
    doc += '- System versucht IMAP-Login\n';
    doc += '- Bei Erfolg: ✅ "Verbindung erfolgreich"\n';
    doc += '- Bei Fehler: ❌ "Login fehlgeschlagen - Zugangsdaten prüfen"\n';
    doc += '**SCHRITT 6**: Speichern\n\n';
    
    doc += '### 12.3 Automatischer Ablauf (Scheduled Task)\n\n';
    doc += '**Funktion**: syncEmails (läuft alle 15 Minuten)\n\n';
    doc += '```javascript\n';
    doc += '// 1. Alle aktiven IMAP-Konten abrufen\n';
    doc += 'const accounts = await IMAPAccount.filter({ is_active: true });\n';
    doc += '\n';
    doc += 'for (const account of accounts) {\n';
    doc += '  // 2. IMAP-Verbindung herstellen\n';
    doc += '  const connection = await imap.connect(account);\n';
    doc += '  \n';
    doc += '  // 3. Neue E-Mails abrufen (seit last_sync)\n';
    doc += '  const emails = await connection.search(["UNSEEN"]);\n';
    doc += '  \n';
    doc += '  for (const email of emails) {\n';
    doc += '    // 4. E-Mail speichern\n';
    doc += '    const savedEmail = await Email.create({\n';
    doc += '      subject: email.subject,\n';
    doc += '      sender_email: email.from,\n';
    doc += '      sender_name: email.fromName,\n';
    doc += '      received_date: email.date,\n';
    doc += '      body_text: email.text,\n';
    doc += '      body_html: email.html,\n';
    doc += '      attachments: email.attachments,\n';
    doc += '      imap_account_id: account.id,\n';
    doc += '      is_processed: false\n';
    doc += '    });\n';
    doc += '    \n';
    doc += '    // 5. KI-Analyse (falls aktiviert)\n';
    doc += '    if (account.ai_analysis_enabled) {\n';
    doc += '      const analysis = await analyzeEmailForTask({\n';
    doc += '        email_id: savedEmail.id\n';
    doc += '      });\n';
    doc += '      \n';
    doc += '      // 6. Task-Vorschlag speichern\n';
    doc += '      await Email.update(savedEmail.id, {\n';
    doc += '        ai_suggested_task: analysis.suggested_task\n';
    doc += '      });\n';
    doc += '    }\n';
    doc += '  }\n';
    doc += '}\n';
    doc += '```\n\n';
    
    doc += '### 12.4 User-Interaktion mit analysierten E-Mails\n\n';
    doc += '**SCHRITT 1**: User öffnet "Kommunikation" → "Emails"\n';
    doc += '**SCHRITT 2**: Liste zeigt neue E-Mails mit KI-Vorschlag\n';
    doc += '- UI: E-Mail-Karte mit Badge "✨ Task-Vorschlag"\n';
    doc += '- Klick öffnet Detail-View\n';
    doc += '**SCHRITT 3**: KI-Vorschlag anzeigen\n';
    doc += '```\n';
    doc += 'Von: mieter@example.com\n';
    doc += 'Betreff: Heizung defekt in Whg. 3\n';
    doc += '\n';
    doc += '✨ VORGESCHLAGENER TASK:\n';
    doc += '├ Titel: "Heizungsreparatur Whg. 3 beauftragen"\n';
    doc += '├ Priorität: Hoch\n';
    doc += '├ Fällig: 3 Tage\n';
    doc += '├ Zugeordnet: Whg. 3, Mieter: Klaus Schmidt\n';
    doc += '└ Nächste Aktion: "Handwerker kontaktieren"\n';
    doc += '```\n';
    doc += '**SCHRITT 4**: Buttons\n';
    doc += '- "Task erstellen" → Task wird mit Vorschlag erstellt, Email.has_task = true\n';
    doc += '- "Bearbeiten & erstellen" → Task-Formular öffnet sich (vorausgefüllt)\n';
    doc += '- "Ignorieren" → Email bleibt ohne Task\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 13: AUFGABE ERSTELLEN & WORKFLOW TRIGGERN\n\n';
    
    doc += '### 13.1 Manuelle Task-Erstellung\n\n';
    doc += '**SCHRITT 1**: Navigation zu "Aufgaben"\n';
    doc += '**SCHRITT 2**: Klick "Neue Aufgabe"\n';
    doc += '**SCHRITT 3**: TaskForm\n';
    doc += '| Feld | Pflicht | Typ | Beispiel |\n';
    doc += '|------|---------|-----|----------|\n';
    doc += '| Titel | ✅ | Text | "Heizung reparieren" |\n';
    doc += '| Beschreibung | ❌ | Textarea | "Mieter meldet defekte Heizung..." |\n';
    doc += '| Priorität | ✅ | Dropdown | "Hoch" |\n';
    doc += '| Fälligkeitsdatum | ❌ | Datum | 10.01.2024 |\n';
    doc += '| Status | Auto | - | "offen" |\n';
    doc += '| Zugeordnetes Objekt | ❌ | Dropdown | "Hauptstraße 1" |\n';
    doc += '| Zugeordnete Wohnung | ❌ | Dropdown | "Whg. 3" |\n';
    doc += '| Zugeordneter Mieter | ❌ | Dropdown | "Klaus Schmidt" |\n';
    doc += '| Verknüpftes Dokument | ❌ | Dropdown | - |\n\n';
    
    doc += '### 13.2 Workflow-Trigger\n\n';
    doc += '**Wenn Task gespeichert wird**:\n';
    doc += '```javascript\n';
    doc += '// System prüft: Gibt es passenden Workflow?\n';
    doc += 'const workflows = await Workflow.filter({\n';
    doc += '  document_type: task.document_type,\n';
    doc += '  is_active: true\n';
    doc += '});\n';
    doc += '\n';
    doc += 'if (workflows.length > 0) {\n';
    doc += '  const workflow = workflows[0];\n';
    doc += '  task.workflow_id = workflow.id;\n';
    doc += '  \n';
    doc += '  // Ersten Workflow-Schritt starten\n';
    doc += '  const firstStep = await WorkflowStep.filter({\n';
    doc += '    workflow_id: workflow.id,\n';
    doc += '    step_order: 1\n';
    doc += '  });\n';
    doc += '  \n';
    doc += '  // Aktion ausführen (z.B. Dokument erstellen)\n';
    doc += '  await executeWorkflowStep(firstStep, task);\n';
    doc += '}\n';
    doc += '```\n\n';
    
    doc += '### 13.3 Workflow-Fortschritt\n\n';
    doc += '- Task-Detail zeigt: "📋 Workflow: Mieterhöhungsprozess (Schritt 2/5)"\n';
    doc += '- Buttons:\n';
    doc += '  - "Schritt abschließen" → Nächster Step\n';
    doc += '  - "Workflow abbrechen" → Task wird normaler Task\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 14: BANKKONTO VERBINDEN (FinAPI)\n\n';
    
    doc += '### 14.1 Workflow-Identifikation\n\n';
    doc += '- **Workflow-Name**: Multi-Banking Setup\n';
    doc += '- **Hauptziel**: Automatischer Transaktionsimport einrichten\n';
    doc += '- **Komplexität**: ⭐⭐ Mittel\n';
    doc += '- **Dauer**: 5-10 Minuten (erstmalig), 2 Min (weitere Konten)\n\n';
    
    doc += '### 14.2 Schritt-für-Schritt\n\n';
    
    doc += '**SCHRITT 1**: Navigation zu "Bank/Kasse"\n';
    doc += '**SCHRITT 2**: Klick "Bankkonto verbinden"\n';
    doc += '**SCHRITT 3**: FinAPI-Dialog öffnet sich\n';
    doc += '- Info-Text: "Über FinAPI können Sie Ihre Bankkonten sicher verbinden"\n';
    doc += '- Button "Mit FinAPI verbinden"\n\n';
    doc += '**SCHRITT 4**: FinAPI Web Form (externe Seite)\n';
    doc += '- User wird zu FinAPI weitergeleitet\n';
    doc += '- Bank auswählen aus Liste (>4000 deutsche Banken)\n';
    doc += '- Online-Banking Zugangsdaten eingeben\n';
    doc += '- Optional: TAN-Verfahren (SMS, App, etc.)\n';
    doc += '- FinAPI holt Kontoliste\n';
    doc += '- User wählt Konten aus (Multi-Select)\n';
    doc += '- "Verbindung herstellen"\n\n';
    
    doc += '**SCHRITT 5**: Rücksprung zur App\n';
    doc += '**SCHRITT 6**: System importiert Konten\n';
    doc += '```javascript\n';
    doc += 'const response = await base44.functions.invoke("finapiImportAccounts", {\n';
    doc += '  connection_id: finapi_connection_id\n';
    doc += '});\n';
    doc += '\n';
    doc += '// Pro Konto\n';
    doc += 'for (const account of response.data.accounts) {\n';
    doc += '  await BankAccount.create({\n';
    doc += '    name: account.accountName,\n';
    doc += '    iban: account.iban,\n';
    doc += '    current_balance: account.balance,\n';
    doc += '    finapi_connection_id: connection_id,\n';
    doc += '    finapi_user_id: user_id\n';
    doc += '  });\n';
    doc += '}\n';
    doc += '```\n\n';
    
    doc += '**SCHRITT 7**: Erste Synchronisation\n';
    doc += '- Dialog: "Transaktionen der letzten 90 Tage importieren?"\n';
    doc += '- Bei JA:\n';
    doc += '  ```javascript\n';
    doc += '  await base44.functions.invoke("finapiSync", {\n';
    doc += '    account_id: account.id\n';
    doc += '  });\n';
    doc += '  ```\n';
    doc += '- Import läuft (~10-30 Sekunden)\n';
    doc += '- Success: "142 Transaktionen importiert"\n\n';
    
    doc += '### 14.3 Automatische Synchronisation\n\n';
    doc += '- Scheduled Task: Täglich um 6:00 Uhr\n';
    doc += '- Funktion: finapiSync (für alle verbundenen Konten)\n';
    doc += '- PSD2-Limit: Max. 4x pro Tag\n';
    doc += '- Bei Fehler (z.B. Session abgelaufen):\n';
    doc += '  - Notification erstellen: "Bankkonto neu verbinden"\n';
    doc += '  - User muss TAN erneut eingeben (90-Tage-Regel)\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 15: BRIEF PER POST VERSENDEN (LetterXpress)\n\n';
    
    doc += '### 15.1 Workflow-Identifikation\n\n';
    doc += '- **Workflow-Name**: Postversand mit Tracking\n';
    doc += '- **Hauptziel**: Dokument rechtssicher per Post zustellen\n';
    doc += '- **Häufigkeit**: Mehrmals pro Woche\n';
    doc += '- **Komplexität**: ⭐ Einfach\n';
    doc += '- **Dauer**: 2 Minuten\n\n';
    
    doc += '### 15.2 Schritt-für-Schritt\n\n';
    
    doc += '**SCHRITT 1**: Dokument in Liste → Klick 📮-Icon "Per Post versenden"\n';
    doc += '**SCHRITT 2**: SendLetterDialog öffnet sich\n';
    doc += '**UI-Anzeige**:\n';
    doc += '```\n';
    doc += '┌──────────────────────────────────────────┐\n';
    doc += '│ Brief per Post versenden                 │\n';
    doc += '├──────────────────────────────────────────┤\n';
    doc += '│ Dokument: Mieterhöhung 2024 - Whg. 3     │\n';
    doc += '│ Empfänger: Klaus Schmidt                 │\n';
    doc += '│ Adresse: Beispielweg 5, 54321 Hamburg    │\n';
    doc += '│ Seiten: 2                                │\n';
    doc += '│                                          │\n';
    doc += '│ Versandoptionen:                         │\n';
    doc += '│ ○ Normal (Standard-Brief)                │\n';
    doc += '│ ● Einschreiben Einwurf (R1) +3,69€      │\n';
    doc += '│ ○ Einschreiben (R2) +4,05€              │\n';
    doc += '│                                          │\n';
    doc += '│ ☐ Farbdruck (+0,10€/Seite)              │\n';
    doc += '│ ☐ Duplex (beidseitig)                   │\n';
    doc += '│                                          │\n';
    doc += '│ Kosten: 4,49€ (netto: 3,77€)            │\n';
    doc += '│ Guthaben: 142,50€                        │\n';
    doc += '│                                          │\n';
    doc += '│ [Abbrechen]  [Jetzt versenden]          │\n';
    doc += '└──────────────────────────────────────────┘\n';
    doc += '```\n\n';
    
    doc += '**SCHRITT 3**: User wählt Versandart (Radio-Buttons)\n';
    doc += '- Bei Änderung: Live-Berechnung der Kosten\n';
    doc += '- calculatePrice API-Call im Hintergrund\n\n';
    
    doc += '**SCHRITT 4**: "Jetzt versenden" klicken\n';
    doc += '**Validierung**:\n';
    doc += '- Guthaben ausreichend?\n';
    doc += '  - ❌ Falls NEIN: "Guthaben aufladen unter Einstellungen"\n';
    doc += '- Empfängeradresse vollständig?\n';
    doc += '  - ❌ Falls NEIN: "Adresse vervollständigen"\n\n';
    
    doc += '**SCHRITT 5**: Versand-Prozess (Backend)\n';
    doc += '```javascript\n';
    doc += '// 1. PDF von Storage laden\n';
    doc += 'const pdfResponse = await fetch(document.pdf_url);\n';
    doc += 'const pdfBuffer = await pdfResponse.arrayBuffer();\n';
    doc += '\n';
    doc += '// 2. Base64 encoden\n';
    doc += 'const base64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));\n';
    doc += '\n';
    doc += '// 3. Checksum berechnen (SHA-256, 32 Zeichen)\n';
    doc += 'const checksum = await crypto.subtle.digest("SHA-256", pdfBuffer);\n';
    doc += 'const checksumHex = Array.from(new Uint8Array(checksum))\n';
    doc += '  .map(b => b.toString(16).padStart(2, "0"))\n';
    doc += '  .join("")\n';
    doc += '  .substring(0, 32);\n';
    doc += '\n';
    doc += '// 4. LetterXpress API-Call\n';
    doc += 'const lxResponse = await axios.post("https://api.letterxpress.de/v1/send", {\n';
    doc += '  auth: { username, apikey },\n';
    doc += '  letter: {\n';
    doc += '    base64_file: base64,\n';
    doc += '    base64_checksum: checksumHex,\n';
    doc += '    specification: { color: "1", mode: "simplex", ship: "national" },\n';
    doc += '    attaching: { send: "r1" }\n';
    doc += '  }\n';
    doc += '});\n';
    doc += '\n';
    doc += '// 5. LetterShipment speichern\n';
    doc += 'await LetterShipment.create({\n';
    doc += '  lxp_job_id: lxResponse.data.job.id,\n';
    doc += '  document_id: document.id,\n';
    doc += '  status: "queue",\n';
    doc += '  cost_net: lxResponse.data.job.price.net,\n';
    doc += '  cost_gross: lxResponse.data.job.price.gross,\n';
    doc += '  pages: document.seitenanzahl,\n';
    doc += '  shipping_type: "r1",\n';
    doc += '  recipient_name: document.recipient_name,\n';
    doc += '  recipient_address: document.recipient_address\n';
    doc += '});\n';
    doc += '\n';
    doc += '// 6. Document aktualisieren\n';
    doc += 'await Document.update(document.id, {\n';
    doc += '  versandstatus: "in_versand",\n';
    doc += '  lxp_job_id: lxResponse.data.job.id\n';
    doc += '});\n';
    doc += '```\n\n';
    
    doc += '**SCHRITT 6**: Success-Meldung\n';
    doc += '- Toast: "✅ Brief erfolgreich versendet (Job-ID: 12345678)"\n';
    doc += '- Dokument-Status: "versendet"\n';
    doc += '- Tracking: Wird täglich automatisch aktualisiert\n\n';
    
    doc += '### 15.3 Tracking-Updates (Automatisch)\n\n';
    doc += '**Scheduled Task**: updateLetterTrackingCodes (täglich 8:00 Uhr, Admin-only)\n\n';
    doc += '```javascript\n';
    doc += '// Alle Sendungen mit status != "sent"\n';
    doc += 'const shipments = await LetterShipment.filter({\n';
    doc += '  status: { $in: ["queue", "hold", "done"] }\n';
    doc += '});\n';
    doc += '\n';
    doc += 'for (const shipment of shipments) {\n';
    doc += '  const jobStatus = await letterxpress.getJob(shipment.lxp_job_id);\n';
    doc += '  \n';
    doc += '  await LetterShipment.update(shipment.id, {\n';
    doc += '    status: jobStatus.status,\n';
    doc += '    tracking_code: jobStatus.tracking_code,\n';
    doc += '    dispatch_date: jobStatus.dispatch_date\n';
    doc += '  });\n';
    doc += '  \n';
    doc += '  if (jobStatus.status === "sent") {\n';
    doc += '    await Document.update(shipment.document_id, {\n';
    doc += '      versandstatus: "versendet",\n';
    doc += '      versandt_am: new Date()\n';
    doc += '    });\n';
    doc += '  }\n';
    doc += '}\n';
    doc += '```\n\n';
    
    doc += '**User-Benachrichtigung**:\n';
    doc += '- Notification: "📬 Brief wurde zugestellt (Tracking: 1234567890DE)"\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 16: MASSENÄNDERUNG DURCHFÜHREN\n\n';
    
    doc += '### 16.1 Beispiel: Alle Vorauszahlungen anpassen\n\n';
    doc += '**SCHRITT 1**: Mieter-Liste → Bulk-Select (Checkboxen)\n';
    doc += '**SCHRITT 2**: Mehrere Verträge auswählen\n';
    doc += '**SCHRITT 3**: Bulk-Actions Dropdown: "Vorauszahlungen anpassen"\n';
    doc += '**SCHRITT 4**: Dialog mit Optionen:\n';
    doc += '- ○ Prozentual erhöhen (+X%)\n';
    doc += '- ○ Absoluten Betrag hinzufügen (+X€)\n';
    doc += '- ● Neue Werte setzen\n';
    doc += '**SCHRITT 5**: Werte eingeben\n';
    doc += '- Nebenkosten neu: 165,00 € (statt 150,00 €)\n';
    doc += '**SCHRITT 6**: Vorschau anzeigen (Tabelle)\n';
    doc += '| Vertrag | Alt | Neu | Differenz |\n';
    doc += '|---------|-----|-----|----------|\n';
    doc += '| Whg. 1  | 150€| 165€| +15€     |\n';
    doc += '| Whg. 2  | 150€| 165€| +15€     |\n';
    doc += '| Whg. 3  | 150€| 165€| +15€     |\n';
    doc += '**SCHRITT 7**: "Alle aktualisieren" → Backend-Call\n';
    doc += '```javascript\n';
    doc += 'await base44.functions.invoke("bulkUpdateFinancialItems", {\n';
    doc += '  contract_ids: [id1, id2, id3],\n';
    doc += '  updates: { utilities: 165 }\n';
    doc += '});\n';
    doc += '```\n';
    doc += '**Ergebnis**: 3x LeaseContract aktualisiert (mit Versionierung!)\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 17: DATEN EXPORTIEREN\n\n';
    
    doc += '### 17.1 Varianten\n\n';
    
    doc += '#### VARIANTE A: CSV-Export (Transaktionen)\n\n';
    doc += '**SCHRITT 1**: Bank/Kasse → Transaktions-Liste\n';
    doc += '**SCHRITT 2**: Filter setzen (Zeitraum, Konto, Kategorie)\n';
    doc += '**SCHRITT 3**: Button "Exportieren" → Dropdown\n';
    doc += '- CSV (Excel-kompatibel)\n';
    doc += '- PDF (Übersicht)\n';
    doc += '- JSON (für Entwickler)\n';
    doc += '**SCHRITT 4**: CSV wählen\n';
    doc += '**Download**: transactions_2024.csv\n';
    doc += '**Inhalt**: Datum, Betrag, Verwendungszweck, Kategorie, Status\n\n';
    
    doc += '#### VARIANTE B: Anlage V Export\n\n';
    doc += '**SCHRITT 1**: Steuerformulare → Anlage V Detail\n';
    doc += '**SCHRITT 2**: Button "Als PDF exportieren"\n';
    doc += '**SCHRITT 3**: Backend generiert PDF (exportAnlageVPDF)\n';
    doc += '**SCHRITT 4**: Download startet automatisch\n\n';
    
    doc += '#### VARIANTE C: Komplett-Export (alle Entwickler-Dokus)\n\n';
    doc += '**SCHRITT 1**: Entwickler-Doku → "Alle als ZIP"\n';
    doc += '**SCHRITT 2**: System erstellt ZIP-Archiv mit allen MD + JSON\n';
    doc += '**SCHRITT 3**: Download: app-dokumentation-2024-01-07.zip\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 18: REPORTING / AUSWERTUNG ERSTELLEN\n\n';
    
    doc += '### 18.1 Dashboard-Auswertungen (Automatisch)\n\n';
    doc += '**Seite**: Dashboard (Startseite)\n';
    doc += '**Anzeige**:\n';
    doc += '- Statistik-Karten:\n';
    doc += '  - Anzahl Gebäude\n';
    doc += '  - Anzahl Einheiten (vermietet / frei)\n';
    doc += '  - Mieteinnahmen (Monat / Jahr)\n';
    doc += '  - Offene Buchungen (Betrag)\n';
    doc += '- Charts:\n';
    doc += '  - Einnahmen vs. Ausgaben (12 Monate)\n';
    doc += '  - Vermietungsquote\n';
    doc += '  - Offene Zahlungen Timeline\n';
    doc += '- Recent Activity Feed\n';
    doc += '**Datenquelle**: Echtzeit-Aggregationen aus DB\n\n';
    
    doc += '### 18.2 Custom Reports\n\n';
    doc += '**SCHRITT 1**: Navigation zu "Analytics" (falls implementiert)\n';
    doc += '**SCHRITT 2**: Report-Typ wählen:\n';
    doc += '- Mieteinnahmen-Report\n';
    doc += '- Kosten-Report (nach Kategorie)\n';
    doc += '- Cashflow-Analyse\n';
    doc += '- Steuer-Report (Anlage V Vorschau)\n';
    doc += '**SCHRITT 3**: Filter setzen (Zeitraum, Gebäude, etc.)\n';
    doc += '**SCHRITT 4**: "Report erstellen"\n';
    doc += '**SCHRITT 5**: Interactive Charts anzeigen (Recharts)\n';
    doc += '**SCHRITT 6**: Export-Optionen:\n';
    doc += '- Als PDF (mit Charts als Bilder)\n';
    doc += '- Als Excel (Rohdaten)\n';
    doc += '- Per E-Mail versenden\n\n';
    
    doc += '---\n\n';
    
    doc += '## ZUSAMMENFASSUNG: WORKFLOW-KOMPLEXITÄT\n\n';
    doc += '| Workflow | Komplexität | Dauer | Häufigkeit | Automation |\n';
    doc += '|----------|-------------|-------|------------|------------|\n';
    doc += '| Objekt anlegen | ⭐⭐⭐ | 15 Min | Selten | Teilweise |\n';
    doc += '| Eigentümer anlegen | ⭐⭐ | 5 Min | Selten | Nein |\n';
    doc += '| Eigentümerwechsel | ⭐⭐ | 5 Min | Sehr selten | Teilweise |\n';
    doc += '| Mietvertrag | ⭐⭐⭐ | 8 Min | Häufig | Ja (Buchungen) |\n';
    doc += '| Mieter Ein-/Auszug | ⭐⭐ | 10 Min | Häufig | Teilweise |\n';
    doc += '| Rechnung erfassen (manuell) | ⭐ | 2 Min | Häufig | Nein |\n';
    doc += '| Rechnung erfassen (KI) | ⭐ | 30 Sek | Häufig | Ja (KI) |\n';
    doc += '| Beleg kategorisieren | ⭐⭐ | 1 Min | Häufig | Teilweise |\n';
    doc += '| Betriebskosten | ⭐⭐⭐⭐ | 45 Min | Jährlich | Ja (Berechnung) |\n';
    doc += '| Anlage V | ⭐⭐⭐⭐ | 15 Min | Jährlich | Ja (Berechnung) |\n';
    doc += '| Eigentümerabrechnung | ⭐⭐⭐ | 20 Min | Jährlich | Ja |\n';
    doc += '| Dokument erstellen | ⭐⭐ | 4 Min | Häufig | Ja (PDF) |\n';
    doc += '| E-Mail verarbeiten | - | Auto | Laufend | Voll auto |\n';
    doc += '| Task erstellen | ⭐ | 1 Min | Täglich | Optional (KI) |\n';
    doc += '| Bank verbinden | ⭐⭐ | 8 Min | Einmalig | Ja (Sync) |\n';
    doc += '| Post versenden | ⭐ | 2 Min | Häufig | Ja (Tracking) |\n';
    doc += '| Massenänderung | ⭐⭐ | 3 Min | Selten | Nein |\n';
    doc += '| Daten exportieren | ⭐ | 1 Min | Monatlich | Nein |\n';
    doc += '| Reporting | ⭐ | 2 Min | Wöchentlich | Ja (Auto) |\n\n';
    
    doc += '---\n\n';
    
    doc += '## HÄUFIGE USER-FEHLER & LÖSUNGEN\n\n';
    
    doc += '### ❌ "Kann Vertrag nicht speichern"\n';
    doc += '**Ursache**: Wohnung bereits vermietet\n';
    doc += '**Lösung**: Alten Vertrag beenden oder andere Wohnung wählen\n\n';
    
    doc += '### ❌ "Buchungen werden nicht generiert"\n';
    doc += '**Ursache**: BuildingTaxLibrary fehlt\n';
    doc += '**Lösung**: Steuerliche Bibliothek initialisieren (Building Detail → Finanzen)\n\n';
    
    doc += '### ❌ "PDF-Generierung schlägt fehl"\n';
    doc += '**Ursache 1**: Empfängeradresse fehlt\n';
    doc += '**Lösung**: Tenant-Daten vervollständigen\n';
    doc += '**Ursache 2**: Template ungültig (Platzhalter-Fehler)\n';
    doc += '**Lösung**: Template prüfen oder anderes Template wählen\n\n';
    
    doc += '### ❌ "LetterXpress Versand fehlgeschlagen"\n';
    doc += '**Ursache 1**: Kein Guthaben\n';
    doc += '**Lösung**: Guthaben aufladen (Link in Fehlermeldung)\n';
    doc += '**Ursache 2**: Empfängeradresse unvollständig\n';
    doc += '**Lösung**: Adresse muss PLZ + Ort enthalten\n\n';
    
    doc += '### ⚠️ "Anlage V zeigt Verlust > Einnahmen"\n';
    doc += '**Ursache**: Hohe Werbungskosten (z.B. Sanierung)\n';
    doc += '**Hinweis**: Steuerlich OK, aber ggf. Liebhaberei-Prüfung durch Finanzamt\n';
    doc += '**Tipp**: Herstellungskosten auf AfA umbuchen (15%-Regel prüfen)\n\n';
    
    doc += '### ⚠️ "FinAPI fordert erneute TAN-Eingabe"\n';
    doc += '**Ursache**: PSD2 90-Tage-Regel\n';
    doc += '**Lösung**: Bankkonto neu verbinden (TAN eingeben) → Automatisch alle 90 Tage\n\n';
    
    doc += '---\n\n';
    
    doc += '## BEST PRACTICES\n\n';
    
    doc += '### ✅ Datenqualität\n';
    doc += '1. **Sofort vollständig erfassen**: Alle Pflichtfelder bei Ersterfassung ausfüllen\n';
    doc += '2. **Adressen komplett**: Immer Straße + Hausnummer + PLZ + Ort (wichtig für Post!)\n';
    doc += '3. **Vorauszahlungen hinterlegen**: Essentiell für korrekte NK-Abrechnung\n\n';
    
    doc += '### ✅ Steuerliche Korrektheit\n';
    doc += '1. **Tax Library initialisieren**: IMMER bei neuem Gebäude\n';
    doc += '2. **Rechnungen sofort kategorisieren**: Nicht auf Jahresende warten\n';
    doc += '3. **15%-Regel beachten**: Große Reparaturen als Herstellung behandeln\n';
    doc += '4. **AfA-Plan erstellen**: Bei Kauf sofort, nicht erst bei Steuererklärung\n\n';
    
    doc += '### ✅ Dokumenten-Versand\n';
    doc += '1. **Rechtssicherheit**: Mieterhöhungen, Kündigungen IMMER per Einschreiben (R1/R2)\n';
    doc += '2. **Kosten sparen**: Normale Abrechnungen können per Standard-Post\n';
    doc += '3. **Tracking nutzen**: Postausgangsbuch regelmäßig prüfen\n\n';
    
    doc += '### ✅ Workflows\n';
    doc += '1. **Reihenfolge beachten**: Erst Gebäude, dann Units, dann Verträge\n';
    doc += '2. **Historisierung nutzen**: Alte Versionen werden automatisch bewahrt\n';
    doc += '3. **Snapshots vertrauen**: Dokumente ändern sich nicht bei Datenänderung\n\n';
    
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