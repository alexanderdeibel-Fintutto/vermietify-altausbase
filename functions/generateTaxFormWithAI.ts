import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, form_type, tax_year } = await req.json();

    // 1. DATEN SAMMELN
    const building = await base44.asServiceRole.entities.Building.get(building_id);
    
    const units = await base44.asServiceRole.entities.Unit.filter({ building_id });
    
    const contracts = await base44.asServiceRole.entities.LeaseContract.filter({
      building_id
    });
    
    const financialItems = await base44.asServiceRole.entities.FinancialItem.filter({
      building_id
    });
    
    // Filter für Steuerjahr
    const yearStart = `${tax_year}-01-01`;
    const yearEnd = `${tax_year}-12-31`;
    
    const yearlyItems = financialItems.filter(item => {
      if (!item.datum) return false;
      const date = item.datum;
      return date >= yearStart && date <= yearEnd;
    });

    // 2. KI-VORBEFÜLLUNG
    const prompt = `
Du bist ein deutscher Steuerberater und füllst das Formular ${form_type} für das Jahr ${tax_year} aus.

GEBÄUDE-DATEN:
${JSON.stringify(building, null, 2)}

EINHEITEN:
${JSON.stringify(units, null, 2)}

MIETVERTRÄGE:
${JSON.stringify(contracts, null, 2)}

FINANZIELLE TRANSAKTIONEN (${tax_year}):
${JSON.stringify(yearlyItems, null, 2)}

AUFGABE:
Fülle das Steuerformular ${form_type} vollständig und korrekt aus.

FORMULAR-SPEZIFISCHE ANFORDERUNGEN:

${form_type === 'ANLAGE_V' ? `
ANLAGE V - Einkünfte aus Vermietung und Verpachtung:
- Zeile 4: Anschrift des Objekts
- Zeile 7: Einnahmen (Miete, Umlagen)
- Zeile 8-9: Nebenleistungen
- Zeilen 33-48: Werbungskosten
- Zeile 50: AfA-Bemessungsgrundlage
- Zeile 51: AfA-Satz (meist 2% oder 2,5%)
- Zeile 52: AfA-Betrag
` : ''}

${form_type === 'EUER' ? `
EÜR - Einnahmen-Überschuss-Rechnung:
- Betriebseinnahmen
- Wareneinkauf
- Personalkosten
- Abschreibungen
- Sonstige Betriebsausgaben
- Gewinn/Verlust
` : ''}

${form_type === 'EST1B' ? `
ESt 1B - Personengesellschaften (GbR):
- Gesellschafter-Anteile
- Gewinnverteilung
- Sonderbetriebseinnahmen/-ausgaben
` : ''}

${form_type === 'GEWERBESTEUER' ? `
Gewerbesteuererklärung:
- Gewinn aus Gewerbebetrieb
- Hinzurechnungen (Zinsen, Mieten, Lizenzen)
- Kürzungen
- Gewerbeertrag
` : ''}

${form_type === 'UMSATZSTEUER' ? `
Umsatzsteuererklärung:
- Umsätze 19%
- Umsätze 7%
- Steuerfreie Umsätze
- Vorsteuer
- Zahllast/Erstattung
` : ''}

Berechne alle Summen korrekt. Antworte NUR mit JSON.
`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          form_fields: {
            type: "object",
            additionalProperties: true,
            description: "Alle Formularfelder mit Werten"
          },
          calculations: {
            type: "object",
            additionalProperties: true,
            description: "Berechnungen und Summen"
          },
          confidence_scores: {
            type: "object",
            additionalProperties: { type: "number" },
            description: "Confidence pro Feld (0-100)"
          },
          notes: {
            type: "array",
            items: { type: "string" },
            description: "Anmerkungen und Hinweise"
          },
          missing_data: {
            type: "array",
            items: { type: "string" },
            description: "Fehlende Informationen"
          }
        },
        required: ["form_fields", "confidence_scores"]
      }
    });

    // 3. SUBMISSION ERSTELLEN
    const avgConfidence = Object.values(response.confidence_scores).reduce((a, b) => a + b, 0) / 
                         Object.keys(response.confidence_scores).length;

    const submission = await base44.asServiceRole.entities.ElsterSubmission.create({
      building_id,
      tax_form_type: form_type,
      legal_form: building.legal_form || 'PRIVATPERSON',
      tax_year,
      submission_mode: 'TEST',
      form_data: response.form_fields,
      ai_confidence_score: Math.round(avgConfidence),
      status: 'AI_PROCESSED',
      created_by: user.email
    });

    return Response.json({
      success: true,
      submission_id: submission.id,
      form_data: response.form_fields,
      confidence: avgConfidence,
      notes: response.notes || [],
      missing_data: response.missing_data || []
    });

  } catch (error) {
    console.error('Error generating tax form:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});