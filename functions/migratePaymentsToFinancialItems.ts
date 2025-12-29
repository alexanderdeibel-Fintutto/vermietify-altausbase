import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all existing payments
        const payments = await base44.asServiceRole.entities.Payment.list();
        
        // Get all existing payment-transaction links
        const oldLinks = await base44.asServiceRole.entities.PaymentTransactionLink.list();
        
        let migratedCount = 0;
        let linksMigratedCount = 0;

        // Migrate payments to financial items
        for (const payment of payments) {
            const financialItem = {
                type: 'receivable',
                amount: payment.amount || 0,
                expected_amount: payment.expected_amount || 0,
                currency: 'EUR',
                due_date: payment.payment_date,
                description: payment.reference || `Miete ${payment.payment_month}`,
                reference: payment.reference,
                related_to_contract_id: payment.contract_id,
                related_to_unit_id: payment.unit_id,
                related_to_tenant_id: payment.tenant_id,
                payment_month: payment.payment_month,
                status: payment.status || 'pending',
                is_automatic_from_contract: payment.payment_type === 'rent',
                category: payment.payment_type || 'rent',
                notes: payment.notes
            };

            const newFinancialItem = await base44.asServiceRole.entities.FinancialItem.create(financialItem);

            // Migrate links
            const linksForPayment = oldLinks.filter(link => link.payment_id === payment.id);
            for (const link of linksForPayment) {
                await base44.asServiceRole.entities.FinancialItemTransactionLink.create({
                    financial_item_id: newFinancialItem.id,
                    transaction_id: link.transaction_id,
                    linked_amount: link.linked_amount,
                    notes: link.notes
                });
                linksMigratedCount++;
            }

            migratedCount++;
        }

        return Response.json({
            success: true,
            migratedPayments: migratedCount,
            migratedLinks: linksMigratedCount
        });

    } catch (error) {
        console.error('Migration error:', error);
        return Response.json({ 
            error: error.message,
            details: error.stack
        }, { status: 500 });
    }
});