import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, form_type, tax_year } = await req.json();

    console.log('[AI-FORM-GEN] Generating', form_type, 'for building', building_id, 'year', tax_year);

    // 1. Building-Daten laden
    const buildings = await base44.entities.Building.filter({ id: building_id });
    if (!buildings || buildings.length === 0) {
      return Response.json({ error: 'Building not found' }, { status: 404 });
    }
    const building = buildings[0];

    // 2. Finanz-Daten des Jahres laden
    const startDate = `${tax_year}-01-01`;
    const endDate = `${tax_year}-12-31`;

    const financialItems = await base44.entities.FinancialItem.filter({
      building_id,
      // Hier würde normalerweise ein Datumsfilter kommen
    });

    // 3. Mietverträge laden
    const contracts = await base44.entities.LeaseContract.filter({
      building_id
    });

    // 4. Einnahmen & Ausgaben aggregieren
    const income = financialItems
      .filter(item => item.type === 'INCOME' && item.date >= startDate && item.date <= endDate)
      .reduce((sum, item) => sum + (item.amount || 0), 0);

    const expenses = financialItems
      .filter(item => item.type === 'EXPENSE' && item.date >= startDate && item.date <= endDate)
      .reduce((sum, item) => sum + (item.amount || 0), 0);

    // 5. Kategorisierte Ausgaben
    const categorizedExpenses = {};
    for (const item of financialItems.filter(i => i.type === 'EXPENSE')) {
      const category = item.cost_category || 'SONSTIGE';
      categorizedExpenses[category] = (categorizedExpenses[category] || 0) + (item.amount || 0);
    }

    // 6. KI-Vorbefüllung
    const prompt = `
Generiere ein vollständig ausgefülltes ${form_type} Steuerformular für ${tax_year}.

IMMOBILIE:
${JSON.stringify({ address: building.address, legal_form: building.legal_form }, null, 2)}

FINANZ-DATEN:
- Mieteinnahmen: ${income.toFixed(2)} EUR
- Gesamtausgaben: ${expenses.toFixed(2)} EUR
- Kategorisierte Ausgaben: ${JSON.stringify(categorizedExpenses, null, 2)}
- Anzahl Mietverträge: ${contracts.length}

AUFGABE:
Erstelle ein vollständiges Formular mit allen Pflichtfeldern für ${form_type}.
Berechne alle Summen korrekt.
Berücksichtige die Rechtsform ${building.legal_form || 'PRIVATPERSON'}.

Antworte NUR mit JSON (alle Beträge als Zahlen).
    `;

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          steuernummer: { type: "string" },
          tax_year: { type: "number" },
          mieteinnahmen: { type: "number" },
          grundsteuer: { type: "number" },
          schuldzinsen: { type: "number" },
          afa: { type: "number" },
          versicherungen: { type: "number" },
          instandhaltung: { type: "number" },
          hausverwaltung: { type: "number" },
          sonstige_werbungskosten: { type: "number" },
          einkuenfte: { type: "number" },
          confidence_scores: {
            type: "object",
            additionalProperties: { type: "number" }
          },
          notes: { type: "string" }
        }
      }
    });

    // 7. ElsterSubmission erstellen
    const submission = await base44.entities.ElsterSubmission.create({
      building_id,
      tax_form_type: form_type,
      legal_form: building.legal_form || 'PRIVATPERSON',
      tax_year,
      submission_mode: 'TEST',
      form_data: aiResponse,
      ai_confidence_score: 85,
      status: 'AI_PROCESSED',
      validation_errors: [],
      validation_warnings: []
    });

    return Response.json({ 
      success: true, 
      submission_id: submission.id,
      form_data: aiResponse,
      message: 'Formular erfolgreich mit KI generiert'
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});