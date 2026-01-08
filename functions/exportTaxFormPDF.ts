import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    console.log('[PDF-EXPORT] Generating PDF for submission:', submission_id);

    const submissions = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (!submissions || submissions.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissions[0];

    // HTML-Template für PDF generieren
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          .section { margin: 20px 0; }
          .label { font-weight: bold; color: #475569; }
          .value { margin-left: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
          th { background-color: #f1f5f9; }
        </style>
      </head>
      <body>
        <h1>${submission.tax_form_type} - ${submission.tax_year}</h1>
        
        <div class="section">
          <p><span class="label">Rechtsform:</span><span class="value">${submission.legal_form}</span></p>
          <p><span class="label">Status:</span><span class="value">${submission.status}</span></p>
          <p><span class="label">Erstellt:</span><span class="value">${new Date(submission.created_date).toLocaleString('de-DE')}</span></p>
          ${submission.transfer_ticket ? `<p><span class="label">Transfer-Ticket:</span><span class="value">${submission.transfer_ticket}</span></p>` : ''}
        </div>

        <h2>Formulardaten</h2>
        <table>
          <thead>
            <tr>
              <th>Feld</th>
              <th>Wert</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(submission.form_data || {}).map(([key, value]) => `
              <tr>
                <td>${key}</td>
                <td>${value}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${submission.xml_data ? `
          <h2>ELSTER-XML</h2>
          <pre style="background: #f1f5f9; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 10px;">${submission.xml_data}</pre>
        ` : ''}
      </body>
      </html>
    `;

    // PDF generieren via generatePDF-Funktion
    const pdfResponse = await base44.functions.invoke('generatePDF', {
      html: htmlContent,
      filename: `elster_${submission.tax_form_type}_${submission.tax_year}.pdf`
    });

    return new Response(pdfResponse.data, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="elster_${submission.tax_form_type}_${submission.tax_year}.pdf"`
      }
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});