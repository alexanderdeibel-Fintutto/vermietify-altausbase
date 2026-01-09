import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Sends notifications for equipment status changes
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { equipmentId, equipmentName, oldStatus, newStatus, buildingId } = await req.json();

    if (!equipmentId || !newStatus) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    console.log(`Triggering equipment notification: ${equipmentName} changed from ${oldStatus} to ${newStatus}`);

    // Determine priority based on status
    const priorityMap = {
      defective: 'critical',
      maintenance: 'high',
      inactive: 'normal',
      active: 'low'
    };

    const priority = priorityMap[newStatus] || 'normal';

    // Skip if status change is not critical enough
    if (['active', 'inactive'].includes(newStatus) && oldStatus) {
      console.log('Status change not critical, skipping notification');
      return Response.json({ success: true, skipped: true });
    }

    // Get building name
    let buildingName = 'Unbekannt';
    if (buildingId) {
      const buildings = await base44.asServiceRole.entities.Building.filter({ id: buildingId }, null, 1);
      if (buildings[0]) {
        buildingName = buildings[0].name;
      }
    }

    // Get all admins to notify
    const allUsers = await base44.asServiceRole.entities.User.list('-updated_date', 100);
    const admins = allUsers.filter(u => u.role === 'admin');

    let notificationCount = 0;

    for (const admin of admins) {
      try {
        const prefs = await base44.asServiceRole.entities.NotificationPreference.filter({ user_id: admin.id }, null, 1);
        const preference = prefs[0];

        if (preference && !preference.notify_equipment_status) {
          continue;
        }

        const statusText = {
          defective: '❌ Defekt',
          maintenance: '⚠️ Wartung erforderlich',
          inactive: '⏸️ Inaktiv',
          active: '✅ Aktiv'
        };

        const notification = await base44.asServiceRole.entities.Notification.create({
          user_id: admin.id,
          user_email: admin.email,
          title: `${statusText[newStatus]} Gerätestatus geändert`,
          message: `${equipmentName} in ${buildingName} hat den Status "${newStatus}" erhalten.`,
          notification_type: 'equipment_status_change',
          priority: priority,
          action_type: 'equipment',
          action_target_id: equipmentId,
          related_entity_type: 'equipment',
          related_entity_id: equipmentId,
          metadata: {
            equipment_name: equipmentName,
            old_status: oldStatus,
            new_status: newStatus,
            building_name: buildingName
          }
        });

        notificationCount++;

        // Send email if critical
        if (priority === 'critical' && preference && preference.email_notifications_enabled) {
          try {
            await base44.integrations.Core.SendEmail({
              to: admin.email,
              subject: `⚠️ KRITISCH: Gerät defekt - ${equipmentName}`,
              body: `Hallo,\n\nEin Gerät hat kritischen Status:\n\n${equipmentName}\nGebäude: ${buildingName}\nStatus: ${newStatus}\n\nBitte überprüfen Sie das Gerät sofort.\n\nMit freundlichen Grüßen\nIhres Verwaltungssystem`
            });
          } catch (err) {
            console.error(`Failed to send email to ${admin.email}`);
          }
        }
      } catch (err) {
        console.error(`Failed to create notification for admin ${admin.email}: ${err.message}`);
      }
    }

    return Response.json({
      success: true,
      notification_count: notificationCount
    });
  } catch (error) {
    console.error('Error triggering equipment notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});