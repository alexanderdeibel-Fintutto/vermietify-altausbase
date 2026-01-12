import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bank_account_id, period_start, period_end } = await req.json();

    if (!bank_account_id || !period_start || !period_end) {
      return Response.json({ error: 'bank_account_id, period_start, period_end required' }, { status: 400 });
    }

    // Load BankAccount
    const accounts = await base44.entities.BankAccount.filter({ id: bank_account_id });
    if (!accounts || accounts.length === 0) {
      return Response.json({ error: 'BankAccount not found' }, { status: 404 });
    }
    const account = accounts[0];

    // Load Transactions
    const transactions = await base44.entities.BankTransaction.filter({
      bank_account_id,
      booking_date: { $gte: period_start, $lte: period_end }
    });

    const sortedTransactions = (transactions || []).sort((a, b) => 
      new Date(a.booking_date) - new Date(b.booking_date)
    );

    // Calculate opening balance (simplified)
    const opening_balance = account.current_balance || 0;
    let running_balance = opening_balance;

    // MT940 Header
    let mt940 = ':20:STARTUMS\n';
    mt940 += `:25:${account.iban}\n`;
    mt940 += ':28C:1/1\n';

    // Opening balance
    const openDate = period_start.replace(/-/g, '');
    const currency = 'EUR';
    mt940 += `:60F:C${openDate}${currency}${opening_balance}\n`;

    // Transaction entries
    sortedTransactions.forEach(t => {
      running_balance += t.amount;
      const dateStr = t.booking_date.replace(/-/g, '');
      const amountStr = Math.abs(t.amount).toFixed(2).replace('.', ',');
      const indicator = t.amount > 0 ? 'CR' : 'DR';

      mt940 += `:61:${dateStr}${dateStr}${indicator}${amountStr}NTRFNONREF//\n`;
      mt940 += `:86:${(t.purpose || 'Transfer').substring(0, 60)}\n`;
    });

    // Closing balance
    const closeDate = period_end.replace(/-/g, '');
    const closingAmountStr = Math.abs(running_balance).toFixed(2).replace('.', ',');
    mt940 += `:62F:C${closeDate}${currency}${closingAmountStr}\n`;
    mt940 += '-\n';

    // Create BankStatement
    const statement = await base44.entities.BankStatement.create({
      bank_account_id,
      statement_type: 'custom',
      period_start,
      period_end,
      format: 'mt940',
      file_url: `mt940_${bank_account_id}_${period_start}_${period_end}.sta`,
      transaction_count: sortedTransactions.length,
      opening_balance,
      closing_balance: running_balance,
      total_credits: sortedTransactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0),
      total_debits: Math.abs(sortedTransactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)),
      generated_at: new Date().toISOString()
    });

    console.log(`[generateMT940Export] Created MT940 statement ${statement.id}`);

    return Response.json({
      success: true,
      statement_id: statement.id,
      file_url: statement.file_url,
      transaction_count: sortedTransactions.length,
      mt940_content: mt940.substring(0, 500) + '...' // Preview
    });

  } catch (error) {
    console.error('[generateMT940Export] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});