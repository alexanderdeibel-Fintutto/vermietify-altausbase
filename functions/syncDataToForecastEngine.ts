import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Sync cleaned financial data to forecast and optimization engines
 * Aggregates bank transactions and crypto holdings for predictions
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
            analysis_period_months = 3
        } = await req.json();

        // Calculate aggregated financial metrics
        const metrics = calculateFinancialMetrics(transactions, accounts, crypto_holdings, analysis_period_months);

        // Save metrics to user profile for use by forecast engine
        const user_obj = await base44.auth.me();
        await base44.auth.updateMe({
            ytd_income: metrics.total_income,
            ytd_expenses: metrics.total_expenses,
            projected_annual_income: metrics.projected_annual_income,
            projected_annual_expenses: metrics.projected_annual_expenses,
            crypto_holdings_value: metrics.total_crypto_value,
            bank_accounts_count: metrics.account_count,
            last_data_sync: new Date().toISOString()
        });

        // Log sync event
        await base44.asServiceRole.entities.FinAPISync.create({
            user_email: user.email,
            sync_type: 'auto',
            transactions_synced: transactions?.length || 0,
            accounts_synced: accounts?.length || 0,
            crypto_synced: crypto_holdings?.length || 0,
            metrics,
            sync_timestamp: new Date().toISOString()
        }).catch(() => {
            // Entity might not exist, continue anyway
        });

        return Response.json({
            success: true,
            metrics,
            forecast_data_ready: true,
            ready_for_forecast_generation: true,
            sync_timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error syncing to forecast engine:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function calculateFinancialMetrics(transactions, accounts, cryptoHoldings, periodMonths) {
    let totalIncome = 0;
    let totalExpenses = 0;
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth() - periodMonths, 1);

    // Process transactions
    if (transactions && Array.isArray(transactions)) {
        for (const tx of transactions) {
            const txDate = new Date(tx.date || tx.bookingDate);
            
            if (txDate >= periodStart) {
                const amount = parseFloat(tx.amount) || 0;
                
                if (amount > 0) {
                    totalIncome += amount;
                } else {
                    totalExpenses += Math.abs(amount);
                }
            }
        }
    }

    // Calculate projected annual amounts
    const monthsPassed = Math.max(1, periodMonths);
    const projectedAnnualIncome = (totalIncome / monthsPassed) * 12;
    const projectedAnnualExpenses = (totalExpenses / monthsPassed) * 12;

    // Calculate crypto value
    let totalCryptoValue = 0;
    if (cryptoHoldings && Array.isArray(cryptoHoldings)) {
        for (const holding of cryptoHoldings) {
            totalCryptoValue += parseFloat(holding.value_usd || 0);
        }
    }

    // Calculate bank account value
    let totalBankValue = 0;
    let accountCount = 0;
    if (accounts && Array.isArray(accounts)) {
        for (const account of accounts) {
            totalBankValue += parseFloat(account.balance || 0);
            accountCount++;
        }
    }

    return {
        period_months: periodMonths,
        analysis_start_date: periodStart.toISOString().split('T')[0],
        total_income: Math.round(totalIncome),
        total_expenses: Math.round(totalExpenses),
        projected_annual_income: Math.round(projectedAnnualIncome),
        projected_annual_expenses: Math.round(projectedAnnualExpenses),
        monthly_average_income: Math.round(totalIncome / monthsPassed),
        monthly_average_expenses: Math.round(totalExpenses / monthsPassed),
        total_crypto_value: Math.round(totalCryptoValue),
        total_bank_value: Math.round(totalBankValue),
        total_assets: Math.round(totalBankValue + totalCryptoValue),
        account_count: accountCount,
        transaction_count: transactions?.length || 0,
        crypto_holdings_count: cryptoHoldings?.length || 0,
        savings_rate: totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0
    };
}