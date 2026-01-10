import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, workflow_id, step_id, content, type, mentions } = await req.json();

    // Create comment
    const comment = await base44.asServiceRole.entities.WorkflowComment.create({
      workflow_id,
      step_id,
      company_id,
      author_email: user.email,
      content,
      type,
      mentions: mentions || [],
      resolved: false
    });

    // Get workflow and relevant users
    const workflow = await base44.asServiceRole.entities.WorkflowAutomation.read(workflow_id);
    const allUsers = await base44.asServiceRole.entities.User.list();
    
    // Prepare notification
    const mentionedUsers = mentions ? allUsers.filter(u => mentions.includes(u.email)) : [];
    const notificationUsers = [
      ...mentionedUsers,
      ...allUsers.filter(u => u.email !== user.email && u.role === 'admin')
    ];

    // Send Slack notifications
    for (const notifiedUser of notificationUsers) {
      try {
        await base44.integrations.Slack.SendMessage({
          channel: notifiedUser.email,
          text: `📝 **Neuer Kommentar in Workflow: ${workflow.name}**\n\n${user.full_name}: ${content}\n\nTyp: ${type}`
        });
      } catch (err) {
        console.error('Slack notification failed:', err);
      }
    }

    // Log audit
    await base44.asServiceRole.entities.AuditLog.create({
      action_type: 'document_created',
      entity_type: 'workflow',
      entity_id: workflow_id,
      user_email: user.email,
      company_id,
      description: `Added ${type} comment to workflow`,
      metadata: { comment_id: comment.id, step_id, mentions }
    });

    return Response.json({
      success: true,
      comment
    });
  } catch (error) {
    console.error('Handle workflow comment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});