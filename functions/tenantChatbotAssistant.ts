import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tenant_id, company_id, question } = await req.json();
    
    // Get tenant contract and building info for context
    const contracts = await base44.asServiceRole.entities.LeaseContract.filter({ 
      tenant_id, 
      status: 'active' 
    });
    const contract = contracts[0];
    
    let buildingInfo = '';
    if (contract?.unit_id) {
      const unit = await base44.asServiceRole.entities.Unit.read(contract.unit_id);
      const building = await base44.asServiceRole.entities.Building.read(unit.building_id);
      buildingInfo = `Adresse: ${building.address?.street}, ${building.address?.city}`;
    }
    
    const contextPrompt = `Du bist ein hilfreicher Assistent für Mieter einer Immobilienverwaltung.

Mieter-Kontext:
- Vertragsbeginn: ${contract?.start_date || 'N/A'}
- Monatliche Miete: ${contract?.monthly_rent || 'N/A'}€
- Nebenkosten-Vorauszahlung: ${contract?.utility_advance || 'N/A'}€
- ${buildingInfo}

Beantworte folgende häufige Fragen präzise und freundlich:
- Zahlungsfragen (Fälligkeit, Betrag, Zahlungsmethode)
- Wartungsanfragen (wie melden, Status prüfen)
- Dokumentenzugriff (wo finden)
- Kontakt zur Verwaltung
- Hausordnung und Regeln
- Nebenkosten und Abrechnungen

Mieter-Frage: ${question}

Antworte auf Deutsch, kurz und präzise. Verweise auf die App-Funktionen wenn relevant.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: contextPrompt
    });
    
    return Response.json({ answer: response });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});