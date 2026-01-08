import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const building_id = formData.get('building_id');
    const tax_year = parseInt(formData.get('tax_year'));

    if (!file || !building_id || !tax_year) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('[IMPORT] Processing Excel file...');

    // File in Text umwandeln (CSV erwartet)
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return Response.json({ error: 'Excel-Datei ist leer' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx];
      });
      data.push(row);
    }

    console.log(`[INFO] Parsed ${data.length} rows`);

    // Strukturierte Daten für ELSTER aufbereiten
    const formData_result = {
      income_rent: 0,
      expense_property_tax: 0,
      expense_insurance: 0,
      expense_maintenance: 0,
      expense_administration: 0,
      expense_interest: 0,
      afa_amount: 0,
      other_expenses: 0
    };

    data.forEach(row => {
      const category = row.Kategorie || row.category || '';
      const amount = parseFloat(row.Betrag || row.amount || 0);

      if (category.toLowerCase().includes('miete')) {
        formData_result.income_rent += amount;
      } else if (category.toLowerCase().includes('grundsteuer')) {
        formData_result.expense_property_tax += amount;
      } else if (category.toLowerCase().includes('versicherung')) {
        formData_result.expense_insurance += amount;
      } else if (category.toLowerCase().includes('instandhaltung') || category.toLowerCase().includes('reparatur')) {
        formData_result.expense_maintenance += amount;
      } else if (category.toLowerCase().includes('verwaltung')) {
        formData_result.expense_administration += amount;
      } else if (category.toLowerCase().includes('zinsen')) {
        formData_result.expense_interest += amount;
      } else if (category.toLowerCase().includes('afa') || category.toLowerCase().includes('abschreibung')) {
        formData_result.afa_amount += amount;
      } else {
        formData_result.other_expenses += amount;
      }
    });

    console.log('[SUCCESS] Financial data prepared');

    return Response.json({
      success: true,
      imported_rows: data.length,
      form_data: formData_result,
      message: `${data.length} Zeilen erfolgreich importiert und kategorisiert`
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});