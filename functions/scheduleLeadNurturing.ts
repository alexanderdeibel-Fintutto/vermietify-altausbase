import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get leads that need nurturing
    const leads = await base44.asServiceRole.entities.Lead.list();
    
    const now = new Date();
    let emailsSent = 0;

    for (const lead of leads) {
      if (lead.status === 'new' && lead.marketing_consent) {
        const lastActivity = new Date(lead.last_activity_at);
        const daysSinceActivity = (now - lastActivity) / (1000 * 60 * 60 * 24);
        
        // Send 7-day follow-up
        if (daysSinceActivity >= 7 && daysSinceActivity < 8) {
          await base44.functions.invoke('sendLeadNurturingEmail', {
            lead_id: lead.id,
            template: '7day_followup'
          });
          emailsSent++;
        }
      }
    }

    return Response.json({ 
      success: true, 
      emails_sent: emailsSent,
      message: `Sent ${emailsSent} nurturing emails` 
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});