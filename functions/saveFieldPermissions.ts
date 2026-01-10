import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { entity, role, permissions } = await req.json();

  const existing = await base44.entities.FieldPermission.filter({ entity, role });
  
  for (const perm of existing) {
    await base44.entities.FieldPermission.delete(perm.id);
  }

  for (const [field, perms] of Object.entries(permissions)) {
    await base44.entities.FieldPermission.create({
      entity,
      role,
      field_name: field,
      can_read: perms.read || false,
      can_write: perms.write || false,
      can_delete: perms.delete || false
    });
  }

  return Response.json({ success: true });
});