import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Vergleicht zwei Dokumente und identifiziert Unterschiede
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { document_1_url, document_1_name, document_2_url, document_2_name, comparison_name } = await req.json();

        if (!document_1_url || !document_2_url || !document_1_name || !document_2_name) {
            return Response.json({ 
                error: 'Missing required fields' 
            }, { status: 400 });
        }

        // Erstelle Vergleichsdatensatz
        const comparison = await base44.asServiceRole.entities.DocumentComparison.create({
            comparison_name: comparison_name || `Vergleich: ${document_1_name} vs ${document_2_name}`,
            document_1_url,
            document_1_name,
            document_2_url,
            document_2_name,
            comparison_status: 'comparing'
        });

        // Starte Vergleich asynchron
        compareWithAI(base44, comparison.id, document_1_url, document_1_name, document_2_url, document_2_name).catch(err => {
            console.error('Background comparison failed:', err);
        });

        return Response.json({
            success: true,
            comparison_id: comparison.id,
            status: 'comparing'
        });

    } catch (error) {
        console.error('Comparison request failed:', error);
        return Response.json({ 
            error: error.message,
            success: false
        }, { status: 500 });
    }
});

async function compareWithAI(base44, comparisonId, doc1Url, doc1Name, doc2Url, doc2Name) {
    try {
        const prompt = `Vergleiche die beiden hochgeladenen Dokumente und identifiziere alle Unterschiede. Analysiere sorgfältig und gebe die Ergebnisse im folgenden JSON-Format zurück:

{
    "differences": [
        {
            "type": "added",
            "section": "Klausel 5",
            "content_1": "",
            "content_2": "Neuer Text in Dokument 2",
            "importance": "high"
        },
        {
            "type": "removed",
            "section": "Absatz 3",
            "content_1": "Text in Dokument 1",
            "content_2": "",
            "importance": "medium"
        },
        {
            "type": "modified",
            "section": "Zahlungsbedingungen",
            "content_1": "30 Tage",
            "content_2": "14 Tage",
            "importance": "high"
        }
    ],
    "similarity_score": 85,
    "key_changes": [
        "Zahlungsfrist von 30 auf 14 Tage verkürzt",
        "Neue Haftungsklausel hinzugefügt",
        "Kündigungsfrist von 3 auf 6 Monate verlängert"
    ],
    "ai_summary": "Kurze Zusammenfassung der wichtigsten Änderungen zwischen den beiden Dokumentversionen"
}

WICHTIG:
- type: "added", "removed", oder "modified"
- importance: "low", "medium", oder "high" (basierend auf geschäftlicher Relevanz)
- similarity_score: 0-100% (wie ähnlich sind die Dokumente)
- key_changes: Die 3-5 wichtigsten Änderungen
- Sei präzise und identifiziere auch kleine, aber wichtige Änderungen`;

        const { data: aiResponse } = await base44.asServiceRole.functions.invoke('aiCoreService', {
            action: 'analysis',
            prompt,
            featureKey: 'document_analysis',
            file_urls: [doc1Url, doc2Url]
        });

        // Parse AI response
        let comparisonData = {};
        try {
            const responseText = aiResponse.content || aiResponse;
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                comparisonData = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('Failed to parse AI response:', e);
            comparisonData = {
                ai_summary: aiResponse.content || aiResponse,
                similarity_score: 50
            };
        }

        // Update comparison with AI results
        await base44.asServiceRole.entities.DocumentComparison.update(comparisonId, {
            ...comparisonData,
            comparison_status: 'completed'
        });

        console.log(`Document comparison completed: ${doc1Name} vs ${doc2Name}`);
    } catch (error) {
        console.error('AI comparison failed:', error);
        await base44.asServiceRole.entities.DocumentComparison.update(comparisonId, {
            comparison_status: 'failed'
        });
    }
}