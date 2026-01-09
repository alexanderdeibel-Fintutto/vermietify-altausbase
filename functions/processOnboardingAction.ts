import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { lock_id, action, notes, tenant_id } = await req.json();

    if (!lock_id || !action) {
      return Response.json({ error: 'lock_id and action required' }, { status: 400 });
    }

    // Get the lock
    const locks = await base44.asServiceRole.entities.TenantAdministrationLock.filter({ id: lock_id }, null, 1);
    const lock = locks[0];

    if (!lock) {
      return Response.json({ error: 'Lock not found' }, { status: 404 });
    }

    const previousStatus = lock.status;
    let newStatus = lock.status;
    let details = '';

    // Process action
    if (action === 'approve') {
      newStatus = 'completed';
      details = `Aufgabe "${lock.title}" wurde genehmigt`;
      
      // Update lock
      await base44.asServiceRole.entities.TenantAdministrationLock.update(lock_id, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    } else if (action === 'reject') {
      newStatus = 'blocked';
      details = `Aufgabe "${lock.title}" wurde abgelehnt`;
      
      // Update lock
      await base44.asServiceRole.entities.TenantAdministrationLock.update(lock_id, {
        status: 'blocked'
      });
    }

    // Create audit log entry
    await base44.asServiceRole.entities.OnboardingAuditLog.create({
      tenant_id: lock.tenant_id,
      lock_id: lock.id,
      lock_title: lock.title,
      action: action === 'approve' ? 'approved' : 'rejected',
      performed_by: user.email,
      details,
      notes: notes || null,
      previous_status: previousStatus,
      new_status: newStatus,
      created_at: new Date().toISOString()
    });

    // Send notification to tenant if applicable
    if (lock.is_visible_to_tenant) {
      try {
        const tenants = await base44.asServiceRole.entities.Tenant.filter({ id: lock.tenant_id }, null, 1);
        const tenant = tenants[0];
        
        if (tenant?.email) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: tenant.email,
            subject: `Onboarding-Update: ${lock.title}`,
            body: `Ihre Onboarding-Aufgabe "${lock.title}" wurde ${action === 'approve' ? 'genehmigt' : 'abgelehnt'}.\n\n${notes ? `Notiz: ${notes}` : ''}`,
            from_name: 'Verwaltung'
          });
        }
      } catch (notifError) {
        console.warn('Failed to send notification:', notifError);
      }
    }

    return Response.json({
      success: true,
      action,
      lock_id,
      new_status: newStatus
    });

  } catch (error) {
    console.error('Error processing onboarding action:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});