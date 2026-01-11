import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tenant_id, question, conversation_history = [] } = await req.json();
    
    // Get tenant context
    const tenant = await base44.asServiceRole.entities.Tenant.read(tenant_id);
    const contracts = await base44.asServiceRole.entities.LeaseContract.filter({ 
      tenant_id, 
      status: 'active' 
    });
    const contract = contracts[0];
    
    let propertyInfo = '';
    let buildingInfo = '';
    if (contract?.unit_id) {
      const unit = await base44.asServiceRole.entities.Unit.read(contract.unit_id);
      const building = await base44.asServiceRole.entities.Building.read(unit.building_id);
      
      propertyInfo = `Wohnung: ${unit.unit_number || unit.id}
Größe: ${unit.size_sqm || 'N/A'} m²
Stockwerk: ${unit.floor || 'N/A'}`;
      
      buildingInfo = `Gebäude: ${building.name || building.address?.street}
Adresse: ${building.address?.street}, ${building.address?.postal_code} ${building.address?.city}`;
    }
    
    // Get onboarding progress
    const onboardingSessions = await base44.asServiceRole.entities.TenantAppSession.filter({ tenant_id });
    const onboardingProgress = onboardingSessions[0]?.onboarding_progress || {};
    
    const contextPrompt = `Du bist ein freundlicher KI-Assistent für neue Mieter. Du hilfst bei der Einzugs-Checkliste und beantwortest Fragen.

MIETER-KONTEXT:
Name: ${tenant.first_name} ${tenant.last_name}
Einzugsdatum: ${contract?.start_date || 'N/A'}
${propertyInfo}
${buildingInfo}

ONBOARDING-FORTSCHRITT:
- Profil eingerichtet: ${onboardingProgress.profile_setup ? '✓' : '○'}
- Dokumente geprüft: ${onboardingProgress.document_review ? '✓' : '○'}
- Zahlungsdaten: ${onboardingProgress.payment_setup ? '✓' : '○'}
- Hausordnung gelesen: ${onboardingProgress.house_rules_read ? '✓' : '○'}
- Notfallkontakte: ${onboardingProgress.emergency_contacts_saved ? '✓' : '○'}

DEINE AUFGABEN:
1. Beantworte Fragen zum Einzug, zur Wohnung, zur Umgebung
2. Helfe bei der Checkliste (erkläre Schritte)
3. Gebe Tipps für digitale Schlüssel, Nebenkostenabrechnungen
4. Informiere über lokale Geschäfte, ÖPNV, Müllabfuhr
5. Biete an, Termine für Wohnungsübergaben zu planen

Bei Terminfragen antworte mit JSON:
{"type": "schedule_request", "appointment_type": "...", "preferred_dates": [...]}

Sonst antworte direkt auf Deutsch, freundlich und hilfreich.

Bisherige Konversation:
${conversation_history.map(m => `${m.role}: ${m.content}`).join('\n')}

Neue Frage: ${question}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: contextPrompt
    });
    
    // Check if response contains schedule request
    if (response.includes('"type": "schedule_request"')) {
      try {
        const scheduleData = JSON.parse(response);
        return Response.json({ 
          answer: "Gerne! Ich helfe Ihnen einen Termin zu vereinbaren.",
          schedule_request: scheduleData 
        });
      } catch (e) {
        return Response.json({ answer: response });
      }
    }
    
    return Response.json({ answer: response });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});