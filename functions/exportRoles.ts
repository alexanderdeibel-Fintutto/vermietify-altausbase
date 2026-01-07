import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const { format = 'json' } = await req.json();
    
    // Alle Rollen und Permissions laden
    const roles = await base44.asServiceRole.entities.Role.list();
    const permissions = await base44.asServiceRole.entities.Permission.list();
    const fieldPermissions = await base44.asServiceRole.entities.FieldPermission.list();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      roles: roles.map(role => ({
        name: role.name,
        description: role.description,
        category: role.category,
        is_predefined: role.is_predefined,
        is_active: role.is_active,
        permissions: role.permissions || []
      })),
      permissions: permissions.map(perm => ({
        code: perm.code,
        name: perm.name,
        description: perm.description,
        module: perm.module,
        resource: perm.resource,
        action: perm.action,
        is_active: perm.is_active
      })),
      fieldPermissions: fieldPermissions.map(fp => ({
        entity_name: fp.entity_name,
        field_name: fp.field_name,
        access_level: fp.access_level
      }))
    };
    
    if (format === 'json') {
      return Response.json(exportData);
    } else if (format === 'csv') {
      // CSV-Export für Rollen
      let csv = 'Name,Beschreibung,Kategorie,Predefined,Aktiv,Permissions\n';
      roles.forEach(role => {
        csv += `"${role.name}","${role.description || ''}","${role.category}",${role.is_predefined},${role.is_active},"${(role.permissions || []).length}"\n`;
      });
      
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=roles-export.csv'
        }
      });
    }
    
    return Response.json({ error: 'Invalid format' }, { status: 400 });
    
  } catch (error) {
    console.error("Export roles error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});