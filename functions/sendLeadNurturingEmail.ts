import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { lead_id, template } = body;
    
    const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
    
    const templates = {
      '7day_followup': {
        subject: 'Ihre Immobilien-Rendite verbessern 📈',
        body: `Hallo ${lead.name || 'Vermieter'},\n\nvor einer Woche haben Sie unseren Rendite-Rechner genutzt.\n\nMöchten Sie Ihre Rendite weiter optimieren? Mit vermitify können Sie:\n\n✓ Steuern sparen durch automatische Anlage V\n✓ Zeit sparen durch automatisierte BK-Abrechnungen\n✓ Übersicht behalten über alle Objekte\n\nJetzt 14 Tage kostenlos testen:\nhttps://app.vermitify.de/signup\n\nBeste Grüße\nIhr vermitify Team`
      },
      'tax_season': {
        subject: 'Anlage V in 10 Minuten erstellen ⏱️',
        body: `Hallo ${lead.name || 'Vermieter'},\n\ndie Steuersaison naht!\n\nErstellen Sie Ihre Anlage V in nur 10 Minuten statt 3 Stunden.\nvermitify bereitet alle Daten automatisch auf.\n\n✓ Automatische Berechnung\n✓ ELSTER-Export\n✓ Optimierungsvorschläge\n\nJetzt kostenlos testen:\nhttps://app.vermitify.de/signup\n\nBeste Grüße\nIhr vermitify Team`
      }
    };

    const selectedTemplate = templates[template] || templates['7day_followup'];

    await base44.integrations.Core.SendEmail({
      to: lead.email,
      subject: selectedTemplate.subject,
      body: selectedTemplate.body,
      from_name: 'vermitify Team'
    });

    await base44.asServiceRole.entities.Lead.update(lead_id, {
      status: 'nurturing',
      last_activity_at: new Date().toISOString()
    });

    return Response.json({ success: true });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});