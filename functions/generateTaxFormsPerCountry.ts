import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, tax_year } = await req.json();

    // Profil und Daten laden
    const profiles = await base44.entities.TaxProfile.filter({
      user_email: user.email
    }, '-updated_date', 1);

    if (!profiles.length) {
      return Response.json({ error: 'Profil nicht gefunden' }, { status: 404 });
    }

    const profile = profiles[0];

    // Länder-spezifische Formulare generieren
    const formConfig = {
      'CH': {
        forms: ['Steuererklärung', 'Anlage Kapitalerträge', 'Anlage Beteiligungen'],
        deadlines: '15.03',
        currency: 'CHF'
      },
      'DE': {
        forms: ['Anlage V (Vermietung)', 'Anlage KAP (Kapitalerträge)', 'Anlage SO (Sonstiges)', 'Anlage EÜR (Gewinn)'],
        deadlines: '31.05',
        currency: 'EUR'
      },
      'AT': {
        forms: ['Steuererklärung', 'Anlage E (Betriebstätte)', 'Anlage G (Einkünfte)'],
        deadlines: '02.06',
        currency: 'EUR'
      }
    };

    const config = formConfig[country];
    if (!config) {
      return Response.json({ error: 'Land nicht unterstützt' }, { status: 400 });
    }

    // Daten aggregieren
    const incomes = await base44.entities.OtherIncome.filter({
      user_email: user.email,
      tax_year: tax_year
    });

    const capitals = await base44.entities.CapitalGain.filter({
      user_email: user.email,
      tax_year: tax_year
    });

    const cryptos = await base44.entities.CryptoHolding.filter({
      user_email: user.email
    });

    const crossBorder = await base44.entities.CrossBorderTransaction.filter({
      user_email: user.email,
      tax_year: tax_year
    });

    // KI-gestützte Formularfüllung
    const formData = await base44.integrations.Core.InvokeLLM({
      prompt: `Du bist ein Steuerfachmann für ${country}. Erstelle auf Basis der folgenden Daten einen Formulardatensatz für die Steuererklärung ${tax_year} in ${country}.

Anforderungen:
- Verwendete Formulare: ${config.forms.join(', ')}
- Währung: ${config.currency}
- Deadline: ${config.deadlines}

Daten:
- Einkünfte: ${JSON.stringify(incomes, null, 2)}
- Kapitalerträge: ${JSON.stringify(capitals, null, 2)}
- Kryptowährungen: ${cryptos.length} Holdings
- Grenzüberschreitend: ${crossBorder.length} Transaktionen

Gib strukturiert die Felder für jedes Formular an mit:
- Feldname
- Wert
- Berechnung/Herkunft
- Validierungsstatus`,
      response_json_schema: {
        type: "object",
        properties: {
          country: { type: "string" },
          tax_year: { type: "number" },
          forms: {
            type: "array",
            items: {
              type: "object",
              properties: {
                form_name: { type: "string" },
                fields: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      field_name: { type: "string" },
                      value: { type: "string" },
                      amount: { type: "number" }
                    }
                  }
                }
              }
            }
          },
          total_tax_estimated: { type: "number" },
          warnings: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      country,
      tax_year,
      forms_generated: formData,
      filing_deadline: config.deadlines,
      currency: config.currency,
      status: 'ready_for_review'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});