import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all invoices
        const invoices = await base44.asServiceRole.entities.Invoice.list();

        let updated = 0;
        let skipped = 0;

        for (const invoice of invoices) {
            // Skip if already has expected_amount and paid_amount set
            if (invoice.expected_amount !== undefined && invoice.paid_amount !== undefined) {
                skipped++;
                continue;
            }

            // Update invoice with new fields
            await base44.asServiceRole.entities.Invoice.update(invoice.id, {
                expected_amount: invoice.amount || 0,
                paid_amount: 0,
                status: invoice.status || 'pending'
            });

            updated++;
        }

        return Response.json({
            success: true,
            message: `Migration completed: ${updated} invoices updated, ${skipped} skipped`,
            updated,
            skipped,
            total: invoices.length
        });
    } catch (error) {
        console.error('Migration error:', error);
        return Response.json({
            error: error.message || 'Migration failed'
        }, { status: 500 });
    }
});