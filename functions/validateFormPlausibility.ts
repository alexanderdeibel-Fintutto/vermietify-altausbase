import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { form_data, form_type, legal_form, building_id } = await req.json();

    console.log('[PLAUSIBILITY] Validating:', form_type, legal_form);

    const prompt = `
Du bist ein Experte für deutsche Steuergesetze und Immobilienwirtschaft. Prüfe die Plausibilität dieser Steuerdaten.

FORMULAR: ${form_type}
RECHTSFORM: ${legal_form}

DATEN:
${JSON.stringify(form_data, null, 2)}

PRÜFE AUF:
1. Ungewöhnliche Abweichungen von Branchendurchschnitt
2. Typische Fehlerquellen (z.B. fehlende Posten)
3. Rechtsform-spezifische Besonderheiten
4. Verhältnismäßigkeit (z.B. Schuldzinsen zu Mieteinnahmen)
5. Vollständigkeit der Pflichtangaben
6. Mathematische Konsistenz

BRANCHENVERGLEICH IMMOBILIENWIRTSCHAFT:
- Mieteinnahmen: Durchschnittlich 60-80€/qm/Jahr
- Instandhaltungsrücklage: ca. 7-15€/qm/Jahr
- Verwaltungskosten: ca. 20-30€/Einheit/Monat
- AfA Gebäude: Standard 2-3%
- Eigenkapitalrendite: 3-6% typisch

Antworte NUR mit JSON, keine zusätzlichen Erklärungen.
    `;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          plausibility_score: {
            type: "number",
            description: "0-100, höher = plausibler"
          },
          overall_assessment: {
            type: "string",
            enum: ["EXCELLENT", "GOOD", "ACCEPTABLE", "QUESTIONABLE", "CRITICAL"]
          },
          anomalies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                issue: { type: "string" },
                severity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
                expected_range: { type: "string" },
                actual_value: { type: "string" }
              }
            }
          },
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                suggestion: { type: "string" },
                impact: { type: "string" }
              }
            }
          },
          warnings: {
            type: "array",
            items: { type: "string" }
          },
          compliance_check: {
            type: "object",
            properties: {
              all_required_fields: { type: "boolean" },
              mathematical_consistency: { type: "boolean" },
              legal_requirements_met: { type: "boolean" }
            }
          }
        },
        required: ["plausibility_score", "overall_assessment", "anomalies", "suggestions"]
      }
    });

    return Response.json({ 
      success: true, 
      validation: response,
      checked_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});