import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const {
      action,
      role_id,
      name,
      description,
      company_id,
      base_role,
      entity_permissions,
      field_restrictions,
      document_type_restrictions
    } = await req.json();

    let result;
    const oldPermissions = role_id ? await getOldPermissions(base44, role_id) : null;

    switch (action) {
      case 'create':
        result = await base44.asServiceRole.entities.CustomRole.create({
          name,
          description,
          company_id,
          base_role,
          entity_permissions,
          field_restrictions: field_restrictions || [],
          document_type_restrictions: document_type_restrictions || [],
          created_by: user.email
        });

        await logPermissionChange(base44, {
          action_type: 'role_created',
          role_id: result.id,
          role_name: name,
          changed_by: user.email,
          company_id,
          new_permissions: entity_permissions
        });

        return Response.json({ success: true, role: result });

      case 'update':
        const updatedRole = await base44.asServiceRole.entities.CustomRole.update(role_id, {
          name,
          description,
          entity_permissions,
          field_restrictions: field_restrictions || [],
          document_type_restrictions: document_type_restrictions || []
        });

        const changedFields = getChangedFields(oldPermissions, entity_permissions);

        await logPermissionChange(base44, {
          action_type: 'role_updated',
          role_id,
          role_name: name,
          changed_by: user.email,
          company_id,
          old_permissions: oldPermissions,
          new_permissions: entity_permissions,
          changed_fields: changedFields
        });

        return Response.json({ success: true, role: updatedRole });

      case 'delete':
        await base44.asServiceRole.entities.CustomRole.delete(role_id);

        await logPermissionChange(base44, {
          action_type: 'role_deleted',
          role_id,
          role_name: name,
          changed_by: user.email,
          company_id,
          old_permissions: oldPermissions
        });

        return Response.json({ success: true });

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Manage custom role error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function getOldPermissions(base44, roleId) {
  const roles = await base44.asServiceRole.entities.CustomRole.filter({ id: roleId });
  return roles[0]?.entity_permissions || null;
}

function getChangedFields(oldPerms, newPerms) {
  const changed = [];
  Object.keys(newPerms || {}).forEach(entity => {
    Object.keys(newPerms[entity] || {}).forEach(perm => {
      if (oldPerms?.[entity]?.[perm] !== newPerms[entity][perm]) {
        changed.push(`${entity}.${perm}`);
      }
    });
  });
  return changed;
}

async function logPermissionChange(base44, data) {
  await base44.asServiceRole.entities.PermissionAuditLog.create(data);
}