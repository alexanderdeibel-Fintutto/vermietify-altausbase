import { base44 } from '@/api/base44Client';
import { parseISO, differenceInDays, isSameMonth } from 'date-fns';

/**
 * Versucht, eine Banktransaktion automatisch mit einer Zahlung abzugleichen
 * @param {Object} transaction - Die Banktransaktion
 * @param {Array} payments - Liste aller ausstehenden Zahlungen
 * @returns {Object|null} - Beste übereinstimmende Zahlung oder null
 */
export function findMatchingPayment(transaction, payments) {
    if (!transaction || !payments || payments.length === 0) return null;

    let bestMatch = null;
    let bestScore = 0;

    const transactionDate = parseISO(transaction.transaction_date);
    const transactionAmount = Math.abs(transaction.amount);

    for (const payment of payments) {
        if (payment.status === 'paid') continue; // Skip bereits bezahlte

        let score = 0;
        const paymentDate = parseISO(payment.payment_date);
        const expectedAmount = payment.expected_amount || 0;

        // Betrag prüfen (höchste Priorität)
        if (Math.abs(transactionAmount - expectedAmount) < 0.01) {
            score += 50; // Exakte Übereinstimmung
        } else if (Math.abs(transactionAmount - expectedAmount) < expectedAmount * 0.05) {
            score += 30; // Innerhalb 5% Toleranz
        }

        // Datum prüfen
        const daysDiff = Math.abs(differenceInDays(transactionDate, paymentDate));
        if (daysDiff === 0) {
            score += 30; // Gleiches Datum
        } else if (daysDiff <= 3) {
            score += 20; // Innerhalb 3 Tage
        } else if (daysDiff <= 7) {
            score += 10; // Innerhalb 1 Woche
        } else if (isSameMonth(transactionDate, paymentDate)) {
            score += 5; // Gleicher Monat
        }

        // Referenz prüfen
        const reference = (transaction.reference || '').toLowerCase();
        const paymentRef = (payment.reference || '').toLowerCase();
        const paymentMonth = (payment.payment_month || '').replace('-', '');
        
        if (reference.includes(paymentRef) || paymentRef.includes(reference)) {
            score += 20;
        } else if (reference.includes(paymentMonth)) {
            score += 10;
        }

        // Bester Match?
        if (score > bestScore && score >= 60) { // Mindestpunktzahl für automatischen Match
            bestScore = score;
            bestMatch = { payment, score };
        }
    }

    return bestMatch;
}

/**
 * Gleicht eine Banktransaktion mit einer Zahlung ab
 * @param {string} transactionId - ID der Transaktion
 * @param {string} paymentId - ID der Zahlung
 */
export async function matchTransactionWithPayment(transactionId, paymentId) {
    const transaction = await base44.entities.BankTransaction.filter({ id: transactionId });
    const payment = await base44.entities.Payment.filter({ id: paymentId });

    if (transaction.length === 0 || payment.length === 0) {
        throw new Error('Transaktion oder Zahlung nicht gefunden');
    }

    const trans = transaction[0];
    const pay = payment[0];

    // Update transaction
    await base44.entities.BankTransaction.update(transactionId, {
        is_matched: true,
        matched_payment_id: paymentId
    });

    // Update payment
    const newAmount = (pay.amount || 0) + Math.abs(trans.amount);
    let newStatus = 'paid';
    if (newAmount < pay.expected_amount) {
        newStatus = 'partial';
    }

    await base44.entities.Payment.update(paymentId, {
        amount: newAmount,
        status: newStatus
    });

    return { transaction: trans, payment: pay };
}

/**
 * Entfernt den Abgleich einer Transaktion
 * @param {string} transactionId - ID der Transaktion
 */
export async function unmatchTransaction(transactionId) {
    const transaction = await base44.entities.BankTransaction.filter({ id: transactionId });
    
    if (transaction.length === 0 || !transaction[0].matched_payment_id) {
        throw new Error('Transaktion nicht gefunden oder nicht abgeglichen');
    }

    const trans = transaction[0];
    const paymentId = trans.matched_payment_id;

    // Get payment
    const payment = await base44.entities.Payment.filter({ id: paymentId });
    if (payment.length > 0) {
        const pay = payment[0];
        const newAmount = Math.max(0, (pay.amount || 0) - Math.abs(trans.amount));
        let newStatus = 'pending';
        if (newAmount > 0 && newAmount < pay.expected_amount) {
            newStatus = 'partial';
        } else if (newAmount >= pay.expected_amount) {
            newStatus = 'paid';
        }

        await base44.entities.Payment.update(paymentId, {
            amount: newAmount,
            status: newStatus
        });
    }

    // Update transaction
    await base44.entities.BankTransaction.update(transactionId, {
        is_matched: false,
        matched_payment_id: null
    });
}

/**
 * Automatischer Abgleich aller unabgeglichenen Transaktionen
 * @returns {number} Anzahl der abgeglichenen Transaktionen
 */
export async function autoMatchAllTransactions() {
    const unmatchedTransactions = await base44.entities.BankTransaction.filter({ 
        is_matched: false 
    });
    
    const pendingPayments = await base44.entities.Payment.filter({ 
        status: 'pending' 
    });

    let matchedCount = 0;

    for (const transaction of unmatchedTransactions) {
        // Nur eingehende Transaktionen (positive Beträge) abgleichen
        if (transaction.amount <= 0) continue;

        const match = findMatchingPayment(transaction, pendingPayments);
        
        if (match && match.score >= 80) { // Hohe Punktzahl für Auto-Match
            try {
                await matchTransactionWithPayment(transaction.id, match.payment.id);
                matchedCount++;
            } catch (error) {
                console.error('Fehler beim Abgleich:', error);
            }
        }
    }

    return matchedCount;
}