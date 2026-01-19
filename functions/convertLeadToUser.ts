import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Nur Admins können Leads konvertieren' }, { status: 403 });
        }

        const { lead_id, send_invite = true } = await req.json();

        if (!lead_id) {
            return Response.json({ error: 'Lead-ID ist erforderlich' }, { status: 400 });
        }

        // Get lead
        const lead = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
        
        if (lead.length === 0) {
            return Response.json({ error: 'Lead nicht gefunden' }, { status: 404 });
        }

        const leadData = lead[0];

        // Check if user already exists
        const existingUsers = await base44.asServiceRole.entities.User.filter({ email: leadData.email });
        
        if (existingUsers.length > 0) {
            return Response.json({ error: 'User existiert bereits' }, { status: 400 });
        }

        // Invite user
        if (send_invite) {
            await base44.users.inviteUser(leadData.email, 'user');
        }

        // Update lead status
        await base44.asServiceRole.entities.Lead.update(lead_id, {
            status: 'converted',
            converted_to_user_email: leadData.email,
            conversion_date: new Date().toISOString()
        });

        return Response.json({ 
            success: true, 
            message: 'Lead erfolgreich konvertiert',
            invited: send_invite
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});