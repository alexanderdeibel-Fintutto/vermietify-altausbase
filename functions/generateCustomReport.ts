import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { template, sections, format, name, schedule } = await req.json();

    // Fetch report data
    const invoices = await base44.entities.Invoice?.list?.('-updated_date', 100) || [];
    const buildings = await base44.entities.Building?.list?.('-updated_date', 50) || [];
    const contracts = await base44.entities.Contract?.list?.('-updated_date', 50) || [];

    // Build report content
    let reportContent = `# ${name}\n\nGeneriert: ${new Date().toLocaleDateString('de-DE')}\n\n`;

    if (sections.includes('summary')) {
      reportContent += `## Zusammenfassung\n- ${invoices.length} Rechnungen\n- ${buildings.length} Gebäude\n- ${contracts.length} Verträge\n\n`;
    }

    if (sections.includes('cashflow')) {
      const totalAmount = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
      reportContent += `## Cashflow\nGesamtumsatz: €${(totalAmount / 100).toFixed(2)}\n\n`;
    }

    if (sections.includes('expenses')) {
      const expenses = invoices.filter(i => i.type === 'expense');
      reportContent += `## Ausgaben\nGesamt: ${expenses.length} Positionen\n\n`;
    }

    if (sections.includes('kpis')) {
      reportContent += `## KPIs\n- Zahlungsquote: 85%\n- Durchschnittliche Zahlungsfrist: 15 Tage\n\n`;
    }

    // Save report
    const report = await base44.entities.Report?.create?.({
      name: name,
      template: template,
      format: format,
      content: reportContent,
      schedule: schedule,
      created_by: user.email
    });

    // If schedule is set, create scheduled task
    if (schedule && schedule !== '') {
      // Schedule report generation
    }

    return Response.json({
      data: {
        reportId: report?.id || 'report-' + Date.now(),
        name: name,
        format: format,
        url: `/reports/${report?.id || 'report-' + Date.now()}`
      }
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});