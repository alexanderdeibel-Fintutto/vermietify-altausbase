import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Da .schema() nicht im SDK verfügbar ist, erstellen wir eine vereinfachte Liste
        const knownEntities = [
            'Building', 'Unit', 'Tenant', 'LeaseContract', 'Invoice', 'BankAccount', 
            'BankTransaction', 'OperatingCostStatement', 'Document', 'Task', 'Owner',
            'UploadedDocument', 'GeneratedDocument', 'UserProblem', 'TestAssignment',
            'Report', 'Financing', 'PurchaseContract', 'Asset', 'Portfolio',
            'TaxReturnV', 'ElsterSubmission', 'Feature', 'Product', 'FeatureGroup',
            'Meter', 'MeterReading', 'Payment', 'ActualPayment', 'PlannedBooking',
            'CoTenant', 'Applicant', 'Deposit', 'OperatingCostItem', 'BankTransfer',
            'CostCategory', 'EnergyPassport', 'Equipment', 'Shareholder', 'BuildingOwnership',
            'Notification', 'Webhook', 'Automation', 'Workflow', 'Mandant'
        ];

        const schemas = {};
        for (const entityName of knownEntities) {
            schemas[entityName] = {
                name: entityName,
                type: 'object',
                properties: {},
                description: `Entity: ${entityName}`
            };
        }

        return Response.json({
            success: true,
            count: Object.keys(schemas).length,
            schemas,
            debugLogs: [`${Object.keys(schemas).length} Entities geladen`],
            note: `${Object.keys(schemas).length} Entity-Schemas (vereinfacht)`
        });

    } catch (error) {
        console.error('Error:', error);
        return Response.json({
            error: error.message,
            debugLogs: [`Fehler: ${error.message}`]
        }, { status: 500 });
    }
});