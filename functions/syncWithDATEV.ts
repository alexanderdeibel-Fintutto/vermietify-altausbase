import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, tax_year, export_format = 'datev' } = await req.json();

    console.log('[DATEV-SYNC] Exporting to DATEV format');

    // Lade FinancialItems
    const allItems = await base44.entities.FinancialItem.filter();
    const yearItems = allItems.filter(item => {
      const itemYear = new Date(item.date).getFullYear();
      return itemYear === tax_year && item.building_id === building_id;
    });

    if (export_format === 'datev') {
      // DATEV CSV Format (Kontenrahmen SKR03/SKR04)
      const rows = [
        ['Umsatzdatum', 'Belegdatum', 'Wert', 'Sollkonto', 'Habenkonto', 'Kostenart', 'Text', 'Beleg'].join(';')
      ];

      for (const item of yearItems) {
        const accountMap = {
          'MIETEINNAHMEN': '4100',
          'INSTANDHALTUNG': '6200',
          'VERSICHERUNG': '6360',
          'MAKLER': '6430',
          'NEBENKOSTEN': '4120',
          'GEBÜHREN': '6400'
        };

        const sollAccount = item.type === 'INCOME' ? '1200' : '6000'; // Default accounts
        const habenAccount = accountMap[item.cost_category] || '4000';

        rows.push([
          new Date(item.date).toLocaleDateString('de-DE'),
          new Date(item.date).toLocaleDateString('de-DE'),
          Math.abs(item.amount).toString().replace('.', ','),
          sollAccount,
          habenAccount,
          item.cost_category || '',
          item.description,
          item.id
        ].join(';'));
      }

      const csvContent = rows.join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="datev_export_${building_id}_${tax_year}.csv"`
        }
      });
    }

    return Response.json({ error: 'Unsupported format' }, { status: 400 });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});