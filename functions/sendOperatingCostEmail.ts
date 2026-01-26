import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Versendet die Nebenkostenabrechnung per Email an einen oder alle Mieter
 * 
 * Input:
 * - statementId: string
 * - unitResultIds: array of string (optional, wenn leer = alle)
 * - sendToAll: boolean
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { statementId, unitResultIds, sendToAll } = await req.json();

    // 1. Statement und Building laden
    const statement = await base44.entities.OperatingCostStatement.get(statementId);
    const building = await base44.entities.Building.get(statement.building_id);

    // 2. Unit Results laden
    const allResults = await base44.entities.OperatingCostUnitResult.filter({
      statement_id: statementId
    });

    const resultsToSend = sendToAll 
      ? allResults 
      : allResults.filter(r => unitResultIds?.includes(r.id));

    // 3. Für jeden Mieter PDF generieren und Email senden
    const sentEmails = [];
    const errors = [];

    for (const result of resultsToSend) {
      // Leerstände überspringen
      if (!result.tenant_id) continue;

      const tenant = await base44.entities.Tenant.get(result.tenant_id);
      const unit = await base44.entities.Unit.get(result.unit_id);

      // PDF für diesen Mieter generieren
      const pdfResult = await base44.asServiceRole.functions.invoke('exportOperatingCostsPDF', {
        statement_id: statementId,
        unit_result_id: result.id
      });

      if (!pdfResult.data?.pdf_url) {
        errors.push({ tenantId: tenant.id, error: 'PDF-Generierung fehlgeschlagen' });
        continue;
      }

      // Email-Text erstellen
      const emailBody = `
Sehr geehrte${tenant.anrede === 'Frau' ? '' : 'r'} ${tenant.anrede} ${tenant.last_name},

anbei erhalten Sie die Betriebskostenabrechnung für das Jahr ${statement.abrechnungsjahr}.

Objekt: ${building.name}, ${building.address}
Wohnung: ${unit.unit_number}
Abrechnungszeitraum: ${new Date(statement.zeitraum_von).toLocaleDateString('de-DE')} - ${new Date(statement.zeitraum_bis).toLocaleDateString('de-DE')}

Ergebnis:
- Betriebskosten gesamt: ${result.kosten_anteil_gesamt?.toFixed(2)} €
- Gezahlte Vorauszahlungen: ${result.vorauszahlungen_gesamt?.toFixed(2)} €
- ${result.ergebnis >= 0 ? 'Nachzahlung' : 'Guthaben'}: ${Math.abs(result.ergebnis).toFixed(2)} €

Die detaillierte Abrechnung finden Sie im Anhang.

${result.ergebnis > 0 ? `Bitte überweisen Sie den Nachzahlungsbetrag bis zum ${result.zahlungsfrist ? new Date(result.zahlungsfrist).toLocaleDateString('de-DE') : 'auf Rechnung genannten Datum'}.` : ''}

Mit freundlichen Grüßen
Ihre Hausverwaltung

---
Diese Email wurde automatisch über FinTuttO Nebenkostenabrechnung erstellt.
      `;

      // Email senden
      try {
        await base44.integrations.Core.SendEmail({
          to: tenant.email,
          subject: `Betriebskostenabrechnung ${statement.abrechnungsjahr} - ${building.name}`,
          body: emailBody
        });

        // Unit Result aktualisieren
        await base44.entities.OperatingCostUnitResult.update(result.id, {
          status: 'Gesendet',
          dokument_url: pdfResult.data.pdf_url
        });

        sentEmails.push({
          tenantId: tenant.id,
          tenantName: `${tenant.first_name} ${tenant.last_name}`,
          email: tenant.email,
          unitNumber: unit.unit_number
        });

      } catch (emailError) {
        console.error('Email send error:', emailError);
        errors.push({ 
          tenantId: tenant.id, 
          tenantName: `${tenant.first_name} ${tenant.last_name}`,
          error: emailError.message 
        });
      }
    }

    // 4. Statement-Status aktualisieren
    if (sendToAll && errors.length === 0) {
      await base44.entities.OperatingCostStatement.update(statementId, {
        status: 'Versendet',
        versand_datum: new Date().toISOString().split('T')[0]
      });
    }

    return Response.json({
      success: true,
      sent: sentEmails.length,
      errors: errors.length,
      sentEmails,
      failedEmails: errors
    });

  } catch (error) {
    console.error('Error sending emails:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});