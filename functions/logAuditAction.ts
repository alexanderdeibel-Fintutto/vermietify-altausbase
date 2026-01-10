import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const {
      action_type,
      entity_type,
      entity_id,
      user_email,
      company_id,
      description,
      old_values,
      new_values,
      metadata,
      ip_address,
      status = 'success'
    } = await req.json();

    if (!action_type || !entity_type || !entity_id || !user_email || !company_id) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const auditLog = await base44.asServiceRole.entities.AuditLog.create({
      action_type,
      entity_type,
      entity_id,
      user_email,
      company_id,
      description,
      old_values,
      new_values,
      metadata,
      ip_address,
      status
    });

    return Response.json({
      success: true,
      audit_log: auditLog
    });
  } catch (error) {
    console.error('Log audit action error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});