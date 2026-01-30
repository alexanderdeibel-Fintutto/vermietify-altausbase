import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Analysiert ein hochgeladenes Vertragsdokument mit AI
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { document_name, contract_type, file_url, file_format, building_id, related_entity_id, related_entity_type } = await req.json();

        if (!document_name || !contract_type || !file_url || !file_format) {
            return Response.json({ 
                error: 'Missing required fields: document_name, contract_type, file_url, file_format' 
            }, { status: 400 });
        }

        // Erstelle Analysedatensatz
        const analysis = await base44.asServiceRole.entities.ContractAnalysis.create({
            document_name,
            contract_type,
            file_url,
            file_format,
            analysis_status: 'analyzing',
            building_id,
            related_entity_id,
            related_entity_type
        });

        // Starte Analyse asynchron via AI
        analyzeWithAI(base44, analysis.id, file_url, contract_type, document_name).catch(err => {
            console.error('Background analysis failed:', err);
        });

        return Response.json({
            success: true,
            analysis_id: analysis.id,
            status: 'analyzing',
            message: 'Document analysis started'
        });

    } catch (error) {
        console.error('Analysis request failed:', error);
        return Response.json({ 
            error: error.message,
            success: false
        }, { status: 500 });
    }
});

async function analyzeWithAI(base44, analysisId, fileUrl, contractType, documentName) {
    try {
        const prompt = `Analysiere das hochgeladene Vertragsdokument (${contractType}) und extrahiere folgende Informationen im JSON-Format:

{
    "parties": ["Partei 1", "Partei 2"],
    "contract_start_date": "YYYY-MM-DD",
    "contract_end_date": "YYYY-MM-DD",
    "duration_months": 36,
    "termination_notice_period": "3 Monate",
    "auto_renewal": true,
    "renewal_period": "12 Monate",
    "key_clauses": [
        {
            "clause_name": "Kündigungsklausel",
            "description": "Kurze Beschreibung",
            "importance": "high"
        }
    ],
    "risk_clauses": [
        {
            "clause": "Risikohafte Klausel",
            "risk_level": "high",
            "recommendation": "Empfehlung zur Behandlung"
        }
    ],
    "payment_terms": {
        "amount": 1000,
        "currency": "EUR",
        "frequency": "monthly",
        "payment_method": "bank_transfer"
    },
    "special_conditions": ["Bedingung 1", "Bedingung 2"],
    "ai_summary": "Kurze Zusammenfassung des Vertrags",
    "risk_score": 45
}

Analysiere das Dokument gründlich. Identifiziere alle kritischen und riskanten Klauseln. Sei präzise bei Daten.`;

        const { data: aiResponse } = await base44.asServiceRole.functions.invoke('aiCoreService', {
            action: 'analysis',
            prompt,
            featureKey: 'document_analysis',
            file_urls: [fileUrl]
        });

        // Parse AI response
        let analysisData = {};
        try {
            const responseText = aiResponse.content || aiResponse;
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysisData = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('Failed to parse AI response:', e);
            analysisData = {
                ai_summary: aiResponse.content || aiResponse,
                risk_score: 50
            };
        }

        // Berechne days_until_expiry und is_expiring_soon
        let daysUntilExpiry = null;
        let isExpiringSoon = false;

        if (analysisData.contract_end_date) {
            const endDate = new Date(analysisData.contract_end_date);
            const today = new Date();
            daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;
        }

        // Update analysis with AI results
        await base44.asServiceRole.entities.ContractAnalysis.update(analysisId, {
            ...analysisData,
            days_until_expiry: daysUntilExpiry,
            is_expiring_soon: isExpiringSoon,
            analysis_status: 'completed'
        });

        // Auto-generate tasks
        try {
            await base44.asServiceRole.functions.invoke('generateContractTasks', {
                analysis_id: analysisId
            });
            console.log(`Tasks auto-generated for ${documentName}`);
        } catch (error) {
            console.error('Failed to auto-generate tasks:', error);
        }

        console.log(`Analysis completed for ${documentName}`);
    } catch (error) {
        console.error('AI analysis failed:', error);
        await base44.asServiceRole.entities.ContractAnalysis.update(analysisId, {
            analysis_status: 'failed',
            analysis_error: error.message
        });
    }
}