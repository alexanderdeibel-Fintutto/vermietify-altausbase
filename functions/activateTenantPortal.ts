import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Activates tenant portal access and sends invitation email
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { tenant_id, tenant_email } = await req.json();

        if (!tenant_id || !tenant_email) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log(`Activating portal for tenant: ${tenant_email}`);

        // Update tenant with portal access
        await base44.asServiceRole.entities.Tenant.update(tenant_id, {
            portal_access_enabled: true,
            portal_activation_date: new Date().toISOString()
        });

        // Generate unique portal token
        const portalToken = generateToken();

        // Send invitation email
        await base44.integrations.Core.SendEmail({
            to: tenant_email,
            subject: 'Willkommen im Mieterportal',
            body: `
Sehr geehrter Mieter,

Sie haben Zugriff auf unser Mieterportal erhalten.

Hier können Sie:
- Ihre Mietvertragsinformationen einsehen
- Zahlungshistorie anzeigen
- Wartungsanfragen stellen
- Mit unserem Team kommunizieren
- Wichtige Dokumente herunterladen

Klicken Sie auf den Link unten, um Ihr Portal-Konto zu aktivieren:
${getPortalAccessLink(tenant_id, portalToken)}

Dieser Link ist 7 Tage gültig.

Mit freundlichen Grüßen,
Ihr Verwaltungsteam
            `
        });

        // Log action
        await base44.asServiceRole.entities.UserAuditLog.create({
            user_email: user.email,
            action: 'tenant_portal_activated',
            resource_type: 'Tenant',
            resource_id: tenant_id,
            resource_name: tenant_email,
            timestamp: new Date().toISOString(),
            status: 'success'
        });

        return Response.json({
            success: true,
            message: 'Portal access activated and invitation sent'
        });

    } catch (error) {
        console.error('Error activating tenant portal:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function generateToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

function getPortalAccessLink(tenantId, token) {
    return `https://app.example.com/tenant-portal?id=${tenantId}&token=${token}`;
}