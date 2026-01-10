import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, workflow_id, change_type, change_details, recipients } = await req.json();

    const workflow = await base44.asServiceRole.entities.WorkflowAutomation.read(workflow_id);

    // Create notification records
    const notifications = [];
    for (const recipientEmail of recipients) {
      const notif = await base44.asServiceRole.entities.Notification.create({
        recipient_email: recipientEmail,
        title: `Workflow "${workflow.name}" updated`,
        message: `${user.full_name} made changes: ${change_type}`,
        notification_type: 'status_changed',
        related_entity_type: 'workflow',
        related_entity_id: workflow_id,
        priority: 'high',
        action_url: `/workflow/${workflow_id}`
      });
      notifications.push(notif);
    }

    // Send Slack notifications
    const changeMessage = {
      comment: `🔄 **Workflow Update: ${workflow.name}**`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${user.full_name}* updated the workflow\n\n*Change Type:* ${change_type}\n*Details:* ${JSON.stringify(change_details)}`
          }
        }
      ]
    };

    for (const recipientEmail of recipients) {
      try {
        await base44.integrations.Slack.SendMessage({
          channel: recipientEmail,
          ...changeMessage
        });
      } catch (err) {
        console.error('Slack notification failed:', err);
      }
    }

    return Response.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Notify workflow change error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});