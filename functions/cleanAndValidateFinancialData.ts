import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Clean and validate financial data from external sources
 * Removes duplicates, validates transactions, handles missing data
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            transactions,
            accounts,
            crypto_holdings,
            cleanup_config
        } = await req.json();

        const results = {
            transactions_processed: 0,
            transactions_cleaned: [],
            accounts_validated: [],
            crypto_validated: [],
            duplicates_removed: 0,
            errors: []
        };

        // Clean and validate transactions
        if (transactions && Array.isArray(transactions)) {
            const txMap = new Map();
            
            for (const tx of transactions) {
                try {
                    const cleaned = cleanTransaction(tx);
                    const txHash = generateTxHash(cleaned);
                    
                    // Remove duplicates
                    if (!txMap.has(txHash)) {
                        txMap.set(txHash, cleaned);
                    } else {
                        results.duplicates_removed++;
                    }
                } catch (error) {
                    results.errors.push({
                        type: 'transaction',
                        error: error.message,
                        data: tx
                    });
                }
            }
            
            results.transactions_cleaned = Array.from(txMap.values());
            results.transactions_processed = results.transactions_cleaned.length;
        }

        // Validate accounts
        if (accounts && Array.isArray(accounts)) {
            for (const account of accounts) {
                try {
                    const validated = validateAccount(account);
                    results.accounts_validated.push(validated);
                } catch (error) {
                    results.errors.push({
                        type: 'account',
                        error: error.message,
                        account_id: account.id
                    });
                }
            }
        }

        // Validate crypto holdings
        if (crypto_holdings && Array.isArray(crypto_holdings)) {
            for (const holding of crypto_holdings) {
                try {
                    const validated = validateCryptoHolding(holding);
                    results.crypto_validated.push(validated);
                } catch (error) {
                    results.errors.push({
                        type: 'crypto',
                        error: error.message,
                        holding: holding
                    });
                }
            }
        }

        return Response.json({
            success: true,
            results,
            data_quality_score: calculateDataQuality(results),
            cleanup_timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error cleaning data:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function cleanTransaction(tx) {
    return {
        id: tx.id || tx.transactionId || '',
        date: new Date(tx.bookingDate || tx.date).toISOString().split('T')[0],
        amount: parseFloat(tx.amount) || 0,
        currency: tx.currency || 'EUR',
        purpose: (tx.purpose || tx.description || '').trim(),
        party_name: (tx.counterpartyName || tx.counterparty || '').trim(),
        account_id: tx.accountId || tx.account_id || '',
        type: classifyTransaction(tx),
        status: tx.status || 'BOOKED',
        is_return: false
    };
}

function validateAccount(account) {
    if (!account.id || !account.iban) {
        throw new Error('Missing required fields: id and iban');
    }

    return {
        id: account.id,
        iban: account.iban.toUpperCase(),
        bic: account.bic || '',
        name: account.accountName || account.name || '',
        type: account.accountType || 'CHECKING',
        balance: parseFloat(account.balance) || 0,
        currency: account.currency || 'EUR',
        bank_name: account.bankName || '',
        last_updated: new Date().toISOString()
    };
}

function validateCryptoHolding(holding) {
    if (!holding.ticker && !holding.symbol) {
        throw new Error('Missing ticker/symbol');
    }

    return {
        ticker: (holding.ticker || holding.symbol).toUpperCase(),
        quantity: Math.max(0, parseFloat(holding.quantity) || 0),
        value_usd: Math.max(0, parseFloat(holding.value_usd) || 0),
        value_eur: Math.max(0, parseFloat(holding.value_eur) || 0),
        type: holding.type || 'exchange',
        wallet_address: holding.wallet_address || '',
        last_updated: holding.last_updated || new Date().toISOString()
    };
}

function classifyTransaction(tx) {
    const purpose = (tx.purpose || '').toLowerCase();
    
    if (purpose.includes('salary') || purpose.includes('gehalt')) return 'income';
    if (purpose.includes('tax') || purpose.includes('steuern')) return 'tax';
    if (purpose.includes('investment') || purpose.includes('depot')) return 'investment';
    if (purpose.includes('rent') || purpose.includes('miete')) return 'rent';
    
    return tx.amount > 0 ? 'income' : 'expense';
}

function generateTxHash(tx) {
    // Create unique hash for transaction to detect duplicates
    return `${tx.date}-${tx.amount}-${tx.party_name}-${tx.purpose}`;
}

function calculateDataQuality(results) {
    const total = results.transactions_processed + results.accounts_validated.length + results.crypto_validated.length;
    const errors = results.errors.length;
    
    if (total === 0) return 0;
    return Math.round(((total - errors) / total) * 100);
}