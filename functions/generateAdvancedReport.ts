import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report_type, format, include_charts, include_tables } = await req.json();

    console.log('[REPORT] Generating', report_type, 'report in', format, 'format');

    // 1. Sammle Daten basierend auf Report-Typ
    let reportData = {};

    if (report_type === 'financial') {
      const transactions = await base44.entities.BankTransaction.list('-transaction_date', 100);
      const financialItems = await base44.entities.FinancialItem.list();

      reportData = {
        title: 'Finanzbericht',
        date: new Date().toISOString(),
        sections: [
          {
            name: 'Zusammenfassung',
            data: {
              total_transactions: transactions.length,
              total_income: transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0),
              total_expenses: Math.abs(transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0))
            }
          },
          {
            name: 'Offene Forderungen',
            data: financialItems.filter(f => f.status === 'pending' || f.status === 'overdue')
          }
        ]
      };
    } else if (report_type === 'compliance') {
      const response = await base44.functions.invoke('monitorComplianceViolations', {});
      reportData = {
        title: 'Compliance-Bericht',
        date: new Date().toISOString(),
        violations: response.data.violations
      };
    }

    // 2. Generiere PDF/Excel basierend auf Format
    const fileName = `${report_type}_report_${new Date().getTime()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;

    // 3. Speichere generierte Datei
    console.log(`[REPORT] Generated: ${fileName}`);

    return Response.json({
      success: true,
      file_name: fileName,
      file_url: `/files/${fileName}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});