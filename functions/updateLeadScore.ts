import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { email, activity_type } = await req.json();

        if (!email || !activity_type) {
            return Response.json({ error: 'Email und Activity-Type sind erforderlich' }, { status: 400 });
        }

        const leads = await base44.asServiceRole.entities.Lead.filter({ email });
        
        if (leads.length === 0) {
            return Response.json({ error: 'Lead nicht gefunden' }, { status: 404 });
        }

        const lead = leads[0];
        let scoreIncrease = 0;

        // Score increase based on activity type
        const scoreMap = {
            'calculator_use': 8,
            'quiz_completion': 12,
            'document_download': 10,
            'page_view': 2,
            'email_open': 5,
            'email_click': 7,
            'form_submit': 15,
            'demo_request': 20,
            'pricing_view': 10
        };

        scoreIncrease = scoreMap[activity_type] || 5;

        const newScore = Math.min((lead.lead_score || 0) + scoreIncrease, 100);

        // Update lead
        const updatedLead = await base44.asServiceRole.entities.Lead.update(lead.id, {
            lead_score: newScore,
            last_activity_date: new Date().toISOString()
        });

        return Response.json({ success: true, lead: updatedLead });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});