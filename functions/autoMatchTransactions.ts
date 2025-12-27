import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function findMatchingPayment(transaction, payments) {
    if (!transaction || !payments || payments.length === 0) return null;

    let bestMatch = null;
    let bestScore = 0;

    const transactionAmount = Math.abs(transaction.amount);

    for (const payment of payments) {
        if (payment.status === 'paid') continue;

        let score = 0;
        const expectedAmount = payment.expected_amount || 0;

        // Amount check (highest priority)
        if (Math.abs(transactionAmount - expectedAmount) < 0.01) {
            score += 50;
        } else if (Math.abs(transactionAmount - expectedAmount) < expectedAmount * 0.05) {
            score += 30;
        }

        // Date check
        const transactionDate = new Date(transaction.transaction_date);
        const paymentDate = new Date(payment.payment_date);
        const daysDiff = Math.abs(Math.floor((transactionDate - paymentDate) / (1000 * 60 * 60 * 24)));
        
        if (daysDiff === 0) {
            score += 30;
        } else if (daysDiff <= 3) {
            score += 20;
        } else if (daysDiff <= 7) {
            score += 10;
        }

        // Reference check
        const reference = (transaction.reference || '').toLowerCase();
        const paymentRef = (payment.reference || '').toLowerCase();
        const paymentMonth = (payment.payment_month || '').replace('-', '');
        
        if (reference.includes(paymentRef) || paymentRef.includes(reference)) {
            score += 20;
        } else if (reference.includes(paymentMonth)) {
            score += 10;
        }

        if (score > bestScore && score >= 60) {
            bestScore = score;
            bestMatch = { payment, score };
        }
    }

    return bestMatch;
}

async function matchTransactionWithPayment(base44, transactionId, paymentId) {
    const transaction = await base44.asServiceRole.entities.BankTransaction.filter({ id: transactionId });
    const payment = await base44.asServiceRole.entities.Payment.filter({ id: paymentId });

    if (transaction.length === 0 || payment.length === 0) {
        throw new Error('Transaction or payment not found');
    }

    const trans = transaction[0];
    const pay = payment[0];

    await base44.asServiceRole.entities.BankTransaction.update(transactionId, {
        is_matched: true,
        matched_payment_id: paymentId
    });

    const newAmount = (pay.amount || 0) + Math.abs(trans.amount);
    let newStatus = 'paid';
    if (newAmount < pay.expected_amount) {
        newStatus = 'partial';
    }

    await base44.asServiceRole.entities.Payment.update(paymentId, {
        amount: newAmount,
        status: newStatus
    });
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const unmatchedTransactions = await base44.entities.BankTransaction.filter({ 
            is_matched: false 
        });
        
        const pendingPayments = await base44.entities.Payment.filter({ 
            status: 'pending' 
        });

        let matchedCount = 0;

        for (const transaction of unmatchedTransactions) {
            if (transaction.amount <= 0) continue;

            const match = findMatchingPayment(transaction, pendingPayments);
            
            if (match && match.score >= 80) {
                try {
                    await matchTransactionWithPayment(base44, transaction.id, match.payment.id);
                    matchedCount++;
                } catch (error) {
                    console.error('Match error:', error);
                }
            }
        }

        return Response.json({
            success: true,
            matchedCount
        });

    } catch (error) {
        console.error('Auto-match error:', error);
        return Response.json({ 
            error: error.message || 'Internal server error' 
        }, { status: 500 });
    }
});