import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, reminderType } = await req.json();

    if (!country || !reminderType) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch relevant deadlines
    const deadlines = await base44.entities.TaxDeadline.filter({ country }).catch(() => []);

    const reminders = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate ${reminderType} tax reminders for ${country}.

Available deadlines: ${deadlines.length}

Create reminders for:
1. Filing deadlines
2. Payment deadlines
3. Documentation collection
4. Quarterly estimates
5. Year-end planning

Format as personalized messages with:
- Deadline date
- Action required
- Priority level
- Suggested next steps`,
      response_json_schema: {
        type: 'object',
        properties: {
          reminders: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                message: { type: 'string' },
                deadline: { type: 'string' },
                priority: { type: 'string' },
                action: { type: 'string' }
              }
            }
          }
        }
      }
    });

    // Send email for each reminder
    for (const reminder of reminders.reminders || []) {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `🔔 ${reminder.title}`,
        body: `${reminder.message}\n\nDeadline: ${reminder.deadline}\nAction: ${reminder.action}`
      }).catch(e => console.error('Email send error:', e));
    }

    return Response.json({
      status: 'success',
      reminders_sent: (reminders.reminders || []).length,
      details: reminders
    });
  } catch (error) {
    console.error('Send reminders error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});