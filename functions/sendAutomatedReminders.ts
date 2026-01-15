import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    try {
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 });
        }

        // Alle aktiven Mietverträge laden
        const leases = await base44.entities.LeaseContract.list();
        const tenantMessages = await base44.entities.TenantMessage.list();
        
        const reminders = [];
        const now = new Date();

        for (const lease of leases) {
            // Überprüfe ob bereits Erinnerung gesendet wurde
            const existingReminder = tenantMessages.find(m => 
                m.tenant_id === lease.tenant_id && 
                m.category === 'rent' &&
                new Date(m.created_date).toDateString() === now.toDateString()
            );

            if (!existingReminder) {
                // Erstelle Erinnerungsnachricht
                const message = await base44.entities.TenantMessage.create({
                    tenant_id: lease.tenant_id,
                    subject: 'Mietzahlungserinnerung',
                    category: 'billing',
                    message: `Sehr geehrte/r ${lease.tenant_name},\n\ndie Miete für diesen Monat ist fällig.\nBetrag: €${lease.monthly_rent.toFixed(2)}\n\nBitte führen Sie die Zahlung bis zum Ende des Monats durch.\n\nMit freundlichen Grüßen,\nIhre Hausverwaltung`,
                    status: 'open',
                    priority: 'normal'
                });

                reminders.push({
                    lease_id: lease.id,
                    tenant: lease.tenant_name,
                    message_id: message.id
                });
            }
        }

        return new Response(JSON.stringify({
            success: true,
            reminders_sent: reminders.length,
            details: reminders
        }), { status: 200 });

    } catch (error) {
        console.error('Reminder error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});