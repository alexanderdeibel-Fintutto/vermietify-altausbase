import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const { userId, changeType, details } = await req.json();
    
    if (!userId || !changeType) {
      return Response.json({ error: "userId and changeType required" }, { status: 400 });
    }
    
    const targetUser = await base44.asServiceRole.entities.User.filter({ id: userId });
    if (!targetUser || targetUser.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    
    const emailUser = targetUser[0];
    
    const emailTemplates = {
      role_assigned: {
        subject: 'Neue Rolle zugewiesen',
        body: `Hallo ${emailUser.full_name || emailUser.email},\n\nIhnen wurde eine neue Rolle zugewiesen: ${details.roleName}\n\nDiese Änderung wurde von ${user.full_name || user.email} durchgeführt.\n\nMit freundlichen Grüßen\nIhr Admin-Team`
      },
      role_removed: {
        subject: 'Rolle entfernt',
        body: `Hallo ${emailUser.full_name || emailUser.email},\n\nEine Rolle wurde von Ihrem Account entfernt: ${details.roleName}\n\nDiese Änderung wurde von ${user.full_name || user.email} durchgeführt.\n\nMit freundlichen Grüßen\nIhr Admin-Team`
      },
      permission_changed: {
        subject: 'Berechtigungen geändert',
        body: `Hallo ${emailUser.full_name || emailUser.email},\n\nIhre Berechtigungen wurden aktualisiert.\n\nDetails: ${details.description || 'Siehe Admin-Dashboard'}\n\nDiese Änderung wurde von ${user.full_name || user.email} durchgeführt.\n\nMit freundlichen Grüßen\nIhr Admin-Team`
      },
      module_activated: {
        subject: 'Neues Modul freigeschaltet',
        body: `Hallo ${emailUser.full_name || emailUser.email},\n\nEin neues Modul wurde für Sie freigeschaltet: ${details.moduleName}\n\nSie können dieses Modul ab sofort nutzen.\n\nMit freundlichen Grüßen\nIhr Admin-Team`
      }
    };
    
    const template = emailTemplates[changeType] || emailTemplates.permission_changed;
    
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: emailUser.email,
      subject: template.subject,
      body: template.body
    });
    
    // Log activity
    await base44.asServiceRole.entities.UserActivity.create({
      user_id: userId,
      action_type: 'email_sent',
      resource: 'notification',
      details: {
        changeType,
        sentBy: user.email
      }
    });
    
    return Response.json({
      success: true,
      message: `Notification sent to ${emailUser.email}`
    });
    
  } catch (error) {
    console.error("Send notification error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});