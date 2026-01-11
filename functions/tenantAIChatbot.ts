import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, conversation_history, tenant_id } = await req.json();
    
    // Get tenant context
    const tenant = await base44.entities.Tenant.filter({ email: user.email });
    const tenantData = tenant[0];
    
    const contracts = tenantData ? await base44.entities.LeaseContract.filter({ 
      tenant_id: tenantData.id, 
      status: 'active' 
    }) : [];
    const contract = contracts[0];
    
    let unit, building;
    if (contract?.unit_id) {
      unit = await base44.entities.Unit.read(contract.unit_id);
      building = await base44.entities.Building.read(unit.building_id);
    }
    
    // Build context
    const contextPrompt = `Du bist ein hilfreicher Assistent für Mieter im Mieterportal.

MIETER-KONTEXT:
${tenantData ? `Name: ${tenantData.first_name} ${tenantData.last_name}` : 'Nicht angemeldet'}
${unit ? `Wohnung: ${unit.unit_number}` : ''}
${building ? `Gebäude: ${building.address?.street}, ${building.address?.city}` : ''}
${contract ? `Miete: €${contract.rent_amount}/Monat` : ''}
${contract ? `Vertragslaufzeit: ${contract.start_date} bis ${contract.end_date || 'unbefristet'}` : ''}

FÄHIGKEITEN:
1. Beantworte Fragen zu:
   - Wartungsanfragen (wie erstellen, Status prüfen)
   - Mietverträgen (Laufzeit, Kündigungsfristen, Verlängerung)
   - Mietzahlungen (Zahlungstermine, Methoden, verspätete Zahlungen)
   - Hausordnung (Ruhezeiten, Müll, Fahrräder, etc.)
   - Gebäudeausstattung und Gemeinschaftsräume
   - Lokale Dienstleistungen

2. Hilf bei:
   - Erstellung von Wartungsanfragen (erkenne Intent und frage nach Details)
   - Terminvereinbarungen (erkenne Intent)

GESPRÄCHSVERLAUF:
${conversation_history.map(m => `${m.role}: ${m.content}`).join('\n')}

Benutzer: ${message}

WICHTIG:
- Antworte auf Deutsch
- Sei freundlich und hilfsbereit
- Bei Wartungsanfragen: Frage nach Kategorie, Beschreibung, Dringlichkeit
- Bei Terminwünschen: Bestätige und gib nächste Schritte
- Wenn du etwas nicht weißt, empfehle den Kontakt zur Hausverwaltung

Wenn der Benutzer eine Wartungsanfrage erstellen möchte, antworte mit JSON:
{
  "response": "Deine Antwort...",
  "action": "create_maintenance_request",
  "data": {
    "category": "...",
    "description": "...",
    "priority": "low/medium/high"
  }
}

Ansonsten antworte nur mit Text.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: contextPrompt
    });
    
    // Check if response is JSON (action required)
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response);
    } catch {
      parsedResponse = { response };
    }
    
    // Handle actions
    if (parsedResponse.action === 'create_maintenance_request' && parsedResponse.data && tenantData) {
      const task = await base44.entities.MaintenanceTask.create({
        building_id: building?.id,
        company_id: building?.company_id,
        title: `${parsedResponse.data.category} - Mieter ${tenantData.first_name} ${tenantData.last_name}`,
        description: parsedResponse.data.description,
        category: parsedResponse.data.category.toLowerCase(),
        priority: parsedResponse.data.priority,
        status: 'open',
        reported_by: user.email
      });
      
      parsedResponse.task_created = true;
      parsedResponse.task_id = task.id;
    }
    
    return Response.json(parsedResponse);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});