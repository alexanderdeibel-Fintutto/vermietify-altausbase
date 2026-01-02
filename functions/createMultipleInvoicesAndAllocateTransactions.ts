import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { transactionIds, invoiceData } = await req.json();

        if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
            return Response.json({ error: 'Keine Transaktions-IDs bereitgestellt' }, { status: 400 });
        }
        if (!invoiceData || !invoiceData.cost_type_id || !invoiceData.recipient || !invoiceData.description) {
            return Response.json({ error: 'Unvollständige Rechnungsdaten' }, { status: 400 });
        }

        const results = [];
        let successCount = 0;
        let errorCount = 0;
        
        for (const transactionId of transactionIds) {
            try {
                const transaction = await base44.asServiceRole.entities.BankTransaction.get(transactionId);
                if (!transaction) {
                    results.push({ transactionId, success: false, error: 'Transaktion nicht gefunden' });
                    errorCount++;
                    continue;
                }

                // Ensure valid date
                const transactionDate = transaction.transaction_date || new Date().toISOString().split('T')[0];

                // Create Invoice
                const newInvoice = await base44.asServiceRole.entities.Invoice.create({
                    type: transaction.amount < 0 ? 'expense' : 'other_income',
                    invoice_date: transactionDate,
                    due_date: transactionDate,
                    amount: Math.abs(transaction.amount),
                    expected_amount: Math.abs(transaction.amount),
                    paid_amount: Math.abs(transaction.amount),
                    currency: 'EUR',
                    recipient: invoiceData.recipient,
                    reference: transaction.reference || transaction.description,
                    description: invoiceData.description,
                    unit_id: invoiceData.unit_id || null,
                    building_id: invoiceData.building_id || null,
                    cost_type_id: invoiceData.cost_type_id,
                    accounting_notes: invoiceData.notes,
                    operating_cost_relevant: invoiceData.operating_cost_relevant || false,
                    status: 'paid',
                    notes: invoiceData.notes
                });

                // Create Financial Item
                const newFinancialItem = await base44.asServiceRole.entities.FinancialItem.create({
                    type: transaction.amount < 0 ? 'payable' : 'receivable',
                    amount: Math.abs(transaction.amount),
                    expected_amount: Math.abs(transaction.amount),
                    currency: 'EUR',
                    due_date: transactionDate,
                    description: invoiceData.description,
                    reference: transaction.reference || transaction.description,
                    related_to_unit_id: invoiceData.unit_id || null,
                    status: 'settled',
                    is_automatic_from_contract: false,
                    category: invoiceData.category_name,
                    cost_type_id: invoiceData.cost_type_id,
                    notes: invoiceData.notes
                });

                // Link Financial Item, Invoice, and Transaction
                await base44.asServiceRole.entities.FinancialItemTransactionLink.create({
                    financial_item_id: newFinancialItem.id,
                    invoice_id: newInvoice.id,
                    transaction_id: transaction.id,
                    linked_amount: Math.abs(transaction.amount)
                });

                // Mark Bank Transaction as categorized
                await base44.asServiceRole.entities.BankTransaction.update(transaction.id, {
                    is_categorized: true,
                    category: invoiceData.category_name,
                    unit_id: invoiceData.unit_id || null
                });

                results.push({ transactionId, success: true, invoiceId: newInvoice.id });
                successCount++;

            } catch (error) {
                console.error(`Error processing transaction ${transactionId}:`, error);
                results.push({ transactionId, success: false, error: error.message });
                errorCount++;
            }
        }

        return Response.json({ 
            success: errorCount === 0, 
            successCount,
            errorCount,
            results 
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});