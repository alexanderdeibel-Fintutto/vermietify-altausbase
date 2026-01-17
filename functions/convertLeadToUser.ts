import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { lead_id } = body;
    
    if (!lead_id) {
      return Response.json({ error: 'Lead ID required' }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
    
    // Invite user
    await base44.users.inviteUser(lead.email, 'user');
    
    // Update lead
    await base44.asServiceRole.entities.Lead.update(lead_id, {
      status: 'converted',
      score: 100
    });

    // Send welcome email
    await base44.integrations.Core.SendEmail({
      to: lead.email,
      subject: 'Willkommen bei vermitify!',
      body: `Hallo ${lead.name || 'Vermieter'},\n\nwillkommen bei vermitify!\n\nSie wurden erfolgreich registriert. Klicken Sie auf den Link in Ihrer Einladungs-E-Mail, um Ihr Passwort zu setzen.\n\nBeste Grüße\nIhr vermitify Team`,
      from_name: 'vermitify Team'
    });

    return Response.json({ 
      success: true,
      message: 'Lead converted and invitation sent' 
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});