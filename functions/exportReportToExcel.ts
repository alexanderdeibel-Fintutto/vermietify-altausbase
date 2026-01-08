import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date_from, date_to } = await req.json();

    // Reports laden
    const allReports = await base44.asServiceRole.entities.UserProblem.list('-created_date', 1000);
    const reports = allReports.filter(r => {
      const reportDate = new Date(r.created_date);
      return reportDate >= new Date(date_from) && reportDate <= new Date(date_to);
    });

    // CSV erstellen (Excel-kompatibel)
    const headers = [
      'ID', 'Title', 'Priority', 'Priority Score', 'Business Area', 'Problem Type',
      'Status', 'Created Date', 'Tester', 'Assigned To', 'Business Impact',
      'Functional Severity', 'UX Severity', 'User Journey Stage', 'Affected Users',
      'Fix Effort', 'Description'
    ];

    const rows = reports.map(r => [
      r.id.substring(0, 8),
      r.problem_titel || '',
      r.business_priority || '',
      r.priority_score || 0,
      r.business_area || '',
      r.problem_type || '',
      r.status || '',
      r.created_date ? new Date(r.created_date).toLocaleDateString('de-DE') : '',
      r.tester_name || '',
      r.assigned_to || '',
      r.business_impact || '',
      r.functional_severity || '',
      r.ux_severity || '',
      r.user_journey_stage || '',
      r.affected_user_count_estimate || '',
      r.estimated_fix_effort || '',
      (r.problem_beschreibung || '').replace(/"/g, '""').substring(0, 200)
    ]);

    // CSV mit Anführungszeichen für Excel
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // UTF-8 BOM für korrekte deutsche Umlaute in Excel
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    return new Response(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=problem-reports-${date_from}-to-${date_to}.csv`
      }
    });

  } catch (error) {
    console.error('Error exporting Excel:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});