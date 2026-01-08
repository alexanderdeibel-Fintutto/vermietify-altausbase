import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { year = 2024 } = await req.json();

    const templates = [
      // ANLAGE V - Alle Rechtsformen
      {
        form_type: 'ANLAGE_V',
        legal_form: 'PRIVATPERSON',
        year,
        namespace: 'http://finkonsens.de/elster/elstererklarung/anlagev/v2024',
        xml_template: `<?xml version="1.0" encoding="UTF-8"?>
<Elster xmlns="http://finkonsens.de/elster/elstererklarung/anlagev/v2024">
  <AnlageV>
    <Adresse>{{address}}</Adresse>
    <Einnahmen>
      <Kaltmiete>{{income_rent}}</Kaltmiete>
      <Umlagen>{{income_ancillary}}</Umlagen>
      <Sonstiges>{{income_other}}</Sonstiges>
    </Einnahmen>
    <Werbungskosten>
      <Grundsteuer>{{expense_property_tax}}</Grundsteuer>
      <Schuldzinsen>{{expense_interest}}</Schuldzinsen>
      <Versicherungen>{{expense_insurance}}</Versicherungen>
      <Instandhaltung>{{expense_maintenance}}</Instandhaltung>
      <Hausverwaltung>{{expense_management}}</Hausverwaltung>
      <Sonstige>{{expense_other}}</Sonstige>
    </Werbungskosten>
    <AfA>
      <Bemessungsgrundlage>{{afa_base}}</AfA_Bemessungsgrundlage>
      <Prozentsatz>{{afa_rate}}</AfA_Prozentsatz>
      <Betrag>{{afa_amount}}</AfA_Betrag>
    </AfA>
  </AnlageV>
</Elster>`,
        field_mappings: {
          address: "building.address",
          income_rent: "SUM(contracts.grundmiete)",
          income_ancillary: "SUM(contracts.nebenkosten)",
          expense_property_tax: "SUM(financialItems[kategorie=Grundsteuer])",
          afa_rate: "2.0"
        }
      },
      
      // EÜR - GbR, GmbH, UG, AG
      {
        form_type: 'EUER',
        legal_form: 'GBR',
        year,
        namespace: 'http://finkonsens.de/elster/elstererklarung/euer/v2024',
        xml_template: `<?xml version="1.0" encoding="UTF-8"?>
<Elster xmlns="http://finkonsens.de/elster/elstererklarung/euer/v2024">
  <EUeR>
    <Betriebseinnahmen>{{revenue}}</Betriebseinnahmen>
    <Wareneinkauf>{{cogs}}</Wareneinkauf>
    <Personalkosten>{{personnel}}</Personalkosten>
    <Abschreibungen>{{depreciation}}</Abschreibungen>
    <SonstigeBetriebsausgaben>{{other_expenses}}</SonstigeBetriebsausgaben>
    <Gewinn>{{profit}}</Gewinn>
  </EUeR>
</Elster>`
      },

      // ESt 1B - nur GbR
      {
        form_type: 'EST1B',
        legal_form: 'GBR',
        year,
        namespace: 'http://finkonsens.de/elster/elstererklarung/est1b/v2024',
        xml_template: `<?xml version="1.0" encoding="UTF-8"?>
<Elster xmlns="http://finkonsens.de/elster/elstererklarung/est1b/v2024">
  <ESt1B>
    <Gesellschafter>
      <Name>{{partner_name}}</Name>
      <Anteil>{{partner_share}}</Anteil>
    </Gesellschafter>
    <Gewinnverteilung>{{profit_distribution}}</Gewinnverteilung>
    <Sonderbetriebseinnahmen>{{special_income}}</Sonderbetriebseinnahmen>
    <Sonderbetriebsausgaben>{{special_expenses}}</Sonderbetriebsausgaben>
  </ESt1B>
</Elster>`
      },

      // Gewerbesteuer - GbR, GmbH, UG, AG
      {
        form_type: 'GEWERBESTEUER',
        legal_form: 'GMBH',
        year,
        namespace: 'http://finkonsens.de/elster/elstererklarung/gewst/v2024',
        xml_template: `<?xml version="1.0" encoding="UTF-8"?>
<Elster xmlns="http://finkonsens.de/elster/elstererklarung/gewst/v2024">
  <GewSt>
    <Gewinn>{{profit}}</Gewinn>
    <Hinzurechnungen>
      <Schuldzinsen>{{add_interest}}</Schuldzinsen>
      <Mieten>{{add_rent}}</Mieten>
      <Lizenzen>{{add_licenses}}</Lizenzen>
    </Hinzurechnungen>
    <Kuerzungen>{{deductions}}</Kuerzungen>
    <Gewerbeertrag>{{trade_earnings}}</Gewerbeertrag>
  </GewSt>
</Elster>`
      },

      // Umsatzsteuer - Alle außer Privatperson
      {
        form_type: 'UMSATZSTEUER',
        legal_form: 'GMBH',
        year,
        namespace: 'http://finkonsens.de/elster/elsteranmeldung/ustva/v2024',
        xml_template: `<?xml version="1.0" encoding="UTF-8"?>
<Elster xmlns="http://finkonsens.de/elster/elsteranmeldung/ustva/v2024">
  <UStVA>
    <Umsaetze19>{{sales_19}}</Umsaetze19>
    <Umsaetze7>{{sales_7}}</Umsaetze7>
    <SteuerfreieUmsaetze>{{sales_exempt}}</SteuerfreieUmsaetze>
    <Vorsteuer>{{input_tax}}</Vorsteuer>
    <Zahllast>{{tax_due}}</Zahllast>
  </UStVA>
</Elster>`
      }
    ];

    let created = 0;
    for (const template of templates) {
      try {
        await base44.asServiceRole.entities.ElsterFormTemplate.create(template);
        created++;
      } catch (error) {
        console.error(`Error creating template ${template.form_type}:`, error);
      }
    }

    return Response.json({
      success: true,
      created,
      total: templates.length,
      message: `${created} Form-Templates für ${year} erstellt`
    });

  } catch (error) {
    console.error('Error seeding templates:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});