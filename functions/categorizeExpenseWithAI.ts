import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoice_data, building_ownership, legal_form, historical_bookings } = await req.json();

    console.log('[AI-CATEGORIZATION] Analyzing expense for:', legal_form);

    const prompt = `
Du bist ein Experte für deutsche Steuergesetze und Immobilienwirtschaft. Kategorisiere diese Rechnung für die deutsche Steuererklärung.

RECHNUNG:
${JSON.stringify(invoice_data, null, 2)}

KONTEXT:
- Eigentumsart: ${building_ownership || 'VERMIETUNG'}
- Rechtsform: ${legal_form || 'PRIVATPERSON'}
- Historische Buchungen: ${historical_bookings?.length || 0} verfügbar

WICHTIGE REGELUNGEN:
1. Privatperson (Anlage V): Nur vermietungsbezogene Kosten absetzbar
2. GbR: Transparenzprinzip, Sonderbetriebsausgaben beachten
3. GmbH/UG/AG: Körperschaftsteuer, erweiterte Betriebsausgaben
4. Umlagefähigkeit nach BetrKV §1-2 prüfen
5. Sofort absetzbar vs. AfA unterscheiden

ANALYSIERE:
- Steuerliche Behandlung (sofort absetzbar, AfA, nicht absetzbar)
- Umlagefähigkeit nach BetrKV
- Zuordnung zu Steuerformular-Zeilen
- Typische SKR03/SKR04 Konten
- Alternative Kategorien falls unsicher

Antworte NUR mit dem JSON-Objekt, keine zusätzlichen Erklärungen.
    `;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          suggested_category: { 
            type: "string",
            description: "Empfohlene Kategorie-Code (z.B. PRIV_GRUNDSTEUER)"
          },
          display_name: {
            type: "string",
            description: "Benutzerfreundlicher Name"
          },
          confidence: { 
            type: "number",
            description: "Vertrauen 0-100"
          },
          reasoning: { 
            type: "string",
            description: "Begründung der Kategorisierung"
          },
          tax_implications: {
            type: "object",
            properties: {
              tax_treatment: { type: "string", enum: ["SOFORT", "AFA", "VERTEILT", "NICHT_ABSETZBAR"] },
              allocatable: { type: "boolean" },
              skr03_account: { type: "string" },
              skr04_account: { type: "string" },
              tax_form_lines: { type: "object" }
            }
          },
          alternative_categories: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                confidence: { type: "number" },
                reason: { type: "string" }
              }
            }
          },
          warnings: {
            type: "array",
            items: { type: "string" },
            description: "Steuerliche Warnungen"
          }
        },
        required: ["suggested_category", "confidence", "reasoning", "tax_implications"]
      }
    });

    return Response.json({ success: true, categorization: response });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});