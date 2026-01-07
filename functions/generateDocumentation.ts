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

async function generateUserWorkflowsDoc(base44) {
    let doc = '# User-Workflows - Vollständige Prozess-Dokumentation\n\n';
    doc += '**Metadaten:**\n';
    doc += `- Generiert am: ${new Date().toLocaleString('de-DE')}\n`;
    doc += '- Verwendungszweck: KI-Assistent Kontextinformation\n\n';
    doc += '---\n\n';
    
    doc += '## Übersicht: 18 Haupt-Workflows\n\n';
    doc += '1. Neues Objekt anlegen\n';
    doc += '2. Neuen Eigentümer anlegen\n';
    doc += '3. Eigentümerwechsel durchführen\n';
    doc += '4. Mietvertrag erstellen\n';
    doc += '5. Mieter einziehen/ausziehen\n';
    doc += '6. Rechnung/Beleg erfassen\n';
    doc += '7. Beleg kategorisieren und zuordnen\n';
    doc += '8. Betriebskostenabrechnung erstellen\n';
    doc += '9. Anlage V generieren und prüfen\n';
    doc += '10. Eigentümerabrechnung erstellen\n';
    doc += '11. Dokument mit Template erstellen\n';
    doc += '12. E-Mail empfangen und verarbeiten\n';
    doc += '13. Aufgabe erstellen und Workflow triggern\n';
    doc += '14. Bankkonto verbinden (finAPI)\n';
    doc += '15. Brief per Post versenden (LetterXpress)\n';
    doc += '16. Massenänderung durchführen\n';
    doc += '17. Daten exportieren\n';
    doc += '18. Reporting/Auswertung erstellen\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 1: Neues Objekt anlegen\n\n';
    
    doc += '### 1.1 Identifikation\n\n';
    doc += '- **Workflow-Name**: Objekt-Erstanlage (Komplett)\n';
    doc += '- **Hauptziel**: Immobilie vollständig im System erfassen mit allen Stammdaten\n';
    doc += '- **User-Typ**: Verwalter, Admin\n';
    doc += '- **Häufigkeit**: Einmalig pro Objekt\n';
    doc += '- **Komplexität**: Mittel (ca. 15-30 Minuten)\n';
    doc += '- **Geschätzte Dauer**: 20 Minuten\n\n';
    
    doc += '### 1.2 Voraussetzungen\n\n';
    doc += '- ✅ User hat Berechtigung "Objekte verwalten"\n';
    doc += '- ℹ️ Eigentümer-Daten können parallel erfasst werden\n';
    doc += '- ℹ️ Kaufvertrag optional (für steuerliche Daten)\n\n';
    
    doc += '### 1.3 Schritt-für-Schritt Prozess\n\n';
    
    doc += '**SCHRITT 1: Navigation**\n';
    doc += '- **User-Aktion**: Klick auf "Objekte" im Hauptmenü\n';
    doc += '- **Seite**: `/Buildings`\n';
    doc += '- **Hintergrund**: Query lädt existierende Buildings\n';
    doc += '  ```javascript\n';
    doc += '  const { data: buildings } = useQuery({\n';
    doc += '    queryKey: ["buildings"],\n';
    doc += '    queryFn: () => base44.entities.Building.list()\n';
    doc += '  });\n';
    doc += '  ```\n';
    doc += '- **UI**: Building-Cards oder EmptyState (bei erstem Objekt)\n';
    doc += '- **Kann zurück?**: Ja (via Hauptmenü)\n\n';
    
    doc += '**SCHRITT 2: Objekt-Formular öffnen**\n';
    doc += '- **User-Aktion**: Klick auf "Objekt hinzufügen" Button (oben rechts, grün)\n';
    doc += '- **Dialog**: BuildingForm öffnet sich als Modal\n';
    doc += '- **Hintergrund**: Form initialisiert mit Leer-State\n';
    doc += '- **Felder angezeigt**:\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────┐\n';
    doc += '  │ Neues Gebäude anlegen           │\n';
    doc += '  ├─────────────────────────────────┤\n';
    doc += '  │ [Pflicht] Objektname            │ → "Hauptstraße 1"\n';
    doc += '  │ [Pflicht] Adresse               │ → "Hauptstraße 1"\n';
    doc += '  │ [Pflicht] PLZ                   │ → "10115"\n';
    doc += '  │ [Pflicht] Ort                   │ → "Berlin"\n';
    doc += '  │ [Optional] Objekttyp ▼          │ → Dropdown\n';
    doc += '  │ [Optional] Baujahr              │ → "1995"\n';
    doc += '  │ [Optional] Wohnfläche gesamt    │ → "400 m²"\n';
    doc += '  │ [Optional] Anzahl Wohneinheiten │ → "6"\n';
    doc += '  │ [Optional] Grundstücksfläche    │ → "500 m²"\n';
    doc += '  ├─────────────────────────────────┤\n';
    doc += '  │ [Abbrechen]  [Speichern]        │\n';
    doc += '  └─────────────────────────────────┘\n';
    doc += '  ```\n\n';
    
    doc += '**Objekttyp-Optionen (Dropdown)**:\n';
    doc += '- Einfamilienhaus\n';
    doc += '- Mehrfamilienhaus (Standard)\n';
    doc += '- Gewerbe\n';
    doc += '- Gemischt (Wohnen + Gewerbe)\n';
    doc += '- Grundstück\n\n';
    
    doc += '**SCHRITT 3: Pflichtfelder ausfüllen**\n';
    doc += '- **User-Aktion**: Eingabe in Textfelder\n';
    doc += '- **Validierungen (Live, während Eingabe)**:\n';
    doc += '  - ✅ Objektname: min. 3 Zeichen → "Mindestens 3 Zeichen"\n';
    doc += '  - ✅ PLZ: exakt 5 Ziffern → "PLZ muss 5 Ziffern haben"\n';
    doc += '  - ✅ Adresse: nicht leer → "Feld erforderlich"\n';
    doc += '  - ⚠️ Wohnfläche: plausibel (10-10.000 m²) → "Ungewöhnliche Größe"\n';
    doc += '- **Auto-Fill**: Keine (User muss alles manuell eingeben)\n';
    doc += '- **Hilfe-Texte (Tooltip bei Hover)**:\n';
    doc += '  - "Objektname wird in Listen und Reports angezeigt"\n';
    doc += '  - "Adresse muss exakt der Grundbuch-Adresse entsprechen"\n';
    doc += '  - "Wohnfläche nach Wohnflächenverordnung (WoFlV)"\n\n';
    
    doc += '**SCHRITT 4: Speichern**\n';
    doc += '- **User-Aktion**: Klick auf "Speichern" Button (grün, rechts unten)\n';
    doc += '- **Validierung vor Submit**:\n';
    doc += '  - ✅ BLOCKER: Alle Pflichtfelder ausgefüllt?\n';
    doc += '  - ✅ BLOCKER: PLZ valide (5 Ziffern)?\n';
    doc += '  - ⚠️ WARNING: "Keine Eigentümer hinterlegt - später nachtragen"\n';
    doc += '  - ⚠️ WARNING: Duplikat-Check: "Objekt mit dieser Adresse existiert bereits (ID: 123). Trotzdem anlegen?"\n';
    doc += '- **Hintergrund (Datenbank-Operation)**:\n';
    doc += '  ```javascript\n';
    doc += '  const building = await base44.entities.Building.create({\n';
    doc += '    name: "Hauptstraße 1",\n';
    doc += '    address: "Hauptstraße 1",\n';
    doc += '    zip_code: "10115",\n';
    doc += '    city: "Berlin",\n';
    doc += '    building_type: "Mehrfamilienhaus",\n';
    doc += '    construction_year: 1995,\n';
    doc += '    total_area: 400,\n';
    doc += '    number_of_units: 6,\n';
    doc += '    land_area: 500\n';
    doc += '  });\n';
    doc += '  // Automatisch gesetzt:\n';
    doc += '  // - id (UUID)\n';
    doc += '  // - created_date (now)\n';
    doc += '  // - created_by (user.email)\n';
    doc += '  ```\n';
    doc += '- **Erfolg**: Toast "✅ Objekt erfolgreich erstellt" (grün, oben rechts)\n';
    doc += '- **Navigation**: Automatischer Redirect zu `/BuildingDetail?id={building.id}`\n';
    doc += '- **Kann zurück?**: Ja (Dialog schließen = Speichern verwerfen)\n\n';
    
    doc += '**SCHRITT 5: Wohneinheiten anlegen**\n';
    doc += '- **Seite**: BuildingDetail (Tabs: Übersicht, Einheiten, Verträge, Eigentümer, Finanzen)\n';
    doc += '- **User-Aktion**: Tab "Einheiten" → Button "+ Einheit hinzufügen" (oben rechts)\n';
    doc += '- **Dialog**: UnitForm öffnet sich\n';
    doc += '- **Felder**:\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────┐\n';
    doc += '  │ Neue Wohneinheit                │\n';
    doc += '  ├─────────────────────────────────┤\n';
    doc += '  │ [Pflicht] Bezeichnung           │ → "Whg. 1.OG links"\n';
    doc += '  │ [Pflicht] Wohnfläche (m²)       │ → "65.5"\n';
    doc += '  │ [Optional] Räume (Anzahl)       │ → "3"\n';
    doc += '  │ [Optional] Stockwerk            │ → "1"\n';
    doc += '  │ [Optional] Balkon               │ → Checkbox\n';
    doc += '  │ [Optional] Keller               │ → Checkbox\n';
    doc += '  │ [Optional] Garage               │ → Checkbox\n';
    doc += '  │ [Optional] Sonstiges            │ → Freitext\n';
    doc += '  ├─────────────────────────────────┤\n';
    doc += '  │ [Abbrechen]  [Speichern]        │\n';
    doc += '  └─────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **Validierungen**:\n';
    doc += '  - ✅ Bezeichnung: min. 2 Zeichen\n';
    doc += '  - ✅ Wohnfläche: > 0 und < 1000 m²\n';
    doc += '  - ⚠️ Wohnfläche > Gesamt-Objektfläche? → Warnung\n';
    doc += '- **Hintergrund**:\n';
    doc += '  ```javascript\n';
    doc += '  await base44.entities.Unit.create({\n';
    doc += '    building_id: building.id,\n';
    doc += '    name: "Whg. 1.OG links",\n';
    doc += '    flaeche: 65.5,\n';
    doc += '    rooms: 3,\n';
    doc += '    floor: 1\n';
    doc += '  });\n';
    doc += '  ```\n';
    doc += '- **Erfolg**: Toast "Einheit erstellt"\n';
    doc += '- **Wiederholung**: User kann sofort weitere Einheiten anlegen (Dialog bleibt offen)\n';
    doc += '- **Tipp**: Bei Copy-Paste von mehreren Wohnungen: Bezeichnung hochzählen lassen\n\n';
    
    doc += '**SCHRITT 6: Eigentümer zuordnen**\n';
    doc += '- **User-Aktion**: Tab "Eigentümer" → Button "+ Eigentümer hinzufügen"\n';
    doc += '- **Optionen**:\n';
    doc += '  1. ⚪ Existierenden Eigentümer auswählen (Dropdown mit Suche)\n';
    doc += '  2. ⚪ Neuen Eigentümer anlegen → siehe Workflow 2\n';
    doc += '- **Bei Auswahl existierenden Eigentümers**:\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────┐\n';
    doc += '  │ Eigentümer zuordnen             │\n';
    doc += '  ├─────────────────────────────────┤\n';
    doc += '  │ [Pflicht] Eigentümer ▼          │ → Dropdown: "Max Mustermann (GbR)"\n';
    doc += '  │ [Pflicht] Anteil                │ → "50%" oder "1/2"\n';
    doc += '  │ [Optional] Von Datum            │ → "01.01.2020"\n';
    doc += '  │ [Optional] Bis Datum            │ → leer = aktuell\n';
    doc += '  ├─────────────────────────────────┤\n';
    doc += '  │ [Abbrechen]  [Zuordnen]         │\n';
    doc += '  └─────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **Validierung**:\n';
    doc += '  - ✅ BLOCKER: Summe aller Anteile = 100% → "Eigentümer-Anteile müssen 100% ergeben (aktuell: 80%)"\n';
    doc += '  - ⚠️ WARNING: Zeitliche Überschneidungen bei Eigentümerwechsel → "Überschneidung mit bestehendem Eigentümer"\n';
    doc += '- **Hintergrund**:\n';
    doc += '  ```javascript\n';
    doc += '  await base44.entities.OwnerRelationship.create({\n';
    doc += '    building_id: building.id,\n';
    doc += '    owner_id: owner.id,\n';
    doc += '    share_percentage: 50,\n';
    doc += '    valid_from: "2020-01-01",\n';
    doc += '    valid_until: null // aktuell\n';
    doc += '  });\n';
    doc += '  ```\n\n';
    
    doc += '**SCHRITT 7: Steuer-Bibliothek initialisieren (optional aber empfohlen)**\n';
    doc += '- **Trigger**: Automatischer Dialog beim ersten Speichern "Steuer-System für dieses Objekt einrichten?"\n';
    doc += '- **User-Aktion**: Klick auf "Ja, jetzt einrichten" oder "Später"\n';
    doc += '- **Formular (bei "Ja")**:\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────┐\n';
    doc += '  │ Steuer-System einrichten        │\n';
    doc += '  ├─────────────────────────────────┤\n';
    doc += '  │ [Pflicht] Rechtsform ▼          │\n';
    doc += '  │   ⚪ Privatperson                │\n';
    doc += '  │   ⚪ GbR                         │\n';
    doc += '  │   ⚪ GmbH                        │\n';
    doc += '  │                                 │\n';
    doc += '  │ [Pflicht] Kontenrahmen ▼        │\n';
    doc += '  │   ⚪ SKR03 (Prozessgliederung)  │\n';
    doc += '  │   ⚪ SKR04 (Abschlussgliederung)│\n';
    doc += '  ├─────────────────────────────────┤\n';
    doc += '  │ [Überspringen]  [Einrichten]    │\n';
    doc += '  └─────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **Hilfe-Text**: "Die Steuer-Bibliothek ermöglicht automatische Kategorisierung von Kosten"\n';
    doc += '- **Hintergrund (bei "Einrichten")**:\n';
    doc += '  ```javascript\n';
    doc += '  // Backend-Funktion\n';
    doc += '  const library = await base44.functions.invoke("loadTaxLibrary", {\n';
    doc += '    building_id: building.id,\n';
    doc += '    legal_form: "GBR",\n';
    doc += '    account_framework: "SKR04"\n';
    doc += '  });\n';
    doc += '  \n';
    doc += '  // Erstellt:\n';
    doc += '  // - 1x BuildingTaxLibrary\n';
    doc += '  // - ~50x CostCategory (Kopien der Master-Kategorien)\n';
    doc += '  // - Account-Mappings (Kategorie → SKR-Konto)\n';
    doc += '  ```\n';
    doc += '- **Dauer**: ~2-3 Sekunden\n';
    doc += '- **Ergebnis**: Toast "✅ Steuer-System bereit - 52 Kategorien initialisiert"\n\n';
    
    doc += '### 1.4 Entscheidungs-Punkte\n\n';
    doc += '**Entscheidung 1: Mit oder ohne Steuer-System?**\n';
    doc += '- WENN Steuer-System JA:\n';
    doc += '  → Rechtsform & Kontenrahmen wählen\n';
    doc += '  → Sofort automatische Kategorisierung verfügbar\n';
    doc += '  → Anlage V kann später direkt generiert werden\n';
    doc += '- WENN Steuer-System NEIN:\n';
    doc += '  → Später über BuildingDetail → "Steuer-System nachrüsten"\n';
    doc += '  → Keine automatische Kategorisierung\n';
    doc += '  → Manuelle Zuordnung erforderlich\n\n';
    
    doc += '**Entscheidung 2: Wohnungen jetzt oder später anlegen?**\n';
    doc += '- WENN jetzt:\n';
    doc += '  → Workflow geht weiter mit Schritt 5-6\n';
    doc += '  → Alle Einheiten sofort verfügbar für Vermietung\n';
    doc += '- WENN später:\n';
    doc += '  → User kann jederzeit zurück zu BuildingDetail\n';
    doc += '  → Objekt ist bereits im System aber nicht vermietbar\n\n';
    
    doc += '### 1.5 Automatismen\n\n';
    doc += '- **Automatisch berechnet**: \n';
    doc += '  - Gesamt-Wohnfläche = Summe aller Unit.flaeche\n';
    doc += '  - Anzahl Wohneinheiten (falls nicht eingegeben)\n';
    doc += '- **Automatisch erstellt**: \n';
    doc += '  - ActivityLog-Eintrag "Objekt erstellt"\n';
    doc += '  - Notification für Admins "Neues Objekt: Hauptstraße 1"\n';
    doc += '- **Automatisch gesetzt**:\n';
    doc += '  - created_by = aktueller User (user.email)\n';
    doc += '  - created_date = now()\n';
    doc += '  - id = UUID (automatisch generiert)\n\n';
    
    doc += '### 1.6 Ausgabe/Ergebnis\n\n';
    doc += '**Neue Datensätze in Datenbank**:\n';
    doc += '- 1x Building\n';
    doc += '- Nx Unit (N = Anzahl Wohnungen, z.B. 6)\n';
    doc += '- Mx OwnerRelationship (M = Anzahl Eigentümer, z.B. 2)\n';
    doc += '- Optional: 1x BuildingTaxLibrary + ~50x CostCategory\n';
    doc += '- 1x ActivityLog ("building_created")\n';
    doc += '- Optional: 1x Notification\n\n';
    doc += '**Dokumente**: Keine (optional Objektdatenblatt generierbar über Dokumente-Modul)\n\n';
    doc += '**Benachrichtigungen**: \n';
    doc += '- Toast für User: "Objekt erstellt"\n';
    doc += '- System-Notification für Admins\n\n';
    doc += '**Getriggerte Workflows**: Keine automatischen Follow-up-Workflows\n\n';
    
    doc += '### 1.7 Fehlerszenarien\n\n';
    doc += '**Fehler 1: Duplikat-Prüfung**\n';
    doc += '- **Trigger**: System findet Building mit gleicher Adresse\n';
    doc += '- **Dialog**: \n';
    doc += '  ```\n';
    doc += '  ⚠️ Mögliches Duplikat gefunden!\n';
    doc += '  \n';
    doc += '  Objekt "Hauptstraße 1" existiert bereits (erstellt am 12.05.2023).\n';
    doc += '  \n';
    doc += '  Trotzdem anlegen?\n';
    doc += '  [Nein, abbrechen]  [Ja, trotzdem anlegen]\n';
    doc += '  ```\n';
    doc += '- **User kann**: Abbrechen (zurück zu Formular) oder fortfahren\n';
    doc += '- **Fallback**: Bei Fortfahren → 2. Objekt mit gleicher Adresse wird erstellt\n\n';
    
    doc += '**Fehler 2: Netzwerk-Fehler beim Speichern**\n';
    doc += '- **Ursache**: API-Call schlägt fehl (Timeout, Server-Fehler)\n';
    doc += '- **User-Benachrichtigung**: Toast "❌ Speichern fehlgeschlagen - bitte erneut versuchen"\n';
    doc += '- **Verhalten**: \n';
    doc += '  - Daten bleiben im Formular erhalten\n';
    doc += '  - Automatischer Retry nach 3 Sekunden (max. 3 Versuche)\n';
    doc += '  - Bei permanentem Fehler: "Server nicht erreichbar - später erneut versuchen"\n';
    doc += '- **Rollback**: Keine Daten in DB geschrieben\n\n';
    
    doc += '**Fehler 3: Eigentümer-Anteile ergeben nicht 100%**\n';
    doc += '- **Trigger**: User versucht Eigentümer mit Anteilen 50% + 30% zu speichern\n';
    doc += '- **Reaktion**: BLOCKER-Meldung (rot)\n';
    doc += '  ```\n';
    doc += '  ❌ Eigentümer-Anteile müssen 100% ergeben\n';
    doc += '  Aktuell: 80%\n';
    doc += '  Fehlend: 20%\n';
    doc += '  ```\n';
    doc += '- **Button "Speichern" deaktiviert** bis korrigiert\n';
    doc += '- **User muss**: Anteile anpassen (z.B. zweiten Eigentümer auf 50% setzen)\n\n';
    
    doc += '### 1.8 Beispiel-Durchlauf (Konkretes Beispiel)\n\n';
    doc += '```\n';
    doc += 'BEISPIEL-OBJEKT:\n';
    doc += '─────────────────────────────────────────────────────\n';
    doc += 'Objekttyp: Mehrfamilienhaus\n';
    doc += 'Name: "Hauptstraße 1, Berlin"\n';
    doc += 'Adresse: Hauptstraße 1, 10115 Berlin\n';
    doc += 'Baujahr: 1995\n';
    doc += 'Gesamt-Wohnfläche: 400 m²\n';
    doc += 'Grundstücksfläche: 500 m²\n';
    doc += '\n';
    doc += 'WOHNEINHEITEN (6 Stück):\n';
    doc += '  1. Whg. EG links     - 60 m², 2 Zimmer, Balkon\n';
    doc += '  2. Whg. EG rechts    - 65 m², 3 Zimmer\n';
    doc += '  3. Whg. 1.OG links   - 65 m², 3 Zimmer, Balkon\n';
    doc += '  4. Whg. 1.OG rechts  - 70 m², 3 Zimmer\n';
    doc += '  5. Whg. 2.OG links   - 65 m², 3 Zimmer, Balkon\n';
    doc += '  6. Whg. 2.OG rechts  - 75 m², 4 Zimmer, Balkon, Keller\n';
    doc += '\n';
    doc += 'EIGENTÜMER:\n';
    doc += '  - Max Mustermann (Privatperson) - 50%\n';
    doc += '  - Erika Musterfrau (Privatperson) - 50%\n';
    doc += '\n';
    doc += 'STEUER-SYSTEM:\n';
    doc += '  - Rechtsform: GbR\n';
    doc += '  - Kontenrahmen: SKR04\n';
    doc += '  - 52 Kostenkategorien initialisiert\n';
    doc += '\n';
    doc += 'DURCHFÜHRUNGSZEIT: ~20 Minuten\n';
    doc += '  - Objekt anlegen: 2 Min\n';
    doc += '  - 6 Wohnungen: 10 Min\n';
    doc += '  - 2 Eigentümer zuordnen: 3 Min\n';
    doc += '  - Steuer-System: 5 Min\n';
    doc += '```\n\n';
    
    doc += '### 1.9 Tipps & Best Practices\n\n';
    doc += '✅ **DO**: Objektname eindeutig und prägnant wählen (bei mehreren Objekten wichtig)\n';
    doc += '✅ **DO**: Wohnflächen exakt nach Wohnflächenberechnung (WoFlV) eingeben\n';
    doc += '✅ **DO**: Steuer-System sofort einrichten (später nachträglich schwieriger)\n';
    doc += '✅ **DO**: Einheiten systematisch benennen (z.B. "Whg. {Etage}.{Position}")\n';
    doc += '✅ **DO**: Eigentümer-Anteile als Prozent angeben (klarer als Brüche)\n\n';
    doc += '❌ **DON\'T**: Objektname = nur Straße (bei mehreren Objekten verwirrend)\n';
    doc += '❌ **DON\'T**: Wohnflächen schätzen oder aufrunden (wichtig für Abrechnungen!)\n';
    doc += '❌ **DON\'T**: Eigentümer ohne Anteile anlegen (führt zu Fehlern bei Abrechnungen)\n';
    doc += '❌ **DON\'T**: Steuer-System überspringen wenn steuerliche Auswertungen geplant sind\n\n';
    
    doc += '### 1.10 Häufige User-Fehler\n\n';
    doc += '1. **PLZ vergessen**: User trägt nur Ort ein → System blockiert\n';
    doc += '2. **Wohnfläche vs. Nutzfläche verwechselt**: User gibt Gesamtfläche inkl. Keller an\n';
    doc += '3. **Eigentümer-Anteile falsch**: User gibt "0,5" statt "50%" ein → Validierung schlägt fehl\n';
    doc += '4. **Steuer-System zu früh abbrechen**: User wählt "Später" und vergisst es → keine Kategorisierung möglich\n';
    doc += '5. **Einheiten ohne Flächen-Angabe**: User lässt Fläche leer → NK-Abrechnung unmöglich\n\n';
    
    doc += '### 1.11 UI-Beschreibung\n\n';
    doc += '**Empty State (kein Objekt vorhanden)**:\n';
    doc += '```\n';
    doc += '┌───────────────────────────────────────────┐\n';
    doc += '│                                           │\n';
    doc += '│         [Building Icon - grau]            │\n';
    doc += '│                                           │\n';
    doc += '│      Noch keine Objekte vorhanden         │\n';
    doc += '│   Legen Sie Ihr erstes Objekt an          │\n';
    doc += '│                                           │\n';
    doc += '│     [+ Objekt hinzufügen] (grüner Btn)   │\n';
    doc += '│                                           │\n';
    doc += '└───────────────────────────────────────────┘\n';
    doc += '```\n\n';
    
    doc += '**BuildingDetail Tabs**:\n';
    doc += '```\n';
    doc += '┌─────────────────────────────────────────────────────┐\n';
    doc += '│ ← Zurück   Hauptstraße 1, Berlin                    │\n';
    doc += '├─────────────────────────────────────────────────────┤\n';
    doc += '│ [Übersicht] [Einheiten] [Verträge] [Eigentümer] ..│\n';
    doc += '├─────────────────────────────────────────────────────┤\n';
    doc += '│                                                     │\n';
    doc += '│   ... Tab-Inhalt ...                                │\n';
    doc += '│                                                     │\n';
    doc += '└─────────────────────────────────────────────────────┘\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 2: Neuen Eigentümer anlegen\n\n';
    
    doc += '### 2.1 Identifikation\n\n';
    doc += '- **Workflow-Name**: Eigentümer-Erfassung (alle Rechtsformen)\n';
    doc += '- **Hauptziel**: Eigentümer mit allen rechtlichen und steuerlichen Daten erfassen\n';
    doc += '- **User-Typ**: Verwalter, Admin\n';
    doc += '- **Häufigkeit**: Einmalig pro Eigentümer\n';
    doc += '- **Komplexität**: Einfach bis Mittel (je nach Rechtsform)\n';
    doc += '- **Geschätzte Dauer**: 2-10 Minuten\n\n';
    
    doc += '### 2.2 Varianten (nach Rechtsform)\n\n';
    doc += '**Variante A: Privatperson** (einfach, ~2 Minuten)\n';
    doc += '- Nur Stammdaten erforderlich\n';
    doc += '- Keine Gesellschafter\n';
    doc += '- Direkter Zugriff auf Steuer-ID\n\n';
    doc += '**Variante B: GbR** (mittel, ~5 Minuten)\n';
    doc += '- GbR-Stammdaten + Gesellschafter-Aufteilung\n';
    doc += '- Mindestens 2 Gesellschafter erforderlich\n';
    doc += '- Anteile müssen 100% ergeben\n\n';
    doc += '**Variante C: GmbH** (mittel, ~5 Minuten)\n';
    doc += '- Firmendaten + optional Gesellschafter\n';
    doc += '- Geschäftsführer separat erfassbar\n';
    doc += '- Handelsregister-Nummer\n\n';
    
    doc += '### 2.3 Schritt-für-Schritt (Variante A: Privatperson)\n\n';
    doc += '**SCHRITT 1: Navigation**\n';
    doc += '- **Context**: Im BuildingDetail → Tab "Eigentümer" → "+ Eigentümer hinzufügen"\n';
    doc += '- **Alternative**: Workflow 1, Schritt 6 (direkt beim Objektanlegen)\n';
    doc += '- **Dialog**: SimpleOwnerForm öffnet sich\n\n';
    
    doc += '**SCHRITT 2: Rechtsform wählen**\n';
    doc += '- **UI**: Radio-Button Group (horizontal)\n';
    doc += '  ```\n';
    doc += '  Rechtsform wählen:\n';
    doc += '  ⚪ Privatperson   ⚪ GbR   ⚪ GmbH\n';
    doc += '  ```\n';
    doc += '- **User-Aktion**: Radio-Button klicken\n';
    doc += '- **Effekt**: Formular passt sich dynamisch an\n';
    doc += '  - Privatperson → Felder: Vorname, Nachname, ...\n';
    doc += '  - GbR → Felder: Firmenname, + Gesellschafter-Sektion\n';
    doc += '  - GmbH → Felder: Firmenname, Handelsregister, ...\n\n';
    
    doc += '**SCHRITT 3: Stammdaten eingeben (Privatperson)**\n';
    doc += '- **Felder**:\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────┐\n';
    doc += '  │ Eigentümer anlegen (Privatperson)│\n';
    doc += '  ├─────────────────────────────────┤\n';
    doc += '  │ [Pflicht] Vorname               │ → "Max"\n';
    doc += '  │ [Pflicht] Nachname              │ → "Mustermann"\n';
    doc += '  │ [Pflicht] Adresse               │ → "Eigentümerstr. 10"\n';
    doc += '  │ [Pflicht] PLZ                   │ → "10115"\n';
    doc += '  │ [Pflicht] Ort                   │ → "Berlin"\n';
    doc += '  │ [Optional] Telefon              │ → "+49 30 12345678"\n';
    doc += '  │ [Optional] E-Mail               │ → "max@example.com"\n';
    doc += '  │ [Optional] Geburtsdatum         │ → "15.03.1980"\n';
    doc += '  │ [Optional] Steuer-ID            │ → "12345678901"\n';
    doc += '  ├─────────────────────────────────┤\n';
    doc += '  │ [Abbrechen]  [Speichern]        │\n';
    doc += '  └─────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **Validierungen (Live)**:\n';
    doc += '  - ✅ E-Mail: Format prüfen (must contain @)\n';
    doc += '  - ✅ PLZ: 5 Ziffern\n';
    doc += '  - ⚠️ Steuer-ID: 11 Ziffern (optional, aber Warnung bei falsch)\n';
    doc += '  - ⚠️ Geburtsdatum: in der Vergangenheit?\n';
    doc += '- **Hilfe-Texte**:\n';
    doc += '  - Steuer-ID: "11-stellige Identifikationsnummer (siehe Lohnsteuerbescheid)"\n';
    doc += '  - E-Mail: "Für Benachrichtigungen und Eigentümer-Portal"\n\n';
    
    doc += '**SCHRITT 4: Speichern**\n';
    doc += '- **User-Aktion**: Klick "Speichern" (grüner Button)\n';
    doc += '- **Hintergrund**:\n';
    doc += '  ```javascript\n';
    doc += '  const owner = await base44.entities.Owner.create({\n';
    doc += '    type: "person",\n';
    doc += '    first_name: "Max",\n';
    doc += '    last_name: "Mustermann",\n';
    doc += '    address: "Eigentümerstr. 10",\n';
    doc += '    zip_code: "10115",\n';
    doc += '    city: "Berlin",\n';
    doc += '    email: "max@example.com",\n';
    doc += '    phone: "+49 30 12345678",\n';
    doc += '    birth_date: "1980-03-15",\n';
    doc += '    tax_id: "12345678901"\n';
    doc += '  });\n';
    doc += '  ```\n';
    doc += '- **Erfolg**: Toast "✅ Eigentümer Max Mustermann erstellt"\n';
    doc += '- **Dialog**: Schließt sich automatisch\n';
    doc += '- **Navigation**: Zurück zu vorheriger Seite (meist BuildingDetail)\n\n';
    
    doc += '### 2.4 Schritt-für-Schritt (Variante B: GbR)\n\n';
    doc += '**SCHRITT 1-2**: Wie Privatperson, aber Rechtsform = ⚪ GbR\n\n';
    
    doc += '**SCHRITT 3: GbR-Stammdaten**\n';
    doc += '- **Felder**:\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────┐\n';
    doc += '  │ Eigentümer anlegen (GbR)        │\n';
    doc += '  ├─────────────────────────────────┤\n';
    doc += '  │ [Pflicht] Firmenname            │ → "Mustermann & Musterfrau GbR"\n';
    doc += '  │ [Pflicht] Adresse               │ → "Firmenstraße 10"\n';
    doc += '  │ [Pflicht] PLZ                   │ → "10115"\n';
    doc += '  │ [Pflicht] Ort                   │ → "Berlin"\n';
    doc += '  │ [Optional] Steuernummer         │ → "12/345/67890"\n';
    doc += '  │ [Optional] Finanzamt            │ → "Berlin-Mitte"\n';
    doc += '  │                                 │\n';
    doc += '  │ ─── Gesellschafter ───          │\n';
    doc += '  │ [+ Gesellschafter hinzufügen]   │\n';
    doc += '  └─────────────────────────────────┘\n';
    doc += '  ```\n\n';
    
    doc += '**SCHRITT 4: Gesellschafter hinzufügen**\n';
    doc += '- **User-Aktion**: Klick "+ Gesellschafter hinzufügen"\n';
    doc += '- **Dialog**: SimpleShareholderForm (nested)\n';
    doc += '- **Felder pro Gesellschafter**:\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────┐\n';
    doc += '  │ Gesellschafter #1               │\n';
    doc += '  ├─────────────────────────────────┤\n';
    doc += '  │ [Pflicht] Vorname               │ → "Max"\n';
    doc += '  │ [Pflicht] Nachname              │ → "Mustermann"\n';
    doc += '  │ [Pflicht] Anteil                │ → "50%" oder "1/2"\n';
    doc += '  │ [Optional] Adresse              │ → (falls abweichend)\n';
    doc += '  │ [Optional] Steuer-ID            │ → "12345678901"\n';
    doc += '  ├─────────────────────────────────┤\n';
    doc += '  │ [Entfernen]  [Hinzufügen]       │\n';
    doc += '  └─────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **Validierung**:\n';
    doc += '  - ✅ BLOCKER: Mindestens 2 Gesellschafter (bei GbR)\n';
    doc += '  - ✅ BLOCKER: Summe Anteile = 100%\n';
    doc += '  - Live-Anzeige: "Gesamt: 50% (noch 50% offen)"\n';
    doc += '- **Hintergrund**: Gesellschafter in Array gespeichert (noch nicht in DB, erst bei Speichern)\n';
    doc += '- **User kann**: Weitere Gesellschafter hinzufügen (Button wird wieder sichtbar)\n\n';
    
    doc += '**SCHRITT 5: Speichern (GbR komplett)**\n';
    doc += '- **User-Aktion**: Klick "GbR speichern" (Button erst aktiv wenn alle Validierungen grün)\n';
    doc += '- **Hintergrund (Transaktional)**:\n';
    doc += '  ```javascript\n';
    doc += '  // 1. Owner (GbR) erstellen\n';
    doc += '  const gbr = await base44.entities.Owner.create({\n';
    doc += '    type: "gbr",\n';
    doc += '    company_name: "Mustermann & Musterfrau GbR",\n';
    doc += '    address: "Firmenstr. 10",\n';
    doc += '    zip_code: "10115",\n';
    doc += '    city: "Berlin",\n';
    doc += '    tax_number: "12/345/67890",\n';
    doc += '    tax_office: "Berlin-Mitte"\n';
    doc += '  });\n';
    doc += '  \n';
    doc += '  // 2. Gesellschafter erstellen (sequenziell)\n';
    doc += '  for (const sh of shareholders) {\n';
    doc += '    await base44.entities.Shareholder.create({\n';
    doc += '      owner_id: gbr.id,\n';
    doc += '      first_name: sh.first_name,\n';
    doc += '      last_name: sh.last_name,\n';
    doc += '      share_percentage: sh.share,\n';
    doc += '      address: sh.address || gbr.address, // Fallback\n';
    doc += '      tax_id: sh.tax_id\n';
    doc += '    });\n';
    doc += '  }\n';
    doc += '  \n';
    doc += '  // 3. ActivityLog\n';
    doc += '  await base44.entities.ActivityLog.create({\n';
    doc += '    action: "owner_created",\n';
    doc += '    entity_type: "Owner",\n';
    doc += '    entity_id: gbr.id,\n';
    doc += '    details: { type: "gbr", shareholders: shareholders.length }\n';
    doc += '  });\n';
    doc += '  ```\n';
    doc += '- **Dauer**: ~1-2 Sekunden\n';
    doc += '- **Erfolg**: Toast "✅ GbR erfolgreich erstellt mit 2 Gesellschaftern"\n\n';
    
    doc += '### 2.5 Automatismen\n\n';
    doc += '- **Auto-Berechnung**: \n';
    doc += '  - Wenn nur 1 Gesellschafter eingegeben → Anteil automatisch 100% (mit Warnung)\n';
    doc += '  - Wenn 2 Gesellschafter ohne Anteile → je 50% vorschlagen\n';
    doc += '- **Auto-Warnung**: \n';
    doc += '  - Bei < 2 Gesellschaftern → "⚠️ GbR benötigt mindestens 2 Gesellschafter"\n';
    doc += '  - Bei Anteilen ≠ 100% → "❌ Summe muss 100% ergeben (aktuell: {sum}%)"\n';
    doc += '- **Auto-Fill**: \n';
    doc += '  - Gesellschafter-Adresse = GbR-Adresse (überschreibbar)\n';
    doc += '  - 2. Gesellschafter: Anteil = 100% - erster_anteil\n\n';
    
    doc += '### 2.6 Edge Cases\n\n';
    doc += '**Fall 1: Mehr als 2 Gesellschafter**\n';
    doc += '- User kann beliebig viele Gesellschafter hinzufügen\n';
    doc += '- Beispiel: 3 Gesellschafter mit 33,33% / 33,33% / 33,34%\n';
    doc += '- Validierung: Summe = 100% (Rundungsfehler toleriert bis 0,01%)\n\n';
    doc += '**Fall 2: Gesellschafter ohne Steuer-ID**\n';
    doc += '- ⚠️ WARNING: "Steuer-ID fehlt - für Anlage V erforderlich"\n';
    doc += '- Speichern trotzdem möglich\n';
    doc += '- Später nachträglich ergänzbar\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 4: Mietvertrag erstellen\n\n';
    
    doc += '### 4.1 Identifikation\n\n';
    doc += '- **Workflow-Name**: Mietvertrag-Erfassung und optional Generierung\n';
    doc += '- **Hauptziel**: Neuen Mietvertrag im System erfassen, optional Vertragsdokument generieren\n';
    doc += '- **User-Typ**: Verwalter\n';
    doc += '- **Häufigkeit**: Pro neue Vermietung\n';
    doc += '- **Komplexität**: Mittel (~10 Minuten)\n';
    doc += '- **Geschätzte Dauer**: 10-15 Minuten\n\n';
    
    doc += '### 4.2 Voraussetzungen\n\n';
    doc += '- ✅ Building existiert\n';
    doc += '- ✅ Unit existiert und ist verfügbar (nicht bereits vermietet)\n';
    doc += '- ℹ️ Tenant kann während Prozess angelegt werden\n\n';
    
    doc += '### 4.3 Schritt-für-Schritt\n\n';
    doc += '**SCHRITT 1: Navigation zu Verträge**\n';
    doc += '- **Seite**: `/Contracts`\n';
    doc += '- **User-Aktion**: Hauptmenü → "Mieter"\n';
    doc += '- **UI**: Liste existierender Verträge (Cards) oder EmptyState\n';
    doc += '- **Angezeigt pro Vertrag** (in Liste):\n';
    doc += '  - Mieter-Name\n';
    doc += '  - Objekt + Wohnung\n';
    doc += '  - Miete (Warmmiete)\n';
    doc += '  - Status (Aktiv, Gekündigt)\n';
    doc += '  - Mietbeginn\n\n';
    
    doc += '**SCHRITT 2: Neuer Vertrag**\n';
    doc += '- **User-Aktion**: Button "Neuer Vertrag" (oben rechts, grün)\n';
    doc += '- **Dialog**: ContractForm öffnet sich (fullscreen oder großes Modal)\n';
    doc += '- **Tabs im Form** (3 Tabs):\n';
    doc += '  - ① Stammdaten (Objekt, Mieter, Termine)\n';
    doc += '  - ② Miete (Kalt, NK, Heizung)\n';
    doc += '  - ③ Kaution & Sonstiges\n';
    doc += '- **Fortschritt-Anzeige**: "Schritt 1 von 3" oben\n\n';
    
    doc += '**SCHRITT 3: Tab ① - Stammdaten**\n';
    doc += '- **Felder**:\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────────────┐\n';
    doc += '  │ Neuer Mietvertrag - Stammdaten (1/3)    │\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ [Pflicht] Gebäude ▼                     │\n';
    doc += '  │   → "Hauptstraße 1, Berlin"             │\n';
    doc += '  │                                         │\n';
    doc += '  │ [Pflicht] Wohneinheit ▼                 │\n';
    doc += '  │   → Gefiltert nach Gebäude:             │\n';
    doc += '  │   → "Whg. 1.OG links (65,5 m²)"         │\n';
    doc += '  │   → Status: ✅ Verfügbar                │\n';
    doc += '  │                                         │\n';
    doc += '  │ [Pflicht] Hauptmieter ▼                 │\n';
    doc += '  │   → Dropdown oder [Neu anlegen]         │\n';
    doc += '  │                                         │\n';
    doc += '  │ [Optional] Zweiter Mieter ▼             │\n';
    doc += '  │   → (für Paare, WG-Hauptmieter)         │\n';
    doc += '  │                                         │\n';
    doc += '  │ [Pflicht] Vertragsdatum 📅              │ → "07.01.2024"\n';
    doc += '  │ [Pflicht] Mietbeginn 📅                 │ → "01.02.2024"\n';
    doc += '  │ [Optional] Mietende 📅                  │ → leer = unbefristet\n';
    doc += '  │ [Pflicht] Übergabedatum 📅              │ → "01.02.2024"\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ [Abbrechen]  [Weiter →]                 │\n';
    doc += '  └─────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **Auto-Fill**:\n';
    doc += '  - Vertragsdatum = heute\n';
    doc += '  - Mietbeginn = 1. des nächsten Monats\n';
    doc += '  - Übergabedatum = Mietbeginn\n';
    doc += '  - Mietende = leer (unbefristet als Standard)\n';
    doc += '- **Validierungen**:\n';
    doc += '  - ✅ Mietbeginn muss nach Vertragsdatum liegen\n';
    doc += '  - ✅ Mietende (falls gesetzt) muss nach Mietbeginn liegen\n';
    doc += '  - ⚠️ Wohneinheit bereits vermietet? → Überschneidungs-Check\n';
    doc += '  ```javascript\n';
    doc += '  const overlapping = await LeaseContract.filter({\n';
    doc += '    unit_id: unit.id,\n';
    doc += '    status: "active",\n';
    doc += '    start_date: { $lte: mietende || "9999-12-31" },\n';
    doc += '    end_date: { $gte: mietbeginn }\n';
    doc += '  });\n';
    doc += '  if (overlapping.length > 0) {\n';
    doc += '    → ⚠️ WARNING: "Wohnung ist im gewählten Zeitraum bereits vermietet"\n';
    doc += '  }\n';
    doc += '  ```\n\n';
    
    doc += '**SCHRITT 3a: Mieter neu anlegen (falls nötig - Sub-Workflow)**\n';
    doc += '- **User-Aktion**: Klick "Neuen Mieter anlegen" (im Dropdown)\n';
    doc += '- **Sub-Dialog**: TenantForm (nested über ContractForm)\n';
    doc += '- **Felder**:\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────┐\n';
    doc += '  │ Neuer Mieter                    │\n';
    doc += '  ├─────────────────────────────────┤\n';
    doc += '  │ [Pflicht] Vorname               │ → "Max"\n';
    doc += '  │ [Pflicht] Nachname              │ → "Mustermann"\n';
    doc += '  │ [Pflicht] Geburtsdatum 📅       │ → "15.03.1985"\n';
    doc += '  │ [Pflicht] Adresse               │ → "Alte Str. 5" (bisherige)\n';
    doc += '  │ [Pflicht] PLZ                   │ → "12345"\n';
    doc += '  │ [Pflicht] Ort                   │ → "Musterstadt"\n';
    doc += '  │ [Optional] Telefon              │ → "+49 176 12345678"\n';
    doc += '  │ [Optional] E-Mail               │ → "max@example.com"\n';
    doc += '  │ [Optional] Beruf                │ → "Angestellter"\n';
    doc += '  │ [Optional] Notfallkontakt       │ → "Erika Musterfrau"\n';
    doc += '  ├─────────────────────────────────┤\n';
    doc += '  │ [Abbrechen]  [Speichern]        │\n';
    doc += '  └─────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **Hintergrund**:\n';
    doc += '  ```javascript\n';
    doc += '  const tenant = await base44.entities.Tenant.create({\n';
    doc += '    first_name: "Max",\n';
    doc += '    last_name: "Mustermann",\n';
    doc += '    birth_date: "1985-03-15",\n';
    doc += '    address: "Alte Str. 5",\n';
    doc += '    zip_code: "12345",\n';
    doc += '    city: "Musterstadt",\n';
    doc += '    phone: "+49 176 12345678",\n';
    doc += '    email: "max@example.com"\n';
    doc += '  });\n';
    doc += '  ```\n';
    doc += '- **Speichern**: Tenant wird erstellt und automatisch im ContractForm-Dropdown ausgewählt\n';
    doc += '- **Navigation**: Zurück zu ContractForm (Sub-Dialog schließt sich)\n\n';
    
    doc += '**SCHRITT 4: Tab ② - Miete**\n';
    doc += '- **User-Aktion**: Klick "Weiter" → Tab 2 öffnet sich\n';
    doc += '- **Felder**:\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────────────┐\n';
    doc += '  │ Neuer Mietvertrag - Miete (2/3)         │\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ [Pflicht] Kaltmiete (EUR)               │ → "800,00"\n';
    doc += '  │ [Pflicht] Nebenkosten-Vorauszahlung     │ → "150,00"\n';
    doc += '  │ [Pflicht] Heizkosten-Vorauszahlung      │ → "80,00"\n';
    doc += '  │ ─────────────────────────────────────   │\n';
    doc += '  │ [Auto] Warmmiete (berechnet)            │ → "1.030,00 €"\n';
    doc += '  │                                         │\n';
    doc += '  │ [Pflicht] Fälligkeitstag (1-31)         │ → "3" (3. Tag des Monats)\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ [← Zurück]  [Weiter →]                  │\n';
    doc += '  └─────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **Auto-Berechnung (Live)**:\n';
    doc += '  ```javascript\n';
    doc += '  // Bei jeder Änderung von Kalt, NK oder Heizung\n';
    doc += '  total_rent = base_rent + utilities + heating\n';
    doc += '  // Anzeige aktualisiert sich sofort\n';
    doc += '  ```\n';
    doc += '- **Validierung**:\n';
    doc += '  - ✅ BLOCKER: base_rent > 0\n';
    doc += '  - ⚠️ WARNING: base_rent < 5 EUR/m² → "Ungewöhnlich niedrige Miete"\n';
    doc += '  - ⚠️ WARNING: base_rent > 20 EUR/m² → "Ungewöhnlich hohe Miete - Mietpreisbremse prüfen"\n';
    doc += '  - ✅ BLOCKER: rent_due_day zwischen 1-31\n';
    doc += '- **Hilfe-Texte**:\n';
    doc += '  - Kaltmiete: "Nettokaltmiete ohne Nebenkosten"\n';
    doc += '  - Nebenkosten: "Betriebskosten-Vorauszahlung (ohne Heizung)"\n';
    doc += '  - Fälligkeitstag: "Tag im Monat an dem Miete fällig ist (z.B. 3 = 3. Januar, 3. Februar, ...)"\n\n';
    
    doc += '**SCHRITT 5: Tab ③ - Kaution & Sonstiges**\n';
    doc += '- **User-Aktion**: Klick "Weiter" → Tab 3 öffnet sich\n';
    doc += '- **Felder**:\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────────────┐\n';
    doc += '  │ Neuer Mietvertrag - Kaution (3/3)       │\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ [Optional] Kaution (EUR)                │ → "2.400,00" (Auto: 3x Kaltmiete)\n';
    doc += '  │ [Optional] ☐ Kaution bereits bezahlt?   │\n';
    doc += '  │ [Optional] Kaution in Raten ▼           │ → "3" (Standard)\n';
    doc += '  │   Optionen: 1, 2, 3, 4                  │\n';
    doc += '  │                                         │\n';
    doc += '  │ [Pflicht] Kündigungsfrist (Monate)      │ → "3" (Standard)\n';
    doc += '  │ [Optional] Anzahl Personen im Haushalt  │ → "2"\n';
    doc += '  │ [Optional] Notizen                      │ → Freitext\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ [← Zurück]  [Vertrag speichern]         │\n';
    doc += '  └─────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **Standard-Werte** (automatisch befüllt):\n';
    doc += '  - Kaution = 3 × Kaltmiete (maximal gesetzlich erlaubt)\n';
    doc += '  - Kaution-Raten = 3\n';
    doc += '  - Kündigungsfrist = 3 Monate\n';
    doc += '  - Anzahl Personen = 1 (bei Einzelmieter)\n';
    doc += '- **Validierung**:\n';
    doc += '  - ⚠️ WARNING: deposit > 3 × base_rent → "⚠️ Kaution überschreitet gesetzliche Obergrenze (max. 2.400 €)"\n';
    doc += '  - ⚠️ INFO: deposit < base_rent → "Kaution ungewöhnlich niedrig"\n\n';
    
    doc += '**SCHRITT 6: Speichern**\n';
    doc += '- **User-Aktion**: Button "Vertrag speichern" (grün, unten rechts)\n';
    doc += '- **Final-Validierung vor Submit**:\n';
    doc += '  - ✅ BLOCKER: Alle Pflichtfelder ausgefüllt?\n';
    doc += '  - ✅ BLOCKER: Mietbeginn nach Vertragsdatum?\n';
    doc += '  - ✅ BLOCKER: Mietende (falls gesetzt) nach Mietbeginn?\n';
    doc += '  - ✅ BLOCKER: total_rent = base_rent + utilities + heating?\n';
    doc += '  - ⚠️ WARNING: Wohneinheit bereits vermietet? (Überschneidungs-Check)\n';
    doc += '- **Hintergrund (Datenbank-Operation)**:\n';
    doc += '  ```javascript\n';
    doc += '  const contract = await base44.entities.LeaseContract.create({\n';
    doc += '    unit_id: unit.id,\n';
    doc += '    tenant_id: tenant.id,\n';
    doc += '    second_tenant_id: secondTenant?.id || null,\n';
    doc += '    contract_date: "2024-01-07",\n';
    doc += '    start_date: "2024-02-01",\n';
    doc += '    end_date: null, // unbefristet\n';
    doc += '    is_unlimited: true,\n';
    doc += '    handover_date: "2024-02-01",\n';
    doc += '    rent_due_day: 3,\n';
    doc += '    base_rent: 800,\n';
    doc += '    utilities: 150,\n';
    doc += '    heating: 80,\n';
    doc += '    total_rent: 1030,\n';
    doc += '    deposit: 2400,\n';
    doc += '    deposit_paid: false,\n';
    doc += '    deposit_installments: 3,\n';
    doc += '    notice_period_months: 3,\n';
    doc += '    number_of_persons: 2,\n';
    doc += '    status: "active",\n';
    doc += '    version_number: 1,\n';
    doc += '    is_current_valid: true,\n';
    doc += '    bookings_created: false // wird in Schritt 7 auf true gesetzt\n';
    doc += '  });\n';
    doc += '  ```\n';
    doc += '- **Dauer**: ~0,5 Sekunden\n';
    doc += '- **Erfolg**: Toast "✅ Mietvertrag erstellt"\n\n';
    
    doc += '**SCHRITT 7: Automatische Buchungen generieren (Dialog)**\n';
    doc += '- **Trigger**: Automatischer Dialog nach Speichern\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────────────┐\n';
    doc += '  │ Mieteinnahmen-Buchungen erstellen?      │\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ Sollen monatliche Mieteinnahmen         │\n';
    doc += '  │ automatisch als Buchungen erstellt      │\n';
    doc += '  │ werden?                                 │\n';
    doc += '  │                                         │\n';
    doc += '  │ Zeitraum: 01.02.2024 - 31.01.2025       │\n';
    doc += '  │ Betrag: 1.030,00 € pro Monat            │\n';
    doc += '  │ Anzahl Buchungen: 12                    │\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ [Nein] [Später] [Ja, erstellen]         │\n';
    doc += '  └─────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **User-Aktion**: "Ja, erstellen" / "Nein" / "Später"\n';
    doc += '- **Bei "Ja"**:\n';
    doc += '  ```javascript\n';
    doc += '  // Backend-Funktion\n';
    doc += '  const result = await base44.functions.invoke("generateBookingsFromSource", {\n';
    doc += '    sourceType: "Mietvertrag",\n';
    doc += '    sourceId: contract.id\n';
    doc += '  });\n';
    doc += '  \n';
    doc += '  // Erstellt 12 monatliche Buchungen:\n';
    doc += '  for (let month = 0; month < 12; month++) {\n';
    doc += '    const due_date = new Date(2024, 1 + month, 3); // 3. Tag jeden Monats\n';
    doc += '    \n';
    doc += '    await GeneratedFinancialBooking.create({\n';
    doc += '      building_id: contract.building_id,\n';
    doc += '      unit_id: contract.unit_id,\n';
    doc += '      source_type: "Mietvertrag",\n';
    doc += '      source_id: contract.id,\n';
    doc += '      due_date: due_date,\n';
    doc += '      amount: 1030, // positiv = Einnahme\n';
    doc += '      description: `Miete ${format(due_date, "MM/YYYY")} - ${tenant.last_name}`,\n';
    doc += '      booking_status: "Geplant",\n';
    doc += '      is_future_booking: true // wird automatisch weitergeführt\n';
    doc += '    });\n';
    doc += '  }\n';
    doc += '  \n';
    doc += '  // Contract aktualisieren\n';
    doc += '  await contract.update({\n';
    doc += '    bookings_created: true,\n';
    doc += '    bookings_created_at: now(),\n';
    doc += '    number_of_generated_bookings: 12\n';
    doc += '  });\n';
    doc += '  ```\n';
    doc += '- **Dauer**: ~2-3 Sekunden\n';
    doc += '- **Erfolg**: Toast "✅ 12 Mieteinnahmen-Buchungen erstellt"\n\n';
    
    doc += '**SCHRITT 8: Mietvertrag-Dokument generieren (optional)**\n';
    doc += '- **Trigger**: Button "Mietvertrag erstellen" (erscheint nach Speichern in Success-Toast)\n';
    doc += '- **User-Aktion**: Klick auf Button in Toast oder später über Dokumente-Modul\n';
    doc += '- **Navigation**: Redirect zu `/Documents` mit Query-Parameter `?template=Mietvertrag&contract_id={id}`\n';
    doc += '- **Siehe**: Workflow 11 (Dokument mit Template erstellen)\n\n';
    
    doc += '### 4.4 Ausgabe/Ergebnis\n\n';
    doc += '**Neue Datensätze**:\n';
    doc += '- 1x LeaseContract (status="active", is_current_valid=true)\n';
    doc += '- Optional: 1x Tenant (falls neu angelegt)\n';
    doc += '- Optional: 12x GeneratedFinancialBooking (monatliche Mieten)\n';
    doc += '- Optional: 1x Document (Mietvertrag-PDF)\n';
    doc += '- 1x ActivityLog ("contract_created")\n\n';
    
    doc += '**Dokumente**: Optional (Mietvertrag-PDF)\n\n';
    doc += '**Benachrichtigungen**: \n';
    doc += '- Toast für User\n';
    doc += '- Optional: E-Mail an Mieter (falls E-Mail hinterlegt)\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 6: Rechnung/Beleg erfassen\n\n';
    
    doc += '### 6.1 Identifikation\n\n';
    doc += '- **Workflow-Name**: Rechnung erfassen (manuell oder per Upload)\n';
    doc += '- **Hauptziel**: Beleg digital erfassen, kategorisieren und optional Zahlung verknüpfen\n';
    doc += '- **User-Typ**: Verwalter, Buchhalter\n';
    doc += '- **Häufigkeit**: Mehrmals pro Woche (je nach Geschäftsvolumen)\n';
    doc += '- **Komplexität**: Einfach (~2-5 Minuten)\n';
    doc += '- **Geschätzte Dauer**: \n';
    doc += '  - Variante A (manuell): ~5 Minuten\n';
    doc += '  - Variante B (PDF-Upload + KI): ~2 Minuten\n\n';
    
    doc += '### 6.2 Varianten\n\n';
    doc += '**Variante A: Manuelle Erfassung**\n';
    doc += '- User tippt alle Daten ab (aus Papier-Rechnung)\n';
    doc += '- Fehleranfällig, zeitaufwändig\n';
    doc += '- Nur bei fehlender digitaler Rechnung\n\n';
    doc += '**Variante B: PDF-Upload mit KI-Extraktion** (⭐ empfohlen)\n';
    doc += '- User lädt PDF hoch\n';
    doc += '- KI extrahiert automatisch: Betrag, Datum, Lieferant, Positionen\n';
    doc += '- User prüft und korrigiert bei Bedarf\n';
    doc += '- 70-80% Zeitersparnis\n\n';
    
    doc += '### 6.3 Schritt-für-Schritt (Variante B: PDF-Upload)\n\n';
    doc += '**SCHRITT 1: Navigation**\n';
    doc += '- **Seite**: `/Invoices`\n';
    doc += '- **User-Aktion**: Hauptmenü → "Rechnungen & Belege"\n';
    doc += '- **UI**: Tabelle existierender Rechnungen\n';
    doc += '  - Spalten: Datum, Lieferant, Betrag, Kategorie, Status, Aktionen\n';
    doc += '  - Filter: Status (Alle, Unbezahlt, Bezahlt, Überfällig)\n\n';
    
    doc += '**SCHRITT 2: Upload starten**\n';
    doc += '- **User-Aktion**: Button "Rechnung hochladen" (oben rechts) oder Drag & Drop in Dropzone\n';
    doc += '- **Wizard**: IntelligentInvoiceWizard öffnet sich (Modal, 3 Steps)\n';
    doc += '- **UI**:\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────────────┐\n';
    doc += '  │ Intelligenter Rechnungs-Upload          │\n';
    doc += '  │ [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━] 33%   │ ← Fortschritt\n';
    doc += '  │ ① Upload  ② Extraktion  ③ Prüfung       │\n';
    doc += '  └─────────────────────────────────────────┘\n';
    doc += '  ```\n\n';
    
    doc += '**SCHRITT 3: Datei hochladen**\n';
    doc += '- **UI**: Dropzone mit Icon\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────────────┐\n';
    doc += '  │         [PDF Upload Icon]               │\n';
    doc += '  │                                         │\n';
    doc += '  │  PDF hier ablegen oder klicken          │\n';
    doc += '  │                                         │\n';
    doc += '  │  Unterstützte Formate: PDF, JPG, PNG    │\n';
    doc += '  │  Max. Größe: 10 MB                      │\n';
    doc += '  └─────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **User-Aktion**: PDF auswählen (Datei-Dialog) oder Drag & Drop\n';
    doc += '- **Hintergrund** (2 API-Calls):\n';
    doc += '  ```javascript\n';
    doc += '  // 1. Upload zu Storage\n';
    doc += '  const { file_url } = await base44.integrations.Core.UploadFile({\n';
    doc += '    file: pdfFile\n';
    doc += '  });\n';
    doc += '  // Dauer: ~1-2 Sekunden\n';
    doc += '  \n';
    doc += '  // 2. KI-Extraktion (InvokeLLM mit Vision)\n';
    doc += '  const extracted = await base44.integrations.Core.InvokeLLM({\n';
    doc += '    prompt: `Extrahiere folgende Daten aus dieser Rechnung:\n';
    doc += '      - Rechnungsnummer\n';
    doc += '      - Rechnungsdatum\n';
    doc += '      - Fälligkeitsdatum (falls vorhanden)\n';
    doc += '      - Gesamtbetrag (brutto)\n';
    doc += '      - Lieferant/Rechnungssteller (Name)\n';
    doc += '      - Steuersatz (19%, 7%, 0%)\n';
    doc += '      - Einzelpositionen (Beschreibung + Betrag)`,\n';
    doc += '    file_urls: [file_url],\n';
    doc += '    response_json_schema: {\n';
    doc += '      type: "object",\n';
    doc += '      properties: {\n';
    doc += '        invoice_number: { type: "string" },\n';
    doc += '        invoice_date: { type: "string", format: "date" },\n';
    doc += '        due_date: { type: "string", format: "date" },\n';
    doc += '        total_amount: { type: "number" },\n';
    doc += '        supplier_name: { type: "string" },\n';
    doc += '        tax_rate: { type: "number" },\n';
    doc += '        line_items: {\n';
    doc += '          type: "array",\n';
    doc += '          items: {\n';
    doc += '            type: "object",\n';
    doc += '            properties: {\n';
    doc += '              description: { type: "string" },\n';
    doc += '              amount: { type: "number" }\n';
    doc += '            }\n';
    doc += '          }\n';
    doc += '        }\n';
    doc += '      }\n';
    doc += '    }\n';
    doc += '  });\n';
    doc += '  // Ergebnis: Strukturiertes JSON\n';
    doc += '  ```\n';
    doc += '- **Dauer gesamt**: ~5-10 Sekunden\n';
    doc += '- **UI während Extraktion**: Loading-Spinner + "KI analysiert Rechnung..."\n\n';
    
    doc += '**SCHRITT 4: Extrahierte Daten prüfen**\n';
    doc += '- **UI**: Formular VORAUSGEFÜLLT mit KI-Daten (alle Felder editierbar)\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────────────┐\n';
    doc += '  │ Rechnungsdaten prüfen (KI-Extraktion)   │\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ [Pflicht] Rechnungsnummer               │ → "RE-2024-001" ✅\n';
    doc += '  │ [Pflicht] Rechnungsdatum 📅             │ → "05.01.2024" ✅\n';
    doc += '  │ [Pflicht] Fälligkeitsdatum 📅           │ → "05.02.2024" ✅\n';
    doc += '  │ [Pflicht] Gesamtbetrag (brutto)         │ → "350,00 €" ✅\n';
    doc += '  │ [Pflicht] Lieferant                     │ → "Mustermann Versich..." ✅\n';
    doc += '  │ [Optional] Steuersatz ▼                 │ → "19%" ✅\n';
    doc += '  │ [Auto] Netto-Betrag                     │ → "294,12 €"\n';
    doc += '  │ [Auto] Steuer-Betrag                    │ → "55,88 €"\n';
    doc += '  │                                         │\n';
    doc += '  │ ℹ️ Daten wurden automatisch erkannt     │\n';
    doc += '  │    Bitte prüfen und ggf. korrigieren    │\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ [Abbrechen]  [Weiter →]                 │\n';
    doc += '  └─────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **User-Aktion**: \n';
    doc += '  - Prüfen: Sind alle Daten korrekt?\n';
    doc += '  - Korrigieren: Falls KI Fehler gemacht hat (z.B. Betrag falsch erkannt)\n';
    doc += '  - Besonders prüfen: Lieferanten-Name (oft OCR-Fehler)\n';
    doc += '- **Auto-Berechnungen** (Live-Update bei Änderung):\n';
    doc += '  ```javascript\n';
    doc += '  netto = brutto / (1 + tax_rate/100)\n';
    doc += '  steuer = brutto - netto\n';
    doc += '  // Beispiel: 350 / 1.19 = 294,12 | Steuer = 55,88\n';
    doc += '  ```\n\n';
    
    doc += '**SCHRITT 5: Kategorisierung**\n';
    doc += '- **User-Aktion**: Klick "Weiter" → Kategorisierungs-Step\n';
    doc += '- **UI**:\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────────────┐\n';
    doc += '  │ Rechnung kategorisieren                 │\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ [Pflicht] Kostenkategorie ▼             │\n';
    doc += '  │   → Aus BuildingTaxLibrary:             │\n';
    doc += '  │   ⭐ Versicherung (KI-Vorschlag 95%)    │ ← Auto-Suggestion\n';
    doc += '  │   - Grundsteuer                         │\n';
    doc += '  │   - Reparaturen (Erhaltung)             │\n';
    doc += '  │   - Verwaltungskosten                   │\n';
    doc += '  │   - Sonstige Betriebskosten             │\n';
    doc += '  │   ... 48 weitere ...                    │\n';
    doc += '  │                                         │\n';
    doc += '  │ [Pflicht] Gebäude ▼                     │\n';
    doc += '  │   → "Hauptstraße 1, Berlin"             │\n';
    doc += '  │                                         │\n';
    doc += '  │ [Optional] Wohneinheit ▼                │\n';
    doc += '  │   → (nur bei unit-spezifischer Rechnung)│\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ [← Zurück]  [Speichern]                 │\n';
    doc += '  └─────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **KI-Vorschlag** (automatisch basierend auf Lieferant/Beschreibung):\n';
    doc += '  ```javascript\n';
    doc += '  // Einfache Keyword-Erkennung + LLM-Suggestion\n';
    doc += '  if (supplier.toLowerCase().includes("versicherung")) {\n';
    doc += '    suggested_category = "Versicherung";\n';
    doc += '    confidence = 0.95;\n';
    doc += '  } else if (supplier.includes("Stadtwerke")) {\n';
    doc += '    suggested_category = "Strom/Gas/Wasser";\n';
    doc += '    confidence = 0.90;\n';
    doc += '  } else {\n';
    doc += '    // Fallback: LLM fragen\n';
    doc += '    const suggestion = await InvokeLLM({\n';
    doc += '      prompt: `Welche Kategorie passt zu: "${supplier}" / "${description}"?`,\n';
    doc += '      response_json_schema: { ... }\n';
    doc += '    });\n';
    doc += '  }\n';
    doc += '  ```\n';
    doc += '- **User-Aktion**: Kategorie bestätigen (vorausgewählt) oder manuell ändern\n\n';
    
    doc += '**SCHRITT 6: Objekt-Zuordnung**\n';
    doc += '- **Feld**: "Gebäude" (Dropdown mit Suche)\n';
    doc += '- **User-Aktion**: Gebäude auswählen (z.B. "Hauptstraße 1")\n';
    doc += '- **Optional**: Unit-spezifisch (z.B. bei Reparatur nur in Wohnung 1)\n';
    doc += '  - Checkbox "Nur für eine bestimmte Wohnung" → Unit-Dropdown wird sichtbar\n\n';
    
    doc += '**SCHRITT 7: Speichern**\n';
    doc += '- **User-Aktion**: Button "Rechnung speichern" (grün)\n';
    doc += '- **Validierung**:\n';
    doc += '  - ✅ BLOCKER: Alle Pflichtfelder gesetzt?\n';
    doc += '  - ⚠️ WARNING: Duplikat-Check (gleiche invoice_number + supplier)\n';
    doc += '  - ⚠️ WARNING: Rechnungsdatum in Zukunft?\n';
    doc += '  - ⚠️ WARNING: Fälligkeitsdatum in Vergangenheit (> 30 Tage) → "Rechnung überfällig"\n';
    doc += '- **Hintergrund**:\n';
    doc += '  ```javascript\n';
    doc += '  const invoice = await base44.entities.Invoice.create({\n';
    doc += '    invoice_number: "RE-2024-001",\n';
    doc += '    invoice_date: "2024-01-05",\n';
    doc += '    due_date: "2024-02-05",\n';
    doc += '    total_amount: 350.00,\n';
    doc += '    net_amount: 294.12,\n';
    doc += '    tax_amount: 55.88,\n';
    doc += '    tax_rate: 19,\n';
    doc += '    supplier_name: "Mustermann Versicherungen GmbH",\n';
    doc += '    building_id: building.id,\n';
    doc += '    unit_id: unit?.id || null,\n';
    doc += '    cost_category_id: category.id,\n';
    doc += '    pdf_url: file_url,\n';
    doc += '    status: "unpaid"\n';
    doc += '  });\n';
    doc += '  ```\n';
    doc += '- **Erfolg**: Toast "✅ Rechnung gespeichert"\n\n';
    
    doc += '**SCHRITT 8: Automatische Buchung generieren (Dialog)**\n';
    doc += '- **Trigger**: Automatischer Dialog nach Speichern\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────────────┐\n';
    doc += '  │ Buchung erstellen?                      │\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ Soll für diese Rechnung eine Buchung    │\n';
    doc += '  │ in "Generierte Buchungen" erstellt      │\n';
    doc += '  │ werden?                                 │\n';
    doc += '  │                                         │\n';
    doc += '  │ Fälligkeit: 05.02.2024                  │\n';
    doc += '  │ Betrag: -350,00 € (Ausgabe)             │\n';
    doc += '  │ Kategorie: Versicherung                 │\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ [Nein]  [Ja, Buchung erstellen]         │\n';
    doc += '  └─────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **Bei "Ja"**:\n';
    doc += '  ```javascript\n';
    doc += '  await base44.entities.GeneratedFinancialBooking.create({\n';
    doc += '    building_id: invoice.building_id,\n';
    doc += '    unit_id: invoice.unit_id,\n';
    doc += '    source_type: "Rechnung",\n';
    doc += '    source_id: invoice.id,\n';
    doc += '    source_version: 1,\n';
    doc += '    due_date: invoice.due_date,\n';
    doc += '    amount: -invoice.total_amount, // negativ = Ausgabe!\n';
    doc += '    cost_category_id: invoice.cost_category_id,\n';
    doc += '    description: `Rechnung ${invoice.invoice_number} - ${invoice.supplier_name}`,\n';
    doc += '    booking_status: "Geplant",\n';
    doc += '    is_automatically_created: true\n';
    doc += '  });\n';
    doc += '  ```\n';
    doc += '- **Erfolg**: Toast "✅ Rechnung und Buchung erstellt"\n\n';
    
    doc += '### 6.4 Ausgabe/Ergebnis\n\n';
    doc += '**Neue Datensätze**:\n';
    doc += '- 1x Invoice (status="unpaid")\n';
    doc += '- Optional: 1x GeneratedFinancialBooking (booking_status="Geplant")\n';
    doc += '- 1x ActivityLog ("invoice_created")\n';
    doc += '- PDF gespeichert in Cloud Storage\n\n';
    
    doc += '### 6.5 Fehlerszenarien\n\n';
    doc += '**Fehler 1: KI-Extraktion fehlgeschlagen**\n';
    doc += '- **Ursache**: PDF zu komplex, handschriftlich, oder schlechte Qualität\n';
    doc += '- **Reaktion**: Toast "⚠️ Automatische Erkennung fehlgeschlagen - bitte manuell eingeben"\n';
    doc += '- **Fallback**: Formular wird leer angezeigt, User muss manuell eingeben\n\n';
    
    doc += '**Fehler 2: Duplikat erkannt**\n';
    doc += '- **Trigger**: Invoice mit gleicher Nummer vom selben Lieferanten existiert\n';
    doc += '- **Dialog**:\n';
    doc += '  ```\n';
    doc += '  ⚠️ Mögliches Duplikat!\n';
    doc += '  \n';
    doc += '  Rechnung "RE-2024-001" von "Mustermann Versicherungen"\n';
    doc += '  existiert bereits (erfasst am 03.01.2024).\n';
    doc += '  \n';
    doc += '  Trotzdem speichern?\n';
    doc += '  [Nein, abbrechen]  [Ja, trotzdem speichern]\n';
    doc += '  ```\n';
    doc += '- **User kann**: Abbrechen oder fortfahren\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 8: Betriebskostenabrechnung erstellen\n\n';
    
    doc += '### 8.1 Identifikation\n\n';
    doc += '- **Workflow-Name**: Betriebskostenabrechnung (NK-Abrechnung)\n';
    doc += '- **Hauptziel**: Jährliche Abrechnung für alle Mieter eines Gebäudes erstellen\n';
    doc += '- **User-Typ**: Verwalter\n';
    doc += '- **Häufigkeit**: Jährlich (bis spätestens 12 Monate nach Abrechnungsende)\n';
    doc += '- **Komplexität**: Komplex (~30-60 Minuten)\n';
    doc += '- **Geschätzte Dauer**: 45 Minuten für 6 Mieter\n\n';
    
    doc += '### 8.2 Voraussetzungen\n\n';
    doc += '- ✅ Gebäude vollständig erfasst (Name, Adresse)\n';
    doc += '- ✅ Alle Wohneinheiten angelegt mit korrekten Flächen-Angaben\n';
    doc += '- ✅ Mietverträge aktiv im Abrechnungszeitraum\n';
    doc += '- ✅ Kosten erfasst (aus Rechnungen oder Verträgen)\n';
    doc += '- ⚠️ Vorauszahlungen in Mietverträgen hinterlegt (utilities + heating)\n';
    doc += '- ℹ️ BuildingTaxLibrary initialisiert (für Umlagefähigkeit-Check)\n\n';
    
    doc += '### 8.3 Schritt-für-Schritt (5-Step-Wizard)\n\n';
    doc += '**SCHRITT 1: Gebäude & Zeitraum wählen**\n';
    doc += '- **Seite**: `/OperatingCosts`\n';
    doc += '- **User-Aktion**: Button "Neue Abrechnung" (oben rechts)\n';
    doc += '- **Dialog**: OperatingCostStatementDialog (Step 1/5)\n';
    doc += '- **UI**:\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────────────┐\n';
    doc += '  │ Betriebskostenabrechnung (1/5)          │\n';
    doc += '  │ [━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░] 20%   │\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ [Pflicht] Gebäude ▼                     │\n';
    doc += '  │   → "Hauptstraße 1, Berlin"             │\n';
    doc += '  │                                         │\n';
    doc += '  │ [Pflicht] Abrechnungsjahr ▼             │\n';
    doc += '  │   → "2023"                              │\n';
    doc += '  │                                         │\n';
    doc += '  │ [Auto] Zeitraum:                        │\n';
    doc += '  │   01.01.2023 - 31.12.2023               │\n';
    doc += '  │   (exakt 12 Monate)                     │\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ ℹ️ 6 Wohneinheiten im Gebäude           │\n';
    doc += '  │ ℹ️ 6 aktive Verträge im Zeitraum        │\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ [Abbrechen]  [Weiter →]                 │\n';
    doc += '  └─────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **Validierung**:\n';
    doc += '  - ✅ BLOCKER: Gebäude muss Units haben\n';
    doc += '  - ⚠️ WARNING: "Für 2023 existiert bereits eine Abrechnung (erstellt am 15.03.2024)"\n';
    doc += '  - ℹ️ INFO: Anzahl Verträge wird automatisch gezählt\n';
    doc += '- **Hintergrund**: System lädt alle Verträge für Preview\n';
    doc += '  ```javascript\n';
    doc += '  const contracts = await LeaseContract.filter({\n';
    doc += '    building_id: building.id,\n';
    doc += '    // Überschneidung mit Abrechnungszeitraum\n';
    doc += '    start_date: { $lte: "2023-12-31" },\n';
    doc += '    $or: [\n';
    doc += '      { end_date: { $gte: "2023-01-01" } },\n';
    doc += '      { end_date: null } // unbefristet\n';
    doc += '    ]\n';
    doc += '  });\n';
    doc += '  ```\n';
    doc += '- **User-Aktion**: "Weiter"\n\n';
    
    doc += '**SCHRITT 2: Verträge auswählen**\n';
    doc += '- **UI**: Tabelle aller Verträge die im Zeitraum aktiv waren\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────────────────────────────────────┐\n';
    doc += '  │ Mietverträge auswählen (2/5)                                    │\n';
    doc += '  │ [━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░] 40%                   │\n';
    doc += '  ├─────────────────────────────────────────────────────────────────┤\n';
    doc += '  │ Wohnung          │ Mieter          │ Zeitraum      │ Monate │ ☑ │\n';
    doc += '  ├──────────────────┼─────────────────┼───────────────┼────────┼───┤\n';
    doc += '  │ Whg. EG links    │ Max Mustermann  │ 01.01-31.12   │ 12     │ ☑ │\n';
    doc += '  │ Whg. EG rechts   │ Anna Schmidt    │ 01.01-31.12   │ 12     │ ☑ │\n';
    doc += '  │ Whg. 1.OG links  │ Peter Müller    │ 01.05-31.12   │ 8 ⚠️   │ ☑ │\n';
    doc += '  │ Whg. 1.OG rechts │ Erika Meier     │ 01.01-31.12   │ 12     │ ☑ │\n';
    doc += '  │ Whg. 2.OG links  │ Klaus Fischer   │ 01.01-31.12   │ 12     │ ☑ │\n';
    doc += '  │ Whg. 2.OG rechts │ Maria Wagner    │ 01.01-31.12   │ 12     │ ☑ │\n';
    doc += '  ├──────────────────┴─────────────────┴───────────────┴────────┴───┤\n';
    doc += '  │ ℹ️ 6 Verträge ausgewählt | ⚠️ 1 Vertrag mit anteiliger Vermietung│\n';
    doc += '  ├─────────────────────────────────────────────────────────────────┤\n';
    doc += '  │ [← Zurück]  [Weiter →]                                          │\n';
    doc += '  └─────────────────────────────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **Angezeigt pro Vertrag**:\n';
    doc += '  - Wohnung (Unit.name)\n';
    doc += '  - Mieter (Tenant.full_name)\n';
    doc += '  - Zeitraum (contract.start_date - contract.end_date)\n';
    doc += '  - Monate im Jahr (berechnet, z.B. "12" oder "8" bei anteiliger Vermietung)\n';
    doc += '  - Checkbox (alle vorausgewählt)\n';
    doc += '- **Auto-Berechnung** (pro Vertrag):\n';
    doc += '  ```javascript\n';
    doc += '  function calculateMonthsInYear(contract, year) {\n';
    doc += '    const yearStart = new Date(year, 0, 1);\n';
    doc += '    const yearEnd = new Date(year, 11, 31);\n';
    doc += '    const contractStart = new Date(contract.start_date);\n';
    doc += '    const contractEnd = contract.end_date ? new Date(contract.end_date) : yearEnd;\n';
    doc += '    \n';
    doc += '    const start = contractStart > yearStart ? contractStart : yearStart;\n';
    doc += '    const end = contractEnd < yearEnd ? contractEnd : yearEnd;\n';
    doc += '    \n';
    doc += '    const months = (end.getYear() - start.getYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;\n';
    doc += '    return months;\n';
    doc += '  }\n';
    doc += '  // Beispiel: Start 01.05.2023 → 8 Monate (Mai-Dezember)\n';
    doc += '  ```\n';
    doc += '- **User-Aktion**: \n';
    doc += '  - Verträge abwählen falls nicht abzurechnen (z.B. bei Auszug ohne Abrechnung)\n';
    doc += '  - Klick "Weiter"\n\n';
    
    doc += '**SCHRITT 3: Kosten auswählen**\n';
    doc += '- **UI**: Tabelle aller Kosten im Zeitraum (scrollbar bei > 10 Einträgen)\n';
    doc += '  ```\n';
    doc += '  ┌────────────────────────────────────────────────────────────────────────┐\n';
    doc += '  │ Kosten auswählen (3/5)                                                 │\n';
    doc += '  │ [━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░] 60%                           │\n';
    doc += '  ├────────────────────────────────────────────────────────────────────────┤\n';
    doc += '  │ Datum      │ Beschreibung         │ Kategorie     │ Betrag   │ Umlg│☑│\n';
    doc += '  ├────────────┼──────────────────────┼───────────────┼──────────┼─────┼─┤\n';
    doc += '  │ 15.02.2023 │ Grundsteuer Q1       │ Grundsteuer   │ 300,00 € │ ✅  │☑│\n';
    doc += '  │ 15.05.2023 │ Grundsteuer Q2       │ Grundsteuer   │ 300,00 € │ ✅  │☑│\n';
    doc += '  │ 15.08.2023 │ Grundsteuer Q3       │ Grundsteuer   │ 300,00 € │ ✅  │☑│\n';
    doc += '  │ 15.11.2023 │ Grundsteuer Q4       │ Grundsteuer   │ 300,00 € │ ✅  │☑│\n';
    doc += '  │ 10.03.2023 │ Gebäudeversicherung  │ Versicherung  │ 850,00 € │ ✅  │☑│\n';
    doc += '  │ 01.02.2023 │ Müllabfuhr           │ Nebenkosten   │ 420,00 € │ ✅  │☑│\n';
    doc += '  │ 01.06.2023 │ Hausmeister          │ Verwaltung    │ 1.200 €  │ ✅  │☑│\n';
    doc += '  │ 15.07.2023 │ Dachsanierung        │ Erhaltung     │ 5.000 €  │ ❌  │☐│\n';
    doc += '  │ ...        │                      │               │          │     │  │\n';
    doc += '  ├────────────┴──────────────────────┴───────────────┴──────────┴─────┴─┤\n';
    doc += '  │ ✅ 12 umlagefähig | ❌ 3 nicht umlagefähig | Summe: 4.523,80 €        │\n';
    doc += '  ├────────────────────────────────────────────────────────────────────────┤\n';
    doc += '  │ [← Zurück]  [Weiter →]                                                 │\n';
    doc += '  └────────────────────────────────────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **Spalten**:\n';
    doc += '  - Datum (due_date)\n';
    doc += '  - Beschreibung (description)\n';
    doc += '  - Kategorie (cost_category.name)\n';
    doc += '  - Betrag (amount)\n';
    doc += '  - Umlagefähig (cost_category.allocatable: ✅ Ja / ❌ Nein)\n';
    doc += '  - Verteilerschlüssel (Fläche, Personen, Pauschal) - editierbar per Dropdown\n';
    doc += '  - Checkbox (nur umlagefähige vorausgewählt)\n';
    doc += '- **Datenquelle**:\n';
    doc += '  ```javascript\n';
    doc += '  const costs = await base44.entities.GeneratedFinancialBooking.filter({\n';
    doc += '    building_id: building.id,\n';
    doc += '    due_date: { $gte: "2023-01-01", $lte: "2023-12-31" }\n';
    doc += '  });\n';
    doc += '  \n';
    doc += '  // Kategorie und Umlagefähigkeit laden\n';
    doc += '  for (const cost of costs) {\n';
    doc += '    const category = await getCostCategory(cost.cost_category_id);\n';
    doc += '    cost.allocatable = category.allocatable;\n';
    doc += '    cost.category_name = category.name;\n';
    doc += '  }\n';
    doc += '  ```\n';
    doc += '- **User-Aktion**: \n';
    doc += '  - Nicht umlegbare Kosten abwählen (z.B. Dachsanierung = Herstellung)\n';
    doc += '  - Verteilerschlüssel prüfen und ggf. anpassen\n';
    doc += '  - Klick "Weiter"\n';
    doc += '- **Validierung**:\n';
    doc += '  - ⚠️ WARNING: Keine Kosten ausgewählt → "Abrechnung unvollständig"\n';
    doc += '  - ⚠️ WARNING: Summe > 30% Abweichung zum Vorjahr → "Plausibilität prüfen"\n\n';
    
    doc += '**SCHRITT 4: Direkt-Kosten (optional)**\n';
    doc += '- **Zweck**: Kosten die nur einer bestimmten Wohnung zuzuordnen sind\n';
    doc += '- **Beispiel**: Reparatur Wasseranschluss nur in Wohnung 3\n';
    doc += '- **UI**: Pro Wohnung eine Zeile mit Eingabefeld\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────────────┐\n';
    doc += '  │ Direkt-Kosten (4/5)                     │\n';
    doc += '  │ [━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░] 80%   │\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ Wohnung          │ Direkt-Kosten (€)    │\n';
    doc += '  ├──────────────────┼──────────────────────┤\n';
    doc += '  │ Whg. EG links    │ [     0,00      ]    │\n';
    doc += '  │ Whg. EG rechts   │ [     0,00      ]    │\n';
    doc += '  │ Whg. 1.OG links  │ [   250,00      ] ← │ User gibt ein\n';
    doc += '  │ Whg. 1.OG rechts │ [     0,00      ]    │\n';
    doc += '  │ ...              │                      │\n';
    doc += '  ├──────────────────┴──────────────────────┤\n';
    doc += '  │ Summe Direkt-Kosten: 250,00 €           │\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ [← Zurück]  [Weiter →]                  │\n';
    doc += '  └─────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **User-Aktion**: Beträge eingeben (meistens leer → "Weiter")\n\n';
    
    doc += '**SCHRITT 5: Zusammenfassung & Erstellen**\n';
    doc += '- **UI**: Übersicht + Berechnungs-Preview pro Mieter\n';
    doc += '  ```\n';
    doc += '  ┌──────────────────────────────────────────────────────────────┐\n';
    doc += '  │ Zusammenfassung & Erstellen (5/5)                            │\n';
    doc += '  │ [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━] 100%             │\n';
    doc += '  ├──────────────────────────────────────────────────────────────┤\n';
    doc += '  │ ÜBERSICHT:                                                   │\n';
    doc += '  │ • Gebäude: Hauptstraße 1, Berlin                             │\n';
    doc += '  │ • Zeitraum: 01.01.2023 - 31.12.2023                          │\n';
    doc += '  │ • Anzahl Verträge: 6                                         │\n';
    doc += '  │ • Gesamtkosten: 4.523,80 €                                   │\n';
    doc += '  │ • Umlegbare Kosten: 4.523,80 €                               │\n';
    doc += '  │                                                              │\n';
    doc += '  │ VORSCHAU PRO MIETER:                                         │\n';
    doc += '  │ ┌────────────────────────────────────────────────────────┐  │\n';
    doc += '  │ │ Whg. 1 - Max Mustermann                                │  │\n';
    doc += '  │ │ Anteil:        18,5% (65,5 m² von 354 m²)              │  │\n';
    doc += '  │ │ Kosten:        836,90 €                                │  │\n';
    doc += '  │ │ Vorauszahlung: 1.800,00 € (150€ × 12)                  │  │\n';
    doc += '  │ │ ─────────────────────────────────────────              │  │\n';
    doc += '  │ │ GUTHABEN:      963,10 € ✅                             │  │\n';
    doc += '  │ └────────────────────────────────────────────────────────┘  │\n';
    doc += '  │ ┌────────────────────────────────────────────────────────┐  │\n';
    doc += '  │ │ Whg. 2 - Anna Schmidt                                  │  │\n';
    doc += '  │ │ Anteil:        18,4% (65 m² von 354 m²)                │  │\n';
    doc += '  │ │ Kosten:        831,38 €                                │  │\n';
    doc += '  │ │ Vorauszahlung: 600,00 € (50€ × 12)                     │  │\n';
    doc += '  │ │ ─────────────────────────────────────────              │  │\n';
    doc += '  │ │ NACHZAHLUNG:   231,38 € ⚠️                             │  │\n';
    doc += '  │ └────────────────────────────────────────────────────────┘  │\n';
    doc += '  │ ... (weitere 4 Mieter) ...                                   │\n';
    doc += '  ├──────────────────────────────────────────────────────────────┤\n';
    doc += '  │ [← Zurück]  [Abrechnungen erstellen] (grün)                  │\n';
    doc += '  └──────────────────────────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **User-Aktion**: Prüfen und "Abrechnungen erstellen" klicken\n\n';
    
    doc += '**SCHRITT 6: Generierung (Hintergrund-Prozess mit Progress)**\n';
    doc += '- **UI**: Loading-Overlay mit Fortschritt\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────────────┐\n';
    doc += '  │ Abrechnungen werden erstellt...          │\n';
    doc += '  │                                         │\n';
    doc += '  │ [━━━━━━━━━━━━━━━░░░░░░░░░] 60%         │\n';
    doc += '  │                                         │\n';
    doc += '  │ Aktuell: Whg. 1.OG links (4/6)          │\n';
    doc += '  └─────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **Prozess**:\n';
    doc += '  ```javascript\n';
    doc += '  // 1. OperatingCostStatement erstellen\n';
    doc += '  const statement = await base44.entities.OperatingCostStatement.create({\n';
    doc += '    building_id: building.id,\n';
    doc += '    year: 2023,\n';
    doc += '    period_start: "2023-01-01",\n';
    doc += '    period_end: "2023-12-31",\n';
    doc += '    status: "draft",\n';
    doc += '    total_costs: 4523.80\n';
    doc += '  });\n';
    doc += '  \n';
    doc += '  // 2. Gesamt-Fläche berechnen\n';
    doc += '  const units = await Unit.filter({ building_id });\n';
    doc += '  const total_area = units.reduce((sum, u) => sum + u.flaeche, 0);\n';
    doc += '  \n';
    doc += '  // 3. Pro Vertrag: Berechnung + Item erstellen\n';
    doc += '  for (const contract of selected_contracts) {\n';
    doc += '    const unit = units.find(u => u.id === contract.unit_id);\n';
    doc += '    const tenant = await Tenant.get(contract.tenant_id);\n';
    doc += '    \n';
    doc += '    // Anteil berechnen (nach Fläche)\n';
    doc += '    const share = unit.flaeche / total_area;\n';
    doc += '    const allocated_costs = total_costs * share;\n';
    doc += '    \n';
    doc += '    // Vorauszahlungen (anteilig bei nicht ganzjährig)\n';
    doc += '    const months = calculateMonthsInYear(contract, year);\n';
    doc += '    const prepayments = (contract.utilities + contract.heating) * months;\n';
    doc += '    \n';
    doc += '    // Saldo (positiv = Nachzahlung, negativ = Guthaben)\n';
    doc += '    const balance = allocated_costs - prepayments;\n';
    doc += '    \n';
    doc += '    // Item speichern\n';
    doc += '    await OperatingCostStatementItem.create({\n';
    doc += '      statement_id: statement.id,\n';
    doc += '      unit_id: unit.id,\n';
    doc += '      tenant_id: tenant.id,\n';
    doc += '      contract_id: contract.id,\n';
    doc += '      allocated_costs: allocated_costs,\n';
    doc += '      prepayments: prepayments,\n';
    doc += '      balance: balance,\n';
    doc += '      months_in_year: months\n';
    doc += '    });\n';
    doc += '  }\n';
    doc += '  \n';
    doc += '  // 4. Status aktualisieren\n';
    doc += '  await statement.update({ status: "finalized" });\n';
    doc += '  ```\n';
    doc += '- **Dauer**: ~5-10 Sekunden (bei 6 Mietern)\n';
    doc += '- **Erfolg**: Toast "✅ Abrechnungen für 6 Mieter erstellt"\n\n';
    
    doc += '**SCHRITT 7: Dokumente generieren (optional)**\n';
    doc += '- **Trigger**: Automatischer Dialog "PDF-Dokumente für alle Mieter erstellen?"\n';
    doc += '- **User-Aktion**: "Ja" / "Nein" / "Später"\n';
    doc += '- **Bei "Ja"**: Multi-Dokument-Generierung\n';
    doc += '  ```javascript\n';
    doc += '  const items = await OperatingCostStatementItem.filter({ statement_id });\n';
    doc += '  \n';
    doc += '  for (const item of items) {\n';
    doc += '    // Daten laden\n';
    doc += '    const tenant = await Tenant.get(item.tenant_id);\n';
    doc += '    const unit = await Unit.get(item.unit_id);\n';
    doc += '    const contract = await LeaseContract.get(item.contract_id);\n';
    doc += '    \n';
    doc += '    // Template befüllen\n';
    doc += '    const html = fillTemplate("Betriebskostenabrechnung", {\n';
    doc += '      building, unit, tenant, contract, \n';
    doc += '      costs: selected_costs,\n';
    doc += '      item: item,\n';
    doc += '      year: 2023\n';
    doc += '    });\n';
    doc += '    \n';
    doc += '    // PDF generieren\n';
    doc += '    const { file_url, pages } = await base44.functions.invoke("generatePDF", {\n';
    doc += '      html,\n';
    doc += '      fileName: `NK-Abrechnung-2023-${tenant.last_name}.pdf`\n';
    doc += '    });\n';
    doc += '    \n';
    doc += '    // Document Entity erstellen\n';
    doc += '    await Document.create({\n';
    doc += '      name: `NK-Abrechnung 2023 - ${unit.name}`,\n';
    doc += '      template_id: template.id,\n';
    doc += '      category: "Verwaltung",\n';
    doc += '      status: "erstellt",\n';
    doc += '      content: html,\n';
    doc += '      pdf_url: file_url,\n';
    doc += '      building_id: building.id,\n';
    doc += '      unit_id: unit.id,\n';
    doc += '      contract_id: contract.id,\n';
    doc += '      tenant_id: tenant.id,\n';
    doc += '      recipient_name: `${tenant.first_name} ${tenant.last_name}`,\n';
    doc += '      recipient_address: `${unit.name}\\n${building.address}\\n${building.zip_code} ${building.city}`,\n';
    doc += '      seitenanzahl: pages,\n';
    doc += '      data_snapshot: { building, unit, tenant, contract, costs, item }\n';
    doc += '    });\n';
    doc += '  }\n';
    doc += '  ```\n';
    doc += '- **Dauer**: ~3-5 Sekunden pro Dokument = ~18-30 Sekunden für 6 Mieter\n';
    doc += '- **Erfolg**: Toast "✅ 6 Abrechnungs-Dokumente erstellt"\n\n';
    
    doc += '**SCHRITT 8: Versand (optional - Massen-Aktion)**\n';
    doc += '- **User-Aktion**: Button "Alle per Post versenden" (nach Dokument-Generierung)\n';
    doc += '- **Dialog**: "6 Dokumente versenden für ca. 8,58 € (6 × 1,43 €)?"\n';
    doc += '- **Prozess**: Für jedes Dokument → LetterXpress-Versand (siehe Workflow 15)\n';
    doc += '- **Dauer**: ~60 Sekunden für 6 Sendungen (Rate Limit: 1/sec)\n\n';
    
    doc += '### 8.4 Ausgabe/Ergebnis\n\n';
    doc += '**Neue Datensätze**:\n';
    doc += '- 1x OperatingCostStatement (status="finalized")\n';
    doc += '- 6x OperatingCostStatementItem (je 1 pro Mieter)\n';
    doc += '- Optional: 6x Document (NK-Abrechnung-PDFs)\n';
    doc += '- Optional: 6x LetterShipment (bei Versand)\n';
    doc += '- 1x ActivityLog ("operating_cost_statement_created")\n\n';
    
    doc += '### 8.5 Fehlerszenarien\n\n';
    doc += '**Fehler 1: Keine Vorauszahlungen in Verträgen**\n';
    doc += '- **Reaktion**: ⚠️ WARNING "Vorauszahlungen fehlen - Abrechnung unvollständig"\n';
    doc += '- **User kann**: Trotzdem fortfahren (Vorauszahlungen = 0) oder abbrechen und Verträge aktualisieren\n\n';
    
    doc += '**Fehler 2: Wohnflächen fehlen**\n';
    doc += '- **Reaktion**: ❌ BLOCKER "Wohnflächen erforderlich für Verteilung"\n';
    doc += '- **User muss**: Wohnflächen in Units nachtragen\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 14: Bankkonto verbinden (finAPI)\n\n';
    
    doc += '### 14.1 Identifikation\n\n';
    doc += '- **Workflow-Name**: Banking-Integration via finAPI\n';
    doc += '- **Hauptziel**: Bankkonto verbinden und Transaktionen automatisch importieren\n';
    doc += '- **User-Typ**: Verwalter, Admin\n';
    doc += '- **Häufigkeit**: Einmalig pro Bank + regelmäßige Sync\n';
    doc += '- **Komplexität**: Mittel (~5 Minuten)\n';
    doc += '- **Geschätzte Dauer**: 5-8 Minuten (inkl. TAN-Eingabe)\n\n';
    
    doc += '### 14.2 Voraussetzungen\n\n';
    doc += '- ✅ finAPI Secrets gesetzt (FINAPI_CLIENT_ID, FINAPI_CLIENT_SECRET, FINAPI_BASE_URL)\n';
    doc += '- ✅ Online-Banking bei der Bank aktiviert\n';
    doc += '- ✅ TAN-Verfahren eingerichtet (pushTAN, photoTAN, SMS-TAN)\n\n';
    
    doc += '### 14.3 Schritt-für-Schritt\n\n';
    doc += '**SCHRITT 1: Navigation**\n';
    doc += '- **Seite**: `/BankAccounts`\n';
    doc += '- **User-Aktion**: Hauptmenü → "Bank/Kasse"\n';
    doc += '- **UI**: Liste verbundener Konten oder EmptyState\n\n';
    
    doc += '**SCHRITT 2: finAPI-Flow starten**\n';
    doc += '- **User-Aktion**: Button "Bankkonto verbinden" (grün, oben rechts)\n';
    doc += '- **Hintergrund**: Backend-Funktion aufrufen\n';
    doc += '  ```javascript\n';
    doc += '  const result = await base44.functions.invoke("finapiConnect", {});\n';
    doc += '  // Ergebnis: { web_form_url: "https://finapi.io/..." }\n';
    doc += '  ```\n';
    doc += '- **Navigation**: Redirect zu finAPI Web Form (neues Fenster oder iframe)\n';
    doc += '- **UI**: Loading → "Sie werden zu finAPI weitergeleitet..."\n\n';
    
    doc += '**SCHRITT 3: Bank auswählen (bei finAPI - externe UI)**\n';
    doc += '- **UI**: finAPI-Interface (nicht unsere App!)\n';
    doc += '- **User-Aktion**: \n';
    doc += '  - Bank-Name eingeben in Suchfeld (z.B. "Sparkasse Berlin")\n';
    doc += '  - Bank aus Ergebnisliste wählen\n';
    doc += '- **Angezeigt**: Logo der Bank, Name, BLZ\n\n';
    
    doc += '**SCHRITT 4: Zugangsdaten eingeben (bei finAPI)**\n';
    doc += '- **Felder** (je nach Bank unterschiedlich):\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────────────┐\n';
    doc += '  │ Sparkasse Berlin - Anmeldung            │\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ Online-Banking Benutzername:            │\n';
    doc += '  │ [            12345678            ]      │\n';
    doc += '  │                                         │\n';
    doc += '  │ PIN:                                    │\n';
    doc += '  │ [            ••••••••            ]      │\n';
    doc += '  │                                         │\n';
    doc += '  │ ☑ Zugangsdaten sicher speichern         │\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ [Abbrechen]  [Weiter]                   │\n';
    doc += '  └─────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **Security**: Daten gehen DIREKT an finAPI (nicht über unsere App!)\n';
    doc += '- **Checkbox "Speichern"**: finAPI speichert Zugangsdaten verschlüsselt für spätere Syncs\n\n';
    
    doc += '**SCHRITT 5: TAN-Autorisierung (PSD2 Strong Authentication)**\n';
    doc += '- **Process**: Bank sendet TAN\n';
    doc += '  - pushTAN (in Banking-App)\n';
    doc += '  - photoTAN (QR-Code scannen)\n';
    doc += '  - SMS-TAN (per SMS)\n';
    doc += '- **UI** (finAPI):\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────────────┐\n';
    doc += '  │ TAN-Eingabe erforderlich                │\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ Bitte autorisieren Sie den Zugriff      │\n';
    doc += '  │ in Ihrer Sparkassen-App (pushTAN).      │\n';
    doc += '  │                                         │\n';
    doc += '  │ [━━━━━━━━━━━━━━━━] Warte auf Freigabe...│\n';
    doc += '  │                                         │\n';
    doc += '  │ Timeout in: 2:45 Minuten                │\n';
    doc += '  └─────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **User-Aktion**: TAN in Banking-App bestätigen (außerhalb unserer App)\n';
    doc += '- **Timeout**: 3 Minuten (bei Überschreitung: Prozess neu starten)\n';
    doc += '- **PSD2-Compliance**: Starke Authentifizierung gesetzlich vorgeschrieben\n\n';
    
    doc += '**SCHRITT 6: Konten auswählen**\n';
    doc += '- **UI**: finAPI zeigt alle gefundenen Konten\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────────────────────────┐\n';
    doc += '  │ Konten auswählen                                    │\n';
    doc += '  ├─────────────────────────────────────────────────────┤\n';
    doc += '  │ ☑ Girokonto                                         │\n';
    doc += '  │   DE89 3704 0044 0532 0130 00                       │\n';
    doc += '  │   Kontostand: 5.432,10 €                            │\n';
    doc += '  │                                                     │\n';
    doc += '  │ ☑ Sparkonto                                         │\n';
    doc += '  │   DE89 3704 0044 0532 0130 01                       │\n';
    doc += '  │   Kontostand: 12.500,00 €                           │\n';
    doc += '  │                                                     │\n';
    doc += '  │ ☐ Kreditkarte                                       │\n';
    doc += '  │   DE89 3704 0044 0532 0130 02                       │\n';
    doc += '  │   Limit: -1.500,00 €                                │\n';
    doc += '  ├─────────────────────────────────────────────────────┤\n';
    doc += '  │ 2 Konten ausgewählt                                 │\n';
    doc += '  ├─────────────────────────────────────────────────────┤\n';
    doc += '  │ [Abbrechen]  [Verbindung herstellen]                │\n';
    doc += '  └─────────────────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **User-Aktion**: Gewünschte Konten auswählen (Checkboxen)\n';
    doc += '- **Empfehlung**: Alle Konten auswählen (späteres Hinzufügen schwieriger)\n';
    doc += '- **Submit**: "Verbindung herstellen"\n\n';
    
    doc += '**SCHRITT 7: Callback & Import**\n';
    doc += '- **Navigation**: Redirect zurück zu unserer App `/FinAPICallback?id={connection_id}`\n';
    doc += '- **UI**: Loading-Screen\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────────────┐\n';
    doc += '  │ Konten werden importiert...              │\n';
    doc += '  │                                         │\n';
    doc += '  │ [━━━━━━━━━━━━━━━━━━░░░░░] 75%          │\n';
    doc += '  │                                         │\n';
    doc += '  │ • Konten importiert: 2/2 ✅              │\n';
    doc += '  │ • Transaktionen geladen: 156/? ⏳        │\n';
    doc += '  └─────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **Hintergrund**:\n';
    doc += '  ```javascript\n';
    doc += '  // 1. Connection-ID aus URL extrahieren\n';
    doc += '  const connection_id = new URLSearchParams(window.location.search).get("id");\n';
    doc += '  \n';
    doc += '  // 2. Konten importieren (Backend)\n';
    doc += '  const accounts = await base44.functions.invoke("finapiImportAccounts", {\n';
    doc += '    connection_id\n';
    doc += '  });\n';
    doc += '  \n';
    doc += '  // → BankAccount Entities erstellen:\n';
    doc += '  for (const acc of accounts.data) {\n';
    doc += '    await BankAccount.create({\n';
    doc += '      name: acc.accountName,\n';
    doc += '      account_type: "bank",\n';
    doc += '      bank_name: acc.bankName,\n';
    doc += '      iban: acc.iban,\n';
    doc += '      current_balance: acc.balance,\n';
    doc += '      finapi_connection_id: connection_id,\n';
    doc += '      finapi_user_id: acc.userId\n';
    doc += '    });\n';
    doc += '  }\n';
    doc += '  \n';
    doc += '  // 3. Erste Transaktionen laden\n';
    doc += '  const transactions = await base44.functions.invoke("finapiSync", {\n';
    doc += '    connection_id\n';
    doc += '  });\n';
    doc += '  \n';
    doc += '  // → BankTransaction Entities erstellen:\n';
    doc += '  for (const tx of transactions.data) {\n';
    doc += '    await BankTransaction.create({\n';
    doc += '      bank_account_id: bankAccount.id,\n';
    doc += '      finapi_transaction_id: tx.id,\n';
    doc += '      amount: tx.amount,\n';
    doc += '      purpose: tx.purpose,\n';
    doc += '      counterpart_name: tx.counterpartName,\n';
    doc += '      counterpart_iban: tx.counterpartIban,\n';
    doc += '      booking_date: tx.bankBookingDate,\n';
    doc += '      value_date: tx.valueDate\n';
    doc += '    });\n';
    doc += '  }\n';
    doc += '  ```\n';
    doc += '- **Dauer**: ~10-30 Sekunden (je nach Anzahl Transaktionen)\n';
    doc += '- **Erfolg**: Toast "✅ 2 Konten verbunden, 156 Transaktionen importiert"\n';
    doc += '- **Navigation**: Automatischer Redirect zu `/BankAccounts`\n\n';
    
    doc += '**SCHRITT 8: Automatisches Matching (Hintergrund)**\n';
    doc += '- **Trigger**: Nach Import automatisch\n';
    doc += '- **Prozess**: KI-gestütztes Matching (siehe Workflow 7)\n';
    doc += '- **User-Benachrichtigung**: "ℹ️ 12 mögliche Zuordnungen gefunden - jetzt prüfen?"\n\n';
    
    doc += '### 14.3 Regelmäßiger Sync\n\n';
    doc += '**Automatischer Sync (Scheduled Task)**:\n';
    doc += '- Täglich um 6:00 Uhr\n';
    doc += '- Funktion: `finapiSync`\n';
    doc += '- Lädt neue Transaktionen seit letztem Sync\n';
    doc += '- Aktualisiert Kontostände\n';
    doc += '- User erhält Notification bei neuen Transaktionen\n\n';
    
    doc += '**Manueller Sync**:\n';
    doc += '- Button "Jetzt synchronisieren" auf BankAccounts-Seite\n';
    doc += '- Max. 4x pro Tag (PSD2-Limit!)\n';
    doc += '- Toast bei Überschreitung: "⚠️ PSD2-Limit erreicht - nächster Sync morgen möglich"\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW 15: Brief per Post versenden (LetterXpress)\n\n';
    
    doc += '### 15.1 Identifikation\n\n';
    doc += '- **Workflow-Name**: Postversand via LetterXpress\n';
    doc += '- **Hauptziel**: Dokument automatisch per Post versenden (ohne Gang zur Post)\n';
    doc += '- **User-Typ**: Verwalter\n';
    doc += '- **Häufigkeit**: Mehrmals pro Monat\n';
    doc += '- **Komplexität**: Einfach (~2 Minuten)\n';
    doc += '- **Geschätzte Dauer**: 2 Minuten\n\n';
    
    doc += '### 15.2 Voraussetzungen\n\n';
    doc += '- ✅ Dokument als PDF generiert (Document.pdf_url muss existieren)\n';
    doc += '- ✅ LetterXpress-Account konfiguriert (Settings → LetterXpress)\n';
    doc += '- ✅ Guthaben vorhanden (mind. 1-2 EUR pro Brief)\n';
    doc += '- ✅ Empfänger-Adresse vollständig (Document.recipient_address)\n\n';
    
    doc += '### 15.3 Schritt-für-Schritt\n\n';
    doc += '**SCHRITT 1: Dokument auswählen**\n';
    doc += '- **Seite**: `/Documents` oder `/Kommunikation` → Tab "Postversand"\n';
    doc += '- **User-Aktion**: Bei Dokument in Liste → Button "Per Post versenden" (Mail-Icon)\n';
    doc += '- **Validierung**: \n';
    doc += '  - ✅ PDF muss existieren (Document.pdf_url)\n';
    doc += '  - ✅ Empfänger-Adresse muss vollständig sein\n';
    doc += '  - ⚠️ Dokument bereits versendet? → Warnung anzeigen\n\n';
    
    doc += '**SCHRITT 2: Versand-Dialog**\n';
    doc += '- **Dialog**: SendLetterDialog öffnet sich\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────────────────────────┐\n';
    doc += '  │ Per Post versenden                                  │\n';
    doc += '  ├─────────────────────────────────────────────────────┤\n';
    doc += '  │ DOKUMENT:                                           │\n';
    doc += '  │ • Name: NK-Abrechnung 2023 - Whg. 1                 │\n';
    doc += '  │ • Seiten: 6                                         │\n';
    doc += '  │                                                     │\n';
    doc += '  │ EMPFÄNGER:                                          │\n';
    doc += '  │ Max Mustermann                                      │\n';
    doc += '  │ Whg. 1.OG links                                     │\n';
    doc += '  │ Hauptstraße 1                                       │\n';
    doc += '  │ 10115 Berlin                                        │\n';
    doc += '  └─────────────────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **Angezeigt** (nicht editierbar):\n';
    doc += '  - Dokumentname\n';
    doc += '  - Empfänger (aus Document.recipient_name)\n';
    doc += '  - Empfänger-Adresse (mehrzeilig)\n';
    doc += '  - Seitenanzahl\n\n';
    
    doc += '**SCHRITT 3: Versandoptionen wählen**\n';
    doc += '- **UI**: Radio-Buttons + Checkboxen\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────────────┐\n';
    doc += '  │ VERSANDOPTIONEN:                        │\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ Versandart:                             │\n';
    doc += '  │ ⚪ Normal (Standard)                     │\n';
    doc += '  │ ⚪ Einschreiben Einwurf (R1)    +3,69 €  │ ← empfohlen\n';
    doc += '  │ ⚪ Einschreiben (R2)            +4,05 €  │\n';
    doc += '  │                                         │\n';
    doc += '  │ Optionen:                               │\n';
    doc += '  │ ☐ Farbdruck        +0,60 € (6 × 0,10 €) │\n';
    doc += '  │ ☑ Doppelseitig (Duplex)      inklusive  │\n';
    doc += '  └─────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **Versandart-Info**:\n';
    doc += '  - Normal: Standard-Briefversand (kein Nachweis)\n';
    doc += '  - R1 (Einwurf): Zustellnachweis, ohne Unterschrift\n';
    doc += '  - R2 (Einschreiben): Persönliche Zustellung mit Unterschrift\n';
    doc += '- **Empfehlung**: R1 für wichtige Dokumente (Mieterhöhung, Kündigung)\n\n';
    
    doc += '**SCHRITT 4: Kosten berechnen (automatisch)**\n';
    doc += '- **Auto-Berechnung** (live bei jeder Änderung der Optionen):\n';
    doc += '  ```javascript\n';
    doc += '  const price = await base44.functions.invoke("letterxpress", {\n';
    doc += '    action: "calculate_price",\n';
    doc += '    pages: 6,\n';
    doc += '    color: "1", // SW\n';
    doc += '    mode: "duplex",\n';
    doc += '    shipping_type: "r1"\n';
    doc += '  });\n';
    doc += '  // Ergebnis: { net: 4.89, gross: 5.82 }\n';
    doc += '  ```\n';
    doc += '- **Angezeigt** (Live-Update):\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────────────┐\n';
    doc += '  │ KOSTENBERECHNUNG:                       │\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ Basis (6 Seiten, SW, Duplex):   1,20 €  │\n';
    doc += '  │ Einschreiben Einwurf (R1):      3,69 €  │\n';
    doc += '  │ ─────────────────────────────────────   │\n';
    doc += '  │ Gesamt (netto):                 4,89 €  │\n';
    doc += '  │ MwSt (19%):                     0,93 €  │\n';
    doc += '  │ ═════════════════════════════════════   │\n';
    doc += '  │ GESAMT (brutto):                5,82 €  │\n';
    doc += '  │                                         │\n';
    doc += '  │ Aktuelles Guthaben:            50,00 €  │\n';
    doc += '  │ Verbleibendes Guthaben:        44,18 €  │\n';
    doc += '  └─────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **Warnung bei niedrigem Guthaben**:\n';
    doc += '  - < 10 EUR: ⚠️ "Guthaben niedrig - bitte aufladen"\n';
    doc += '  - < Kosten: ❌ BLOCKER "Guthaben nicht ausreichend (5,82 € erforderlich, 2,00 € vorhanden)"\n\n';
    
    doc += '**SCHRITT 5: Versand bestätigen**\n';
    doc += '- **User-Aktion**: Button "Jetzt versenden" (grün, unten rechts)\n';
    doc += '- **Validierung**:\n';
    doc += '  - ✅ BLOCKER: Guthaben ausreichend?\n';
    doc += '  - ⚠️ WARNING: "Dokument wurde bereits am 03.01.2024 versendet (Job-ID: 12345678)"\n';
    doc += '- **Bestätigungs-Dialog**:\n';
    doc += '  ```\n';
    doc += '  ┌─────────────────────────────────────────┐\n';
    doc += '  │ Versand bestätigen                      │\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ Wirklich versenden für 5,82 €?          │\n';
    doc += '  │                                         │\n';
    doc += '  │ Empfänger: Max Mustermann               │\n';
    doc += '  │ Versandart: Einschreiben Einwurf (R1)   │\n';
    doc += '  │                                         │\n';
    doc += '  │ ⚠️ Versand kann nicht rückgängig        │\n';
    doc += '  │    gemacht werden!                      │\n';
    doc += '  ├─────────────────────────────────────────┤\n';
    doc += '  │ [Nein, abbrechen]  [Ja, versenden]      │\n';
    doc += '  └─────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **User-Aktion**: "Ja, versenden" (finale Bestätigung)\n\n';
    
    doc += '**SCHRITT 6: Versand (Hintergrund-Prozess)**\n';
    doc += '- **UI**: Loading "Brief wird versendet..."\n';
    doc += '- **Prozess**:\n';
    doc += '  ```javascript\n';
    doc += '  // 1. PDF von Storage laden\n';
    doc += '  const pdfResponse = await fetch(document.pdf_url);\n';
    doc += '  const pdfBuffer = await pdfResponse.arrayBuffer();\n';
    doc += '  \n';
    doc += '  // 2. Base64 + SHA-256 Checksum\n';
    doc += '  const base64 = bufferToBase64(pdfBuffer);\n';
    doc += '  const checksum = sha256(pdfBuffer).substring(0, 32);\n';
    doc += '  \n';
    doc += '  // 3. LetterXpress API aufrufen\n';
    doc += '  const result = await base44.functions.invoke("letterxpress", {\n';
    doc += '    action: "send_letter",\n';
    doc += '    base64_file: base64,\n';
    doc += '    base64_checksum: checksum,\n';
    doc += '    color: "1", // SW\n';
    doc += '    mode: "duplex",\n';
    doc += '    shipping_type: "r1",\n';
    doc += '    notice: document.name // für LXP-interne Referenz\n';
    doc += '  });\n';
    doc += '  // result: { job: { id, status, price } }\n';
    doc += '  \n';
    doc += '  // 4. LetterShipment Entity erstellen\n';
    doc += '  await LetterShipment.create({\n';
    doc += '    lxp_job_id: result.job.id,\n';
    doc += '    document_id: document.id,\n';
    doc += '    building_id: document.building_id,\n';
    doc += '    recipient_name: document.recipient_name,\n';
    doc += '    recipient_address: document.recipient_address,\n';
    doc += '    document_type: document.category,\n';
    doc += '    filename: document.name,\n';
    doc += '    pages: document.seitenanzahl,\n';
    doc += '    color: "1",\n';
    doc += '    print_mode: "duplex",\n';
    doc += '    shipping_type: "r1",\n';
    doc += '    status: "queue", // wird von LXP verarbeitet\n';
    doc += '    cost_net: result.job.price.net,\n';
    doc += '    cost_gross: result.job.price.gross\n';
    doc += '  });\n';
    doc += '  \n';
    doc += '  // 5. Document Status aktualisieren\n';
    doc += '  await document.update({\n';
    doc += '    versandstatus: "in_versand",\n';
    doc += '    lxp_job_id: result.job.id\n';
    doc += '  });\n';
    doc += '  \n';
    doc += '  // 6. LetterXpress Guthaben aktualisieren\n';
    doc += '  const credential = await LetterXpressCredential.get(...);\n';
    doc += '  await credential.update({\n';
    doc += '    balance: credential.balance - result.job.price.gross\n';
    doc += '  });\n';
    doc += '  ```\n';
    doc += '- **Dauer**: ~5-10 Sekunden\n';
    doc += '- **Erfolg**: Toast "✅ Brief wurde versendet (Job-ID: 12345678) - Tracking in ~24h verfügbar"\n';
    doc += '- **Dialog schließt sich**\n';
    doc += '- **Navigation**: Zurück zu Dokumentenliste\n\n';
    
    doc += '**SCHRITT 7: Tracking-Updates (automatisch, täglich)**\n';
    doc += '- **Scheduled Task**: Täglich um 12:00 Uhr (Admin-only)\n';
    doc += '- **Funktion**: `updateLetterTrackingCodes`\n';
    doc += '- **Prozess**:\n';
    doc += '  ```javascript\n';
    doc += '  // Alle offenen Shipments (noch nicht zugestellt)\n';
    doc += '  const shipments = await LetterShipment.filter({\n';
    doc += '    status: { $in: ["queue", "hold", "done"] } // nicht "sent" oder "canceled"\n';
    doc += '  });\n';
    doc += '  \n';
    doc += '  for (const shipment of shipments) {\n';
    doc += '    // LetterXpress API: Job-Status abrufen\n';
    doc += '    const job = await letterxpress_get_job(shipment.lxp_job_id);\n';
    doc += '    \n';
    doc += '    // Shipment aktualisieren\n';
    doc += '    await shipment.update({\n';
    doc += '      status: job.status, // queue → hold → done → sent\n';
    doc += '      tracking_code: job.tracking_code || null,\n';
    doc += '      dispatch_date: job.dispatch_date || null,\n';
    doc += '      sent_at: job.status === "sent" ? new Date() : null\n';
    doc += '    });\n';
    doc += '    \n';
    doc += '    // Bei Status "sent" → Document aktualisieren\n';
    doc += '    if (job.status === "sent") {\n';
    doc += '      const document = await Document.get(shipment.document_id);\n';
    doc += '      await document.update({\n';
    doc += '        versandstatus: "versendet",\n';
    doc += '        versandt_am: new Date(),\n';
    doc += '        versandart: shipment.shipping_type\n';
    doc += '      });\n';
    doc += '      \n';
    doc += '      // Notification erstellen\n';
    doc += '      await Notification.create({\n';
    doc += '        type: "success",\n';
    doc += '        title: "Dokument zugestellt",\n';
    doc += '        message: `${document.name} wurde zugestellt (Tracking: ${job.tracking_code})`,\n';
    doc += '        action_url: `/Documents`\n';
    doc += '      });\n';
    doc += '    }\n';
    doc += '  }\n';
    doc += '  ```\n';
    doc += '- **User-Benachrichtigung**: Notification im Bell-Icon (Header)\n\n';
    
    doc += '**SCHRITT 8: Tracking-Code einsehen**\n';
    doc += '- **Seite**: `/Kommunikation` → Tab "Postversand" → Sub-Tab "Postausgangsbuch"\n';
    doc += '- **UI**: Tabelle aller Sendungen\n';
    doc += '  ```\n';
    doc += '  ┌──────────────────────────────────────────────────────────────────┐\n';
    doc += '  │ POSTAUSGANGSBUCH                                                 │\n';
    doc += '  ├──────────────────────────────────────────────────────────────────┤\n';
    doc += '  │ Datum      │ Empfänger       │ Dokument     │ Status   │ Track. │\n';
    doc += '  ├────────────┼─────────────────┼──────────────┼──────────┼────────┤\n';
    doc += '  │ 07.01.2024 │ Max Mustermann  │ NK-Abr. 2023 │ Versendet│ 🔗123..│\n';
    doc += '  │ 07.01.2024 │ Anna Schmidt    │ NK-Abr. 2023 │ Versendet│ 🔗123..│\n';
    doc += '  │ 05.01.2024 │ Peter Müller    │ Mieterhöhung │ In Druck │ -      │\n';
    doc += '  │ ...                                                              │\n';
    doc += '  └──────────────────────────────────────────────────────────────────┘\n';
    doc += '  ```\n';
    doc += '- **Klick auf Tracking-Code**: Link zu DHL-Sendungsverfolgung öffnet sich (neues Fenster)\n';
    doc += '  - URL: `https://www.dhl.de/de/privatkunden/dhl-sendungsverfolgung.html?piececode={tracking_code}`\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW-ÜBERSICHT: Performance & Zeiten\n\n';
    doc += '| Workflow | Komplexität | Durchschnitt | User-Aktionen | DB-Operationen | API-Calls |\n';
    doc += '|----------|-------------|--------------|---------------|----------------|----------|\n';
    doc += '| 1. Objekt anlegen | Mittel | 20 Min | ~30 | 1 Building + 6 Units + 2 Relationships + 1 Library | 1 (loadTaxLibrary) |\n';
    doc += '| 2. Eigentümer (Person) | Einfach | 2 Min | ~8 | 1 Owner | 0 |\n';
    doc += '| 2. Eigentümer (GbR) | Mittel | 5 Min | ~15 | 1 Owner + 2 Shareholders | 0 |\n';
    doc += '| 4. Mietvertrag | Mittel | 12 Min | ~20 | 1 Contract + 12 Bookings | 1 (generateBookings) |\n';
    doc += '| 6. Rechnung (Upload) | Einfach | 2 Min | ~5 | 1 Invoice + 1 Booking | 2 (UploadFile, InvokeLLM) |\n';
    doc += '| 8. Betriebskosten | Komplex | 45 Min | ~40 | 1 Statement + 6 Items + 6 Documents | 6 (generatePDF) |\n';
    doc += '| 14. Banking | Mittel | 6 Min | ~12 | 2 Accounts + 156 Transactions | 3 (connect, import, sync) |\n';
    doc += '| 15. Post versenden | Einfach | 2 Min | ~4 | 1 LetterShipment + Update Document | 2 (calculate, send) |\n\n';
    
    doc += '---\n\n';
    
    doc += '## WORKFLOW-ABHÄNGIGKEITEN (Reihenfolge)\n\n';
    doc += '```\n';
    doc += '1. Objekt anlegen (Workflow 1)\n';
    doc += '   ↓\n';
    doc += '2. Eigentümer anlegen & zuordnen (Workflow 2)\n';
    doc += '   ↓\n';
    doc += '3. Optional: Kaufvertrag erfassen → AfA generieren\n';
    doc += '   ↓\n';
    doc += '4. Steuer-Bibliothek initialisieren (falls noch nicht geschehen)\n';
    doc += '   ↓\n';
    doc += '5. Mietvertrag erstellen (Workflow 4)\n';
    doc += '   ↓\n';
    doc += '6. Buchungen automatisch generieren lassen\n';
    doc += '   ↓\n';
    doc += '7. Banking verbinden (Workflow 14) - parallel möglich\n';
    doc += '   ↓\n';
    doc += '8. Rechnungen erfassen (Workflow 6) - laufend\n';
    doc += '   ↓\n';
    doc += '9. Nach Jahresende: Betriebskosten (Workflow 8)\n';
    doc += '   ↓\n';
    doc += '10. Dokumente versenden (Workflow 15)\n';
    doc += '   ↓\n';
    doc += '11. Anlage V für Steuererklärung (Workflow 9)\n';
    doc += '```\n\n';
    
    doc += '**Kritischer Pfad** (muss in dieser Reihenfolge):\n';
    doc += '- Objekt → Einheiten → Mietvertrag → Betriebskosten\n\n';
    doc += '**Parallel möglich**:\n';
    doc += '- Banking-Verbindung zu jeder Zeit\n';
    doc += '- Rechnungen erfassen unabhängig von Verträgen\n';
    doc += '- Eigentümer können vor oder nach Objektanlage erfasst werden\n\n';
    
    return doc;
}

async function generatePermissionsDoc() {
    let doc = '# Berechtigungen & Rollen - Vollständige Dokumentation\n\n';
    doc += '**Metadaten:**\n';
    doc += `- Generiert am: ${new Date().toLocaleString('de-DE')}\n`;
    doc += '- Verwendungszweck: KI-Assistent Kontextinformation\n';
    doc += '- Rollen-Anzahl: 2 (Admin, User)\n';
    doc += '- Authentifizierungs-Typ: Base44 Built-in (JWT)\n\n';
    doc += '---\n\n';
    
    doc += '## 1. ALLE USER-ROLLEN\n\n';
    
    doc += '### 1.1 Admin\n\n';
    doc += '**Rollenname**: `admin`\n\n';
    doc += '**Beschreibung**: \n';
    doc += '- Voller Systemzugriff (Super-User)\n';
    doc += '- Typischerweise: App-Owner, System-Administrator, IT-Leiter\n';
    doc += '- Kann andere Admins einladen\n';
    doc += '- Verantwortlich für System-Konfiguration und Wartung\n\n';
    doc += '**Hierarchie**: \n';
    doc += '- ⭐ **Höchste Rolle** - steht über allen anderen\n';
    doc += '- Kann alle User-Rollen sehen und verwalten\n';
    doc += '- Kann keine höhere Rolle erhalten (Admin ist Maximum)\n\n';
    doc += '**Typische Nutzer**:\n';
    doc += '- Geschäftsführer / Inhaber der Hausverwaltung\n';
    doc += '- IT-Administrator\n';
    doc += '- Steuerberater (mit erweiterten Rechten)\n\n';
    
    doc += '### 1.2 User (Standard)\n\n';
    doc += '**Rollenname**: `user`\n\n';
    doc += '**Beschreibung**: \n';
    doc += '- Standard-Rolle für alle regulären Benutzer\n';
    doc += '- Typischerweise: Verwalter, Sachbearbeiter, Buchhalter\n';
    doc += '- Voll arbeitsfähig, aber keine System-Administration\n';
    doc += '- Default-Rolle bei Einladung (wenn nicht explizit "admin")\n\n';
    doc += '**Hierarchie**: \n';
    doc += '- ⬇️ **Standard-Rolle** - steht unter Admin\n';
    doc += '- Kann andere User (keine Admins) einladen\n';
    doc += '- Kann nicht zu Admin befördert werden (nur durch Admin)\n\n';
    doc += '**Typische Nutzer**:\n';
    doc += '- Hausverwaltungs-Mitarbeiter\n';
    doc += '- Buchhalter / Finanz-Mitarbeiter\n';
    doc += '- Assistenz / Sekretariat\n\n';
    
    doc += '### 1.3 Geplante Rollen (nicht implementiert)\n\n';
    doc += 'Diese Rollen sind derzeit NICHT in der App verfügbar:\n\n';
    doc += '**Eigentümer (Owner)**: \n';
    doc += '- 🚧 Status: Geplant\n';
    doc += '- Zweck: Eigentümer mit read-only Zugriff auf ihre eigenen Objekte\n';
    doc += '- Darf: Abrechnungen einsehen, Dokumente downloaden\n';
    doc += '- Darf nicht: Daten ändern, Kosten einsehen, Steuerdaten sehen\n\n';
    doc += '**Mieter (Tenant)**: \n';
    doc += '- 🚧 Status: Geplant\n';
    doc += '- Zweck: Mieter-Portal (eigene Verträge, Abrechnungen, Dokumente)\n';
    doc += '- Darf: Eigene Dokumente einsehen, Rechnungen bezahlen\n';
    doc += '- Darf nicht: Andere Mieter sehen, Objekt-Daten einsehen\n\n';
    doc += '**Buchhalter (Accountant)**: \n';
    doc += '- 🚧 Status: Geplant\n';
    doc += '- Zweck: Nur Finanzen, keine Mieterverwaltung\n';
    doc += '- Darf: Rechnungen, Buchungen, Banking, Steuer-Export\n';
    doc += '- Darf nicht: Mietverträge ändern, Dokumente versenden\n\n';
    
    doc += '---\n\n';
    
    doc += '## 2. MODUL-BERECHTIGUNGEN MATRIX\n\n';
    
    doc += '### 2.1 Legende\n\n';
    doc += '- **-** = Kein Zugriff\n';
    doc += '- **R** = Read (Lesen)\n';
    doc += '- **C** = Create (Erstellen)\n';
    doc += '- **U** = Update (Bearbeiten)\n';
    doc += '- **D** = Delete (Löschen)\n';
    doc += '- **ALL** = Vollzugriff (R + C + U + D)\n';
    doc += '- **R\*** = Read mit Einschränkungen (z.B. nur eigene Daten)\n\n';
    
    doc += '### 2.2 Matrix (Excel-kompatibel)\n\n';
    doc += '| Modul / Seite | Admin | User | Eigentümer* | Mieter* |\n';
    doc += '|---------------|-------|------|-------------|--------|\n';
    doc += '| **Objektverwaltung** |||||\n';
    doc += '| Objekte (Buildings) | ALL | ALL | R\* | - |\n';
    doc += '| Wohneinheiten (Units) | ALL | ALL | R\* | R\* |\n';
    doc += '| Zähler (Meters) | ALL | ALL | R\* | R\* |\n';
    doc += '| Kaufverträge (PurchaseContract) | ALL | ALL | R\* | - |\n';
    doc += '| **Mieterverwaltung** |||||\n';
    doc += '| Mieter (Tenants) | ALL | ALL | R\* | R\* |\n';
    doc += '| Mietverträge (LeaseContracts) | ALL | ALL | R\* | R\* |\n';
    doc += '| Mietforderungen (Payments) | ALL | ALL | R\* | R\* |\n';
    doc += '| Mieterhöhungen (RentChanges) | ALL | ALL | R\* | R\* |\n';
    doc += '| **Finanzen** |||||\n';
    doc += '| Bankkonten (BankAccounts) | ALL | ALL | R\* | - |\n';
    doc += '| Transaktionen (BankTransactions) | ALL | ALL | R\* | - |\n';
    doc += '| Generierte Buchungen | ALL | ALL | R\* | - |\n';
    doc += '| Rechnungen (Invoices) | ALL | ALL | R\* | - |\n';
    doc += '| Finanzposten (FinancialItems) | ALL | ALL | R\* | - |\n';
    doc += '| **Dokumente** |||||\n';
    doc += '| Dokumente (Documents) | ALL | ALL | R\* | R\* |\n';
    doc += '| Templates | ALL | ALL | - | - |\n';
    doc += '| Textbausteine (TextBlocks) | ALL | ALL | - | - |\n';
    doc += '| Original-Dokumente | ALL | ALL | R\* | - |\n';
    doc += '| **Kommunikation** |||||\n';
    doc += '| E-Mails (Emails) | ALL | ALL | - | - |\n';
    doc += '| Postversand (LetterXpress) | ALL | ALL | - | - |\n';
    doc += '| Brief-Sendungen (LetterShipments) | ALL | R | - | - |\n';
    doc += '| IMAP-Konten | ALL | ALL | - | - |\n';
    doc += '| **Aufgaben** |||||\n';
    doc += '| Tasks | ALL | ALL | - | - |\n';
    doc += '| Workflows | ALL | ALL | - | - |\n';
    doc += '| Automatisierungen (Automations) | ALL | ALL | - | - |\n';
    doc += '| **Steuern** |||||\n';
    doc += '| Grundsteuer (PropertyTax) | ALL | ALL | R\* | - |\n';
    doc += '| Versicherungen (Insurance) | ALL | ALL | R\* | - |\n';
    doc += '| Finanzierungen (Financing) | ALL | ALL | R\* | - |\n';
    doc += '| Versorger (Suppliers) | ALL | ALL | R\* | - |\n';
    doc += '| Steuerformulare (TaxForms) | ALL | ALL | R\* | - |\n';
    doc += '| Anlage V (AnlageVSubmission) | ALL | ALL | R\* | - |\n';
    doc += '| Steuer-Bibliothek | ALL | ALL | R\* | - |\n';
    doc += '| Kostenkategorien | ALL | ALL | R\* | - |\n';
    doc += '| **Eigentümer** |||||\n';
    doc += '| Eigentümer (Owners) | ALL | ALL | R\* | - |\n';
    doc += '| Gesellschafter (Shareholders) | ALL | ALL | R\* | - |\n';
    doc += '| Eigentümer-Beziehungen | ALL | ALL | R\* | - |\n';
    doc += '| **Betriebskosten** |||||\n';
    doc += '| NK-Abrechnungen (OperatingCostStatements) | ALL | ALL | R\* | R\* |\n';
    doc += '| Abrechnungspositionen | ALL | ALL | R\* | R\* |\n';
    doc += '| **System** |||||\n';
    doc += '| User-Verwaltung | ALL | - | - | - |\n';
    doc += '| Benachrichtigungen (Notifications) | ALL | R,U | R\* | R\* |\n';
    doc += '| Activity-Log | ALL | R | - | - |\n';
    doc += '| Entwickler-Dokumentation | ALL | R | - | - |\n';
    doc += '| Empfänger (Recipients) | ALL | ALL | - | - |\n\n';
    
    doc += '**Legende Einschränkungen**:\n';
    doc += '- **R\\***: Nur eigene Daten (z.B. Eigentümer sieht nur seine Objekte)\n';
    doc += '- *Spalten "Eigentümer" und "Mieter" sind geplante Features (noch nicht implementiert)*\n\n';
    
    doc += '---\n\n';
    
    doc += '## 3. DATEN-ZUGRIFFSKONTROLLE (Row-Level Security)\n\n';
    
    doc += '### 3.1 Admin\n\n';
    doc += '**Vollzugriff auf alle Daten**:\n';
    doc += '- Kann ALLE Buildings sehen\n';
    doc += '- Kann ALLE Tenants sehen\n';
    doc += '- Kann ALLE LeaseContracts sehen\n';
    doc += '- Kann ALLE Invoices sehen\n';
    doc += '- Kann ALLE BankTransactions sehen\n';
    doc += '- **Keine Einschränkungen**\n\n';
    doc += '**Implementierung**:\n';
    doc += '```javascript\n';
    doc += '// Admin sieht alles\n';
    doc += 'const buildings = await base44.entities.Building.list();\n';
    doc += '// Ergebnis: ALLE Buildings in DB\n';
    doc += '```\n\n';
    
    doc += '### 3.2 User (Standard)\n\n';
    doc += '**Aktuell: Vollzugriff wie Admin** (vereinfachtes System)\n\n';
    doc += '```javascript\n';
    doc += '// User sieht ebenfalls alles\n';
    doc += 'const buildings = await base44.entities.Building.list();\n';
    doc += '// Ergebnis: ALLE Buildings\n';
    doc += '```\n\n';
    doc += '**Begründung**: \n';
    doc += '- Immobilienverwaltung ist typischerweise ein Team-Tool\n';
    doc += '- Alle Verwalter brauchen Zugriff auf alle Objekte\n';
    doc += '- Vereinfachtes Berechtigungsmodell für bessere Usability\n';
    doc += '- Falls granulare Rechte benötigt werden → geplante Erweiterung (siehe unten)\n\n';
    
    doc += '### 3.3 Eigentümer (geplante Rolle)\n\n';
    doc += '**Zugriff EINGESCHRÄNKT auf eigene Objekte**:\n\n';
    doc += '**Sichtbare Buildings**:\n';
    doc += '```javascript\n';
    doc += '// Nur Buildings wo OwnerRelationship.owner_id = current_owner.id\n';
    doc += 'const myBuildings = await base44.entities.Building.filter({\n';
    doc += '  id: { $in: await getOwnedBuildingIds(currentUser.owner_id) }\n';
    doc += '});\n';
    doc += '\n';
    doc += 'async function getOwnedBuildingIds(ownerId) {\n';
    doc += '  const relationships = await OwnerRelationship.filter({\n';
    doc += '    owner_id: ownerId,\n';
    doc += '    $or: [\n';
    doc += '      { valid_until: null },\n';
    doc += '      { valid_until: { $gte: new Date() } }\n';
    doc += '    ]\n';
    doc += '  });\n';
    doc += '  return relationships.map(r => r.building_id);\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Sichtbare Units**:\n';
    doc += '```javascript\n';
    doc += '// Nur Units in eigenen Buildings\n';
    doc += 'const units = await base44.entities.Unit.filter({\n';
    doc += '  building_id: { $in: myBuildingIds }\n';
    doc += '});\n';
    doc += '```\n\n';
    doc += '**Versteckte Daten**:\n';
    doc += '- ❌ NICHT sichtbar: Andere Eigentümer-Objekte\n';
    doc += '- ❌ NICHT sichtbar: System-Einstellungen (API-Keys, etc.)\n';
    doc += '- ❌ NICHT sichtbar: Activity-Logs anderer User\n';
    doc += '- ❌ NICHT sichtbar: Entwickler-Dokumentation\n\n';
    
    doc += '### 3.4 Mieter (geplante Rolle)\n\n';
    doc += '**Zugriff EXTREM EINGESCHRÄNKT (nur eigene Daten)**:\n\n';
    doc += '**Sichtbare Verträge**:\n';
    doc += '```javascript\n';
    doc += '// Nur eigene Verträge\n';
    doc += 'const contracts = await base44.entities.LeaseContract.filter({\n';
    doc += '  $or: [\n';
    doc += '    { tenant_id: currentUser.tenant_id },\n';
    doc += '    { second_tenant_id: currentUser.tenant_id }\n';
    doc += '  ]\n';
    doc += '});\n';
    doc += '```\n\n';
    doc += '**Sichtbare Dokumente**:\n';
    doc += '```javascript\n';
    doc += '// Nur Dokumente die an den Mieter gerichtet sind\n';
    doc += 'const documents = await base44.entities.Document.filter({\n';
    doc += '  tenant_id: currentUser.tenant_id,\n';
    doc += '  status: { $in: ["versendet", "unterschrieben"] } // keine Entwürfe\n';
    doc += '});\n';
    doc += '```\n\n';
    doc += '**Versteckte Daten**:\n';
    doc += '- ❌ Keine anderen Mieter sehen\n';
    doc += '- ❌ Keine Kosten/Finanzen sehen (außer eigene Abrechnungen)\n';
    doc += '- ❌ Keine Eigentümer-Daten\n';
    doc += '- ❌ Keine System-Bereiche\n\n';
    
    doc += '---\n\n';
    
    doc += '## 4. FUNKTIONS-BERECHTIGUNGEN (Detailliert)\n\n';
    
    doc += '### 4.1 Objektverwaltung\n\n';
    doc += '| Funktion | Admin | User | Eigentümer | Mieter |\n';
    doc += '|----------|-------|------|------------|--------|\n';
    doc += '| Gebäude erstellen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Gebäude bearbeiten | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Gebäude löschen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Gebäude ansehen | ✅ | ✅ | ✅ (nur eigene) | ❌ |\n';
    doc += '| Wohneinheit erstellen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Wohneinheit bearbeiten | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Wohneinheit löschen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Zähler erfassen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Zählerstände eingeben | ✅ | ✅ | ❌ | ✅ (nur eigene Wohnung) |\n\n';
    
    doc += '### 4.2 Mieterverwaltung\n\n';
    doc += '| Funktion | Admin | User | Eigentümer | Mieter |\n';
    doc += '|----------|-------|------|------------|--------|\n';
    doc += '| Mieter erstellen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Mieter bearbeiten | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Mieter löschen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Mieter ansehen | ✅ | ✅ | ✅ (nur eigene Objekte) | ✅ (nur eigenes Profil) |\n';
    doc += '| Mietvertrag erstellen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Mietvertrag bearbeiten | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Mietvertrag kündigen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Mietvertrag ansehen | ✅ | ✅ | ✅ (nur eigene Objekte) | ✅ (nur eigener Vertrag) |\n';
    doc += '| Mieterhöhung durchführen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Mieterhöhung einsehen | ✅ | ✅ | ✅ | ✅ (Benachrichtigung) |\n\n';
    
    doc += '### 4.3 Finanzmanagement\n\n';
    doc += '| Funktion | Admin | User | Eigentümer | Mieter |\n';
    doc += '|----------|-------|------|------------|--------|\n';
    doc += '| Bankkonto verbinden (finAPI) | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Transaktionen importieren | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Transaktionen kategorisieren | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Transaktionen ansehen | ✅ | ✅ | ✅ (nur eigene Objekte) | ❌ |\n';
    doc += '| Rechnung erfassen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Rechnung bearbeiten | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Rechnung löschen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Rechnung ansehen | ✅ | ✅ | ✅ (nur eigene Objekte) | ❌ |\n';
    doc += '| Buchungen generieren | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Buchungen bearbeiten | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Buchungen löschen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Zahlungen zuordnen | ✅ | ✅ | ❌ | ❌ |\n\n';
    
    doc += '### 4.4 Dokumentenverwaltung\n\n';
    doc += '| Funktion | Admin | User | Eigentümer | Mieter |\n';
    doc += '|----------|-------|------|------------|--------|\n';
    doc += '| Dokument erstellen (Wizard) | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| PDF generieren | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Dokument bearbeiten | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Dokument löschen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Dokument ansehen | ✅ | ✅ | ✅ (nur eigene Objekte) | ✅ (nur für sich bestimmte) |\n';
    doc += '| Dokument downloaden | ✅ | ✅ | ✅ | ✅ |\n';
    doc += '| Template erstellen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Template bearbeiten | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Template löschen | ✅ | ✅ (nur nicht-System) | ❌ | ❌ |\n';
    doc += '| System-Template löschen | ✅ | ❌ | ❌ | ❌ |\n';
    doc += '| Textbausteine verwalten | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Original-Dokument hochladen | ✅ | ✅ | ❌ | ❌ |\n\n';
    
    doc += '### 4.5 Kommunikation\n\n';
    doc += '| Funktion | Admin | User | Eigentümer | Mieter |\n';
    doc += '|----------|-------|------|------------|--------|\n';
    doc += '| Brief versenden (LetterXpress) | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Brief-Status ansehen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Tracking-Codes einsehen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| LetterXpress-Einstellungen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Guthaben aufladen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Postausgangsbuch ansehen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| E-Mail-Konten verbinden | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| E-Mails synchronisieren | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| E-Mails ansehen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| E-Mails löschen | ✅ | ✅ | ❌ | ❌ |\n\n';
    
    doc += '### 4.6 Aufgaben & Workflows\n\n';
    doc += '| Funktion | Admin | User | Eigentümer | Mieter |\n';
    doc += '|----------|-------|------|------------|--------|\n';
    doc += '| Task erstellen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Task bearbeiten | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Task löschen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Task als erledigt markieren | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Workflow erstellen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Workflow bearbeiten | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Automatisierung erstellen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Task-Vorschläge von KI | ✅ | ✅ | ❌ | ❌ |\n\n';
    
    doc += '### 4.7 Steuern & Abrechnungen\n\n';
    doc += '| Funktion | Admin | User | Eigentümer | Mieter |\n';
    doc += '|----------|-------|------|------------|--------|\n';
    doc += '| Grundsteuerbescheid erfassen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Grundsteuer ansehen | ✅ | ✅ | ✅ | ❌ |\n';
    doc += '| Versicherung erfassen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Kredit erfassen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Versorger erfassen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Steuer-Bibliothek initialisieren | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Anlage V generieren | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Anlage V exportieren (PDF) | ✅ | ✅ | ✅ (nur eigene Objekte) | ❌ |\n';
    doc += '| Anlage V prüfen (Validierung) | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| AfA-Plan generieren | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Kostenkategorien verwalten | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Betriebskosten-Abrechnung erstellen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Betriebskosten ansehen | ✅ | ✅ | ✅ (Übersicht) | ✅ (nur eigene) |\n\n';
    
    doc += '### 4.8 Eigentümerverwaltung\n\n';
    doc += '| Funktion | Admin | User | Eigentümer | Mieter |\n';
    doc += '|----------|-------|------|------------|--------|\n';
    doc += '| Eigentümer erstellen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Eigentümer bearbeiten | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Eigentümer löschen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Eigentümer ansehen | ✅ | ✅ | ✅ (nur eigene Daten) | ❌ |\n';
    doc += '| Gesellschafter hinzufügen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Eigentümer-Anteile ändern | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Eigentümerwechsel durchführen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Eigentümerabrechnung erstellen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Eigentümerabrechnung ansehen | ✅ | ✅ | ✅ (nur eigene) | ❌ |\n\n';
    
    doc += '### 4.9 System & Administration\n\n';
    doc += '| Funktion | Admin | User | Eigentümer | Mieter |\n';
    doc += '|----------|-------|------|------------|--------|\n';
    doc += '| **User-Verwaltung** |||||\n';
    doc += '| User einladen | ✅ | ✅ (nur role="user") | ❌ | ❌ |\n';
    doc += '| Admin einladen | ✅ | ❌ | ❌ | ❌ |\n';
    doc += '| User-Liste ansehen | ✅ | ❌ | ❌ | ❌ |\n';
    doc += '| User bearbeiten | ✅ | ❌ | ❌ | ❌ |\n';
    doc += '| User löschen | ✅ | ❌ | ❌ | ❌ |\n';
    doc += '| Eigenes Profil bearbeiten | ✅ | ✅ | ✅ | ✅ |\n';
    doc += '| **Systemeinstellungen** |||||\n';
    doc += '| API-Keys verwalten (LetterXpress) | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| finAPI-Verbindung verwalten | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| E-Mail-Konten verwalten | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| **Entwickler-Tools** |||||\n';
    doc += '| Entwickler-Dokumentation generieren | ✅ | ❌ | ❌ | ❌ |\n';
    doc += '| Entwickler-Dokumentation ansehen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Scheduled Tasks verwalten | ✅ | ❌ | ❌ | ❌ |\n';
    doc += '| Migration-Funktionen ausführen | ✅ | ❌ | ❌ | ❌ |\n';
    doc += '| Activity-Log ansehen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| System-Status ansehen | ✅ | ✅ | ❌ | ❌ |\n\n';
    
    doc += '### 4.10 Daten-Export\n\n';
    doc += '| Funktion | Admin | User | Eigentümer | Mieter |\n';
    doc += '|----------|-------|------|------------|--------|\n';
    doc += '| Anlage V exportieren | ✅ | ✅ | ✅ (nur eigene Objekte) | ❌ |\n';
    doc += '| Betriebskosten exportieren | ✅ | ✅ | ✅ (nur eigene) | ✅ (nur eigene) |\n';
    doc += '| Alle Daten exportieren (CSV) | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Finanzbericht exportieren | ✅ | ✅ | ✅ (nur eigene Objekte) | ❌ |\n';
    doc += '| Mieter-Liste exportieren | ✅ | ✅ | ✅ (nur eigene Objekte) | ❌ |\n\n';
    
    doc += '---\n\n';
    
    doc += '## 5. FELD-LEVEL-BERECHTIGUNGEN\n\n';
    
    doc += '### 5.1 Versteckte Felder nach Rolle\n\n';
    doc += '**Building Entity - für Eigentümer versteckt**:\n';
    doc += '- ❌ `purchase_price` (Kaufpreis)\n';
    doc += '- ❌ `land_value` (Grundstückswert)\n';
    doc += '- ❌ `notary_fees` (Notarkosten)\n';
    doc += '- ❌ `broker_fees` (Maklerkosten)\n';
    doc += '- ✅ `name`, `address`, `zip_code`, `city` (sichtbar)\n';
    doc += '- ✅ `construction_year`, `total_area` (sichtbar)\n\n';
    doc += '**Begründung**: Eigentümer kennen ihre eigenen Kaufpreise bereits, aber andere Eigentümer sollen diese nicht sehen\n\n';
    doc += '**LeaseContract - für Mieter eingeschränkt**:\n';
    doc += '- ✅ `base_rent`, `utilities`, `heating`, `total_rent` (sichtbar)\n';
    doc += '- ✅ `start_date`, `end_date`, `deposit` (sichtbar)\n';
    doc += '- ❌ `version_number`, `predecessor_id` (versteckt - technische Felder)\n';
    doc += '- ❌ `bookings_created`, `number_of_generated_bookings` (versteckt)\n\n';
    doc += '**BankTransaction - für Eigentümer versteckt**:\n';
    doc += '- ❌ Komplette Entity nicht sichtbar\n';
    doc += '- Begründung: Sensible Finanzdaten (IBANs, Kontostände)\n\n';
    
    doc += '### 5.2 Editierbare vs. Read-Only Felder\n\n';
    doc += '**Für alle User (auch Admin) READ-ONLY**:\n';
    doc += '- `id`, `created_date`, `updated_date`, `created_by` (Built-in Felder)\n';
    doc += '- `version_number` (wird automatisch hochgezählt)\n';
    doc += '- `is_current_valid` (wird automatisch gesetzt bei Versionierung)\n';
    doc += '- `bookings_created`, `bookings_created_at` (wird automatisch gesetzt)\n';
    doc += '- `balance` in BankAccount (wird von finAPI-Sync aktualisiert)\n\n';
    doc += '**Automatisch berechnet (nicht editierbar)**:\n';
    doc += '- `total_rent` in LeaseContract = `base_rent` + `utilities` + `heating`\n';
    doc += '- `outstanding_amount` in GeneratedFinancialBooking = `amount` - `paid_amount`\n';
    doc += '- `net_amount`, `tax_amount` in Invoice (aus `total_amount` und `tax_rate`)\n\n';
    
    doc += '---\n\n';
    
    doc += '## 6. BACKEND-FUNKTIONEN (Admin-Only vs. User-Accessible)\n\n';
    
    doc += '### 6.1 Admin-Only Backend Functions\n\n';
    doc += '**Liste aller Admin-only Functions**:\n\n';
    doc += '| Funktionsname | Zweck | Aufrufer | Scheduled? |\n';
    doc += '|---------------|-------|----------|------------|\n';
    doc += '| `updateLetterTrackingCodes` | LetterXpress Tracking-Updates holen | Scheduled Task | ✅ Täglich 12:00 |\n';
    doc += '| `updateDocumentation` | Entwickler-Doku aktualisieren | Scheduled Task | ✅ Wöchentlich |\n';
    doc += '| `cleanupOldEmails` | Alte E-Mails löschen (DSGVO) | Scheduled Task | ✅ Wöchentlich |\n';
    doc += '| `migrateInvoicesToFinancialModel` | Datenmigration durchführen | Manuell | ❌ |\n';
    doc += '| `migratePaymentsToFinancialItems` | Datenmigration durchführen | Manuell | ❌ |\n';
    doc += '| `seedInitialData` | Test-Daten generieren | Manuell (Dev) | ❌ |\n';
    doc += '| `generateTestData` | Test-Daten erstellen | Manuell (Dev) | ❌ |\n\n';
    
    doc += '**Admin-Check Implementierung**:\n';
    doc += '```javascript\n';
    doc += '// Jede Admin-only Funktion startet mit:\n';
    doc += 'const base44 = createClientFromRequest(req);\n';
    doc += 'const user = await base44.auth.me();\n';
    doc += '\n';
    doc += 'if (user?.role !== "admin") {\n';
    doc += '  return Response.json(\n';
    doc += '    { error: "Forbidden: Admin access required" },\n';
    doc += '    { status: 403 }\n';
    doc += '  );\n';
    doc += '}\n';
    doc += '\n';
    doc += '// ... rest of function\n';
    doc += '```\n\n';
    
    doc += '### 6.2 User-Accessible Backend Functions\n\n';
    doc += '**Liste aller Functions die User aufrufen darf**:\n\n';
    doc += '| Funktionsname | Zweck | Trigger | Auth-Check |\n';
    doc += '|---------------|-------|---------|------------|\n';
    doc += '| `generatePDF` | PDF aus HTML generieren | Dokument erstellen | ✅ user.email |\n';
    doc += '| `letterxpress` | Brief versenden | Post-Versand | ✅ user.email |\n';
    doc += '| `finapiConnect` | Banking verbinden | Konto verbinden | ✅ user.email |\n';
    doc += '| `finapiImportAccounts` | Konten importieren | Nach finAPI-Auth | ✅ user.email |\n';
    doc += '| `finapiSync` | Transaktionen synchronisieren | Manuell/Auto-Sync | ✅ user.email |\n';
    doc += '| `generateBookingsFromSource` | Buchungen generieren | Nach Vertragserstellung | ✅ user.email |\n';
    doc += '| `generateAfASchedule` | AfA-Plan erstellen | Nach Kaufvertrag | ✅ user.email |\n';
    doc += '| `exportAnlageVPDF` | Anlage V als PDF | Steuer-Export | ✅ user.email |\n';
    doc += '| `validateAnlageV` | Anlage V prüfen | Vor Export | ✅ user.email |\n';
    doc += '| `calculateAnlageVEinnahmen` | Einnahmen berechnen | Anlage V Wizard | ✅ user.email |\n';
    doc += '| `calculateAnlageVWerbungskosten` | Werbungskosten berechnen | Anlage V Wizard | ✅ user.email |\n';
    doc += '| `linkBookingToTransaction` | Buchung mit Transaktion verknüpfen | Matching | ✅ user.email |\n';
    doc += '| `aiMatchAnalysis` | KI-Matching vorschlagen | Auto-Matching | ✅ user.email |\n';
    doc += '| `analyzeEmailForTask` | E-Mail analysieren | E-Mail-Sync | ✅ user.email |\n';
    doc += '| `syncEmails` | E-Mails synchronisieren | Manuell/Auto | ✅ user.email |\n';
    doc += '| `suggestTaskDetails` | Task-Details vorschlagen (KI) | Task-Erstellung | ✅ user.email |\n';
    doc += '| `createNotification` | Benachrichtigung erstellen | Diverse Triggers | ✅ user.email |\n';
    doc += '| `logActivity` | Activity-Log Eintrag | Diverse Triggers | ✅ user.email |\n\n';
    
    doc += '**Standard Auth-Pattern**:\n';
    doc += '```javascript\n';
    doc += 'const base44 = createClientFromRequest(req);\n';
    doc += 'const user = await base44.auth.me();\n';
    doc += '\n';
    doc += 'if (!user) {\n';
    doc += '  return Response.json({ error: "Unauthorized" }, { status: 401 });\n';
    doc += '}\n';
    doc += '\n';
    doc += '// User authentifiziert → Funktion ausführen\n';
    doc += '// KEINE weitere Rollen-Prüfung (User + Admin haben beide Zugriff)\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
    doc += '## 7. FREIGABE-WORKFLOWS (Approval Processes)\n\n';
    
    doc += '### 7.1 Aktueller Stand\n\n';
    doc += '**Keine Freigabe-Workflows implementiert**\n\n';
    doc += '- Alle Aktionen werden sofort ausgeführt (kein Approval erforderlich)\n';
    doc += '- Begründung: Immobilienverwaltung ist typischerweise kein Approval-lastiger Prozess\n';
    doc += '- Vertrauen in Verwalter-Kompetenzen\n\n';
    
    doc += '### 7.2 Geplante Freigabe-Workflows (Feature Request)\n\n';
    doc += '**Workflow 1: Kostenschwellwert-Freigabe**\n';
    doc += '- **Trigger**: Invoice.total_amount > €5.000\n';
    doc += '- **Prozess**:\n';
    doc += '  1. User erfasst Rechnung > €5.000\n';
    doc += '  2. System erstellt Invoice mit `status="pending_approval"`\n';
    doc += '  3. Admin erhält Notification "Freigabe erforderlich"\n';
    doc += '  4. Admin prüft Rechnung\n';
    doc += '  5. Admin klickt "Freigeben" oder "Ablehnen"\n';
    doc += '  6. Bei Freigabe: `status="approved"` → Buchung wird erstellt\n';
    doc += '  7. Bei Ablehnung: `status="rejected"` → User erhält Notification\n';
    doc += '- **Implementierung**: Noch nicht vorhanden (nur Konzept)\n\n';
    doc += '**Workflow 2: Mieterhöhung-Freigabe**\n';
    doc += '- **Trigger**: RentChange wird erstellt\n';
    doc += '- **Prozess**:\n';
    doc += '  1. User erstellt Mieterhöhung\n';
    doc += '  2. System erstellt RentChange mit `status="pending"`\n';
    doc += '  3. Admin prüft rechtliche Zulässigkeit (Mietpreisbremse, Begründung)\n';
    doc += '  4. Admin gibt frei oder lehnt ab\n';
    doc += '- **Implementierung**: Noch nicht vorhanden\n\n';
    doc += '**Workflow 3: Dokument-Versand-Freigabe**\n';
    doc += '- **Trigger**: Dokument soll per Post versendet werden (Kosten > €50)\n';
    doc += '- **Prozess**:\n';
    doc += '  1. User klickt "Versenden"\n';
    doc += '  2. Bei Massenversand (> 10 Dokumente) → Admin-Freigabe erforderlich\n';
    doc += '  3. Admin sieht Kosten-Übersicht\n';
    doc += '  4. Admin gibt frei\n';
    doc += '- **Implementierung**: Noch nicht vorhanden\n\n';
    
    doc += '### 7.3 Mehrstufige Freigaben (Zukunft)\n\n';
    doc += '**Beispiel: Eigentümerwechsel**\n\n';
    doc += '```\n';
    doc += 'STUFE 1: Verwalter erfasst Eigentümerwechsel\n';
    doc += '    ↓\n';
    doc += 'STUFE 2: Steuerberater prüft steuerliche Implikationen\n';
    doc += '    ↓\n';
    doc += 'STUFE 3: Admin gibt final frei\n';
    doc += '    ↓\n';
    doc += 'Eigentümerwechsel wird durchgeführt (Versionierung)\n';
    doc += '```\n\n';
    doc += '**Status**: 🚧 Geplant, nicht implementiert\n\n';
    
    doc += '---\n\n';
    
    doc += '## 8. AUDIT-TRAIL & LOGGING\n\n';
    
    doc += '### 8.1 Activity-Log (Audit Trail)\n\n';
    doc += '**Entity**: `ActivityLog`\n\n';
    doc += '**Zweck**: Vollständige Nachverfolgung aller wichtigen Aktionen\n\n';
    doc += '**Geloggte Aktionen**:\n';
    doc += '| Aktion | Trigger | Daten gespeichert | Aufbewahrung |\n';
    doc += '|--------|---------|-------------------|-------------|\n';
    doc += '| `building_created` | Neues Gebäude | building_id, name, created_by | ∞ (permanent) |\n';
    doc += '| `building_updated` | Gebäude bearbeitet | building_id, changed_fields, old_values | ∞ |\n';
    doc += '| `building_deleted` | Gebäude gelöscht | building_id, name, deleted_by | ∞ |\n';
    doc += '| `contract_created` | Neuer Mietvertrag | contract_id, tenant_id, unit_id | ∞ |\n';
    doc += '| `contract_terminated` | Vertrag gekündigt | contract_id, termination_date | ∞ |\n';
    doc += '| `invoice_created` | Rechnung erfasst | invoice_id, total_amount, supplier | ∞ |\n';
    doc += '| `invoice_paid` | Rechnung bezahlt | invoice_id, paid_amount, payment_date | ∞ |\n';
    doc += '| `document_created` | Dokument erstellt | document_id, template_id, category | ∞ |\n';
    doc += '| `document_sent` | Dokument versendet | document_id, recipient, method (post/email) | ∞ |\n';
    doc += '| `owner_created` | Eigentümer erstellt | owner_id, type (person/gbr/gmbh) | ∞ |\n';
    doc += '| `owner_relationship_changed` | Eigentümerwechsel | building_id, old_owner, new_owner | ∞ |\n';
    doc += '| `bank_connected` | finAPI-Verbindung | bank_account_id, bank_name | ∞ |\n';
    doc += '| `transactions_synced` | Transaktionen importiert | count, bank_account_id | ∞ |\n';
    doc += '| `operating_cost_statement_created` | NK-Abrechnung erstellt | statement_id, year, building_id | ∞ |\n';
    doc += '| `anlage_v_generated` | Anlage V generiert | submission_id, year, building_id | ∞ |\n';
    doc += '| `user_invited` | User eingeladen | invited_email, invited_role, invited_by | ∞ |\n';
    doc += '| `user_login` | User-Login | user_email, timestamp, ip_address | 90 Tage |\n';
    doc += '| `user_logout` | User-Logout | user_email, timestamp | 90 Tage |\n';
    doc += '| `migration_executed` | Datenmigration | migration_name, affected_records | ∞ |\n\n';
    
    doc += '**ActivityLog Schema**:\n';
    doc += '```javascript\n';
    doc += '{\n';
    doc += '  action: "contract_created",          // Aktionstyp\n';
    doc += '  entity_type: "LeaseContract",        // Betroffene Entity\n';
    doc += '  entity_id: "uuid-123-456",           // Entity-ID\n';
    doc += '  user_email: "verwalter@example.com", // Wer hat es getan (auto aus created_by)\n';
    doc += '  details: {                           // Zusätzliche Daten (JSON)\n';
    doc += '    tenant_name: "Max Mustermann",\n';
    doc += '    unit_name: "Whg. 1.OG links",\n';
    doc += '    total_rent: 1030\n';
    doc += '  },\n';
    doc += '  created_date: "2024-01-07T15:30:00Z"  // Automatisch\n';
    doc += '}\n';
    doc += '```\n\n';
    
    doc += '### 8.2 Wer kann Activity-Logs einsehen?\n\n';
    doc += '| Rolle | Zugriff | Einschränkung |\n';
    doc += '|-------|---------|---------------|\n';
    doc += '| Admin | ✅ Ja | ALLE Logs (ungefiltert) |\n';
    doc += '| User | ✅ Ja | ALLE Logs (ungefiltert) |\n';
    doc += '| Eigentümer | ❌ Nein (geplant: nur eigene Objekte) | Nur Logs zu eigenen Buildings |\n';
    doc += '| Mieter | ❌ Nein | Keine Logs sichtbar |\n\n';
    
    doc += '**UI**: Derzeit KEINE dedizierte Activity-Log-Ansicht implementiert\n';
    doc += '- 🚧 Geplant: `/ActivityLog` Seite mit Filter und Suche\n';
    doc += '- Aktuell: Logs werden geschrieben, aber nicht im UI angezeigt\n';
    doc += '- Zugriff nur via Datenbank-Query (für Admins/Entwickler)\n\n';
    
    doc += '### 8.3 Change History (bei Dokumenten)\n\n';
    doc += '**Entity**: `Document.change_history` (Array)\n\n';
    doc += '**Geloggt bei Document-Änderungen**:\n';
    doc += '```javascript\n';
    doc += '{\n';
    doc += '  timestamp: "2024-01-07T16:45:00Z",\n';
    doc += '  user: "verwalter@example.com",\n';
    doc += '  change_type: "content_updated",\n';
    doc += '  old_value: "Sehr geehrter Herr Mustermann,",\n';
    doc += '  new_value: "Sehr geehrter Herr Dr. Mustermann,"\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Sichtbar**: Für Admin und User (in Dokument-Details)\n\n';
    
    doc += '### 8.4 Aufbewahrungsfristen\n\n';
    doc += '| Log-Typ | Aufbewahrung | DSGVO-Grund | Löschung |\n';
    doc += '|---------|--------------|-------------|----------|\n';
    doc += '| ActivityLog (geschäftlich) | ∞ Permanent | Berechtigtes Interesse (§6 Abs. 1f) | Manuell |\n';
    doc += '| ActivityLog (user_login/logout) | 90 Tage | Sicherheit (§6 Abs. 1f) | Automatisch |\n';
    doc += '| Document.change_history | ∞ Permanent | Vertragserfüllung (§6 Abs. 1b) | Mit Dokument |\n';
    doc += '| Email (IMAP) | 30-90 Tage | Einwilligung (§6 Abs. 1a) | Automatisch (cleanupOldEmails) |\n';
    doc += '| Notification | 90 Tage | Berechtigtes Interesse | Automatisch |\n';
    doc += '| BankTransaction | ∞ Permanent | Steuerrecht (10 Jahre) | Nach 10 Jahren |\n\n';
    
    doc += '**Automatische Löschung** (Scheduled Task):\n';
    doc += '```javascript\n';
    doc += '// cleanupOldEmails - läuft wöchentlich\n';
    doc += 'const cutoff = new Date();\n';
    doc += 'cutoff.setDate(cutoff.getDate() - 30); // 30 Tage zurück\n';
    doc += '\n';
    doc += '// E-Mails älter als 30 Tage löschen (sofern delete_after_days gesetzt)\n';
    doc += 'const oldEmails = await Email.filter({\n';
    doc += '  received_date: { $lte: cutoff },\n';
    doc += '  is_processed: true // nur verarbeitete E-Mails\n';
    doc += '});\n';
    doc += '\n';
    doc += 'for (const email of oldEmails) {\n';
    doc += '  await Email.delete(email.id);\n';
    doc += '}\n';
    doc += '```\n\n';
    
    doc += '### 8.5 Wer kann Logs löschen?\n\n';
    doc += '| Log-Typ | Admin | User | Automatisch |\n';
    doc += '|---------|-------|------|-------------|\n';
    doc += '| ActivityLog | ❌ Nein (permanent) | ❌ Nein | ❌ Nein |\n';
    doc += '| Email | ✅ Ja | ✅ Ja | ✅ Ja (nach X Tagen) |\n';
    doc += '| Notification | ✅ Ja | ✅ Ja (nur eigene) | ✅ Ja (nach 90 Tagen) |\n';
    doc += '| Document.change_history | ❌ Nein | ❌ Nein | ❌ Nein |\n\n';
    
    doc += '---\n\n';
    
    doc += '## 9. AUTHENTICATION & AUTHORIZATION\n\n';
    
    doc += '### 9.1 Built-in User Entity\n\n';
    doc += '**Standard-Felder** (automatisch vorhanden):\n';
    doc += '```javascript\n';
    doc += '{\n';
    doc += '  id: "uuid-123-456",           // Eindeutige ID\n';
    doc += '  email: "user@example.com",    // Login-E-Mail\n';
    doc += '  full_name: "Max Mustermann",  // Anzeigename\n';
    doc += '  role: "admin" | "user",       // Rolle\n';
    doc += '  created_date: "2024-01-01",   // Registrierungsdatum\n';
    doc += '  updated_date: "2024-01-07"    // Letztes Update\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**WICHTIG**: Diese Felder KÖNNEN NICHT überschrieben werden!\n';
    doc += '- Änderung nur via Base44-Admin-Panel oder SDK\n';
    doc += '- Keine direkten Entity-Updates erlaubt\n\n';
    
    doc += '### 9.2 Login-Flow (Detailliert)\n\n';
    doc += '**SCHRITT 1: User ruft App auf**\n';
    doc += '- URL: `https://app.base44.com/your-app`\n';
    doc += '- Base44-Platform prüft: Cookie `base44_session` vorhanden?\n\n';
    doc += '**SCHRITT 2: Nicht authentifiziert**\n';
    doc += '- Platform redirectet zu: `https://auth.base44.com/login?app_id={id}&next=/Dashboard`\n';
    doc += '- Parameter `next` speichert Ziel-URL für Redirect nach Login\n\n';
    doc += '**SCHRITT 3: Login-Formular**\n';
    doc += '```\n';
    doc += '┌─────────────────────────────────┐\n';
    doc += '│ Anmelden                        │\n';
    doc += '├─────────────────────────────────┤\n';
    doc += '│ E-Mail:                         │\n';
    doc += '│ [user@example.com         ]     │\n';
    doc += '│                                 │\n';
    doc += '│ Passwort:                       │\n';
    doc += '│ [••••••••••••             ]     │\n';
    doc += '│                                 │\n';
    doc += '│ ☐ Angemeldet bleiben            │\n';
    doc += '├─────────────────────────────────┤\n';
    doc += '│ [Passwort vergessen?]           │\n';
    doc += '│                                 │\n';
    doc += '│      [Anmelden]                 │\n';
    doc += '└─────────────────────────────────┘\n';
    doc += '```\n\n';
    doc += '**SCHRITT 4: Authentifizierung**\n';
    doc += '- Base44 prüft Credentials gegen User-Datenbank\n';
    doc += '- Bei Erfolg: JWT-Token generieren\n';
    doc += '- Token in Cookie `base44_session` speichern (HttpOnly, Secure)\n\n';
    doc += '**SCHRITT 5: Redirect zurück zur App**\n';
    doc += '- Redirect zu ursprünglicher URL: `/Dashboard` (aus `next`-Parameter)\n';
    doc += '- App lädt mit gültigem Token\n';
    doc += '- Frontend kann `base44.auth.me()` aufrufen → User-Objekt erhalten\n\n';
    
    doc += '### 9.3 Session-Handling\n\n';
    doc += '**Token-Struktur** (JWT):\n';
    doc += '```javascript\n';
    doc += '// Payload (decodiert)\n';
    doc += '{\n';
    doc += '  sub: "user@example.com",    // Subject (User-E-Mail)\n';
    doc += '  role: "admin",              // Rolle\n';
    doc += '  iat: 1704639600,            // Issued At (timestamp)\n';
    doc += '  exp: 1704726000,            // Expiration (timestamp + 24h)\n';
    doc += '  app_id: "your-app-id"       // App-ID\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Token-Gültigkeit**: 24 Stunden\n\n';
    doc += '**Automatische Token-Refresh**:\n';
    doc += '- Bei jeder Request wird Token-Ablauf geprüft\n';
    doc += '- < 1 Stunde verbleibend → automatischer Refresh\n';
    doc += '- Neuer Token wird in Cookie gespeichert\n';
    doc += '- User merkt nichts (transparent)\n\n';
    doc += '**Logout**:\n';
    doc += '```javascript\n';
    doc += '// Frontend\n';
    doc += 'import { base44 } from "@/api/base44Client";\n';
    doc += '\n';
    doc += 'await base44.auth.logout();\n';
    doc += '// → Cookie wird gelöscht\n';
    doc += '// → Redirect zu Login-Seite\n';
    doc += '```\n\n';
    
    doc += '### 9.4 Frontend Authorization\n\n';
    doc += '**Current User abrufen**:\n';
    doc += '```javascript\n';
    doc += 'import { base44 } from "@/api/base44Client";\n';
    doc += '\n';
    doc += 'const user = await base44.auth.me();\n';
    doc += '// user: { id, email, full_name, role }\n';
    doc += '\n';
    doc += '// Rolle prüfen\n';
    doc += 'if (user.role === "admin") {\n';
    doc += '  // Admin-Features anzeigen\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Conditional Rendering** (Beispiel):\n';
    doc += '```jsx\n';
    doc += 'function AdminOnlyButton() {\n';
    doc += '  const { data: user } = useQuery({\n';
    doc += '    queryKey: ["current-user"],\n';
    doc += '    queryFn: () => base44.auth.me()\n';
    doc += '  });\n';
    doc += '  \n';
    doc += '  if (user?.role !== "admin") return null;\n';
    doc += '  \n';
    doc += '  return <Button onClick={adminAction}>Admin-Funktion</Button>;\n';
    doc += '}\n';
    doc += '```\n\n';
    
    doc += '### 9.5 Backend Authorization\n\n';
    doc += '**Standard Auth-Check** (alle Funktionen):\n';
    doc += '```javascript\n';
    doc += 'Deno.serve(async (req) => {\n';
    doc += '  const base44 = createClientFromRequest(req);\n';
    doc += '  const user = await base44.auth.me();\n';
    doc += '  \n';
    doc += '  if (!user) {\n';
    doc += '    return Response.json(\n';
    doc += '      { error: "Unauthorized - bitte anmelden" },\n';
    doc += '      { status: 401 }\n';
    doc += '    );\n';
    doc += '  }\n';
    doc += '  \n';
    doc += '  // User ist authentifiziert → weiter\n';
    doc += '});\n';
    doc += '```\n\n';
    doc += '**Admin-Check** (nur Admin-Functions):\n';
    doc += '```javascript\n';
    doc += 'Deno.serve(async (req) => {\n';
    doc += '  const base44 = createClientFromRequest(req);\n';
    doc += '  const user = await base44.auth.me();\n';
    doc += '  \n';
    doc += '  // 1. Auth-Check\n';
    doc += '  if (!user) {\n';
    doc += '    return Response.json({ error: "Unauthorized" }, { status: 401 });\n';
    doc += '  }\n';
    doc += '  \n';
    doc += '  // 2. Admin-Check\n';
    doc += '  if (user.role !== "admin") {\n';
    doc += '    return Response.json(\n';
    doc += '      { error: "Forbidden: Admin access required" },\n';
    doc += '      { status: 403 }\n';
    doc += '    );\n';
    doc += '  }\n';
    doc += '  \n';
    doc += '  // Admin authentifiziert → Admin-Funktion ausführen\n';
    doc += '});\n';
    doc += '```\n\n';
    
    doc += '**Service-Role** (privilegierte Operationen):\n';
    doc += '```javascript\n';
    doc += '// Normale User-scoped Operation\n';
    doc += 'const buildings = await base44.entities.Building.list();\n';
    doc += '// → User sieht alle Buildings (aktuelles Berechtigungssystem)\n';
    doc += '\n';
    doc += '// Service-Role Operation (Admin-Privilegien, bypass User-Kontext)\n';
    doc += 'const allUsers = await base44.asServiceRole.entities.User.list();\n';
    doc += '// → Alle User (funktioniert nur in Backend-Funktionen!)\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
    doc += '## 10. USER-VERWALTUNG\n\n';
    
    doc += '### 10.1 User einladen\n\n';
    doc += '**Wer darf einladen?**\n';
    doc += '- ✅ Admin: Kann User UND Admins einladen\n';
    doc += '- ✅ User: Kann NUR User einladen (keine Admins)\n';
    doc += '- ❌ Eigentümer: Nicht implementiert\n';
    doc += '- ❌ Mieter: Nicht implementiert\n\n';
    doc += '**Implementierung**:\n';
    doc += '```javascript\n';
    doc += '// Frontend\n';
    doc += 'import { base44 } from "@/api/base44Client";\n';
    doc += '\n';
    doc += 'const currentUser = await base44.auth.me();\n';
    doc += '\n';
    doc += '// User kann nur "user"-Rolle einladen\n';
    doc += 'if (currentUser.role === "user") {\n';
    doc += '  await base44.users.inviteUser("new@example.com", "user");\n';
    doc += '  // ✅ Erlaubt\n';
    doc += '  \n';
    doc += '  await base44.users.inviteUser("admin@example.com", "admin");\n';
    doc += '  // ❌ Fehler: "Forbidden - nur Admins können Admins einladen"\n';
    doc += '}\n';
    doc += '\n';
    doc += '// Admin kann beide Rollen einladen\n';
    doc += 'if (currentUser.role === "admin") {\n';
    doc += '  await base44.users.inviteUser("new@example.com", "user");\n';
    doc += '  // ✅ Erlaubt\n';
    doc += '  \n';
    doc += '  await base44.users.inviteUser("admin2@example.com", "admin");\n';
    doc += '  // ✅ Erlaubt\n';
    doc += '}\n';
    doc += '```\n\n';
    
    doc += '**Einladungs-Prozess**:\n';
    doc += '1. User gibt E-Mail + Rolle ein (Formular)\n';
    doc += '2. System prüft: Darf current_user diese Rolle einladen?\n';
    doc += '3. System sendet Einladungs-E-Mail an neue E-Mail-Adresse\n';
    doc += '4. Empfänger klickt auf Link in E-Mail\n';
    doc += '5. Empfänger legt Passwort fest\n';
    doc += '6. User-Account wird aktiviert (User Entity erstellt)\n';
    doc += '7. ActivityLog: `user_invited` (wer hat wen eingeladen)\n\n';
    
    doc += '### 10.2 User-Liste ansehen\n\n';
    doc += '**Aktuelles Verhalten**:\n';
    doc += '- Admin: Kann `base44.asServiceRole.entities.User.list()` aufrufen → ALLE User\n';
    doc += '- User: Kann NICHT `User.list()` aufrufen → `403 Forbidden`\n';
    doc += '- User kann nur eigenes Profil via `base44.auth.me()` abrufen\n\n';
    doc += '**Base44 Built-in Security Rule**:\n';
    doc += '```\n';
    doc += 'User Entity hat spezielle Regel:\n';
    doc += '- Nur Admin kann andere User listen/bearbeiten/löschen\n';
    doc += '- Regular User kann nur sein eigenes User-Objekt lesen/bearbeiten\n';
    doc += '```\n\n';
    
    doc += '### 10.3 Eigenes Profil bearbeiten\n\n';
    doc += '**Alle Rollen dürfen**:\n';
    doc += '```javascript\n';
    doc += '// Eigene Daten aktualisieren\n';
    doc += 'await base44.auth.updateMe({\n';
    doc += '  full_name: "Neuer Name"\n';
    doc += '});\n';
    doc += '// ✅ Erlaubt für Admin, User, Eigentümer, Mieter\n';
    doc += '```\n\n';
    doc += '**NICHT änderbar** (auch nicht durch Admin):\n';
    doc += '- `email` (würde Login-Zugriff ändern)\n';
    doc += '- `role` (nur via Base44-Admin-Panel)\n';
    doc += '- `id`, `created_date`, `updated_date` (automatische Felder)\n\n';
    
    doc += '---\n\n';
    
    doc += '## 11. SPEZIELLE BERECHTIGUNGEN\n\n';
    
    doc += '### 11.1 Scheduled Tasks\n\n';
    doc += '**Regel**: ALLE Scheduled Tasks sind Admin-only\n\n';
    doc += '**Begründung**: \n';
    doc += '- Tasks laufen automatisch ohne User-Kontext\n';
    doc += '- Potentiell destruktiv (z.B. Cleanup)\n';
    doc += '- Betreffen oft System-weite Daten\n\n';
    doc += '**Liste Admin-only Scheduled Tasks**:\n';
    doc += '1. `updateLetterTrackingCodes` (täglich 12:00 Uhr)\n';
    doc += '2. `updateDocumentation` (wöchentlich, Montag 3:00 Uhr)\n';
    doc += '3. `cleanupOldEmails` (wöchentlich, Sonntag 2:00 Uhr)\n';
    doc += '4. Optional: `finapiSync` (täglich 6:00 Uhr) - wenn als Task konfiguriert\n\n';
    doc += '**Implementierung**:\n';
    doc += '```javascript\n';
    doc += '// Jede Scheduled-Task-Funktion\n';
    doc += 'const base44 = createClientFromRequest(req);\n';
    doc += 'const user = await base44.auth.me();\n';
    doc += '\n';
    doc += 'if (user?.role !== "admin") {\n';
    doc += '  return Response.json({ error: "Forbidden" }, { status: 403 });\n';
    doc += '}\n';
    doc += '// → Nur Admin kann Scheduled Tasks manuell triggern\n';
    doc += '```\n\n';
    
    doc += '### 11.2 System-Templates\n\n';
    doc += '**Regel**: `Template.is_system_template = true` können NICHT gelöscht werden\n\n';
    doc += '**Implementierung**:\n';
    doc += '```javascript\n';
    doc += '// Frontend - Delete-Button verstecken\n';
    doc += '{!template.is_system_template && (\n';
    doc += '  <Button onClick={() => deleteTemplate(template.id)}>\n';
    doc += '    Löschen\n';
    doc += '  </Button>\n';
    doc += ')}\n';
    doc += '\n';
    doc += '// Backend - Validierung\n';
    doc += 'if (template.is_system_template && user.role !== "admin") {\n';
    doc += '  return Response.json(\n';
    doc += '    { error: "System-Templates können nicht gelöscht werden" },\n';
    doc += '    { status: 403 }\n';
    doc += '  );\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**System-Templates**:\n';
    doc += '- Mietvertrag\n';
    doc += '- Mieterhöhung\n';
    doc += '- Betriebskostenabrechnung\n';
    doc += '- Kündigung\n';
    doc += '- Übergabeprotokoll\n';
    doc += '- Zahlungserinnerung\n\n';
    
    doc += '### 11.3 finAPI-Verbindungen\n\n';
    doc += '**Regel**: Jeder User kann Bankkonten verbinden (User + Admin)\n\n';
    doc += '**Sichtbarkeit**: \n';
    doc += '- Admin: Sieht ALLE BankAccounts\n';
    doc += '- User: Sieht ALLE BankAccounts (aktuell)\n';
    doc += '- Geplant: User sieht nur selbst-verbundene Konten (`created_by = user.email`)\n\n';
    
    doc += '### 11.4 Entwickler-Dokumentation\n\n';
    doc += '**Generieren**: ✅ Nur Admin\n';
    doc += '**Ansehen**: ✅ Admin + User\n';
    doc += '**Downloaden**: ✅ Admin + User\n';
    doc += '**Löschen**: ✅ Nur Admin\n\n';
    doc += '**Begründung**: \n';
    doc += '- Generierung ist potenziell ressourcen-intensiv\n';
    doc += '- Löschen könnte versehentlich wertvolle Doku entfernen\n';
    doc += '- Ansehen ist OK für alle (hilft bei Support)\n\n';
    
    doc += '---\n\n';
    
    doc += '## 12. DATEN-ISOLATION (Zukunft / Roadmap)\n\n';
    
    doc += '### 12.1 Multi-Tenancy (geplant)\n\n';
    doc += '**Problem**: Aktuell sehen alle User alle Daten\n\n';
    doc += '**Lösung**: Mandanten-Trennung einführen\n\n';
    doc += '**Konzept**:\n';
    doc += '- Neues Feld: `tenant_id` in allen Entities (nicht Mieter-Tenant, sondern Mandant!)\n';
    doc += '- Jeder User gehört zu einem Mandanten\n';
    doc += '- User sieht nur Daten seines Mandanten\n\n';
    doc += '**Beispiel**:\n';
    doc += '```javascript\n';
    doc += '// Hausverwaltung A (tenant_id: "hvw-a")\n';
    doc += '// - User: verwalter-a@example.com\n';
    doc += '// - Buildings: Hauptstraße 1, Musterweg 5\n';
    doc += '// - Sieht NUR diese 2 Buildings\n';
    doc += '\n';
    doc += '// Hausverwaltung B (tenant_id: "hvw-b")\n';
    doc += '// - User: verwalter-b@example.com\n';
    doc += '// - Buildings: Gartenstraße 10\n';
    doc += '// - Sieht NUR dieses Building\n';
    doc += '\n';
    doc += '// Filter automatisch anwenden\n';
    doc += 'const buildings = await base44.entities.Building.filter({\n';
    doc += '  tenant_id: currentUser.tenant_id\n';
    doc += '});\n';
    doc += '```\n\n';
    doc += '**Status**: 🚧 Konzept vorhanden, nicht implementiert\n\n';
    
    doc += '### 12.2 Objekt-basierte Berechtigungen (geplant)\n\n';
    doc += '**Problem**: Verwalter A soll nur Objekt 1-3 verwalten, Verwalter B nur Objekt 4-6\n\n';
    doc += '**Lösung**: Neue Entity `UserBuildingPermission`\n\n';
    doc += '```javascript\n';
    doc += '{\n';
    doc += '  user_id: "uuid-123",\n';
    doc += '  building_id: "uuid-456",\n';
    doc += '  permissions: ["read", "update"], // granular\n';
    doc += '  valid_from: "2024-01-01",\n';
    doc += '  valid_until: null // aktuell gültig\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Status**: 🚧 Geplant, nicht implementiert\n\n';
    
    doc += '---\n\n';
    doc += '## 13. SICHERHEITS-BEST-PRACTICES\n\n';
    
    doc += '### 13.1 Implementierte Sicherheitsmaßnahmen\n\n';
    doc += '✅ **JWT-Token in HttpOnly Cookies** (nicht von JavaScript auslesbar)\n';
    doc += '✅ **CORS-Schutz** (nur erlaubte Domains)\n';
    doc += '✅ **HTTPS-Only** (alle Requests verschlüsselt)\n';
    doc += '✅ **API-Keys verschlüsselt in DB** (LetterXpress, finAPI)\n';
    doc += '✅ **Rate Limiting** (LetterXpress: 1/sec, finAPI: 100/min)\n';
    doc += '✅ **SQL-Injection-Schutz** (Prepared Statements via Base44 SDK)\n';
    doc += '✅ **XSS-Schutz** (React automatisch, kein dangerouslySetInnerHTML)\n';
    doc += '✅ **CSRF-Schutz** (Token-basiert)\n\n';
    
    doc += '### 13.2 Fehlende Sicherheitsmaßnahmen (Roadmap)\n\n';
    doc += '🚧 **2FA (Two-Factor Authentication)** - Geplant\n';
    doc += '🚧 **IP-Whitelisting** - Geplant (für Admin-Funktionen)\n';
    doc += '🚧 **Session-Timeout** - Aktuell: 24h (könnte kürzer sein)\n';
    doc += '🚧 **Audit-Log-Export** - Für Compliance\n';
    doc += '🚧 **Granulare Permissions** - Siehe Kapitel 12\n\n';
    
    doc += '---\n\n';
    
    doc += '## 14. ZUSAMMENFASSUNG: ROLLEN-VERGLEICH\n\n';
    
    doc += '| Feature | Admin | User | Eigentümer* | Mieter* |\n';
    doc += '|---------|-------|------|-------------|--------|\n';
    doc += '| Objekte verwalten | ✅ Alle | ✅ Alle | ❌ | ❌ |\n';
    doc += '| Mieter verwalten | ✅ Alle | ✅ Alle | ❌ | ❌ |\n';
    doc += '| Finanzen verwalten | ✅ Alle | ✅ Alle | ❌ | ❌ |\n';
    doc += '| Dokumente erstellen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Dokumente ansehen | ✅ Alle | ✅ Alle | ✅ Eigene | ✅ Eigene |\n';
    doc += '| Post versenden | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Banking | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Steuern (Anlage V) | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Betriebskosten-Abrechnung | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| User einladen (User-Rolle) | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| User einladen (Admin-Rolle) | ✅ | ❌ | ❌ | ❌ |\n';
    doc += '| User-Liste ansehen | ✅ | ❌ | ❌ | ❌ |\n';
    doc += '| System-Einstellungen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Entwickler-Doku generieren | ✅ | ❌ | ❌ | ❌ |\n';
    doc += '| Entwickler-Doku ansehen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Scheduled Tasks | ✅ | ❌ | ❌ | ❌ |\n';
    doc += '| Activity-Log ansehen | ✅ | ✅ | ❌ | ❌ |\n';
    doc += '| Daten exportieren | ✅ | ✅ | ✅ Eingeschränkt | ✅ Nur eigene |\n\n';
    doc += '**\\*Eigentümer und Mieter sind geplante Rollen (noch nicht implementiert)**\n\n';
    
    doc += '---\n\n';
    
    doc += '## 15. AUTHENTIFIZIERUNGS-SZENARIEN\n\n';
    
    doc += '### 15.1 Szenario: Unauthentifizierter Zugriff\n\n';
    doc += '**User-Aktion**: Direkter Aufruf von `https://app/Buildings`\n\n';
    doc += '**System-Reaktion**:\n';
    doc += '1. Base44 prüft Cookie `base44_session`\n';
    doc += '2. Cookie nicht vorhanden oder abgelaufen\n';
    doc += '3. Redirect zu: `https://auth.base44.com/login?next=/Buildings`\n';
    doc += '4. Nach Login: Redirect zurück zu `/Buildings`\n\n';
    
    doc += '### 15.2 Szenario: User versucht Admin-Funktion\n\n';
    doc += '**User-Aktion**: User (role="user") klickt auf "Dokumentation generieren"\n\n';
    doc += '**System-Reaktion**:\n';
    doc += '1. Frontend prüft `user.role`\n';
    doc += '2. Button sollte versteckt sein (aber was wenn User URL direkt aufruft?)\n';
    doc += '3. Backend-Funktion `generateDocumentation` wird aufgerufen\n';
    doc += '4. Backend prüft: `user.role !== "admin"`\n';
    doc += '5. Response: `403 Forbidden - Admin access required`\n';
    doc += '6. Frontend zeigt Toast: "❌ Keine Berechtigung"\n\n';
    
    doc += '### 15.3 Szenario: Session-Timeout\n\n';
    doc += '**User-Aktion**: User ist seit 25 Stunden angemeldet, klickt auf "Speichern"\n\n';
    doc += '**System-Reaktion**:\n';
    doc += '1. Token ist abgelaufen (24h Gültigkeit)\n';
    doc += '2. API-Call liefert `401 Unauthorized`\n';
    doc += '3. Frontend fängt Fehler ab:\n';
    doc += '```javascript\n';
    doc += 'if (error.status === 401) {\n';
    doc += '  // Redirect to Login mit next-URL\n';
    doc += '  base44.auth.redirectToLogin(window.location.pathname);\n';
    doc += '}\n';
    doc += '```\n';
    doc += '4. User wird zu Login weitergeleitet\n';
    doc += '5. Nach Login: Zurück zur ursprünglichen Seite (Daten bleiben erhalten im Formular, wenn möglich)\n\n';
    
    doc += '---\n\n';
    
    doc += '## 16. DSGVO-COMPLIANCE\n\n';
    
    doc += '### 16.1 Rechtsgrundlagen\n\n';
    doc += '| Datentyp | Rechtsgrundlage | Artikel DSGVO |\n';
    doc += '|----------|-----------------|---------------|\n';
    doc += '| Mieter-Daten | Vertragserfüllung | Art. 6 Abs. 1b |\n';
    doc += '| Eigentümer-Daten | Vertragserfüllung | Art. 6 Abs. 1b |\n';
    doc += '| Finanzdaten | Steuerrecht (Aufbewahrungspflicht) | Art. 6 Abs. 1c |\n';
    doc += '| Activity-Logs | Berechtigtes Interesse | Art. 6 Abs. 1f |\n';
    doc += '| E-Mails | Einwilligung (opt-in) | Art. 6 Abs. 1a |\n';
    doc += '| Bank-Transaktionen | Vertragserfüllung + Steuerrecht | Art. 6 Abs. 1b+c |\n\n';
    
    doc += '### 16.2 Betroffenenrechte\n\n';
    doc += '**Auskunftsrecht (Art. 15 DSGVO)**:\n';
    doc += '- Mieter kann alle seine gespeicherten Daten anfordern\n';
    doc += '- Export via `/Export?type=my_data` (Mieter-Portal, geplant)\n\n';
    doc += '**Löschrecht (Art. 17 DSGVO)**:\n';
    doc += '- Einschränkung: Aufbewahrungspflichten (10 Jahre Steuerrecht)\n';
    doc += '- Nach Mietende + 10 Jahre: Daten werden anonymisiert\n';
    doc += '- Implementierung: Scheduled Task `anonymizeOldTenantData` (geplant)\n\n';
    doc += '**Berichtigungsrecht (Art. 16 DSGVO)**:\n';
    doc += '- Mieter kann über Mieter-Portal Datenkorrektur anfordern\n';
    doc += '- Verwalter muss Änderung durchführen\n\n';
    
    doc += '---\n\n';
    
    doc += '## 17. WICHTIGE SICHERHEITS-HINWEISE\n\n';
    
    doc += '### 17.1 Was die App NICHT hat (Sicherheits-Gaps)\n\n';
    doc += '❌ **Keine IP-basierte Zugriffskontrolle**\n';
    doc += '  - User kann sich von überall anmelden\n';
    doc += '  - Risiko: Gestohlene Credentials\n';
    doc += '  - Empfehlung: 2FA implementieren\n\n';
    doc += '❌ **Keine automatische Account-Sperrung** bei mehrfachen Fehlversuchen\n';
    doc += '  - Brute-Force-Angriffe theoretisch möglich\n';
    doc += '  - Mitigation: Base44-Platform hat Rate-Limiting\n\n';
    doc += '❌ **Keine Passwort-Komplexitäts-Anforderungen** (durch Base44 geregelt)\n';
    doc += '  - Base44-Standard: min. 8 Zeichen\n';
    doc += '  - Empfehlung: Eigene Policy (z.B. min. 12 Zeichen, Sonderzeichen)\n\n';
    doc += '❌ **Keine Session-Timeout-Warnung**\n';
    doc += '  - User wird nach 24h einfach ausgeloggt (kein Countdown)\n';
    doc += '  - Daten in Formularen könnten verloren gehen\n\n';
    
    doc += '### 17.2 Sensible Daten\n\n';
    doc += '**Besonders schützenswert**:\n';
    doc += '- Bank-Zugangsdaten (gespeichert bei finAPI, NICHT in unserer App)\n';
    doc += '- IBANs (in BankAccount, BankTransaction)\n';
    doc += '- Steuer-IDs (in Owner, Shareholder)\n';
    doc += '- Geburtsdaten (in Tenant)\n';
    doc += '- Kaufpreise (in PurchaseContract)\n\n';
    doc += '**Schutzmaßnahmen**:\n';
    doc += '- ✅ HTTPS (Übertragung verschlüsselt)\n';
    doc += '- ✅ DB-Verschlüsselung at-rest (Base44-Platform)\n';
    doc += '- ✅ Keine Anzeige in Logs (Passwörter, API-Keys)\n';
    doc += '- ⚠️ Fehlend: Field-Level-Encryption für besonders sensible Felder\n\n';
    
    doc += '---\n\n';
    
    doc += '## 18. MIGRATION ZU GRANULAREM BERECHTIGUNGSSYSTEM\n\n';
    
    doc += '### 18.1 Roadmap\n\n';
    doc += '**Phase 1: Basis-Rollen erweitern** (Q2 2024)\n';
    doc += '- Eigentümer-Rolle implementieren\n';
    doc += '- Mieter-Rolle implementieren\n';
    doc += '- Row-Level-Security für Buildings (Eigentümer sieht nur eigene)\n\n';
    doc += '**Phase 2: Granulare Permissions** (Q3 2024)\n';
    doc += '- Feld-Level-Berechtigungen\n';
    doc += '- Objekt-basierte Zugriffskontrolle\n';
    doc += '- Multi-Tenancy (Mandantentrennung)\n\n';
    doc += '**Phase 3: Approval-Workflows** (Q4 2024)\n';
    doc += '- Freigabe-Prozesse für große Kosten\n';
    doc += '- Mehrstufige Approvals\n';
    doc += '- Freigabe-Historie\n\n';
    
    doc += '### 18.2 Breaking Changes bei Migration\n\n';
    doc += '**Was sich ändert**:\n';
    doc += '- User (role="user") sieht nur noch eigene Daten (wenn objekt-basierte Permissions aktiv)\n';
    doc += '- Neue Rolle "Eigentümer" hat read-only Zugriff\n';
    doc += '- Neue Rolle "Mieter" extrem eingeschränkt\n\n';
    doc += '**Migration-Strategie**:\n';
    doc += '1. Alle existierenden User behalten ihre Rechte (role="admin" oder role="user")\n';
    doc += '2. Neue Einladungen können neue Rollen nutzen\n';
    doc += '3. Opt-in Aktivierung pro App (Feature-Flag)\n\n';
    
    doc += '---\n\n';
    
    doc += '## 19. CODE-BEISPIELE\n\n';
    
    doc += '### 19.1 Frontend: Bedingte UI basierend auf Rolle\n\n';
    doc += '```jsx\n';
    doc += 'import { base44 } from "@/api/base44Client";\n';
    doc += 'import { useQuery } from "@tanstack/react-query";\n';
    doc += '\n';
    doc += 'function BuildingsList() {\n';
    doc += '  const { data: user } = useQuery({\n';
    doc += '    queryKey: ["current-user"],\n';
    doc += '    queryFn: () => base44.auth.me()\n';
    doc += '  });\n';
    doc += '  \n';
    doc += '  const { data: buildings } = useQuery({\n';
    doc += '    queryKey: ["buildings"],\n';
    doc += '    queryFn: () => base44.entities.Building.list()\n';
    doc += '  });\n';
    doc += '  \n';
    doc += '  return (\n';
    doc += '    <div>\n';
    doc += '      <h1>Objekte</h1>\n';
    doc += '      \n';
    doc += '      {/* Admin + User können Objekte erstellen */}\n';
    doc += '      {(user?.role === "admin" || user?.role === "user") && (\n';
    doc += '        <Button onClick={createBuilding}>+ Objekt hinzufügen</Button>\n';
    doc += '      )}\n';
    doc += '      \n';
    doc += '      {buildings.map(building => (\n';
    doc += '        <BuildingCard \n';
    doc += '          key={building.id} \n';
    doc += '          building={building}\n';
    doc += '          canEdit={user?.role === "admin" || user?.role === "user"}\n';
    doc += '          canDelete={user?.role === "admin" || user?.role === "user"}\n';
    doc += '        />\n';
    doc += '      ))}\n';
    doc += '    </div>\n';
    doc += '  );\n';
    doc += '}\n';
    doc += '```\n\n';
    
    doc += '### 19.2 Backend: Admin-Check in Funktion\n\n';
    doc += '```javascript\n';
    doc += '// functions/updateLetterTrackingCodes.js\n';
    doc += 'import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";\n';
    doc += '\n';
    doc += 'Deno.serve(async (req) => {\n';
    doc += '  try {\n';
    doc += '    const base44 = createClientFromRequest(req);\n';
    doc += '    const user = await base44.auth.me();\n';
    doc += '    \n';
    doc += '    // AUTH-CHECK\n';
    doc += '    if (!user) {\n';
    doc += '      return Response.json({ error: "Unauthorized" }, { status: 401 });\n';
    doc += '    }\n';
    doc += '    \n';
    doc += '    // ADMIN-CHECK (nur für diese Funktion!)\n';
    doc += '    if (user.role !== "admin") {\n';
    doc += '      return Response.json(\n';
    doc += '        { error: "Forbidden: Admin access required" },\n';
    doc += '        { status: 403 }\n';
    doc += '      );\n';
    doc += '    }\n';
    doc += '    \n';
    doc += '    // Admin authentifiziert → Funktion ausführen\n';
    doc += '    const shipments = await base44.asServiceRole.entities.LetterShipment.filter({\n';
    doc += '      status: { $in: ["queue", "hold", "done"] }\n';
    doc += '    });\n';
    doc += '    \n';
    doc += '    // ... Tracking-Codes updaten ...\n';
    doc += '    \n';
    doc += '    return Response.json({ success: true, updated: shipments.length });\n';
    doc += '    \n';
    doc += '  } catch (error) {\n';
    doc += '    return Response.json({ error: error.message }, { status: 500 });\n';
    doc += '  }\n';
    doc += '});\n';
    doc += '```\n\n';
    
    doc += '### 19.3 Backend: User-Context für Daten-Filtering (Zukunft)\n\n';
    doc += '```javascript\n';
    doc += '// Beispiel: Zukünftige Implementierung mit objekt-basierten Permissions\n';
    doc += 'Deno.serve(async (req) => {\n';
    doc += '  const base44 = createClientFromRequest(req);\n';
    doc += '  const user = await base44.auth.me();\n';
    doc += '  \n';
    doc += '  if (!user) {\n';
    doc += '    return Response.json({ error: "Unauthorized" }, { status: 401 });\n';
    doc += '  }\n';
    doc += '  \n';
    doc += '  // User-spezifische Daten laden\n';
    doc += '  let buildings;\n';
    doc += '  \n';
    doc += '  if (user.role === "admin") {\n';
    doc += '    // Admin sieht alles\n';
    doc += '    buildings = await base44.entities.Building.list();\n';
    doc += '  } else if (user.role === "owner") {\n';
    doc += '    // Eigentümer sieht nur seine Objekte\n';
    doc += '    const relationships = await base44.entities.OwnerRelationship.filter({\n';
    doc += '      owner_email: user.email, // Verknüpfung über E-Mail\n';
    doc += '      valid_until: null // aktuell gültig\n';
    doc += '    });\n';
    doc += '    const buildingIds = relationships.map(r => r.building_id);\n';
    doc += '    buildings = await base44.entities.Building.filter({\n';
    doc += '      id: { $in: buildingIds }\n';
    doc += '    });\n';
    doc += '  } else {\n';
    doc += '    // User (Standard) sieht alles (aktuelles Verhalten)\n';
    doc += '    buildings = await base44.entities.Building.list();\n';
    doc += '  }\n';
    doc += '  \n';
    doc += '  return Response.json({ buildings });\n';
    doc += '});\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
    doc += '## 20. FAQ: HÄUFIGE FRAGEN ZU BERECHTIGUNGEN\n\n';
    
    doc += '**F: Kann ein User sich selbst zum Admin machen?**\n';
    doc += 'A: ❌ Nein. Rollen-Änderung nur durch Admin via Base44-Admin-Panel oder anderen Admin via User-Verwaltung.\n\n';
    doc += '**F: Kann ein Admin andere Admins löschen?**\n';
    doc += 'A: ✅ Ja. Admin kann alle User (auch andere Admins) löschen. ACHTUNG: Letzter Admin kann sich selbst nicht löschen (Schutz).\n\n';
    doc += '**F: Wie wird verhindert, dass User sensible Daten exportieren?**\n';
    doc += 'A: Aktuell: gar nicht. User kann alle Daten exportieren (z.B. via Browser DevTools oder direkter API-Call). Zukünftig: Export-Funktionen nur für Admin.\n\n';
    doc += '**F: Können Eigentümer Dokumente löschen?**\n';
    doc += 'A: Aktuell: Rolle "Eigentümer" existiert nicht. Geplant: Nein, nur Ansehen.\n\n';
    doc += '**F: Wie lange bleiben Activity-Logs gespeichert?**\n';
    doc += 'A: Permanent (∞), außer Login/Logout-Logs (90 Tage). DSGVO-konform wegen berechtigtem Interesse.\n\n';
    doc += '**F: Kann ein User seine eigenen Activity-Logs löschen?**\n';
    doc += 'A: ❌ Nein. Activity-Logs sind unveränderlich (Audit-Trail-Integrität).\n\n';
    doc += '**F: Was passiert wenn ein User gelöscht wird?**\n';
    doc += 'A: \n';
    doc += '- User-Entity wird gelöscht\n';
    doc += '- `created_by`-Felder bleiben erhalten (E-Mail-String bleibt, auch wenn User weg)\n';
    doc += '- ActivityLog bleibt erhalten (mit user_email)\n';
    doc += '- Dokumente/Daten bleiben unverändert\n\n';
    doc += '**F: Können Scheduled Tasks von Usern manuell getriggert werden?**\n';
    doc += 'A: ✅ Ja, ABER nur Admins (403 für User). UI zeigt Tasks nur Admins.\n\n';
    
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