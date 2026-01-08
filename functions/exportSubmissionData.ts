import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_ids, format = 'csv' } = await req.json();

    if (!submission_ids || !Array.isArray(submission_ids)) {
      return Response.json({ error: 'submission_ids array required' }, { status: 400 });
    }

    console.log(`[EXPORT] Exporting ${submission_ids.length} submissions as ${format}`);

    const submissions = await Promise.all(
      submission_ids.map(id => base44.entities.ElsterSubmission.filter({ id }))
    );

    const flatSubmissions = submissions.flat();

    if (format === 'csv') {
      // CSV Export
      const headers = [
        'ID', 'Formular', 'Jahr', 'Rechtsform', 'Status', 
        'Einnahmen', 'Ausgaben', 'AfA', 'Ergebnis',
        'KI-Vertrauen', 'Erstellt', 'Übermittelt'
      ];

      const rows = flatSubmissions.map(s => {
        const expenses = Object.entries(s.form_data || {})
          .filter(([key]) => key.startsWith('expense_'))
          .reduce((sum, [_, value]) => sum + value, 0);
        
        const result = (s.form_data?.income_rent || 0) - expenses - (s.form_data?.afa_amount || 0);

        return [
          s.id,
          s.tax_form_type,
          s.tax_year,
          s.legal_form,
          s.status,
          s.form_data?.income_rent || 0,
          expenses,
          s.form_data?.afa_amount || 0,
          result,
          s.ai_confidence_score || 0,
          s.created_date ? new Date(s.created_date).toLocaleDateString('de-DE') : '',
          s.submission_date ? new Date(s.submission_date).toLocaleDateString('de-DE') : ''
        ];
      });

      const csv = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
      ].join('\n');

      return Response.json({
        success: true,
        format: 'csv',
        data: csv,
        filename: `elster_export_${new Date().toISOString().split('T')[0]}.csv`
      });
    } else if (format === 'json') {
      // JSON Export
      return Response.json({
        success: true,
        format: 'json',
        data: JSON.stringify(flatSubmissions, null, 2),
        filename: `elster_export_${new Date().toISOString().split('T')[0]}.json`
      });
    } else if (format === 'excel') {
      // Excel-kompatibles CSV
      const headers = [
        'ID', 'Formular', 'Jahr', 'Rechtsform', 'Status', 
        'Einnahmen', 'Ausgaben', 'AfA', 'Ergebnis',
        'KI-Vertrauen (%)', 'Erstellt am', 'Übermittelt am',
        'Gebäude-ID', 'Transfer-Ticket', 'Fehleranzahl'
      ];

      const rows = flatSubmissions.map(s => {
        const expenses = Object.entries(s.form_data || {})
          .filter(([key]) => key.startsWith('expense_'))
          .reduce((sum, [_, value]) => sum + value, 0);
        
        const result = (s.form_data?.income_rent || 0) - expenses - (s.form_data?.afa_amount || 0);

        return [
          s.id,
          s.tax_form_type,
          s.tax_year,
          s.legal_form,
          s.status,
          s.form_data?.income_rent || 0,
          expenses,
          s.form_data?.afa_amount || 0,
          result,
          s.ai_confidence_score || 0,
          s.created_date ? new Date(s.created_date).toLocaleString('de-DE') : '',
          s.submission_date ? new Date(s.submission_date).toLocaleString('de-DE') : '',
          s.building_id || '',
          s.transfer_ticket || '',
          s.validation_errors?.length || 0
        ];
      });

      const csv = [
        headers.join('\t'),
        ...rows.map(row => row.join('\t'))
      ].join('\n');

      return Response.json({
        success: true,
        format: 'excel',
        data: csv,
        filename: `elster_export_${new Date().toISOString().split('T')[0]}.xlsx`
      });
    }

    return Response.json({ error: 'Invalid format' }, { status: 400 });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});