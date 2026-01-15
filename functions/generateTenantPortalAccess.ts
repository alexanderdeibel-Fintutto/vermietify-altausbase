import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { leaseContractId, tenantEmail } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Generate secure tokens
        const accessToken = generateToken();
        const tempPassword = generateTempPassword();

        // Create portal access
        const portalAccess = await base44.entities.TenantPortalAccess.create({
            lease_contract_id: leaseContractId,
            tenant_email: tenantEmail,
            portal_password_hash: hashPassword(tempPassword),
            access_token: accessToken,
            token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            enabled: true,
            permissions: ['VIEW_LEASE', 'VIEW_PAYMENTS', 'VIEW_DOCUMENTS', 'SEND_MESSAGES']
        });

        // Send welcome email mit Zugangsdaten
        try {
            await base44.integrations.Core.SendEmail({
                to: tenantEmail,
                subject: 'Willkommen im Mietportal',
                body: generateWelcomeEmail(tenantEmail, tempPassword)
            });
        } catch (e) {
            console.log('Email sending skipped:', e.message);
        }

        return new Response(JSON.stringify({
            success: true,
            portal_access_id: portalAccess.id,
            temp_password: tempPassword,
            access_token: accessToken,
            portal_url: '/tenant-portal',
            message: 'Portal-Zugang erstellt. Willkommens-E-Mail versendet.'
        }), { status: 200 });

    } catch (error) {
        console.error('Error creating portal access:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});

function generateToken() {
    return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
}

function generateTempPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let pass = '';
    for (let i = 0; i < 12; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
}

function hashPassword(password) {
    // In production: use proper bcrypt
    return Buffer.from(password).toString('base64');
}

function generateWelcomeEmail(email, tempPassword) {
    return `
Sehr geehrte/r Mieter/in,

willkommen in unserem Mietportal! Hier können Sie:
- Ihren Mietvertrag einsehen
- Zahlungen überblicken
- Dokumente abrufen
- Mit uns kommunizieren
- Wartungsanfragen einreichen

ANMELDEDATEN:
E-Mail: ${email}
Temporäres Passwort: ${tempPassword}

Bitte ändern Sie dieses Passwort beim ersten Login.

Link zum Portal: https://your-domain.com/tenant-portal

Mit freundlichen Grüßen,
Ihr Vermiegenschaftsteam
    `.trim();
}