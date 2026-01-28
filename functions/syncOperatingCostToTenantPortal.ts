import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { statementId, pdfUrl } = await req.json();
    
    if (!statementId || !pdfUrl) {
      return Response.json({ error: 'statementId and pdfUrl required' }, { status: 400 });
    }
    
    // Statement laden
    const statements = await base44.entities.OperatingCostStatement.filter({ id: statementId });
    const statement = statements[0];
    
    if (!statement) {
      return Response.json({ error: 'Statement not found' }, { status: 404 });
    }
    
    // Einheits-Ergebnisse laden
    const unitResults = await base44.entities.OperatingCostUnitResult.filter({ 
      statement_id: statementId 
    });
    
    let sharedCount = 0;
    
    // Für jede Einheit ein Portal-Dokument erstellen
    for (const unitResult of unitResults) {
      // Mieter-Daten laden
      const contracts = await base44.entities.LeaseContract.filter({ id: unitResult.contract_id });
      const contract = contracts[0];
      
      if (!contract) continue;
      
      const tenants = await base44.entities.Tenant.filter({ id: contract.tenant_id });
      const tenant = tenants[0];
      
      if (!tenant || !tenant.email) continue;
      
      // Portal-Dokument erstellen
      await base44.entities.TenantPortalDocument.create({
        unit_id: unitResult.unit_id,
        building_id: statement.building_id,
        tenant_id: tenant.id,
        document_type: 'operating_costs',
        title: `Nebenkostenabrechnung ${statement.abrechnungsjahr}`,
        description: `Abrechnungszeitraum: ${new Date(statement.zeitraum_von).toLocaleDateString('de-DE')} - ${new Date(statement.zeitraum_bis).toLocaleDateString('de-DE')}`,
        file_url: pdfUrl,
        document_date: statement.created_date,
        is_visible: true,
        requires_acknowledgment: true,
        related_operating_cost_id: statement.id
      });
      
      // E-Mail-Benachrichtigung
      await base44.integrations.Core.SendEmail({
        to: tenant.email,
        subject: `Nebenkostenabrechnung ${statement.abrechnungsjahr}`,
        body: `
          <h2>Ihre Nebenkostenabrechnung ist verfügbar</h2>
          <p>Hallo ${tenant.first_name} ${tenant.last_name},</p>
          <p>Ihre Nebenkostenabrechnung für das Jahr ${statement.abrechnungsjahr} steht jetzt zur Verfügung.</p>
          <p><strong>Abrechnungszeitraum:</strong> ${new Date(statement.zeitraum_von).toLocaleDateString('de-DE')} - ${new Date(statement.zeitraum_bis).toLocaleDateString('de-DE')}</p>
          <p><strong>Ihr Ergebnis:</strong> ${unitResult.ergebnis >= 0 ? 'Nachzahlung' : 'Guthaben'} von ${Math.abs(unitResult.ergebnis).toFixed(2)} €</p>
          <p>Sie können die Abrechnung in Ihrer MieterApp einsehen:</p>
          <p><a href="https://mieterapp.fintutto.de">Zur MieterApp</a></p>
        `
      });
      
      sharedCount++;
    }
    
    return Response.json({
      success: true,
      sharedCount,
      message: `Abrechnung mit ${sharedCount} Mietern geteilt`
    });
    
  } catch (error) {
    console.error('Sync Operating Cost Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});