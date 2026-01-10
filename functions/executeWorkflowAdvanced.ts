import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  const { workflow_id, entity, entity_id, trigger_data } = await req.json();

  const workflow = await base44.asServiceRole.entities.WorkflowAutomation.filter({ 
    id: workflow_id 
  }).then(w => w[0]);

  if (!workflow || !workflow.is_active) {
    return Response.json({ error: 'Workflow not found or inactive' }, { status: 404 });
  }

  // Fetch entity data
  const entityData = await base44.asServiceRole.entities[entity].filter({ 
    id: entity_id 
  }).then(e => e[0]);

  if (!entityData) {
    return Response.json({ error: 'Entity not found' }, { status: 404 });
  }

  // Evaluate advanced conditions
  const conditionsMet = evaluateAdvancedConditions(
    workflow.conditions || [], 
    entityData
  );

  if (!conditionsMet) {
    return Response.json({ 
      executed: false, 
      reason: 'Conditions not met' 
    });
  }

  // Execute actions
  const results = [];
  for (const action of workflow.actions || []) {
    try {
      const result = await executeAction(action, entityData, base44);
      results.push({ action: action.type, success: true, result });
    } catch (error) {
      results.push({ 
        action: action.type, 
        success: false, 
        error: error.message 
      });
    }
  }

  // Update workflow statistics
  await base44.asServiceRole.entities.WorkflowAutomation.update(workflow.id, {
    last_run: new Date().toISOString(),
    run_count: (workflow.run_count || 0) + 1
  });

  return Response.json({ 
    executed: true, 
    workflow_id,
    results 
  });
});

function evaluateAdvancedConditions(conditions, entityData) {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every(condition => {
    const fieldValue = entityData[condition.field];
    const { operator, value, fieldType } = condition;

    switch (operator) {
      case 'equals':
        return fieldValue == value;
      
      case 'notEquals':
        return fieldValue != value;
      
      case 'contains':
        return String(fieldValue || '').includes(value);
      
      case 'startsWith':
        return String(fieldValue || '').startsWith(value);
      
      case 'endsWith':
        return String(fieldValue || '').endsWith(value);
      
      case 'greaterThan':
        return Number(fieldValue) > Number(value);
      
      case 'lessThan':
        return Number(fieldValue) < Number(value);
      
      case 'between':
        const numValue = Number(fieldValue);
        return numValue >= Number(value.from) && numValue <= Number(value.to);
      
      case 'before':
        return new Date(fieldValue) < new Date(value);
      
      case 'after':
        return new Date(fieldValue) > new Date(value);
      
      case 'inLast':
        const daysAgo = getDaysAgo(value.count, value.unit);
        return new Date(fieldValue) >= daysAgo;
      
      case 'inNext':
        const daysAhead = getDaysAhead(value.count, value.unit);
        return new Date(fieldValue) <= daysAhead;
      
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);
      
      case 'notIn':
        return Array.isArray(value) && !value.includes(fieldValue);
      
      case 'isEmpty':
        return !fieldValue || fieldValue.length === 0;
      
      default:
        return false;
    }
  });
}

function getDaysAgo(count, unit) {
  const now = new Date();
  const multiplier = unit === 'weeks' ? 7 : unit === 'months' ? 30 : 1;
  return new Date(now.getTime() - count * multiplier * 24 * 60 * 60 * 1000);
}

function getDaysAhead(count, unit) {
  const now = new Date();
  const multiplier = unit === 'weeks' ? 7 : unit === 'months' ? 30 : 1;
  return new Date(now.getTime() + count * multiplier * 24 * 60 * 60 * 1000);
}

async function executeAction(action, entityData, base44) {
  const { type, config } = action;

  switch (type) {
    case 'webhook':
      return await executeWebhook(config, entityData);
    
    case 'send_email':
      return await base44.asServiceRole.integrations.Core.SendEmail({
        to: config.to,
        subject: replacePlaceholders(config.subject, entityData),
        body: replacePlaceholders(config.body, entityData)
      });
    
    case 'create_task':
      return await base44.asServiceRole.entities.BuildingTask.create({
        building_id: config.building_id || entityData.building_id,
        task_title: replacePlaceholders(config.title, entityData),
        description: replacePlaceholders(config.description, entityData),
        priority: config.priority || 'medium',
        status: 'open'
      });
    
    case 'send_notification':
      return await base44.asServiceRole.functions.invoke('sendNotificationWithEmail', {
        user_email: config.user_email,
        title: replacePlaceholders(config.title, entityData),
        message: replacePlaceholders(config.message, entityData),
        type: config.notification_type || 'system',
        priority: config.priority || 'normal'
      });
    
    case 'slack_message':
      return await sendSlackMessage(config, entityData, base44);
    
    default:
      throw new Error(`Unknown action type: ${type}`);
  }
}

async function sendSlackMessage(config, entityData, base44) {
  const accessToken = await base44.asServiceRole.connectors.getAccessToken('slack');
  
  const message = replacePlaceholders(config.message, entityData);
  
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      channel: config.channel,
      text: message
    })
  });

  return await response.json();
}

async function executeWebhook(config, entityData) {
  const { url, method = 'POST', headers = [], body, auth_type } = config;

  const requestHeaders = {
    'Content-Type': 'application/json'
  };

  // Add custom headers
  headers.forEach(h => {
    if (h.key && h.value) {
      requestHeaders[h.key] = h.value;
    }
  });

  // Add authentication
  if (auth_type === 'bearer' && config.auth_token) {
    requestHeaders['Authorization'] = `Bearer ${config.auth_token}`;
  } else if (auth_type === 'basic' && config.auth_username && config.auth_password) {
    const credentials = btoa(`${config.auth_username}:${config.auth_password}`);
    requestHeaders['Authorization'] = `Basic ${credentials}`;
  } else if (auth_type === 'api_key' && config.api_key_header && config.api_key_value) {
    requestHeaders[config.api_key_header] = config.api_key_value;
  }

  // Prepare body with variable replacement
  const requestBody = replacePlaceholders(body, {
    ...entityData,
    entity_id: entityData.id,
    timestamp: new Date().toISOString()
  });

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: method !== 'GET' ? requestBody : undefined
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

function replacePlaceholders(template, data) {
  if (!template) return template;
  
  let result = template;
  
  // Replace {{variable}} placeholders
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, data[key] || '');
  });

  // Replace {{data}} with full object
  result = result.replace(/{{data}}/g, JSON.stringify(data));
  
  return result;
}