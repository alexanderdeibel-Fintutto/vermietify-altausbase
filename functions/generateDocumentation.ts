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