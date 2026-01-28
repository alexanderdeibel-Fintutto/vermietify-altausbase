import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { event, data } = await req.json();
    
    // Nur bei neuen Verträgen
    if (event.type !== 'create' || event.entity_name !== 'LeaseContract') {
      return Response.json({ skipped: true });
    }
    
    const contract = data;
    
    // Mieter-Daten laden
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: contract.tenant_id });
    const tenant = tenants[0];
    
    if (!tenant || !tenant.email) {
      return Response.json({ skipped: true, reason: 'No tenant email' });
    }
    
    // Prüfen ob bereits Einladung existiert
    const existingInvites = await base44.asServiceRole.entities.TenantInvitation.filter({
      tenant_email: tenant.email,
      unit_id: contract.unit_id
    });
    
    if (existingInvites.length > 0) {
      return Response.json({ skipped: true, reason: 'Already invited' });
    }
    
    // Einladung erstellen
    const inviteCode = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    const inviteUrl = `https://mieterapp.fintutto.de/invite/${inviteCode}`;
    
    const invitation = await base44.asServiceRole.entities.TenantInvitation.create({
      unit_id: contract.unit_id,
      building_id: contract.unit_id,
      tenant_email: tenant.email,
      tenant_name: `${tenant.first_name} ${tenant.last_name}`,
      invite_code: inviteCode,
      invite_url: inviteUrl,
      invite_type: 'mieterapp',
      status: 'pending',
      access_level: 'full',
      note: 'Automatisch erstellt bei Vertragserstellung'
    });
    
    // E-Mail senden
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: tenant.email,
      subject: `🏠 Willkommen - Zugang zur MieterApp`,
      body: `
        <h2>Herzlich willkommen!</h2>
        <p>Hallo ${tenant.first_name} ${tenant.last_name},</p>
        <p>Ihr Mietvertrag wurde angelegt. Sie haben nun Zugang zur <strong>FinTuttO MieterApp</strong>.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" style="display: inline-block; background: #1E3A8A; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px;">
            Zur MieterApp
          </a>
        </p>
        <p><strong>Was Sie in der App finden:</strong></p>
        <ul>
          <li>📄 Ihre Dokumente (Nebenkostenabrechnungen, Verträge)</li>
          <li>💬 Direkter Chat mit Ihrem Vermieter</li>
          <li>🔧 Schäden und Reparaturen melden</li>
          <li>📊 Zählerstände übermitteln</li>
        </ul>
        <p>Einladungscode: <code>${inviteCode}</code></p>
      `
    });
    
    return Response.json({
      success: true,
      invitationId: invitation.id,
      tenantEmail: tenant.email
    });
    
  } catch (error) {
    console.error('Auto Invite Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});