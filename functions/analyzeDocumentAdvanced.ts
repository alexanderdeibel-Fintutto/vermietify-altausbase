import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Erweiterte Dokumentanalyse: Strukturierte Datenextraktion, Sentiment-Analyse, Keywords
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { document_name, file_url, document_type } = await req.json();

        if (!document_name || !file_url || !document_type) {
            return Response.json({ 
                error: 'Missing required fields: document_name, file_url, document_type' 
            }, { status: 400 });
        }

        // Erstelle Analysedatensatz
        const analysis = await base44.asServiceRole.entities.DocumentAnalysis.create({
            document_name,
            file_url,
            document_type,
            analysis_status: 'analyzing'
        });

        // Starte Analyse asynchron
        analyzeDocumentWithAI(base44, analysis.id, file_url, document_type, document_name).catch(err => {
            console.error('Background analysis failed:', err);
        });

        return Response.json({
            success: true,
            analysis_id: analysis.id,
            status: 'analyzing'
        });

    } catch (error) {
        console.error('Analysis request failed:', error);
        return Response.json({ 
            error: error.message,
            success: false
        }, { status: 500 });
    }
});

async function analyzeDocumentWithAI(base44, analysisId, fileUrl, documentType, documentName) {
    try {
        const prompt = `Analysiere das hochgeladene Dokument (${documentType}) umfassend und extrahiere folgende Informationen im JSON-Format:

{
    "extracted_data": {
        "invoice_number": "Rechnungsnummer",
        "invoice_date": "YYYY-MM-DD",
        "due_date": "YYYY-MM-DD",
        "total_amount": 1234.56,
        "currency": "EUR",
        "supplier": "Lieferantenname",
        "customer": "Kundenname",
        "tax_amount": 234.56,
        "net_amount": 1000.00,
        "line_items": [
            {"description": "Position 1", "quantity": 2, "unit_price": 500, "total": 1000}
        ]
    },
    "keywords": ["Schlüsselwort1", "Schlüsselwort2", "Schlüsselwort3"],
    "summary": "Kurze, prägnante Zusammenfassung des Dokumentinhalts (2-3 Sätze)",
    "sentiment_score": 0,
    "sentiment_label": "neutral",
    "full_text": "Vollständig extrahierter Text",
    "language": "de",
    "confidence_score": 95
}

WICHTIG:
- Extrahiere ALLE relevanten Daten basierend auf dem Dokumenttyp
- Sentiment-Score: -100 (sehr negativ) bis +100 (sehr positiv)
- Sentiment-Label: very_negative, negative, neutral, positive, very_positive
- Keywords: Die 5-10 wichtigsten Schlüsselwörter
- Summary: Klare, präzise Zusammenfassung
- Confidence-Score: Wie sicher bist du bei der Extraktion (0-100%)

Falls es sich nicht um eine Rechnung handelt, passe extracted_data entsprechend an (z.B. bei Briefen: sender, recipient, subject).`;

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
                summary: aiResponse.content || aiResponse,
                confidence_score: 50
            };
        }

        // Update analysis with AI results
        await base44.asServiceRole.entities.DocumentAnalysis.update(analysisId, {
            ...analysisData,
            analysis_status: 'completed'
        });

        console.log(`Advanced analysis completed for ${documentName}`);
    } catch (error) {
        console.error('AI analysis failed:', error);
        await base44.asServiceRole.entities.DocumentAnalysis.update(analysisId, {
            analysis_status: 'failed'
        });
    }
}