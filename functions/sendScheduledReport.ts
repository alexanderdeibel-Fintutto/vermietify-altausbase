import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const body = await req.json();
    const { reportType, recipientEmail } = body;

    const stats = await base44.functions.invoke('generateDashboardStats', {});
    
    const reportHTML = `
      <h1>Vermitify Bericht - ${new Date().toLocaleDateString('de-DE')}</h1>
      <h2>${reportType}</h2>
      <p>Objekte: ${stats.data.buildings.total}</p>
      <p>Einheiten: ${stats.data.units.total}</p>
      <p>Auslastung: ${stats.data.units.occupancy_rate}%</p>
      <p>Monatliche Mieteinnahmen: €${stats.data.financial.monthly_rent}</p>
    `;

    await base44.integrations.Core.SendEmail({
      to: recipientEmail,
      subject: `Vermitify ${reportType} - ${new Date().toLocaleDateString('de-DE')}`,
      body: reportHTML
    });

    return Response.json({ success: true });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});