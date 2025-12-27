import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Alle Zahlungen und Verträge abrufen
        const allPayments = await base44.entities.Payment.list();
        const contracts = await base44.entities.LeaseContract.list();
        const contractIds = new Set(contracts.map(c => c.id));

        // Verwaiste Zahlungen finden und löschen
        const orphanedPayments = allPayments.filter(p => !contractIds.has(p.contract_id));
        
        let deletedCount = 0;
        for (const payment of orphanedPayments) {
            await base44.entities.Payment.delete(payment.id);
            deletedCount++;
        }

        return Response.json({ 
            success: true, 
            deletedCount,
            message: `${deletedCount} verwaiste Zahlungen wurden gelöscht`
        });
    } catch (error) {
        console.error('Error cleaning orphaned payments:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});