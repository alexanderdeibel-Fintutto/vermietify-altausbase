import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report_type, year } = await req.json();

    // Generiere Report
    const reportResponse = await base44.functions.invoke('generateTaxReport', {
      report_type,
      year
    });

    // Sende E-Mail an Steuerberater (aus User-Profil oder Einstellungen)
    const advisorEmail = user.tax_advisor_email || 'steuerberater@example.com';

    await base44.integrations.Core.SendEmail({
      from_name: 'ImmoVerwalter',
      to: advisorEmail,
      subject: `Steuer-Report ${report_type} für ${year}`,
      body: `
        <h2>Neuer Steuer-Report</h2>
        <p>Sehr geehrte Damen und Herren,</p>
        <p>anbei erhalten Sie den angeforderten Steuer-Report für ${year}.</p>
        <p><strong>Report-Typ:</strong> ${report_type}</p>
        <p><strong>Jahr:</strong> ${year}</p>
        <p><strong>Erstellt am:</strong> ${new Date().toLocaleDateString('de-DE')}</p>
        <p>Mit freundlichen Grüßen</p>
        <p>${user.full_name}</p>
      `
    });

    return Response.json({
      success: true,
      message: `Report erfolgreich an ${advisorEmail} gesendet`
    });

  } catch (error) {
    console.error('Send Report to Advisor Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});