import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { contract_id } = payload;

    const contract = await base44.entities.LeaseContract.get(contract_id);
    const tenant = await base44.entities.Tenant.get(contract.tenant_id);
    const unit = await base44.entities.Unit.get(contract.unit_id);
    const building = await base44.entities.Building.get(unit.building_id);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    h1 { color: #1E3A8A; }
    .section { margin: 30px 0; }
    .signature { margin-top: 80px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px; }
  </style>
</head>
<body>
  <h1>Mietvertrag</h1>
  
  <div class="section">
    <h2>Vermieter</h2>
    <p>${user.full_name}<br>
    ${building.adresse}<br>
    ${building.plz} ${building.ort}</p>
  </div>
  
  <div class="section">
    <h2>Mieter</h2>
    <p>${tenant.name}<br>
    ${tenant.email}</p>
  </div>
  
  <div class="section">
    <h2>Mietobjekt</h2>
    <p>${building.adresse}<br>
    ${unit.bezeichnung || unit.einheit_nummer}<br>
    Fläche: ${unit.flaeche_qm} m²</p>
  </div>
  
  <div class="section">
    <h2>Mietkonditionen</h2>
    <table>
      <tr><td>Mietbeginn:</td><td>${contract.beginn_datum}</td></tr>
      <tr><td>Kaltmiete:</td><td>${contract.kaltmiete?.toFixed(2) || 0} € monatlich</td></tr>
      <tr><td>Nebenkosten:</td><td>${contract.nebenkosten_vorauszahlung?.toFixed(2) || 0} € monatlich</td></tr>
      <tr><td><strong>Gesamtmiete:</strong></td><td><strong>${((contract.kaltmiete || 0) + (contract.nebenkosten_vorauszahlung || 0)).toFixed(2)} €</strong></td></tr>
      <tr><td>Kaution:</td><td>${contract.kaution_betrag?.toFixed(2) || 0} €</td></tr>
    </table>
  </div>
  
  <div class="signature">
    <table>
      <tr>
        <td width="50%">
          _____________________<br>
          Ort, Datum
        </td>
        <td width="50%">
          _____________________<br>
          Unterschrift Vermieter
        </td>
      </tr>
      <tr>
        <td colspan="2">&nbsp;</td>
      </tr>
      <tr>
        <td colspan="2">
          _____________________<br>
          Unterschrift Mieter
        </td>
      </tr>
    </table>
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