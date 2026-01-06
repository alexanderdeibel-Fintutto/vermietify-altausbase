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
    doc += '## Entitäten\n\n';

    for (const [name, schema] of Object.entries(entities)) {
        doc += `### ${name}\n\n`;
        doc += '**Felder:**\n\n';
        
        if (schema?.properties) {
            for (const [fieldName, field] of Object.entries(schema.properties)) {
                const required = schema.required?.includes(fieldName) ? '(erforderlich)' : '(optional)';
                const type = field.type || 'unknown';
                const description = field.description || '';
                doc += `- **${fieldName}** ${required}: ${type} - ${description}\n`;
            }
        }
        doc += '\n';
    }

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
    doc += '## Automatische Buchungsgenerierung\n\n';
    doc += 'Das System generiert automatisch Buchungen aus:\n';
    doc += '- Grundsteuerbescheiden (quartalsweise)\n';
    doc += '- Versicherungen (gemäß Zahlungsrhythmus)\n';
    doc += '- Krediten (monatliche Raten)\n';
    doc += '- Versorgern (monatlich/quartalsweise)\n';
    doc += '- Mietverträgen (monatliche Mieteinnahmen)\n\n';
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
    doc += '## Workflow: Neues Gebäude anlegen\n';
    doc += '1. Navigation zu "Objekte"\n';
    doc += '2. Klick auf "Gebäude hinzufügen"\n';
    doc += '3. Eingabe der Gebäudedaten\n';
    doc += '4. Speichern\n\n';
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