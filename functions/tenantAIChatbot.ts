import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, conversation_history, tenant_id, check_notifications } = await req.json();
    
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

    // Check for proactive notifications
    if (check_notifications && building?.id) {
      const urgentTasks = await base44.asServiceRole.entities.MaintenanceTask.filter({
        building_id: building.id,
        priority: 'urgent',
        status: 'open'
      }, '-created_date', 3);

      const announcements = await base44.asServiceRole.entities.Announcement.filter({
        target_audience: 'all_tenants',
        published_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }
      }, '-published_at', 3);

      return Response.json({
        notifications: {
          urgent_maintenance: urgentTasks.map(t => ({
            title: t.title,
            description: t.description,
            created: t.created_date
          })),
          announcements: announcements.map(a => ({
            title: a.title,
            message: a.message,
            type: a.announcement_type
          }))
        }
      });
    }

    // Get tenant's active maintenance requests for status updates
    const tenantTasks = building?.id ? await base44.asServiceRole.entities.MaintenanceTask.filter({
      building_id: building.id,
      reported_by: user.email
    }, '-created_date', 10) : [];
    
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
   - Terminvereinbarungen (erkenne Intent und sammle Details)
   - Status-Updates zu laufenden Wartungsanfragen

AKTIVE WARTUNGSANFRAGEN:
${tenantTasks.map(t => `- ${t.title}: Status ${t.status}, Priorität ${t.priority}, erstellt am ${new Date(t.created_date).toLocaleDateString('de-DE')}`).join('\n') || 'Keine aktiven Anfragen'}

GESPRÄCHSVERLAUF:
${conversation_history.map(m => `${m.role}: ${m.content}`).join('\n')}

Benutzer: ${message}

WICHTIG:
- Antworte auf Deutsch
- Sei freundlich und hilfsbereit
- Bei Wartungsanfragen: Frage nach Kategorie, Beschreibung, Dringlichkeit
- Bei Terminwünschen: Bestätige und gib nächste Schritte
- Wenn du etwas nicht weißt, empfehle den Kontakt zur Hausverwaltung

AKTIONEN:
Wenn der Benutzer eine Aktion ausführen möchte, antworte mit JSON:

1. Wartungsanfrage erstellen:
{
  "response": "Deine Antwort...",
  "action": "create_maintenance_request",
  "data": {
    "category": "...",
    "description": "...",
    "priority": "low/medium/high"
  }
}

2. Termin buchen (Besichtigung oder Beratung):
{
  "response": "Deine Antwort...",
  "action": "book_appointment",
  "data": {
    "type": "viewing/consultation",
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "notes": "..."
  }
}

3. Status-Update zu Wartung anfragen:
{
  "response": "Aktuelle Information über [task_title]...",
  "action": "maintenance_status",
  "data": {
    "task_id": "..."
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
      const task = await base44.asServiceRole.entities.MaintenanceTask.create({
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

    if (parsedResponse.action === 'book_appointment' && parsedResponse.data && tenantData) {
      const viewing = await base44.asServiceRole.entities.Viewing.create({
        unit_id: contract?.unit_id,
        company_id: building?.company_id,
        applicant_name: `${tenantData.first_name} ${tenantData.last_name}`,
        applicant_email: user.email,
        viewing_type: parsedResponse.data.type,
        scheduled_date: `${parsedResponse.data.date}T${parsedResponse.data.time}:00`,
        status: 'scheduled',
        notes: parsedResponse.data.notes
      });
      
      parsedResponse.appointment_booked = true;
      parsedResponse.appointment_id = viewing.id;
    }

    if (parsedResponse.action === 'maintenance_status' && parsedResponse.data?.task_id) {
      const task = await base44.asServiceRole.entities.MaintenanceTask.read(parsedResponse.data.task_id);
      if (task) {
        const estimatedDays = task.priority === 'urgent' ? 1 : task.priority === 'high' ? 3 : 7;
        const daysSinceCreated = Math.floor((Date.now() - new Date(task.created_date).getTime()) / (1000 * 60 * 60 * 24));
        const remainingDays = Math.max(0, estimatedDays - daysSinceCreated);
        
        parsedResponse.status_info = {
          status: task.status,
          priority: task.priority,
          assigned_to: task.assigned_to,
          estimated_completion: remainingDays > 0 ? `ca. ${remainingDays} Tage` : 'Bald',
          created: task.created_date
        };
      }
    }
    
    return Response.json(parsedResponse);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});