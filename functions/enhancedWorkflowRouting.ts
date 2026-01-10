import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { company_id, document_data, risk_score } = await req.json();

    // Dynamic routing based on risk
    let approvalType = 'standard';
    let approvers = [];

    if (risk_score > 0.8) {
      approvalType = 'multi_level';
      const admins = await base44.asServiceRole.entities.User.filter({
        role: 'admin'
      });
      approvers = admins.map(a => a.email);
    } else if (risk_score > 0.5) {
      approvalType = 'manager';
      const managers = await base44.asServiceRole.entities.User.filter({
        role: 'admin'
      });
      approvers = managers.slice(0, 1).map(m => m.email);
    } else {
      approvalType = 'auto';
    }

    return Response.json({
      success: true,
      approval_type: approvalType,
      approvers,
      requires_escalation: risk_score > 0.7
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});