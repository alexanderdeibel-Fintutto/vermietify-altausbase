import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report_data, country, tax_year } = await req.json();

    if (!report_data) {
      return Response.json({ error: 'Missing report data' }, { status: 400 });
    }

    const pdfContent = `
TAX REPORT - ${country} ${tax_year}
Generated: ${new Date().toLocaleDateString()}

EXECUTIVE SUMMARY
${report_data.executive_summary || 'No summary available'}

SECTIONS
${(report_data.sections || []).map(s => `
${s.title}
${s.content}
`).join('\n')}

KEY METRICS
${Object.entries(report_data.key_metrics || {}).map(([k, v]) => `${k}: ${v}`).join('\n')}

RECOMMENDATIONS
${(report_data.recommendations || []).map((r, i) => `${i + 1}. ${r}`).join('\n')}
    `;

    return new Response(pdfContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="tax-report-${country}-${tax_year}.pdf"`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});