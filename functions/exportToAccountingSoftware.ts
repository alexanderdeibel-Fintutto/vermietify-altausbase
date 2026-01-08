import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, format = 'datev' } = await req.json();

    if (!submission_id) {
      return Response.json({ error: 'submission_id required' }, { status: 400 });
    }

    console.log(`[EXPORT] Exporting ${submission_id} to ${format}`);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    
    if (submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];
    const formData = sub.form_data || {};

    let exportData = '';

    if (format === 'datev') {
      // DATEV CSV Format
      const lines = [
        'Belegdatum;Sollkonto;Habenkonto;Betrag;Buchungstext;Beleg1;',
        ...Object.entries(formData)
          .filter(([key, value]) => typeof value === 'number' && value !== 0)
          .map(([key, value]) => {
            const datum = `01.01.${sub.tax_year}`;
            const konto = key.includes('einnahmen') ? '8400' : '4210';
            const gegenKonto = '1200';
            return `${datum};${konto};${gegenKonto};${value};${key};ELSTER-${sub.id};`;
          })
      ];
      exportData = lines.join('\n');
    } else if (format === 'lexoffice') {
      // Lexoffice JSON Format
      exportData = JSON.stringify({
        voucherType: 'salesinvoice',
        voucherDate: `${sub.tax_year}-12-31`,
        voucherNumber: `ELSTER-${sub.tax_year}`,
        lineItems: Object.entries(formData)
          .filter(([key, value]) => typeof value === 'number' && value !== 0)
          .map(([key, value]) => ({
            type: key.includes('einnahmen') ? 'service' : 'custom',
            name: key,
            quantity: 1,
            unitPrice: { currency: 'EUR', netAmount: value }
          }))
      }, null, 2);
    } else if (format === 'csv') {
      // Generic CSV
      const lines = [
        'Kategorie,Betrag,Jahr',
        ...Object.entries(formData)
          .filter(([key, value]) => typeof value === 'number' && value !== 0)
          .map(([key, value]) => `${key},${value},${sub.tax_year}`)
      ];
      exportData = lines.join('\n');
    }

    console.log(`[EXPORT] Generated ${format} export`);

    return Response.json({
      success: true,
      format,
      data: exportData,
      filename: `elster_export_${sub.tax_year}_${format}.${format === 'lexoffice' ? 'json' : 'csv'}`
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});