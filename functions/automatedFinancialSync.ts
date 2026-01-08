import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { year = new Date().getFullYear() } = await req.json();

    // 1. Lade alle Finanzdaten für das Jahr
    const financialItems = await base44.entities.FinancialItem.filter({
      created_date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` }
    });

    // 2. Kategorisiere und analysiere
    let incomeItems = [];
    let expenseItems = [];
    let categorized = 0;
    let needsReview = 0;

    const mappings = {};

    for (const item of financialItems) {
      if (item.type === 'income') {
        incomeItems.push(item);
      } else if (item.type === 'expense') {
        expenseItems.push(item);
      }

      // Prüfe Kategorisierung
      if (item.tax_category_code || item.cost_type) {
        categorized++;
        
        const category = item.tax_category_code || item.cost_type || 'Sonstige';
        mappings[category] = (mappings[category] || 0) + 1;
      } else {
        needsReview++;
      }
    }

    // 3. Berechne Summen
    const incomeTotal = incomeItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const expenseTotal = expenseItems.reduce((sum, item) => sum + (Math.abs(item.amount) || 0), 0);

    // 4. Finde zugehörige ELSTER-Submissions
    const submissions = await base44.entities.ElsterSubmission.filter({
      tax_year: year,
      status: { $in: ['DRAFT', 'AI_PROCESSED', 'VALIDATED'] }
    });

    // 5. Aktualisiere Submissions mit aktuellen Finanzdaten
    let updatedSubmissions = 0;
    
    for (const submission of submissions) {
      const relevantIncome = incomeItems.filter(item => 
        item.building_id === submission.building_id
      );
      const relevantExpenses = expenseItems.filter(item => 
        item.building_id === submission.building_id
      );

      const buildingIncomeTotal = relevantIncome.reduce((sum, item) => sum + (item.amount || 0), 0);
      const buildingExpenseTotal = relevantExpenses.reduce((sum, item) => sum + (Math.abs(item.amount) || 0), 0);

      // Aktualisiere form_data
      const updatedFormData = {
        ...submission.form_data,
        einnahmen: buildingIncomeTotal,
        werbungskosten: buildingExpenseTotal,
        ueberschuss: buildingIncomeTotal - buildingExpenseTotal,
        sync_timestamp: new Date().toISOString(),
        auto_synced: true
      };

      await base44.entities.ElsterSubmission.update(submission.id, {
        form_data: updatedFormData
      });

      updatedSubmissions++;
    }

    return Response.json({
      success: true,
      message: `Finanzdaten für ${year} erfolgreich synchronisiert`,
      stats: {
        income_items: incomeItems.length,
        income_total: incomeTotal,
        expense_items: expenseItems.length,
        expense_total: expenseTotal,
        categorized,
        categorized_percent: (categorized / financialItems.length) * 100,
        needs_review: needsReview,
        mappings,
        submissions_updated: updatedSubmissions
      }
    });

  } catch (error) {
    console.error('Automated Financial Sync Error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});