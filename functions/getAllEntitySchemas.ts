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

        // Liste der bekannten Entities
        const knownEntities = [
            'Building', 'Unit', 'Tenant', 'LeaseContract', 'Invoice', 'BankAccount', 
            'BankTransaction', 'OperatingCostStatement', 'Document', 'Task', 'Owner',
            'UploadedDocument', 'GeneratedDocument', 'UserProblem', 'TestAssignment',
            'Report', 'Financing', 'PurchaseContract', 'Asset', 'Portfolio',
            'TaxReturnV', 'ElsterSubmission', 'Feature', 'Product', 'FeatureGroup'
        ];

        const schemas = {};
        let successCount = 0;
        
        // Lade Schemas für bekannte Entities
        for (const entityName of knownEntities) {
            try {
                const schema = await base44.asServiceRole.entities[entityName].schema();
                schemas[entityName] = schema;
                successCount++;
            } catch (err) {
                logDebug(`Überspringe ${entityName}: ${err.message}`);
            }
        }

        logDebug(`✓ ${successCount} von ${knownEntities.length} Schemas erfolgreich geladen`);
        logDebug(`Schemas: ${Object.keys(schemas).join(', ')}`);

        return Response.json({
            success: true,
            count: Object.keys(schemas).length,
            schemas,
            debugLogs,
            note: `Geladen: ${Object.keys(schemas).length} Entity-Schemas`
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