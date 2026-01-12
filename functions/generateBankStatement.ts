import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Note: jsPDF ist installiert
// import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bank_account_id, period_start, period_end, format } = await req.json();

    if (!bank_account_id || !period_start || !period_end || !format) {
      return Response.json({ error: 'bank_account_id, period_start, period_end, format required' }, { status: 400 });
    }

    // Validate format
    if (!['pdf', 'mt940', 'csv'].includes(format)) {
      return Response.json({ error: 'format must be pdf, mt940, or csv' }, { status: 400 });
    }

    // Load BankAccount
    const accounts = await base44.entities.BankAccount.filter({ id: bank_account_id });
    if (!accounts || accounts.length === 0) {
      return Response.json({ error: 'BankAccount not found' }, { status: 404 });
    }
    const account = accounts[0];

    // Load Transactions in period
    const transactions = await base44.entities.BankTransaction.filter({
      bank_account_id,
      booking_date: { $gte: period_start, $lte: period_end }
    });

    // Calculate balances
    const opening_balance = account.current_balance || 0;
    let running_balance = opening_balance;

    const sortedTransactions = (transactions || []).sort((a, b) => 
      new Date(a.booking_date) - new Date(b.booking_date)
    );

    let total_credits = 0;
    let total_debits = 0;

    sortedTransactions.forEach(t => {
      if (t.amount > 0) total_credits += t.amount;
      else total_debits += Math.abs(t.amount);
    });

    const closing_balance = opening_balance + total_credits - total_debits;

    // Generate based on format
    let file_url = '';
    
    if (format === 'csv') {
      // Simple CSV export
      const csvHeader = 'Datum,Buchungstext,Betrag,Saldo\n';
      const csvRows = sortedTransactions.map(t => {
        running_balance += t.amount;
        return `${t.booking_date},"${t.purpose || ''}",${t.amount},${running_balance}`;
      }).join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      // Upload CSV (using base44 file upload)
      const csvBlob = new Blob([csvContent], { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', csvBlob, `statement_${bank_account_id}_${period_start}_${period_end}.csv`);
      
      // For now, we'll create a placeholder URL (in production, upload to storage)
      file_url = `bank_statement_${bank_account_id}_${period_start}_${period_end}.csv`;
    }

    // Create BankStatement entity
    const statement = await base44.entities.BankStatement.create({
      bank_account_id,
      statement_type: 'custom',
      period_start,
      period_end,
      format,
      file_url,
      transaction_count: sortedTransactions.length,
      opening_balance,
      closing_balance,
      total_credits,
      total_debits,
      generated_at: new Date().toISOString()
    });

    console.log(`[generateBankStatement] Created statement ${statement.id} for account ${bank_account_id}`);

    return Response.json({
      success: true,
      statement_id: statement.id,
      file_url,
      transaction_count: sortedTransactions.length,
      opening_balance,
      closing_balance,
      total_credits,
      total_debits
    });

  } catch (error) {
    console.error('[generateBankStatement] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});