import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { entity, role } = await req.json();

  const permissions = await base44.entities.FieldPermission.filter({ entity, role });

  const permissionMap = {};
  for (const perm of permissions) {
    permissionMap[perm.field_name] = {
      read: perm.can_read,
      write: perm.can_write,
      delete: perm.can_delete
    };
  }

  return Response.json({ permissions: permissionMap });
});