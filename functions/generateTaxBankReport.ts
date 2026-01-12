import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bank_account_id, tax_year, building_id } = await req.json();

    if (!bank_account_id || !tax_year) {
      return Response.json({ error: 'bank_account_id and tax_year required' }, { status: 400 });
    }

    // Load BankAccount
    const accounts = await base44.entities.BankAccount.filter({ id: bank_account_id });
    if (!accounts || accounts.length === 0) {
      return Response.json({ error: 'BankAccount not found' }, { status: 404 });
    }
    const account = accounts[0];

    // Build period filter
    const period_start = `${tax_year}-01-01`;
    const period_end = `${tax_year}-12-31`;

    // Load Transactions for tax year
    let txFilter = {
      bank_account_id,
      booking_date: { $gte: period_start, $lte: period_end }
    };

    const transactions = await base44.entities.BankTransaction.filter(txFilter);
    const sortedTransactions = (transactions || []).sort((a, b) => 
      new Date(a.booking_date) - new Date(b.booking_date)
    );

    // Calculate totals
    const total_credits = sortedTransactions
      .filter(t => t.amount > 0)
      .reduce((s, t) => s + t.amount, 0);

    const total_debits = Math.abs(
      sortedTransactions
        .filter(t => t.amount < 0)
        .reduce((s, t) => s + t.amount, 0)
    );

    const opening_balance = account.current_balance || 0;
    const closing_balance = opening_balance + total_credits - total_debits;

    // Group by category (simplified - would need GeneratedFinancialBooking matching in production)
    const categories = {
      'Zeile 9 - Mieteinnahmen': { transactions: [], total: 0 },
      'Zeile 33 - Grundsteuer': { transactions: [], total: 0 },
      'Zeile 36 - Erhaltungsaufwand': { transactions: [], total: 0 },
      'Zeile 37 - Schuldzinsen': { transactions: [], total: 0 },
      'Zeile 38 - Versicherungen': { transactions: [], total: 0 },
      'Zeile 39 - Verwaltungskosten': { transactions: [], total: 0 },
      'Sonstige': { transactions: [], total: 0 }
    };

    // Simple keyword-based categorization
    sortedTransactions.forEach(t => {
      const purpose = (t.purpose || '').toLowerCase();
      
      if (purpose.includes('miete') || purpose.includes('rent')) {
        categories['Zeile 9 - Mieteinnahmen'].transactions.push(t);
        if (t.amount > 0) categories['Zeile 9 - Mieteinnahmen'].total += t.amount;
      } else if (purpose.includes('grundsteuer')) {
        categories['Zeile 33 - Grundsteuer'].transactions.push(t);
        categories['Zeile 33 - Grundsteuer'].total += Math.abs(t.amount);
      } else if (purpose.includes('handwerk') || purpose.includes('reparatur')) {
        categories['Zeile 36 - Erhaltungsaufwand'].transactions.push(t);
        categories['Zeile 36 - Erhaltungsaufwand'].total += Math.abs(t.amount);
      } else if (purpose.includes('zins') || purpose.includes('darlehen')) {
        categories['Zeile 37 - Schuldzinsen'].transactions.push(t);
        categories['Zeile 37 - Schuldzinsen'].total += Math.abs(t.amount);
      } else if (purpose.includes('versicherung')) {
        categories['Zeile 38 - Versicherungen'].transactions.push(t);
        categories['Zeile 38 - Versicherungen'].total += Math.abs(t.amount);
      } else if (purpose.includes('verwaltung') || purpose.includes('makler') || purpose.includes('gebühr')) {
        categories['Zeile 39 - Verwaltungskosten'].transactions.push(t);
        categories['Zeile 39 - Verwaltungskosten'].total += Math.abs(t.amount);
      } else {
        categories['Sonstige'].transactions.push(t);
      }
    });

    // Create report summary
    const report = {
      tax_year,
      period_start,
      period_end,
      bank_account: account.iban,
      opening_balance,
      closing_balance,
      total_credits,
      total_debits,
      transaction_count: sortedTransactions.length,
      categories: Object.entries(categories)
        .filter(([_, data]) => data.transactions.length > 0)
        .map(([name, data]) => ({
          name,
          transaction_count: data.transactions.length,
          total: data.total.toFixed(2)
        }))
    };

    // Create BankStatement
    const statement = await base44.entities.BankStatement.create({
      bank_account_id,
      statement_type: 'tax_report',
      period_start,
      period_end,
      format: 'pdf',
      file_url: `tax_report_${bank_account_id}_${tax_year}.pdf`,
      transaction_count: sortedTransactions.length,
      opening_balance,
      closing_balance,
      total_credits,
      total_debits,
      tax_year,
      building_id: building_id || null,
      generated_at: new Date().toISOString()
    });

    console.log(`[generateTaxBankReport] Created tax report ${statement.id} for year ${tax_year}`);

    return Response.json({
      success: true,
      statement_id: statement.id,
      report,
      file_url: statement.file_url
    });

  } catch (error) {
    console.error('[generateTaxBankReport] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});