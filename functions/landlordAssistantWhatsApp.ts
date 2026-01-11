import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { message, sender_phone } = await req.json();
    
    // Parse intent using AI
    const intent = await base44.integrations.Core.InvokeLLM({
      prompt: `Du bist ein Vermieter-Assistent. Analysiere die folgende Nachricht und identifiziere die Aktion:

Nachricht: "${message}"

Mögliche Aktionen:
- list_vacancies: Leerstandsübersicht
- overdue_payments: Offene Zahlungen
- maintenance_tasks: Wartungsaufgaben
- rent_overview: Mietübersicht
- other: Sonstiges

Extrahiere auch relevante Parameter.`,
      response_json_schema: {
        type: "object",
        properties: {
          action: { type: "string" },
          confidence: { type: "number" },
          parameters: { type: "object" }
        }
      }
    });
    
    let response = '';
    
    switch (intent.action) {
      case 'list_vacancies':
        const vacancies = await base44.asServiceRole.entities.Vacancy.filter({ status: 'active' });
        response = `🏠 Leerstandsübersicht:\n\n${vacancies.length} freie Einheiten\n`;
        vacancies.slice(0, 5).forEach(v => {
          response += `- Einheit ${v.unit_id}: Seit ${v.vacancy_start}\n`;
        });
        break;
        
      case 'overdue_payments':
        const reminders = await base44.asServiceRole.entities.PaymentReminder.filter({ 
          payment_received: false 
        });
        response = `💰 Offene Zahlungen:\n\n${reminders.length} überfällige Mieten\n`;
        for (const r of reminders.slice(0, 5)) {
          const tenant = await base44.asServiceRole.entities.Tenant.read(r.tenant_id);
          response += `- ${tenant.last_name}: ${r.amount_due}€ (Stufe ${r.reminder_level})\n`;
        }
        break;
        
      case 'maintenance_tasks':
        const tasks = await base44.asServiceRole.entities.MaintenanceTask.filter({ status: 'open' });
        response = `🔧 Offene Wartungen:\n\n${tasks.length} Aufgaben\n`;
        tasks.slice(0, 5).forEach(t => {
          response += `- ${t.title}: ${t.priority}\n`;
        });
        break;
        
      case 'rent_overview':
        const contracts = await base44.asServiceRole.entities.LeaseContract.filter({ status: 'active' });
        const totalRent = contracts.reduce((sum, c) => sum + (c.monthly_rent || 0), 0);
        response = `📊 Mietübersicht:\n\n${contracts.length} aktive Verträge\nGesamtmiete/Monat: ${totalRent}€`;
        break;
        
      default:
        response = 'Verfügbare Befehle:\n- Leerstand\n- Zahlungen\n- Wartung\n- Mietübersicht';
    }
    
    return Response.json({ success: true, response });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});