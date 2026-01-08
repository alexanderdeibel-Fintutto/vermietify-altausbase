import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('[SEED] Creating ELSTER form templates for all 5 forms');

    const templates = [
      // ANLAGE V
      {
        form_type: "ANLAGE_V",
        legal_form: "PRIVATPERSON",
        year: 2024,
        xml_template: `<?xml version="1.0" encoding="UTF-8"?>
<AnlageV xmlns="http://finkonsens.de/elster/elstererklarung/anlagev/v2024">
  <Grundangaben>
    <Steuernummer>{{steuernummer}}</Steuernummer>
    <Jahr>{{tax_year}}</Jahr>
  </Grundangaben>
  <Angaben>
    <Grundsteuer>{{grundsteuer}}</Grundsteuer>
    <Abschreibungen>{{afa}}</Abschreibungen>
    <Schuldzinsen>{{schuldzinsen}}</Schuldzinsen>
    <Sonstige_Werbungskosten>{{sonstige_werbungskosten}}</Sonstige_Werbungskosten>
    <Mieteinnahmen>{{mieteinnahmen}}</Mieteinnahmen>
  </Angaben>
</AnlageV>`,
        field_mappings: {
          grundsteuer: "sum:PRIV_GRUNDSTEUER",
          afa: "sum:PRIV_ABSCHREIBUNG_GEBAEUDE",
          schuldzinsen: "sum:PRIV_SCHULDZINSEN"
        }
      },
      
      // EUER
      {
        form_type: "EUER",
        legal_form: "GBR",
        year: 2024,
        xml_template: `<?xml version="1.0" encoding="UTF-8"?>
<EUeR xmlns="http://finkonsens.de/elster/elstererklarung/euer/v2024">
  <Grundangaben>
    <Steuernummer>{{steuernummer}}</Steuernummer>
    <Jahr>{{tax_year}}</Jahr>
    <Rechtsform>GBR</Rechtsform>
  </Grundangaben>
  <Betriebseinnahmen>
    <Umsatzerloese>{{umsatzerloese}}</Umsatzerloese>
  </Betriebseinnahmen>
  <Betriebsausgaben>
    <Raumkosten>{{raumkosten}}</Raumkosten>
    <Zinsen>{{zinsen}}</Zinsen>
    <Abschreibungen>{{abschreibungen}}</Abschreibungen>
    <Sonstige>{{sonstige_betriebsausgaben}}</Sonstige>
  </Betriebsausgaben>
  <Gewinn>{{gewinn}}</Gewinn>
</EUeR>`,
        field_mappings: {
          umsatzerloese: "sum:RENTAL_INCOME",
          zinsen: "sum:GBR_KREDITZINSEN",
          abschreibungen: "sum:GBR_ABSCHREIBUNG_GEBAEUDE"
        }
      },
      
      // EST 1B (Personengesellschaften)
      {
        form_type: "EST1B",
        legal_form: "GBR",
        year: 2024,
        xml_template: `<?xml version="1.0" encoding="UTF-8"?>
<ESt1B xmlns="http://finkonsens.de/elster/elstererklarung/est1b/v2024">
  <Grundangaben>
    <Steuernummer>{{steuernummer}}</Steuernummer>
    <Jahr>{{tax_year}}</Jahr>
    <Gesellschaftsname>{{gesellschaft_name}}</Gesellschaftsname>
  </Grundangaben>
  <Einkuenfte>
    <Gewinn_aus_Gewerbebetrieb>{{gewinn}}</Gewinn_aus_Gewerbebetrieb>
    <Sonderbetriebsausgaben>{{sonderbetriebsausgaben}}</Sonderbetriebsausgaben>
  </Einkuenfte>
  <Gesellschafter>
    <Gesellschafter_1>
      <Name>{{gesellschafter_1_name}}</Name>
      <Anteil>{{gesellschafter_1_anteil}}</Anteil>
      <Gewinnanteil>{{gesellschafter_1_gewinn}}</Gewinnanteil>
    </Gesellschafter_1>
  </Gesellschafter>
</ESt1B>`,
        field_mappings: {
          gewinn: "calculated:einkuenfte_minus_ausgaben",
          sonderbetriebsausgaben: "sum:GBR_SONDERBETRIEBSAUSGABEN"
        }
      },
      
      // GEWERBESTEUER
      {
        form_type: "GEWERBESTEUER",
        legal_form: "GMBH",
        year: 2024,
        xml_template: `<?xml version="1.0" encoding="UTF-8"?>
<Gewerbesteuer xmlns="http://finkonsens.de/elster/elstererklarung/gewst/v2024">
  <Grundangaben>
    <Steuernummer>{{steuernummer}}</Steuernummer>
    <Jahr>{{tax_year}}</Jahr>
    <Firma>{{firma}}</Firma>
  </Grundangaben>
  <Gewinn>
    <Gewinn_vor_Hinzurechnungen>{{gewinn_vor_hinzurechnungen}}</Gewinn_vor_Hinzurechnungen>
  </Gewinn>
  <Hinzurechnungen>
    <Schuldzinsen>{{hinzurechnung_zinsen}}</Schuldzinsen>
    <Mieten>{{hinzurechnung_mieten}}</Mieten>
  </Hinzurechnungen>
  <Kuerzungen>
    <Grundstuecke>{{kuerzung_grundstuecke}}</Kuerzungen>
  </Kuerzungen>
  <Gewerbeertrag>{{gewerbeertrag}}</Gewerbeertrag>
</Gewerbesteuer>`,
        field_mappings: {
          gewinn_vor_hinzurechnungen: "calculated:jahresueberschuss",
          hinzurechnung_zinsen: "sum:GMBH_ZINSEN"
        }
      },
      
      // UMSATZSTEUER
      {
        form_type: "UMSATZSTEUER",
        legal_form: "GMBH",
        year: 2024,
        xml_template: `<?xml version="1.0" encoding="UTF-8"?>
<UStVA xmlns="http://finkonsens.de/elster/elsteranmeldung/ustva/v2024">
  <Grundangaben>
    <Steuernummer>{{steuernummer}}</Steuernummer>
    <Jahr>{{tax_year}}</Jahr>
    <Quartal>{{quartal}}</Quartal>
  </Grundangaben>
  <Lieferungen>
    <Steuerpflichtige_Umsaetze_19>{{umsaetze_19}}</Steuerpflichtige_Umsaetze_19>
    <Steuer_19>{{steuer_19}}</Steuer_19>
  </Lieferungen>
  <Vorsteuer>
    <Vorsteuerbetraege>{{vorsteuer}}</Vorsteuerbetraege>
  </Vorsteuer>
  <Zahllast>{{zahllast}}</Zahllast>
</UStVA>`,
        field_mappings: {
          umsaetze_19: "sum:RENTAL_INCOME_TAXABLE",
          vorsteuer: "sum:INPUT_TAX"
        }
      }
    ];

    let created = 0;
    for (const template of templates) {
      await base44.asServiceRole.entities.ElsterFormTemplate.create({
        ...template,
        validation_rules: [],
        is_active: true,
        version: "1.0",
        description: `${template.form_type} Template für ${template.legal_form} ${template.year}`
      });
      created++;
    }

    return Response.json({ 
      success: true, 
      message: `${created} Form-Templates erfolgreich erstellt`,
      templates_created: created
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});