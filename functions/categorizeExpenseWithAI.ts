import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      invoice_data, 
      building_ownership = 'VERMIETUNG',
      legal_form = 'PRIVATPERSON',
      building_id 
    } = await req.json();

    // Lade relevante Master-Kategorien
    const allCategories = await base44.asServiceRole.entities.TaxCategoryMaster.filter({
      is_active: true
    });
    
    const applicableCategories = allCategories.filter(cat => 
      cat.legal_forms.includes(legal_form)
    );

    // Lade historische Buchungen für Kontext (letzte 50)
    let historicalContext = [];
    if (building_id) {
      const recentBookings = await base44.asServiceRole.entities.FinancialItem.filter(
        { building_id },
        '-created_date',
        50
      );
      historicalContext = recentBookings.map(b => ({
        description: b.description,
        category: b.kategorie,
        amount: b.betrag
      }));
    }

    const prompt = `
Du bist ein Experte für deutsches Steuerrecht und Immobilienwirtschaft.

Kategorisiere diese Rechnung/Ausgabe für die deutsche Steuererklärung:

RECHNUNG:
${JSON.stringify(invoice_data, null, 2)}

KONTEXT:
- Eigentumsart: ${building_ownership}
- Rechtsform: ${legal_form}
- Historische Buchungen (zur Orientierung): ${JSON.stringify(historicalContext.slice(0, 5), null, 2)}

VERFÜGBARE KATEGORIEN:
${applicableCategories.map(cat => `- ${cat.category_code}: ${cat.display_name} (${cat.description || ''})`).join('\n')}

AUFGABE:
Wähle die passendste Kategorie basierend auf:
1. Deutsche Steuergesetze (EStG, AO, BetrKV)
2. Rechtsform-spezifische Behandlung
3. Eigennutzung vs. Vermietung
4. Umlagefähigkeit nach BetrKV (nur bei Vermietung relevant)
5. Keywords und Beispiele der Kategorien

Antworte NUR mit JSON. Keine zusätzlichen Erklärungen außerhalb des JSON.
`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          suggested_category_code: {
            type: "string",
            description: "category_code der empfohlenen Kategorie"
          },
          confidence: {
            type: "number",
            description: "Vertrauen 0-100"
          },
          reasoning: {
            type: "string",
            description: "Kurze Begründung"
          },
          tax_implications: {
            type: "object",
            properties: {
              deductible: { type: "boolean" },
              allocatable: { type: "boolean" },
              treatment: { type: "string" }
            }
          },
          alternative_categories: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category_code: { type: "string" },
                confidence: { type: "number" },
                reason: { type: "string" }
              }
            },
            description: "Alternative Vorschläge mit Confidence"
          }
        },
        required: ["suggested_category_code", "confidence", "reasoning"]
      }
    });

    // Hole vollständige Kategorie-Details
    const selectedCategory = applicableCategories.find(
      cat => cat.category_code === response.suggested_category_code
    );

    return Response.json({
      success: true,
      suggestion: {
        ...response,
        category_details: selectedCategory
      }
    });

  } catch (error) {
    console.error('Error in categorizeExpenseWithAI:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});