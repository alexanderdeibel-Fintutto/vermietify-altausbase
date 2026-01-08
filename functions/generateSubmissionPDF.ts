import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    if (!submission_id) {
      return Response.json({ error: 'submission_id required' }, { status: 400 });
    }

    console.log(`[PDF-GENERATION] Generating PDF for ${submission_id}`);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    
    if (submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];

    // Erstelle strukturierten HTML-Content
    const formData = sub.form_data || {};
    const entries = Object.entries(formData);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
    .meta { background: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 8px; }
    .meta-item { margin: 5px 0; }
    .meta-label { font-weight: bold; display: inline-block; width: 150px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
    th { background: #e5e7eb; font-weight: bold; }
    tr:nth-child(even) { background: #f9fafb; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #d1d5db; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <h1>ELSTER-Submission: ${sub.tax_form_type}</h1>
  
  <div class="meta">
    <div class="meta-item"><span class="meta-label">Steuerjahr:</span> ${sub.tax_year}</div>
    <div class="meta-item"><span class="meta-label">Rechtsform:</span> ${sub.legal_form}</div>
    <div class="meta-item"><span class="meta-label">Status:</span> ${sub.status}</div>
    <div class="meta-item"><span class="meta-label">Modus:</span> ${sub.submission_mode}</div>
    ${sub.submission_date ? `<div class="meta-item"><span class="meta-label">Übermittelt:</span> ${new Date(sub.submission_date).toLocaleDateString('de-DE')}</div>` : ''}
    ${sub.transfer_ticket ? `<div class="meta-item"><span class="meta-label">Transfer-Ticket:</span> ${sub.transfer_ticket}</div>` : ''}
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
      ${entries.map(([key, value]) => `
        <tr>
          <td>${key}</td>
          <td>${String(value)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${sub.validation_errors && sub.validation_errors.length > 0 ? `
  <h2 style="color: #dc2626;">Validierungsfehler</h2>
  <ul>
    ${sub.validation_errors.map(err => `<li>${err.message || JSON.stringify(err)}</li>`).join('')}
  </ul>
  ` : ''}

  <div class="footer">
    Erstellt am ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')}<br>
    Submission-ID: ${submission_id}
  </div>
</body>
</html>
    `;

    // Verwende InvokeLLM um PDF zu generieren (alternativ: html2pdf, puppeteer)
    // Für Demo: Gebe HTML zurück, Client kann html2pdf.js verwenden
    
    return Response.json({
      success: true,
      html_content: htmlContent,
      submission_id
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});