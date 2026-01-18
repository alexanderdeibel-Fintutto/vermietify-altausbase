import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { statement_id } = payload;

    const statement = await base44.entities.OperatingCostStatement.get(statement_id);
    const building = await base44.entities.Building.get(statement.building_id);
    const items = await base44.entities.OperatingCostItem.filter({ statement_id });
    const units = await base44.entities.Unit.filter({ building_id: statement.building_id });

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; font-size: 11pt; }
    h1 { color: #1E3A8A; font-size: 20pt; }
    h2 { color: #334155; font-size: 14pt; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #E2E8F0; }
    th { background: #F1F5F9; font-weight: bold; }
    .total { font-weight: bold; background: #FEF3C7; }
    .footer { margin-top: 40px; font-size: 9pt; color: #64748B; }
  </style>
</head>
<body>
  <h1>Betriebskostenabrechnung ${statement.abrechnungsjahr}</h1>
  
  <p><strong>Objekt:</strong> ${building.adresse}, ${building.plz} ${building.ort}</p>
  <p><strong>Abrechnungszeitraum:</strong> ${statement.zeitraum_von} bis ${statement.zeitraum_bis}</p>
  <p><strong>Erstellt am:</strong> ${new Date(statement.erstellungsdatum).toLocaleDateString('de-DE')}</p>

  <h2>Kostenpositionen</h2>
  <table>
    <thead>
      <tr>
        <th>Position</th>
        <th>BetrKV</th>
        <th>Betrag</th>
        <th>Verteilschlüssel</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td>${item.bezeichnung}</td>
          <td>${item.betrkv_nummer || '-'}</td>
          <td>${item.gesamtbetrag?.toFixed(2) || 0} €</td>
          <td>${item.verteilerschluessel}</td>
        </tr>
      `).join('')}
      <tr class="total">
        <td colspan="2"><strong>Summe Betriebskosten</strong></td>
        <td><strong>${items.reduce((sum, i) => sum + (i.gesamtbetrag || 0), 0).toFixed(2)} €</strong></td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <h2>Verteilung auf Einheiten</h2>
  <p>Anzahl Einheiten: ${units.length}</p>
  <p>Gesamtfläche: ${units.reduce((sum, u) => sum + (u.flaeche_qm || 0), 0).toFixed(2)} m²</p>

  <div class="footer">
    <p>Erstellt mit Vermitify - Intelligente Immobilienverwaltung</p>
    <p>Diese Abrechnung wurde nach den Vorgaben der Betriebskostenverordnung (BetrKV) erstellt.</p>
  </div>
</body>
</html>
    `;

    const pdfResult = await base44.integrations.Core.GeneratePDF({ 
      html_content: htmlContent 
    });

    return Response.json({
      success: true,
      pdf_url: pdfResult.file_url
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});