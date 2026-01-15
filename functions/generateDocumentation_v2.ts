import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const startTime = Date.now();
        const { documentation_type } = await req.json();

        // Hole alle Entity-Schemas
        const schemasResponse = await base44.asServiceRole.functions.invoke('getAllEntitySchemas', {});
        const schemas = schemasResponse.data.schemas || {};

        // Generiere Markdown-Dokumentation basierend auf Typ
        let markdown = `# ${documentation_type || 'Datenbank-Struktur'} Dokumentation\n\n`;
        markdown += `Generiert am: ${new Date().toLocaleDateString('de-DE')}\n\n`;
        markdown += `Anzahl Entities: ${Object.keys(schemas).length}\n\n`;
        markdown += `---\n\n`;

        // Gruppiere Entities nach Kategorien
        const categories = {
            'Immobilien': ['Building', 'Unit', 'PurchaseContract', 'EnergyPassport', 'Equipment'],
            'Mieter & Verträge': ['Tenant', 'LeaseContract', 'CoTenant', 'Applicant', 'Vacancy', 'Deposit', 'SEPAMandate', 'RentDebt', 'Termination', 'HandoverProtocol'],
            'Finanzen': ['BankAccount', 'BankTransaction', 'BankTransfer', 'TransferDraft', 'BankStatement', 'Payment', 'ActualPayment'],
            'Rechnungen & Kosten': ['Invoice', 'CostCategory', 'FinancialItem', 'PlannedBooking', 'Supplier', 'SupplierContract'],
            'Betriebskosten': ['OperatingCostStatement', 'OperatingCostItem', 'OperatingCostUnitResult', 'OperatingCostUnitDetail', 'Meter', 'MeterReading'],
            'Steuern': ['TaxReturnV', 'TaxReturnVLine', 'AnlageVSubmission', 'AnlageKAP', 'AnlageSO', 'AnlageG', 'AnlageVorsorgeaufwand', 'EstMantelbogen', 'TaxForm', 'TaxFormField', 'PropertyTaxDecree'],
            'ELSTER': ['ElsterSubmission', 'ElsterResponse', 'ElsterCertificate', 'ElsterLog', 'ElsterSettings', 'TaxFormAttachment'],
            'Vermögen': ['Portfolio', 'Asset', 'Stock', 'Crypto', 'PreciousMetal', 'OtherAsset', 'AssetTransaction', 'AssetValuation', 'AssetPrice', 'AssetHolding', 'Dividend', 'StakingReward', 'FreistellungsauftragBank'],
            'Dokumente': ['Document', 'DocumentTemplate', 'DocumentVersion', 'DocumentOriginal', 'DocumentComment', 'DocumentTag', 'DocumentRelationship', 'DocumentPermission', 'DocumentActivity', 'GeneratedDocument', 'UploadedDocument', 'DocumentInbox'],
            'Workflows': ['Workflow', 'WorkflowStep', 'WorkflowExecution', 'ApprovalWorkflow', 'CommunicationWorkflow', 'DocumentWorkflow'],
            'Kommunikation': ['CommunicationLog', 'MessageThread', 'Email', 'LetterShipment', 'TenantMessage', 'TenantCommunication'],
            'Aufgaben': ['Task', 'MaintenanceTask', 'BuildingTask', 'FieldTask', 'DocumentTask'],
            'Eigentümer': ['Owner', 'Shareholder', 'BuildingOwnership', 'OwnerRelationship'],
            'Benutzer & Rollen': ['UserRole', 'RoleDefinition', 'CustomRole', 'Permission', 'UserPermission', 'FieldPermission', 'BuildingPermission', 'UserRoleAssignment'],
            'Mandanten': ['Mandant', 'UserMandantAccess', 'Company'],
            'Subscription & Pricing': ['SubscriptionPlan', 'UserSubscription', 'PricingTier', 'Feature', 'FeatureGroup', 'Product', 'ProductFeature', 'TierFeature', 'TierLimit', 'Bundle', 'BundleItem', 'Discount', 'UpsellTrigger', 'UsageLimit', 'UserLimit'],
            'Berichte & Analytics': ['Report', 'Analytics', 'PortfolioAnalysis'],
            'System': ['AuditLog', 'Notification', 'AlertRule', 'AlertPreference', 'Webhook', 'APIKey', 'Automation']
        };

        // Sortiere nach Kategorien
        for (const [categoryName, entityNames] of Object.entries(categories)) {
            const categoryEntities = entityNames.filter(name => schemas[name]);
            
            if (categoryEntities.length === 0) continue;

            markdown += `## ${categoryName}\n\n`;

            for (const entityName of categoryEntities) {
                const schema = schemas[entityName];
                markdown += `### ${entityName}\n\n`;
                
                if (schema.description) {
                    markdown += `${schema.description}\n\n`;
                }

                markdown += `**Pflichtfelder:** ${(schema.required || []).join(', ') || 'Keine'}\n\n`;

                markdown += `| Feld | Typ | Beschreibung |\n`;
                markdown += `|------|-----|-------------|\n`;

                const properties = schema.properties || {};
                for (const [fieldName, fieldDef] of Object.entries(properties)) {
                    const type = fieldDef.enum ? `enum: ${fieldDef.enum.slice(0, 3).join(', ')}${fieldDef.enum.length > 3 ? '...' : ''}` : fieldDef.type;
                    const desc = fieldDef.description || '';
                    markdown += `| ${fieldName} | ${type} | ${desc} |\n`;
                }

                markdown += `\n`;
            }
        }

        // Nicht-kategorisierte Entities
        const categorizedEntities = new Set(Object.values(categories).flat());
        const uncategorized = Object.keys(schemas).filter(name => !categorizedEntities.has(name));

        if (uncategorized.length > 0) {
            markdown += `## Sonstige Entities\n\n`;
            for (const entityName of uncategorized.sort()) {
                const schema = schemas[entityName];
                markdown += `### ${entityName}\n\n`;
                markdown += `**Pflichtfelder:** ${(schema.required || []).join(', ') || 'Keine'}\n\n`;
            }
        }

        const duration = (Date.now() - startTime) / 1000;

        // Speichere die Dokumentation
        const doc = await base44.asServiceRole.entities.GeneratedDocumentation.create({
            documentation_type: documentation_type || 'database_structure',
            title: documentation_type || 'Datenbank-Struktur',
            description: 'Vollständige Datenbank-Dokumentation',
            content_markdown: markdown,
            content_json: { schemas, entity_count: Object.keys(schemas).length },
            file_size_bytes: new Blob([markdown]).size,
            generation_duration_seconds: duration,
            last_generated_at: new Date().toISOString(),
            status: 'completed'
        });

        return Response.json({
            success: true,
            documentation_id: doc.id,
            file_size_bytes: doc.file_size_bytes,
            generation_duration_seconds: duration
        });

    } catch (error) {
        console.error('Error:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});