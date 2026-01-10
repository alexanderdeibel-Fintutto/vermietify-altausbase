import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { audio_url, context_path, photos } = await req.json();

    // Use LLM with audio file for transcription
    const transcriptResponse = await base44.integrations.Core.InvokeLLM({
      prompt: "Transkribiere diese Audioaufnahme auf Deutsch. Gib nur den transkribierten Text zurück, keine Erklärungen.",
      file_urls: [audio_url]
    });

    const transcript = transcriptResponse.toString().trim();

    // Process transcript with AI to extract intent and data
    const analysisResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Analysiere diese Benutzeranfrage und extrahiere die Absicht sowie alle relevanten Daten.
      
Anfrage: "${transcript}"
Aktueller Kontext: ${context_path}
${photos && photos.length > 0 ? `Angehängte Fotos: ${photos.length}` : ''}

Erkenne die Aktion (z.B. create_tenant, create_contract, create_document, create_maintenance) und extrahiere strukturierte Daten wie Name, Adresse, besondere Umstände (z.B. Jobcenter), etc.`,
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
            description: "Alle extrahierten Daten (Name, Adresse, etc.)"
          },
          needs_workflow: {
            type: "boolean",
            description: "Ob ein geführter Workflow benötigt wird"
          }
        }
      }
    });

    // If this is a contract creation for a tenant with Jobcenter
    if (analysisResponse.action === 'create_contract' && 
        analysisResponse.extracted_data?.jobcenter) {
      
      // Start tenant onboarding workflow
      const workflowResponse = await base44.functions.invoke('initiateSmartWorkflow', {
        action: 'create_contract_with_onboarding',
        data: analysisResponse.extracted_data,
        photos: photos || [],
        user_id: user.id
      });

      return Response.json({
        transcript,
        action: analysisResponse.action,
        workflow: workflowResponse.data.workflow,
        extracted_data: analysisResponse.extracted_data,
        summary: workflowResponse.data.summary
      });
    }

    return Response.json({
      transcript,
      action: analysisResponse.action,
      extracted_data: analysisResponse.extracted_data,
      needs_workflow: analysisResponse.needs_workflow
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});