import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { transactionId, invoiceData } = body;

        if (!transactionId || !invoiceData) {
            return Response.json({ 
                error: 'transactionId und invoiceData erforderlich' 
            }, { status: 400 });
        }

        // Get the transaction
        const transaction = (await base44.asServiceRole.entities.BankTransaction.filter({ id: transactionId }))[0];
        if (!transaction) {
            return Response.json({ error: 'Transaktion nicht gefunden' }, { status: 404 });
        }

        // Get the cost type
        const costType = (await base44.asServiceRole.entities.CostType.filter({ id: invoiceData.cost_type_id }))[0];
        if (!costType) {
            return Response.json({ error: 'Kostenart nicht gefunden' }, { status: 404 });
        }

        // Determine invoice type based on transaction amount
        const invoiceType = transaction.amount < 0 ? 'expense' : 'other_income';
        const amount = Math.abs(transaction.amount);

        // 1. Create Invoice
        const invoice = await base44.asServiceRole.entities.Invoice.create({
            type: invoiceType,
            invoice_date: invoiceData.invoice_date,
            due_date: invoiceData.invoice_date, // Same as invoice date
            amount: amount,
            expected_amount: amount,
            paid_amount: amount, // Already paid via transaction
            recipient: invoiceData.recipient,
            reference: invoiceData.reference || '',
            description: invoiceData.description,
            cost_type_id: invoiceData.cost_type_id,
            status: 'paid',
            notes: invoiceData.notes || ''
        });

        // 2. Create FinancialItem
        const financialItem = await base44.asServiceRole.entities.FinancialItem.create({
            type: invoiceType === 'expense' ? 'payable' : 'receivable',
            expected_amount: amount,
            amount: amount,
            status: 'paid',
            due_date: invoiceData.invoice_date,
            description: invoiceData.description,
            reference: invoiceData.reference || '',
            category: costType.sub_category,
            cost_type_id: invoiceData.cost_type_id,
            is_automatic_from_contract: false
        });

        // 3. Create FinancialItemTransactionLink
        await base44.asServiceRole.entities.FinancialItemTransactionLink.create({
            financial_item_id: financialItem.id,
            invoice_id: invoice.id,
            transaction_id: transactionId,
            linked_amount: amount
        });

        // 4. Mark transaction as categorized
        await base44.asServiceRole.entities.BankTransaction.update(transactionId, {
            is_categorized: true,
            category: costType.type === 'expense' ? 'other_costs' : 'other_income'
        });

        return Response.json({
            success: true,
            invoice,
            financialItem
        });

    } catch (error) {
        console.error('Error creating invoice and allocating transaction:', error);
        return Response.json({ 
            error: error.message || 'Fehler beim Erstellen'
        }, { status: 500 });
    }
});