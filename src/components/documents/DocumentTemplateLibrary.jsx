// Vordefinierte HTML-Templates für alle 15 Dokumenttypen
// Diese können in der DocumentTemplate-Entität gespeichert und angepasst werden

export const DOCUMENT_TEMPLATES = {
  mietvertrag: `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ccc;">
      <h1 style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px;">MIETVERTRAG</h1>
      <div style="margin-top: 30px;">
        <p><strong>Vermieter:</strong> {{landlord_name}}, {{landlord_address}}</p>
        <p><strong>Mieter:</strong> {{tenant_first_name}} {{tenant_last_name}}, {{tenant_address}}</p>
        <p><strong>Mietobjekt:</strong> {{unit_number}}, {{building_address}}</p>
        <p><strong>Wohnfläche:</strong> {{sqm}} m²</p>
        <p><strong>Mietbeginn:</strong> {{start_date}}</p>
        <p><strong>Kaltmiete:</strong> {{base_rent}} EUR</p>
        <p><strong>Nebenkosten:</strong> {{utilities}} EUR</p>
        <p><strong>Warmmiete:</strong> {{total_rent}} EUR</p>
        <p><strong>Kaution:</strong> {{deposit}} EUR</p>
        <hr>
        <h3>Vereinbarte Bedingungen</h3>
        <p>{{custom_terms}}</p>
      </div>
      <div style="margin-top: 50px;">
        <p>____________________ ____________________</p>
        <p>Vermieter                Mieter</p>
      </div>
    </div>
  `,

  uebergabeprotokoll_einzug: `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ccc;">
      <h1 style="text-align: center;">ÜBERGABEPROTOKOLL (EINZUG)</h1>
      <p><strong>Datum:</strong> {{date}}</p>
      <p><strong>Mieter:</strong> {{tenant_first_name}} {{tenant_last_name}}</p>
      <p><strong>Wohnung:</strong> {{unit_number}}</p>
      <p><strong>Gebäude:</strong> {{building_address}}</p>
      
      <h3>Zählerstände bei Einzug:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #000;">
          <th style="text-align: left;">Zähler</th>
          <th style="text-align: left;">Stand</th>
          <th style="text-align: left;">Datum</th>
        </tr>
        <tr style="border-bottom: 1px solid #ccc;">
          <td>Wasser</td>
          <td>{{water_meter}}</td>
          <td>{{meter_date}}</td>
        </tr>
        <tr style="border-bottom: 1px solid #ccc;">
          <td>Strom</td>
          <td>{{electricity_meter}}</td>
          <td>{{meter_date}}</td>
        </tr>
        <tr style="border-bottom: 1px solid #ccc;">
          <td>Gas</td>
          <td>{{gas_meter}}</td>
          <td>{{meter_date}}</td>
        </tr>
      </table>

      <h3>Wohnungszustand:</h3>
      <p>{{condition_notes}}</p>

      <h3>Übergebene Schlüssel:</h3>
      <p>Anzahl: {{keys_count}}</p>

      <div style="margin-top: 50px;">
        <p>____________________ ____________________</p>
        <p>Vermieter                Mieter</p>
      </div>
    </div>
  `,

  sepa_mandat: `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ccc;">
      <h1>SEPA-LASTSCHRIFTMANDAT</h1>
      <p><strong>Gläubiger:</strong> {{creditor_name}}</p>
      <p><strong>Gläubiger-ID:</strong> {{creditor_id}}</p>
      
      <p>Hiermit bevollmächtige ich {{creditor_name}}, Zahlungen auf mein Konto mittels Lastschrift einzuziehen.</p>
      
      <p><strong>Kontoinhaber:</strong> {{tenant_first_name}} {{tenant_last_name}}</p>
      <p><strong>IBAN:</strong> {{iban}}</p>
      <p><strong>BIC:</strong> {{bic}}</p>

      <p>Ich werde mein Kreditinstitut von diesem Mandat unverzüglich in Kenntnis setzen.</p>

      <div style="margin-top: 50px;">
        <p>____________________ ____________________</p>
        <p>Ort, Datum              Unterschrift</p>
      </div>
    </div>
  `,

  mahnung: `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ccc;">
      <h1 style="color: red;">{{mahnung_stufe}}. MAHNUNG</h1>
      <p><strong>Datum:</strong> {{date}}</p>
      <p><strong>An:</strong> {{tenant_first_name}} {{tenant_last_name}}, {{tenant_address}}</p>
      
      <p>Sehr geehrte/r {{tenant_last_name}},</p>
      
      <p>trotz Zahlungsaufforderung vom {{original_due_date}} haben Sie die Mietzahlung in Höhe von <strong>{{amount}} EUR</strong> noch nicht geleistet.</p>
      
      <p>Hiermit fordern wir Sie auf, den ausstehenden Betrag innerhalb von <strong>7 Tagen</strong> ab Zugang dieses Schreibens zu zahlen.</p>
      
      <p>Sollten wir die Zahlung bis dahin nicht erhalten, werden wir Rechtsmaßnahmen einleiten.</p>

      <p>Mit freundlichen Grüßen</p>
      <p>{{landlord_name}}</p>
    </div>
  `,

  kuendigung: `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ccc;">
      <h1 style="color: red;">KÜNDIGUNG DES MIETVERTRAGES</h1>
      <p><strong>Sehr geehrte/r {{tenant_last_name}},</strong></p>
      
      <p>hiermit kündigen wir das Mietverhältnis für die Wohnung {{unit_number}} in {{building_address}}</p>
      
      <p><strong>zum {{termination_date}}</strong></p>
      
      {{#if is_extraordinary}}
        <p style="color: red;"><strong>fristlos / außerordentlich</strong></p>
      {{else}}
        <p><strong>zum nächstmöglichen gesetzlichen Termin</strong></p>
      {{/if}}

      <p>Grund der Kündigung: {{termination_reason}}</p>

      <p>Wir ersuchen Sie, die Wohnung bis zum {{move_out_date}} zu räumen und die Schlüssel zurückzugeben.</p>

      <p>Mit freundlichen Grüßen</p>
      <p>{{landlord_name}}</p>

      <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #000;">
        <p><strong>Bestätigung des Mieters:</strong></p>
        <p>Diese Kündigung wurde mir am _______________  übergeben/zugestellt.</p>
        <p>____________________ ____________________</p>
        <p>Ort, Datum              Unterschrift Mieter</p>
      </div>
    </div>
  `,

  betriebskostenabrechnung: `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ccc;">
      <h1>BETRIEBSKOSTENABRECHNUNG</h1>
      <p><strong>Für den Abrechnungszeitraum:</strong> {{abrechnungsjahr}}</p>
      <p><strong>Mieter:</strong> {{tenant_first_name}} {{tenant_last_name}}</p>
      <p><strong>Wohnung:</strong> {{unit_number}}</p>

      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <tr style="background-color: #f0f0f0; border-bottom: 2px solid #000;">
          <th style="text-align: left; padding: 8px;">Kostenart</th>
          <th style="text-align: right; padding: 8px;">Betrag</th>
        </tr>
        {{#each costs}}
        <tr style="border-bottom: 1px solid #ccc;">
          <td style="padding: 8px;">{{this.description}}</td>
          <td style="text-align: right; padding: 8px;">{{this.amount}} EUR</td>
        </tr>
        {{/each}}
        <tr style="background-color: #f0f0f0; border-top: 2px solid #000;">
          <td style="padding: 8px;"><strong>Gesamtbetrag</strong></td>
          <td style="text-align: right; padding: 8px;"><strong>{{total_amount}} EUR</strong></td>
        </tr>
      </table>

      <p style="margin-top: 20px;"><strong>Geleistete Vorauszahlungen:</strong> {{advance_payments}} EUR</p>
      <p><strong>Zu zahlen / Guthaben:</strong> {{balance}} EUR</p>
    </div>
  `,

  mieterhoehung: `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ccc;">
      <h1>MIETERHÖHUNGSVERLANGEN</h1>
      <p><strong>Sehr geehrte/r {{tenant_last_name}},</strong></p>
      
      <p>hiermit teilen wir Ihnen mit, dass wir die Miete für Ihre Wohnung erhöhen.</p>
      
      <p><strong>Wohnung:</strong> {{unit_number}}</p>
      <p><strong>Neue Miete ab {{effective_date}}:</strong> {{new_rent}} EUR</p>
      <p><strong>Alte Miete:</strong> {{old_rent}} EUR</p>
      <p><strong>Erhöhung:</strong> {{increase_amount}} EUR ({{increase_percent}}%)</p>

      <p>Diese Erhöhung erfolgt gemäß {{legal_basis}}.</p>

      <p>Sollten Sie Einwände haben, müssen diese innerhalb von 2 Monaten schriftlich eingehen.</p>

      <p>Mit freundlichen Grüßen</p>
      <p>{{landlord_name}}</p>
    </div>
  `,

  schadensanzeige: `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ccc;">
      <h1>SCHADENSMELDUNG / MÄNGELANZEIGE</h1>
      <p><strong>Datum:</strong> {{date}}</p>
      <p><strong>Gemeldeter Schaden in:</strong> {{unit_number}}</p>
      <p><strong>Gemeldet von:</strong> {{reported_by}}</p>

      <h3>Schadenbeschreibung:</h3>
      <p>{{damage_description}}</p>

      <h3>Betroffene Bereiche:</h3>
      <p>{{affected_areas}}</p>

      <h3>Fotos/Dokumente:</h3>
      <p>{{attachment_info}}</p>

      <h3>Auswirkungen:</h3>
      <p>{{impact_assessment}}</p>

      <p><strong>Dringlichkeit:</strong> {{urgency}}</p>

      <div style="margin-top: 50px;">
        <p>____________________ ____________________</p>
        <p>Melder                Bestätigung Verwalter</p>
      </div>
    </div>
  `
};

export const getTemplate = (documentType) => {
  return DOCUMENT_TEMPLATES[documentType] || null;
};