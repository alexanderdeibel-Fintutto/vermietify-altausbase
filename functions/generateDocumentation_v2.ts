import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Fallback: Bekannte Entity-Schemas (ALLE Entities)
const KNOWN_ENTITY_SCHEMAS = {
  // === KERN-ENTITIES ===
  "Building": {
    "name": "Building",
    "type": "object",
    "properties": {
      "name": {"type": "string"},
      "address": {"type": "string"},
      "city": {"type": "string"},
      "postal_code": {"type": "string"},
      "year_built": {"type": "number"},
      "total_units": {"type": "number"},
      "owner_name": {"type": "string"},
      "contact_email": {"type": "string"}
    },
    "required": ["name", "address", "city", "postal_code"]
  },
  "Unit": {
    "name": "Unit",
    "type": "object",
    "properties": {
      "gebaeude_id": {"type": "string"},
      "unit_number": {"type": "string"},
      "floor": {"type": "number"},
      "rooms": {"type": "number"},
      "sqm": {"type": "number"},
      "status": {"type": "string"},
      "base_rent": {"type": "number"}
    },
    "required": ["gebaeude_id", "unit_number", "sqm"]
  },
  "Owner": {
    "name": "Owner",
    "type": "object",
    "properties": {
      "name": {"type": "string"},
      "email": {"type": "string"},
      "phone": {"type": "string"},
      "address": {"type": "string"}
    },
    "required": ["name"]
  },
  "Shareholder": {
    "name": "Shareholder",
    "type": "object",
    "properties": {
      "name": {"type": "string"},
      "email": {"type": "string"},
      "share_percentage": {"type": "number"}
    },
    "required": ["name"]
  },
  "OwnerRelationship": {
    "name": "OwnerRelationship",
    "type": "object",
    "properties": {
      "owner_id": {"type": "string"},
      "building_id": {"type": "string"},
      "share_percentage": {"type": "number"}
    },
    "required": ["owner_id", "building_id"]
  },

  // === MIETER & VERTRÄGE ===
  "Tenant": {
    "name": "Tenant",
    "type": "object",
    "properties": {
      "first_name": {"type": "string"},
      "last_name": {"type": "string"},
      "email": {"type": "string"},
      "phone": {"type": "string"},
      "date_of_birth": {"type": "string"},
      "notes": {"type": "string"}
    },
    "required": ["first_name", "last_name"]
  },
  "LeaseContract": {
    "name": "LeaseContract",
    "type": "object",
    "properties": {
      "unit_id": {"type": "string"},
      "tenant_id": {"type": "string"},
      "start_date": {"type": "string"},
      "end_date": {"type": "string"},
      "base_rent": {"type": "number"},
      "utilities": {"type": "number"},
      "total_rent": {"type": "number"},
      "deposit": {"type": "number"},
      "status": {"type": "string"}
    },
    "required": ["unit_id", "tenant_id", "start_date", "base_rent", "total_rent"]
  },
  "Termination": {
    "name": "Termination",
    "type": "object",
    "properties": {
      "contract_id": {"type": "string"},
      "tenant_id": {"type": "string"},
      "termination_date": {"type": "string"},
      "move_out_date": {"type": "string"},
      "reason": {"type": "string"},
      "status": {"type": "string"}
    },
    "required": ["contract_id", "tenant_id"]
  },

  // === FINANZEN ===
  "Invoice": {
    "name": "Invoice",
    "type": "object",
    "properties": {
      "invoice_number": {"type": "string"},
      "building_id": {"type": "string"},
      "tenant_id": {"type": "string"},
      "amount": {"type": "number"},
      "due_date": {"type": "string"},
      "paid_date": {"type": "string"},
      "status": {"type": "string"}
    },
    "required": ["invoice_number", "amount"]
  },
  "FinancialItem": {
    "name": "FinancialItem",
    "type": "object",
    "properties": {
      "building_id": {"type": "string"},
      "type": {"type": "string"},
      "amount": {"type": "number"},
      "date": {"type": "string"},
      "category": {"type": "string"},
      "description": {"type": "string"}
    },
    "required": ["type", "amount"]
  },
  "GeneratedFinancialBooking": {
    "name": "GeneratedFinancialBooking",
    "type": "object",
    "properties": {
      "building_id": {"type": "string"},
      "booking_type": {"type": "string"},
      "amount": {"type": "number"},
      "date": {"type": "string"},
      "source": {"type": "string"}
    },
    "required": ["booking_type", "amount"]
  },
  "CostCategory": {
    "name": "CostCategory",
    "type": "object",
    "properties": {
      "name": {"type": "string"},
      "code": {"type": "string"},
      "description": {"type": "string"}
    },
    "required": ["name"]
  },
  "BankAccount": {
    "name": "BankAccount",
    "type": "object",
    "properties": {
      "building_id": {"type": "string"},
      "account_number": {"type": "string"},
      "iban": {"type": "string"},
      "bic": {"type": "string"},
      "bank_name": {"type": "string"},
      "account_holder": {"type": "string"}
    },
    "required": ["account_number"]
  },
  "BankTransaction": {
    "name": "BankTransaction",
    "type": "object",
    "properties": {
      "account_id": {"type": "string"},
      "amount": {"type": "number"},
      "date": {"type": "string"},
      "reference": {"type": "string"},
      "payer": {"type": "string"},
      "category": {"type": "string"}
    },
    "required": ["amount", "date"]
  },
  "PropertyTax": {
    "name": "PropertyTax",
    "type": "object",
    "properties": {
      "building_id": {"type": "string"},
      "tax_id": {"type": "string"},
      "amount": {"type": "number"},
      "due_date": {"type": "string"}
    },
    "required": ["building_id"]
  },
  "Insurance": {
    "name": "Insurance",
    "type": "object",
    "properties": {
      "building_id": {"type": "string"},
      "insurance_type": {"type": "string"},
      "provider": {"type": "string"},
      "premium": {"type": "number"},
      "renewal_date": {"type": "string"}
    },
    "required": ["building_id"]
  },
  "Financing": {
    "name": "Financing",
    "type": "object",
    "properties": {
      "building_id": {"type": "string"},
      "lender": {"type": "string"},
      "amount": {"type": "number"},
      "interest_rate": {"type": "number"},
      "start_date": {"type": "string"},
      "end_date": {"type": "string"}
    },
    "required": ["building_id"]
  },
  "Supplier": {
    "name": "Supplier",
    "type": "object",
    "properties": {
      "name": {"type": "string"},
      "email": {"type": "string"},
      "phone": {"type": "string"},
      "address": {"type": "string"},
      "category": {"type": "string"}
    },
    "required": ["name"]
  },
  "Meter": {
    "name": "Meter",
    "type": "object",
    "properties": {
      "building_id": {"type": "string"},
      "unit_id": {"type": "string"},
      "meter_type": {"type": "string"},
      "meter_number": {"type": "string"},
      "last_reading": {"type": "number"},
      "reading_date": {"type": "string"}
    },
    "required": ["meter_type", "meter_number"]
  },
  "BuildingTaxLibrary": {
    "name": "BuildingTaxLibrary",
    "type": "object",
    "properties": {
      "building_id": {"type": "string"},
      "tax_category": {"type": "string"},
      "tax_id": {"type": "string"},
      "amount": {"type": "number"}
    },
    "required": ["building_id"]
  },

  // === BETRIEBSKOSTEN ===
  "OperatingCostStatement": {
    "name": "OperatingCostStatement",
    "type": "object",
    "properties": {
      "building_id": {"type": "string"},
      "statement_year": {"type": "number"},
      "total_costs": {"type": "number"},
      "created_date": {"type": "string"}
    },
    "required": ["building_id"]
  },
  "OperatingCostStatementItem": {
    "name": "OperatingCostStatementItem",
    "type": "object",
    "properties": {
      "statement_id": {"type": "string"},
      "cost_category": {"type": "string"},
      "amount": {"type": "number"},
      "description": {"type": "string"}
    },
    "required": ["statement_id"]
  },

  // === DOKUMENTE & KOMMUNIKATION ===
  "Document": {
    "name": "Document",
    "type": "object",
    "properties": {
      "building_id": {"type": "string"},
      "document_type": {"type": "string"},
      "file_name": {"type": "string"},
      "file_url": {"type": "string"},
      "uploaded_date": {"type": "string"}
    },
    "required": ["document_type"]
  },
  "DocumentTemplate": {
    "name": "DocumentTemplate",
    "type": "object",
    "properties": {
      "name": {"type": "string"},
      "document_type": {"type": "string"},
      "template_html": {"type": "string"},
      "is_active": {"type": "boolean"}
    },
    "required": ["name"]
  },
  "TextBlock": {
    "name": "TextBlock",
    "type": "object",
    "properties": {
      "name": {"type": "string"},
      "content": {"type": "string"},
      "category": {"type": "string"}
    },
    "required": ["name"]
  },
  "LetterShipment": {
    "name": "LetterShipment",
    "type": "object",
    "properties": {
      "recipient_name": {"type": "string"},
      "recipient_address": {"type": "string"},
      "shipment_type": {"type": "string"},
      "status": {"type": "string"},
      "tracking_number": {"type": "string"}
    },
    "required": ["recipient_name"]
  },
  "LetterXpressCredential": {
    "name": "LetterXpressCredential",
    "type": "object",
    "properties": {
      "api_key": {"type": "string"},
      "account_id": {"type": "string"},
      "email": {"type": "string"}
    },
    "required": ["api_key"]
  },

  // === SYSTEM & WORKFLOWS ===
  "Task": {
    "name": "Task",
    "type": "object",
    "properties": {
      "title": {"type": "string"},
      "description": {"type": "string"},
      "status": {"type": "string"},
      "priority": {"type": "string"},
      "due_date": {"type": "string"},
      "assigned_to": {"type": "string"}
    },
    "required": ["title"]
  },
  "ActivityLog": {
    "name": "ActivityLog",
    "type": "object",
    "properties": {
      "user_email": {"type": "string"},
      "action": {"type": "string"},
      "entity_type": {"type": "string"},
      "entity_id": {"type": "string"},
      "timestamp": {"type": "string"}
    },
    "required": ["action"]
  },
  "Notification": {
    "name": "Notification",
    "type": "object",
    "properties": {
      "user_email": {"type": "string"},
      "title": {"type": "string"},
      "message": {"type": "string"},
      "read": {"type": "boolean"},
      "created_date": {"type": "string"}
    },
    "required": ["title"]
  },
  "DeveloperDocumentation": {
    "name": "DeveloperDocumentation",
    "type": "object",
    "properties": {
      "documentation_type": {"type": "string"},
      "title": {"type": "string"},
      "description": {"type": "string"},
      "content_markdown": {"type": "string"},
      "status": {"type": "string"}
    },
    "required": ["documentation_type"]
  },

  // === BERECHTIGUNGEN & ROLLEN ===
  "BuildingPermission": {
    "name": "BuildingPermission",
    "type": "object",
    "properties": {
      "user_email": {"type": "string"},
      "building_id": {"type": "string"},
      "permission_level": {"type": "string"}
    },
    "required": ["user_email", "building_id"]
  },
  "FieldPermission": {
    "name": "FieldPermission",
    "type": "object",
    "properties": {
      "role": {"type": "string"},
      "entity_type": {"type": "string"},
      "field_name": {"type": "string"},
      "access_level": {"type": "string"},
      "is_sensitive": {"type": "boolean"}
    },
    "required": ["role", "entity_type", "field_name"]
  },
  "RoleDefinition": {
    "name": "RoleDefinition",
    "type": "object",
    "properties": {
      "role_name": {"type": "string"},
      "description": {"type": "string"},
      "building_access": {"type": "string"},
      "default_field_access": {"type": "string"}
    },
    "required": ["role_name"]
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
                // Dynamisch alle Entity-Schemas laden
                let allEntities = { ...KNOWN_ENTITY_SCHEMAS };
                
                try {
                    const schemasResult = await base44.asServiceRole.functions.invoke('getAllEntitySchemas', {});
                    if (schemasResult.data?.schemas && Object.keys(schemasResult.data.schemas).length > 0) {
                        allEntities = schemasResult.data.schemas;
                        console.log(`Dynamisch ${Object.keys(allEntities).length} Schemas geladen`);
                    }
                } catch (error) {
                    console.error('Fallback zu KNOWN_ENTITY_SCHEMAS:', error);
                }
                
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
    
    // Intelligente Gruppierung basierend auf Entity-Namen
    const groupsDefinition = {
        '1. OBJEKTE & GEBÄUDE': ['Building', 'Unit', 'Gebaeude', 'BuildingOwnership', 'BuildingPermission', 'BuildingTask', 'BuildingManager', 'BuildingInspection', 'InspectionChecklist', 'InspectionFinding', 'BuildingBoardPost', 'BuildingBoardComment', 'BuildingTaxLibrary', 'EnergyPassport', 'IoTSensor', 'SensorReading', 'SmartDevice', 'HeatingOptimization', 'EnergyAnalysis'],
        '2. EIGENTÜMER & ANTEILE': ['Owner', 'Shareholder', 'OwnerRelationship', 'BuildingOwnership', 'OwnerAssetLink'],
        '3. MIETER & VERTRÄGE': ['Tenant', 'CoTenant', 'LeaseContract', 'Termination', 'ContractTermination', 'ContractRenewal', 'RentChange', 'RentIncrease', 'RentIncreaseProposal', 'IndexRentAdjustment', 'HandoverProtocol', 'Deposit', 'RentDebt', 'Applicant', 'Viewing'],
        '4. MIETER-KOMMUNIKATION': ['TenantMessage', 'TenantNotification', 'TenantCommunication', 'TenantIssueReport', 'TenantSupportTicket', 'TenantFeedback', 'TenantSurvey', 'SurveyResponse', 'TenantOnboarding', 'TenantAppSession', 'TenantFavorite', 'TenantAccessControl', 'TenantAdministrationLock'],
        '5. FINANZEN ALLGEMEIN': ['Invoice', 'FinancialItem', 'GeneratedFinancialBooking', 'Payment', 'ActualPayment', 'CostCategory', 'CostType', 'CustomCostCategory', 'EuerCategory', 'TaxCategory', 'CostTaxLink', 'CostCenter', 'FinancialItemTransactionLink', 'PaymentTransactionLink'],
        '6. BANKING': ['BankAccount', 'BankTransaction', 'BankStatement', 'BankTransfer', 'TransferDraft', 'SEPAMandate', 'BankingAutomationRule', 'FinAPISync', 'CategorizationRule'],
        '7. STEUERN': ['PropertyTax', 'PropertyTaxDecree', 'TaxReturnV', 'TaxReturnVLine', 'AnlageVSubmission', 'TaxReturn', 'TaxForm', 'TaxFormField', 'TaxFormAttachment', 'ElsterSubmission', 'ElsterResponse', 'ElsterLog', 'ElsterCertificate', 'ElsterSettings', 'ElsterComplianceAudit', 'ElsterFormTemplate', 'AnlageKAP', 'AnlageSO', 'AnlageG', 'AnlageVorsorgeaufwand', 'EstMantelbogen', 'TaxEvent', 'TaxOptimization', 'TaxOptimizationScenario', 'TaxSettings', 'TaxSummary', 'TaxLot', 'TaxHarvestingSuggestion', 'TaxConfig', 'TaxProfile', 'TaxLawUpdate', 'TaxRule', 'TaxRuleCategory', 'TaxRuleAuditLog', 'TaxDeadline', 'TaxReminder', 'TaxCalculation', 'TaxCompliance', 'TaxScenario', 'TaxAlert', 'TaxDocument', 'TaxPlanning', 'TaxFiling', 'TaxLossCarryforward', 'TaxAuditFile', 'TaxCategoryMaster', 'UserTaxSettings'],
        '8. VERMÖGENSVERWALTUNG': ['Portfolio', 'Asset', 'AssetTransaction', 'AssetValuation', 'AssetHolding', 'AssetPrice', 'AssetApiConfig', 'AssetPerformanceHistory', 'AssetPortfolio', 'PortfolioAccount', 'PortfolioShare', 'PortfolioAlert', 'PortfolioNotification', 'PortfolioMetrics', 'PortfolioComment', 'PortfolioBenchmark', 'PortfolioAnalysis', 'Stock', 'Crypto', 'CryptoHolding', 'PreciousMetal', 'OtherAsset', 'FreistellungsauftragBank', 'Dividend', 'StakingReward', 'Investment', 'InvestmentAT', 'InvestmentCH', 'CapitalGain', 'CapitalGainAT', 'CapitalGainCH', 'OtherIncome', 'OtherIncomeAT', 'OtherIncomeCH', 'RealEstateCH', 'CrossBorderTransaction', 'PriceHistory', 'RebalancingStrategy', 'ScenarioSimulation', 'AdvisorPortal', 'ImportBatchLog', 'ImportMapping'],
        '9. VERSICHERUNGEN & FINANZIERUNG': ['Insurance', 'InsurancePolicy', 'InsuranceContract', 'Financing', 'LoanPayment', 'AfaSchedule', 'AfASchedule'],
        '10. BETRIEBSKOSTEN': ['OperatingCostStatement', 'OperatingCostStatementItem', 'OperatingCostItem', 'OperatingCostUnitResult', 'OperatingCostUnitDetail', 'OperatingCostAutomation', 'UtilitySettlement'],
        '11. DOKUMENTE': ['Document', 'DocumentTemplate', 'DocumentOriginal', 'UploadedDocument', 'GeneratedDocument', 'DocumentVersion', 'DocumentInbox', 'DocumentComment', 'DocumentRelationship', 'DocumentPermission', 'DocumentActivity', 'DocumentTag', 'DocumentWorkflow', 'DocumentWorkflowRule', 'DocumentTask', 'DocumentArchive', 'DocumentAnalytics', 'DocumentAnalysis', 'DocumentExpiry', 'DocumentLock', 'DocumentEncryption', 'DocumentRights', 'DocumentSignature', 'DocumentCollaborationSession', 'DocumentClassificationRule', 'DocumentRetentionPolicy', 'TextBlock', 'Template', 'InvoiceTemplate'],
        '12. KOMMUNIKATION & BRIEFE': ['LetterShipment', 'LetterXpressCredential', 'Email', 'EmailTemplate', 'CommunicationLog', 'CommunicationTemplate', 'CommunicationWorkflow', 'MessageThread', 'WhatsAppMessage', 'WhatsAppTemplate', 'WhatsAppAccount', 'WhatsAppContact', 'WhatsAppOptIn', 'WhatsAppWebhookLog'],
        '13. AUFGABEN & WORKFLOWS': ['Task', 'TaskStatus', 'TaskPriority', 'FieldTask', 'MaintenanceTask', 'BuildingTask', 'Workflow', 'WorkflowStep', 'WorkflowExecution', 'WorkflowComment', 'WorkflowCollaborationSession', 'WorkflowCondition', 'WorkflowRoleAssignment', 'WorkflowTrigger', 'WorkflowRole', 'WorkflowIntegration', 'WorkflowTemplate', 'WorkflowPermission', 'WorkflowVersion', 'WorkflowAutomation', 'Automation', 'BookingGenerationRule'],
        '14. LIEFERANTEN & DIENSTLEISTER': ['Supplier', 'SupplierContract', 'Contractor', 'ServiceProvider', 'ServiceRating', 'Vendor', 'VendorRating', 'VendorTask', 'VendorDocument'],
        '15. ZÄHLER & VERBRÄUCHE': ['Meter', 'MeterReading', 'MeterReadingSchedule', 'MeterReadingRoute'],
        '16. BENACHRICHTIGUNGEN & ALERTS': ['Notification', 'NotificationPreference', 'AlertRule', 'AlertPreference', 'PaymentReminder', 'PortfolioAlert', 'PortfolioNotification', 'BudgetAlert'],
        '17. BERECHTIGUNGEN & ROLLEN': ['BuildingPermission', 'FieldPermission', 'RoleDefinition', 'Role', 'UserRole', 'UserRoleAssignment', 'CustomRole', 'Permission', 'UserPermission', 'WorkflowPermission', 'PermissionAuditLog', 'DocumentPermission', 'DocumentRights', 'TenantAccessControl'],
        '18. REPORTS & ANALYTICS': ['Report', 'ReportConfig', 'ReportSchedule', 'FinancialReport', 'Analytics', 'DocumentAnalytics', 'TesterAnalytics', 'ProblemStatistics', 'ComplianceReport'],
        '19. AUDIT & LOGS': ['AuditLog', 'ActivityLog', 'UserAuditLog', 'OnboardingAuditLog', 'PricingAuditLog', 'SyncAuditLog', 'TaxRuleAuditLog', 'ElsterLog', 'DocumentActivity', 'TeamActivityLog', 'UserActivity'],
        '20. APPROVALS & GENEHMIGUNGEN': ['Approval', 'ApprovalWorkflow', 'SignatureRequest'],
        '21. PRICING & SUBSCRIPTIONS': ['Product', 'Feature', 'FeatureGroup', 'ProductFeature', 'PricingTier', 'TierFeature', 'TierLimit', 'Bundle', 'BundleItem', 'Discount', 'UpsellTrigger', 'SubscriptionPlan', 'SubscriptionAddOn', 'UserSubscription', 'SubscriptionInvoice', 'PlanLimit', 'PlanAddOnPricing', 'UserAddOn', 'UsageLimit', 'UserLimit', 'PricingSnapshot', 'ModulePricing'],
        '22. SUCHE & FAVORITEN': ['SavedSearch', 'UserFavorite', 'TenantFavorite'],
        '23. WEBHOOKS & API': ['Webhook', 'APIKey'],
        '24. BUDGET & PLANUNG': ['Budget', 'BudgetRequest', 'BudgetScenario', 'RollingBudget', 'PropertyBudget', 'BudgetAlert', 'CashflowForecast', 'ExpenseReport', 'CostOptimizationAnalysis'],
        '25. ORGANISATION': ['Mandant', 'UserMandantAccess', 'Company', 'Department', 'DepartmentMember'],
        '26. MODULE & PAKETE': ['AppSuite', 'ModuleDefinition', 'ModuleAccess', 'UserModuleAccess', 'UserSuiteSubscription', 'UserPackageConfiguration', 'UserPackageConfig', 'PackageTemplate', 'ProjectFeature', 'FeatureUnlock'],
        '27. ONBOARDING & TESTING': ['UserOnboarding', 'OnboardingProgress', 'OnboardingWorkflow', 'OnboardingScenario', 'TestAccount', 'TestSession', 'TestAssignment', 'TestPhase', 'TesterInvitation', 'TesterActivity', 'TesterCommunication'],
        '28. PROBLEME & SUPPORT': ['UserProblem', 'ProblemSummary', 'ProblemReportSummary', 'ProblemCategory', 'ProblemSolution', 'SupportTicket', 'UserJourney', 'UXPattern', 'AIInsight', 'ArchivedInsights', 'UserSegment'],
        '29. DOKUMENTATION & WISSEN': ['GeneratedDocumentation', 'DocumentationChange', 'KnowledgeBaseArticle', 'LegalKnowledgeBase', 'LegalUpdateMonitor', 'KnowledgeGap', 'ClaudeAnalysisReport'],
        '30. DASHBOARDS & WIDGETS': ['DashboardConfig', 'DashboardTemplate', 'DashboardWidget', 'WidgetInteraction'],
        '31. THEMES & UI': ['Theme', 'NavigationState', 'UserPreferences'],
        '32. COMPLIANCE & SICHERHEIT': ['ComplianceCheck', 'ComplianceReport', 'ComplianceAudit', 'HeritageProtection', 'DLPRule', 'DLPViolation'],
        '33. WARTUNG & INSTANDHALTUNG': ['MaintenanceTask', 'MaintenanceRoute', 'MaintenancePrediction', 'Equipment', 'EmergencyContact'],
        '34. COMMUNITY & SOZIALES': ['CommunityPost', 'CommunityComment', 'Announcement'],
        '35. DIGITALE DIENSTE': ['DigitalKey', 'ARViewing', 'SmartContract'],
        '36. SONSTIGE FINANZENTITIES': ['PropertyROI', 'IncomeVariance', 'RentOptimization', 'PropertyValuation', 'Vacancy', 'Reserve', 'IndustryBenchmark', 'PurchaseContract'],
        '37. SYNC & INTEGRATION': ['SyncJob', 'SyncAuditLog', 'CantonConfig', 'AutomationConfig']
    };
    
    // Finde alle Entities, die noch keiner Gruppe zugeordnet sind
    const assignedEntities = Object.values(groupsDefinition).flat();
    const unassignedEntities = Object.keys(entities).filter(name => 
        !assignedEntities.includes(name) &&
        !['User'].includes(name) // User ist built-in
    );
    
    if (unassignedEntities.length > 0) {
        groupsDefinition['38. WEITERE ENTITIES'] = unassignedEntities;
    }

    for (const [groupName, entityNames] of Object.entries(groupsDefinition)) {
        const groupEntities = entityNames.filter(name => entities[name]);
        if (groupEntities.length === 0) continue;

        doc += `## ${groupName}\n\n`;

        for (const name of groupEntities) {
            const schema = entities[name];
            doc += `### Tabelle: ${name}\n\n`;

            if (schema?.properties) {
                doc += '| Feldname | Datentyp | Pflichtfeld | Beschreibung |\n';
                doc += '|----------|----------|-------------|--------------|\n';

                for (const [fieldName, field] of Object.entries(schema.properties)) {
                    const required = schema.required?.includes(fieldName) ? 'Ja' : 'Nein';
                    let type = field.type || 'unknown';
                    if (field.format) type += ` (${field.format})`;
                    if (field.enum) type = `enum: ${field.enum.slice(0, 3).join(', ')}${field.enum.length > 3 ? '...' : ''}`;
                    const description = (field.description || '-').replace(/\n/g, ' ').substring(0, 100);
                    doc += `| ${fieldName} | ${type} | ${required} | ${description} |\n`;
                }
            }
            doc += '\n';
        }
    }

    return doc;
}