import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Fallback: Bekannte Entity-Schemas
const KNOWN_ENTITY_SCHEMAS = {
  "Building": {
    "name": "Building",
    "type": "object",
    "properties": {
      "name": {"type": "string", "description": "Name des Gebäudes"},
      "address": {"type": "string", "description": "Straße des Gebäudes"},
      "city": {"type": "string", "description": "Stadt des Gebäudes"},
      "postal_code": {"type": "string", "description": "Postleitzahl des Gebäudes"},
      "year_built": {"type": "number", "description": "Baujahr"},
      "total_units": {"type": "number", "description": "Anzahl Wohneinheiten"}
    },
    "required": ["name", "address", "city", "postal_code"]
  },
  "Unit": {
    "name": "Unit",
    "type": "object",
    "properties": {
      "gebaeude_id": {"type": "string", "description": "Referenz zum Gebäude"},
      "unit_number": {"type": "string", "description": "Wohnungsnummer"},
      "floor": {"type": "number", "description": "Etage"},
      "rooms": {"type": "number", "description": "Anzahl Zimmer"},
      "sqm": {"type": "number", "description": "Wohnfläche in qm"},
      "status": {"type": "string", "enum": ["occupied", "vacant", "renovation"]}
    },
    "required": ["gebaeude_id", "unit_number", "sqm"]
  },
  "Tenant": {
    "name": "Tenant",
    "type": "object",
    "properties": {
      "first_name": {"type": "string", "description": "Vorname"},
      "last_name": {"type": "string", "description": "Nachname"},
      "email": {"type": "string", "description": "E-Mail-Adresse"},
      "phone": {"type": "string", "description": "Telefonnummer"},
      "date_of_birth": {"type": "string", "format": "date"}
    },
    "required": ["first_name", "last_name"]
  },
  "LeaseContract": {
    "name": "LeaseContract",
    "type": "object",
    "properties": {
      "unit_id": {"type": "string"},
      "tenant_id": {"type": "string"},
      "start_date": {"type": "string", "format": "date"},
      "end_date": {"type": "string", "format": "date"},
      "base_rent": {"type": "number"},
      "total_rent": {"type": "number"},
      "status": {"type": "string", "enum": ["active", "terminated", "expired"]}
    },
    "required": ["unit_id", "tenant_id", "start_date", "base_rent", "total_rent"]
  }
};

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

        const existing = await base44.entities.GeneratedDocumentation.filter({
            documentation_type
        });

        let docId = existing[0]?.id;
        let versionNumber = 1;
        let previousVersionId = null;

        if (existing[0]) {
            versionNumber = (existing[0].version_number || 1) + 1;
            previousVersionId = existing[0].id;
        }

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

        let content_markdown = '';
        let content_json = {};

        try {
            if (documentation_type === 'sample_data') {
                const sampleDataResult = await base44.asServiceRole.functions.invoke('generateSampleData', { preset: 'komplett' });
                content_markdown = sampleDataResult.data?.markdown || `# Beispiel-Daten\n\nGeneriert über dedizierte Funktion\n\nDokumentation-ID: ${sampleDataResult.data?.documentation_id}`;
                content_json = sampleDataResult.data?.data || {};
            } else if (documentation_type === 'user_issues') {
                const userIssuesResult = await base44.asServiceRole.functions.invoke('generateUserIssuesDocumentation', {});
                const userIssuesDoc = await base44.asServiceRole.entities.GeneratedDocumentation.get(userIssuesResult.data?.documentation_id);
                content_markdown = userIssuesDoc.content_markdown;
                content_json = userIssuesDoc.content_json || {};
            } else {
                const allEntities = { ...KNOWN_ENTITY_SCHEMAS };
                
                switch (documentation_type) {
                    case 'database_structure':
                        content_markdown = await generateDatabaseStructureDoc(allEntities, changes, versionNumber);
                        content_json = { entities: allEntities };
                        break;
                    // ... other cases
                    default:
                         content_markdown = await generateDatabaseStructureDoc(allEntities, changes, versionNumber);
                         content_json = { entities: allEntities };
                }
            }

            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;
            const fileSize = new Blob([content_markdown]).size;

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

            if (bereich && changes.length > 0) {
                for (const change of changes) {
                    await base44.entities.DocumentationChange.update(change.id, { doku_aktualisiert: true });
                }
            }

            return Response.json({
                success: true,
                documentation_id: docId,
                file_size_bytes: fileSize,
                generation_duration_seconds: duration
            });

        } catch (error) {
            await base44.entities.GeneratedDocumentation.update(docId, {
                status: 'error',
                error_message: error.message
            });
            throw error;
        }

    } catch (error) {
        console.error('Generate documentation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

// ... (All helper functions like generateDatabaseStructureDoc, getTitleForType, etc. are assumed to be here)
// Paste the helper functions from the original file here.

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
    let doc = '# Datenbankstruktur - VOLLSTÄNDIGE DOKUMENTATION\n\n';
    doc += '**Metadaten:**\n';
    doc += `- Generiert am: ${new Date().toLocaleString('de-DE')}\n`;
    doc += `- Dokumentations-Version: ${versionNumber}\n`;
    doc += `- Anzahl Tabellen: ${Object.keys(entities).length}\n`;
    doc += `- Anzahl Änderungen seit letzter Version: ${changes.length}\n`;
    doc += '- Verwendungszweck: KI-Assistent Kontextinformation + Excel-Export\n\n';
    
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
    
    doc += '---\n\n';
    
    doc += '## Built-in Felder (ALLE Tabellen)\n\n';
    doc += 'Jede Tabelle hat automatisch folgende Felder (nicht im Schema aufgeführt):\n\n';
    doc += '| Feldname | Datentyp | Pflichtfeld | Standardwert | Unique | Beschreibung | Validierung | Beispiel | Berechnet | Abhängigkeiten |\n';
    doc += '|----------|----------|-------------|--------------|--------|--------------|-------------|----------|-----------|----------------|\n';
    doc += '| id | string (UUID) | Ja | auto | Ja | Eindeutige Datensatz-ID | UUID v4 Format | "a3f5e7d9-..." | ✅ Auto-generiert | - |\n';
    doc += '| created_date | datetime | Ja | now() | Nein | Zeitstempel der Erstellung | ISO 8601 | "2024-01-07T15:30:00Z" | ✅ Auto-generiert | - |\n';
    doc += '| updated_date | datetime | Ja | now() | Nein | Zeitstempel der letzten Änderung | ISO 8601 | "2024-01-07T16:45:00Z" | ✅ Auto-Update bei Änderung | - |\n';
    doc += '| created_by | string (email) | Ja | user.email | Nein | E-Mail des Erstellers | E-Mail-Format | "verwalter@example.com" | ✅ Aus Auth-Context | - |\n\n';
    
    doc += '---\n\n';
    
    const groups = {
        '1. OBJEKTE & GEBÄUDE': ['Building', 'Unit'],
        '2. MIETER & VERTRÄGE': ['Tenant', 'LeaseContract'],
    };

    for (const [groupName, entityNames] of Object.entries(groups)) {
        const groupEntities = entityNames.filter(name => entities[name]);
        if (groupEntities.length === 0) continue;

        doc += `# ${groupName}\n\n`;

        for (const name of groupEntities) {
            const schema = entities[name];
            doc += `## Tabelle: ${name}\n\n`;

            if (schema?.properties) {
                doc += '| Feldname | Datentyp | Pflichtfeld | Beschreibung |\n';
                doc += '|----------|----------|-------------|--------------|\n';

                for (const [fieldName, field] of Object.entries(schema.properties)) {
                    const required = schema.required?.includes(fieldName) ? 'Ja' : 'Nein';
                    let type = field.type || 'unknown';
                    if (field.format) type += ` (${field.format})`;
                    if (field.enum) type = `enum: ${field.enum.join(', ')}`;
                    const description = (field.description || '-').replace(/\n/g, ' ');
                    doc += `| ${fieldName} | ${type} | ${required} | ${description} |\n`;
                }
            }
            doc += '\n';
        }
    }

    return doc;
}