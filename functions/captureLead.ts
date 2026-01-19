import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { email, full_name, phone, source, source_page, company, interested_in, utm_source, utm_medium, utm_campaign } = await req.json();

        if (!email || !source) {
            return Response.json({ error: 'Email und Source sind erforderlich' }, { status: 400 });
        }

        // Check if lead already exists
        const existingLeads = await base44.asServiceRole.entities.Lead.filter({ email });
        
        let lead;
        if (existingLeads.length > 0) {
            // Update existing lead
            lead = await base44.asServiceRole.entities.Lead.update(existingLeads[0].id, {
                full_name: full_name || existingLeads[0].full_name,
                phone: phone || existingLeads[0].phone,
                company: company || existingLeads[0].company,
                interested_in: interested_in || existingLeads[0].interested_in,
                last_activity_date: new Date().toISOString(),
                lead_score: existingLeads[0].lead_score + 5 // Increase score for return visit
            });
        } else {
            // Create new lead
            lead = await base44.asServiceRole.entities.Lead.create({
                email,
                full_name,
                phone,
                source,
                source_page,
                company,
                interested_in,
                utm_source,
                utm_medium,
                utm_campaign,
                lead_score: 10, // Initial score
                status: 'new',
                last_activity_date: new Date().toISOString()
            });

            // Send welcome email
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: email,
                subject: 'Willkommen bei Vermitify',
                body: `Hallo ${full_name || ''},\n\nvielen Dank für Ihr Interesse an Vermitify. Wir haben Ihre Anfrage erhalten und werden uns in Kürze bei Ihnen melden.\n\nBeste Grüße,\nIhr Vermitify Team`
            });
        }

        return Response.json({ success: true, lead });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});