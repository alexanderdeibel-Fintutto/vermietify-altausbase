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

    console.log(`[IMPORT] Importing financial data for building ${building_id}, year ${tax_year}`);

    // Hole Gebäude
    const buildings = await base44.entities.Building.filter({ id: building_id });
    if (buildings.length === 0) {
      return Response.json({ error: 'Building not found' }, { status: 404 });
    }
    const building = buildings[0];

    // Hole FinancialItems für das Jahr
    const yearStart = `${tax_year}-01-01`;
    const yearEnd = `${tax_year}-12-31`;

    const financialItems = await base44.entities.FinancialItem.filter({
      building_id,
      payment_date: { $gte: yearStart, $lte: yearEnd }
    });

    console.log(`[INFO] Found ${financialItems.length} financial items`);

    // Aggregiere Daten
    const data = {
      // Einnahmen
      income_rent: 0,
      income_nebenkosten: 0,
      income_other: 0,
      income_total: 0,

      // Ausgaben
      expense_maintenance: 0,
      expense_management: 0,
      expense_insurance: 0,
      expense_property_tax: 0,
      expense_utilities: 0,
      expense_financing: 0,
      expense_depreciation: 0,
      expense_other: 0,
      expense_total: 0,

      // Gebäudedaten
      address: building.address || building.name,
      property_type: building.property_type || 'Wohngebäude',
      year_built: building.year_built,
      total_area: building.total_area || 0
    };

    // Kategorisiere und summiere
    financialItems.forEach(item => {
      const amount = Math.abs(item.amount || 0);

      if (item.type === 'receivable' && item.status === 'paid') {
        // Einnahmen
        if (item.category === 'rent') {
          data.income_rent += amount;
        } else if (item.category === 'nebenkosten' || item.category === 'utilities') {
          data.income_nebenkosten += amount;
        } else {
          data.income_other += amount;
        }
        data.income_total += amount;
      } else if (item.type === 'payable' && item.status === 'paid') {
        // Ausgaben
        if (item.category === 'maintenance' || item.category === 'repair') {
          data.expense_maintenance += amount;
        } else if (item.category === 'management' || item.category === 'hausverwaltung') {
          data.expense_management += amount;
        } else if (item.category === 'insurance') {
          data.expense_insurance += amount;
        } else if (item.category === 'property_tax' || item.category === 'grundsteuer') {
          data.expense_property_tax += amount;
        } else if (item.category === 'utilities' || item.category === 'nebenkosten') {
          data.expense_utilities += amount;
        } else if (item.category === 'financing' || item.category === 'loan_interest') {
          data.expense_financing += amount;
        } else if (item.category === 'depreciation' || item.category === 'afa') {
          data.expense_depreciation += amount;
        } else {
          data.expense_other += amount;
        }
        data.expense_total += amount;
      }
    });

    // Berechne AfA wenn nicht vorhanden
    if (data.expense_depreciation === 0 && building.purchase_price && building.land_value) {
      const buildingValue = building.purchase_price - building.land_value;
      const afaRate = building.year_built < 1925 ? 0.025 : 0.02;
      data.expense_depreciation = buildingValue * afaRate;
      data.afa_calculated = true;
    }

    // Berechne Ergebnis
    data.net_result = data.income_total - data.expense_total;

    // Zusätzliche Metadaten
    data.items_count = financialItems.length;
    data.import_date = new Date().toISOString();
    data.data_quality = calculateDataQuality(financialItems, data);

    console.log(`[SUCCESS] Imported data: ${data.income_total.toFixed(2)} income, ${data.expense_total.toFixed(2)} expenses`);

    return Response.json({
      success: true,
      data,
      summary: {
        income: data.income_total,
        expenses: data.expense_total,
        result: data.net_result,
        items: financialItems.length
      }
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateDataQuality(items, data) {
  let score = 0;
  const checks = [];

  // Hat Transaktionen?
  if (items.length > 0) {
    score += 20;
    checks.push({ pass: true, message: 'Transaktionen vorhanden' });
  } else {
    checks.push({ pass: false, message: 'Keine Transaktionen' });
  }

  // Hat Einnahmen?
  if (data.income_total > 0) {
    score += 20;
    checks.push({ pass: true, message: 'Einnahmen vorhanden' });
  } else {
    checks.push({ pass: false, message: 'Keine Einnahmen' });
  }

  // Hat Ausgaben?
  if (data.expense_total > 0) {
    score += 20;
    checks.push({ pass: true, message: 'Ausgaben vorhanden' });
  } else {
    checks.push({ pass: false, message: 'Keine Ausgaben' });
  }

  // Ausgaben plausibel (nicht über Einnahmen)?
  if (data.expense_total < data.income_total * 2) {
    score += 20;
    checks.push({ pass: true, message: 'Ausgaben plausibel' });
  } else {
    checks.push({ pass: false, message: 'Ausgaben ungewöhnlich hoch' });
  }

  // Mehrere Kategorien?
  const categoriesUsed = [
    data.expense_maintenance,
    data.expense_management,
    data.expense_insurance,
    data.expense_property_tax
  ].filter(v => v > 0).length;

  if (categoriesUsed >= 2) {
    score += 20;
    checks.push({ pass: true, message: 'Mehrere Kategorien' });
  } else {
    checks.push({ pass: false, message: 'Wenige Kategorien' });
  }

  return {
    score,
    level: score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low',
    checks
  };
}