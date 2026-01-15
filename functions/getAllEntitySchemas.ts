import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const debugLogs = [];
    const logDebug = (msg) => {
        debugLogs.push(msg);
        console.error(msg);
    };

    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        logDebug("=== getAllEntitySchemas START ===");
        logDebug(`User: ${user?.email}`);

        // Verwende eine einfache Liste von Entities mit ihren Eigenschaften
        // Da .schema() nicht funktioniert, geben wir eine Basis-Info zurück
        const knownEntities = [
            'Building', 'Unit', 'Tenant', 'LeaseContract', 'Invoice', 'BankAccount', 
            'BankTransaction', 'OperatingCostStatement', 'Document', 'Task', 'Owner',
            'UploadedDocument', 'GeneratedDocument', 'UserProblem', 'TestAssignment',
            'Report', 'Financing', 'PurchaseContract', 'Asset', 'Portfolio',
            'TaxReturnV', 'ElsterSubmission', 'Feature', 'Product', 'FeatureGroup',
            'Meter', 'MeterReading', 'Payment', 'ActualPayment', 'PlannedBooking',
            'CoTenant', 'Applicant', 'Deposit', 'OperatingCostItem', 'BankTransfer',
            'CostCategory', 'EnergyPassport', 'Equipment', 'Shareholder', 'BuildingOwnership'
        ];

        // Erstelle ein einfaches Schema-Objekt für jede Entity
        const schemas = {};
        for (const entityName of knownEntities) {
            schemas[entityName] = {
                name: entityName,
                type: 'object',
                properties: {},
                description: `Entity: ${entityName}`,
                note: 'Schema-Details über SDK derzeit nicht verfügbar'
            };
        }

        logDebug(`✓ ${knownEntities.length} Entity-Platzhalter erstellt`);

        return Response.json({
            success: true,
            count: Object.keys(schemas).length,
            schemas,
            debugLogs,
            note: `Geladen: ${Object.keys(schemas).length} Entity-Schemas (vereinfacht)`
        });

    } catch (error) {
        debugLogs.push(`Error: ${error.message}`);
        console.error('Error:', error);
        return Response.json({
            error: error.message,
            debugLogs
        }, { status: 500 });
    }
});