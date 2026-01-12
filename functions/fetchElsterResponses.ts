import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Hole alle Submissions mit status = "submitted"
        const submissions = await base44.asServiceRole.entities.ElsterSubmission.filter({ 
            status: 'submitted' 
        });

        // Hole ELSTER Settings
        const settings = await base44.asServiceRole.entities.ElsterSettings.filter({ user_email: user.email });
        const ericServiceUrl = settings[0]?.eric_service_url || Deno.env.get('ERIC_SERVICE_URL');
        const ericApiKey = Deno.env.get('ERIC_SERVICE_API_KEY');

        const newResponses = [];

        for (const submission of submissions) {
            if (!submission.transfer_ticket) continue;

            try {
                // Rufe ERiC-Microservice auf
                const response = await fetch(`${ericServiceUrl}/responses/${submission.transfer_ticket}`, {
                    method: 'GET',
                    headers: {
                        'X-API-Key': ericApiKey
                    }
                });

                if (!response.ok) continue;

                const result = await response.json();

                if (result.has_response) {
                    // Parse Response-Typ
                    let responseType = 'confirmation';
                    if (result.content?.includes('Steuerbescheid')) responseType = 'assessment';
                    if (result.content?.includes('Ablehnung')) responseType = 'rejection';
                    if (result.content?.includes('Rückfrage')) responseType = 'query';

                    // Extrahiere festgesetzte Steuer (bei Bescheid)
                    let assessedTax = null;
                    let differenceToDeclaration = null;

                    if (responseType === 'assessment' && result.assessed_tax) {
                        assessedTax = result.assessed_tax;
                        
                        // Hole TaxReturn für Vergleich
                        const [taxReturn] = await base44.asServiceRole.entities.TaxReturn.filter({ 
                            id: submission.tax_return_id 
                        });
                        
                        if (taxReturn) {
                            const summaries = await base44.asServiceRole.entities.TaxSummary.filter({ 
                                tax_year: taxReturn.tax_year 
                            });
                            const declaredTax = summaries.reduce((sum, s) => sum + s.estimated_tax_liability, 0);
                            differenceToDeclaration = assessedTax - declaredTax;
                        }
                    }

                    // Speichere Response-Datei
                    let responseFileUri = null;
                    if (result.response_file_base64) {
                        const fileBytes = Uint8Array.from(atob(result.response_file_base64), c => c.charCodeAt(0));
                        const fileBlob = new Blob([fileBytes], { type: 'application/pdf' });
                        const { data: uploadResult } = await base44.integrations.Core.UploadPrivateFile({ file: fileBlob });
                        responseFileUri = uploadResult.file_uri;
                    }

                    // Erstelle ElsterResponse
                    const elsterResponse = await base44.asServiceRole.entities.ElsterResponse.create({
                        submission_id: submission.id,
                        tax_return_id: submission.tax_return_id,
                        response_type: responseType,
                        received_date: new Date().toISOString(),
                        transfer_ticket: submission.transfer_ticket,
                        content_summary: result.content_summary || {},
                        assessed_tax: assessedTax,
                        difference_to_declaration: differenceToDeclaration,
                        due_date: result.due_date,
                        response_file_uri: responseFileUri,
                        is_read: false
                    });

                    newResponses.push(elsterResponse);

                    // Aktualisiere Submission Status
                    await base44.asServiceRole.entities.ElsterSubmission.update(submission.id, {
                        status: responseType === 'assessment' ? 'accepted' : responseType === 'rejection' ? 'rejected' : 'accepted'
                    });

                    // Sende Benachrichtigung
                    if (settings[0]?.notification_email) {
                        await base44.integrations.Core.SendEmail({
                            to: settings[0].notification_email,
                            subject: `Neue Antwort vom Finanzamt - ${responseType === 'assessment' ? 'Steuerbescheid' : 'Bestätigung'}`,
                            body: `Für Ihr Steuerjahr ${submission.tax_year} liegt eine neue Antwort vom Finanzamt vor.\n\n${
                                assessedTax ? `Festgesetzte Steuer: ${assessedTax.toFixed(2)}€\n` : ''
                            }Bitte prüfen Sie die Details in Ihrer ELSTER-Übersicht.`
                        });
                    }

                    // Log
                    await base44.asServiceRole.entities.ElsterLog.create({
                        submission_id: submission.id,
                        action: 'response_received',
                        timestamp: new Date().toISOString(),
                        details: { response_type: responseType },
                        success: true
                    });
                }
            } catch (error) {
                console.error(`Error fetching response for submission ${submission.id}:`, error);
            }
        }

        return Response.json({ 
            success: true, 
            new_responses: newResponses.length,
            responses: newResponses
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});