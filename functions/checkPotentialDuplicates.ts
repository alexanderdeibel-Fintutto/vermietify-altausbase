import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Calculate string similarity (Levenshtein distance based)
function stringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1;
    if (s1.length < 2 || s2.length < 2) return 0;
    
    // Check if one string contains the other
    if (s1.includes(s2) || s2.includes(s1)) return 0.7;
    
    // Simple token-based similarity
    const tokens1 = s1.split(/\s+/);
    const tokens2 = s2.split(/\s+/);
    
    let matches = 0;
    for (const token1 of tokens1) {
        for (const token2 of tokens2) {
            if (token1 === token2 && token1.length > 2) {
                matches++;
                break;
            }
        }
    }
    
    return matches / Math.max(tokens1.length, tokens2.length);
}

// Check if two amounts are similar (within threshold)
function amountSimilarity(amount1, amount2) {
    const diff = Math.abs(amount1 - amount2);
    const avg = (Math.abs(amount1) + Math.abs(amount2)) / 2;
    
    if (diff === 0) return 1;
    if (avg === 0) return 0;
    
    // Allow 10% deviation or 5 EUR fixed, whichever is larger
    const threshold = Math.max(avg * 0.1, 5);
    
    if (diff <= threshold) {
        return 1 - (diff / threshold);
    }
    
    return 0;
}

// Check if two dates are close (within days)
function dateSimilarity(date1, date2, maxDays = 7) {
    if (!date1 || !date2) return 0;
    
    try {
        let d1, d2;
        
        // Try parsing ISO format (yyyy-MM-dd)
        d1 = new Date(date1);
        d2 = new Date(date2);
        
        // If invalid, try German format (dd.MM.yyyy)
        if (isNaN(d1.getTime())) {
            const parts = date1.split('.');
            if (parts.length === 3) {
                d1 = new Date(parts[2], parts[1] - 1, parts[0]);
            }
        }
        if (isNaN(d2.getTime())) {
            const parts = date2.split('.');
            if (parts.length === 3) {
                d2 = new Date(parts[2], parts[1] - 1, parts[0]);
            }
        }
        
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
        
        const diffDays = Math.abs((d1 - d2) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 1;
        if (diffDays <= maxDays) {
            return 1 - (diffDays / maxDays);
        }
        
        return 0;
    } catch {
        return 0;
    }
}

// Calculate overall match score
function calculateMatchScore(newTx, existingTx) {
    const weights = {
        date: 0.25,
        amount: 0.35,
        description: 0.2,
        sender: 0.15,
        reference: 0.05
    };
    
    const scores = {
        date: dateSimilarity(newTx.transaction_date, existingTx.transaction_date),
        amount: amountSimilarity(newTx.amount, existingTx.amount),
        description: stringSimilarity(newTx.description, existingTx.description),
        sender: stringSimilarity(newTx.sender_receiver, existingTx.sender_receiver),
        reference: stringSimilarity(newTx.reference, existingTx.reference)
    };
    
    let totalScore = 0;
    for (const [key, weight] of Object.entries(weights)) {
        totalScore += scores[key] * weight;
    }
    
    return {
        totalScore,
        details: scores
    };
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { accountId, transactions } = body;

        if (!accountId || !transactions || !Array.isArray(transactions)) {
            return Response.json({ 
                error: 'accountId und transactions erforderlich' 
            }, { status: 400 });
        }

        // Get all existing transactions for this account
        let allExisting = [];
        let hasMore = true;
        let skip = 0;
        const limit = 1000;

        while (hasMore) {
            const batch = await base44.asServiceRole.entities.BankTransaction.filter(
                { account_id: accountId },
                '-transaction_date',
                limit,
                skip
            );

            if (batch.length === 0) {
                hasMore = false;
            } else {
                allExisting = allExisting.concat(batch);
                skip += batch.length;

                if (batch.length < limit) {
                    hasMore = false;
                }
            }
        }

        // Check each new transaction against existing ones
        const duplicateSuggestions = [];

        for (const newTx of transactions) {
            const potentialDuplicates = [];

            for (const existingTx of allExisting) {
                const { totalScore, details } = calculateMatchScore(newTx, existingTx);

                // Only consider if score is above threshold (60%)
                if (totalScore >= 0.6) {
                    potentialDuplicates.push({
                        existingTransaction: {
                            id: existingTx.id,
                            transaction_date: existingTx.transaction_date,
                            amount: existingTx.amount,
                            description: existingTx.description,
                            sender_receiver: existingTx.sender_receiver,
                            reference: existingTx.reference
                        },
                        matchScore: totalScore,
                        matchDetails: details
                    });
                }
            }

            // Sort by score (highest first)
            potentialDuplicates.sort((a, b) => b.matchScore - a.matchScore);

            if (potentialDuplicates.length > 0) {
                duplicateSuggestions.push({
                    newTransaction: newTx,
                    potentialDuplicates: potentialDuplicates.slice(0, 3) // Top 3 matches
                });
            }
        }

        return Response.json({
            success: true,
            duplicateSuggestions,
            checkedCount: transactions.length,
            existingCount: allExisting.length
        });

    } catch (error) {
        console.error('Check duplicates error:', error);
        return Response.json({ 
            error: error.message || 'Fehler bei Duplikatprüfung'
        }, { status: 500 });
    }
});