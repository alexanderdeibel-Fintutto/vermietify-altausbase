import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflow_id, action, data } = await req.json();

    if (action === 'send' && data) {
      const { sendOffer, recipient, communicationMethod, jobcenterEmail, tenant_id, contract_id } = data;

      if (!sendOffer) {
        return Response.json({ success: true, message: 'Kein Versand erforderlich' });
      }

      // Get tenant and contract data
      const tenant = tenant_id ? await base44.asServiceRole.entities.Tenant.get(tenant_id) : null;
      const contract = contract_id ? await base44.asServiceRole.entities.LeaseContract.get(contract_id) : null;

      const recipients = [];
      
      if (recipient === 'tenant' || recipient === 'both') {
        if (tenant?.email) {
          recipients.push({
            type: 'tenant',
            email: tenant.email,
            name: `${tenant.first_name} ${tenant.last_name}`
          });
        }
      }

      if (recipient === 'jobcenter' || recipient === 'both') {
        if (jobcenterEmail) {
          recipients.push({
            type: 'jobcenter',
            email: jobcenterEmail,
            name: 'Jobcenter'
          });
        }
      }

      // Send based on communication method
      for (const recip of recipients) {
        if (communicationMethod === 'email') {
          await base44.integrations.Core.SendEmail({
            to: recip.email,
            subject: `Mietvertrag - ${tenant?.first_name} ${tenant?.last_name}`,
            body: `
Sehr geehrte Damen und Herren,

anbei erhalten Sie den Mietvertrag für ${tenant?.first_name} ${tenant?.last_name}.

Mietbeginn: ${contract?.start_date || 'N/A'}
Miete: ${contract?.total_rent ? `${contract.total_rent.toFixed(2)} €` : 'N/A'}

Mit freundlichen Grüßen
            `
          });
        } else if (communicationMethod === 'post') {
          // Would integrate with LetterXpress here
          // For now, create a notification
          await base44.asServiceRole.entities.Notification.create({
            user_id: user.id,
            title: 'Post-Versand geplant',
            message: `Mietvertrag per Post an ${recip.name} senden`,
            type: 'info',
            is_read: false
          });
        } else if (communicationMethod === 'whatsapp') {
          // Would integrate with WhatsApp here
          await base44.asServiceRole.entities.Notification.create({
            user_id: user.id,
            title: 'WhatsApp-Versand geplant',
            message: `Mietvertrag per WhatsApp an ${recip.name} senden`,
            type: 'info',
            is_read: false
          });
        }
      }

      // Create notification for user
      await base44.asServiceRole.entities.Notification.create({
        user_id: user.id,
        title: 'Workflow abgeschlossen',
        message: `Mietvertrag erfolgreich erstellt und an ${recipients.length} Empfänger gesendet`,
        type: 'success',
        is_read: false
      });

      return Response.json({ 
        success: true,
        sent_to: recipients.length,
        method: communicationMethod
      });
    }

    return Response.json({ success: true });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});