import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { workflow_id } = await req.json();

  // Get workflow
  const workflows = await base44.entities.WorkflowAutomation.filter({ id: workflow_id });
  const workflow = workflows[0];

  if (!workflow) {
    return Response.json({ error: 'Workflow not found' }, { status: 404 });
  }

  let affectedCount = 0;

  // Get entities that match conditions
  const matchingEntities = await findMatchingEntities(base44, workflow.conditions);

  // Execute actions for each matching entity
  for (const entity of matchingEntities) {
    for (const action of workflow.actions) {
      await executeAction(base44, action, entity, workflow);
      affectedCount++;
    }
  }

  // Update workflow stats
  await base44.entities.WorkflowAutomation.update(workflow_id, {
    last_run: new Date().toISOString(),
    run_count: (workflow.run_count || 0) + 1
  });

  return Response.json({ affected: affectedCount, workflow: workflow.name });
});

async function findMatchingEntities(base44, conditions) {
  if (!conditions || conditions.length === 0) {
    return [];
  }

  const entityType = conditions[0].entity;
  const allEntities = await base44.entities[entityType].list();

  return allEntities.filter(entity => {
    return conditions.every(condition => {
      const fieldValue = entity[condition.field];
      const condValue = condition.value;

      switch (condition.operator) {
        case 'equals':
          return String(fieldValue) === String(condValue);
        case 'not_equals':
          return String(fieldValue) !== String(condValue);
        case 'greater_than':
          return Number(fieldValue) > Number(condValue);
        case 'is_empty':
          return !fieldValue || fieldValue === '';
        case 'before_days': {
          if (!fieldValue) return false;
          const days = Number(condValue);
          const fieldDate = new Date(fieldValue);
          const now = new Date();
          const diffDays = (now - fieldDate) / (1000 * 60 * 60 * 24);
          return diffDays > days;
        }
        case 'in_next_days': {
          if (!fieldValue) return false;
          const days = Number(condValue);
          const fieldDate = new Date(fieldValue);
          const now = new Date();
          const diffDays = (fieldDate - now) / (1000 * 60 * 60 * 24);
          return diffDays >= 0 && diffDays <= days;
        }
        default:
          return true;
      }
    });
  });
}

async function executeAction(base44, action, entity, workflow) {
  switch (action.type) {
    case 'send_email': {
      const recipient = resolveField(entity, action.config.recipient_field);
      const subject = replacePlaceholders(action.config.subject, entity);
      const body = replacePlaceholders(action.config.body, entity);
      
      await base44.integrations.Core.SendEmail({
        to: recipient,
        subject,
        body,
        from_name: workflow.name
      });
      break;
    }

    case 'create_task': {
      const title = replacePlaceholders(action.config.task_title, entity);
      const description = replacePlaceholders(action.config.description, entity);
      
      await base44.entities.Task.create({
        title,
        description,
        status: 'open',
        priority: 'medium',
        created_by_workflow: workflow.id
      });
      break;
    }

    case 'archive_document': {
      if (entity.id && !entity.is_archived) {
        await base44.entities.Document.update(entity.id, {
          is_archived: true,
          archived_at: new Date().toISOString(),
          archived_by: 'Workflow: ' + workflow.name,
          archive_reason: action.config.reason
        });
      }
      break;
    }

    case 'update_entity': {
      const updates = action.config.updates || {};
      await base44.entities[action.config.entity_type].update(entity.id, updates);
      break;
    }

    case 'send_notification': {
      const title = replacePlaceholders(action.config.title, entity);
      const message = replacePlaceholders(action.config.message, entity);
      
      await base44.entities.Notification.create({
        user_email: entity.created_by,
        title,
        message,
        type: 'system'
      });
      break;
    }
  }
}

function resolveField(entity, fieldPath) {
  if (!fieldPath) return '';
  const parts = fieldPath.split('.');
  let value = entity;
  for (const part of parts) {
    value = value?.[part];
  }
  return value || '';
}

function replacePlaceholders(text, entity) {
  if (!text) return '';
  return text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    return resolveField(entity, path.trim()) || match;
  });
}