import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action, tenant_id, config } = await req.json();

    if (action === 'initialize') {
      // Create or update tenant access control
      const existing = await base44.asServiceRole.entities.TenantAccessControl.filter({
        tenant_id
      });

      let tenantAccess;
      if (existing.length > 0) {
        tenantAccess = await base44.asServiceRole.entities.TenantAccessControl.update(
          existing[0].id,
          config
        );
      } else {
        tenantAccess = await base44.asServiceRole.entities.TenantAccessControl.create({
          tenant_id,
          isolation_level: config.isolation_level || 'strict',
          storage_quota_gb: config.storage_quota_gb || 10,
          max_users: config.max_users || 5,
          max_documents: config.max_documents || 1000,
          features_enabled: config.features_enabled || [],
          data_residency: config.data_residency || 'EU'
        });
      }

      return Response.json({ success: true, tenant_access: tenantAccess });
    }

    if (action === 'check_quota') {
      const tenantAccess = await base44.asServiceRole.entities.TenantAccessControl.filter({
        tenant_id
      });

      if (tenantAccess.length === 0) {
        return Response.json({ error: 'Tenant not found' }, { status: 404 });
      }

      const access = tenantAccess[0];

      // Get current usage
      const documents = await base44.asServiceRole.entities.Document.filter({
        company_id: tenant_id
      });

      const users = await base44.asServiceRole.entities.User.list();
      const tenantUsers = users.filter(u => u.company_id === tenant_id);

      // Update current usage
      await base44.asServiceRole.entities.TenantAccessControl.update(access.id, {
        current_users: tenantUsers.length
      });

      const quota = {
        storage: {
          used: access.current_storage_gb || 0,
          limit: access.storage_quota_gb,
          percentage: ((access.current_storage_gb || 0) / access.storage_quota_gb * 100).toFixed(1)
        },
        users: {
          used: tenantUsers.length,
          limit: access.max_users,
          percentage: (tenantUsers.length / access.max_users * 100).toFixed(1)
        },
        documents: {
          used: documents.length,
          limit: access.max_documents,
          percentage: (documents.length / access.max_documents * 100).toFixed(1)
        }
      };

      return Response.json({ success: true, quota, tenant_access: access });
    }

    if (action === 'enforce_isolation') {
      // Verify tenant data isolation
      const documents = await base44.asServiceRole.entities.Document.filter({
        company_id: tenant_id
      });

      const violations = [];

      for (const doc of documents) {
        const permissions = await base44.asServiceRole.entities.DocumentPermission.filter({
          document_id: doc.id
        });

        // Check for cross-tenant sharing
        const externalShares = permissions.filter(p => {
          return !p.user_email.includes(tenant_id); // Simplified check
        });

        if (externalShares.length > 0) {
          violations.push({
            document_id: doc.id,
            violation: 'cross_tenant_sharing',
            details: externalShares
          });
        }
      }

      return Response.json({ success: true, violations });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Tenant isolation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});