import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, tax_year } = await req.json();

    console.log('[DATA-CLEANING] Intelligent cleaning for building', building_id, 'year', tax_year);

    // Lade alle FinancialItems für das Jahr
    const items = await base44.entities.FinancialItem.filter();
    const yearItems = items.filter(item => {
      const itemYear = new Date(item.date).getFullYear();
      return building_id ? (item.building_id === building_id && itemYear === tax_year) 
                         : (itemYear === tax_year);
    });

    const issues = [];
    const fixes = [];

    // 1. Duplikate finden
    const itemsByKey = {};
    for (const item of yearItems) {
      const key = `${item.date}_${item.amount}_${item.description}`;
      if (itemsByKey[key]) {
        issues.push({
          type: 'DUPLICATE',
          item1_id: itemsByKey[key].id,
          item2_id: item.id,
          reason: 'Identischer Eintrag'
        });
      } else {
        itemsByKey[key] = item;
      }
    }

    // 2. Ungültige Daten
    const invalidItems = yearItems.filter(item => {
      if (!item.date || !item.amount || !item.description) {
        return true;
      }
      if (item.amount < 0 && item.type === 'INCOME') return true;
      if (item.amount > 0 && item.type === 'EXPENSE' && item.amount > 1000000) return true;
      return false;
    });

    issues.push(...invalidItems.map(item => ({
      type: 'INVALID_DATA',
      item_id: item.id,
      item
    })));

    // 3. Kategorisierungslücken
    const uncategorized = yearItems.filter(item => !item.cost_category);
    if (uncategorized.length > 0) {
      issues.push({
        type: 'UNCATEGORIZED',
        count: uncategorized.length,
        items: uncategorized.slice(0, 5).map(i => ({ id: i.id, description: i.description }))
      });

      // Auto-kategorisieren
      for (const item of uncategorized) {
        try {
          const categorization = await base44.functions.invoke('categorizeExpenseWithAI', {
            invoice_data: {
              description: item.description,
              amount: item.amount,
              date: item.date
            },
            building_ownership: 'VERMIETUNG',
            legal_form: 'PRIVATPERSON',
            historical_bookings: []
          });

          await base44.entities.FinancialItem.update(item.id, {
            cost_category: categorization.data.categorization.suggested_category
          });

          fixes.push({
            type: 'AUTO_CATEGORIZED',
            item_id: item.id,
            category: categorization.data.categorization.suggested_category
          });
        } catch (error) {
          console.log('Auto-categorization failed for item:', item.id);
        }
      }
    }

    return Response.json({ 
      success: true, 
      total_items: yearItems.length,
      issues_found: issues.length,
      issues,
      fixes_applied: fixes.length,
      fixes
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});