import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  console.log('[voiceFormIntent] Started');
  
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST only' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transcribedText } = await req.json();
    
    if (!transcribedText) {
      return Response.json({ error: 'No text provided' }, { status: 400 });
    }

    console.log('[voiceFormIntent] Analyzing text:', transcribedText);

    // Use LLM to understand intent and extract data
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Du bist ein intelligenter Formular-Assistant. Analysiere diese Sprachnachricht und:
1. Erkenne, welches Formular/Dokument der User erstellen möchte
2. Extrahiere alle relevanten Daten aus dem Text
3. Gib nur essenzielle Felder für den nächsten Prozess zurück

Sprachnachricht: "${transcribedText}"

Mögliche Formulare:
- invoice (Rechnung): client_name, amount, invoice_number, description
- expense (Ausgabe): amount, category, description, vendor_name
- contract (Mietvertrag): tenant_name, address, rent_amount, start_date
- protocol (Übergabeprotokoll): tenant_name, unit_address, condition_notes
- income (Einnahme): amount, source, description

Antworte mit JSON:
{
  "form_type": "invoice|expense|contract|protocol|income",
  "confidence": 0-100,
  "extracted_data": { extracted fields },
  "essential_fields_only": { only critical fields needed for system }
}`,
      response_json_schema: {
        type: 'object',
        properties: {
          form_type: { type: 'string' },
          confidence: { type: 'number' },
          extracted_data: { type: 'object' },
          essential_fields_only: { type: 'object' }
        }
      }
    });

    console.log('[voiceFormIntent] Analysis result:', analysis);

    return Response.json({
      success: true,
      form_type: analysis.form_type,
      confidence: analysis.confidence,
      all_data: analysis.extracted_data,
      essential_data: analysis.essential_fields_only
    });

  } catch (error) {
    console.error('[voiceFormIntent] Error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});