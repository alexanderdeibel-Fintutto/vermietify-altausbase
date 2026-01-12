import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { maintenance_task_id, status_update, response_message } = await req.json();

    const task = await base44.entities.MaintenanceTask.filter({ id: maintenance_task_id }).then(r => r[0]);
    
    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    if (status_update) {
      await base44.entities.MaintenanceTask.update(task.id, {
        status: status_update
      });
    }

    const tenant = await base44.entities.Tenant.filter({ id: task.tenant_id }).then(r => r[0]);
    
    if (tenant?.email) {
      const statusMessages = {
        'In Bearbeitung': 'Ihre Wartungsanfrage wird bearbeitet',
        'Terminiert': 'Ein Termin für die Wartung wurde vereinbart',
        'Erledigt': 'Die Wartungsarbeiten wurden abgeschlossen'
      };

      const subject = statusMessages[status_update] || 'Update zu Ihrer Wartungsanfrage';
      
      const emailBody = `Sehr geehrte/r ${tenant.anrede || 'Herr/Frau'} ${tenant.last_name},

${response_message || 'wir möchten Sie über den Status Ihrer Wartungsanfrage informieren.'}

Status: ${status_update}
Anfrage: ${task.titel}

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen`;

      await base44.integrations.Core.SendEmail({
        to: tenant.email,
        subject: subject,
        body: emailBody
      });

      await base44.entities.CommunicationLog.create({
        tenant_id: tenant.id,
        kommunikationstyp: 'E-Mail',
        empfaenger_email: tenant.email,
        betreff: subject,
        nachricht: emailBody,
        versand_status: 'Versendet',
        versendet_am: new Date().toISOString().split('T')[0]
      });

      console.log(`[Maintenance Response] Sent update to ${tenant.email}`);
    }

    return Response.json({ 
      success: true,
      message: 'Response sent successfully'
    });
  } catch (error) {
    console.error('Maintenance response error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});