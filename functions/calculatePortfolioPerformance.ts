import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Time-Weighted Return (TWR) berechnen
function calculateTWR(cashflows) {
  if (cashflows.length === 0) return 0;
  
  cashflows.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  let hpr = 1; // Holding Period Return
  for (let i = 0; i < cashflows.length - 1; i++) {
    const startValue = cashflows[i].value;
    const endValue = cashflows[i + 1].value;
    const cashflow = cashflows[i + 1].cashflow || 0;
    
    if (startValue > 0) {
      const periodReturn = (endValue - cashflow) / startValue;
      hpr *= (1 + periodReturn);
    }
  }
  
  return (hpr - 1) * 100;
}

// Money-Weighted Return (MWR/IRR) - vereinfachte Näherung
function calculateMWR(cashflows, currentValue) {
  const totalInvested = cashflows.reduce((sum, cf) => sum + (cf.cashflow > 0 ? cf.cashflow : 0), 0);
  const totalWithdrawn = Math.abs(cashflows.reduce((sum, cf) => sum + (cf.cashflow < 0 ? cf.cashflow : 0), 0));
  const netInvested = totalInvested - totalWithdrawn;
  
  if (netInvested <= 0) return 0;
  
  return ((currentValue - netInvested) / netInvested) * 100;
}

// Volatilität berechnen
function calculateVolatility(returns) {
  if (returns.length < 2) return 0;
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252); // Annualisiert
}

// Sharpe Ratio berechnen
function calculateSharpeRatio(returns, riskFreeRate = 0.02) {
  if (returns.length < 2) return 0;
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const annualizedReturn = mean * 252;
  const volatility = calculateVolatility(returns);
  
  if (volatility === 0) return 0;
  return (annualizedReturn - riskFreeRate) / volatility;
}

// Max Drawdown berechnen
function calculateMaxDrawdown(values) {
  if (values.length < 2) return 0;
  
  let maxDrawdown = 0;
  let peak = values[0];
  
  for (const value of values) {
    if (value > peak) {
      peak = value;
    }
    const drawdown = (peak - value) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return maxDrawdown * 100;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { portfolioId } = body;

    if (!portfolioId) {
      return Response.json({ error: 'portfolioId erforderlich' }, { status: 400 });
    }

    // Holdings laden
    const accounts = await base44.entities.PortfolioAccount.filter({ portfolio_id: portfolioId });
    const accountIds = accounts.map(a => a.id);
    
    const allHoldings = await base44.asServiceRole.entities.AssetHolding.list();
    const holdings = allHoldings.filter(h => accountIds.includes(h.portfolio_account_id));

    // Aktueller Portfolio-Wert
    const currentValue = holdings.reduce((sum, h) => sum + (h.current_value || 0), 0);
    const totalCost = holdings.reduce((sum, h) => sum + (h.total_cost_basis || 0), 0);

    // Transaktionen für Cashflow-Analyse
    const allTransactions = await base44.asServiceRole.entities.AssetTransaction.list();
    const transactions = allTransactions.filter(tx => accountIds.includes(tx.portfolio_account_id));
    transactions.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

    // Cashflows zusammenstellen
    const cashflows = [];
    let runningValue = 0;
    
    transactions.forEach(tx => {
      if (['buy', 'transfer_in'].includes(tx.transaction_type)) {
        runningValue += tx.net_amount;
        cashflows.push({
          date: tx.transaction_date,
          cashflow: tx.net_amount,
          value: runningValue
        });
      } else if (['sell', 'transfer_out'].includes(tx.transaction_type)) {
        runningValue += tx.net_amount;
        cashflows.push({
          date: tx.transaction_date,
          cashflow: -Math.abs(tx.net_amount),
          value: runningValue
        });
      }
    });

    // Tägliche Returns für Volatilität/Sharpe
    const prices = await base44.asServiceRole.entities.AssetPrice.list('-price_date', 365);
    const dailyReturns = [];
    for (let i = 1; i < prices.length; i++) {
      const ret = (prices[i].close_price - prices[i - 1].close_price) / prices[i - 1].close_price;
      dailyReturns.push(ret);
    }

    // Werte für Max Drawdown
    const portfolioValues = holdings.map(h => h.current_value || 0);

    // Metriken berechnen
    const twr = calculateTWR(cashflows);
    const mwr = calculateMWR(cashflows, currentValue);
    const volatility = calculateVolatility(dailyReturns);
    const sharpeRatio = calculateSharpeRatio(dailyReturns);
    const maxDrawdown = calculateMaxDrawdown(portfolioValues);
    const totalReturn = totalCost > 0 ? ((currentValue - totalCost) / totalCost) * 100 : 0;

    return Response.json({
      success: true,
      performance: {
        current_value: currentValue,
        total_cost: totalCost,
        total_return: totalReturn,
        twr: twr,
        mwr: mwr,
        volatility: volatility,
        sharpe_ratio: sharpeRatio,
        max_drawdown: maxDrawdown
      }
    });
  } catch (error) {
    console.error('Performance calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});