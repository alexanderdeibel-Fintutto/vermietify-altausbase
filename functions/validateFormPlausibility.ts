import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      form_data, 
      form_type,
      legal_form,
      building_id,
      tax_year 
    } = await req.json();

    // Lade Vorjahresdaten zum Vergleich
    let previousYearData = null;
    if (building_id && tax_year) {
      const prevSubmissions = await base44.asServiceRole.entities.ElsterSubmission.filter({
        building_id,
        tax_year: tax_year - 1,
        status: 'ACCEPTED'
      });
      
      if (prevSubmissions.length > 0) {
        previousYearData = prevSubmissions[0].form_data;
      }
    }

    // Lade Branchen-Benchmarks (falls vorhanden)
    const allSubmissions = await base44.asServiceRole.entities.ElsterSubmission.filter({
      tax_form_type: form_type,
      legal_form,
      status: 'ACCEPTED'
    });

    const prompt = `
Du bist ein deutscher Steuerberater mit Spezialisierung auf Immobilienwirtschaft.

Prüfe die Plausibilität dieser Steuerdaten:

FORMULAR: ${form_type}
RECHTSFORM: ${legal_form}
JAHR: ${tax_year}

AKTUELLE DATEN:
${JSON.stringify(form_data, null, 2)}

${previousYearData ? `VORJAHRESDATEN (zum Vergleich):
${JSON.stringify(previousYearData, null, 2)}` : ''}

BRANCHENDATEN:
- Anzahl vergleichbarer Abgaben: ${allSubmissions.length}

PRÜFKRITERIEN:
1. Ungewöhnliche Abweichungen zum Vorjahr (>30% ohne erkennbaren Grund)
2. Typische Fehlerquellen bei ${form_type}
3. Rechtsform-spezifische Besonderheiten für ${legal_form}
4. Branchenübliche Werte für Immobilienwirtschaft
5. Mathematische Konsistenz (Summen, Prozentsätze)
6. Vollständigkeit der Pflichtfelder
7. Formale Korrektheit (Formate, Bereiche)

Antworte NUR mit JSON.
`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          plausibility_score: {
            type: "number",
            description: "Gesamtbewertung 0-100"
          },
          anomalies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                severity: { 
                  type: "string",
                  enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
                },
                description: { type: "string" },
                current_value: { type: "string" },
                expected_range: { type: "string" }
              }
            },
            description: "Auffälligkeiten"
          },
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                suggestion: { type: "string" },
                reasoning: { type: "string" }
              }
            },
            description: "Verbesserungsvorschläge"
          },
          warnings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                message: { type: "string" },
                impact: { type: "string" }
              }
            },
            description: "Warnungen"
          },
          overall_assessment: {
            type: "string",
            description: "Gesamtbeurteilung in 2-3 Sätzen"
          }
        },
        required: ["plausibility_score", "anomalies", "suggestions", "warnings"]
      }
    });

    return Response.json({
      success: true,
      validation: response
    });

  } catch (error) {
    console.error('Error in validateFormPlausibility:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});