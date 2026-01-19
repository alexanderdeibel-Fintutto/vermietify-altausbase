import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { calculator_type, input_data, result_data, result_summary, user_email, session_id } = await req.json();

        if (!calculator_type || !input_data || !result_data) {
            return Response.json({ error: 'Calculator-Type, Input-Data und Result-Data sind erforderlich' }, { status: 400 });
        }

        // Save calculation to history
        const calculation = await base44.asServiceRole.entities.CalculationHistory.create({
            calculator_type,
            user_email,
            input_data,
            result_data,
            result_summary,
            session_id,
            is_saved: false,
            is_shared: false,
            lead_captured: false
        });

        // Update lead score if email provided
        if (user_email) {
            const leads = await base44.asServiceRole.entities.Lead.filter({ email: user_email });
            if (leads.length > 0) {
                const currentScore = leads[0].lead_score || 0;
                await base44.asServiceRole.entities.Lead.update(leads[0].id, {
                    lead_score: currentScore + 8,
                    last_activity_date: new Date().toISOString()
                });
            }
        }

        return Response.json({ success: true, calculation });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});