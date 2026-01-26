import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generiert ein Mieter-spezifisches PDF einer Nebenkostenabrechnung
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { statement_id, unit_result_id } = await req.json();

    // Daten laden
    const statement = await base44.entities.OperatingCostStatement.get(statement_id);
    const building = await base44.entities.Building.get(statement.building_id);
    const unitResult = await base44.entities.OperatingCostUnitResult.get(unit_result_id);
    const unit = await base44.entities.Unit.get(unitResult.unit_id);
    
    let tenant = null;
    if (unitResult.tenant_id) {
      tenant = await base44.entities.Tenant.get(unitResult.tenant_id);
    }

    const costDetails = await base44.entities.OperatingCostUnitDetail.filter({
      unit_result_id: unitResult.id
    });

    // HTML-Template erstellen
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Arial', sans-serif; padding: 40px; font-size: 10pt; line-height: 1.4; }
    .header { border-bottom: 3px solid #1E3A8A; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #1E3A8A; font-size: 22pt; margin: 0 0 10px 0; }
    .header .subtitle { color: #64748B; font-size: 11pt; }
    .section { margin: 25px 0; }
    .section-title { font-size: 14pt; font-weight: bold; color: #334155; margin-bottom: 15px; border-bottom: 2px solid #E2E8F0; padding-bottom: 5px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
    .info-item { }
    .info-label { font-size: 9pt; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 11pt; font-weight: 600; color: #0F172A; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background: #F1F5F9; padding: 10px; text-align: left; font-weight: 600; font-size: 9pt; color: #475569; border-bottom: 2px solid #CBD5E1; }
    td { padding: 10px; border-bottom: 1px solid #E2E8F0; font-size: 10pt; }
    .total-row { background: #FEF3C7; font-weight: bold; }
    .result-box { background: ${unitResult.ergebnis >= 0 ? '#FEF2F2' : '#F0FDF4'}; border: 2px solid ${unitResult.ergebnis >= 0 ? '#FCA5A5' : '#86EFAC'}; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0; }
    .result-label { font-size: 11pt; color: #64748B; margin-bottom: 8px; }
    .result-amount { font-size: 28pt; font-weight: bold; color: ${unitResult.ergebnis >= 0 ? '#DC2626' : '#16A34A'}; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #E2E8F0; font-size: 8pt; color: #94A3B8; }
    .highlight { background: #DBEAFE; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Betriebskostenabrechnung ${statement.abrechnungsjahr}</h1>
    <div class="subtitle">Objekt: ${building.name}</div>
  </div>

  <!-- Empfänger & Objekt -->
  <div class="section">
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Mieter</div>
        <div class="info-value">
          ${tenant ? `${tenant.anrede || ''} ${tenant.first_name} ${tenant.last_name}` : 'Leerstand'}
        </div>
      </div>
      <div class="info-item">
        <div class="info-label">Wohneinheit</div>
        <div class="info-value">${unit.unit_number} • ${unit.wohnflaeche_qm} m²</div>
      </div>
      <div class="info-item">
        <div class="info-label">Abrechnungszeitraum</div>
        <div class="info-value">
          ${new Date(statement.zeitraum_von).toLocaleDateString('de-DE')} - 
          ${new Date(statement.zeitraum_bis).toLocaleDateString('de-DE')}
        </div>
      </div>
      <div class="info-item">
        <div class="info-label">Nutzungszeitraum</div>
        <div class="info-value">
          ${new Date(unitResult.nutzungszeitraum_von).toLocaleDateString('de-DE')} - 
          ${new Date(unitResult.nutzungszeitraum_bis).toLocaleDateString('de-DE')}
          <span class="highlight">(${unitResult.nutzungstage} Tage)</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Kostenaufstellung -->
  <div class="section">
    <div class="section-title">Kostenaufstellung</div>
    <table>
      <thead>
        <tr>
          <th>Position</th>
          <th>Verteilschlüssel</th>
          <th style="text-align: right;">Ihr Anteil</th>
        </tr>
      </thead>
      <tbody>
        ${costDetails.map(detail => `
          <tr>
            <td>${detail.category || 'Position'}</td>
            <td>${detail.distribution_key || '-'}</td>
            <td style="text-align: right;">${detail.betrag_anteil?.toFixed(2) || '0.00'} €</td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <td colspan="2"><strong>Summe Betriebskosten</strong></td>
          <td style="text-align: right;"><strong>${unitResult.kosten_anteil_gesamt?.toFixed(2) || '0.00'} €</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Vorauszahlungen -->
  <div class="section">
    <div class="section-title">Vorauszahlungen</div>
    <table>
      <tbody>
        <tr>
          <td>Gezahlte Vorauszahlungen im Abrechnungszeitraum</td>
          <td style="text-align: right; font-weight: 600;">${unitResult.vorauszahlungen_gesamt?.toFixed(2) || '0.00'} €</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Ergebnis -->
  <div class="result-box">
    <div class="result-label">${unitResult.ergebnis >= 0 ? 'Nachzahlung' : 'Guthaben'}</div>
    <div class="result-amount">${Math.abs(unitResult.ergebnis).toFixed(2)} €</div>
    ${unitResult.ergebnis > 0 ? `
      <div style="margin-top: 15px; font-size: 10pt; color: #64748B;">
        Bitte überweisen Sie den Betrag bis zum ${unitResult.zahlungsfrist ? new Date(unitResult.zahlungsfrist).toLocaleDateString('de-DE') : 'auf der Rechnung angegebenen Datum'}.
      </div>
    ` : ''}
  </div>

  <!-- Rechtliche Hinweise -->
  <div class="section">
    <div class="section-title">Rechtliche Hinweise</div>
    <p style="font-size: 9pt; line-height: 1.5; color: #475569;">
      Diese Abrechnung wurde gemäß § 556 BGB und der Betriebskostenverordnung (BetrKV) erstellt.
      Einwendungen gegen diese Abrechnung können innerhalb von 12 Monaten nach Zugang geltend gemacht werden.
      Die Abrechnung basiert auf den tatsächlich angefallenen Kosten im Abrechnungszeitraum.
    </p>
  </div>

  <div class="footer">
    <p><strong>${building.name}</strong> • ${building.address} • ${building.postal_code} ${building.city}</p>
    <p style="margin-top: 5px;">Erstellt am ${new Date().toLocaleDateString('de-DE')} mit FinTuttO Nebenkostenabrechnung</p>
  </div>
</body>
</html>
    `;

    // PDF mit jsPDF generieren
    const { jsPDF } = await import('npm:jspdf@2.5.2');
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(`Betriebskostenabrechnung ${statement.abrechnungsjahr}`, 20, 20);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(building.name, 20, 30);

    // Empfänger
    let y = 45;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Empfänger:', 20, y);
    y += 6;
    doc.setFont(undefined, 'normal');
    if (tenant) {
      doc.text(`${tenant.anrede || ''} ${tenant.first_name} ${tenant.last_name}`, 20, y);
      y += 5;
    }
    doc.text(`${unit.unit_number} • ${unit.wohnflaeche_qm} m²`, 20, y);

    // Zeitraum
    y += 15;
    doc.setFont(undefined, 'bold');
    doc.text('Abrechnungszeitraum:', 20, y);
    y += 6;
    doc.setFont(undefined, 'normal');
    doc.text(`${new Date(statement.zeitraum_von).toLocaleDateString('de-DE')} - ${new Date(statement.zeitraum_bis).toLocaleDateString('de-DE')}`, 20, y);

    // Kostenaufstellung
    y += 15;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Kostenaufstellung', 20, y);
    y += 8;

    // Tabelle
    doc.setFontSize(9);
    costDetails.forEach(detail => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFont(undefined, 'normal');
      doc.text(detail.category || 'Position', 20, y);
      doc.text(`${detail.betrag_anteil?.toFixed(2) || '0.00'} €`, 180, y, { align: 'right' });
      y += 6;
    });

    // Summe
    y += 5;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('Summe Betriebskosten:', 20, y);
    doc.text(`${unitResult.kosten_anteil_gesamt?.toFixed(2) || '0.00'} €`, 180, y, { align: 'right' });
    
    y += 10;
    doc.setFont(undefined, 'normal');
    doc.text('Gezahlte Vorauszahlungen:', 20, y);
    doc.text(`${unitResult.vorauszahlungen_gesamt?.toFixed(2) || '0.00'} €`, 180, y, { align: 'right' });

    // Ergebnis
    y += 15;
    doc.setFillColor(unitResult.ergebnis >= 0 ? 254, 242, 242 : 240, 253, 244);
    doc.rect(15, y - 5, 180, 20, 'F');
    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text(unitResult.ergebnis >= 0 ? 'Nachzahlung:' : 'Guthaben:', 20, y + 5);
    doc.text(`${Math.abs(unitResult.ergebnis).toFixed(2)} €`, 180, y + 5, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`Erstellt am ${new Date().toLocaleDateString('de-DE')} mit FinTuttO Nebenkostenabrechnung`, 105, 285, { align: 'center' });

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=NK-Abrechnung-${statement.abrechnungsjahr}-${unit.unit_number}.pdf`
      }
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});