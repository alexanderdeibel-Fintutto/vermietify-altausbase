import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { invitationId } = await req.json();
    
    if (!invitationId) {
      return Response.json({ error: 'invitationId required' }, { status: 400 });
    }
    
    // Invitation laden
    const invitations = await base44.entities.TenantInvitation.filter({ id: invitationId });
    const invitation = invitations[0];
    
    if (!invitation) {
      return Response.json({ error: 'Invitation not found' }, { status: 404 });
    }
    
    // E-Mail senden
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1E3A8A 0%, #F97316 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
          .content { background: #f9fafb; padding: 30px; margin-top: 20px; border-radius: 10px; }
          .button { display: inline-block; background: #1E3A8A; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .features { margin: 20px 0; }
          .feature { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 Willkommen zur FinTuttO MieterApp!</h1>
          </div>
          
          <div class="content">
            <p>Hallo${invitation.tenant_name ? ' ' + invitation.tenant_name : ''},</p>
            
            <p>Sie wurden zur <strong>FinTuttO MieterApp</strong> eingeladen. Mit dieser App haben Sie jederzeit Zugriff auf alle wichtigen Informationen zu Ihrer Wohnung.</p>
            
            <div style="text-align: center;">
              <a href="${invitation.invite_url}" class="button">
                🔗 Jetzt zur MieterApp
              </a>
            </div>
            
            <div class="features">
              <h3>Was Sie mit der MieterApp können:</h3>
              
              <div class="feature">
                📄 <strong>Dokumente einsehen</strong><br>
                Nebenkostenabrechnungen, Mietvertrag und weitere Dokumente
              </div>
              
              <div class="feature">
                💬 <strong>Mit Ihrem Vermieter kommunizieren</strong><br>
                Schnelle und direkte Kommunikation über Chat
              </div>
              
              <div class="feature">
                🔧 <strong>Schäden melden</strong><br>
                Fotos hochladen und Status verfolgen
              </div>
              
              <div class="feature">
                📊 <strong>Zählerstände übermitteln</strong><br>
                Einfach per Foto oder manueller Eingabe
              </div>
            </div>
            
            <p style="margin-top: 20px;">
              <strong>Ihr Einladungscode:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${invitation.invite_code}</code>
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              Die MieterApp ist für Sie <strong>komplett kostenlos</strong>. Ihr Vermieter nutzt FinTuttO, um die Verwaltung zu vereinfachen.
            </p>
          </div>
          
          <div class="footer">
            <p>© 2026 FinTuttO · Diese E-Mail wurde von Ihrem Vermieter über Vermietify versendet</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await base44.integrations.Core.SendEmail({
      to: invitation.tenant_email,
      subject: '🏠 Einladung zur FinTuttO MieterApp',
      body: emailBody
    });
    
    return Response.json({ 
      success: true,
      message: 'Einladungs-E-Mail versendet'
    });
    
  } catch (error) {
    console.error('Send Invitation Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});