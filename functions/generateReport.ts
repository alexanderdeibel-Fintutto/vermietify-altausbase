import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, type, format, recipients, filters } = await req.json();

    let content = `<h1>${name}</h1><p>Generiert: ${new Date().toLocaleString('de-DE')}</p>`;

    if (type === 'financial') {
      content += `<h2>Finanzübersicht</h2><p>Gesamtumsatz, Ausgaben, Gewinn...</p>`;
    } else if (type === 'occupancy') {
      content += `<h2>Belegungsstatistik</h2><p>Aktive Verträge, Leerstand...</p>`;
    }

    const report = await base44.entities.Report?.create?.({
      name: name,
      type: type,
      format: format,
      content: content,
      recipients: JSON.stringify(recipients),
      filters: JSON.stringify(filters),
      generated_at: new Date().toISOString()
    });

    // Send emails if recipients provided
    if (recipients?.length > 0) {
      for (const email of recipients) {
        try {
          await base44.integrations.Core.SendEmail({
            to: email,
            subject: `Report: ${name}`,
            body: content
          });
        } catch (e) {
          console.error(`Email error for ${email}:`, e);
        }
      }
    }

    return Response.json({ data: report });
  } catch (error) {
    console.error('Report generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});