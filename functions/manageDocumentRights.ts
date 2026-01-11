import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, document_id, company_id, rights_config } = await req.json();

    if (action === 'set_rights') {
      // Check if rights already exist
      const existing = await base44.asServiceRole.entities.DocumentRights.filter({
        document_id
      });

      let rights;
      if (existing.length > 0) {
        rights = await base44.asServiceRole.entities.DocumentRights.update(existing[0].id, rights_config);
      } else {
        rights = await base44.asServiceRole.entities.DocumentRights.create({
          document_id,
          company_id,
          ...rights_config
        });
      }

      return Response.json({ success: true, rights });
    }

    if (action === 'check_access') {
      const { requested_action } = await req.json();
      
      const rights = await base44.asServiceRole.entities.DocumentRights.filter({
        document_id
      });

      if (rights.length === 0) {
        return Response.json({ allowed: true }); // No restrictions
      }

      const right = rights[0];

      // Check expiry
      if (right.expiry_date && new Date(right.expiry_date) < new Date()) {
        return Response.json({ allowed: false, reason: 'Rights expired' });
      }

      // Check max access count
      if (right.max_access_count && right.access_count >= right.max_access_count) {
        return Response.json({ allowed: false, reason: 'Access limit reached' });
      }

      // Check specific permission
      const permission = right[`can_${requested_action}`];
      if (permission === false) {
        return Response.json({ allowed: false, reason: 'Permission denied' });
      }

      // Increment access count
      await base44.asServiceRole.entities.DocumentRights.update(right.id, {
        access_count: (right.access_count || 0) + 1
      });

      return Response.json({ allowed: true, rights: right });
    }

    if (action === 'get_rights') {
      const rights = await base44.asServiceRole.entities.DocumentRights.filter({
        document_id
      });
      return Response.json({ rights: rights[0] || null });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Rights error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});