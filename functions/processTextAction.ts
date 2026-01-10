import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, context_path, photos } = await req.json();

    // Process with AI to extract intent and data
    const analysisResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Analysiere diese Benutzeranfrage und extrahiere die Absicht sowie alle relevanten Daten.
      
Anfrage: "${text}"
Aktueller Kontext: ${context_path}
${photos && photos.length > 0 ? `Angehängte Fotos: ${photos.length}` : ''}

Erkenne die Aktion (z.B. create_tenant, create_contract, create_document, create_maintenance, create_building) und extrahiere strukturierte Daten wie:
- Name (Vor- und Nachname getrennt)
- Adresse (Straße, Hausnummer, PLZ, Stadt)
- Besondere Umstände (z.B. "Jobcenter", "Sozialhilfe", etc.)
- Miete/Kosten falls erwähnt
- Weitere relevante Details`,
      response_json_schema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "Die zu ausführende Aktion"
          },
          intent: {
            type: "string",
            description: "Was der Benutzer möchte"
          },
          extracted_data: {
            type: "object",
            properties: {
              first_name: { type: "string" },
              last_name: { type: "string" },
              street: { type: "string" },
              house_number: { type: "string" },
              postal_code: { type: "string" },
              city: { type: "string" },
              email: { type: "string" },
              phone: { type: "string" },
              jobcenter: { type: "boolean" },
              social_welfare: { type: "boolean" },
              rent_amount: { type: "number" },
              notes: { type: "string" }
            }
          },
          needs_workflow: {
            type: "boolean",
            description: "Ob ein geführter Workflow benötigt wird"
          },
          confidence: {
            type: "number",
            description: "Konfidenz der Erkennung 0-1"
          }
        }
      },
      file_urls: photos || []
    });

    // If this is a contract creation with special circumstances
    if ((analysisResponse.action === 'create_contract' || analysisResponse.action === 'create_tenant') && 
        analysisResponse.needs_workflow) {
      
      // Start smart workflow
      const workflowResponse = await base44.functions.invoke('initiateSmartWorkflow', {
        action: analysisResponse.action,
        data: analysisResponse.extracted_data,
        photos: photos || [],
        user_id: user.id
      });

      return Response.json({
        action: analysisResponse.action,
        workflow: workflowResponse.data.workflow,
        extracted_data: analysisResponse.extracted_data,
        entities: workflowResponse.data.entities,
        summary: workflowResponse.data.summary
      });
    }

    return Response.json({
      action: analysisResponse.action,
      extracted_data: analysisResponse.extracted_data,
      needs_workflow: analysisResponse.needs_workflow,
      confidence: analysisResponse.confidence
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});