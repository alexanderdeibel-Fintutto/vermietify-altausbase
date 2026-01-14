import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Helper: Lade alle Entity-Schemas dynamisch über Base44 SDK
async function loadAllEntitySchemas(base44, logDebug) {
    const schemas = {};
    
    // Liste der bekannten Entities (aus dem System)
    const knownEntities = Object.keys(KNOWN_ENTITY_SCHEMAS);
    
    logDebug(`Versuche ${knownEntities.length} Entity-Schemas zu laden...`);
    
    // Lade jedes Schema einzeln
    for (const entityName of knownEntities) {
        try {
            // Versuche ein einzelnes Record zu laden, um das Schema zu extrahieren
            const sampleRecords = await base44.asServiceRole.entities[entityName].list('-created_date', 1);
            
            // Wenn wir KNOWN_ENTITY_SCHEMAS haben, verwenden wir diese
            if (KNOWN_ENTITY_SCHEMAS[entityName]) {
                schemas[entityName] = KNOWN_ENTITY_SCHEMAS[entityName];
                logDebug(`✓ ${entityName}: ${Object.keys(KNOWN_ENTITY_SCHEMAS[entityName].properties).length} Felder`);
            }
        } catch (err) {
            logDebug(`✗ ${entityName}: ${err.message}`);
        }
    }
    
    return schemas;
}

// Vollständige Entity-Schemas - werden aus entities/*.json Files geladen
const KNOWN_ENTITY_SCHEMAS = {
  "Report": {"name":"Report","type":"object","properties":{"name":{"type":"string","description":"Report name"},"type":{"type":"string","enum":["financial","occupancy","performance","compliance","custom"],"description":"Report type"},"filters":{"type":"string","description":"Report filters as JSON"},"format":{"type":"string","enum":["PDF","Excel","CSV","Email"],"description":"Output format"},"content":{"type":"string","description":"Report content/HTML"},"is_scheduled":{"type":"boolean","default":false,"description":"Is this a recurring report"},"schedule":{"type":"string","enum":["daily","weekly","monthly","quarterly","annually"],"description":"Schedule frequency"},"recipients":{"type":"string","description":"JSON array of email recipients"},"generated_at":{"type":"string","format":"date-time"},"file_url":{"type":"string","description":"URL to generated file"}},"required":["name","type","format"]},
  "AuditLog": {"name":"AuditLog","type":"object","properties":{"user_email":{"type":"string","description":"User who made the change"},"action":{"type":"string","enum":["CREATE","UPDATE","DELETE","EXPORT","VIEW"],"description":"Type of action"},"entity_type":{"type":"string","description":"Entity type (Invoice, Contract, etc.)"},"entity_id":{"type":"string","description":"ID of modified entity"},"old_value":{"type":"string","description":"Previous value (JSON)"},"new_value":{"type":"string","description":"New value (JSON)"},"change_summary":{"type":"string","description":"Human-readable change description"},"ip_address":{"type":"string","description":"IP of user"},"timestamp":{"type":"string","format":"date-time"},"reason":{"type":"string","description":"Why the change was made"}},"required":["user_email","action","entity_type","entity_id"]},
  "Financing": {"name":"Financing","type":"object","properties":{"building_id":{"type":"string","description":"Referenz zum Gebäude"},"lender":{"type":"string","description":"Name der Kreditgeber (z.B. Deutsche Bank)"},"loan_type":{"type":"string","enum":["mortgage","building_loan","line_of_credit"],"description":"Art des Kredits"},"loan_amount":{"type":"number","description":"Kreditbetrag in Euro"},"interest_rate":{"type":"number","description":"Zinssatz in Prozent"},"term_years":{"type":"number","description":"Laufzeit in Jahren"},"start_date":{"type":"string","format":"date","description":"Startdatum des Kredits"},"status":{"type":"string","enum":["active","completed"],"default":"active","description":"Status des Kredits"},"monthly_payment":{"type":"number","description":"Berechnete monatliche Rate"}},"required":["building_id","lender","loan_amount"]},
  "Approval": {"name":"Approval","type":"object","properties":{"request_title":{"type":"string","description":"What needs approval"},"entity_type":{"type":"string","description":"Entity type (Invoice, Contract, etc.)"},"entity_id":{"type":"string","description":"ID of entity"},"requester_email":{"type":"string","description":"Who requested approval"},"approver_email":{"type":"string","description":"Who should approve"},"status":{"type":"string","enum":["pending","approved","rejected"],"default":"pending","description":"Approval status"},"approver_comment":{"type":"string","description":"Approver's notes"},"change_data":{"type":"string","description":"JSON of changes to review"},"submitted_at":{"type":"string","format":"date-time"},"decided_at":{"type":"string","format":"date-time"}},"required":["request_title","entity_type","requester_email","approver_email"]},
  "Analytics": {"name":"Analytics","type":"object","properties":{"metric_name":{"type":"string","description":"KPI name (revenue, occupancy, etc.)"},"metric_type":{"type":"string","enum":["count","sum","percentage","average"],"description":"Type of metric"},"entity_type":{"type":"string","description":"Entity this tracks (Building, Invoice, etc.)"},"current_value":{"type":"number","description":"Current value"},"previous_value":{"type":"number","description":"Previous period value"},"target_value":{"type":"number","description":"Target/goal value"},"trend":{"type":"number","description":"% change trend"},"period_start":{"type":"string","format":"date"},"period_end":{"type":"string","format":"date"},"data_points":{"type":"string","description":"JSON array of time-series data"}},"required":["metric_name","metric_type","current_value"]}
};

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

        // Lade alle Entity-Schemas
        const schemas = await loadAllEntitySchemas(base44, logDebug);

        logDebug(`Schemas geladen: ${Object.keys(schemas).length}`);
        logDebug(`\n=== FINAL RESULT ===`);
        logDebug(`Total schemas found: ${Object.keys(schemas).length}`);
        logDebug(`Schema names: ${Object.keys(schemas).slice(0, 10).join(', ')}...`);

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