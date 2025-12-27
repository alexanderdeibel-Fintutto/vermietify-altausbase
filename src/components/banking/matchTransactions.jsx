import { base44 } from '@/api/base44Client';
import { parseISO, differenceInDays, isSameMonth, differenceInMonths } from 'date-fns';

/**
 * Berechnet die Ähnlichkeit zwischen zwei Strings (Levenshtein-Distanz)
 */
function stringSimilarity(str1, str2) {
    const s1 = (str1 || '').toLowerCase();
    const s2 = (str2 || '').toLowerCase();
    
    if (s1 === s2) return 1;
    if (!s1 || !s2) return 0;
    
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1;
    
    // Prüfe auf Teil-Übereinstimmungen
    if (longer.includes(shorter)) return 0.7;
    
    const editDistance = levenshteinDistance(s1, s2);
    return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

/**
 * Erkennt wiederkehrende Zahlungen basierend auf historischen Daten
 */
async function detectRecurringPattern(payment, allTransactions) {
    if (!payment.tenant_id || !payment.unit_id) return null;
    
    // Finde historische Transaktionen für denselben Mieter/Einheit
    const historicalMatches = allTransactions.filter(t => {
        if (!t.matched_payment_id) return false;
        
        // Prüfe ob diese Transaktion zu einer ähnlichen Zahlung gehört
        const amount = Math.abs(t.amount);
        const expectedAmount = payment.expected_amount;
        const amountMatch = Math.abs(amount - expectedAmount) < expectedAmount * 0.1;
        
        return amountMatch && t.transaction_date < payment.payment_date;
    });
    
    if (historicalMatches.length >= 2) {
        // Berechne durchschnittlichen Zeitabstand
        const sortedMatches = historicalMatches
            .sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
        
        let totalDays = 0;
        for (let i = 1; i < sortedMatches.length; i++) {
            const days = differenceInDays(
                parseISO(sortedMatches[i].transaction_date),
                parseISO(sortedMatches[i - 1].transaction_date)
            );
            totalDays += days;
        }
        
        const avgInterval = totalDays / (sortedMatches.length - 1);
        const isMonthly = avgInterval >= 25 && avgInterval <= 35;
        
        // Häufigstes Textmuster
        const descriptions = sortedMatches.map(t => t.sender_receiver || t.description);
        const commonPattern = findCommonPattern(descriptions);
        
        return {
            isRecurring: true,
            interval: isMonthly ? 'monthly' : 'variable',
            avgDays: avgInterval,
            commonPattern,
            confidence: Math.min(historicalMatches.length / 3, 1) // Max bei 3+ Matches
        };
    }
    
    return null;
}

function findCommonPattern(strings) {
    if (strings.length === 0) return '';
    
    // Finde die längste gemeinsame Teilzeichenfolge
    let commonWords = strings[0].toLowerCase().split(/\s+/);
    
    for (let i = 1; i < strings.length; i++) {
        const words = strings[i].toLowerCase().split(/\s+/);
        commonWords = commonWords.filter(word => 
            words.some(w => w.includes(word) || word.includes(w))
        );
    }
    
    return commonWords.join(' ');
}

/**
 * Verbesserte Zahlungsabgleichsfunktion mit Erkennung wiederkehrender Muster
 * @param {Object} transaction - Die Banktransaktion
 * @param {Array} payments - Liste aller ausstehenden Zahlungen
 * @param {Array} allTransactions - Alle Transaktionen für Mustererkennung
 * @param {Array} tenants - Alle Mieter
 * @returns {Object|null} - Beste übereinstimmende Zahlung oder null
 */
export async function findMatchingPayment(transaction, payments, allTransactions = [], tenants = []) {
    if (!transaction || !payments || payments.length === 0) return null;

    let bestMatch = null;
    let bestScore = 0;

    const transactionDate = parseISO(transaction.transaction_date);
    const transactionAmount = Math.abs(transaction.amount);
    const transactionText = `${transaction.sender_receiver || ''} ${transaction.description || ''} ${transaction.reference || ''}`.toLowerCase();

    for (const payment of payments) {
        if (payment.status === 'paid') continue;

        let score = 0;
        const paymentDate = parseISO(payment.payment_date);
        const expectedAmount = payment.expected_amount || 0;

        // Betrag prüfen (höchste Priorität)
        const amountDiff = Math.abs(transactionAmount - expectedAmount);
        const amountDiffPercent = amountDiff / expectedAmount;
        
        if (amountDiff < 0.01) {
            score += 50; // Exakte Übereinstimmung
        } else if (amountDiffPercent < 0.02) {
            score += 45; // Innerhalb 2%
        } else if (amountDiffPercent < 0.05) {
            score += 35; // Innerhalb 5%
        } else if (amountDiffPercent < 0.10) {
            score += 20; // Innerhalb 10%
        }

        // Datum prüfen
        const daysDiff = Math.abs(differenceInDays(transactionDate, paymentDate));
        if (daysDiff === 0) {
            score += 30;
        } else if (daysDiff <= 2) {
            score += 25;
        } else if (daysDiff <= 5) {
            score += 20;
        } else if (daysDiff <= 10) {
            score += 10;
        } else if (isSameMonth(transactionDate, paymentDate)) {
            score += 5;
        }

        // Erkennung wiederkehrender Muster
        const recurringPattern = await detectRecurringPattern(payment, allTransactions);
        if (recurringPattern?.isRecurring) {
            // Überprüfe ob das Textmuster übereinstimmt
            if (recurringPattern.commonPattern) {
                const patternSimilarity = stringSimilarity(transactionText, recurringPattern.commonPattern);
                if (patternSimilarity > 0.6) {
                    score += 30 * recurringPattern.confidence; // Bonus für wiederkehrende Muster
                }
            }
            
            // Überprüfe ob der Zeitabstand zum erwarteten Intervall passt
            if (recurringPattern.interval === 'monthly') {
                const expectedDaysDiff = Math.abs(daysDiff - 30);
                if (expectedDaysDiff <= 5) {
                    score += 15; // Passt zum monatlichen Rhythmus
                }
            }
        }

        // Mieter-Name im Text suchen
        if (payment.tenant_id && tenants.length > 0) {
            const tenant = tenants.find(t => t.id === payment.tenant_id);
            if (tenant) {
                const tenantName = `${tenant.first_name || ''} ${tenant.last_name || ''}`.toLowerCase();
                const firstNameMatch = transactionText.includes((tenant.first_name || '').toLowerCase());
                const lastNameMatch = transactionText.includes((tenant.last_name || '').toLowerCase());
                
                if (firstNameMatch && lastNameMatch) {
                    score += 25; // Vollständiger Name
                } else if (lastNameMatch) {
                    score += 20; // Nur Nachname
                } else if (firstNameMatch) {
                    score += 10; // Nur Vorname
                }
            }
        }

        // Referenz prüfen (fuzzy matching)
        const reference = (transaction.reference || '').toLowerCase();
        const paymentRef = (payment.reference || '').toLowerCase();
        const paymentMonth = (payment.payment_month || '').replace('-', '');
        
        if (reference && paymentRef) {
            const refSimilarity = stringSimilarity(reference, paymentRef);
            if (refSimilarity > 0.8) {
                score += 20;
            } else if (refSimilarity > 0.6) {
                score += 15;
            } else if (refSimilarity > 0.4) {
                score += 10;
            }
        }
        
        if (reference.includes(paymentMonth)) {
            score += 10;
        }

        // Beschreibung prüfen
        const description = (transaction.description || '').toLowerCase();
        if (description.includes('miete') || description.includes('rent')) {
            score += 5;
        }

        // Bester Match?
        if (score > bestScore && score >= 50) { // Mindestpunktzahl
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

    // Lade alle Transaktionen für Mustererkennung
    const allTransactions = await base44.entities.BankTransaction.list('-transaction_date', 1000);
    
    // Lade Mieter für Name-Matching
    const tenants = await base44.entities.Tenant.list();

    let matchedCount = 0;

    for (const transaction of unmatchedTransactions) {
        // Nur eingehende Transaktionen (positive Beträge) abgleichen
        if (transaction.amount <= 0) continue;

        const match = await findMatchingPayment(
            transaction, 
            pendingPayments, 
            allTransactions,
            tenants
        );
        
        // Niedrigere Schwelle für wiederkehrende Muster, höhere für einmalige
        const threshold = match?.payment?.payment_type === 'rent' ? 70 : 80;
        
        if (match && match.score >= threshold) {
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

/**
 * Findet vorgeschlagene Matches für eine Transaktion (inkl. niedriger Scores)
 * @param {Object} transaction - Die Banktransaktion
 * @returns {Array} - Liste von Vorschlägen mit Scores
 */
export async function findMatchSuggestions(transaction) {
    const pendingPayments = await base44.entities.Payment.filter({ 
        status: 'pending' 
    });
    
    const allTransactions = await base44.entities.BankTransaction.list('-transaction_date', 1000);
    const tenants = await base44.entities.Tenant.list();
    
    const suggestions = [];
    
    for (const payment of pendingPayments) {
        const match = await findMatchingPayment(
            transaction,
            [payment],
            allTransactions,
            tenants
        );
        
        if (match && match.score >= 40) { // Niedrigere Schwelle für Vorschläge
            suggestions.push({
                payment,
                score: match.score,
                isHighConfidence: match.score >= 70,
                isRecurring: match.score > 80
            });
        }
    }
    
    // Sortiere nach Score
    return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);
}