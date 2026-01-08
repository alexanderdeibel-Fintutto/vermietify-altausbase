import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, tax_year } = await req.json();

    if (!building_id || !tax_year) {
      return Response.json({ error: 'building_id and tax_year required' }, { status: 400 });
    }

    console.log(`[SYNC] Syncing financial data for building ${building_id}, year ${tax_year}`);

    // Zeitraum für das Steuerjahr
    const yearStart = new Date(tax_year, 0, 1);
    const yearEnd = new Date(tax_year, 11, 31);

    // Hole alle FinancialItems für das Gebäude
    const financialItems = await base44.entities.FinancialItem.filter({
      building_id,
      date: { $gte: yearStart.toISOString(), $lte: yearEnd.toISOString() }
    });

    console.log(`[INFO] Found ${financialItems.length} financial items`);

    // Kategorisiere nach ELSTER-Feldern
    const categorized = {
      income_rent: 0,
      expense_property_tax: 0,
      expense_insurance: 0,
      expense_maintenance: 0,
      expense_administration: 0,
      expense_interest: 0,
      expense_utilities: 0,
      expense_other: 0
    };

    const itemDetails = [];

    for (const item of financialItems) {
      const amount = Math.abs(item.amount || 0);
      const isIncome = item.type === 'income';
      const isExpense = item.type === 'expense';

      let mapped = false;

      if (isIncome) {
        // Mieteinnahmen
        if (item.category?.includes('Miete') || item.category?.includes('Rent')) {
          categorized.income_rent += amount;
          mapped = true;
        }
      } else if (isExpense) {
        // Grundsteuer
        if (item.category?.includes('Grundsteuer') || item.category?.includes('Property Tax')) {
          categorized.expense_property_tax += amount;
          mapped = true;
        }
        // Versicherung
        else if (item.category?.includes('Versicherung') || item.category?.includes('Insurance')) {
          categorized.expense_insurance += amount;
          mapped = true;
        }
        // Instandhaltung
        else if (item.category?.includes('Instandhaltung') || item.category?.includes('Maintenance') || 
                 item.category?.includes('Reparatur')) {
          categorized.expense_maintenance += amount;
          mapped = true;
        }
        // Verwaltung
        else if (item.category?.includes('Verwaltung') || item.category?.includes('Administration')) {
          categorized.expense_administration += amount;
          mapped = true;
        }
        // Zinsen
        else if (item.category?.includes('Zins') || item.category?.includes('Interest')) {
          categorized.expense_interest += amount;
          mapped = true;
        }
        // Nebenkosten
        else if (item.category?.includes('Nebenkosten') || item.category?.includes('Utilities')) {
          categorized.expense_utilities += amount;
          mapped = true;
        }
      }

      if (!mapped && isExpense) {
        categorized.expense_other += amount;
      }

      itemDetails.push({
        id: item.id,
        date: item.date,
        description: item.description,
        amount: item.amount,
        category: item.category,
        type: item.type,
        mapped_to: mapped ? Object.keys(categorized).find(key => 
          categorized[key] === amount || Math.abs(categorized[key] - amount) < 0.01
        ) : 'expense_other'
      });
    }

    // Hole Gebäude-Details für AfA
    const buildings = await base44.entities.Building.filter({ id: building_id });
    const building = buildings[0];

    // AfA berechnen (2% für Wohngebäude nach 1925)
    let afa_amount = 0;
    if (building?.purchase_price) {
      const landValue = building.land_value || (building.purchase_price * 0.2);
      const buildingValue = building.purchase_price - landValue;
      afa_amount = buildingValue * 0.02; // 2% linear
    }

    console.log(`[SUCCESS] Categorized data: Income ${categorized.income_rent}, Expenses ${Object.values(categorized).reduce((a, b) => a + b, 0)}`);

    return Response.json({
      success: true,
      form_data: {
        ...categorized,
        afa_amount,
        building_cost: building?.purchase_price || 0
      },
      item_count: financialItems.length,
      details: itemDetails,
      summary: {
        total_income: categorized.income_rent,
        total_expenses: Object.entries(categorized)
          .filter(([key]) => key.startsWith('expense_'))
          .reduce((sum, [_, value]) => sum + value, 0),
        net_result: categorized.income_rent - Object.entries(categorized)
          .filter(([key]) => key.startsWith('expense_'))
          .reduce((sum, [_, value]) => sum + value, 0) - afa_amount
      }
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});