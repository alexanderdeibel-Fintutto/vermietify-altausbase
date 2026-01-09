import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all active schedules
    const schedules = await base44.asServiceRole.entities.MeterReadingSchedule.filter(
      { is_active: true },
      'next_reading_date',
      500
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let notificationsSent = 0;

    for (const schedule of schedules) {
      const nextReading = new Date(schedule.next_reading_date);
      nextReading.setHours(0, 0, 0, 0);
      
      const daysUntil = Math.ceil((nextReading - today) / (1000 * 60 * 60 * 24));
      
      // Send notification if due within notification window
      if (daysUntil <= schedule.notification_days_before && !schedule.notification_sent) {
        // Fetch meter details
        const meters = await base44.asServiceRole.entities.Meter.filter({ id: schedule.meter_id }, null, 1);
        const meter = meters[0];

        if (meter && schedule.assigned_to) {
          // Create notification
          await base44.asServiceRole.entities.Notification.create({
            user_email: schedule.assigned_to,
            title: 'Zählerablesung fällig',
            message: `Zähler ${meter.meter_number} (${meter.location}) sollte in ${daysUntil} Tag(en) abgelesen werden.`,
            type: 'system',
            priority: daysUntil <= 0 ? 'high' : 'normal',
            related_entity_type: 'meter',
            related_entity_id: meter.id
          });

          // Send push notification
          try {
            await base44.asServiceRole.functions.invoke('sendPushNotification', {
              user_email: schedule.assigned_to,
              title: 'Zählerablesung fällig',
              body: `${meter.meter_number} - ${meter.location}`,
              data: { meter_id: meter.id, type: 'meter_reading' }
            });
          } catch (pushError) {
            console.error('Push notification failed:', pushError);
          }

          // Mark as sent
          await base44.asServiceRole.entities.MeterReadingSchedule.update(schedule.id, {
            notification_sent: true
          });

          notificationsSent++;
        }
      }

      // Reset notification flag if reading was done
      if (meter && meter.last_reading_date) {
        const lastReading = new Date(meter.last_reading_date);
        if (lastReading >= nextReading && schedule.notification_sent) {
          // Update schedule for next period
          const newNextReading = new Date(nextReading.getTime() + (schedule.frequency_days * 24 * 60 * 60 * 1000));
          await base44.asServiceRole.entities.MeterReadingSchedule.update(schedule.id, {
            next_reading_date: newNextReading.toISOString().split('T')[0],
            notification_sent: false
          });
        }
      }
    }

    return Response.json({
      success: true,
      notifications_sent: notificationsSent,
      schedules_processed: schedules.length
    });

  } catch (error) {
    console.error('Schedule notifications error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});