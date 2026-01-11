import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const templates = [
      // Priority 1: Kern-Mietdokumente
      {
        document_type: 'mietvertrag',
        template_html: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1>MIETVERTRAG FÜR WOHNRAUM</h1>
          <p><strong>Zwischen {{landlord_name}} (Vermietende Partei)</strong></p>
          <p><strong>und {{tenant_first_name}} {{tenant_last_name}} (Mietende Partei)</strong></p>
          <h2>1. Mietobjekt</h2>
          <p>Adresse: {{property_address}}, {{property_postal_code}} {{property_city}}</p>
          <p>Fläche: {{property_sqm}} m²</p>
          <h2>2. Mietdauer</h2>
          <p>Mietbeginn: {{contract_start_date}}</p>
          <p>Mietende: {{contract_end_date}}</p>
          <h2>3. Miete</h2>
          <p>Kaltmiete: {{base_rent}} EUR</p>
          <p>Nebenkosten: {{utilities}} EUR</p>
          <p>Gesamtmiete: {{total_rent}} EUR</p>
          <h2>4. Kaution</h2>
          <p>Kaution: {{deposit}} EUR</p>
        </div>`,
        template_fields: [
          { id: 'landlord_name', name: 'landlord_name', type: 'text', required: true },
          { id: 'tenant_first_name', name: 'tenant_first_name', type: 'text', required: true },
          { id: 'tenant_last_name', name: 'tenant_last_name', type: 'text', required: true },
          { id: 'property_address', name: 'property_address', type: 'text', required: true },
          { id: 'property_postal_code', name: 'property_postal_code', type: 'text', required: true },
          { id: 'property_city', name: 'property_city', type: 'text', required: true },
          { id: 'property_sqm', name: 'property_sqm', type: 'number', required: true },
          { id: 'contract_start_date', name: 'contract_start_date', type: 'date', required: true },
          { id: 'contract_end_date', name: 'contract_end_date', type: 'date', required: false },
          { id: 'base_rent', name: 'base_rent', type: 'currency', required: true },
          { id: 'utilities', name: 'utilities', type: 'currency', required: false },
          { id: 'total_rent', name: 'total_rent', type: 'currency', required: true },
          { id: 'deposit', name: 'deposit', type: 'currency', required: true }
        ],
        description: 'Standardmietvertrag für Wohnraum'
      },
      {
        document_type: 'uebergabeprotokoll_einzug',
        template_html: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1>ÜBERGABEPROTOKOLL EINZUG</h1>
          <p>Wohnung: {{property_address}}</p>
          <p>Übergabedatum: {{handover_date}}</p>
          <h2>Zustand der Wohnung</h2>
          <p>{{condition_notes}}</p>
          <h2>Zähler</h2>
          <p>Stromzähler: {{electricity_meter}}</p>
          <p>Wasserzähler: {{water_meter}}</p>
          <p>Gaszähler: {{gas_meter}}</p>
          <h2>Schlüssel</h2>
          <p>Anzahl übergebener Schlüssel: {{keys_count}}</p>
          <h2>Unterschriften</h2>
          <p>Vermieter: _________________ Datum: _______</p>
          <p>Mieter: _________________ Datum: _______</p>
        </div>`,
        template_fields: [
          { id: 'property_address', name: 'property_address', type: 'text', required: true },
          { id: 'handover_date', name: 'handover_date', type: 'date', required: true },
          { id: 'condition_notes', name: 'condition_notes', type: 'textarea', required: false },
          { id: 'electricity_meter', name: 'electricity_meter', type: 'text', required: false },
          { id: 'water_meter', name: 'water_meter', type: 'text', required: false },
          { id: 'gas_meter', name: 'gas_meter', type: 'text', required: false },
          { id: 'keys_count', name: 'keys_count', type: 'number', required: false }
        ],
        description: 'Protokoll bei Mietbeginn'
      },
      {
        document_type: 'uebergabeprotokoll_auszug',
        template_html: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1>ÜBERGABEPROTOKOLL AUSZUG</h1>
          <p>Wohnung: {{property_address}}</p>
          <p>Auszugsdatum: {{moveout_date}}</p>
          <h2>Zustand der Wohnung</h2>
          <p>{{condition_notes}}</p>
          <h2>Schäden/Mängel</h2>
          <p>{{damages_notes}}</p>
          <h2>Schlüssel</h2>
          <p>Zurückgegebene Schlüssel: {{keys_returned}}</p>
          <h2>Reinigung</h2>
          <p>Zustand: {{cleaning_status}}</p>
        </div>`,
        template_fields: [
          { id: 'property_address', name: 'property_address', type: 'text', required: true },
          { id: 'moveout_date', name: 'moveout_date', type: 'date', required: true },
          { id: 'condition_notes', name: 'condition_notes', type: 'textarea', required: false },
          { id: 'damages_notes', name: 'damages_notes', type: 'textarea', required: false },
          { id: 'keys_returned', name: 'keys_returned', type: 'number', required: false },
          { id: 'cleaning_status', name: 'cleaning_status', type: 'text', required: false }
        ],
        description: 'Protokoll bei Mietende'
      },
      {
        document_type: 'mietangebot',
        template_html: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1>MIETANGEBOT</h1>
          <p>An: {{applicant_name}}</p>
          <p>Datum: {{offer_date}}</p>
          <h2>Angebotsobjekt</h2>
          <p>{{property_address}}, {{property_postal_code}} {{property_city}}</p>
          <h2>Bedingungen</h2>
          <p>Monatliche Miete: {{monthly_rent}} EUR</p>
          <p>Nebenkosten: {{utilities}} EUR</p>
          <p>Kaution: {{deposit}} EUR</p>
          <p>Angebotsgültig bis: {{offer_expiry}}</p>
          <p>Vermietender: _________________ Datum: _______</p>
        </div>`,
        template_fields: [
          { id: 'applicant_name', name: 'applicant_name', type: 'text', required: true },
          { id: 'offer_date', name: 'offer_date', type: 'date', required: true },
          { id: 'property_address', name: 'property_address', type: 'text', required: true },
          { id: 'property_postal_code', name: 'property_postal_code', type: 'text', required: true },
          { id: 'property_city', name: 'property_city', type: 'text', required: true },
          { id: 'monthly_rent', name: 'monthly_rent', type: 'currency', required: true },
          { id: 'utilities', name: 'utilities', type: 'currency', required: false },
          { id: 'deposit', name: 'deposit', type: 'currency', required: true },
          { id: 'offer_expiry', name: 'offer_expiry', type: 'date', required: true }
        ],
        description: 'Angebot für Mietverhältnis'
      },
      {
        document_type: 'sepa_mandat',
        template_html: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1>SEPA-LASTSCHRIFTMANDAT</h1>
          <p>Gläubiger: {{landlord_name}}</p>
          <p>Mandatsverweis: {{mandate_reference}}</p>
          <h2>Kontoinhaber</h2>
          <p>Name: {{tenant_name}}</p>
          <p>IBAN: {{iban}}</p>
          <p>BIC: {{bic}}</p>
          <h2>Mandate</h2>
          <p>Ich bevollmächtige den Gläubiger, Zahlungen von meinem Konto mittels Lastschrift einzuziehen.</p>
          <p>Unterschrift: _________________ Datum: _______</p>
        </div>`,
        template_fields: [
          { id: 'landlord_name', name: 'landlord_name', type: 'text', required: true },
          { id: 'mandate_reference', name: 'mandate_reference', type: 'text', required: true },
          { id: 'tenant_name', name: 'tenant_name', type: 'text', required: true },
          { id: 'iban', name: 'iban', type: 'text', required: true },
          { id: 'bic', name: 'bic', type: 'text', required: false }
        ],
        description: 'SEPA-Lastschrift für automatische Mietzahlung'
      },
      {
        document_type: 'zahlungserinnerung',
        template_html: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1>ZAHLUNGSERINNERUNG</h1>
          <p>An: {{tenant_name}}</p>
          <p>Datum: {{reminder_date}}</p>
          <h2>Offene Forderung</h2>
          <p>Miete für {{period}}: {{amount}} EUR</p>
          <p>Fälligkeitsdatum: {{due_date}}</p>
          <p>Zahlungsart: {{payment_method}}</p>
          <p>Kontoverbindung: {{bank_details}}</p>
          <p>Bitte leisten Sie die Zahlung bis {{payment_deadline}}.</p>
        </div>`,
        template_fields: [
          { id: 'tenant_name', name: 'tenant_name', type: 'text', required: true },
          { id: 'reminder_date', name: 'reminder_date', type: 'date', required: true },
          { id: 'period', name: 'period', type: 'text', required: true },
          { id: 'amount', name: 'amount', type: 'currency', required: true },
          { id: 'due_date', name: 'due_date', type: 'date', required: true },
          { id: 'payment_method', name: 'payment_method', type: 'text', required: false },
          { id: 'bank_details', name: 'bank_details', type: 'text', required: false },
          { id: 'payment_deadline', name: 'payment_deadline', type: 'date', required: true }
        ],
        description: 'Freundliche Zahlungserinnerung'
      },
      {
        document_type: 'mahnung',
        template_html: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1>MAHNUNG {{mahnung_level}}. STUFE</h1>
          <p>An: {{tenant_name}}</p>
          <p>Mahndatum: {{mahnung_date}}</p>
          <h2>Offene Forderung</h2>
          <p>Miete für {{period}}: {{amount}} EUR</p>
          <p>Fälligkeitsdatum: {{due_date}}</p>
          <h2>Mahnung</h2>
          <p>Trotz Zahlungserinnerung wurde die Miete nicht bezahlt. Wir fordern Sie auf, die Zahlung bis {{payment_deadline}} zu leisten.</p>
          {{#if_mahnung_3}}<p><strong>Sollte die Zahlung nicht erfolgen, werden wir rechtliche Schritte einleiten.</strong></p>{{/if_mahnung_3}}
        </div>`,
        template_fields: [
          { id: 'tenant_name', name: 'tenant_name', type: 'text', required: true },
          { id: 'mahnung_date', name: 'mahnung_date', type: 'date', required: true },
          { id: 'mahnung_level', name: 'mahnung_level', type: 'text', required: true },
          { id: 'period', name: 'period', type: 'text', required: true },
          { id: 'amount', name: 'amount', type: 'currency', required: true },
          { id: 'due_date', name: 'due_date', type: 'date', required: true },
          { id: 'payment_deadline', name: 'payment_deadline', type: 'date', required: true }
        ],
        description: 'Mahnung (Stufe 1-3) bei Zahlungsverzug'
      },
      {
        document_type: 'abmahnung',
        template_html: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1>ABMAHNUNG</h1>
          <p>An: {{tenant_name}}</p>
          <p>Abmahndatum: {{abmahnung_date}}</p>
          <h2>Grund der Abmahnung</h2>
          <p>{{violation_description}}</p>
          <h2>Fristsetzung</h2>
          <p>Wir setzen Ihnen eine Frist bis {{deadline}} zur Abhilfe.</p>
          <p>Bei Nichterfüllung werden wir rechtliche Schritte einleiten.</p>
          <p>Vermietender: _________________ Datum: _______</p>
        </div>`,
        template_fields: [
          { id: 'tenant_name', name: 'tenant_name', type: 'text', required: true },
          { id: 'abmahnung_date', name: 'abmahnung_date', type: 'date', required: true },
          { id: 'violation_description', name: 'violation_description', type: 'textarea', required: true },
          { id: 'deadline', name: 'deadline', type: 'date', required: true }
        ],
        description: 'Abmahnung bei Vertragsverletzungen'
      },
      {
        document_type: 'kuendigung',
        template_html: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1>KÜNDIGUNGSMITTEILUNG</h1>
          <p>An: {{tenant_name}}</p>
          <p>Kündigungsdatum: {{termination_date}}</p>
          <p>Art der Kündigung: {{termination_type}}</p>
          <h2>Mietverhältnis</h2>
          <p>Adresse: {{property_address}}</p>
          <p>Kündigungsfrist: {{notice_period}} Monate</p>
          <p>Wirksamer Kündigungstermin: {{effective_date}}</p>
          <h2>Kündigungsgrund</h2>
          <p>{{termination_reason}}</p>
          <p>Vermietender: _________________ Datum: _______</p>
        </div>`,
        template_fields: [
          { id: 'tenant_name', name: 'tenant_name', type: 'text', required: true },
          { id: 'termination_date', name: 'termination_date', type: 'date', required: true },
          { id: 'termination_type', name: 'termination_type', type: 'text', required: true },
          { id: 'property_address', name: 'property_address', type: 'text', required: true },
          { id: 'notice_period', name: 'notice_period', type: 'number', required: true },
          { id: 'effective_date', name: 'effective_date', type: 'date', required: true },
          { id: 'termination_reason', name: 'termination_reason', type: 'textarea', required: false }
        ],
        description: 'Kündigungsmitteilung (ordentlich/fristlos)'
      },
      {
        document_type: 'betriebskostenabrechnung',
        template_html: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1>BETRIEBSKOSTENABRECHNUNG</h1>
          <p>Objekt: {{property_address}}</p>
          <p>Abrechnungszeitraum: {{start_date}} - {{end_date}}</p>
          <h2>Umlagefähige Nebenkosten</h2>
          <table style="width:100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #ddd;">
              <td><strong>Kostenart</strong></td>
              <td style="text-align: right;"><strong>Betrag (EUR)</strong></td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td>Heizung/Warmwasser</td>
              <td style="text-align: right;">{{heating_costs}}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td>Wasser/Abwasser</td>
              <td style="text-align: right;">{{water_costs}}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td>Müllabfuhr</td>
              <td style="text-align: right;">{{waste_costs}}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td><strong>GESAMT</strong></td>
              <td style="text-align: right;"><strong>{{total_costs}}</strong></td>
            </tr>
          </table>
          <h2>Ihr Anteil</h2>
          <p>Gezahlte Vorauszahlungen: {{paid_advances}}</p>
          <p>Nachzahlung/Rückerstattung: {{balance}}</p>
        </div>`,
        template_fields: [
          { id: 'property_address', name: 'property_address', type: 'text', required: true },
          { id: 'start_date', name: 'start_date', type: 'date', required: true },
          { id: 'end_date', name: 'end_date', type: 'date', required: true },
          { id: 'heating_costs', name: 'heating_costs', type: 'currency', required: false },
          { id: 'water_costs', name: 'water_costs', type: 'currency', required: false },
          { id: 'waste_costs', name: 'waste_costs', type: 'currency', required: false },
          { id: 'total_costs', name: 'total_costs', type: 'currency', required: true },
          { id: 'paid_advances', name: 'paid_advances', type: 'currency', required: true },
          { id: 'balance', name: 'balance', type: 'currency', required: true }
        ],
        description: 'Jahresabrechnung Betriebskosten'
      },
      {
        document_type: 'mieterhoehung',
        template_html: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1>MIETERHÖHUNGSVERLANGEN</h1>
          <p>An: {{tenant_name}}</p>
          <p>Datum: {{notice_date}}</p>
          <h2>Aktuelle Miete</h2>
          <p>Bisherige Kaltmiete: {{current_rent}} EUR</p>
          <h2>Neue Miete</h2>
          <p>Neue Kaltmiete: {{new_rent}} EUR</p>
          <p>Steigerung: {{increase_amount}} EUR ({{increase_percentage}}%)</p>
          <p>Wirksam ab: {{effective_date}}</p>
          <h2>Begründung</h2>
          <p>{{reason}}</p>
          <p>Vermietender: _________________ Datum: _______</p>
        </div>`,
        template_fields: [
          { id: 'tenant_name', name: 'tenant_name', type: 'text', required: true },
          { id: 'notice_date', name: 'notice_date', type: 'date', required: true },
          { id: 'current_rent', name: 'current_rent', type: 'currency', required: true },
          { id: 'new_rent', name: 'new_rent', type: 'currency', required: true },
          { id: 'increase_amount', name: 'increase_amount', type: 'currency', required: false },
          { id: 'increase_percentage', name: 'increase_percentage', type: 'number', required: false },
          { id: 'effective_date', name: 'effective_date', type: 'date', required: true },
          { id: 'reason', name: 'reason', type: 'textarea', required: false }
        ],
        description: 'Mieterhöhungsverlangen'
      },
      {
        document_type: 'wohnungsgeberbestaetigung',
        template_html: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1>WOHNUNGSGEBERBESCHEINIGUNG</h1>
          <p>gemäß §21 Abs. 3 S. 1 MStättV</p>
          <h2>Wohnungsinhaber/Wohnungsgeber</h2>
          <p>Name: {{landlord_name}}</p>
          <p>Adresse: {{landlord_address}}</p>
          <h2>Mieterin/Mieter</h2>
          <p>Name: {{tenant_name}}</p>
          <p>Geburtsdatum: {{tenant_dob}}</p>
          <h2>Wohnungsadresse</h2>
          <p>{{property_address}}</p>
          <h2>Mietverhältnis</h2>
          <p>Mietbeginn: {{move_in_date}}</p>
          <p>Anzahl Räume: {{room_count}}</p>
          <p>Wohnfläche: {{sqm}} m²</p>
          <p>Vermietender: _________________ Datum: _______</p>
        </div>`,
        template_fields: [
          { id: 'landlord_name', name: 'landlord_name', type: 'text', required: true },
          { id: 'landlord_address', name: 'landlord_address', type: 'text', required: true },
          { id: 'tenant_name', name: 'tenant_name', type: 'text', required: true },
          { id: 'tenant_dob', name: 'tenant_dob', type: 'date', required: true },
          { id: 'property_address', name: 'property_address', type: 'text', required: true },
          { id: 'move_in_date', name: 'move_in_date', type: 'date', required: true },
          { id: 'room_count', name: 'room_count', type: 'number', required: false },
          { id: 'sqm', name: 'sqm', type: 'number', required: false }
        ],
        description: 'Wohnungsgeberbescheinigung für Anmeldung'
      },
      {
        document_type: 'schadensanzeige',
        template_html: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1>SCHADENSANZEIGE / MÄNGELANZEIGE</h1>
          <p>Mieter: {{tenant_name}}</p>
          <p>Meldedatum: {{report_date}}</p>
          <p>Objekt: {{property_address}}</p>
          <h2>Schadenbeschreibung</h2>
          <p>{{damage_description}}</p>
          <h2>Schadensumfang</h2>
          <p>Bereich: {{damage_location}}</p>
          <p>Geschätzter Schadenwert: {{damage_value}} EUR</p>
          <h2>Ursache</h2>
          <p>{{damage_cause}}</p>
          <p>Mieter: _________________ Datum: _______</p>
        </div>`,
        template_fields: [
          { id: 'tenant_name', name: 'tenant_name', type: 'text', required: true },
          { id: 'report_date', name: 'report_date', type: 'date', required: true },
          { id: 'property_address', name: 'property_address', type: 'text', required: true },
          { id: 'damage_description', name: 'damage_description', type: 'textarea', required: true },
          { id: 'damage_location', name: 'damage_location', type: 'text', required: true },
          { id: 'damage_value', name: 'damage_value', type: 'currency', required: false },
          { id: 'damage_cause', name: 'damage_cause', type: 'textarea', required: false }
        ],
        description: 'Schadensanzeige / Mängelanzeige'
      },
      {
        document_type: 'auftragserteilung',
        template_html: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1>AUFTRAGSERTEILUNG</h1>
          <p>An: {{contractor_name}}</p>
          <p>Auftragsdatum: {{order_date}}</p>
          <h2>Leistungsbeschreibung</h2>
          <p>{{service_description}}</p>
          <h2>Einsatzort</h2>
          <p>{{property_address}}</p>
          <h2>Vereinbarung</h2>
          <p>Vereinbartes Honorar: {{price}} EUR</p>
          <p>Termin: {{due_date}}</p>
          <p>Material: {{materials_included}}</p>
          <p>Auftraggeber: _________________ Datum: _______</p>
        </div>`,
        template_fields: [
          { id: 'contractor_name', name: 'contractor_name', type: 'text', required: true },
          { id: 'order_date', name: 'order_date', type: 'date', required: true },
          { id: 'service_description', name: 'service_description', type: 'textarea', required: true },
          { id: 'property_address', name: 'property_address', type: 'text', required: true },
          { id: 'price', name: 'price', type: 'currency', required: true },
          { id: 'due_date', name: 'due_date', type: 'date', required: false },
          { id: 'materials_included', name: 'materials_included', type: 'text', required: false }
        ],
        description: 'Auftragserteilung an Handwerker'
      },
      {
        document_type: 'kautionsquittung',
        template_html: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1>KAUTIONSQUITTUNG / KAUTIONSABRECHNUNG</h1>
          <p>Mieter: {{tenant_name}}</p>
          <p>Objekt: {{property_address}}</p>
          <h2>Kaution</h2>
          <p>Eingezahlte Kaution: {{deposit_amount}} EUR</p>
          <p>Eingangsdatum: {{deposit_date}}</p>
          <h2>Abrechnung</h2>
          <p>Reparaturen/Schäden: {{repairs_costs}} EUR</p>
          <p>Reinigung: {{cleaning_costs}} EUR</p>
          <p>Sonstige Kosten: {{other_costs}} EUR</p>
          <p>Gesamt Kosten: {{total_costs}} EUR</p>
          <h2>Ergebnis</h2>
          <p>Rückzahlung: {{refund}} EUR</p>
          <p>oder Nachzahlung: {{additional_payment}} EUR</p>
          <p>Vermietender: _________________ Datum: _______</p>
        </div>`,
        template_fields: [
          { id: 'tenant_name', name: 'tenant_name', type: 'text', required: true },
          { id: 'property_address', name: 'property_address', type: 'text', required: true },
          { id: 'deposit_amount', name: 'deposit_amount', type: 'currency', required: true },
          { id: 'deposit_date', name: 'deposit_date', type: 'date', required: true },
          { id: 'repairs_costs', name: 'repairs_costs', type: 'currency', required: false },
          { id: 'cleaning_costs', name: 'cleaning_costs', type: 'currency', required: false },
          { id: 'other_costs', name: 'other_costs', type: 'currency', required: false },
          { id: 'total_costs', name: 'total_costs', type: 'currency', required: false },
          { id: 'refund', name: 'refund', type: 'currency', required: false },
          { id: 'additional_payment', name: 'additional_payment', type: 'currency', required: false }
        ],
        description: 'Kautionsquittung und Abrechnung'
      }
    ];

    // Alle Templates in Batches erstellen
    for (const template of templates) {
      await base44.entities.DocumentTemplate.create(template);
    }

    return Response.json({
      success: true,
      message: `${templates.length} Dokumentvorlagen erfolgreich erstellt`,
      templates_created: templates.length
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});