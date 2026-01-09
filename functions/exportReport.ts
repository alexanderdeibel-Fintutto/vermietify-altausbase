import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Exports a report as PDF or CSV
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportData, format = 'csv' } = await req.json();

    if (!reportData) {
      return Response.json({ error: 'Report data required' }, { status: 400 });
    }

    console.log(`Exporting report as ${format}`);

    if (format === 'csv') {
      const csv = generateCSV(reportData);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="report_${new Date().getTime()}.csv"`
        }
      });
    } else if (format === 'pdf') {
      // For PDF, we'd normally use a library, but for simplicity return a formatted response
      const html = generateHTML(reportData);
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8'
        }
      });
    }

    return Response.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('Error exporting report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateCSV(reportData) {
  let csv = `Bericht: ${reportData.name}\nGeneriert: ${reportData.generated_at}\n\n`;
  
  // Summary
  csv += 'ZUSAMMENFASSUNG\n';
  csv += Object.entries(reportData.summary).map(([key, value]) => `${key},${value}`).join('\n');
  csv += '\n\n';

  // Charts data
  if (reportData.charts && reportData.charts.length > 0) {
    reportData.charts.forEach((chart, idx) => {
      csv += `DIAGRAMM ${idx + 1}: ${chart.title}\n`;
      csv += 'Name,Wert\n';
      chart.data.forEach(d => {
        csv += `${d.name},${d.value}\n`;
      });
      csv += '\n';
    });
  }

  return csv;
}

function generateHTML(reportData) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${reportData.name}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #1e293b; }
        h2 { color: #475569; margin-top: 30px; }
        .summary { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .summary-item { margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #0f172a; color: white; }
        .meta { color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>${reportData.name}</h1>
      <p class="meta">Generiert: ${new Date(reportData.generated_at).toLocaleString('de-DE')}</p>
      
      <h2>Zusammenfassung</h2>
      <div class="summary">
        ${Object.entries(reportData.summary).map(([key, value]) => 
          `<div class="summary-item"><strong>${key}:</strong> ${value}</div>`
        ).join('')}
      </div>

      ${reportData.charts.map((chart, idx) => `
        <h2>${chart.title}</h2>
        <table>
          <thead><tr><th>Name</th><th>Wert</th></tr></thead>
          <tbody>
            ${chart.data.map(d => `<tr><td>${d.name}</td><td>${d.value}</td></tr>`).join('')}
          </tbody>
        </table>
      `).join('')}
    </body>
    </html>
  `;
}