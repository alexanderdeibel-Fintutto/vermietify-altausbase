import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { transactionId, financialItemAllocations, invoiceAllocations, category, unitId, contractId } = await req.json();

        if (!transactionId || (!financialItemAllocations && !invoiceAllocations)) {
            return Response.json({ error: 'transactionId and allocations are required' }, { status: 400 });
        }

        const allAllocations = [
            ...(financialItemAllocations || []).map(a => ({ ...a, type: 'financial_item' })),
            ...(invoiceAllocations || []).map(a => ({ ...a, type: 'invoice' }))
        ];

        // Validate that allocation amounts are positive
        for (const allocation of allAllocations) {
            const id = allocation.type === 'financial_item' ? allocation.financialItemId : allocation.invoiceId;
            if (!id || !allocation.amount || allocation.amount <= 0) {
                return Response.json({ error: 'Invalid allocation: id and positive amount required' }, { status: 400 });
            }
        }

        // Get transaction
        const transactions = await base44.asServiceRole.entities.BankTransaction.filter({ id: transactionId });
        if (!transactions || transactions.length === 0) {
            return Response.json({ error: 'Transaction not found' }, { status: 404 });
        }
        const transaction = transactions[0];

        // Calculate total allocation
        const totalAllocated = allAllocations.reduce((sum, a) => sum + a.amount, 0);
        const transactionAmount = Math.abs(transaction.amount);

        if (totalAllocated > transactionAmount) {
            return Response.json({ 
                error: `Total allocation (${totalAllocated}) exceeds transaction amount (${transactionAmount})` 
            }, { status: 400 });
        }

        // Delete existing links for this transaction
        const existingLinks = await base44.asServiceRole.entities.FinancialItemTransactionLink.filter({
            transaction_id: transactionId
        });
        for (const link of existingLinks) {
            await base44.asServiceRole.entities.FinancialItemTransactionLink.delete(link.id);
        }

        // Create new links
        const affectedFinancialItemIds = new Set();
        const affectedInvoiceIds = new Set();
        
        for (const allocation of allAllocations) {
            const linkData = {
                transaction_id: transactionId,
                linked_amount: allocation.amount
            };
            
            if (allocation.type === 'financial_item') {
                linkData.financial_item_id = allocation.financialItemId;
                affectedFinancialItemIds.add(allocation.financialItemId);
            } else {
                linkData.invoice_id = allocation.invoiceId;
                affectedInvoiceIds.add(allocation.invoiceId);
            }
            
            await base44.asServiceRole.entities.FinancialItemTransactionLink.create(linkData);
        }

        // Recalculate financial item statuses
        for (const itemId of affectedFinancialItemIds) {
            await recalculateFinancialItemStatus(base44, itemId);
        }
        
        // Recalculate invoice statuses
        for (const invoiceId of affectedInvoiceIds) {
            await recalculateInvoiceStatus(base44, invoiceId);
        }

        // Check if transaction is fully allocated
        const isFullyAllocated = totalAllocated >= transactionAmount - 0.01; // small tolerance for rounding

        // Mark transaction as categorized if fully allocated, but always set category/unit/contract
        // This ensures partially allocated transactions appear in categorized list via hasAllocations check
        await base44.asServiceRole.entities.BankTransaction.update(transactionId, {
            is_categorized: isFullyAllocated,
            category: category || 'rent_income',
            unit_id: unitId || null,
            contract_id: contractId || null
        });

        return Response.json({ 
            success: true,
            message: `Transaction allocated to ${affectedFinancialItemIds.size} financial item(s) and ${affectedInvoiceIds.size} invoice(s)`
        });
    } catch (error) {
        console.error('Error reconciling transaction:', error);
        return Response.json({ 
            error: error.message || 'Failed to reconcile transaction' 
        }, { status: 500 });
    }
});

async function recalculateFinancialItemStatus(base44, itemId) {
    // Get all links for this financial item
    const links = await base44.asServiceRole.entities.FinancialItemTransactionLink.filter({
        financial_item_id: itemId
    });

    // Calculate total paid amount
    const paidAmount = links.reduce((sum, link) => sum + link.linked_amount, 0);

    // Get financial item to compare with expected amount
    const items = await base44.asServiceRole.entities.FinancialItem.filter({ id: itemId });
    if (items.length === 0) return;

    const item = items[0];
    const expectedAmount = item.expected_amount || 0;

    // Determine status
    let status = 'pending';
    if (paidAmount >= expectedAmount) {
        status = 'paid';
    } else if (paidAmount > 0) {
        status = 'partial';
    }

    // Update financial item
    await base44.asServiceRole.entities.FinancialItem.update(itemId, {
        amount: paidAmount,
        status: status
    });
}

async function recalculateInvoiceStatus(base44, invoiceId) {
    // Get all links for this invoice
    const links = await base44.asServiceRole.entities.FinancialItemTransactionLink.filter({
        invoice_id: invoiceId
    });

    // Calculate total paid amount
    const paidAmount = links.reduce((sum, link) => sum + link.linked_amount, 0);

    // Get invoice to compare with expected amount
    const invoices = await base44.asServiceRole.entities.Invoice.filter({ id: invoiceId });
    if (invoices.length === 0) return;

    const invoice = invoices[0];
    const expectedAmount = invoice.expected_amount || invoice.amount || 0;

    // Determine status
    let status = 'pending';
    if (paidAmount >= expectedAmount - 0.01) {
        status = 'paid';
    } else if (paidAmount > 0) {
        status = 'partial';
    }

    // Check if overdue (only if not fully paid)
    if (status !== 'paid' && invoice.due_date) {
        try {
            const dueDate = new Date(invoice.due_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (dueDate < today) {
                status = 'overdue';
            }
        } catch (error) {
            console.error(`Error parsing due_date for invoice ${invoiceId}:`, error);
        }
    }

    // Update invoice
    await base44.asServiceRole.entities.Invoice.update(invoiceId, {
        paid_amount: paidAmount,
        status: status
    });
}