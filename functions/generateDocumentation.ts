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
    
    // Gruppierung der Entitäten
    const groups = {
        '1. OBJEKTE & GEBÄUDE': ['Building', 'Unit', 'Meter', 'Gebaeude', 'PurchaseContract'],
        '2. EIGENTÜMER & BETEILIGUNGEN': ['Owner', 'Shareholder', 'OwnerRelationship'],
        '3. MIETER & VERTRÄGE': ['Tenant', 'LeaseContract', 'RentChange', 'Payment'],
        '4. DOKUMENTE & VORLAGEN': ['Document', 'Template', 'TextBlock', 'DocumentOriginal'],
        '5. BELEGE & BUCHHALTUNG': ['Invoice', 'FinancialItem', 'GeneratedFinancialBooking', 'FinancialItemTransactionLink', 'PaymentTransactionLink'],
        '6. BANKING': ['BankAccount', 'BankTransaction', 'CategorizationRule'],
        '7. STEUER & ABRECHNUNG': ['PropertyTax', 'Insurance', 'Financing', 'Supplier', 'TaxForm', 'TaxFormField', 'AnlageVSubmission', 'BuildingTaxLibrary', 'CostCategory', 'AfASchedule', 'BookingGenerationRule', 'EuerCategory', 'TaxCategory', 'CostTaxLink', 'CustomCostCategory', 'CostType'],
        '8. BETRIEBSKOSTEN': ['OperatingCostStatement', 'OperatingCostStatementItem'],
        '9. AUFGABEN & WORKFLOWS': ['Task', 'TaskStatus', 'TaskPriority', 'Workflow', 'WorkflowStep', 'Automation'],
        '10. KOMMUNIKATION': ['Email', 'IMAPAccount', 'LetterXpressCredential', 'LetterShipment', 'Recipient'],
        '11. SYSTEM & META': ['Notification', 'ActivityLog', 'GeneratedDocumentation', 'DocumentationChange']
    };

    for (const [groupName, entityNames] of Object.entries(groups)) {
        const groupEntities = entityNames.filter(name => entities[name]);
        if (groupEntities.length === 0) continue;

        doc += `# ${groupName}\n\n`;

        for (const name of groupEntities) {
            const schema = entities[name];
            doc += `## Tabelle: ${name}\n\n`;

            if (schema?.properties) {
                // 10-Spalten Tabelle
                doc += '| Feldname | Datentyp | Pflichtfeld | Standardwert | Unique | Beschreibung | Validierungsregeln | Beispielwert | Wird berechnet? | Abhängigkeiten |\n';
                doc += '|----------|----------|-------------|--------------|--------|--------------|-------------------|--------------|-----------------|----------------|\n';

                for (const [fieldName, field] of Object.entries(schema.properties)) {
                    const required = schema.required?.includes(fieldName) ? 'Ja' : 'Nein';
                    
                    // Datentyp mit Details
                    let type = field.type || 'unknown';
                    if (field.format) type += ` (${field.format})`;
                    if (field.enum) type = 'enum';
                    if (field.type === 'array') type = `array<${field.items?.type || 'object'}>`;
                    if (field.type === 'object') type = 'json';
                    
                    const defaultValue = field.default !== undefined ? String(field.default) : '-';
                    const unique = 'Nein'; // Base44 hat keine unique constraints außer id
                    const description = (field.description || '-').replace(/\n/g, ' ');
                    
                    // Validierungsregeln
                    let validation = '';
                    if (field.enum) validation = `Werte: ${field.enum.join(', ')}`;
                    if (field.minimum) validation += ` Min: ${field.minimum}`;
                    if (field.maximum) validation += ` Max: ${field.maximum}`;
                    if (field.minLength) validation += ` Min. ${field.minLength} Zeichen`;
                    if (field.maxLength) validation += ` Max. ${field.maxLength} Zeichen`;
                    if (field.pattern) validation += ` Pattern: ${field.pattern}`;
                    if (!validation) validation = '-';
                    
                    // Beispielwert
                    let example = getExampleValue(name, fieldName, field);
                    
                    // Wird berechnet?
                    let computed = getComputedInfo(name, fieldName);
                    
                    // Abhängigkeiten
                    let dependencies = getDependencies(name, fieldName, field);
                    
                    doc += `| ${fieldName} | ${type} | ${required} | ${defaultValue} | ${unique} | ${description} | ${validation} | ${example} | ${computed} | ${dependencies} |\n`;
                }
                
                // Enum-Werte Details (wenn vorhanden)
                const enumFields = Object.entries(schema.properties).filter(([_, f]) => f.enum);
                if (enumFields.length > 0) {
                    doc += '\n**Enum-Werte Details**:\n\n';
                    for (const [fieldName, field] of enumFields) {
                        doc += `**${fieldName}**:\n`;
                        field.enum.forEach(value => {
                            const meaning = getEnumMeaning(name, fieldName, value);
                            doc += `- \`${value}\`: ${meaning}\n`;
                        });
                        doc += '\n';
                    }
                }
            }

            // Meta-Informationen nach der Tabelle
            doc += '\n**Meta-Informationen**:\n\n';
            doc += `- **Primary Key**: id (UUID, auto-generiert)\n`;
            
            // Foreign Keys
            const foreignKeys = [];
            if (schema?.properties) {
                for (const [fieldName, field] of Object.entries(schema.properties)) {
                    if (fieldName.endsWith('_id') && fieldName !== 'id') {
                        const relatedEntity = fieldName.slice(0, -3).split('_').map(w => 
                            w.charAt(0).toUpperCase() + w.slice(1)
                        ).join('');
                        const relationship = getRelationshipType(name, fieldName, relatedEntity);
                        foreignKeys.push(`  - **${fieldName}** → ${relatedEntity}.id (${relationship})`);
                    }
                }
            }
            if (foreignKeys.length > 0) {
                doc += '- **Foreign Keys**:\n';
                doc += foreignKeys.join('\n') + '\n';
            } else {
                doc += '- **Foreign Keys**: Keine\n';
            }
            
            // Indizes
            const indices = getIndices(name);
            doc += `- **Indizes**: ${indices}\n`;
            
            // Trigger/Hooks
            const hooks = getHooks(name);
            doc += `- **Trigger/Hooks**: ${hooks}\n`;
            
            // Soft-Delete
            const softDelete = hasSoftDelete(name);
            doc += `- **Soft-Delete**: ${softDelete}\n`;
            
            // Historisierung
            const historization = getHistorization(name);
            doc += `- **Historisierung**: ${historization}\n`;
            
            // Berechtigungen
            const permissions = getPermissions(name);
            doc += `- **Berechtigungen**: ${permissions}\n`;
            
            doc += '\n';
        }
    }

    return doc;
}

// Helper-Funktionen für Datenbank-Dokumentation

function getExampleValue(entityName, fieldName, field) {
    // Spezifische Beispiele für bekannte Felder
    const examples = {
        'Building': {
            'name': '"Hauptstraße 1, Berlin"',
            'address': '"Hauptstraße 1"',
            'zip_code': '"10115"',
            'city': '"Berlin"',
            'building_type': '"Mehrfamilienhaus"',
            'construction_year': '1995',
            'total_area': '400',
            'number_of_units': '6',
            'land_area': '500',
            'purchase_price': '450000',
            'land_value': '150000'
        },
        'Unit': {
            'name': '"Whg. 1.OG links"',
            'flaeche': '65.5',
            'rooms': '3',
            'floor': '1',
            'building_id': '"uuid-building-123"'
        },
        'Tenant': {
            'first_name': '"Max"',
            'last_name': '"Mustermann"',
            'email': '"max@example.com"',
            'phone': '"+49 176 12345678"',
            'address': '"Alte Str. 5"',
            'zip_code': '"12345"',
            'city': '"Musterstadt"',
            'birth_date': '"1985-03-15"'
        },
        'LeaseContract': {
            'base_rent': '800',
            'utilities': '150',
            'heating': '80',
            'total_rent': '1030',
            'deposit': '2400',
            'start_date': '"2024-02-01"',
            'end_date': 'null',
            'rent_due_day': '3',
            'status': '"active"'
        },
        'Invoice': {
            'invoice_number': '"RE-2024-001"',
            'invoice_date': '"2024-01-05"',
            'due_date': '"2024-02-05"',
            'total_amount': '350.00',
            'net_amount': '294.12',
            'tax_amount': '55.88',
            'tax_rate': '19',
            'supplier_name': '"Mustermann Versicherungen GmbH"'
        }
    };
    
    if (examples[entityName] && examples[entityName][fieldName]) {
        return examples[entityName][fieldName];
    }
    
    // Fallback basierend auf Feldtyp
    if (field.type === 'string') {
        if (fieldName.includes('email')) return '"user@example.com"';
        if (fieldName.includes('phone')) return '"+49 30 12345678"';
        if (fieldName.includes('name')) return '"Beispiel Name"';
        if (fieldName.includes('address')) return '"Musterstraße 1"';
        if (fieldName.includes('city')) return '"Berlin"';
        if (fieldName.includes('zip')) return '"10115"';
        if (fieldName.endsWith('_id')) return '"uuid-123-456"';
        if (field.format === 'date') return '"2024-01-07"';
        if (field.format === 'date-time') return '"2024-01-07T15:30:00Z"';
        if (field.enum) return `"${field.enum[0]}"`;
        return '"Beispiel"';
    }
    if (field.type === 'number') {
        if (fieldName.includes('amount') || fieldName.includes('price')) return '1000.00';
        if (fieldName.includes('percent') || fieldName.includes('rate')) return '19';
        if (fieldName.includes('year')) return '2024';
        if (fieldName.includes('month')) return '12';
        if (fieldName.includes('day')) return '15';
        return '100';
    }
    if (field.type === 'boolean') return field.default !== undefined ? String(field.default) : 'false';
    if (field.type === 'array') return '[]';
    if (field.type === 'object') return '{}';
    
    return '-';
}

function getComputedInfo(entityName, fieldName) {
    const computed = {
        'LeaseContract': {
            'total_rent': '✅ base_rent + utilities + heating'
        },
        'GeneratedFinancialBooking': {
            'outstanding_amount': '✅ amount - paid_amount'
        },
        'Invoice': {
            'net_amount': '✅ total_amount / (1 + tax_rate/100)',
            'tax_amount': '✅ total_amount - net_amount'
        },
        'Building': {
            'total_area': '❌ Manuell (idealerweise = sum(Unit.flaeche))',
            'number_of_units': '❌ Manuell (oder = count(Units))'
        }
    };
    
    return computed[entityName]?.[fieldName] || '-';
}

function getDependencies(entityName, fieldName, field) {
    // Spezifische Abhängigkeiten
    if (fieldName.endsWith('_id')) return `Erforderlich wenn ${entityName} verknüpft werden soll`;
    if (fieldName === 'end_date' && entityName === 'LeaseContract') return 'Nur bei befristetem Vertrag (is_unlimited=false)';
    if (fieldName === 'second_tenant_id') return 'Optional bei 2 Hauptmietern';
    if (fieldName === 'predecessor_id') return 'Nur bei Version > 1';
    if (fieldName.startsWith('faelligkeit_')) return 'Nur bei Grundsteuer mit 4 Quartalen';
    
    return '-';
}

function getRelationshipType(entityName, fieldName, relatedEntity) {
    // n:1 ist Standard (viele Entity haben einen Related)
    // Spezifische Beziehungen
    const relationships = {
        'Unit.building_id': '1 Building → n Units (1:n)',
        'LeaseContract.unit_id': '1 Unit → n LeaseContracts (1:n über Zeit)',
        'LeaseContract.tenant_id': '1 Tenant → n LeaseContracts (1:n)',
        'Document.template_id': '1 Template → n Documents (1:n)',
        'BankTransaction.bank_account_id': '1 BankAccount → n Transactions (1:n)',
        'GeneratedFinancialBooking.building_id': '1 Building → n Bookings (1:n)',
        'OwnerRelationship.owner_id': 'n:1',
        'OwnerRelationship.building_id': 'n:m (über OwnerRelationship)',
        'Shareholder.owner_id': '1 Owner → n Shareholders (1:n)'
    };
    
    const key = `${entityName}.${fieldName}`;
    return relationships[key] || 'n:1';
}

function getIndices(entityName) {
    // Wichtige Performance-Indizes
    const indices = {
        'Building': 'id (PK), zip_code, city',
        'Unit': 'id (PK), building_id, name',
        'LeaseContract': 'id (PK), unit_id, tenant_id, start_date, status',
        'BankTransaction': 'id (PK), bank_account_id, booking_date, amount',
        'GeneratedFinancialBooking': 'id (PK), building_id, due_date, booking_status',
        'Invoice': 'id (PK), building_id, invoice_date, supplier_name',
        'Document': 'id (PK), building_id, tenant_id, status, created_date',
        'Task': 'id (PK), status, due_date, assigned_object_id'
    };
    
    return indices[entityName] || 'id (PK)';
}

function getHooks(entityName) {
    const hooks = {
        'LeaseContract': 'Bei CREATE: Optional Buchungen generieren (generateBookingsFromSource)',
        'PropertyTax': 'Bei CREATE/UPDATE: Optional Buchungen generieren',
        'Insurance': 'Bei CREATE: Optional Buchungen generieren',
        'Financing': 'Bei CREATE: Optional AfA-Plan generieren',
        'Document': 'Nach PDF-Generierung: pdf_url und seitenanzahl setzen',
        'BankTransaction': 'Nach Import: AI-Matching triggern',
        'GeneratedFinancialBooking': 'Bei UPDATE paid_amount: outstanding_amount neu berechnen'
    };
    
    return hooks[entityName] || 'Keine';
}

function hasSoftDelete(entityName) {
    const softDeleteEntities = {
        'GeneratedFinancialBooking': 'Ja (is_cancelled=true)',
        'Task': 'Ja (status="abgebrochen")',
        'Document': 'Nein (hard delete)',
        'LeaseContract': 'Nein, aber Versionierung (is_current_valid=false)',
        'Invoice': 'Nein'
    };
    
    return softDeleteEntities[entityName] || 'Nein (hard delete)';
}

function getHistorization(entityName) {
    const versionedEntities = [
        'PropertyTax', 'Insurance', 'Financing', 'Supplier', 'LeaseContract'
    ];
    
    if (versionedEntities.includes(entityName)) {
        return '✅ Ja (version_number, predecessor_id, is_current_valid)';
    }
    
    if (entityName === 'Document') {
        return '✅ Ja (change_history Array)';
    }
    
    if (entityName === 'GeneratedDocumentation') {
        return '✅ Ja (version_number, previous_version_id, changes_summary)';
    }
    
    return 'Nein (nur created_date/updated_date)';
}

function getPermissions(entityName) {
    // Basierend auf Rollen-Dokumentation
    const restrictedEntities = {
        'User': 'Admin: ALL | User: R (nur eigenes Profil), U (nur eigenes Profil)',
        'GeneratedDocumentation': 'Admin: ALL | User: R',
        'ActivityLog': 'Admin: R,C | User: R',
        'LetterXpressCredential': 'Admin: ALL | User: ALL',
        'IMAPAccount': 'Admin: ALL | User: ALL'
    };
    
    return restrictedEntities[entityName] || 'Admin: ALL | User: ALL';
}

function getEnumMeaning(entityName, fieldName, value) {
    const meanings = {
        'Document.status': {
            'zu_erledigen': 'Dokument muss noch bearbeitet werden',
            'erinnern': 'Erinnerung für dieses Dokument gesetzt',
            'erstellt': 'Dokument wurde erstellt/generiert',
            'geaendert': 'Dokument wurde nach Erstellung geändert',
            'versendet': 'Dokument wurde per Post/E-Mail versendet',
            'unterschrieben': 'Dokument wurde unterschrieben',
            'gescannt': 'Original wurde eingescannt und hochgeladen'
        },
        'LeaseContract.status': {
            'active': 'Mietvertrag ist aktuell gültig und aktiv',
            'terminated': 'Mietvertrag wurde gekündigt (läuft noch bis Kündigungsfrist)',
            'expired': 'Mietvertrag ist ausgelaufen/beendet'
        },
        'GeneratedFinancialBooking.booking_status': {
            'Geplant': 'Buchung ist geplant, noch nicht bezahlt',
            'Gebucht': 'Buchung wurde gebucht (bestätigt)',
            'TeilweiseBezahlt': 'Buchung wurde teilweise bezahlt',
            'Bezahlt': 'Buchung wurde vollständig bezahlt'
        },
        'Task.status': {
            'offen': 'Task muss noch erledigt werden',
            'in_bearbeitung': 'Task wird gerade bearbeitet',
            'wartend': 'Task wartet auf externe Aktion/Rückmeldung',
            'erledigt': 'Task wurde abgeschlossen',
            'abgebrochen': 'Task wurde abgebrochen/storniert'
        },
        'CostCategory.category_type': {
            'ERHALTUNG': 'Erhaltungsaufwendungen (sofort absetzbar)',
            'HERSTELLUNG': 'Herstellungskosten (nur über AfA absetzbar)',
            'BETRIEB': 'Betriebskosten (oft umlagefähig)',
            'FINANZIERUNG': 'Finanzierungskosten (Zinsen, Gebühren)'
        },
        'CostCategory.tax_treatment': {
            'SOFORT': 'Sofort als Werbungskosten absetzbar',
            'AFA': 'Nur über Abschreibung (AfA) absetzbar',
            'VERTEILT': 'Wird auf mehrere Jahre verteilt',
            'NICHT_ABSETZBAR': 'Steuerlich nicht absetzbar'
        },
        'GeneratedFinancialBooking.source_type': {
            'Versorger': 'Aus Versorger-Vertrag generiert (Strom, Gas, Wasser)',
            'Grundsteuer': 'Aus Grundsteuerbescheid generiert',
            'Versicherung': 'Aus Versicherungsvertrag generiert',
            'Kredit': 'Aus Kreditvertrag generiert (Raten)',
            'AfA': 'Abschreibung aus Kaufvertrag',
            'Kaufvertrag': 'Direkt aus Kaufvertrag generiert',
            'Mietvertrag': 'Mieteinnahmen aus Mietvertrag'
        },
        'LetterShipment.status': {
            'queue': 'In Warteschlange bei LetterXpress',
            'hold': 'Wird gedruckt',
            'done': 'Gedruckt, wird versendet',
            'sent': 'Versendet und zugestellt',
            'canceled': 'Storniert'
        }
    };
    
    const key = `${entityName}.${fieldName}`;
    return meanings[key]?.[value] || value;
}

async function generateModuleArchitectureDoc(entities, changes = [], versionNumber = 1) {
    const moduleCount = 11;
    let doc = '# Modul-Architektur - VOLLSTÄNDIGE DOKUMENTATION\n\n';
    doc += '**Metadaten:**\n';
    doc += `- Generiert am: ${new Date().toLocaleString('de-DE')}\n`;
    doc += `- Dokumentations-Version: ${versionNumber}\n`;
    doc += `- Anzahl Module: ${moduleCount}\n`;
    doc += `- Anzahl Änderungen seit letzter Version: ${changes.length}\n`;
    doc += '- Verwendungszweck: KI-Assistent Kontextinformation\n\n';
    
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
    
    doc += '## MODUL-ÜBERSICHT\n\n';
    doc += 'Die Immobilienverwaltungs-App besteht aus 11 Hauptmodulen, sortiert nach Abhängigkeiten (Basis-Module zuerst):\n\n';
    doc += '1. **Eigentümerverwaltung** (Basis - keine Abhängigkeiten)\n';
    doc += '2. **Objektverwaltung** (Basis - hängt nur von Eigentümer ab)\n';
    doc += '3. **Mieterverwaltung** (Basis - hängt nur von Objektverwaltung ab)\n';
    doc += '4. **Verträge & Kosten** (benötigt Objektverwaltung)\n';
    doc += '5. **Steuer-Modul** (benötigt Objekt- und Vertragsdaten)\n';
    doc += '6. **Finanzverwaltung** (zentral - verknüpft viele Module)\n';
    doc += '7. **Banking** (spezial - finAPI Integration)\n';
    doc += '8. **Betriebskosten** (benötigt Finanzen, Objekte, Mieter)\n';
    doc += '9. **Dokumentenverwaltung** (nutzt Daten aus allen Modulen)\n';
    doc += '10. **Kommunikation** (nutzt Dokumentenverwaltung)\n';
    doc += '11. **Aufgaben & Workflows** (übergreifend - nutzt alle Module)\n\n';
    
    doc += '---\n\n';
    
    // MODUL 1: EIGENTÜMERVERWALTUNG
    doc += '# MODUL 1: EIGENTÜMERVERWALTUNG\n\n';
    
    doc += '## 1. GRUNDINFORMATIONEN\n\n';
    doc += '**Modulname**: Eigentümerverwaltung / Owner Management\n\n';
    doc += '**Hauptzweck**: \n';
    doc += 'Verwaltung von Eigentümern und Gesellschafterstrukturen. Das Modul bildet alle Eigentumsformen ab – von Einzeleigentümern über GbR und GmbH bis zu komplexen Gesellschafterstrukturen. Es ist die Basis für steuerliche Zuordnungen und Eigentümerabrechnungen. Ohne korrekte Eigentümerdaten können keine Anlage V Formulare oder Eigentümerabrechnungen erstellt werden.\n\n';
    doc += '**Status**: ✅ Live (vollständig implementiert)\n\n';
    doc += '**Priorität**: ⭐ Kritisch (Basis-Modul ohne das steuerliche Funktionen nicht arbeiten)\n\n';
    
    doc += '## 2. DATENBANK-NUTZUNG\n\n';
    doc += '**Tabellen LESEND**:\n';
    doc += '- Owner (eigene Tabelle)\n';
    doc += '- Shareholder (eigene Tabelle)\n';
    doc += '- OwnerRelationship (eigene Tabelle)\n';
    doc += '- Building (zum Anzeigen zugeordneter Objekte)\n\n';
    doc += '**Tabellen SCHREIBEND**:\n';
    doc += '- Owner (CREATE, UPDATE, DELETE)\n';
    doc += '- Shareholder (CREATE, UPDATE, DELETE)\n';
    doc += '- OwnerRelationship (CREATE, UPDATE bei Eigentümerwechsel)\n';
    doc += '- ActivityLog (bei allen Änderungen)\n\n';
    doc += '**Häufigste Queries**:\n';
    doc += '```sql\n';
    doc += '-- Alle Eigentümer auflisten\n';
    doc += 'SELECT * FROM Owner ORDER BY company_name, last_name\n';
    doc += '\n';
    doc += '-- Eigentümer eines Gebäudes finden\n';
    doc += 'SELECT o.* FROM Owner o\n';
    doc += 'JOIN OwnerRelationship r ON o.id = r.owner_id\n';
    doc += 'WHERE r.building_id = ? AND (r.valid_until IS NULL OR r.valid_until >= NOW())\n';
    doc += '\n';
    doc += '-- Gesellschafter einer GbR\n';
    doc += 'SELECT * FROM Shareholder WHERE owner_id = ?\n';
    doc += '```\n\n';
    
    doc += '## 3. ABHÄNGIGKEITEN\n\n';
    doc += '**Abhängig von**: Keine (Basis-Modul)\n\n';
    doc += '**Abhängig von ihm**:\n';
    doc += '- Objektverwaltung (Building.owner_id optional)\n';
    doc += '- Steuer-Modul (AnlageV benötigt Eigentümerdaten)\n';
    doc += '- Finanzverwaltung (Eigentümerabrechnungen)\n\n';
    doc += '**Empfängt Daten von**: Keine\n\n';
    doc += '**Liefert Daten an**:\n';
    doc += '- Objektverwaltung: Owner-ID für Building-Zuordnung\n';
    doc += '- Steuer-Modul: Steuer-ID, Anteile für Anlage V\n';
    doc += '- Dokumentenverwaltung: Namen, Adressen für Briefköpfe\n\n';
    
    doc += '## 4. NUTZER & BERECHTIGUNGEN\n\n';
    doc += '| Nutzergruppe | Lesen | Erstellen | Bearbeiten | Löschen | Einschränkungen |\n';
    doc += '|--------------|-------|-----------|------------|---------|----------------|\n';
    doc += '| Admin | ✅ Alle | ✅ | ✅ | ✅ | Keine |\n';
    doc += '| Verwalter (User) | ✅ Alle | ✅ | ✅ | ✅ | Keine |\n';
    doc += '| Eigentümer | ✅ Nur eigene Daten | ❌ | ❌ | ❌ | Kann nur eigene Stammdaten sehen |\n';
    doc += '| Mieter | ❌ | ❌ | ❌ | ❌ | Kein Zugriff |\n\n';
    
    doc += '## 5. HAUPT-WORKFLOWS\n\n';
    doc += '**Workflow 1: Einzeleigentümer (Privatperson) anlegen**\n';
    doc += '1. Navigation: Objekt-Detail → Tab "Eigentümer" → "+ Eigentümer hinzufügen"\n';
    doc += '2. Rechtsform wählen: ⚪ Privatperson\n';
    doc += '3. Stammdaten eingeben: Vorname, Nachname, Adresse, PLZ, Ort, (optional) Telefon, E-Mail, Geburtsdatum, Steuer-ID\n';
    doc += '4. Validierung: Alle Pflichtfelder ausgefüllt\n';
    doc += '5. Speichern → Owner Entity CREATE\n';
    doc += '6. OwnerRelationship erstellen (Zuordnung zu Building mit Anteil)\n';
    doc += '7. ActivityLog "owner_created"\n';
    doc += '**Automatisiert**: Nein (manuelle Eingabe)\n';
    doc += '**Dauer**: ~2 Minuten\n\n';
    
    doc += '**Workflow 2: GbR (Gesellschaft) anlegen**\n';
    doc += '1. Rechtsform wählen: ⚪ GbR\n';
    doc += '2. GbR-Stammdaten: Firmenname, Adresse, Steuernummer, Finanzamt\n';
    doc += '3. Gesellschafter hinzufügen (min. 2):\n';
    doc += '   - Pro Gesellschafter: Vorname, Nachname, Anteil (%), Steuer-ID\n';
    doc += '   - Validierung: Summe Anteile = 100%\n';
    doc += '4. Speichern → Owner (type="gbr") + Nx Shareholder Entities\n';
    doc += '5. OwnerRelationship zu Building erstellen\n';
    doc += '**Automatisiert**: Anteilsberechnung (wenn nur 2 Gesellschafter: je 50%)\n';
    doc += '**Dauer**: ~5 Minuten\n\n';
    
    doc += '**Workflow 3: Eigentümerwechsel durchführen**\n';
    doc += '1. Bestehende OwnerRelationship öffnen\n';
    doc += '2. "valid_until" setzen auf Verkaufsdatum\n';
    doc += '3. Neue OwnerRelationship erstellen mit neuem Owner\n';
    doc += '4. Validation: Keine zeitlichen Lücken, Anteile ergeben 100%\n';
    doc += '5. ActivityLog "owner_relationship_changed"\n';
    doc += '**Automatisiert**: Nein\n';
    doc += '**Freigabe erforderlich**: Nein (aber wichtig für Steuern!)\n\n';
    
    doc += '## 6. GESCHÄFTSLOGIK\n\n';
    doc += '**Berechnungen**:\n';
    doc += '- Anteilsberechnung: Summe aller Shareholder.share_percentage = 100%\n';
    doc += '- Zeitraum-Validierung: valid_from < valid_until\n';
    doc += '- Überschneidungs-Check: Keine overlapping OwnerRelationships für gleiches Building\n\n';
    doc += '**Automatismen**:\n';
    doc += '- Auto-Fill Gesellschafter-Adresse = GbR-Adresse (überschreibbar)\n';
    doc += '- Bei 2 Gesellschaftern ohne Anteile: je 50% vorschlagen\n\n';
    doc += '**Validierungen**:\n';
    doc += '- ✅ BLOCKER: GbR muss min. 2 Gesellschafter haben\n';
    doc += '- ✅ BLOCKER: Summe Anteile = 100%\n';
    doc += '- ✅ BLOCKER: Steuer-ID muss 11 Ziffern haben (wenn gesetzt)\n';
    doc += '- ⚠️ WARNING: Eigentümerwechsel ohne Verkaufsdatum\n\n';
    
    doc += '## 7. INTEGRATIONEN\n\n';
    doc += '**Externe APIs**: Keine\n\n';
    doc += '**Generierte Dokumente**: \n';
    doc += '- Eigentümerabrechnung (über Dokumenten-Modul)\n';
    doc += '- Gesellschafterversammlungs-Protokoll (optional)\n\n';
    doc += '**Benachrichtigungen**:\n';
    doc += '- Bei Eigentümerwechsel: Notification an Admin\n';
    doc += '- ActivityLog-Eintrag bei allen Änderungen\n\n';
    
    doc += '## 8. BESONDERHEITEN\n\n';
    doc += '**Deutsche Rechtsanforderungen**:\n';
    doc += '- GbR muss mind. 2 Gesellschafter haben (§705 BGB)\n';
    doc += '- Steuer-ID erforderlich für Anlage V (EStG)\n';
    doc += '- Gesellschafteranteile müssen dokumentiert sein\n\n';
    doc += '**Komplexe Sonderfälle**:\n';
    doc += '- Zeitliche Eigentümerwechsel (valid_from / valid_until)\n';
    doc += '- Mehrere Eigentümer mit unterschiedlichen Anteilen (z.B. 60/40)\n';
    doc += '- Gesellschafter-Wechsel bei GbR (neue Shareholder-Version)\n\n';
    doc += '**Performance-kritisch**:\n';
    doc += '- OwnerRelationship-Abfrage bei Building-Liste (JOIN erforderlich)\n';
    doc += '- Gesellschafter-Anzahl bei GbR/GmbH (Nested Queries)\n\n';
    
    doc += '---\n\n';
    
    // MODUL 2: OBJEKTVERWALTUNG
    doc += '# MODUL 2: OBJEKTVERWALTUNG\n\n';
    
    doc += '## 1. GRUNDINFORMATIONEN\n\n';
    doc += '**Modulname**: Objektverwaltung / Property Management\n\n';
    doc += '**Hauptzweck**: \n';
    doc += 'Verwaltung von Immobilien, Wohneinheiten und Zählern. Das Modul ist die zentrale Datenbasis der App. Hier werden alle Gebäude mit vollständigen Stammdaten, Adressen, Baujahr, Flächen und Kaufinformationen erfasst. Wohneinheiten werden detailliert mit Wohnflächen, Raumanzahl und Ausstattung dokumentiert. Zähler für Strom, Gas und Wasser werden den Einheiten zugeordnet für spätere Verbrauchsabrechnung.\n\n';
    doc += '**Status**: ✅ Live (vollständig implementiert)\n\n';
    doc += '**Priorität**: ⭐⭐⭐ Kritisch (Zentrale Datenbasis ohne die nichts funktioniert)\n\n';
    
    doc += '## 2. DATENBANK-NUTZUNG\n\n';
    doc += '**Tabellen LESEND**:\n';
    doc += '- Building (eigene Tabelle - für Listen, Detail-Ansichten)\n';
    doc += '- Unit (eigene Tabelle - gefiltert nach building_id)\n';
    doc += '- Meter (eigene Tabelle - gefiltert nach unit_id oder building_id)\n';
    doc += '- Gebaeude (erweiterte Struktur - alternative/zukünftige Struktur)\n';
    doc += '- PurchaseContract (eigene Tabelle - für Kaufdaten)\n';
    doc += '- Owner (via OwnerRelationship - für Eigentümer-Anzeige)\n';
    doc += '- OwnerRelationship (für aktuelle Eigentümer)\n';
    doc += '- LeaseContract (zum Zählen aktiver Verträge)\n';
    doc += '- BuildingTaxLibrary (prüfen ob Steuer-System initialisiert)\n\n';
    doc += '**Tabellen SCHREIBEND**:\n';
    doc += '- Building (CREATE bei Neuanlage, UPDATE bei Stammdaten-Änderung, DELETE selten)\n';
    doc += '- Unit (CREATE bei Wohnungserfassung, UPDATE bei Datenänderung, DELETE bei Fehleingabe)\n';
    doc += '- Meter (CREATE bei Zählererfassung, UPDATE bei Zählerstandseingabe)\n';
    doc += '- PurchaseContract (CREATE einmalig, UPDATE selten)\n';
    doc += '- OwnerRelationship (CREATE bei Zuordnung, UPDATE bei Eigentümerwechsel)\n';
    doc += '- ActivityLog (bei allen Aktionen)\n\n';
    doc += '**Häufigste Queries (Performance-relevant)**:\n';
    doc += '```sql\n';
    doc += '-- Query 1: Buildings-Liste mit Eigentümern (häufigste Abfrage)\n';
    doc += 'SELECT b.*, COUNT(u.id) as unit_count\n';
    doc += 'FROM Building b\n';
    doc += 'LEFT JOIN Unit u ON b.id = u.building_id\n';
    doc += 'GROUP BY b.id\n';
    doc += 'ORDER BY b.name\n';
    doc += '-- Häufigkeit: Bei jedem Seitenwechsel zu /Buildings (mehrmals täglich)\n';
    doc += '\n';
    doc += '-- Query 2: Building-Detail mit allen Units\n';
    doc += 'SELECT * FROM Unit WHERE building_id = ? ORDER BY floor, name\n';
    doc += '-- Häufigkeit: Bei jedem Building-Detail-Aufruf (mehrmals täglich)\n';
    doc += '\n';
    doc += '-- Query 3: Verfügbare Units (ohne aktiven Mietvertrag)\n';
    doc += 'SELECT u.* FROM Unit u\n';
    doc += 'WHERE u.building_id = ?\n';
    doc += 'AND NOT EXISTS (\n';
    doc += '  SELECT 1 FROM LeaseContract lc\n';
    doc += '  WHERE lc.unit_id = u.id\n';
    doc += '  AND lc.status = "active"\n';
    doc += ')\n';
    doc += '-- Häufigkeit: Bei Mietvertragserstellung (täglich)\n';
    doc += '```\n\n';
    
    doc += '## 3. ABHÄNGIGKEITEN\n\n';
    doc += '**Abhängig von**:\n';
    doc += '- Eigentümerverwaltung (optional - für OwnerRelationship)\n\n';
    doc += '**Module die davon abhängig sind**:\n';
    doc += '- ⭐ Mieterverwaltung (benötigt Units)\n';
    doc += '- ⭐ Finanzverwaltung (building_id in fast allen Finanz-Entities)\n';
    doc += '- ⭐ Steuer-Modul (Building ist Basis für PropertyTax, AnlageV)\n';
    doc += '- Betriebskosten (Building + Units)\n';
    doc += '- Dokumentenverwaltung (Building-Daten für Dokumente)\n\n';
    doc += '**Datenfluss EINGEHEND**: Keine (außer Owner-Daten)\n\n';
    doc += '**Datenfluss AUSGEHEND**:\n';
    doc += '```\n';
    doc += 'Building → Mieterverwaltung:\n';
    doc += '  - building_id, name, address (für Vertrags-Zuordnung)\n';
    doc += '\n';
    doc += 'Unit → Mieterverwaltung:\n';
    doc += '  - unit_id, name, flaeche (für Mietvertrag)\n';
    doc += '\n';
    doc += 'Building → Finanzverwaltung:\n';
    doc += '  - building_id (für alle Buchungen)\n';
    doc += '  - purchase_price, land_value (für AfA-Berechnung)\n';
    doc += '\n';
    doc += 'Building → Steuer-Modul:\n';
    doc += '  - Komplette Gebäudedaten (für Anlage V)\n';
    doc += '  - Kaufvertrag-Daten (für AfA)\n';
    doc += '```\n\n';
    
    doc += '## 6. GESCHÄFTSLOGIK\n\n';
    doc += '**Berechnungen**:\n';
    doc += '```javascript\n';
    doc += '// 1. Gesamt-Wohnfläche (Building)\n';
    doc += 'total_area = sum(Unit.flaeche WHERE building_id = ?)\n';
    doc += '\n';
    doc += '// 2. Anzahl Wohneinheiten (Building)\n';
    doc += 'number_of_units = count(Unit WHERE building_id = ?)\n';
    doc += '\n';
    doc += '// 3. Gebäudewert (für AfA)\n';
    doc += 'gebaeude_wert = purchase_price - land_value\n';
    doc += '// Nur Gebäude ist abschreibbar, Grundstück nicht!\n';
    doc += '\n';
    doc += '// 4. Verfügbarkeit (Unit)\n';
    doc += 'is_available = NOT EXISTS(LeaseContract WHERE unit_id = ? AND status = "active")\n';
    doc += '```\n\n';
    doc += '**Automatismen**:\n';
    doc += '- Nach Building-Erstellung: Dialog "Steuer-System jetzt einrichten?"\n';
    doc += '- Nach Unit-Erstellung: Gesamt-Wohnfläche in Building aktualisieren (optional)\n';
    doc += '- Nach PurchaseContract-Erstellung: AfA-Plan generieren (Dialog)\n\n';
    doc += '**Validierungen**:\n';
    doc += '- ✅ BLOCKER: Objektname min. 3 Zeichen\n';
    doc += '- ✅ BLOCKER: PLZ exakt 5 Ziffern\n';
    doc += '- ✅ BLOCKER: Wohnfläche (Unit) > 0 und < 1000 m²\n';
    doc += '- ⚠️ WARNING: Wohnfläche > Gesamt-Objektfläche\n';
    doc += '- ⚠️ WARNING: Duplikat-Check bei gleicher Adresse\n';
    doc += '- ⚠️ WARNING: Eigentümer-Anteile ergeben nicht 100%\n\n';
    
    doc += '## 7. INTEGRATIONEN\n\n';
    doc += '**Externe APIs**: Keine direkten API-Calls\n\n';
    doc += '**Generierte Dokumente**:\n';
    doc += '- Objektdatenblatt (optional, über Dokumenten-Modul)\n';
    doc += '- Kaufvertrag-Dokument (Template vorhanden)\n\n';
    doc += '**Benachrichtigungen**:\n';
    doc += '- Toast "Objekt erfolgreich erstellt"\n';
    doc += '- Notification an Admin bei neuem Objekt (optional)\n';
    doc += '- ActivityLog bei CREATE/UPDATE/DELETE\n\n';
    
    doc += '## 8. BESONDERHEITEN\n\n';
    doc += '**Deutsche Anforderungen**:\n';
    doc += '- Wohnfläche nach WoFlV (Wohnflächenverordnung)\n';
    doc += '- Grundbuch-Adresse muss exakt sein (für Grundsteuer)\n';
    doc += '- Kaufvertrag-Daten für steuerliche AfA (§7 EStG)\n\n';
    doc += '**Komplexe Sonderfälle**:\n';
    doc += '- Gemischt-genutzte Gebäude (Wohnen + Gewerbe) → unterschiedliche AfA-Sätze\n';
    doc += '- Units ohne Flächen-Angabe → Betriebskosten-Abrechnung unmöglich\n';
    doc += '- Mehrere Gebäude an gleicher Adresse (Hinterhaus, etc.)\n';
    doc += '- Zähler-Kaskadierung (Haupt-Zähler → Unter-Zähler)\n\n';
    doc += '**Performance-kritisch**:\n';
    doc += '- Building-Liste mit JOIN zu Units (bei vielen Objekten > 100ms)\n';
    doc += '- Unit.flaeche wird häufig summiert (Betriebskosten-Berechnung)\n';
    doc += '- Building-Detail lädt viele verknüpfte Daten (Units, Contracts, Owners, etc.)\n\n';
    
    doc += '---\n\n';
    
    // MODUL 3: MIETERVERWALTUNG
    doc += '# MODUL 3: MIETERVERWALTUNG\n\n';
    
    doc += '## 1. GRUNDINFORMATIONEN\n\n';
    doc += '**Modulname**: Mieterverwaltung / Tenant & Lease Management\n\n';
    doc += '**Hauptzweck**: \n';
    doc += 'Vollständige Verwaltung von Mietern, Mietverträgen und Zahlungsströmen. Das Modul verwaltet alle Mieter-Stammdaten, erstellt und historisiert Mietverträge, generiert automatisch monatliche Mietforderungen und dokumentiert Mieterhöhungen mit vollständiger Versionierung. Es ist essentiell für Betriebskostenabrechnungen und Einnahmen-Dokumentation für Anlage V.\n\n';
    doc += '**Status**: ✅ Live (vollständig implementiert)\n\n';
    doc += '**Priorität**: ⭐⭐⭐ Kritisch (Ohne Mietverträge keine Einnahmen-Erfassung)\n\n';
    
    doc += '## 2. DATENBANK-NUTZUNG\n\n';
    doc += '**Tabellen LESEND**:\n';
    doc += '- Tenant (eigene Tabelle)\n';
    doc += '- LeaseContract (eigene Tabelle, häufigste Abfrage: filter by unit_id, status)\n';
    doc += '- Payment (Mietforderungen - verknüpft mit contract_id)\n';
    doc += '- RentChange (Historisierung von Mietänderungen)\n';
    doc += '- Unit (für Wohnungsdaten: name, flaeche)\n';
    doc += '- Building (für Gebäudedaten: name, address)\n';
    doc += '- BankTransaction (für Zahlungs-Matching)\n\n';
    doc += '**Tabellen SCHREIBEND**:\n';
    doc += '- Tenant (CREATE bei Neuanlage, UPDATE bei Datenänderung, DELETE selten)\n';
    doc += '- LeaseContract (CREATE, UPDATE, Versionierung bei Änderungen)\n';
    doc += '- Payment (CREATE automatisch, UPDATE bei Zahlungseingang, DELETE bei Storno)\n';
    doc += '- RentChange (CREATE bei Mieterhöhung, READ-only danach)\n';
    doc += '- GeneratedFinancialBooking (CREATE für Mieteinnahmen-Buchungen)\n';
    doc += '- ActivityLog\n\n';
    doc += '**Häufigste Queries**:\n';
    doc += '```sql\n';
    doc += '-- Query 1: Aktive Verträge eines Gebäudes\n';
    doc += 'SELECT lc.*, t.first_name, t.last_name, u.name as unit_name\n';
    doc += 'FROM LeaseContract lc\n';
    doc += 'JOIN Unit u ON lc.unit_id = u.id\n';
    doc += 'JOIN Tenant t ON lc.tenant_id = t.id\n';
    doc += 'WHERE u.building_id = ? AND lc.status = "active"\n';
    doc += '-- Häufigkeit: Bei BuildingDetail, Betriebskosten (täglich mehrfach)\n';
    doc += '\n';
    doc += '-- Query 2: Verträge im Abrechnungszeitraum (für NK-Abrechnung)\n';
    doc += 'SELECT * FROM LeaseContract\n';
    doc += 'WHERE unit_id IN (?)\n';
    doc += 'AND start_date <= ?\n';
    doc += 'AND (end_date >= ? OR end_date IS NULL)\n';
    doc += '-- Häufigkeit: Bei Betriebskosten-Erstellung (jährlich pro Gebäude)\n';
    doc += '\n';
    doc += '-- Query 3: Unbezahlte Mietforderungen\n';
    doc += 'SELECT p.*, t.first_name, t.last_name\n';
    doc += 'FROM Payment p\n';
    doc += 'JOIN LeaseContract lc ON p.contract_id = lc.id\n';
    doc += 'JOIN Tenant t ON lc.tenant_id = t.id\n';
    doc += 'WHERE p.paid = false AND p.due_date < NOW()\n';
    doc += '-- Häufigkeit: Dashboard, Zahlungserinnerungen (täglich)\n';
    doc += '```\n\n';
    
    doc += '## 4. NUTZER & BERECHTIGUNGEN\n\n';
    doc += '| Nutzergruppe | Lesen | Erstellen | Bearbeiten | Löschen | Einschränkungen |\n';
    doc += '|--------------|-------|-----------|------------|---------|----------------|\n';
    doc += '| Admin | ✅ Alle Verträge | ✅ | ✅ | ✅ | Keine |\n';
    doc += '| Verwalter (User) | ✅ Alle | ✅ | ✅ | ✅ | Keine |\n';
    doc += '| Eigentümer | ✅ Nur eigene Objekte | ❌ | ❌ | ❌ | Nur Verträge in eigenen Buildings |\n';
    doc += '| Mieter | ✅ Nur eigener Vertrag | ❌ | ❌ | ❌ | Nur eigene Vertragsdaten |\n';
    doc += '| Steuerberater | ✅ Alle (read-only) | ❌ | ❌ | ❌ | Für Anlage V Daten |\n\n';
    
    doc += '## 5. HAUPT-WORKFLOWS\n\n';
    doc += '**Workflow 1: Mietvertrag erstellen**\n';
    doc += '1. Navigation: /Contracts → "Neuer Vertrag"\n';
    doc += '2. Tab 1: Gebäude, Unit, Hauptmieter, optional 2. Mieter, Termine (Vertragsdatum, Mietbeginn, Mietende, Übergabe)\n';
    doc += '3. Tab 2: Kaltmiete, Nebenkosten-Vorauszahlung, Heizkosten-Vorauszahlung → Auto-Berechnung Warmmiete\n';
    doc += '4. Tab 3: Kaution (default: 3×Kaltmiete), Kaution-Raten, Kündigungsfrist, Personenanzahl\n';
    doc += '5. Validierung: Alle Pflichtfelder, Überschneidungs-Check (Unit bereits vermietet?)\n';
    doc += '6. Speichern → LeaseContract CREATE\n';
    doc += '7. Dialog: "Mieteinnahmen-Buchungen erstellen?" → Ja/Nein\n';
    doc += '8. Bei Ja: generateBookingsFromSource → 12 monatliche GeneratedFinancialBooking\n';
    doc += '9. Optional: Mietvertrag-Dokument generieren (Template)\n';
    doc += '**Automatisiert**: Schritte 7-8 (Buchungsgenerierung)\n';
    doc += '**Freigabe erforderlich**: Nein\n';
    doc += '**Dauer**: ~10-15 Minuten\n\n';
    
    doc += '**Workflow 2: Mieterhöhung durchführen**\n';
    doc += '1. Bestehenden LeaseContract öffnen\n';
    doc += '2. Button "Mieterhöhung" → Wizard öffnet sich\n';
    doc += '3. Neue Kaltmiete eingeben (Auto-Berechnung: Erhöhungsbetrag, Prozent)\n';
    doc += '4. Validierung: Max. 20% in 3 Jahren (Mietpreisbremse), Begründung bei >10%\n';
    doc += '5. Wirksam-ab Datum (min. 3 Monate in Zukunft)\n';
    doc += '6. Begründung (Mietspiegel, Modernisierung, etc.)\n';
    doc += '7. RentChange Entity CREATE\n';
    doc += '8. Alte LeaseContract-Version: is_current_valid=false setzen\n';
    doc += '9. Neue LeaseContract-Version CREATE (version_number+1, neue Miete)\n';
    doc += '10. Optional: Mieterhöhungs-Dokument generieren + per Einschreiben versenden\n';
    doc += '11. Task erstellen: "Mieterreaktion abwarten" (Frist 2 Monate)\n';
    doc += '**Automatisiert**: Schritte 8-9 (Versionierung)\n';
    doc += '**Freigabe erforderlich**: Nein (aber rechtlich wichtig!)\n';
    doc += '**Dauer**: ~5-10 Minuten\n\n';
    
    doc += '**Workflow 3: Mietvertrag kündigen**\n';
    doc += '1. LeaseContract öffnen → Button "Kündigen"\n';
    doc += '2. Kündigungsdatum eingeben\n';
    doc += '3. Kündigungsfrist berechnen (aus contract.notice_period_months)\n';
    doc += '4. Letzter Miettag = Kündigungsdatum + Kündigungsfrist\n';
    doc += '5. LeaseContract UPDATE: termination_date setzen, status="terminated"\n';
    doc += '6. Payment-Generierung stoppen ab letztem Miettag\n';
    doc += '7. Optional: Kündigungs-Dokument generieren\n';
    doc += '8. Task erstellen: "Wohnungsübergabe vorbereiten" (Frist: letzter Miettag)\n';
    doc += '**Automatisiert**: Schritt 6 (Payment-Stopp)\n';
    doc += '**Dauer**: ~3 Minuten\n\n';
    
    doc += '**Workflow 4: Automatische Mietforderungen generieren**\n';
    doc += '1. Trigger: LeaseContract CREATE oder manuell\n';
    doc += '2. Backend-Funktion: generateBookingsFromSource(sourceType="Mietvertrag", sourceId)\n';
    doc += '3. Zeitraum: start_date bis end_date (oder +12 Monate bei unbefristet)\n';
    doc += '4. Pro Monat: GeneratedFinancialBooking CREATE\n';
    doc += '   - amount = +total_rent (positiv = Einnahme)\n';
    doc += '   - due_date = rent_due_day jeden Monats\n';
    doc += '   - description = "Miete MM/YYYY - Mustermann"\n';
    doc += '   - is_future_booking = true (wird automatisch fortgeführt)\n';
    doc += '5. LeaseContract UPDATE: bookings_created=true, number_of_generated_bookings=12\n';
    doc += '**Automatisiert**: ✅ Vollständig (nach User-Bestätigung)\n';
    doc += '**Dauer**: ~2-3 Sekunden\n\n';
    
    doc += '## 6. GESCHÄFTSLOGIK\n\n';
    doc += '**Berechnungen**:\n';
    doc += '```javascript\n';
    doc += '// 1. Warmmiete (automatisch)\n';
    doc += 'total_rent = base_rent + utilities + heating\n';
    doc += '\n';
    doc += '// 2. Kaution-Obergrenze (rechtlich)\n';
    doc += 'max_deposit = base_rent * 3\n';
    doc += 'if (deposit > max_deposit) {\n';
    doc += '  → ⚠️ WARNING: "Gesetzliche Obergrenze überschritten"\n';
    doc += '}\n';
    doc += '\n';
    doc += '// 3. Kautionsrate (bei Ratenzahlung)\n';
    doc += 'kaution_pro_rate = deposit / deposit_installments\n';
    doc += '// Beispiel: 2400€ / 3 = 800€\n';
    doc += '\n';
    doc += '// 4. Letzter Miettag (bei Kündigung)\n';
    doc += 'last_rent_day = termination_date.addMonths(notice_period_months).endOfMonth()\n';
    doc += '// Beispiel: Kündigung 15.01.2024, Frist 3 Monate → 30.04.2024\n';
    doc += '\n';
    doc += '// 5. Monate im Jahr (für Betriebskosten anteilig)\n';
    doc += 'function calculateMonthsInYear(contract, year) {\n';
    doc += '  const yearStart = new Date(year, 0, 1);\n';
    doc += '  const yearEnd = new Date(year, 11, 31);\n';
    doc += '  const contractStart = max(contract.start_date, yearStart);\n';
    doc += '  const contractEnd = min(contract.end_date || yearEnd, yearEnd);\n';
    doc += '  return monthsBetween(contractStart, contractEnd) + 1;\n';
    doc += '}\n';
    doc += '// Beispiel: Vertrag 01.05.2023-31.12.2023 → 8 Monate\n';
    doc += '\n';
    doc += '// 6. Mieterhöhung Prozent\n';
    doc += 'increase_percent = ((new_rent - old_rent) / old_rent) * 100\n';
    doc += '// Beispiel: (825 - 750) / 750 = 10%\n';
    doc += '\n';
    doc += '// 7. 20%-Grenze in 3 Jahren (Mietpreisbremse)\n';
    doc += 'rent_3_years_ago = getRentFromDate(contract, 3_years_ago)\n';
    doc += 'total_increase = ((new_rent - rent_3_years_ago) / rent_3_years_ago) * 100\n';
    doc += 'if (total_increase > 20) {\n';
    doc += '  → ⚠️ WARNING: "Mietpreisbremse: Max 20% in 3 Jahren"\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Automatismen**:\n';
    doc += '- Nach Vertragserstellung: Dialog "Buchungen generieren?"\n';
    doc += '- Bei Buchungsgenerierung: 12 monatliche Payments automatisch\n';
    doc += '- Bei Mieterhöhung: Automatische Versionierung (alte Version archivieren, neue erstellen)\n';
    doc += '- Bei Kündigung: Payment-Generierung automatisch stoppen ab letztem Miettag\n';
    doc += '- Monatlicher Scheduled Task: Neue Payments generieren (für is_future_booking=true)\n\n';
    doc += '**Validierungen**:\n';
    doc += '- ✅ BLOCKER: base_rent > 0\n';
    doc += '- ✅ BLOCKER: total_rent = base_rent + utilities + heating\n';
    doc += '- ✅ BLOCKER: start_date < end_date (bei befristet)\n';
    doc += '- ✅ BLOCKER: rent_due_day zwischen 1-31\n';
    doc += '- ✅ BLOCKER: Unit nicht bereits vermietet (Überschneidungs-Check)\n';
    doc += '- ⚠️ WARNING: deposit > 3×base_rent (gesetzliche Obergrenze)\n';
    doc += '- ⚠️ WARNING: Mieterhöhung > 20% in 3 Jahren (Mietpreisbremse)\n';
    doc += '- ⚠️ WARNING: Erhöhung ohne Begründung bei >10%\n\n';
    
    doc += '## 3. ABHÄNGIGKEITEN\n\n';
    doc += '**Abhängig von**:\n';
    doc += '- ⭐ Objektverwaltung (benötigt Units für Vertragszuordnung)\n\n';
    doc += '**Module die davon abhängig sind**:\n';
    doc += '- ⭐ Finanzverwaltung (Payment → BankTransaction Matching)\n';
    doc += '- ⭐ Betriebskosten (LeaseContract definiert Abrechnungszeitraum, Vorauszahlungen)\n';
    doc += '- Steuer-Modul (Mieteinnahmen für Anlage V)\n';
    doc += '- Dokumentenverwaltung (Mietvertrag, Mieterhöhung, NK-Abrechnung)\n\n';
    doc += '**Datenfluss EINGEHEND**:\n';
    doc += '```\n';
    doc += 'Von Objektverwaltung:\n';
    doc += '  - Unit: id, name, flaeche, building_id\n';
    doc += '  - Building: name, address (für Dokumente)\n';
    doc += '```\n\n';
    doc += '**Datenfluss AUSGEHEND**:\n';
    doc += '```\n';
    doc += 'An Finanzverwaltung:\n';
    doc += '  - Mietforderungen (Payment) für Matching mit BankTransactions\n';
    doc += '  - Mieteinnahmen (GeneratedFinancialBooking) für Buchhaltung\n';
    doc += '\n';
    doc += 'An Betriebskosten:\n';
    doc += '  - LeaseContract: start_date, end_date, utilities, heating (Vorauszahlungen)\n';
    doc += '  - LeaseContract: number_of_persons (für Personen-Umlageschlüssel)\n';
    doc += '\n';
    doc += 'An Steuer-Modul:\n';
    doc += '  - Mieteinnahmen (für Anlage V Zeile 9)\n';
    doc += '  - Vertragszeiträume (für anteilige Berechnung)\n';
    doc += '\n';
    doc += 'An Dokumentenverwaltung:\n';
    doc += '  - Tenant: Namen, Adressen (für Empfänger)\n';
    doc += '  - LeaseContract: Alle Vertragsdaten (für Mietvertrag-Generierung)\n';
    doc += '```\n\n';
    
    doc += '## 7. INTEGRATIONEN\n\n';
    doc += '**Externe APIs**: Keine direkten\n\n';
    doc += '**Backend-Funktionen**:\n';
    doc += '- `generateBookingsFromSource` (Mieteinnahmen-Buchungen)\n';
    doc += '- `analyzeLeaseContractPayments` (Zahlungs-Analyse)\n';
    doc += '- `recalculateContractPayments` (Nach Mieterhöhung)\n\n';
    doc += '**Generierte Dokumente**:\n';
    doc += '- Mietvertrag (Template-basiert, 8-12 Seiten)\n';
    doc += '- Mieterhöhung (Template, 2-3 Seiten, Einschreiben!)\n';
    doc += '- Kündigung (Template, 2 Seiten, Einschreiben!)\n';
    doc += '- Übergabeprotokoll (bei Ein-/Auszug)\n';
    doc += '- Zahlungsbestätigung\n';
    doc += '- Zahlungserinnerung (bei überfälligen Payments)\n\n';
    doc += '**Benachrichtigungen**:\n';
    doc += '- Toast bei Vertragserstellung\n';
    doc += '- Notification bei überfälliger Miete (Payment.due_date < now() AND paid=false)\n';
    doc += '- E-Mail an Mieter (optional): Vertragsbestätigung\n';
    doc += '- Task-Erstellung: "Wohnungsübergabe" (bei Kündigung)\n\n';
    
    doc += '## 8. BESONDERHEITEN\n\n';
    doc += '**Deutsche Rechtsanforderungen**:\n';
    doc += '- Kaution max. 3 Monatsmieten (§551 Abs. 1 BGB) → System warnt bei Überschreitung\n';
    doc += '- Mieterhöhung max. 20% in 3 Jahren (§558 Abs. 3 BGB) → Automatische Prüfung\n';
    doc += '- Kündigungsfrist gestaffelt nach Mietdauer (§573c BGB) → User muss beachten\n';
    doc += '- Schriftform bei Mieterhöhung (§558 Abs. 1 BGB) → Dokumentengenerierung\n';
    doc += '- Betriebskosten-Vorauszahlung transparent ausweisen (§556 BGB)\n\n';
    doc += '**Komplexe Sonderfälle**:\n';
    doc += '- **Anteilige Vermietung**: Vertrag läuft nur Teil des Jahres → Berechnung months_in_year für NK-Abrechnung\n';
    doc += '- **Staffelmiete**: Automatische Erhöhungen nach Zeitplan → RentChange-Serie\n';
    doc += '- **Indexmiete**: Miete gekoppelt an Verbraucherpreisindex → Manuelle Anpassung erforderlich\n';
    doc += '- **WG-Verträge**: Mehrere Mieter (second_tenant_id) → Hauptmieter ist Vertragspartner\n';
    doc += '- **Untervermietung**: Wird nicht direkt abgebildet (Hinweis-Feld in notes)\n';
    doc += '- **Gewerbemiete**: Gleiche Struktur, aber andere Kündigungsfristen und keine Mietpreisbremse\n\n';
    doc += '**Performance-kritisch**:\n';
    doc += '- Payment-Generierung bei vielen Verträgen (>50) → Batch-Insert erforderlich\n';
    doc += '- Überschneidungs-Check bei Vertragserfassung (komplexe Date-Query)\n';
    doc += '- Mieterhöhungs-Historie (3 Jahre zurück) → Index auf start_date erforderlich\n\n';
    
    doc += '**Versionierungs-System**:\n';
    doc += '```javascript\n';
    doc += '// Bei Mieterhöhung: Alte Version archivieren\n';
    doc += 'await LeaseContract.update(oldId, {\n';
    doc += '  is_current_valid: false\n';
    doc += '});\n';
    doc += '\n';
    doc += '// Neue Version erstellen\n';
    doc += 'await LeaseContract.create({\n';
    doc += '  ...oldContract,\n';
    doc += '  base_rent: new_rent,\n';
    doc += '  total_rent: new_rent + utilities + heating,\n';
    doc += '  version_number: oldContract.version_number + 1,\n';
    doc += '  predecessor_id: oldId,\n';
    doc += '  is_current_valid: true\n';
    doc += '});\n';
    doc += '\n';
    doc += '// Alte Payments bleiben erhalten (referenzieren alte Version)\n';
    doc += '// Neue Payments ab Erhöhungsdatum mit neuer Version\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
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

    let doc = '# Master Data & Konstanten - VOLLSTÄNDIGE DOKUMENTATION\n\n';
    doc += '**Metadaten:**\n';
    doc += `- Generiert am: ${new Date().toLocaleString('de-DE')}\n`;
    doc += `- Dokumentations-Version: ${versionNumber}\n`;
    doc += `- Anzahl Konstanten-Gruppen: ${totalEnums}\n`;
    doc += `- Anzahl Änderungen seit letzter Version: ${changes.length}\n`;
    doc += '- Verwendungszweck: KI-Assistent + Excel-Export\n\n';
    
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
    
    doc += '## ÜBERSICHT\n\n';
    doc += `Diese Dokumentation enthält ALLE Master Data und Konstanten (${totalEnums} Konstanten-Gruppen).\n\n`;
    doc += '**Definition**: Master Data sind vordefinierte Auswahloptionen und Kategorien in Dropdown-Feldern, die in der Datenbank als Enum-Werte gespeichert sind.\n\n';
    doc += '**Format**: Jede Konstanten-Gruppe ist als 11-Spalten-Tabelle dokumentiert (Excel-kompatibel).\n\n';
    
    doc += '---\n\n';
    
    // 1. KOSTENARTEN - SEHR DETAILLIERT
    doc += '# 1. KOSTENARTEN (Tax Categories & Cost Types)\n\n';
    
    doc += '## 1.1 KOSTENKATEGORIEN-TYPEN (CostCategory.category_type)\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| KOSTENARTEN-TYP | Erhaltungsaufwendungen | ERHALTUNG | Laufende Kosten | Invoice, GeneratedFinancialBooking | ✅ Ja - Sofort als Werbungskosten absetzbar (§9 Abs. 1 Nr. 7 EStG) | ✅ Ja (oft) | Nur bei bestehenden Gebäuden | Nein | tax_treatment=SOFORT | Reparatur Heizung (500€) - sofort absetzbar + umlagefähig |\n';
    doc += '| KOSTENARTEN-TYP | Herstellungskosten | HERSTELLUNG | Investitionen | Invoice, PurchaseContract | ✅ Ja - NUR über AfA absetzbar (§255 HGB) | ❌ Nein | Nur bei Sanierung/Anbau | Nein | tax_treatment=AFA | Dachsanierung (50.000€) - nur über 50 Jahre AfA |\n';
    doc += '| KOSTENARTEN-TYP | Betriebskosten | BETRIEB | Laufende NK | Supplier, GeneratedFinancialBooking | ⚠️ Teils - Umlegbare sind nicht absetzbar | ✅ Ja | Nur laufende Kosten | Ja | allocatable=true | Müllabfuhr (420€/Jahr) - umlagefähig, nicht absetzbar |\n';
    doc += '| KOSTENARTEN-TYP | Finanzierungskosten | FINANZIERUNG | Zinsen & Gebühren | Financing, GeneratedFinancialBooking | ✅ Ja - Schuldzinsen als Werbungskosten (Anlage V Zeile 37) | ❌ Nein | Nur bei Krediten | Nein | Nur Zinsen, nicht Tilgung | Kreditzinsen (12.000€/Jahr) - voll absetzbar |\n\n';
    
    doc += '## 1.2 STEUERLICHE BEHANDLUNG (CostCategory.tax_treatment)\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| STEUER-BEHANDLUNG | Sofort absetzbar | SOFORT | Werbungskosten | Alle Kostenarten | ✅ Im selben Jahr voll absetzbar | Variabel | category_type=ERHALTUNG oder BETRIEB | Ja (häufigster Fall) | Anlage V Zeilen 16-48 | Grundsteuer 1.200€ → Anlage V Zeile 33, sofort absetzbar |\n';
    doc += '| STEUER-BEHANDLUNG | AfA (Abschreibung) | AFA | Herstellungskosten | Nur bei Investitionen | ✅ Über 50 Jahre verteilt (2% p.a.) | ❌ Nie | category_type=HERSTELLUNG | Nein | AfASchedule Tabelle | Gebäudekauf 300.000€ → 6.000€/Jahr AfA über 50 Jahre |\n';
    doc += '| STEUER-BEHANDLUNG | Verteilt absetzbar | VERTEILT | Große Erhaltung | Selten (z.B. GWG) | ✅ Über 3-5 Jahre verteilt | ❌ Nein | Nur bei Beträgen > Grenzwert | Nein | - | Geringwertige Wirtschaftsgüter (Pool-Abschreibung) |\n';
    doc += '| STEUER-BEHANDLUNG | Nicht absetzbar | NICHT_ABSETZBAR | Private Kosten | Betriebskosten (umgelegt) | ❌ Nein - da auf Mieter umgelegt | ✅ Ja | allocatable=true | Nein | - | Müll 420€ - umgelegt, daher nicht absetzbar |\n\n';
    
    doc += '## 1.3 DETAILLIERTE KOSTENKATEGORIEN (aus BuildingTaxLibrary)\n\n';
    doc += '**Hinweis**: Diese werden beim Initialisieren der Steuer-Bibliothek als CostCategory-Entities erstellt.\n\n';
    
    doc += '### Gruppe A: SOFORT ABSETZBARE ERHALTUNGSKOSTEN\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| ERHALTUNG | Reparaturen & Instandhaltung | reparaturen_erhaltung | ERHALTUNG | Invoice | ✅ Anlage V Zeile 36 (Erhaltungsaufwand) | ❌ Nein | - | Nein | tax_treatment=SOFORT | Heizung repariert (850€), sofort absetzbar |\n';
    doc += '| ERHALTUNG | Schönheitsreparaturen | schoenheitsreparaturen | ERHALTUNG | Invoice | ✅ Anlage V Zeile 36 | ⚠️ Teils (wenn Mieter) | Wenn nicht auf Mieter übertragen | Nein | - | Wohnung streichen (1.200€), wenn Vermieter-Pflicht |\n';
    doc += '| ERHALTUNG | Wartung & Inspektion | wartung_inspektion | ERHALTUNG | Supplier, Invoice | ✅ Anlage V Zeile 36 | ✅ Ja | Regelmäßig | Nein | allocatable=true | Heizungswartung (180€/Jahr), umlagefähig + absetzbar |\n';
    doc += '| ERHALTUNG | Kleinreparaturen | kleinreparaturen | ERHALTUNG | Invoice | ✅ Anlage V Zeile 36 | ⚠️ Teils | Nur wenn nicht Mieter-Pflicht | Nein | Bis 100€ oft Mieter | Wasserhahn-Dichtung (45€), Vermieter zahlt |\n\n';
    
    doc += '### Gruppe B: BETRIEBSKOSTEN (UMLAGEFÄHIG nach BetrKV)\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| BETRIEBSKOSTEN | Grundsteuer | grundsteuer | BETRIEB | PropertyTax → GeneratedFinancialBooking | ✅ Anlage V Zeile 33 | ✅ Ja (§2 Nr. 1 BetrKV) | - | Nein | Verteilerschlüssel: qm | Grundsteuer 1.200€/Jahr, nach Fläche auf Mieter umlegen |\n';
    doc += '| BETRIEBSKOSTEN | Wasserversorgung | wasser | BETRIEB | Supplier | ❌ Wenn umgelegt nicht absetzbar | ✅ Ja (§2 Nr. 2 BetrKV) | - | Nein | Verteilerschlüssel: Verbrauch | Wasserkosten 800€, nach Zähler auf Mieter |\n';
    doc += '| BETRIEBSKOSTEN | Abwasserentsorgung | abwasser | BETRIEB | Supplier | ❌ Wenn umgelegt | ✅ Ja (§2 Nr. 3 BetrKV) | - | Nein | Verteilerschlüssel: Verbrauch oder qm | Abwasser 650€/Jahr |\n';
    doc += '| BETRIEBSKOSTEN | Heizung (Brennstoff) | heizung_brennstoff | BETRIEB | Supplier | ❌ Wenn umgelegt | ✅ Ja (§2 Nr. 4a BetrKV) | - | Nein | Verteilerschlüssel: Verbrauch (HeizkostenV) | Gas 4.500€, nach Heizkostenverordnung verteilen |\n';
    doc += '| BETRIEBSKOSTEN | Heizung (Wartung) | heizung_wartung | BETRIEB | Supplier, Invoice | ❌ Wenn umgelegt | ✅ Ja (§2 Nr. 4b BetrKV) | - | Nein | Verteilerschlüssel: Verbrauch | Heizungswartung 350€/Jahr |\n';
    doc += '| BETRIEBSKOSTEN | Aufzug (Strom) | aufzug_strom | BETRIEB | Supplier | ❌ Wenn umgelegt | ✅ Ja (§2 Nr. 5a BetrKV) | Nur wenn Aufzug vorhanden | Nein | Verteilerschlüssel: qm oder pauschal | Aufzugstrom 180€/Jahr |\n';
    doc += '| BETRIEBSKOSTEN | Aufzug (Wartung) | aufzug_wartung | BETRIEB | Supplier, Invoice | ❌ Wenn umgelegt | ✅ Ja (§2 Nr. 5b BetrKV) | Nur wenn Aufzug vorhanden | Nein | Verteilerschlüssel: qm oder pauschal | Aufzugwartung 800€/Jahr (Vollwartungsvertrag) |\n';
    doc += '| BETRIEBSKOSTEN | Straßenreinigung | strassenreinigung | BETRIEB | Supplier (Gemeinde) | ❌ Wenn umgelegt | ✅ Ja (§2 Nr. 6 BetrKV) | - | Nein | Verteilerschlüssel: qm | Straßenreinigung 240€/Jahr |\n';
    doc += '| BETRIEBSKOSTEN | Müllabfuhr | muellabfuhr | BETRIEB | Supplier | ❌ Wenn umgelegt | ✅ Ja (§2 Nr. 7 BetrKV) | - | Nein | Verteilerschlüssel: Personen oder Pauschal | Müll 420€/Jahr, nach Personenanzahl |\n';
    doc += '| BETRIEBSKOSTEN | Gebäudereinigung | gebaeudereinigung | BETRIEB | Supplier, Invoice | ❌ Wenn umgelegt | ✅ Ja (§2 Nr. 8 BetrKV) | Nur Gemeinschaftsflächen | Nein | Verteilerschlüssel: qm | Treppenhausreinigung 1.200€/Jahr |\n';
    doc += '| BETRIEBSKOSTEN | Gartenpflege | gartenpflege | BETRIEB | Supplier, Invoice | ❌ Wenn umgelegt | ✅ Ja (§2 Nr. 9 BetrKV) | Nur wenn Garten vorhanden | Nein | Verteilerschlüssel: qm | Gartenpflege 600€/Jahr |\n';
    doc += '| BETRIEBSKOSTEN | Beleuchtung (Gemeinschaft) | beleuchtung | BETRIEB | Supplier | ❌ Wenn umgelegt | ✅ Ja (§2 Nr. 10 BetrKV) | Nur Allgemeinflächen | Nein | Verteilerschlüssel: qm | Allgemeinstrom 280€/Jahr (Treppenhaus, Keller) |\n';
    doc += '| BETRIEBSKOSTEN | Schornsteinfeger | schornsteinfeger | BETRIEB | Invoice | ❌ Wenn umgelegt | ✅ Ja (§2 Nr. 11 BetrKV) | Nur bei Einzelöfen | Nein | Verteilerschlüssel: Pauschal pro Ofen | Kaminkehrer 120€/Jahr (Feuerstättenschau) |\n';
    doc += '| BETRIEBSKOSTEN | Versicherungen (Gebäude) | versicherung_gebaeude | BETRIEB | Insurance | ❌ Wenn umgelegt | ✅ Ja (§2 Nr. 12 BetrKV) | - | Nein | Verteilerschlüssel: qm | Wohngebäude-Versicherung 850€/Jahr |\n';
    doc += '| BETRIEBSKOSTEN | Hausmeister | hausmeister | BETRIEB | Supplier, Invoice | ❌ Wenn umgelegt | ✅ Ja (§2 Nr. 13 BetrKV) | - | Nein | Verteilerschlüssel: qm | Hausmeister-Pauschale 1.200€/Jahr |\n';
    doc += '| BETRIEBSKOSTEN | Hausverwaltung | hausverwaltung | BETRIEB | Invoice | ✅ Anlage V Zeile 39 | ❌ NEIN (§1 Abs. 2 Nr. 1 BetrKV) | - | Nein | Nicht umlegbar! | Verwaltungsgebühr 480€/Jahr - absetzbar, nicht umlegbar |\n';
    doc += '| BETRIEBSKOSTEN | Gemeinschafts-Antenne/Kabel | antenne_kabel | BETRIEB | Supplier | ❌ Wenn umgelegt | ✅ Ja (§2 Nr. 14 BetrKV) | Nur wenn vorhanden | Nein | Verteilerschlüssel: Pauschal pro Wohnung | Kabel-TV 180€/Jahr (15€/Monat) |\n';
    doc += '| BETRIEBSKOSTEN | Waschküche | waschkueche | BETRIEB | Supplier, Invoice | ❌ Wenn umgelegt | ✅ Ja (§2 Nr. 15 BetrKV) | Nur wenn vorhanden | Nein | Verteilerschlüssel: Pauschal oder Nutzung | Waschmaschinen-Wartung 200€/Jahr |\n';
    doc += '| BETRIEBSKOSTEN | Sonstige Betriebskosten | sonstige_betriebskosten | BETRIEB | Invoice | ⚠️ Prüfung erforderlich | ⚠️ Nur wenn in §2 BetrKV gelistet | - | Nein | - | Winterdienst 300€ (§2 Nr. 16 BetrKV: umlagefähig) |\n\n';
    
    doc += '### Gruppe C: NICHT UMLAGEFÄHIGE KOSTEN\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| VERWALTUNGSKOSTEN | Hausverwaltung | verwaltung | BETRIEB | Invoice | ✅ Anlage V Zeile 39 | ❌ NEIN (§1 BetrKV explizit ausgeschlossen) | - | Nein | Voll absetzbar | Verwaltungskosten 480€ (20€/Wohnung/Monat) - steuerlich absetzbar |\n';
    doc += '| VERWALTUNGSKOSTEN | Bankgebühren | bankgebuehren | FINANZIERUNG | Invoice | ✅ Anlage V Zeile 40 | ❌ Nein | - | Nein | - | Kontoführungsgebühren 120€/Jahr - absetzbar |\n';
    doc += '| VERWALTUNGSKOSTEN | Porto & Telefon | porto_telefon | BETRIEB | Invoice | ✅ Anlage V Zeile 41 | ❌ Nein | - | Nein | - | Briefporto 80€/Jahr - absetzbar |\n';
    doc += '| VERWALTUNGSKOSTEN | Rechtsberatung | rechtsberatung | BETRIEB | Invoice | ✅ Anlage V Zeile 42 | ❌ Nein | - | Nein | - | Anwalt Mietrecht 650€ - absetzbar |\n';
    doc += '| VERWALTUNGSKOSTEN | Fahrtkosten | fahrtkosten | BETRIEB | Invoice | ✅ Anlage V Zeile 43 (0,30€/km) | ❌ Nein | - | Nein | - | Fahrten zum Objekt 200km × 0,30€ = 60€ |\n';
    doc += '| VERWALTUNGSKOSTEN | Büromaterial | bueromaterial | BETRIEB | Invoice | ✅ Anlage V Zeile 44 | ❌ Nein | - | Nein | - | Ordner, Formulare 45€/Jahr |\n\n';
    
    doc += '### Gruppe D: VERSICHERUNGEN (DETAILLIERT)\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| VERSICHERUNG | Wohngebäudeversicherung | versicherung_wohngebaeude | BETRIEB | Insurance | ❌ Wenn umgelegt (sonst Anlage V Zeile 34) | ✅ Ja (§2 Nr. 12 BetrKV) | building_type=Wohnung | Nein | allocatable=true | Gebäudeversicherung 850€/Jahr, umlagefähig |\n';
    doc += '| VERSICHERUNG | Haftpflichtversicherung (Haus & Grund) | versicherung_haftpflicht | BETRIEB | Insurance | ❌ Wenn umgelegt | ✅ Ja (§2 Nr. 12 BetrKV) | - | Nein | allocatable=true | Haftpflicht 320€/Jahr |\n';
    doc += '| VERSICHERUNG | Glasversicherung | versicherung_glas | BETRIEB | Insurance | ❌ Wenn umgelegt | ✅ Ja (§2 Nr. 12 BetrKV) | Nur wenn abgeschlossen | Nein | allocatable=true | Glasbruch-Versicherung 180€/Jahr |\n';
    doc += '| VERSICHERUNG | Elementarversicherung | versicherung_elementar | BETRIEB | Insurance | ❌ Wenn umgelegt | ✅ Ja (§2 Nr. 12 BetrKV) | Nur wenn abgeschlossen | Nein | allocatable=true | Hochwasser/Sturm 420€/Jahr |\n';
    doc += '| VERSICHERUNG | Mietausfallversicherung | versicherung_mietausfall | BETRIEB | Insurance | ✅ Anlage V Zeile 34 (wenn NICHT umgelegt) | ❌ Nein (nicht in BetrKV) | - | Nein | Nicht umlagefähig! | Mietausfallschutz 250€ - nur Vermieter absetzbar |\n';
    doc += '| VERSICHERUNG | Rechtsschutzversicherung | versicherung_rechtsschutz | BETRIEB | Insurance | ✅ Anlage V Zeile 34 | ❌ Nein (nicht in BetrKV) | - | Nein | Nicht umlagefähig! | Rechtsschutz 180€/Jahr - nur Vermieter |\n\n';
    
    doc += '### Gruppe E: FINANZIERUNGSKOSTEN\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| FINANZIERUNG | Kreditzinsen | kreditzinsen | FINANZIERUNG | Financing | ✅ Anlage V Zeile 37 (Schuldzinsen) | ❌ Nein | - | Nein | Nur Zinsen, nicht Tilgung! | Darlehenszinsen 12.000€/Jahr, voll absetzbar |\n';
    doc += '| FINANZIERUNG | Disagio | disagio | FINANZIERUNG | Financing | ✅ Verteilt über Laufzeit | ❌ Nein | Nur bei Kredit mit Disagio | Nein | tax_treatment=VERTEILT | 5% Disagio bei 200.000€ = 10.000€ → verteilt über 10 Jahre |\n';
    doc += '| FINANZIERUNG | Bereitstellungszinsen | bereitstellungszinsen | FINANZIERUNG | Financing, Invoice | ✅ Anlage V Zeile 37 | ❌ Nein | Nur während Bauphase | Nein | - | Zinsen während Bau 2.400€ - absetzbar |\n';
    doc += '| FINANZIERUNG | Damnum | damnum | FINANZIERUNG | Financing | ✅ Verteilt | ❌ Nein | Bei Kredit mit Damnum | Nein | - | Ähnlich Disagio |\n\n';
    
    doc += '### Gruppe F: HERSTELLUNGSKOSTEN (NUR AfA)\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| HERSTELLUNG | Sanierung (komplett) | sanierung | HERSTELLUNG | Invoice | ✅ NUR AfA (50 Jahre) | ❌ Nein | - | Nein | tax_treatment=AFA, 15%-Regel! | Vollsanierung 80.000€ → 1.600€/Jahr AfA |\n';
    doc += '| HERSTELLUNG | Anbau/Ausbau | anbau_ausbau | HERSTELLUNG | Invoice | ✅ NUR AfA | ❌ Nein | - | Nein | tax_treatment=AFA | Dachausbau 60.000€ → 1.200€/Jahr AfA |\n';
    doc += '| HERSTELLUNG | Modernisierung (wesentlich) | modernisierung | HERSTELLUNG | Invoice | ✅ NUR AfA | ❌ Nein | Nur bei > 15% Gebäudewert in 3 Jahren | Nein | 15%-Regel-Prüfung! | Neues Bad + Heizung 25.000€, wenn > 15% → AfA |\n';
    doc += '| HERSTELLUNG | Anschaffungsnebenkosten | anschaffungsnebenkosten | HERSTELLUNG | PurchaseContract | ✅ AfA über 50 Jahre | ❌ Nein | Nur beim Kauf | Nein | Separate AfA-Position | Notar 8.000€ + Makler 15.000€ → 460€/Jahr AfA |\n';
    doc += '| HERSTELLUNG | Grunderwerbsteuer | grunderwerbsteuer | HERSTELLUNG | PurchaseContract | ✅ AfA über 50 Jahre | ❌ Nein | Nur beim Kauf | Nein | Teil der Anschaffungskosten | 6% von 450.000€ = 27.000€ → 540€/Jahr AfA |\n\n';
    
    doc += '**WICHTIG: 15%-Regel**\n';
    doc += '```javascript\n';
    doc += '// Automatische Prüfung bei Rechnungserfassung\n';
    doc += 'function check15PercentRule(building, last_3_years_invoices) {\n';
    doc += '  const erhaltung_sum = sum(last_3_years_invoices WHERE tax_treatment="SOFORT");\n';
    doc += '  const gebaeude_wert = building.purchase_price - building.land_value;\n';
    doc += '  const threshold = gebaeude_wert * 0.15;\n';
    doc += '  \n';
    doc += '  if (erhaltung_sum > threshold) {\n';
    doc += '    return {\n';
    doc += '      warning: true,\n';
    doc += '      message: `⚠️ 15%-Grenze überschritten!\n';
    doc += '        Erhaltung letzte 3 Jahre: ${erhaltung_sum}€\n';
    doc += '        Grenzwert (15% von ${gebaeude_wert}€): ${threshold}€\n';
    doc += '        Überschreitung: ${erhaltung_sum - threshold}€\n';
    doc += '        \n';
    doc += '        → Diese Kosten müssen als HERSTELLUNG (AfA) behandelt werden!`,\n';
    doc += '      suggested_action: "Rechnungen umbuchen von ERHALTUNG zu HERSTELLUNG"\n';
    doc += '    };\n';
    doc += '  }\n';
    doc += '  return { warning: false };\n';
    doc += '}\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
    doc += '## 1.4 VERTEILERSCHLÜSSEL (für Betriebskosten-Umlage)\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| VERTEILERSCHLÜSSEL | Nach Wohnfläche | flaeche | Flächenschlüssel | OperatingCostStatementItem | N/A | - | Unit.flaeche muss gesetzt sein | ✅ Ja (Standard) | WoFlV (Wohnflächenverordnung) | Grundsteuer 1.200€: Whg. 65m² / 354m² = 18,5% = 222€ |\n';
    doc += '| VERTEILERSCHLÜSSEL | Nach Personenanzahl | personen | Personenschlüssel | OperatingCostStatementItem | N/A | - | LeaseContract.number_of_persons gesetzt | Nein | Für Müll, Wasser | Müll 420€: 2 Personen / 11 gesamt = 18,2% = 76,44€ |\n';
    doc += '| VERTEILERSCHLÜSSEL | Nach Verbrauch (Zähler) | verbrauch | Verbrauchsschlüssel | OperatingCostStatementItem, Meter | N/A | - | Meter müssen vorhanden sein | Nein | HeizkostenV §6-10 | Wasser: Verbrauch 45m³ / 250m³ gesamt = 18% |\n';
    doc += '| VERTEILERSCHLÜSSEL | Pauschal (gleich) | pauschal | Pauschalschlüssel | OperatingCostStatementItem | N/A | - | - | Nein | Bei gleichen Wohnungen | Hausmeister 1.200€ / 6 Wohnungen = 200€ pro Wohnung |\n';
    doc += '| VERTEILERSCHLÜSSEL | Nach Einheiten | einheiten | Einheiten-Schlüssel | OperatingCostStatementItem | N/A | - | - | Nein | Wie Pauschal | Mülltonnen: 1 pro Wohnung → pauschal |\n';
    doc += '| VERTEILERSCHLÜSSEL | Nach Wohneinheiten (gewichtet) | wohneinheiten_gewichtet | Gewichteter Schlüssel | OperatingCostStatementItem | N/A | - | Gewichtungsfaktoren definieren | Nein | Bei unterschiedlichen Wohnungsgrößen | 1-Zimmer=0,5 / 2-Zimmer=0,75 / 3-Zimmer=1,0 |\n';
    doc += '| VERTEILERSCHLÜSSEL | Gemischt (70% Fläche + 30% Personen) | gemischt | Kombinations-Schlüssel | OperatingCostStatementItem | N/A | - | Beide Daten vorhanden | Nein | Für Wasser oft verwendet | Wasser: 70% nach qm, 30% nach Personen |\n';
    doc += '| VERTEILERSCHLÜSSEL | Nicht umlegbar | nicht_umlegbar | - | - | ✅ Voll absetzbar | ❌ Nein | - | Nein | Hausverwaltung, Bankgebühren | Verwaltung 480€ - nicht umlegen, sondern voll absetzen |\n\n';
    
    doc += '**Berechnungslogik Verteilerschlüssel**:\n';
    doc += '```javascript\n';
    doc += '// 1. FLÄCHE\n';
    doc += 'anteil_unit = unit.flaeche / sum(all_units.flaeche)\n';
    doc += 'kosten_unit = gesamtkosten * anteil_unit\n';
    doc += '// Beispiel: 65,5m² / 354m² = 0,185 → 18,5%\n';
    doc += '\n';
    doc += '// 2. PERSONEN\n';
    doc += 'anteil_unit = contract.number_of_persons / sum(all_contracts.number_of_persons)\n';
    doc += 'kosten_unit = gesamtkosten * anteil_unit\n';
    doc += '// Beispiel: 2 Personen / 11 gesamt = 0,182 → 18,2%\n';
    doc += '\n';
    doc += '// 3. VERBRAUCH (Zähler)\n';
    doc += 'verbrauch_unit = zaehlerstand_ende - zaehlerstand_anfang\n';
    doc += 'anteil_unit = verbrauch_unit / sum(all_units.verbrauch)\n';
    doc += 'kosten_unit = gesamtkosten * anteil_unit\n';
    doc += '// Beispiel Wasser: 45m³ / 250m³ = 0,18 → 18%\n';
    doc += '// Beispiel Heizung: 850 kWh / 4.200 kWh = 0,202 → 20,2%\n';
    doc += '\n';
    doc += '// 4. PAUSCHAL\n';
    doc += 'kosten_unit = gesamtkosten / anzahl_wohnungen\n';
    doc += '// Beispiel: 1.200€ / 6 Wohnungen = 200€\n';
    doc += '\n';
    doc += '// 5. GEMISCHT (Kombination)\n';
    doc += 'anteil_flaeche = unit.flaeche / gesamt_flaeche\n';
    doc += 'anteil_personen = contract.persons / gesamt_personen\n';
    doc += 'anteil_unit = (anteil_flaeche * 0.7) + (anteil_personen * 0.3)\n';
    doc += 'kosten_unit = gesamtkosten * anteil_unit\n';
    doc += '// Beispiel Wasser-Abwasser (üblich: 70/30)\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
    // ALLE KONSTANTEN-GRUPPEN DOKUMENTIEREN
    doc += '# 2. OBJEKTTYPEN (Building Types)\n\n';
    
    doc += '## 2.1 HAUPT-OBJEKTTYPEN\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| OBJEKTTYP | Einfamilienhaus | einfamilienhaus | Wohnimmobilie | Building.building_type | ✅ AfA 2% (50 Jahre) | N/A | - | Nein | Keine NK-Umlage (Eigentümer bewohnt) | EFH, selbst bewohnt oder vermietet, 150m² |\n';
    doc += '| OBJEKTTYP | Zweifamilienhaus | zweifamilienhaus | Wohnimmobilie | Building.building_type | ✅ AfA 2% | ✅ Anteilig | - | Nein | 2 Units, oft 1 selbst bewohnt | ZFH, EG vermietet, OG selbst genutzt |\n';
    doc += '| OBJEKTTYP | Mehrfamilienhaus | mehrfamilienhaus | Wohnimmobilie | Building.building_type | ✅ AfA 2% | ✅ Ja | Min. 3 Wohneinheiten | ✅ Ja | Standard-Fall für Betriebskosten | MFH mit 6 Wohnungen, voll vermietet |\n';
    doc += '| OBJEKTTYP | Reihenhaus | reihenhaus | Wohnimmobilie | Building.building_type | ✅ AfA 2% | N/A | - | Nein | Meist Eigentümer-bewohnt | Reihenhaus in Siedlung |\n';
    doc += '| OBJEKTTYP | Eigentumswohnung | eigentumswohnung | Wohnimmobilie | Building.building_type | ✅ AfA 2% | ⚠️ Teils (WEG-Umlage) | Nur einzelne Wohnung | Nein | Sonderfall: WEG-Verwaltung | ETW 85m², in 20-Parteien-Haus |\n';
    doc += '| OBJEKTTYP | Gewerbeimmobilie (Büro) | gewerbe_buero | Gewerbe | Building.building_type | ✅ AfA 3% (33 Jahre) | N/A (Gewerbemiete) | - | Nein | Andere Kündigungsfristen | Bürogebäude, 4 Etagen |\n';
    doc += '| OBJEKTTYP | Gewerbeimmobilie (Laden) | gewerbe_laden | Gewerbe | Building.building_type | ✅ AfA 3% | N/A | - | Nein | Keine Mietpreisbremse | Ladenlokal Erdgeschoss |\n';
    doc += '| OBJEKTTYP | Gewerbeimmobilie (Lager) | gewerbe_lager | Gewerbe | Building.building_type | ✅ AfA 3% | N/A | - | Nein | Oft längere Kündigungsfristen | Lagerhalle 800m² |\n';
    doc += '| OBJEKTTYP | Gemischt (Wohnen + Gewerbe) | gemischt | Mischnutzung | Building.building_type | ✅ Getrennte AfA (2% + 3%) | ⚠️ Anteilig | Flächenaufteilung erforderlich | Nein | Komplexe Berechnung | EG Laden (100m²), OG+DG Wohnungen (200m²) |\n';
    doc += '| OBJEKTTYP | Ferienimmobilie | ferienwohnung | Sonderform | Building.building_type | ⚠️ Liebhaberei-Prüfung! | N/A | Nur bei < 75% Vermietung | Nein | Eigene Nutzung problematisch | Ferienwohnung Ostsee, 8 Wochen selbst genutzt |\n';
    doc += '| OBJEKTTYP | Grundstück (unbebaut) | grundstueck | Boden | Building.building_type | ❌ Keine AfA (Boden nicht abschreibbar) | N/A | - | Nein | Nur Grundsteuer absetzbar | Baugrundstück 500m², wartet auf Bebauung |\n';
    doc += '| OBJEKTTYP | Denkmalgeschützt | denkmal | Wohnimmobilie | Building.building_type | ✅✅ Sonder-AfA möglich (§7i EStG) | ✅ Ja | Denkmalschutz-Bescheinigung | Nein | Erhöhte AfA 9% über 8 Jahre | Altbau unter Denkmalschutz, Sanierung gefördert |\n\n';
    
    doc += '**Steuerliche Besonderheiten pro Objekttyp**:\n';
    doc += '```\n';
    doc += 'WOHNIMMOBILIE:\n';
    doc += '  - AfA: 2% linear (§7 Abs. 4 Nr. 2a EStG)\n';
    doc += '  - Nutzungsdauer: 50 Jahre\n';
    doc += '  - Mietpreisbremse: Ja (in Ballungsgebieten)\n';
    doc += '  - Betriebskosten: Umlegbar nach BetrKV\n';
    doc += '\n';
    doc += 'GEWERBEIMMOBILIE:\n';
    doc += '  - AfA: 3% linear (§7 Abs. 4 Nr. 1 EStG)\n';
    doc += '  - Nutzungsdauer: 33 Jahre\n';
    doc += '  - Mietpreisbremse: Nein\n';
    doc += '  - Betriebskosten: Verhandelbar (kein BetrKV)\n';
    doc += '\n';
    doc += 'GEMISCHT:\n';
    doc += '  - AfA: Anteilig (Wohnanteil 2%, Gewerbeanteil 3%)\n';
    doc += '  - Flächenaufteilung erforderlich!\n';
    doc += '  - Beispiel: 200m² Wohnen (2%) + 100m² Gewerbe (3%)\n';
    doc += '    → Wohnen-AfA: (200/300) × Gebäudewert × 2%\n';
    doc += '    → Gewerbe-AfA: (100/300) × Gebäudewert × 3%\n';
    doc += '\n';
    doc += 'DENKMAL:\n';
    doc += '  - Sonder-AfA: 9% über 8 Jahre (statt 2% über 50 Jahre)\n';
    doc += '  - NUR für Modernisierungskosten (nicht Kaufpreis)\n';
    doc += '  - Bescheinigung der Denkmalbehörde erforderlich\n';
    doc += '  - Nach 8 Jahren: Restbuchwert mit 2% weiter abschreiben\n';
    doc += '\n';
    doc += 'FERIENIMMOBILIE:\n';
    doc += '  - Liebhaberei-Prüfung bei Eigennutzung > 25% (nicht steuerlich anerkannt!)\n';
    doc += '  - Nur absetzbar wenn Gewinnerzielungsabsicht\n';
    doc += '  - Kosten nur anteilig (Fremdvermietungs-Quote)\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
    doc += '# 3. EIGENTÜMERSTRUKTUREN & RECHTSFORMEN\n\n';
    
    doc += '## 3.1 RECHTSFORMEN (Owner.type & applicable_for_legal_form)\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| RECHTSFORM | Privatperson (Alleineigentum) | PRIVATPERSON | Natürliche Person | Owner.type, BuildingTaxLibrary | ✅ Anlage V + EÜR | N/A | - | ✅ Ja | Einkommensteuer | Max Mustermann besitzt MFH alleine, Anlage V zur ESt |\n';
    doc += '| RECHTSFORM | Privatpersonen (Bruchteilsgemeinschaft) | PRIVATPERSON | Natürliche Person (mehrere) | OwnerRelationship.share_percentage | ✅ Jeder seine Anlage V (anteilig) | N/A | Min. 2 Eigentümer | Nein | Keine Gesellschaft! | Max 50% + Erika 50%, jeder reicht eigene Anlage V ein |\n';
    doc += '| RECHTSFORM | GbR (Gesellschaft bürgerlichen Rechts) | GBR | Personengesellschaft | Owner.type, Shareholder | ✅ Transparenzprinzip (Gesellschafter versteuern anteilig) | N/A | Min. 2 Gesellschafter | Nein | Gesellschaftsvertrag, Feststellungserklärung | Max & Erika GbR, je 50%, gemeinsame Anlage V dann anteilig |\n';
    doc += '| RECHTSFORM | GmbH | GMBH | Kapitalgesellschaft | Owner.type | ✅✅ Körperschaftsteuer + Gewerbesteuer | N/A | Handelsregister | Nein | Bilanzpflicht, keine Anlage V! | Mustermann Immobilien GmbH, Bilanz statt EÜR |\n';
    doc += '| RECHTSFORM | GmbH & Co. KG | GMBH_CO_KG | Mischform | Owner.type | ✅✅ Komplex (transparent + Körperschaft) | N/A | GmbH als Komplementär | Nein | Steuerberater empfohlen | Immobilien GmbH & Co. KG (steueroptimiert) |\n';
    doc += '| RECHTSFORM | KG (Kommanditgesellschaft) | KG | Personengesellschaft | Owner.type | ✅ Wie GbR (transparent) | N/A | Min. 1 Komplementär + 1 Kommanditist | Nein | Handelsregister | Selten bei Immobilien |\n';
    doc += '| RECHTSFORM | AG (Aktiengesellschaft) | AG | Kapitalgesellschaft | Owner.type | ✅✅ Körperschaftsteuer | N/A | Handelsregister, Vorstand | Nein | Sehr selten bei Wohnimmobilien | Große Immobilien-AG (ab 10+ Objekte) |\n';
    doc += '| RECHTSFORM | ALLE (Filter: für alle gültig) | ALLE | Filter-Option | CostCategory.applicable_for_legal_form | N/A | N/A | - | ✅ Ja | Meiste Kosten gelten für alle | Grundsteuer gilt für alle Rechtsformen |\n\n';
    
    doc += '**Steuerliche Implikationen**:\n';
    doc += '```\n';
    doc += 'PRIVATPERSON:\n';
    doc += '  - Einkommensteuer (ESt) auf Mieteinnahmen\n';
    doc += '  - Anlage V (Vermietung & Verpachtung)\n';
    doc += '  - EÜR (Einnahmen-Überschuss-Rechnung)\n';
    doc += '  - Progressiver Steuersatz (14%-45%)\n';
    doc += '  - Beispiel: 20.000€ Überschuss → ~6.000€ Steuer (bei 30% Grenzsteuersatz)\n';
    doc += '\n';
    doc += 'GBR:\n';
    doc += '  - Transparenzprinzip (Gesellschaft selbst zahlt KEINE Steuer)\n';
    doc += '  - Gesellschafter versteuern ihren Anteil privat\n';
    doc += '  - Feststellungserklärung erforderlich (§180 AO)\n';
    doc += '  - Jeder Gesellschafter: Anlage V (anteilig)\n';
    doc += '  - Beispiel: GbR 40.000€ Gewinn, 2 Gesellschafter je 50%\n';
    doc += '    → Jeder versteuert 20.000€ in seiner privaten ESt\n';
    doc += '\n';
    doc += 'GMBH:\n';
    doc += '  - Körperschaftsteuer (KSt) 15% + Soli 5,5% = 15,825%\n';
    doc += '  - Gewerbesteuer (GewSt) ~14% (abhängig von Hebesatz)\n';
    doc += '  - Gesamt: ~30% Steuerlast\n';
    doc += '  - KEINE Anlage V (sondern Bilanz + GuV)\n';
    doc += '  - Erweiterte Kürzung §9 Nr. 1 GewStG bei reiner Vermietung\n';
    doc += '  - Beispiel: 100.000€ Gewinn\n';
    doc += '    → KSt: 15.825€\n';
    doc += '    → GewSt: ~14.000€ (mit Kürzung oft 0€!)\n';
    doc += '    → Bei Ausschüttung: Kapitalertragsteuer 25% (Gesellschafter)\n';
    doc += '\n';
    doc += 'BRUCHTEILSGEMEINSCHAFT:\n';
    doc += '  - KEINE Gesellschaft (nur gemeinschaftliches Eigentum)\n';
    doc += '  - Jeder Eigentümer versteuert seinen Anteil separat\n';
    doc += '  - Keine gemeinsame Steuererklärung\n';
    doc += '  - Jeder: Eigene Anlage V (anteilig)\n';
    doc += '  - Beispiel: Max 60% + Erika 40%\n';
    doc += '    → Max reicht Anlage V für 60% der Einnahmen/Kosten ein\n';
    doc += '    → Erika reicht Anlage V für 40% ein\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
    doc += '# 4. NUTZUNGSARTEN (Usage Types)\n\n';
    
    doc += '## 4.1 NUTZUNGSARTEN (applicable_for_usage in CostCategory)\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| NUTZUNG | Wohnung | WOHNUNG | Wohnzwecke | CostCategory.applicable_for_usage | ✅ AfA 2% | ✅ BetrKV gilt | building_type=Wohnimmobilie | ✅ Ja | BetrKV, Mietpreisbremse | Normale Mietwohnung für Wohnzwecke |\n';
    doc += '| NUTZUNG | Gewerbe | GEWERBE | Gewerbliche Nutzung | CostCategory.applicable_for_usage | ✅ AfA 3% | ❌ BetrKV gilt nicht | building_type=Gewerbe | Nein | Gewerbemiete, andere Regeln | Büro, Laden, Praxis |\n';
    doc += '| NUTZUNG | Gemischt | GEMISCHT | Wohnen + Gewerbe | CostCategory.applicable_for_usage | ✅ Anteilig | ⚠️ Anteilig | Flächenaufteilung bekannt | Nein | Komplexe Berechnung | EG Laden, OG Wohnungen |\n';
    doc += '| NUTZUNG | Alle (Filter) | ALLE | Filter-Option | CostCategory.applicable_for_usage | N/A | N/A | - | ✅ Ja | Meiste Kosten für alle | Grundsteuer gilt für Wohnung + Gewerbe |\n\n';
    
    doc += '---\n\n';
    
    doc += '# 5. DOKUMENTTYPEN & STATUS\n\n';
    
    doc += '## 5.1 DOKUMENT-STATUS (Document.status)\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| DOKUMENT-STATUS | Zu erledigen | zu_erledigen | Offen | Document.status, Task-Trigger | N/A | N/A | - | ✅ Ja (Initial) | Task kann erstellt werden | Mieterhöhung geplant, aber noch nicht geschrieben |\n';
    doc += '| DOKUMENT-STATUS | Erinnern | erinnern | Reminder | Document.status | N/A | N/A | reminder_date gesetzt | Nein | Notification bei Fälligke it | Dokument für später vorgemerkt (z.B. Kündigung in 3 Monaten) |\n';
    doc += '| DOKUMENT-STATUS | Erstellt | erstellt | Fertig | Document.status | N/A | N/A | pdf_url vorhanden | Nein | Kann versendet werden | PDF generiert, bereit zum Versand |\n';
    doc += '| DOKUMENT-STATUS | Geändert | geaendert | Modifiziert | Document.status | N/A | N/A | change_history.length > 0 | Nein | Versions-Tracking | Mietvertrag nach Erstellung angepasst (Tippfehler) |\n';
    doc += '| DOKUMENT-STATUS | Versendet | versendet | Unterwegs | Document.status | N/A | N/A | versandt_am gesetzt | Nein | LetterShipment verknüpft | Per Post versendet, noch nicht zugestellt |\n';
    doc += '| DOKUMENT-STATUS | Unterschrieben | unterschrieben | Rechtskräftig | Document.status | ✅ Ja (rechtlich bindend) | N/A | signed_date gesetzt | Nein | Rechtlich wirksam | Mietvertrag von beiden Parteien unterschrieben |\n';
    doc += '| DOKUMENT-STATUS | Gescannt | gescannt | Archiviert | Document.status | ✅ Aufbewahrungspflicht erfüllt | N/A | DocumentOriginal verknüpft | Nein | Original-Dokument hochgeladen | Original-Rechnung gescannt und digital archiviert |\n\n';
    
    doc += '**Status-Übergänge (Workflow)**:\n';
    doc += '```\n';
    doc += 'TYPISCHER WORKFLOW (Mieterhöhung):\n';
    doc += '  zu_erledigen → erstellt → versendet → unterschrieben → gescannt\n';
    doc += '     (geplant)   (PDF fertig) (Post)    (Mieter hat    (Original\n';
    doc += '                                         zugestimmt)     archiviert)\n';
    doc += '\n';
    doc += 'ABKÜRZUNG (wenn nur intern):\n';
    doc += '  zu_erledigen → erstellt → gescannt\n';
    doc += '     (Planung)   (generiert) (fertig archiviert)\n';
    doc += '\n';
    doc += 'REMINDER-WORKFLOW:\n';
    doc += '  zu_erledigen → erinnern → (nach Frist) → zu_erledigen → erstellt ...\n';
    doc += '```\n\n';
    
    doc += '## 5.2 DOKUMENTKATEGORIEN (Document.category, Template.category)\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| DOK-KATEGORIE | Mietrecht | Mietrecht | Rechtsdokumente | Document, Template | ⚠️ Teils (Anwaltskosten absetzbar) | N/A | - | Nein | Templates: Mietvertrag, Kündigung, Erhöhung | Mietvertrag, Mieterhöhung, Kündigung, Abmahnung |\n';
    doc += '| DOK-KATEGORIE | Verwaltung | Verwaltung | Verwaltungsdokumente | Document, Template | ✅ Verwaltungskosten absetzbar | N/A | - | ✅ Ja | Templates: NK-Abrechnung, Protokolle | Betriebskostenabrechnung, Eigentümerversammlung-Protokoll |\n';
    doc += '| DOK-KATEGORIE | Finanzen | Finanzen | Finanzielle Dokumente | Document, Template | ✅ Ja (Belege, Rechnungen) | N/A | - | Nein | Aufbewahrung 10 Jahre! | Rechnungen, Zahlungsbestätigungen, Kontoauszüge |\n';
    doc += '| DOK-KATEGORIE | Übergabeprotokolle | Übergabeprotokolle | Beweisdokumente | Document, Template | ⚠️ Beweismittel bei Streit | N/A | - | Nein | Bei Ein-/Auszug | Wohnungsübergabe-Protokoll mit Fotos, Zählerständen |\n';
    doc += '| DOK-KATEGORIE | Sonstiges | Sonstiges | Diverses | Document, Template | N/A | N/A | - | Nein | Catch-all | Korrespondenz, Notizen, sonstige Schreiben |\n\n';
    
    doc += '**Aufbewahrungsfristen (rechtlich)**:\n';
    doc += '```\n';
    doc += 'MIETRECHT-DOKUMENTE:\n';
    doc += '  - Mietverträge: Bis 3 Jahre nach Mietende (§195 BGB Verjährung)\n';
    doc += '  - Kündigungen: Bis 3 Jahre nach Auszug\n';
    doc += '  - Nebenkostenabrechnungen: Bis 3 Jahre nach Abrechnungsjahr (Widerspruchsfrist)\n';
    doc += '  - Kaution-Dokumente: Bis Rückzahlung + 3 Jahre\n';
    doc += '\n';
    doc += 'FINANZ-DOKUMENTE:\n';
    doc += '  - Rechnungen: 10 Jahre (§147 AO - Steuerrecht)\n';
    doc += '  - Kontoauszüge: 10 Jahre\n';
    doc += '  - Kaufverträge: PERMANENT (Grundbuch-Relevanz)\n';
    doc += '  - Grundsteuerbescheide: Bis neue Bescheide kommen + 10 Jahre\n';
    doc += '\n';
    doc += 'VERWALTUNG:\n';
    doc += '  - Eigentümerversammlungs-Protokolle: 30 Jahre (WEG)\n';
    doc += '  - Betriebskostenabrechnungen: 3 Jahre (Widerspruch) + 10 Jahre (Steuer)\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
    doc += '# 6. VERTRAGSTYPEN & STATUS\n\n';
    
    doc += '## 6.1 MIETVERTRAG-STATUS (LeaseContract.status)\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| VERTRAG-STATUS | Aktiv | active | Laufend | LeaseContract.status | ✅ Mieteinnahmen in Anlage V | N/A | - | ✅ Ja (bei CREATE) | Payment-Generierung aktiv | Vertrag läuft regulär, Mieter wohnt, Miete wird gezahlt |\n';
    doc += '| VERTRAG-STATUS | Gekündigt | terminated | Auslaufend | LeaseContract.status | ✅ Weiter Einnahmen bis end_date | N/A | termination_date gesetzt | Nein | Payment-Generierung bis end_date | Kündigung eingegangen, läuft noch 3 Monate (Kündigungsfrist) |\n';
    doc += '| VERTRAG-STATUS | Abgelaufen | expired | Beendet | LeaseContract.status | ⚠️ Nur wenn Kaution noch nicht zurück | N/A | end_date in Vergangenheit | Nein | Keine neuen Payments | Mieter ausgezogen, Vertrag beendet, ggf. Kaution offen |\n\n';
    doc += '**Status-Übergänge**:\n';
    doc += '```\n';
    doc += 'active → terminated (Kündigung)\n';
    doc += 'terminated → expired (Kündigungsfrist abgelaufen)\n';
    doc += '\n';
    doc += 'NICHT möglich:\n';
    doc += '  expired → active (Ein beendeter Vertrag kann nicht reaktiviert werden)\n';
    doc += '  terminated → active (Kündigung kann nicht zurückgezogen werden)\n';
    doc += '```\n\n';
    
    doc += '## 6.2 ZAHLUNGSRHYTHMEN (Supplier.payment_rhythm, Insurance.payment_rhythm)\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| ZAHLUNGS-RHYTHMUS | Monatlich | Monatlich | 12x/Jahr | Supplier, Insurance | N/A | N/A | - | ✅ Ja | 12 Buchungen/Jahr | Strom-Abschlag 80€/Monat = 960€/Jahr |\n';
    doc += '| ZAHLUNGS-RHYTHMUS | Vierteljährlich | Vierteljährlich | 4x/Jahr | Supplier, Insurance | N/A | N/A | - | Nein | 4 Buchungen (Q1-Q4) | Grundsteuer 1.200€ → 4× 300€ (Feb, Mai, Aug, Nov) |\n';
    doc += '| ZAHLUNGS-RHYTHMUS | Halbjährlich | Halbjährlich | 2x/Jahr | Supplier, Insurance | N/A | N/A | - | Nein | 2 Buchungen | Versicherung 600€ → 2× 300€ (Jan, Jul) |\n';
    doc += '| ZAHLUNGS-RHYTHMUS | Jährlich | Jährlich | 1x/Jahr | Supplier, Insurance | N/A | N/A | - | Nein | 1 Buchung | Versicherung 850€, einmal jährlich (März) |\n\n';
    
    doc += '## 6.3 VERSANDARTEN (Document.versandart, LetterShipment.shipping_type)\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| VERSANDART | Normal | normal | Standard-Brief | Document, LetterShipment | N/A | N/A | - | ✅ Ja | Kosten: ~1,00€ | Betriebskosten-Abrechnung (kein Zustellnachweis nötig) |\n';
    doc += '| VERSANDART | Einschreiben Einwurf (R1) | r1 | Zustellnachweis | Document, LetterShipment | N/A | N/A | - | Nein | Kosten: +3,69€, Tracking-Code | Mieterhöhung (Nachweis wichtig, aber Unterschrift nicht) |\n';
    doc += '| VERSANDART | Einschreiben (R2) | r2 | Persönliche Zustellung | Document, LetterShipment | N/A | N/A | Rechtlich bindende Dokumente | Nein | Kosten: +4,05€, Unterschrift | Kündigung (persönliche Zustellung + Unterschrift erforderlich) |\n\n';
    
    doc += '**Wann welche Versandart?**\n';
    doc += '```\n';
    doc += 'NORMAL (Standard):\n';
    doc += '  - Betriebskostenabrechnungen\n';
    doc += '  - Informationsschreiben\n';
    doc += '  - Zahlungsbestätigungen\n';
    doc += '  - Einladungen\n';
    doc += '\n';
    doc += 'R1 (Einschreiben Einwurf):\n';
    doc += '  - Mieterhöhungen (Zugang-Nachweis wichtig)\n';
    doc += '  - Mängelanzeigen\n';
    doc += '  - Zahlungserinnerungen (bei Verzug)\n';
    doc += '  - Eigenbedarfskündigung (weniger streng)\n';
    doc += '\n';
    doc += 'R2 (Einschreiben mit Unterschrift):\n';
    doc += '  - Kündigungen (persönliche Zustellung §568 Abs. 1 BGB)\n';
    doc += '  - Außerordentliche Kündigungen\n';
    doc += '  - Fristlose Kündigungen\n';
    doc += '  - Mietaufhebungsvereinbarungen\n';
    doc += '  - Wichtig: NICHT für Mieterhöhung erforderlich (R1 reicht)\n';
    doc += '```\n\n';
    
    doc += '## 5.4 BUCHUNGS-STATUS (GeneratedFinancialBooking.booking_status)\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| BUCHUNGS-STATUS | Geplant | Geplant | Offen | GeneratedFinancialBooking | N/A | N/A | - | ✅ Ja (bei CREATE) | outstanding_amount = amount | Grundsteuer Q1 fällig 15.02., noch nicht bezahlt |\n';
    doc += '| BUCHUNGS-STATUS | Gebucht | Gebucht | Bestätigt | GeneratedFinancialBooking | N/A | N/A | User-bestätigt | Nein | - | Buchung wurde geprüft und bestätigt (noch nicht bezahlt) |\n';
    doc += '| BUCHUNGS-STATUS | Teilweise bezahlt | TeilweiseBezahlt | In Zahlung | GeneratedFinancialBooking | N/A | N/A | paid_amount > 0 AND < amount | Nein | outstanding_amount > 0 | 300€ fällig, 150€ bereits bezahlt, 150€ noch offen |\n';
    doc += '| BUCHUNGS-STATUS | Bezahlt | Bezahlt | Erledigt | GeneratedFinancialBooking | ✅ Für Steuerjahr relevant | N/A | paid_amount = amount | Nein | outstanding_amount = 0, linked_transaction_ids | 300€ voll bezahlt, mit BankTransaction verknüpft |\n\n';
    
    doc += '**Status-Übergänge**:\n';
    doc += '```\n';
    doc += 'NUR VORWÄRTS (keine Rückwärts-Übergänge!):\n';
    doc += 'Geplant → Gebucht → TeilweiseBezahlt → Bezahlt\n';
    doc += '   ↓         ↓            ↓                ↓\n';
    doc += ' (neu)   (bestätigt)  (1. Zahlung)    (voll bezahlt)\n';
    doc += '\n';
    doc += 'NICHT möglich:\n';
    doc += '  Bezahlt → Geplant (würde paid_amount zurücksetzen)\n';
    doc += '  TeilweiseBezahlt → Geplant (Zahlung kann nicht rückgängig gemacht werden)\n';
    doc += '\n';
    doc += 'ABKÜRZUNG möglich:\n';
    doc += '  Geplant → Bezahlt (wenn sofort voll bezahlt)\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
    doc += '# 7. TASK & WORKFLOW STATUS\n\n';
    
    doc += '## 7.1 TASK-STATUS (Task.status)\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| TASK-STATUS | Offen | offen | Neu | Task.status | N/A | N/A | - | ✅ Ja | Wird in Listen angezeigt | Task "Mieterhöhung vorbereiten" erstellt, noch nicht begonnen |\n';
    doc += '| TASK-STATUS | In Bearbeitung | in_bearbeitung | Aktiv | Task.status | N/A | N/A | - | Nein | Filter "Meine Tasks" | Task wird gerade bearbeitet (User hat begonnen) |\n';
    doc += '| TASK-STATUS | Wartend | wartend | Blockiert | Task.status | N/A | N/A | - | Nein | Abhängig von externem Event | Task "Mieterreaktion abwarten" - wartet auf Rückmeldung |\n';
    doc += '| TASK-STATUS | Erledigt | erledigt | Abgeschlossen | Task.status | N/A | N/A | completed_at gesetzt | Nein | Wird aus Listen ausgeblendet | Task "Dokument versenden" abgeschlossen am 07.01.2024 |\n';
    doc += '| TASK-STATUS | Abgebrochen | abgebrochen | Storniert | Task.status | N/A | N/A | - | Nein | Soft-Delete | Task war nicht relevant/doppelt/falsch erstellt |\n\n';
    
    doc += '**Status-Übergänge**:\n';
    doc += '```\n';
    doc += 'STANDARD-WORKFLOW:\n';
    doc += 'offen → in_bearbeitung → erledigt\n';
    doc += '  ↓                           ↑\n';
    doc += 'abgebrochen ←───────────────┘ (jederzeit möglich)\n';
    doc += '\n';
    doc += 'MIT WARTEZEIT:\n';
    doc += 'offen → in_bearbeitung → wartend → in_bearbeitung → erledigt\n';
    doc += '                            ↓\n';
    doc += '                        (wartet auf Mieter-Antwort)\n';
    doc += '\n';
    doc += 'ALLE ÜBERGÄNGE MÖGLICH (außer erledigt → offen)\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
    doc += '# 8. BUCHUNGSQUELLEN (Source Types)\n\n';
    
    doc += '## 8.1 QUELLEN FÜR GENERIERTE BUCHUNGEN (GeneratedFinancialBooking.source_type)\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| BUCHUNGS-QUELLE | Versorger | Versorger | Laufende Kosten | GeneratedFinancialBooking | ✅ Betriebskosten | ✅ Ja | Supplier Entity | Nein | Supplier.id in source_id | Strom 960€/Jahr (12× 80€) aus Supplier-Vertrag |\n';
    doc += '| BUCHUNGS-QUELLE | Grundsteuer | Grundsteuer | Öffentliche Abgabe | GeneratedFinancialBooking | ✅ Anlage V Zeile 33 | ✅ Ja | PropertyTax Entity | Nein | PropertyTax.id in source_id | 1.200€/Jahr (4× 300€) aus Grundsteuerbescheid |\n';
    doc += '| BUCHUNGS-QUELLE | Versicherung | Versicherung | Schutz | GeneratedFinancialBooking | ⚠️ Wenn umgelegt: nein | ✅ Ja | Insurance Entity | Nein | Insurance.id in source_id | 850€/Jahr (1× 850€) Gebäudeversicherung |\n';
    doc += '| BUCHUNGS-QUELLE | Kredit | Kredit | Finanzierung | GeneratedFinancialBooking | ✅ Zinsen absetzbar, Tilgung nicht | ❌ Nein | Financing Entity | Nein | Financing.id in source_id | 1.200€/Monat (davon 800€ Zinsen, 400€ Tilgung) |\n';
    doc += '| BUCHUNGS-QUELLE | AfA | AfA | Abschreibung | GeneratedFinancialBooking | ✅✅ Anlage V Zeile 16 | ❌ Nein | AfASchedule Entity | Nein | AfASchedule.id in source_id | 6.000€/Jahr AfA für Gebäude (300.000€ / 50 Jahre) |\n';
    doc += '| BUCHUNGS-QUELLE | Kaufvertrag | Kaufvertrag | Anschaffung | GeneratedFinancialBooking | ✅ Anschaffungskosten (AfA) | ❌ Nein | PurchaseContract Entity | Nein | PurchaseContract.id in source_id | Kaufpreis 450.000€ (einmalig, dann AfA daraus) |\n';
    doc += '| BUCHUNGS-QUELLE | Mietvertrag | Mietvertrag | Einnahmen | GeneratedFinancialBooking | ✅✅ Anlage V Zeile 9 | N/A | LeaseContract Entity | Nein | LeaseContract.id in source_id | Miete 1.030€/Monat (12× 1.030€ = 12.360€/Jahr) |\n\n';
    
    doc += '**Buchungs-Generierung pro Quelle**:\n';
    doc += '```javascript\n';
    doc += '// VERSORGER (z.B. Strom):\n';
    doc += 'if (supplier.payment_rhythm === "Monatlich") {\n';
    doc += '  anzahl_buchungen = 12;\n';
    doc += '  betrag_pro_buchung = supplier.monthly_amount;\n';
    doc += '} else if (supplier.payment_rhythm === "Vierteljährlich") {\n';
    doc += '  anzahl_buchungen = 4;\n';
    doc += '  betrag_pro_buchung = supplier.monthly_amount * 3;\n';
    doc += '}\n';
    doc += '// Beispiel: 80€/Monat, vierteljährlich → 4 Buchungen à 240€\n';
    doc += '\n';
    doc += '// GRUNDSTEUER:\n';
    doc += 'anzahl_buchungen = 4; // Immer quartalsweise\n';
    doc += 'betrag_pro_buchung = propertyTax.grundsteuer_quartalsrate;\n';
    doc += 'faelligkeiten = [propertyTax.faelligkeit_q1, ...q2, ...q3, ...q4];\n';
    doc += '// Beispiel: 1.200€/Jahr → 4× 300€ (15.02., 15.05., 15.08., 15.11.)\n';
    doc += '\n';
    doc += '// VERSICHERUNG:\n';
    doc += 'if (insurance.payment_rhythm === "Jährlich") {\n';
    doc += '  anzahl_buchungen = 1;\n';
    doc += '  betrag_pro_buchung = insurance.premium_amount;\n';
    doc += '  faelligkeit = insurance.start_date; // Jährlich am gleichen Tag\n';
    doc += '}\n';
    doc += '\n';
    doc += '// KREDIT (monatlich):\n';
    doc += 'anzahl_buchungen = months_between(start_date, end_date);\n';
    doc += 'betrag_pro_buchung = financing.monthly_rate;\n';
    doc += '// WICHTIG: Nur Zinsen sind steuerlich absetzbar, nicht Tilgung!\n';
    doc += '// → Separate Buchungen: Zinsen (absetzbar) + Tilgung (nicht absetzbar)\n';
    doc += '\n';
    doc += '// MIETVERTRAG:\n';
    doc += 'anzahl_buchungen = 12; // oder bis end_date\n';
    doc += 'betrag_pro_buchung = +contract.total_rent; // POSITIV = Einnahme\n';
    doc += 'faelligkeit = rent_due_day jeden Monats;\n';
    doc += '// Beispiel: 1.030€, fällig jeden 3. des Monats\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
    doc += '# 9. STEUER-KATEGORIEN (DETAILLIERT)\n\n';
    
    doc += '## 9.1 ANLAGE V ZEILEN-ZUORDNUNG (Tax Form Fields)\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| ANLAGE-V-ZEILE | Einnahmen aus Vermietung | zeile_9 | Einnahmen | TaxFormField, AnlageVSubmission | ✅✅ Haupteinnahmen | N/A | LeaseContract | - | sum(Mieteinnahmen) | 12.360€ (12× 1.030€ Miete) → Zeile 9 |\n';
    doc += '| ANLAGE-V-ZEILE | Umlagen (Nachzahlung NK) | zeile_10 | Einnahmen | TaxFormField | ✅ Sonstige Einnahmen | N/A | OperatingCostStatement | - | Nachzahlungen Vorjahr | 450€ Nachzahlung NK 2022 (in 2023 erhalten) → Zeile 10 |\n';
    doc += '| ANLAGE-V-ZEILE | AfA Gebäude | zeile_16 | Werbungskosten | TaxFormField, AfASchedule | ✅✅ Hauptabschreibung | ❌ Nie | PurchaseContract, AfASchedule | - | 2% von Gebäudewert | 6.000€ AfA (300.000€ Gebäude / 50 Jahre) → Zeile 16 |\n';
    doc += '| ANLAGE-V-ZEILE | AfA Außenanlagen | zeile_17 | Werbungskosten | TaxFormField | ✅ Separate AfA | ❌ Nein | PurchaseContract | - | 10% über 10 Jahre | 500€ AfA für Garage (5.000€ / 10 Jahre) → Zeile 17 |\n';
    doc += '| ANLAGE-V-ZEILE | Grundsteuer | zeile_33 | Werbungskosten | TaxFormField, PropertyTax | ✅✅ Immer absetzbar | ✅ Umlagefähig | PropertyTax | - | Direkt aus Bescheid | 1.200€ Grundsteuer → Zeile 33 |\n';
    doc += '| ANLAGE-V-ZEILE | Versicherungen | zeile_34 | Werbungskosten | TaxFormField, Insurance | ✅ Wenn NICHT umgelegt | ⚠️ Wenn umgelegt: nicht absetzbar | Insurance, allocatable=false | - | Nur nicht-umgelegte | 850€ Gebäudevers. (umgelegt) → NICHT Zeile 34 |\n';
    doc += '| ANLAGE-V-ZEILE | Geldbeschaffungskosten | zeile_35 | Werbungskosten | TaxFormField | ✅ Bankgebühren, Disagio | ❌ Nein | - | - | Finanzierungsnebenkosten | 120€ Bankgebühren → Zeile 35 |\n';
    doc += '| ANLAGE-V-ZEILE | Erhaltungsaufwendungen | zeile_36 | Werbungskosten | TaxFormField, Invoice | ✅✅ Sofort absetzbar | ❌ Meist nicht | category_type=ERHALTUNG | - | 15%-Regel beachten! | 4.500€ Reparaturen → Zeile 36 (wenn < 15%) |\n';
    doc += '| ANLAGE-V-ZEILE | Schuldzinsen | zeile_37 | Werbungskosten | TaxFormField, Financing | ✅✅ Voll absetzbar | ❌ Nein | Financing | - | Nur Zinsen, nicht Tilgung! | 12.000€ Kreditzinsen → Zeile 37 |\n';
    doc += '| ANLAGE-V-ZEILE | Sonstige Werbungskosten | zeile_38_48 | Werbungskosten | TaxFormField | ✅ Diverses | Variabel | - | - | Zeilen 38-48 | Verwaltung 480€, Rechtsberatung 650€, etc. |\n';
    doc += '| ANLAGE-V-ZEILE | Summe Werbungskosten | zeile_49 | Summe | TaxFormField | ✅ Berechnet | N/A | - | - | sum(Zeilen 16-48) | 25.420€ (alle Werbungskosten zusammen) |\n';
    doc += '| ANLAGE-V-ZEILE | Überschuss/Verlust | zeile_50 | Ergebnis | TaxFormField, AnlageVSubmission | ✅✅ Finales Ergebnis | N/A | - | - | Zeile 9-10 minus Zeile 49 | 12.360€ - 25.420€ = -13.060€ (Verlust) |\n\n';
    
    doc += '**Berechnung Anlage V (komplett)**:\n';
    doc += '```javascript\n';
    doc += '// EINNAHMEN\n';
    doc += 'zeile_9 = sum(LeaseContract.total_rent × months_in_year WHERE building_id)\n';
    doc += 'zeile_10 = sum(NK-Nachzahlungen Vorjahr)\n';
    doc += 'zeile_11 = sonstige_einnahmen // selten\n';
    doc += 'einnahmen_gesamt = zeile_9 + zeile_10 + zeile_11\n';
    doc += '\n';
    doc += '// WERBUNGSKOSTEN\n';
    doc += 'zeile_16 = AfASchedule.afa_amount WHERE year AND building_id\n';
    doc += 'zeile_17 = AfA Außenanlagen (falls vorhanden)\n';
    doc += 'zeile_33 = sum(PropertyTax-Buchungen)\n';
    doc += 'zeile_34 = sum(Insurance WHERE NOT allocatable)\n';
    doc += 'zeile_35 = sum(Bankgebühren, Disagio)\n';
    doc += 'zeile_36 = sum(Invoice WHERE category_type=ERHALTUNG AND tax_treatment=SOFORT)\n';
    doc += 'zeile_37 = sum(Financing.monthly_rate × 12) - tilgung\n';
    doc += '        = nur Zinsen! Tilgung nicht absetzbar\n';
    doc += 'zeile_38_48 = div Rechtsberatung, Verwaltung, Fahrtkosten, Porto, etc.)\n';
    doc += 'zeile_49 = sum(zeile_16 bis zeile_48)\n';
    doc += '\n';
    doc += '// ERGEBNIS\n';
    doc += 'zeile_50 = einnahmen_gesamt - zeile_49\n';
    doc += '// Positiv = Überschuss (Gewinn) → zu versteuern\n';
    doc += '// Negativ = Verlust → Steuermindernd\n';
    doc += '\n';
    doc += '// Beispiel-Berechnung:\n';
    doc += 'Einnahmen:       12.360€ (Zeile 9)\n';
    doc += 'Werbungskosten:  25.420€ (Zeile 49)\n';
    doc += '  davon AfA:      6.000€\n';
    doc += '  davon Zinsen:  12.000€\n';
    doc += '  davon Kosten:   7.420€\n';
    doc += '────────────────────────\n';
    doc += 'Verlust:        -13.060€ (Zeile 50)\n';
    doc += '→ Steuerersparnis bei 30% Grenzsteuersatz: 3.918€\n';
    doc += '```\n\n';
    
    doc += '## 9.2 SKR03/SKR04 KONTENRAHMEN\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| KONTENRAHMEN | SKR03 (Prozessgliederung) | SKR03 | DATEV-Standard | BuildingTaxLibrary.account_framework | ✅ Ja | N/A | - | ✅ Ja (häufiger) | Kostenarten-Konten 4000-4999 | Für Handwerker, kleinere Unternehmen üblich |\n';
    doc += '| KONTENRAHMEN | SKR04 (Abschlussgliederung) | SKR04 | DATEV-Standard | BuildingTaxLibrary.account_framework | ✅ Ja | N/A | - | Nein | Kostenarten-Konten 6000-6999 | Für GmbH, größere Unternehmen, Bilanzierer |\n\n';
    
    doc += '**Konten-Beispiele (SKR03 vs. SKR04)**:\n';
    doc += '```\n';
    doc += 'GRUNDSTEUER:\n';
    doc += '  SKR03: Konto 4520 "Grundsteuer"\n';
    doc += '  SKR04: Konto 6815 "Grundsteuer"\n';
    doc += '\n';
    doc += 'VERSICHERUNGEN:\n';
    doc += '  SKR03: Konto 4360 "Versicherungen"\n';
    doc += '  SKR04: Konto 6520 "Versicherungen"\n';
    doc += '\n';
    doc += 'REPARATUREN:\n';
    doc += '  SKR03: Konto 4210 "Instandhaltung Gebäude"\n';
    doc += '  SKR04: Konto 6520 "Instandhaltung"\n';
    doc += '\n';
    doc += 'ZINSEN:\n';
    doc += '  SKR03: Konto 2110 "Zinsen und ähnliche Aufwendungen"\n';
    doc += '  SKR04: Konto 7310 "Zinsen und ähnliche Aufwendungen"\n';
    doc += '\n';
    doc += 'AfA:\n';
    doc += '  SKR03: Konto 4855 "Abschreibungen auf Gebäude"\n';
    doc += '  SKR04: Konto 6220 "Abschreibungen auf Gebäude"\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
    doc += '# 10. KOMMUNIKATION & VERSAND\n\n';
    
    doc += '## 10.1 LETTERXPRESS-STATUS (LetterShipment.status)\n\n';
    doc += '| Gruppenname | Anzeige-Text | Interner Wert | Kategorie | Verwendung | Steuerlich relevant | Umlagefähig | Abhängigkeiten | Standard | Verknüpfungen | Beispiel-Anwendungsfall |\n';
    doc += '|-------------|--------------|---------------|-----------|------------|---------------------|-------------|----------------|----------|---------------|------------------------|\n';
    doc += '| LXP-STATUS | In Warteschlange | queue | Ausstehend | LetterShipment.status | N/A | N/A | - | ✅ Ja (bei CREATE) | Noch nicht gedruckt | Brief wurde an LetterXpress übermittelt, wartet auf Druck |\n';
    doc += '| LXP-STATUS | Wird gedruckt | hold | In Produktion | LetterShipment.status | N/A | N/A | - | Nein | Druck läuft | Brief wird gerade gedruckt (typischerweise <1h in diesem Status) |\n';
    doc += '| LXP-STATUS | Gedruckt | done | Bereit | LetterShipment.status | N/A | N/A | - | Nein | Übergabe an DHL | Druck fertig, wird an Deutsche Post übergeben |\n';
    doc += '| LXP-STATUS | Versendet | sent | Zugestellt | LetterShipment.status | N/A | N/A | tracking_code vorhanden | Nein | Document.versandt_am setzen | Brief wurde zugestellt (DHL-Tracking bestätigt) |\n';
    doc += '| LXP-STATUS | Storniert | canceled | Abgebrochen | LetterShipment.status | N/A | N/A | - | Nein | Guthaben wird gutgeschrieben | Versand wurde vor Druck storniert (selten) |\n\n';
    
    doc += '**Status-Übergänge (LetterXpress-seitig)**:\n';
    doc += '```\n';
    doc += 'queue → hold → done → sent\n';
    doc += '  ↓\n';
    doc += 'canceled (nur aus queue möglich, nicht aus hold/done/sent)\n';
    doc += '\n';
    doc += 'ZEITDAUER:\n';
    doc += '  queue → hold:  < 1 Stunde (typischerweise nachts)\n';
    doc += '  hold → done:   ~5 Minuten (Druck)\n';
    doc += '  done → sent:   1-3 Werktage (Postlaufzeit)\n';
    doc += '\n';
    doc += 'TRACKING-UPDATE:\n';
    doc += '  - Status wird täglich via Scheduled Task "updateLetterTrackingCodes" abgerufen\n';
    doc += '  - Läuft um 12:00 Uhr (Admin-only)\n';
    doc += '  - Aktualisiert: status, tracking_code, dispatch_date, sent_at\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
    doc += '# 11. HIERARCHIEN & ABHÄNGIGKEITEN\n\n';
    
    doc += '## 11.1 KOSTENKATEGORIEN-HIERARCHIE\n\n';
    doc += '```\n';
    doc += 'EBENE 1: KOSTENARTEN-TYP (category_type)\n';
    doc += '├── ERHALTUNG (Erhaltungsaufwendungen)\n';
    doc += '│   ├── EBENE 2: Reparaturen\n';
    doc += '│   │   ├── Heizung\n';
    doc += '│   │   ├── Sanitär\n';
    doc += '│   │   └── Elektrik\n';
    doc += '│   ├── EBENE 2: Schönheitsreparaturen\n';
    doc += '│   └── EBENE 2: Wartung\n';
    doc += '│\n';
    doc += '├── HERSTELLUNG (Herstellungskosten)\n';
    doc += '│   ├── EBENE 2: Sanierung\n';
    doc += '│   ├── EBENE 2: Anbau/Ausbau\n';
    doc += '│   ├── EBENE 2: Modernisierung\n';
    doc += '│   └── EBENE 2: Anschaffungsnebenkosten\n';
    doc += '│       ├── Grunderwerbsteuer\n';
    doc += '│       ├── Notar\n';
    doc += '│       ├── Makler\n';
    doc += '│       └── Grundbucheintrag\n';
    doc += '│\n';
    doc += '├── BETRIEB (Betriebskosten)\n';
    doc += '│   ├── EBENE 2: Umlagefähig (nach BetrKV)\n';
    doc += '│   │   ├── Grundsteuer (§2 Nr. 1)\n';
    doc += '│   │   ├── Wasser (§2 Nr. 2)\n';
    doc += '│   │   ├── Heizung (§2 Nr. 4)\n';
    doc += '│   │   ├── Aufzug (§2 Nr. 5)\n';
    doc += '│   │   ├── Müllabfuhr (§2 Nr. 7)\n';
    doc += '│   │   └── ... (weitere §2 BetrKV)\n';
    doc += '│   └── EBENE 2: Nicht umlagefähig\n';
    doc += '│       ├── Hausverwaltung (§1 Abs. 2 Nr. 1 BetrKV)\n';
    doc += '│       ├── Instandhaltungsrücklage (WEG)\n';
    doc += '│       └── Verwaltungsbeirat\n';
    doc += '│\n';
    doc += '└── FINANZIERUNG (Finanzierungskosten)\n';
    doc += '    ├── EBENE 2: Zinsen (absetzbar)\n';
    doc += '    │   ├── Sollzinsen\n';
    doc += '    │   └── Bereitstellungszinsen\n';
    doc += '    ├── EBENE 2: Nebenkosten\n';
    doc += '    │   ├── Disagio\n';
    doc += '    │   └── Bearbeitungsgebühren\n';
    doc += '    └── EBENE 2: Tilgung (NICHT absetzbar!)\n';
    doc += '\n';
    doc += 'EBENE 3: STEUERLICHE BEHANDLUNG (tax_treatment)\n';
    doc += 'Jede Kategorie hat zusätzlich:\n';
    doc += '  - SOFORT (sofort als Werbungskosten)\n';
    doc += '  - AFA (über 50 Jahre verteilt)\n';
    doc += '  - VERTEILT (über 3-5 Jahre)\n';
    doc += '  - NICHT_ABSETZBAR (z.B. umgelegte Kosten)\n';
    doc += '```\n\n';
    
    doc += '## 11.2 KONSTANTEN-VERKNÜPFUNGEN (If-Then-Logik)\n\n';
    doc += '| Wenn Feld X | Wert | Dann Feld Y | Nur Optionen | Grund | Beispiel |\n';
    doc += '|-------------|------|-------------|--------------|-------|----------|\n';
    doc += '| Owner.type | PRIVATPERSON | Shareholder | Nicht verfügbar | Privatperson hat keine Gesellschafter | Max Mustermann (Einzelperson) |\n';
    doc += '| Owner.type | GBR oder GMBH | Shareholder | ≥ 2 erforderlich | Gesellschaft braucht Gesellschafter | Mustermann GbR → min. 2 Shareholders |\n';
    doc += '| Building.building_type | Einfamilienhaus | Unit.count | = 1 | EFH hat nur 1 Wohneinheit | EFH → kann nur 1 Unit haben |\n';
    doc += '| Building.building_type | Grundstück | AfASchedule | Nicht erstellen | Boden ist nicht abschreibbar | Baugrundstück → keine AfA |\n';
    doc += '| CostCategory.category_type | BETRIEB | allocatable | Meist true | Betriebskosten sind oft umlagefähig | Müll (BETRIEB) → allocatable=true |\n';
    doc += '| CostCategory.category_type | HERSTELLUNG | tax_treatment | Muss AFA sein | Herstellung nur über AfA absetzbar | Sanierung → tax_treatment=AFA |\n';
    doc += '| CostCategory.allocatable | true | tax_treatment | Meist NICHT_ABSETZBAR | Umgelegte Kosten nicht absetzbar | Müll umgelegt → nicht absetzbar |\n';
    doc += '| LeaseContract.is_unlimited | false | end_date | Muss gesetzt sein | Befristeter Vertrag braucht Enddatum | Befristet → end_date="2025-12-31" |\n';
    doc += '| GeneratedFinancialBooking.source_type | Kredit | amount | Negativ | Kredit-Raten sind Ausgaben | Kredit → amount=-1200 |\n';
    doc += '| GeneratedFinancialBooking.source_type | Mietvertrag | amount | Positiv | Miete ist Einnahme | Mietvertrag → amount=+1030 |\n';
    doc += '| Document.category | Mietrecht | Template | Nur Mietrecht-Templates | Template-Filter | Mieterhöhung → nur Templates mit category=Mietrecht |\n';
    doc += '| PropertyTax.grundsteuermessbetrag | > 0 | grundsteuer_quartalsrate | Berechnet | Quartalsrate = Jahresbetrag / 4 | 1.200€ → 300€/Quartal |\n\n';
    
    doc += '---\n\n';
    
    doc += '# 12. HISTORISCHE ÄNDERUNGEN & VERSIONIERUNG\n\n';
    
    doc += '## 12.1 GEÄNDERTE/ENTFERNTE KONSTANTEN (Change-Log)\n\n';
    doc += '| Datum | Konstante | Änderung | Alt | Neu | Grund | Migration erforderlich? |\n';
    doc += '|-------|-----------|----------|-----|-----|-------|------------------------|\n';
    doc += '| 2024-03 | Document.status | Hinzugefügt | - | "gescannt" | Original-Dokumente-Feature | Nein (optional) |\n';
    doc += '| 2024-05 | GeneratedFinancialBooking.source_type | Hinzugefügt | - | "AfA" | AfA-Modul implementiert | Nein |\n';
    doc += '| 2024-06 | Owner.type | Hinzugefügt | - | "GMBH" | GmbH-Support | Nein (neue Option) |\n';
    doc += '| 2024-08 | CostCategory.category_type | Umbenannt | "MAINTENANCE" | "ERHALTUNG" | Deutsche Terminologie | Ja (Daten migrieren) |\n';
    doc += '| 2025-01 | LeaseContract.status | Entfernt | "pending" | - | Status war nicht sinnvoll | Ja (auf "active" setzen) |\n\n';
    
    doc += '## 12.2 GEPLANTE NEUE KONSTANTEN (Roadmap)\n\n';
    doc += '| Konstante | Geplant für | Neue Werte | Zweck | Status |\n';
    doc += '|-----------|-------------|------------|-------|--------|\n';
    doc += '| Building.energy_certificate | Q2 2024 | "A+", "A", "B", ..., "H" | Energieausweis (EnEV) | 🚧 Geplant |\n';
    doc += '| LeaseContract.contract_type | Q3 2024 | "unbefristet", "befristet", "zeitmietvertrag" | Differenzierung | 🚧 Geplant |\n';
    doc += '| Task.priority | Q1 2024 | "niedrig", "normal", "hoch", "kritisch" | Priorisierung | 🚧 Geplant |\n';
    doc += '| Invoice.payment_method | Q2 2024 | "Überweisung", "Lastschrift", "Bar", "Karte" | Zahlungsart-Tracking | 🚧 Geplant |\n\n';
    
    doc += '---\n\n';
    
    doc += '# 13. VERWENDUNG IM CODE\n\n';
    
    doc += '## 13.1 Frontend (React)\n\n';
    doc += '**Dropdown-Komponente**:\n';
    doc += '```jsx\n';
    doc += 'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";\n';
    doc += '\n';
    doc += '<Select value={status} onValueChange={setStatus}>\n';
    doc += '  <SelectTrigger>\n';
    doc += '    <SelectValue placeholder="Status wählen" />\n';
    doc += '  </SelectTrigger>\n';
    doc += '  <SelectContent>\n';
    doc += '    <SelectItem value="zu_erledigen">Zu erledigen</SelectItem>\n';
    doc += '    <SelectItem value="erstellt">Erstellt</SelectItem>\n';
    doc += '    <SelectItem value="versendet">Versendet</SelectItem>\n';
    doc += '    <SelectItem value="unterschrieben">Unterschrieben</SelectItem>\n';
    doc += '  </SelectContent>\n';
    doc += '</Select>\n';
    doc += '```\n\n';
    
    doc += '**Badge-Farben pro Status**:\n';
    doc += '```jsx\n';
    doc += 'const STATUS_COLORS = {\n';
    doc += '  "zu_erledigen": "bg-slate-100 text-slate-700",\n';
    doc += '  "erstellt": "bg-blue-100 text-blue-700",\n';
    doc += '  "versendet": "bg-indigo-100 text-indigo-700",\n';
    doc += '  "unterschrieben": "bg-green-100 text-green-700"\n';
    doc += '};\n';
    doc += '\n';
    doc += '<Badge className={STATUS_COLORS[document.status]}>\n';
    doc += '  {STATUS_LABELS[document.status]}\n';
    doc += '</Badge>\n';
    doc += '```\n\n';
    
    doc += '## 13.2 Backend (Validierung)\n\n';
    doc += '**JSON-Schema Enum-Validierung**:\n';
    doc += '```javascript\n';
    doc += '// Automatisch durch Base44 SDK\n';
    doc += 'await base44.entities.Document.create({\n';
    doc += '  status: "versendet" // ✅ Valide\n';
    doc += '});\n';
    doc += '\n';
    doc += 'await base44.entities.Document.create({\n';
    doc += '  status: "ungültig" // ❌ Fehler: "Status muss einer der folgenden sein: ..."\n';
    doc += '});\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
    doc += '# 14. ZUSAMMENFASSUNG: KONSTANTEN-ÜBERSICHT\n\n';
    doc += '| Konstanten-Gruppe | Anzahl Werte | Verwendung | Änderbar? | Mehrsprachig? |\n';
    doc += '|-------------------|--------------|------------|-----------|---------------|\n';
    doc += '| Kostenarten-Typen | 4 | CostCategory.category_type | ❌ Nein (hart codiert) | Nein (nur DE) |\n';
    doc += '| Steuerliche Behandlung | 4 | CostCategory.tax_treatment | ❌ Nein | Nein |\n';
    doc += '| Detaillierte Kostenkategorien | ~52 | BuildingTaxLibrary (dynamisch) | ✅ Ja (Custom Categories) | Nein |\n';
    doc += '| Verteilerschlüssel | 7 | OperatingCostStatement | ❌ Nein | Nein |\n';
    doc += '| Objekttypen | 12 | Building.building_type | ✅ Ja (erweiterbar) | Nein |\n';
    doc += '| Rechtsformen | 7 | Owner.type | ❌ Nein | Nein |\n';
    doc += '| Nutzungsarten | 4 | applicable_for_usage | ❌ Nein | Nein |\n';
    doc += '| Dokument-Status | 7 | Document.status | ❌ Nein | Nein |\n';
    doc += '| Dokumentkategorien | 5 | Document.category | ✅ Ja (erweiterbar) | Nein |\n';
    doc += '| Buchungs-Status | 4 | GeneratedFinancialBooking.booking_status | ❌ Nein | Nein |\n';
    doc += '| Buchungsquellen | 7 | GeneratedFinancialBooking.source_type | ❌ Nein | Nein |\n';
    doc += '| Zahlungsrhythmen | 4 | Supplier.payment_rhythm | ❌ Nein | Nein |\n';
    doc += '| Versandarten | 3 | LetterShipment.shipping_type | ❌ Nein | Nein |\n';
    doc += '| LetterXpress-Status | 5 | LetterShipment.status | ❌ Nein (von LXP gesetzt) | Nein |\n';
    doc += '| Task-Status | 5 | Task.status | ❌ Nein | Nein |\n';
    doc += '| Mietvertrag-Status | 3 | LeaseContract.status | ❌ Nein | Nein |\n\n';
    
    doc += '**Legende "Änderbar?"**:\n';
    doc += '- ✅ Ja: User kann eigene Werte hinzufügen (z.B. Custom Cost Categories)\n';
    doc += '- ❌ Nein: Fest codiert in Entity-Schema (nur durch Code-Änderung)\n\n';
    
    doc += '---\n\n';
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
    let doc = '# Geschäftslogik & Validierungen - VOLLSTÄNDIGE DOKUMENTATION\n\n';
    doc += '**Metadaten:**\n';
    doc += `- Generiert am: ${new Date().toLocaleString('de-DE')}\n`;
    doc += '- Verwendungszweck: KI-Assistent Kontextinformation\n';
    doc += '- Anzahl Regeln: ~120\n';
    doc += '- Gruppierung: Nach Modulen (A-F)\n\n';
    doc += '---\n\n';
    
    doc += '## ÜBERSICHT\n\n';
    doc += 'Diese Dokumentation beschreibt ALLE Geschäftsregeln, Validierungen, Berechnungen und Automatismen.\n\n';
    doc += '**Struktur pro Regel**: Identifikation | Beschreibung | Validierung | Berechnung | Abhängigkeiten | Rechtliche Grundlage\n\n';
    doc += '**Schweregrade**:\n';
    doc += '- ❌ **BLOCKER**: Verhindert Speichern (kritischer Fehler)\n';
    doc += '- ⚠️ **WARNING**: Warnung, Speichern aber möglich\n';
    doc += '- ℹ️ **INFO**: Reine Information, keine Warnung\n\n';
    
    doc += '---\n\n';
    
    // A) STEUERLICHE VALIDIERUNGEN
    doc += '# A) STEUERLICHE VALIDIERUNGEN & BERECHNUNGEN\n\n';
    
    doc += '## A.1 ANLAGE V VALIDIERUNGEN\n\n';
    
    doc += '### REGEL A1.1: Pflichtfeld Gebäude-Adresse\n\n';
    doc += '**Identifikation**:\n';
    doc += '- Regel-ID: `VAL_ANLAGEV_001`\n';
    doc += '- Modul: Steuer-Modul / Anlage V\n';
    doc += '- Betroffene Felder: `Building.address`, `Building.zip_code`, `Building.city`\n\n';
    doc += '**Regel-Beschreibung**:\n';
    doc += '- **Was**: Gebäude-Adresse muss vollständig sein für Anlage V Generierung\n';
    doc += '- **Wann**: Beim Klick auf "Anlage V erstellen"\n';
    doc += '- **Wer**: Alle User (Admin, Verwalter)\n\n';
    doc += '**Validierungs-Details**:\n';
    doc += '- Art: Pflichtfeld-Prüfung\n';
    doc += '- Stufe: ❌ BLOCKER\n';
    doc += '- Fehlermeldung: "Gebäude-Adresse unvollständig. Anlage V kann nicht erstellt werden. Bitte Adresse, PLZ und Ort in den Gebäudedaten nachtragen."\n';
    doc += '- Hilfetext: "Navigation: Objekte → [Gebäude] → Bearbeiten → Adressdaten vervollständigen"\n\n';
    doc += '**Rechtliche Grundlage**:\n';
    doc += '- Anlage V Zeile 4-6: Objektadresse ist Pflichtangabe\n';
    doc += '- EStG §21: Vermietungsobjekt muss identifizierbar sein\n\n';
    
    doc += '### REGEL A1.2: Verlust-Plausibilität (Liebhaberei-Prüfung)\n\n';
    doc += '**Identifikation**:\n';
    doc += '- Regel-ID: `VAL_ANLAGEV_002`\n';
    doc += '- Modul: Steuer-Modul\n';
    doc += '- Betroffene Felder: `AnlageVSubmission.ueberschuss_verlust`\n\n';
    doc += '**Regel-Beschreibung**:\n';
    doc += '- **Was**: Wenn 3 Jahre in Folge Verlust → Liebhaberei-Warnung\n';
    doc += '- **Wann**: Nach Anlage V Berechnung (vor Export)\n';
    doc += '- **Wer**: Alle User\n\n';
    doc += '**Validierungs-Details**:\n';
    doc += '- Art: Geschäftsregel (Plausibilitätsprüfung)\n';
    doc += '- Stufe: ⚠️ WARNING\n';
    doc += '- Fehlermeldung: "⚠️ WICHTIG: Verlust nun 3 Jahre in Folge (2022: -12.000€, 2023: -13.060€, 2024: -11.500€). Finanzamt könnte Liebhaberei annehmen. Gewinnerzielungsabsicht dokumentieren!"\n';
    doc += '- Hilfetext: "Maßnahmen: Mieterhöhung prüfen, Kosten senken, oder Steuerberater konsultieren. Bei Liebhaberei: Kosten nicht mehr absetzbar!"\n\n';
    doc += '**Berechnung**:\n';
    doc += '```javascript\n';
    doc += 'const last_3_years = [2022, 2023, 2024];\n';
    doc += 'const results = await AnlageVSubmission.filter({\n';
    doc += '  building_id: building.id,\n';
    doc += '  year: { $in: last_3_years }\n';
    doc += '});\n';
    doc += '\n';
    doc += 'const all_losses = results.every(r => r.ueberschuss_verlust < 0);\n';
    doc += 'if (all_losses && results.length >= 3) {\n';
    doc += '  return {\n';
    doc += '    level: "WARNING",\n';
    doc += '    message: "⚠️ 3 Jahre Verlust in Folge - Liebhaberei-Prüfung droht"\n';
    doc += '  };\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Rechtliche Grundlage**:\n';
    doc += '- BFH-Rechtsprechung: Bei dauerhaften Verlusten kann Finanzamt Liebhaberei annehmen\n';
    doc += '- Folge: Kosten werden NICHT mehr anerkannt, Einnahmen aber versteuert\n';
    doc += '- Ausnahme: Objektive Vermietungsabsicht nachweisbar (z.B. Sanierung geplant)\n\n';
    
    doc += '### REGEL A1.3: 15%-Regel (Erhaltung vs. Herstellung)\n\n';
    doc += '**Identifikation**:\n';
    doc += '- Regel-ID: `VAL_TAX_15PERCENT`\n';
    doc += '- Modul: Steuer-Modul / Rechnungserfassung\n';
    doc += '- Betroffene Felder: `Invoice.cost_category_id`, `CostCategory.tax_treatment`\n';
    doc += '- Backend-Funktion: `check15PercentRule`\n\n';
    doc += '**Regel-Beschreibung**:\n';
    doc += '- **Was**: Wenn Erhaltungskosten in 3 Jahren > 15% des Gebäudewertes → müssen als Herstellungskosten (AfA) behandelt werden\n';
    doc += '- **Wann**: Bei Rechnungserfassung (Invoice CREATE) + bei Anlage V Generierung\n';
    doc += '- **Wer**: Alle User (automatische Prüfung)\n\n';
    doc += '**Validierungs-Details**:\n';
    doc += '- Art: Steuerliche Geschäftsregel (§6 Abs. 1 Nr. 1a EStG)\n';
    doc += '- Stufe: ⚠️ WARNING (erlaubt Speichern, aber steuerlich falsch!)\n';
    doc += '- Fehlermeldung: "⚠️ 15%-Grenze überschritten! Erhaltungskosten letzte 3 Jahre: 52.000€. Grenzwert (15% von 300.000€): 45.000€. Überschreitung: 7.000€. Diese Kosten müssen als HERSTELLUNG (AfA) umgebucht werden, sonst Steuernachzahlung!"\n';
    doc += '- Hilfetext: "Aktion: Rechnungen der letzten 3 Jahre prüfen. Große Sanierungen (z.B. neues Bad 18.000€) von ERHALTUNG zu HERSTELLUNG umbuchen. Dann AfA über 50 Jahre."\n\n';
    doc += '**Berechnung (vollständig)**:\n';
    doc += '```javascript\n';
    doc += '// Backend-Funktion: check15PercentRule\n';
    doc += 'async function check15PercentRule(building_id, new_invoice_amount = 0) {\n';
    doc += '  // 1. Gebäudewert ermitteln (ohne Grundstück!)\n';
    doc += '  const building = await Building.get(building_id);\n';
    doc += '  const gebaeude_wert = building.purchase_price - building.land_value;\n';
    doc += '  // Beispiel: 450.000€ - 150.000€ = 300.000€\n';
    doc += '  \n';
    doc += '  // 2. Grenzwert berechnen (15%)\n';
    doc += '  const threshold = gebaeude_wert * 0.15;\n';
    doc += '  // Beispiel: 300.000€ × 0,15 = 45.000€\n';
    doc += '  \n';
    doc += '  // 3. Erhaltungskosten der letzten 3 Jahre summieren\n';
    doc += '  const three_years_ago = new Date();\n';
    doc += '  three_years_ago.setFullYear(three_years_ago.getFullYear() - 3);\n';
    doc += '  \n';
    doc += '  const invoices = await Invoice.filter({\n';
    doc += '    building_id: building_id,\n';
    doc += '    invoice_date: { $gte: three_years_ago },\n';
    doc += '    cost_category_id: { $in: await getCategoryIds("ERHALTUNG", "SOFORT") }\n';
    doc += '  });\n';
    doc += '  \n';
    doc += '  const erhaltung_sum = invoices.reduce((sum, inv) => sum + inv.total_amount, 0) + new_invoice_amount;\n';
    doc += '  // Beispiel: 15.000€ (2022) + 22.000€ (2023) + 15.000€ (2024) = 52.000€\n';
    doc += '  \n';
    doc += '  // 4. Prüfung\n';
    doc += '  if (erhaltung_sum > threshold) {\n';
    doc += '    const ueberschreitung = erhaltung_sum - threshold;\n';
    doc += '    // 52.000€ - 45.000€ = 7.000€ Überschreitung\n';
    doc += '    \n';
    doc += '    return {\n';
    doc += '      exceeded: true,\n';
    doc += '      erhaltung_sum: erhaltung_sum.toFixed(2),\n';
    doc += '      threshold: threshold.toFixed(2),\n';
    doc += '      ueberschreitung: ueberschreitung.toFixed(2),\n';
    doc += '      percentage: ((erhaltung_sum / gebaeude_wert) * 100).toFixed(1),\n';
    doc += '      action: "Rechnungen von ERHALTUNG → HERSTELLUNG umbuchen"\n';
    doc += '    };\n';
    doc += '  }\n';
    doc += '  \n';
    doc += '  return { exceeded: false, percentage: ((erhaltung_sum / gebaeude_wert) * 100).toFixed(1) };\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Sonderfälle**:\n';
    doc += '- Division durch 0: Wenn `land_value` nicht gesetzt oder `purchase_price = land_value` → Fehler "Gebäudewert kann nicht ermittelt werden"\n';
    doc += '- Keine Kaufdaten: Wenn `purchase_price` fehlt → Regel wird übersprungen (keine Prüfung möglich)\n';
    doc += '- Genau 15%: Bei exakt 15,00% → noch OK (Grenze nicht überschritten)\n';
    doc += '- 3-Jahres-Fenster: Rollierende Berechnung (immer die letzten 36 Monate)\n\n';
    doc += '**Rechtliche Grundlage**:\n';
    doc += '- §6 Abs. 1 Nr. 1a EStG: Anschaffungs- oder Herstellungskosten\n';
    doc += '- BMF-Schreiben IV C 3 - S 2211/07/10003: Erhaltungsaufwand vs. Herstellungskosten\n';
    doc += '- BFH-Urteil IX R 20/14: 15%-Grenze (nicht mehr 4.000€-Grenze!)\n\n';
    
    doc += '---\n\n';
    
    doc += '## A.2 AfA-BERECHNUNGEN (Abschreibung für Abnutzung)\n\n';
    
    doc += '### REGEL A2.1: Lineare AfA Wohngebäude (Standard)\n\n';
    doc += '**Identifikation**:\n';
    doc += '- Regel-ID: `CALC_AFA_LINEAR_WOHNUNG`\n';
    doc += '- Modul: Steuer-Modul\n';
    doc += '- Betroffene Entities: `AfASchedule`, `GeneratedFinancialBooking`\n';
    doc += '- Backend-Funktion: `generateAfASchedule`\n\n';
    doc += '**Regel-Beschreibung**:\n';
    doc += '- **Was**: Jährliche AfA-Berechnung für Wohngebäude (2% linear über 50 Jahre)\n';
    doc += '- **Wann**: Bei PurchaseContract CREATE (automatisch) oder manuell via "AfA-Plan generieren"\n';
    doc += '- **Wer**: System (automatisch nach User-Bestätigung)\n\n';
    doc += '**Berechnung (vollständig)**:\n';
    doc += '```javascript\n';
    doc += '// SCHRITT 1: Gebäudewert ermitteln (OHNE Grundstück!)\n';
    doc += 'const purchase_price = 450000; // Kaufpreis gesamt\n';
    doc += 'const land_value = 150000;     // Grundstückswert (nicht abschreibbar!)\n';
    doc += 'const gebaeude_wert = purchase_price - land_value;\n';
    doc += '// = 450.000€ - 150.000€ = 300.000€\n';
    doc += '\n';
    doc += '// SCHRITT 2: AfA-Satz bestimmen\n';
    doc += 'const afa_rate = 0.02; // 2% für Wohngebäude (§7 Abs. 4 Nr. 2a EStG)\n';
    doc += 'const nutzungsdauer = 50; // Jahre\n';
    doc += '// Gewerbe: 3% (33 Jahre)\n';
    doc += '// Denkmal: 9% über 8 Jahre (Sonder-AfA §7i EStG)\n';
    doc += '\n';
    doc += '// SCHRITT 3: Jährliche AfA berechnen\n';
    doc += 'const jaehrliche_afa = gebaeude_wert * afa_rate;\n';
    doc += '// = 300.000€ × 0,02 = 6.000€ pro Jahr\n';
    doc += '\n';
    doc += '// SCHRITT 4: Erstes Jahr ANTEILIG (ab Kaufmonat)\n';
    doc += 'const purchase_date = new Date("2024-04-15");\n';
    doc += 'const purchase_month = purchase_date.getMonth() + 1; // 4 = April\n';
    doc += 'const monate_im_ersten_jahr = 12 - purchase_month + 1;\n';
    doc += '// = 12 - 4 + 1 = 9 Monate (April bis Dezember)\n';
    doc += '\n';
    doc += 'const afa_erstes_jahr = jaehrliche_afa * (monate_im_ersten_jahr / 12);\n';
    doc += '// = 6.000€ × (9/12) = 4.500€ für 2024\n';
    doc += '\n';
    doc += '// SCHRITT 5: Folgejahre (Jahr 2-50)\n';
    doc += 'for (let year = 1; year <= nutzungsdauer; year++) {\n';
    doc += '  if (year === 1) {\n';
    doc += '    afa_betrag = afa_erstes_jahr; // 4.500€\n';
    doc += '  } else if (year === nutzungsdauer) {\n';
    doc += '    // Letztes Jahr: Rest-AfA\n';
    doc += '    afa_betrag = jaehrliche_afa * ((12 - monate_im_ersten_jahr) / 12);\n';
    doc += '    // = 6.000€ × (3/12) = 1.500€ im Jahr 2074\n';
    doc += '  } else {\n';
    doc += '    afa_betrag = jaehrliche_afa; // 6.000€\n';
    doc += '  }\n';
    doc += '  \n';
    doc += '  await AfASchedule.create({\n';
    doc += '    building_id: building.id,\n';
    doc += '    year: purchase_date.getFullYear() + year - 1,\n';
    doc += '    afa_amount: afa_betrag,\n';
    doc += '    basis_value: gebaeude_wert,\n';
    doc += '    afa_rate: afa_rate,\n';
    doc += '    description: `AfA Gebäude Jahr ${year}/${nutzungsdauer}`\n';
    doc += '  });\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Beispiel-Rechnung (komplett)**:\n';
    doc += '```\n';
    doc += 'KAUFDATEN:\n';
    doc += '  Kaufpreis gesamt:    450.000€\n';
    doc += '  Grundstückswert:     150.000€\n';
    doc += '  Gebäudewert:         300.000€\n';
    doc += '  Kaufdatum:           15.04.2024\n';
    doc += '\n';
    doc += 'AfA-BERECHNUNG:\n';
    doc += '  Nutzungsdauer:       50 Jahre\n';
    doc += '  AfA-Satz:            2% pro Jahr\n';
    doc += '  Jährliche AfA:       6.000€ (300.000€ ÷ 50)\n';
    doc += '\n';
    doc += 'JAHR 2024 (Erstes Jahr, anteilig):\n';
    doc += '  Monate:              9 (April-Dezember)\n';
    doc += '  AfA 2024:            4.500€ (6.000€ × 9/12)\n';
    doc += '\n';
    doc += 'JAHR 2025-2073 (Jahre 2-50):\n';
    doc += '  AfA pro Jahr:        6.000€\n';
    doc += '\n';
    doc += 'JAHR 2074 (Letztes Jahr, Restmonat):\n';
    doc += '  Monate:              3 (Januar-März)\n';
    doc += '  AfA 2074:            1.500€ (6.000€ × 3/12)\n';
    doc += '\n';
    doc += 'GESAMT:\n';
    doc += '  AfA 50 Jahre:        300.000€ (komplett abgeschrieben)\n';
    doc += '  Restbuchwert 2074:   0€\n';
    doc += '```\n\n';
    doc += '**Sonderfälle**:\n';
    doc += '- **Kauf am 31.12.**: Nur 1 Monat AfA im ersten Jahr (Dezember)\n';
    doc += '- **Kauf am 01.01.**: 12 Monate AfA im ersten Jahr (ganzes Jahr)\n';
    doc += '- **Gewerbeimmobilie**: AfA-Satz 3% (33 Jahre) statt 2%\n';
    doc += '- **Denkmalschutz**: Sonder-AfA 9% über 8 Jahre für Modernisierungskosten\n';
    doc += '- **Gemischt-Nutzung**: Separate AfA für Wohn- und Gewerbeanteil\n';
    doc += '  ```javascript\n';
    doc += '  wohn_anteil = 200 / 300; // 200m² Wohnung von 300m² gesamt\n';
    doc += '  gewerbe_anteil = 100 / 300; // 100m² Gewerbe\n';
    doc += '  \n';
    doc += '  afa_wohnen = gebaeude_wert × wohn_anteil × 0.02;\n';
    doc += '  // = 300.000€ × 0,667 × 0,02 = 4.000€\n';
    doc += '  \n';
    doc += '  afa_gewerbe = gebaeude_wert × gewerbe_anteil × 0.03;\n';
    doc += '  // = 300.000€ × 0,333 × 0,03 = 3.000€\n';
    doc += '  \n';
    doc += '  afa_gesamt = 4.000€ + 3.000€ = 7.000€ pro Jahr\n';
    doc += '  ```\n\n';
    doc += '**Rundungsregeln**:\n';
    doc += '- AfA-Betrag: Auf 2 Nachkommastellen (Cent-genau)\n';
    doc += '- Basis-Wert: Auf 2 Nachkommastellen\n';
    doc += '- Prozentsatz: Exakt (0,02 = 2,00%)\n';
    doc += '- Bei Cent-Differenzen (Rundungsfehler): Im letzten Jahr ausgleichen\n\n';
    doc += '**Rechtliche Grundlage**:\n';
    doc += '- §7 Abs. 4 EStG: AfA für Gebäude\n';
    doc += '- Nr. 2a: Wohngebäude 2% (seit 2006, davor 2,5%)\n';
    doc += '- Nr. 1: Andere Gebäude 3%\n';
    doc += '- §7i EStG: Sonder-AfA für Baudenkmale\n';
    doc += '- R 7.4 EStR: AfA-Bemessungsgrundlage (ohne Grund und Boden)\n\n';
    
    doc += '---\n\n';
    
    // B) BETRIEBSKOSTEN-LOGIK
    doc += '# B) BETRIEBSKOSTEN-LOGIK\n\n';
    
    doc += '## B.1 UMLAGEFÄHIGKEIT (nach BetrKV)\n\n';
    
    doc += '### REGEL B1.1: Betriebskosten-Katalog (§2 BetrKV)\n\n';
    doc += '**Identifikation**:\n';
    doc += '- Regel-ID: `VAL_BETRKV_UMLEGBAR`\n';
    doc += '- Modul: Betriebskosten / Rechnungserfassung\n';
    doc += '- Betroffene Felder: `CostCategory.allocatable`\n\n';
    doc += '**Regel-Beschreibung**:\n';
    doc += '- **Was**: Nur Kosten aus §2 BetrKV dürfen auf Mieter umgelegt werden\n';
    doc += '- **Wann**: Bei OperatingCostStatement-Erstellung (Kosten-Auswahl)\n';
    doc += '- **Wer**: System (automatische Prüfung via CostCategory.allocatable)\n\n';
    doc += '**Validierungs-Details**:\n';
    doc += '- Art: Rechtliche Geschäftsregel (§556 BGB + BetrKV)\n';
    doc += '- Stufe: ⚠️ WARNING (User kann trotzdem umlegen, aber rechtlich falsch)\n';
    doc += '- Fehlermeldung: "⚠️ Hausverwaltung ist NICHT umlagefähig (§1 Abs. 2 Nr. 1 BetrKV). Diese Kosten dürfen nicht auf Mieter umgelegt werden!"\n';
    doc += '- Hilfetext: "Hausverwaltung ist Vermieter-Sache. Stattdessen als Werbungskosten in Anlage V Zeile 39 ansetzen."\n\n';
    doc += '**Umlagefähige Kosten (Checkliste)**:\n';
    doc += '```\n';
    doc += '✅ UMLAGEFÄHIG (§2 BetrKV):\n';
    doc += '  Nr. 1:  Grundsteuer\n';
    doc += '  Nr. 2:  Wasserversorgung\n';
    doc += '  Nr. 3:  Entwässerung (Abwasser)\n';
    doc += '  Nr. 4:  Heizung (Brennstoff + Betrieb)\n';
    doc += '  Nr. 5:  Aufzug (Strom + Wartung)\n';
    doc += '  Nr. 6:  Straßenreinigung + Müllabfuhr\n';
    doc += '  Nr. 7:  Gebäudereinigung (nur Gemeinschaftsflächen!)\n';
    doc += '  Nr. 8:  Gartenpflege\n';
    doc += '  Nr. 9:  Beleuchtung (Allgemeinflächen)\n';
    doc += '  Nr. 10: Schornsteinfeger\n';
    doc += '  Nr. 11: Sach- und Haftpflichtversicherung\n';
    doc += '  Nr. 12: Hausmeister\n';
    doc += '  Nr. 13: Gemeinschaftsantenne / Breitband\n';
    doc += '  Nr. 14: Waschküche\n';
    doc += '  Nr. 15: Sonstige (nur wenn vergleichbar!)\n';
    doc += '\n';
    doc += '❌ NICHT UMLAGEFÄHIG (§1 Abs. 2 BetrKV):\n';
    doc += '  Nr. 1:  Verwaltungskosten (Hausverwaltung)\n';
    doc += '  Nr. 2:  Instandhaltung & Instandsetzung\n';
    doc += '  Nr. 3:  Kontoführungsgebühren\n';
    doc += '  -       Rechtsanwaltskosten\n';
    doc += '  -       Steuerberatung\n';
    doc += '  -       Mietausfallversicherung\n';
    doc += '  -       Finanzierungskosten (Zinsen)\n';
    doc += '```\n\n';
    doc += '**Rechtliche Grundlage**:\n';
    doc += '- §556 Abs. 1 BGB: "Betriebskosten sind ... Kosten des Gebrauchs"\n';
    doc += '- §2 BetrKV: Abschließende Aufzählung (numerus clausus!)\n';
    doc += '- §1 Abs. 2 BetrKV: Nicht umlagefähig (Verwaltung, Instandhaltung)\n\n';
    
    doc += '### REGEL B1.2: Verteilerschlüssel-Berechnung (Fläche)\n\n';
    doc += '**Identifikation**:\n';
    doc += '- Regel-ID: `CALC_NK_FLAECHE`\n';
    doc += '- Modul: Betriebskosten\n';
    doc += '- Betroffene Entities: `OperatingCostStatementItem`\n\n';
    doc += '**Berechnung (vollständig)**:\n';
    doc += '```javascript\n';
    doc += '// GEGEBEN:\n';
    doc += 'const gesamtkosten = 1200; // Grundsteuer für ganzes Gebäude\n';
    doc += 'const units = [\n';
    doc += '  { name: "Whg. 1", flaeche: 65.5 },\n';
    doc += '  { name: "Whg. 2", flaeche: 65.0 },\n';
    doc += '  { name: "Whg. 3", flaeche: 70.0 },\n';
    doc += '  { name: "Whg. 4", flaeche: 75.0 },\n';
    doc += '  { name: "Whg. 5", flaeche: 60.0 },\n';
    doc += '  { name: "Whg. 6", flaeche: 18.5 } // Souterrain\n';
    doc += '];\n';
    doc += '\n';
    doc += '// SCHRITT 1: Gesamt-Wohnfläche\n';
    doc += 'const gesamt_flaeche = units.reduce((sum, u) => sum + u.flaeche, 0);\n';
    doc += '// = 65,5 + 65 + 70 + 75 + 60 + 18,5 = 354 m²\n';
    doc += '\n';
    doc += '// SCHRITT 2: Anteil pro Wohnung berechnen\n';
    doc += 'for (const unit of units) {\n';
    doc += '  const anteil = unit.flaeche / gesamt_flaeche;\n';
    doc += '  const kosten = gesamtkosten * anteil;\n';
    doc += '  \n';
    doc += '  // Beispiel Whg. 1:\n';
    doc += '  // anteil = 65,5 / 354 = 0,185 = 18,5%\n';
    doc += '  // kosten = 1.200€ × 0,185 = 222,00€\n';
    doc += '  \n';
    doc += '  console.log(`${unit.name}: ${anteil.toFixed(3)} (${(anteil*100).toFixed(1)}%) = ${kosten.toFixed(2)}€`);\n';
    doc += '}\n';
    doc += '\n';
    doc += '// AUSGABE:\n';
    doc += '// Whg. 1: 0,185 (18,5%) = 222,00€\n';
    doc += '// Whg. 2: 0,184 (18,4%) = 220,34€\n';
    doc += '// Whg. 3: 0,198 (19,8%) = 237,29€\n';
    doc += '// Whg. 4: 0,212 (21,2%) = 254,24€\n';
    doc += '// Whg. 5: 0,169 (16,9%) = 203,39€\n';
    doc += '// Whg. 6: 0,052 (5,2%)  =  62,71€\n';
    doc += '// ────────────────────────────────\n';
    doc += '// SUMME:                 1.199,97€ (Rundungsdifferenz 0,03€)\n';
    doc += '```\n\n';
    doc += '**Rundungsregeln**:\n';
    doc += '- Anteile: Auf 5 Nachkommastellen berechnen (0,18502)\n';
    doc += '- Kosten pro Wohnung: Auf 2 Nachkommastellen runden (Cent-genau)\n';
    doc += '- Rundungsdifferenz: Im letzten Item ausgleichen (damit Summe exakt stimmt)\n';
    doc += '```javascript\n';
    doc += 'const calculated_sum = items.reduce((sum, i) => sum + i.kosten, 0);\n';
    doc += 'const diff = gesamtkosten - calculated_sum;\n';
    doc += 'if (Math.abs(diff) > 0.01) {\n';
    doc += '  items[items.length - 1].kosten += diff;\n';
    doc += '  items[items.length - 1].note = "Inkl. Rundungsausgleich";\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Sonderfälle**:\n';
    doc += '- **Wohnung ohne Fläche**: ❌ BLOCKER "Unit.flaeche fehlt - Abrechnung unmöglich"\n';
    doc += '- **Nur 1 Wohnung**: Anteil = 100% (Verteilung trotzdem korrekt dokumentieren)\n';
    doc += '- **Gewerbeflächen**: Manchmal getrennt abrechnen (wenn Gewerbe höhere Kosten verursacht)\n\n';
    doc += '**Rechtliche Grundlage**:\n';
    doc += '- §556a BGB: Vereinbarung über Betriebskosten\n';
    doc += '- BetrKV Anlage: Verteilerschlüssel (Wohnfläche ist häufigster)\n';
    doc += '- BGH-Urteil VIII ZR 137/11: Wohnfläche nach WoFlV (nicht Nutzfläche!)\n\n';
    
    doc += '### REGEL B1.3: Abrechnungszeitraum (12 Monate)\n\n';
    doc += '**Identifikation**:\n';
    doc += '- Regel-ID: `VAL_NK_ZEITRAUM`\n';
    doc += '- Modul: Betriebskosten\n';
    doc += '- Betroffene Felder: `OperatingCostStatement.period_start`, `period_end`\n\n';
    doc += '**Regel-Beschreibung**:\n';
    doc += '- **Was**: Abrechnungszeitraum muss exakt 12 Monate betragen\n';
    doc += '- **Wann**: Bei OperatingCostStatement CREATE (Step 1 im Wizard)\n';
    doc += '- **Wer**: System (automatische Validierung)\n\n';
    doc += '**Validierungs-Details**:\n';
    doc += '- Art: Rechtliche Vorgabe\n';
    doc += '- Stufe: ❌ BLOCKER\n';
    doc += '- Fehlermeldung: "Abrechnungszeitraum muss exakt 12 Monate betragen. Aktuell: 11 Monate (01.01.2023 - 30.11.2023). Bitte Enddatum auf 31.12.2023 setzen."\n';
    doc += '- Hilfetext: "Gesetzlich vorgeschrieben: Betriebskostenabrechnung immer für 12 Monate (§556 Abs. 3 BGB). Kürzere Zeiträume nur bei Mieterwechsel."\n\n';
    doc += '**Berechnung**:\n';
    doc += '```javascript\n';
    doc += 'function validateAbrechnungszeitraum(period_start, period_end) {\n';
    doc += '  const start = new Date(period_start);\n';
    doc += '  const end = new Date(period_end);\n';
    doc += '  \n';
    doc += '  // Monate zwischen Start und Ende\n';
    doc += '  const months = (end.getFullYear() - start.getFullYear()) * 12 + \n';
    doc += '                 (end.getMonth() - start.getMonth()) + 1;\n';
    doc += '  \n';
    doc += '  // Beispiel: 01.01.2023 bis 31.12.2023\n';
    doc += '  // = (2023 - 2023) × 12 + (11 - 0) + 1 = 12 Monate ✅\n';
    doc += '  \n';
    doc += '  if (months !== 12) {\n';
    doc += '    return {\n';
    doc += '      valid: false,\n';
    doc += '      error: `Abrechnungszeitraum muss 12 Monate sein (aktuell: ${months} Monate)`\n';
    doc += '    };\n';
    doc += '  }\n';
    doc += '  \n';
    doc += '  // Zusätzlich: Enddatum muss Monatsende sein\n';
    doc += '  const last_day_of_month = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();\n';
    doc += '  if (end.getDate() !== last_day_of_month) {\n';
    doc += '    return {\n';
    doc += '      valid: false,\n';
    doc += '      warning: "Enddatum sollte Monatsende sein (z.B. 31.12.2023, nicht 30.12.2023)"\n';
    doc += '    };\n';
    doc += '  }\n';
    doc += '  \n';
    doc += '  return { valid: true };\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Sonderfälle**:\n';
    doc += '- **Mieterwechsel**: Kürzerer Zeitraum erlaubt (z.B. 01.05.2023 - 31.10.2023 = 6 Monate)\n';
    doc += '- **Schaltjahr**: Februar hat 29 Tage → berücksichtigen\n';
    doc += '- **Jahreswechsel**: 01.01. - 31.12. ist üblich, aber 01.07.2023 - 30.06.2024 auch OK\n\n';
    doc += '**Rechtliche Grundlage**:\n';
    doc += '- §556 Abs. 3 BGB: Jährliche Abrechnung\n';
    doc += '- BGH-Urteil VIII ZR 78/08: Abrechnungszeitraum = 12 Monate\n\n';
    
    doc += '### REGEL B1.4: Vorauszahlungen vs. Ist-Kosten\n\n';
    doc += '**Identifikation**:\n';
    doc += '- Regel-ID: `CALC_NK_SALDO`\n';
    doc += '- Modul: Betriebskosten\n';
    doc += '- Betroffene Felder: `OperatingCostStatementItem.balance`\n\n';
    doc += '**Berechnung (komplett)**:\n';
    doc += '```javascript\n';
    doc += '// GEGEBEN (pro Mieter):\n';
    doc += 'const contract = {\n';
    doc += '  utilities: 150,  // NK-Vorauszahlung pro Monat\n';
    doc += '  heating: 80,     // Heizkosten-Vorauszahlung pro Monat\n';
    doc += '  start_date: "2023-01-01",\n';
    doc += '  end_date: null   // unbefristet\n';
    doc += '};\n';
    doc += 'const abrechnungsjahr = 2023;\n';
    doc += 'const allocated_costs = 836.90; // Anteil an Gesamt-Betriebskosten (nach Fläche)\n';
    doc += '\n';
    doc += '// SCHRITT 1: Monate im Abrechnungsjahr\n';
    doc += 'const months = calculateMonthsInYear(contract, abrechnungsjahr);\n';
    doc += '// = 12 (Vertrag lief ganzes Jahr)\n';
    doc += '\n';
    doc += '// SCHRITT 2: Geleistete Vorauszahlungen\n';
    doc += 'const monthly_prepayment = contract.utilities + contract.heating;\n';
    doc += '// = 150€ + 80€ = 230€ pro Monat\n';
    doc += '\n';
    doc += 'const total_prepayments = monthly_prepayment * months;\n';
    doc += '// = 230€ × 12 = 2.760€\n';
    doc += '\n';
    doc += '// SCHRITT 3: Saldo berechnen\n';
    doc += 'const balance = allocated_costs - total_prepayments;\n';
    doc += '// = 836,90€ - 2.760€ = -1.923,10€\n';
    doc += '\n';
    doc += '// SCHRITT 4: Interpretation\n';
    doc += 'if (balance > 0) {\n';
    doc += '  result = "NACHZAHLUNG";\n';
    doc += '  text = `Der Mieter muss ${balance.toFixed(2)}€ nachzahlen.`;\n';
    doc += '} else if (balance < 0) {\n';
    doc += '  result = "GUTHABEN";\n';
    doc += '  text = `Der Mieter erhält ${Math.abs(balance).toFixed(2)}€ zurück.`;\n';
    doc += '} else {\n';
    doc += '  result = "AUSGEGLICHEN";\n';
    doc += '  text = "Exakt ausgeglichen (0,00€ Differenz).";\n';
    doc += '}\n';
    doc += '\n';
    doc += '// BEISPIEL-AUSGABE:\n';
    doc += '// "GUTHABEN: Der Mieter erhält 1.923,10€ zurück."\n';
    doc += '```\n\n';
    doc += '**Beispiel-Rechnung (anteilige Vermietung)**:\n';
    doc += '```\n';
    doc += 'SZENARIO: Mieter zieht am 01.05.2023 ein\n';
    doc += '\n';
    doc += 'Vertrag: start_date = 01.05.2023, end_date = null\n';
    doc += 'Monate im Abrechnungsjahr 2023: Mai-Dezember = 8 Monate\n';
    doc += '\n';
    doc += 'Anteil an Jahreskosten:\n';
    doc += '  Grundsteuer 1.200€ → 18,5% = 222€ (ganzes Jahr)\n';
    doc += '  ABER: Vertrag nur 8 Monate → 222€ × (8/12) = 148€\n';
    doc += '\n';
    doc += 'Vorauszahlungen:\n';
    doc += '  230€/Monat × 8 Monate = 1.840€\n';
    doc += '\n';
    doc += 'Saldo:\n';
    doc += '  148€ - 1.840€ = -1.692€ GUTHABEN\n';
    doc += '  (Mieter hat zu viel bezahlt, weil Kosten niedriger waren)\n';
    doc += '```\n\n';
    doc += '**Sonderfälle**:\n';
    doc += '- **Vorauszahlungen 0**: Wenn utilities=0 und heating=0 → Komplett-Nachzahlung\n';
    doc += '- **Mehrere Mieterwechsel**: Pro Mieter separate Abrechnung für seinen Zeitraum\n';
    doc += '- **Kaution-Verrechnung**: Guthaben kann mit Kaution verrechnet werden (optional)\n\n';
    doc += '**Rundungsregeln**:\n';
    doc += '- Alle Beträge: Auf 2 Nachkommastellen (Cent-genau)\n';
    doc += '- Prozentsätze: Auf 1 Nachkommastelle (z.B. 18,5%)\n';
    doc += '- Endsummen: Exakte Übereinstimmung mit Gesamtkosten (Rundungsdifferenz ausgleichen)\n\n';
    
    doc += '---\n\n';
    
    doc += '# C) MIETRECHT-VALIDIERUNGEN\n\n';
    
    doc += '## C.1 KAUTION-REGELN\n\n';
    
    doc += '### REGEL C1.1: Kautions-Obergrenze (3 Monatsmieten)\n\n';
    doc += '**Identifikation**:\n';
    doc += '- Regel-ID: `VAL_KAUTION_MAX`\n';
    doc += '- Modul: Mieterverwaltung\n';
    doc += '- Betroffene Felder: `LeaseContract.deposit`, `LeaseContract.base_rent`\n\n';
    doc += '**Regel-Beschreibung**:\n';
    doc += '- **Was**: Kaution darf maximal 3 Monatsmieten (Kaltmiete) betragen\n';
    doc += '- **Wann**: Bei LeaseContract CREATE/UPDATE (Live-Validierung im Formular)\n';
    doc += '- **Wer**: Alle User\n\n';
    doc += '**Validierungs-Details**:\n';
    doc += '- Art: Rechtliche Obergrenze\n';
    doc += '- Stufe: ⚠️ WARNING (Speichern möglich, aber rechtlich ungültig!)\n';
    doc += '- Fehlermeldung: "⚠️ Kaution überschreitet gesetzliche Obergrenze! Maximum: 2.400€ (3 × 800€ Kaltmiete). Aktuell: 3.000€. Überschreitung: 600€. Mietvertrag könnte unwirksam sein!"\n';
    doc += '- Hilfetext: "Gesetzliche Regelung: Kaution max. 3 Monatsmieten ohne Nebenkosten (§551 Abs. 1 BGB). Höhere Kautionen sind nichtig. Empfehlung: Auf 2.400€ reduzieren."\n\n';
    doc += '**Berechnung**:\n';
    doc += '```javascript\n';
    doc += 'const base_rent = 800;  // Kaltmiete (OHNE Nebenkosten!)\n';
    doc += 'const deposit = 3000;   // Vom User eingegeben\n';
    doc += '\n';
    doc += 'const max_deposit = base_rent * 3;\n';
    doc += '// = 800€ × 3 = 2.400€\n';
    doc += '\n';
    doc += 'if (deposit > max_deposit) {\n';
    doc += '  const ueberschreitung = deposit - max_deposit;\n';
    doc += '  // = 3.000€ - 2.400€ = 600€\n';
    doc += '  \n';
    doc += '  return {\n';
    doc += '    valid: false,\n';
    doc += '    level: "WARNING",\n';
    doc += '    max_allowed: max_deposit.toFixed(2),\n';
    doc += '    current: deposit.toFixed(2),\n';
    doc += '    excess: ueberschreitung.toFixed(2)\n';
    doc += '  };\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Sonderfälle**:\n';
    doc += '- **WG-Verträge**: Kaution gilt pro Vertrag, nicht pro Person (3× Kaltmiete, egal ob 1 oder 3 Mieter)\n';
    doc += '- **Staffelmiete**: Kaution basiert auf Anfangsmiete (nicht spätere erhöhte Miete)\n';
    doc += '- **Gewerbe**: Keine gesetzliche Obergrenze (6-12 Monatsmieten üblich)\n';
    doc += '- **Kaution = 0**: Erlaubt (aber unüblich) → ℹ️ INFO "Kaution fehlt - bei Schäden keine Sicherheit"\n\n';
    doc += '**Rechtliche Grundlage**:\n';
    doc += '- §551 Abs. 1 BGB: Kaution höchstens 3 Monatsmieten\n';
    doc += '- "Miete" = Kaltmiete (OHNE Betriebs- und Heizkosten)\n';
    doc += '- BGH-Urteil VIII ZR 78/11: Höhere Kaution ist nichtig (Mieter kann zurückfordern)\n\n';
    
    doc += '---\n\n';
    
    doc += '# D) FRISTEN & TERMINE\n\n';
    
    doc += '## D.1 KÜNDIGUNGSFRISTEN\n\n';
    
    doc += '### REGEL D1.1: Letzter Miettag bei Kündigung\n\n';
    doc += '**Identifikation**:\n';
    doc += '- Regel-ID: `CALC_KUENDIGUNG_ENDDATUM`\n';
    doc += '- Modul: Mieterverwaltung\n';
    doc += '- Betroffene Felder: `LeaseContract.termination_date`, `notice_period_months`\n\n';
    doc += '**Berechnung (vollständig)**:\n';
    doc += '```javascript\n';
    doc += '// GEGEBEN:\n';
    doc += 'const termination_date = new Date("2024-01-15"); // Kündigung eingegangen\n';
    doc += 'const notice_period_months = 3; // Kündigungsfrist\n';
    doc += '\n';
    doc += '// SCHRITT 1: Frühest-mögliches Kündigungsdatum\n';
    doc += '// = Ende des übernächsten Monats (bei 3 Monaten Frist)\n';
    doc += 'const earliest_end = new Date(termination_date);\n';
    doc += 'earliest_end.setMonth(earliest_end.getMonth() + notice_period_months);\n';
    doc += 'earliest_end.setDate(0); // Letzter Tag des Vormonats = Monatsende\n';
    doc += '// Beispiel: 15.01.2024 + 3 Monate = 15.04.2024 → Monatsende = 30.04.2024\n';
    doc += '\n';
    doc += '// ALTERNATIVE Berechnung (präziser):\n';
    doc += 'function calculateLastRentDay(termination_date, notice_period_months) {\n';
    doc += '  const kündigung = new Date(termination_date);\n';
    doc += '  \n';
    doc += '  // Zum nächsten Monatswechsel\n';
    doc += '  kündigung.setMonth(kündigung.getMonth() + 1);\n';
    doc += '  kündigung.setDate(1); // 1. des Folgemonats\n';
    doc += '  \n';
    doc += '  // + Kündigungsfrist\n';
    doc += '  kündigung.setMonth(kündigung.getMonth() + notice_period_months - 1);\n';
    doc += '  \n';
    doc += '  // Letzter Tag dieses Monats\n';
    doc += '  const last_day = new Date(kündigung.getFullYear(), kündigung.getMonth() + 1, 0);\n';
    doc += '  return last_day;\n';
    doc += '}\n';
    doc += '\n';
    doc += '// BEISPIELE:\n';
    doc += '// Kündigung 15.01.2024, Frist 3 Monate:\n';
    doc += '//   → 01.02. + 3 Monate - 1 = 01.04.\n';
    doc += '//   → Monatsende 30.04.2024 ✅\n';
    doc += '\n';
    doc += '// Kündigung 31.01.2024, Frist 3 Monate:\n';
    doc += '//   → 01.02. + 3 Monate - 1 = 01.04.\n';
    doc += '//   → Monatsende 30.04.2024 ✅ (gleich!)\n';
    doc += '\n';
    doc += '// Kündigung 01.02.2024, Frist 3 Monate:\n';
    doc += '//   → 01.03. + 3 Monate - 1 = 01.05.\n';
    doc += '//   → Monatsende 31.05.2024 ✅\n';
    doc += '```\n\n';
    doc += '**Beispiel-Rechnung**:\n';
    doc += '```\n';
    doc += 'INPUT:\n';
    doc += '  Kündigungsdatum:     15.01.2024 (Kündigung eingegangen)\n';
    doc += '  Kündigungsfrist:     3 Monate\n';
    doc += '\n';
    doc += 'BERECHNUNG:\n';
    doc += '  1. Nächster Monatswechsel:    01.02.2024\n';
    doc += '  2. + Kündigungsfrist (3M):    01.05.2024\n';
    doc += '  3. - 1 Monat (Korrektur):     01.04.2024\n';
    doc += '  4. Monatsende:                30.04.2024\n';
    doc += '\n';
    doc += 'OUTPUT:\n';
    doc += '  Letzter Miettag:     30.04.2024 ✅\n';
    doc += '  Letzter Mietzahltag: 03.05.2024 (rent_due_day=3 im Mai)\n';
    doc += '  Übergabe:            30.04.2024 oder früher\n';
    doc += '```\n\n';
    doc += '**Sonderfälle**:\n';
    doc += '- **Fristlose Kündigung**: notice_period_months = 0 → Sofort (oder 2 Wochen)\n';
    doc += '- **Staffelung nach Mietdauer** (§573c BGB):\n';
    doc += '  - 0-5 Jahre Mietdauer: 3 Monate\n';
    doc += '  - 5-8 Jahre: 6 Monate\n';
    doc += '  - >8 Jahre: 9 Monate\n';
    doc += '  → User muss korrekte Frist eingeben (nicht automatisch)\n';
    doc += '- **Kündigung zum 3. Werktag** (selten): Sonderregel nicht implementiert\n\n';
    doc += '**Rechtliche Grundlage**:\n';
    doc += '- §573c BGB: Kündigungsfristen (Staffelung nach Mietdauer)\n';
    doc += '- §573d BGB: Kündigungsfrist zum Monatsende\n';
    doc += '- BGH-Urteil VIII ZR 217/11: Kündigung muss spätestens am 3. Werktag zugehen\n\n';
    
    doc += '---\n\n';
    
    doc += '# E) FINANZIELLE PLAUSIBILITÄTEN\n\n';
    
    doc += '## E.1 BETRAGS-VALIDIERUNGEN\n\n';
    
    doc += '### REGEL E1.1: Miete Plausibilität\n\n';
    doc += '**Identifikation**:\n';
    doc += '- Regel-ID: `VAL_RENT_PLAUSIBILITY`\n';
    doc += '- Modul: Mieterverwaltung\n';
    doc += '- Betroffene Felder: `LeaseContract.base_rent`, `Unit.flaeche`\n\n';
    doc += '**Regel-Beschreibung**:\n';
    doc += '- **Was**: Miete pro m² sollte in plausiblem Bereich liegen (5-25€/m²)\n';
    doc += '- **Wann**: Bei LeaseContract CREATE/UPDATE (nach Eingabe base_rent)\n';
    doc += '- **Wer**: Alle User\n\n';
    doc += '**Validierungs-Details**:\n';
    doc += '- Art: Plausibilitätsprüfung\n';
    doc += '- Stufe: ⚠️ WARNING\n';
    doc += '- Fehlermeldung (niedrig): "⚠️ Miete ungewöhnlich niedrig: 3,50€/m². Üblich: 8-15€/m² (abhängig von Lage). Tippfehler?"\n';
    doc += '- Fehlermeldung (hoch): "⚠️ Miete sehr hoch: 22,00€/m². Mietpreisbremse prüfen! In Ballungsgebieten oft Obergrenze bei 15-18€/m²."\n';
    doc += '- Hilfetext: "Prüfen: Ist die Miete korrekt? Bei Neuvermietung: Mietspiegel konsultieren."\n\n';
    doc += '**Berechnung**:\n';
    doc += '```javascript\n';
    doc += 'const base_rent = 800;   // Kaltmiete\n';
    doc += 'const flaeche = 65.5;    // Wohnfläche\n';
    doc += '\n';
    doc += 'const qm_preis = base_rent / flaeche;\n';
    doc += '// = 800€ / 65,5m² = 12,21€/m²\n';
    doc += '\n';
    doc += '// Plausibilitäts-Grenzen (abhängig von Region - hier Durchschnitt)\n';
    doc += 'const MIN_QM_PREIS = 5;   // Sehr niedrig (Ländlich, kleiner Ort)\n';
    doc += 'const MAX_QM_PREIS = 25;  // Sehr hoch (München, Frankfurt)\n';
    doc += 'const TYPICAL_MIN = 8;    // Typisch für Durchschnitt\n';
    doc += 'const TYPICAL_MAX = 15;   // Typisch für Durchschnitt\n';
    doc += '\n';
    doc += 'if (qm_preis < MIN_QM_PREIS) {\n';
    doc += '  return { level: "WARNING", message: `Extrem niedrig: ${qm_preis.toFixed(2)}€/m²` };\n';
    doc += '} else if (qm_preis < TYPICAL_MIN) {\n';
    doc += '  return { level: "INFO", message: `Niedrig: ${qm_preis.toFixed(2)}€/m²` };\n';
    doc += '} else if (qm_preis > MAX_QM_PREIS) {\n';
    doc += '  return { level: "WARNING", message: `Extrem hoch: ${qm_preis.toFixed(2)}€/m²` };\n';
    doc += '} else if (qm_preis > TYPICAL_MAX) {\n';
    doc += '  return { level: "INFO", message: `Hoch: ${qm_preis.toFixed(2)}€/m² - Mietpreisbremse prüfen` };\n';
    doc += '}\n';
    doc += '\n';
    doc += 'return { valid: true, qm_preis: qm_preis.toFixed(2) };\n';
    doc += '```\n\n';
    doc += '**Rechtliche Grundlage**:\n';
    doc += '- Keine direkte (Plausibilitätsprüfung für User-Hilfe)\n';
    doc += '- Mietpreisbremse §556d BGB: Bei Wiedervermietung max. 10% über ortsüblicher Vergleichsmiete\n';
    doc += '- Mietspiegel: Referenz für Plausibilität (regional unterschiedlich)\n\n';
    
    doc += '---\n\n';
    
    doc += '# F) DOKUMENTEN-VALIDIERUNGEN\n\n';
    
    doc += '## F.1 PFLICHTANGABEN IN VORLAGEN\n\n';
    
    doc += '### REGEL F1.1: Betriebskosten-Abrechnung Pflichtangaben\n\n';
    doc += '**Identifikation**:\n';
    doc += '- Regel-ID: `VAL_NK_PFLICHTANGABEN`\n';
    doc += '- Modul: Dokumentenverwaltung / Betriebskosten\n';
    doc += '- Template: "Betriebskostenabrechnung"\n\n';
    doc += '**Pflichtangaben (§556 Abs. 3 BGB)**:\n';
    doc += '1. ✅ Abrechnungszeitraum (12 Monate, Beginn + Ende)\n';
    doc += '2. ✅ Gesamtkosten des Objekts (Aufstellung aller Positionen)\n';
    doc += '3. ✅ Verteilerschlüssel (wie wurden Kosten verteilt? qm, Personen, etc.)\n';
    doc += '4. ✅ Anteil des Mieters (Prozent oder absolut)\n';
    doc += '5. ✅ Kosten des Mieters (nach Umlageschlüssel berechnet)\n';
    doc += '6. ✅ Geleistete Vorauszahlungen (monatliche Vorauszahlung × 12)\n';
    doc += '7. ✅ Nachzahlung/Guthaben (Ist-Kosten minus Vorauszahlungen)\n';
    doc += '8. ✅ Frist für Widerspruch (12 Monate ab Zugang)\n\n';
    doc += '**Validierung beim Generieren**:\n';
    doc += '```javascript\n';
    doc += 'function validateNKAbrechnungTemplate(data) {\n';
    doc += '  const errors = [];\n';
    doc += '  \n';
    doc += '  if (!data.period_start || !data.period_end) {\n';
    doc += '    errors.push("❌ Abrechnungszeitraum fehlt");\n';
    doc += '  }\n';
    doc += '  \n';
    doc += '  if (!data.cost_items || data.cost_items.length === 0) {\n';
    doc += '    errors.push("❌ Keine Kosten erfasst");\n';
    doc += '  }\n';
    doc += '  \n';
    doc += '  if (!data.verteilerschluessel) {\n';
    doc += '    errors.push("❌ Verteilerschlüssel nicht definiert");\n';
    doc += '  }\n';
    doc += '  \n';
    doc += '  if (data.prepayments === 0 || !data.prepayments) {\n';
    doc += '    errors.push("⚠️ WARNING: Keine Vorauszahlungen - unvollständig");\n';
    doc += '  }\n';
    doc += '  \n';
    doc += '  if (errors.filter(e => e.startsWith("❌")).length > 0) {\n';
    doc += '    return { valid: false, errors };\n';
    doc += '  }\n';
    doc += '  \n';
    doc += '  return { valid: true, warnings: errors.filter(e => e.startsWith("⚠️")) };\n';
    doc += '}\n';
    doc += '```\n\n';
    doc += '**Rechtliche Grundlage**:\n';
    doc += '- §556 Abs. 3 BGB: Formelle Anforderungen an Betriebskostenabrechnung\n';
    doc += '- BGH-Urteil VIII ZR 78/03: Abrechnungen ohne Gesamtkosten sind unwirksam\n';
    doc += '- BGH-Urteil VIII ZR 137/11: Verteilerschlüssel muss erkennbar sein\n\n';
    
    doc += '---\n\n';
    
    doc += '# G) AUTOMATISCHE PROZESSE\n\n';
    
    doc += '## G.1 SCHEDULED TASKS (Zeitgesteuert)\n\n';
    
    doc += '### PROZESS G1.1: Tracking-Codes aktualisieren\n\n';
    doc += '**Identifikation**:\n';
    doc += '- Prozess-ID: `SCHED_LXP_TRACKING`\n';
    doc += '- Funktion: `updateLetterTrackingCodes`\n';
    doc += '- Schedule: Täglich um 12:00 Uhr\n';
    doc += '- Admin-only: ✅ Ja\n\n';
    doc += '**Beschreibung**:\n';
    doc += '```javascript\n';
    doc += '// ABLAUF:\n';
    doc += '1. Alle LetterShipments mit status != "sent" laden\n';
    doc += '2. Für jedes Shipment: LetterXpress API aufrufen (get_job)\n';
    doc += '3. Status + tracking_code aktualisieren\n';
    doc += '4. Bei status="sent":\n';
    doc += '   a. Document.versandstatus = "versendet" setzen\n';
    doc += '   b. Document.versandt_am = now() setzen\n';
    doc += '   c. Notification erstellen: "Dokument zugestellt"\n';
    doc += '5. ActivityLog: "tracking_updated" (Anzahl aktualisiert)\n';
    doc += '\n';
    doc += '// DAUER: ~2-5 Sekunden (bei 10 offenen Shipments)\n';
    doc += '// FREQUENZ: Täglich (einmal)\n';
    doc += '// FEHLERBEHANDLUNG: Bei API-Fehler → Retry morgen (kein Abbruch)\n';
    doc += '```\n\n';
    
    doc += '### PROZESS G1.2: Alte E-Mails löschen (DSGVO)\n\n';
    doc += '**Identifikation**:\n';
    doc += '- Prozess-ID: `SCHED_EMAIL_CLEANUP`\n';
    doc += '- Funktion: `cleanupOldEmails`\n';
    doc += '- Schedule: Wöchentlich Sonntag 02:00 Uhr\n';
    doc += '- Admin-only: ✅ Ja\n\n';
    doc += '**Beschreibung**:\n';
    doc += '```javascript\n';
    doc += '// ABLAUF:\n';
    doc += '1. Cutoff-Datum berechnen (heute - delete_after_days)\n';
    doc += '2. Emails laden WHERE:\n';
    doc += '   - received_date < cutoff\n';
    doc += '   - is_processed = true (nur verarbeitete)\n';
    doc += '   - IMAP-Account hat auto_delete_processed = true\n';
    doc += '3. Pro Email: Email.delete(id)\n';
    doc += '4. ActivityLog: "emails_deleted" (Anzahl)\n';
    doc += '\n';
    doc += '// DAUER: ~5-10 Sekunden (bei 100 Emails)\n';
    doc += '// FREQUENZ: Wöchentlich\n';
    doc += '// FEHLERBEHANDLUNG: Einzelne Fehler loggen, aber fortfahren\n';
    doc += '```\n\n';
    doc += '**Rechtliche Grundlage**:\n';
    doc += '- DSGVO Art. 5 Abs. 1e: Speicherbegrenzung\n';
    doc += '- DSGVO Art. 17: Recht auf Löschung\n';
    doc += '- Standard: 30 Tage Aufbewahrung (konfigurierbar 7-90 Tage)\n\n';
    
    doc += '---\n\n';
    
    doc += '# H) ZUSAMMENFASSUNG ALLER AUTOMATISMEN\n\n';
    
    doc += '## H.1 AUTOMATISCHE BERECHNUNGEN (Echtzeit)\n\n';
    doc += '| Was wird berechnet | Trigger | Formel | Beispiel | Felder betroffen |\n';
    doc += '|-------------------|---------|--------|----------|------------------|\n';
    doc += '| Warmmiete | base_rent ändern | total_rent = base_rent + utilities + heating | 800+150+80=1030€ | LeaseContract.total_rent |\n';
    doc += '| Netto aus Brutto | total_amount ändern | net = total / (1 + tax_rate/100) | 350/(1+0,19)=294,12€ | Invoice.net_amount |\n';
    doc += '| Offener Betrag | paid_amount ändern | outstanding = amount - paid | 300-150=150€ | GeneratedFinancialBooking.outstanding_amount |\n';
    doc += '| Quadratmeterpreis | base_rent, flaeche | qm_preis = base_rent / flaeche | 800/65,5=12,21€ | (nur Anzeige) |\n';
    doc += '| Letzter Miettag | termination_date | siehe Regel D1.1 | 15.01+3M=30.04. | LeaseContract.end_date (calc) |\n';
    doc += '| Kautions-Rate | deposit, installments | rate = deposit / installments | 2400/3=800€ | (nur Anzeige) |\n';
    doc += '| Erhöhung Prozent | new_rent, old_rent | pct = (new-old)/old×100 | (825-750)/750=10% | RentChange.increase_percent |\n';
    doc += '| Monate im Jahr | start, end, year | siehe Regel B1.4 | Mai-Dez=8 | (für NK-Abrechnung) |\n';
    doc += '| AfA-Betrag | purchase_price, land | afa = (price-land)×0,02 | (450k-150k)×2%=6k€ | AfASchedule.afa_amount |\n';
    doc += '| Zinsen (nur Zinsen) | monthly_rate, duration | zinsen = rate×months - loan | 1200×120-100k=44k€ | (Anzeige) |\n\n';
    
    doc += '## H.2 AUTOMATISCHE AKTIONEN (Trigger-basiert)\n\n';
    doc += '| Aktion | Trigger | Bedingung | Was passiert | Dauer |\n';
    doc += '|--------|---------|-----------|--------------|-------|\n';
    doc += '| Buchungen generieren | LeaseContract CREATE | User klickt "Ja" im Dialog | 12× GeneratedFinancialBooking (Mieteinnahmen) | ~2s |\n';
    doc += '| AfA-Plan erstellen | PurchaseContract CREATE | User klickt "Ja" | 50× AfASchedule (jährlich) | ~3s |\n';
    doc += '| Vertrag versionieren | RentChange CREATE | Automatisch | Alte Version archivieren, neue erstellen | ~1s |\n';
    doc += '| Document-Status update | LetterShipment.status="sent" | Automatisch (täglich) | Document.versandstatus="versendet" | <1s |\n';
    doc += '| Notification erstellen | Verschiedene Events | Z.B. Zahlung überfällig | Notification Entity CREATE | <1s |\n';
    doc += '| Task vorschlagen | Email empfangen | ai_analysis_enabled=true | InvokeLLM → Task-Vorschlag | ~5s |\n';
    doc += '| Kategorie vorschlagen | Invoice CREATE (PDF-Upload) | Automatisch (KI) | InvokeLLM → Kategorie-Vorschlag | ~3s |\n';
    doc += '| Matching vorschlagen | BankTransaction Import | Automatisch | AI-Matching mit Bookings | ~10s |\n\n';
    
    doc += '## H.3 ZEITGESTEUERTE PROZESSE (Cron)\n\n';
    doc += '| Prozess | Schedule | Funktion | Zweck | Admin-only |\n';
    doc += '|---------|----------|----------|-------|------------|\n';
    doc += '| Tracking-Update | Täglich 12:00 | updateLetterTrackingCodes | LetterXpress Status abholen | ✅ |\n';
    doc += '| E-Mail Cleanup | Sonntag 02:00 | cleanupOldEmails | Alte Emails löschen (DSGVO) | ✅ |\n';
    doc += '| Dokumentations-Update | Montag 03:00 | updateDocumentation | Entwickler-Doku aktualisieren | ✅ |\n';
    doc += '| finAPI Sync | Täglich 06:00 | finapiSync | Neue Transaktionen importieren | ⚠️ Optional |\n';
    doc += '| Zahlungserinnerungen | Täglich 08:00 | sendPaymentReminders | Überfällige Payments → Email | ⚠️ Geplant |\n';
    doc += '| Monatsabschluss | Monatsletzter 23:00 | monthlyClosing | Statistiken generieren | ⚠️ Geplant |\n\n';
    
    doc += '---\n\n';
    
    doc += '# I) PERFORMANCE-KRITISCHE BERECHNUNGEN\n\n';
    
    doc += '## I.1 GROSSE DATENMENGEN\n\n';
    doc += '| Berechnung | Datenumfang | Komplexität | Dauer | Optimierung |\n';
    doc += '|------------|-------------|-------------|-------|-------------|\n';
    doc += '| Betriebskosten (6 Mieter) | 6 Contracts × 15 Costs = 90 Items | O(n×m) | ~5s | Batch-Insert |\n';
    doc += '| Anlage V (1 Gebäude) | ~500 Invoices × 12 Months | O(n) | ~3s | Index auf invoice_date |\n';
    doc += '| AI-Matching (100 Transactions) | 100 Tx × 50 Bookings = 5.000 Vergleiche | O(n²) | ~15s | LLM-Batch-Call |\n';
    doc += '| AfA-Plan (50 Jahre) | 50 Jahre × 1 Eintrag | O(n) | ~1s | Bulk-Create |\n';
    doc += '| Multi-PDF (6 Mieter) | 6 PDFs á 5 Seiten | O(n) | ~30s | Puppeteer warm halten |\n\n';
    
    doc += '---\n\n';
    
    doc += '# J) FEHLERBEHANDLUNG & AUSNAHMEN\n\n';
    
    doc += '## J.1 DATENBANK-FEHLER\n\n';
    doc += '| Fehlertyp | Ursache | User-Meldung | System-Reaktion | Rollback |\n';
    doc += '|-----------|---------|--------------|-----------------|----------|\n';
    doc += '| Constraint Violation | unit_id in LeaseContract ungültig | "Wohnung existiert nicht" | CREATE abbrechen | ✅ Auto |\n';
    doc += '| Duplicate Key | Rechnung mit gleicher invoice_number | "⚠️ Mögliches Duplikat" | WARNING (speichern erlaubt) | ❌ Nein |\n';
    doc += '| Foreign Key Missing | building_id gelöscht | "Gebäude nicht gefunden" | Query leer | N/A |\n';
    doc += '| Timeout (> 30s) | Sehr große Query | "Zeitüberschreitung" | Retry 1× | ✅ Auto |\n\n';
    
    doc += '## J.2 VALIDIERUNGS-FEHLER ÜBERSICHT\n\n';
    doc += '| Regel-ID | Modul | Fehlertext | Stufe | Häufigkeit |\n';
    doc += '|----------|-------|------------|-------|------------|\n';
    doc += '| VAL_ANLAGEV_001 | Steuer | "Gebäude-Adresse fehlt" | ❌ BLOCKER | Selten |\n';
    doc += '| VAL_TAX_15PERCENT | Steuer | "15%-Regel überschritten" | ⚠️ WARNING | Gelegentlich |\n';
    doc += '| VAL_KAUTION_MAX | Mieter | "Kaution > 3 Monatsmieten" | ⚠️ WARNING | Selten |\n';
    doc += '| VAL_NK_ZEITRAUM | Betriebskosten | "Nicht 12 Monate" | ❌ BLOCKER | Sehr selten |\n';
    doc += '| VAL_RENT_PLAUSIBILITY | Mieter | "Miete ungewöhnlich" | ⚠️ WARNING | Gelegentlich |\n';
    doc += '| VAL_BETRKV_UMLEGBAR | Betriebskosten | "Nicht umlagefähig" | ⚠️ WARNING | Selten |\n\n';
    
    doc += '---\n\n';
    
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
    // Diese Funktion wurde komplett überschrieben - siehe unten
    return await generateExternalIntegrationsDocComplete();
}

async function generateExternalIntegrationsDocComplete() {
    let doc = '# Externe Service-Integrationen - VOLLSTÄNDIGE DOKUMENTATION\n\n';
    doc += '**Metadaten:**\n';
    doc += `- Generiert am: ${new Date().toLocaleString('de-DE')}\n`;
    doc += '- Verwendungszweck: KI-Assistent Kontextinformation\n';
    doc += '- Anzahl Services: 4 (LetterXpress, finAPI, Core, IMAP)\n';
    doc += '- Auth-Methoden: API-Key, OAuth2, Basic Auth\n\n';
    doc += '---\n\n';
    
    doc += '## ÜBERSICHT ALLER INTEGRATIONEN\n\n';
    doc += '| Service | Zweck | Auth-Methode | Verwendungs-Häufigkeit | Kosten | Status |\n';
    doc += '|---------|-------|--------------|------------------------|--------|--------|\n';
    doc += '| LetterXpress.de | Postversand (Briefe drucken & versenden) | API-Key | Auf Abruf | Pro Brief (~1-4€) | ✅ Aktiv |\n';
    doc += '| finAPI Access B2C | Multi-Banking (Kontodaten abrufen) | OAuth2 (Client Credentials) | Täglich (Auto-Sync) | Pro Abruf (~0,01€) | ✅ Aktiv |\n';
    doc += '| Base44 Core | KI, E-Mail, File-Upload | Integriert (API-Key) | Ständig | Inkludiert | ✅ Aktiv |\n';
    doc += '| IMAP (Generic) | E-Mail-Empfang (diverse Anbieter) | Username + Password | Stündlich (Sync) | Kostenlos | ✅ Aktiv |\n\n';
    
    doc += '---\n\n';
    
    doc += '---\n\n';
    
    // ===== LETTERXPRESS =====
    doc += '# 1. LETTERXPRESS.DE (POSTVERSAND)\n\n';
    
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
    
    // ===== FINAPI =====
    doc += '# 2. FINAPI ACCESS B2C (MULTI-BANKING)\n\n';
    
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
    
    // ===== BASE44 CORE =====
    doc += '# 3. BASE44 CORE INTEGRATIONS\n\n';
    
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
    
    // ===== IMAP =====
    doc += '# 4. IMAP (E-MAIL-EMPFANG)\n\n';
    
    doc += '## 4.1 SERVICE-IDENTIFIKATION\n\n';
    doc += '**Anbieter**: Generisch (alle IMAP-Provider)\n';
    doc += '**Protokoll**: IMAP (Internet Message Access Protocol)\n';
    doc += '**Port**: 993 (SSL) oder 143 (STARTTLS)\n\n';
    doc += '**Zweck**:\n';
    doc += '- E-Mail-Empfang (z.B. Mieter-Anfragen, Rechnungen per Email)\n';
    doc += '- Automatische Task-Erstellung aus Emails\n';
    doc += '- Anhang-Extraktion (z.B. Rechnungen als PDF)\n\n';
    
    doc += '## 4.2 VERWENDUNG\n\n';
    doc += '**Modul**: Kommunikation → E-Mails\n\n';
    doc += '**User-Aktionen**:\n';
    doc += '1. **IMAP-Konto hinzufügen**: User gibt IMAP-Zugangsdaten ein\n';
    doc += '   - Frontend: `EmailAccountManager.jsx` → "Konto hinzufügen"\n';
    doc += '   - Speichern: `IMAPAccount` Entity (Passwort verschlüsselt)\n';
    doc += '2. **E-Mails synchronisieren**: Automatisch (stündlich) + manuell\n';
    doc += '   - Backend: `functions/syncEmails.js`\n';
    doc += '   - Lädt neue Emails, speichert in `Email` Entity\n\n';
    doc += '**Häufigkeit**: Stündlich (Scheduled Task) + auf Abruf\n\n';
    
    doc += '## 4.3 AUTHENTIFIZIERUNG\n\n';
    doc += '**Methode**: Username + Password (Basic Auth)\n\n';
    doc += '**Credentials-Speicherung**:\n';
    doc += '```javascript\n';
    doc += 'IMAPAccount.email_address       → IMAP-Username (meist = Email)\n';
    doc += 'IMAPAccount.username            → IMAP-Username (falls abweichend)\n';
    doc += 'IMAPAccount.password_encrypted  → Verschlüsseltes Passwort\n';
    doc += 'IMAPAccount.imap_server         → z.B. "imap.gmail.com"\n';
    doc += 'IMAPAccount.imap_port           → 993 (Standard)\n';
    doc += 'IMAPAccount.use_ssl             → true (immer SSL verwenden)\n';
    doc += '```\n\n';
    
    doc += '## 4.4 DATENFLUSS INBOUND (IMAP → App)\n\n';
    doc += '**IMAP-Befehle**:\n';
    doc += '```\n';
    doc += '1. LOGIN\n';
    doc += '2. SELECT INBOX\n';
    doc += '3. SEARCH UNSEEN (nur ungelesene)\n';
    doc += '4. FETCH <id> (BODY.PEEK[] FLAGS)\n';
    doc += '5. STORE <id> +FLAGS (\\Seen)\n';
    doc += '```\n\n';
    doc += '**Daten-Mapping**:\n';
    doc += '```javascript\n';
    doc += 'email.subject       → Email.subject\n';
    doc += 'email.from          → Email.sender_email + Email.sender_name\n';
    doc += 'email.date          → Email.received_date\n';
    doc += 'email.textBody      → Email.body_text\n';
    doc += 'email.htmlBody      → Email.body_html\n';
    doc += 'email.attachments[] → Email.attachments (JSON mit URLs)\n';
    doc += 'account.id          → Email.imap_account_id\n';
    doc += 'email.messageId     → Email.message_id (für Duplikat-Erkennung)\n';
    doc += '```\n\n';
    
    doc += '## 4.5 KI-ANALYSE (Optional)\n\n';
    doc += '**Wenn aktiviert** (`IMAPAccount.ai_analysis_enabled = true`):\n';
    doc += '```javascript\n';
    doc += '// Nach Email-Import:\n';
    doc += 'const suggestion = await base44.integrations.Core.InvokeLLM({\n';
    doc += '  prompt: `Analysiere diese Email und schlage einen Task vor:\n';
    doc += '\n';
    doc += 'Von: ${email.sender_name} <${email.sender_email}>\n';
    doc += 'Betreff: ${email.subject}\n';
    doc += 'Text: ${email.body_text}\n';
    doc += '\n';
    doc += 'Gib JSON zurück mit:\n';
    doc += '{\n';
    doc += '  "should_create_task": true/false,\n';
    doc += '  "task_title": "...",\n';
    doc += '  "task_description": "...",\n';
    doc += '  "priority": "niedrig"|"normal"|"hoch",\n';
    doc += '  "due_date": "YYYY-MM-DD" oder null\n';
    doc += '}`,\n';
    doc += '  response_json_schema: { ... }\n';
    doc += '});\n';
    doc += '\n';
    doc += '// Speichern:\n';
    doc += 'email.ai_suggested_task = suggestion;\n';
    doc += 'email.has_task = false;  // User muss bestätigen\n';
    doc += '```\n\n';
    
    doc += '## 4.6 COMPLIANCE & RECHTLICHES\n\n';
    doc += '**DSGVO**:\n';
    doc += '- ⚠️ **Opt-in erforderlich** für KI-Analyse (`ai_analysis_enabled`)\n';
    doc += '- Emails werden lokal gespeichert (nicht extern verarbeitet, außer KI-Analyse)\n';
    doc += '- Automatisches Löschen nach X Tagen (`delete_after_days`, Standard: 30)\n\n';
    doc += '**Datenschutz-Hinweis (User muss zustimmen)**:\n';
    doc += '```\n';
    doc += '"Wenn Sie die KI-Analyse aktivieren, werden Ihre E-Mails an einen\n';
    doc += 'KI-Dienst (OpenAI/Anthropic) übermittelt. Dies umfasst Betreff,\n';
    doc += 'Absender und Text. Anhänge werden NICHT übertragen. Sie können\n';
    doc += 'die KI-Analyse jederzeit deaktivieren."\n';
    doc += '```\n\n';
    
    doc += '---\n\n';
    
    doc += '# 5. ABHÄNGIGKEITEN & WORKFLOWS\n\n';
    
    doc += '## 5.1 MULTI-SERVICE-WORKFLOWS\n\n';
    doc += '### Workflow: "Rechnung per Email empfangen → Kategorisieren → Buchen"\n\n';
    doc += '```\n';
    doc += '1. IMAP: Email empfangen (mit PDF-Anhang)\n';
    doc += '   → Email Entity CREATE\n';
    doc += '   ↓\n';
    doc += '2. Core.UploadFile: PDF-Anhang hochladen\n';
    doc += '   → file_url erhalten\n';
    doc += '   ↓\n';
    doc += '3. Core.ExtractDataFromUploadedFile: Rechnungsdaten extrahieren\n';
    doc += '   → { rechnungsnummer, betrag, datum, ... }\n';
    doc += '   ↓\n';
    doc += '4. Core.InvokeLLM: Kategorie vorschlagen\n';
    doc += '   → { category: "Strom", confidence: 0.95 }\n';
    doc += '   ↓\n';
    doc += '5. Invoice Entity CREATE (mit vorgeschlagener Kategorie)\n';
    doc += '   → User kann in UI bestätigen/ändern\n';
    doc += '   ↓\n';
    doc += '6. Core.SendEmail: Benachrichtigung an User\n';
    doc += '   → "Neue Rechnung empfangen: 120,50€ (Strom)"\n';
    doc += '```\n\n';
    doc += '**Fehlerbehandlung**:\n';
    doc += '- Wenn Schritt 2 fehlschlägt → Email bleibt, PDF-Upload wiederholen\n';
    doc += '- Wenn Schritt 3 fehlschlägt → Invoice manuell erfassen (Fallback)\n';
    doc += '- Wenn Schritt 4 fehlschlägt → Kategorie leer lassen (User wählt manuell)\n';
    doc += '- Schritt 6 ist optional (wenn fehlschlägt, trotzdem fortfahren)\n\n';
    
    doc += '### Workflow: "Dokument per Post versenden"\n\n';
    doc += '```\n';
    doc += '1. Document erstellen (Mieterhöhung)\n';
    doc += '   → Document Entity CREATE\n';
    doc += '   ↓\n';
    doc += '2. PDF generieren (via Puppeteer)\n';
    doc += '   → pdf_url in Document speichern\n';
    doc += '   ↓\n';
    doc += '3. Core.UploadFile: PDF hochladen (für LXP)\n';
    doc += '   → file_url\n';
    doc += '   ↓\n';
    doc += '4. LetterXpress.send_letter: Brief versenden\n';
    doc += '   → lxp_job_id + status="queue"\n';
    doc += '   ↓\n';
    doc += '5. LetterShipment Entity CREATE\n';
    doc += '   → Speichern für Tracking\n';
    doc += '   ↓\n';
    doc += '6. Document.versandstatus = "in_versand"\n';
    doc += '   ↓\n';
    doc += '7. [TÄGLICH] LetterXpress.get_job: Status prüfen\n';
    doc += '   → Wenn status="sent":\n';
    doc += '   ↓\n';
    doc += '8. Document.versandstatus = "versendet"\n';
    doc += '   LetterShipment.tracking_code = "..."\n';
    doc += '   ↓\n';
    doc += '9. Core.SendEmail: Benachrichtigung\n';
    doc += '   → "Brief zugestellt: Tracking-Code XYZ"\n';
    doc += '```\n\n';
    doc += '**Rollback-Strategie**:\n';
    doc += '- Wenn Schritt 4 fehlschlägt → Document bleibt (versandstatus="zu_erledigen")\n';
    doc += '- Kein LetterShipment erstellt → User kann erneut versenden\n';
    doc += '- Kosten entstehen erst bei erfolgreicher API-Response\n\n';
    
    doc += '### Workflow: "Bank-Transaktionen importieren → AI-Matching"\n\n';
    doc += '```\n';
    doc += '1. finAPI.sync: Neue Transaktionen abrufen\n';
    doc += '   → BankTransaction Entities CREATE\n';
    doc += '   ↓\n';
    doc += '2. Für jede Transaction: Core.InvokeLLM (AI-Matching)\n';
    doc += '   Prompt: "Welche Rechnung/Buchung passt zu: \n';
    doc += '           -1200,50€ / MIETE JANUAR 2024 / Max Mustermann"\n';
    doc += '   ↓\n';
    doc += '3. Matching-Vorschläge zurück:\n';
    doc += '   [\n';
    doc += '     { type: "GeneratedFinancialBooking", id: "abc", confidence: 0.92 },\n';
    doc += '     { type: "Invoice", id: "def", confidence: 0.15 }\n';
    doc += '   ]\n';
    doc += '   ↓\n';
    doc += '4. Wenn confidence > 0,85: Auto-Match (ohne User-Bestätigung)\n';
    doc += '   PaymentTransactionLink CREATE\n';
    doc += '   GeneratedFinancialBooking.linked_transaction_ids.push(...)\n';
    doc += '   ↓\n';
    doc += '5. Wenn 0,5 < confidence < 0,85: Vorschlag an User\n';
    doc += '   → User muss bestätigen\n';
    doc += '   ↓\n';
    doc += '6. Wenn confidence < 0,5: Keine Vorschläge\n';
    doc += '   → User muss manuell matchen\n';
    doc += '```\n\n';
    doc += '**Fehlerbehandlung**:\n';
    doc += '- Wenn finAPI down → Retry nach 1h (Scheduled Task)\n';
    doc += '- Wenn AI-Matching fehlschlägt → Transaction bleibt unkategorisiert\n';
    doc += '- Keine Auto-Matching bei niedrigem Confidence (Fehlzuordnungen vermeiden)\n\n';
    
    doc += '---\n\n';
    
    doc += '# 6. ZUSAMMENFASSUNG\n\n';
    
    doc += '## 6.1 ALLE INTEGRATIONEN AUF EINEN BLICK\n\n';
    doc += '| Integration | Zweck | Auth | Kosten | Fehler-Retry | DSGVO | Status |\n';
    doc += '|-------------|-------|------|--------|--------------|-------|--------|\n';
    doc += '| LetterXpress | Postversand | API-Key | 1-4€/Brief | ❌ Nein | ✅ Ja | ✅ Aktiv |\n';
    doc += '| finAPI | Banking | OAuth2 | 0,01€/Sync | ✅ Ja (1h) | ✅ Ja | ✅ Aktiv |\n';
    doc += '| Core.InvokeLLM | KI-Text | Integriert | Inkludiert | ❌ Nein | ✅ Ja | ✅ Aktiv |\n';
    doc += '| Core.SendEmail | E-Mail | Integriert | Inkludiert | ✅ Ja (3×) | ✅ Ja | ✅ Aktiv |\n';
    doc += '| Core.UploadFile | Storage | Integriert | Inkludiert | ✅ Ja (1×) | ✅ Ja | ✅ Aktiv |\n';
    doc += '| Core.ExtractData | OCR | Integriert | 0,10€ | ❌ Nein | ✅ Ja | ✅ Aktiv |\n';
    doc += '| IMAP (Generic) | Email-Empfang | Basic Auth | Kostenlos | ✅ Ja | ⚠️ Opt-in | ✅ Aktiv |\n\n';
    
    doc += '## 6.2 DATENFLUSS-DIAGRAMM (Vereinfacht)\n\n';
    doc += '```\n';
    doc += '┌────────────┐\n';
    doc += '│    USER    │\n';
    doc += '└─────┬──────┘\n';
    doc += '      │\n';
    doc += '      ├──────► [App Frontend] ────► [App Backend]\n';
    doc += '      │                                   │\n';
    doc += '      │                                   ├───► LetterXpress API\n';
    doc += '      │                                   │        (Postversand)\n';
    doc += '      │                                   │\n';
    doc += '      │                                   ├───► finAPI\n';
    doc += '      │                                   │        (Banking)\n';
    doc += '      │                                   │\n';
    doc += '      │                                   ├───► Base44 Core\n';
    doc += '      │                                   │        (KI, Email, Storage)\n';
    doc += '      │                                   │\n';
    doc += '      │                                   └───► IMAP Server\n';
    doc += '      │                                            (Email-Empfang)\n';
    doc += '      │\n';
    doc += '      └──────◄ [Notifications] ◄────────┘\n';
    doc += '```\n\n';
    
    doc += '## 6.3 SICHERHEITS-BEST-PRACTICES\n\n';
    doc += '1. ✅ **Credentials verschlüsselt speichern**: API-Keys und Passwörter nie im Klartext\n';
    doc += '2. ✅ **HTTPS only**: Alle API-Calls über verschlüsselte Verbindungen\n';
    doc += '3. ✅ **Secrets in ENV**: Client-IDs/Secrets in Environment Variables (nicht im Code)\n';
    doc += '4. ✅ **Token-Refresh**: OAuth-Tokens automatisch erneuern (finAPI)\n';
    doc += '5. ✅ **Rate Limiting beachten**: Exponentielles Backoff bei 429-Fehlern\n';
    doc += '6. ✅ **Timeout-Handling**: Max. 30s warten, dann Abbruch\n';
    doc += '7. ✅ **Fehler-Logging**: Alle API-Fehler in ActivityLog\n';
    doc += '8. ✅ **Duplikat-Erkennung**: Bei Transaktionen/Emails (via message_id/finapi_id)\n';
    doc += '9. ✅ **DSGVO-Compliance**: AV-Verträge mit allen Anbietern\n';
    doc += '10. ✅ **User-Transparenz**: Opt-in für KI-Analyse, Datenschutz-Hinweise\n\n';
    
    doc += '---\n\n';
    
    doc += '# 7. GEPLANTE INTEGRATIONEN (nicht implementiert)\n\n';
    
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