import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Fallback: Bekannte Entity-Schemas aus dem System
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

        // Verwende bekannte Schemas als Fallback
        const schemas = { ...KNOWN_ENTITY_SCHEMAS };

        logDebug(`Schemas geladen: ${Object.keys(schemas).length}`);
        logDebug(`\n=== FINAL RESULT ===`);
        logDebug(`Total schemas found: ${Object.keys(schemas).length}`);
        logDebug(`Schema names: ${Object.keys(schemas).slice(0, 5).join(', ')}...`);

        return Response.json({
            success: true,
            count: Object.keys(schemas).length,
            schemas,
            debugLogs,
            note: "Using fallback schema data due to SDK limitations"
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