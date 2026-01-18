import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { lead_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: 'Lead-ID erforderlich' }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Lead.get(lead_id);

    await base44.users.inviteUser(lead.email, 'user');

    await base44.asServiceRole.entities.Lead.update(lead_id, {
      status: 'converted',
      last_activity_at: new Date().toISOString()
    });

    await base44.integrations.Core.SendEmail({
      to: lead.email,
      subject: 'Willkommen bei Vermitify! 🏠',
      from_name: 'Vermitify Team',
      body: `Hallo ${lead.name || ''},\n\nIhre Registrierung war erfolgreich! Sie erhalten in Kürze eine separate E-Mail mit Ihrem Login-Link.\n\nBeste Grüße\nIhr Vermitify Team`
    });

    return Response.json({ success: true });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});