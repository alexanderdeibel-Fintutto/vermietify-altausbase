import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      integration_id,
      action_type,
      params,
      company_id
    } = await req.json();

    // Get integration
    const integration = await base44.asServiceRole.entities.WorkflowIntegration.read(integration_id);

    if (!integration || !integration.is_active) {
      return Response.json({ error: 'Integration not found or inactive' }, { status: 404 });
    }

    let result;

    switch (integration.service_name) {
      case 'slack':
        result = await executeSlackAction(base44, integration, action_type, params);
        break;
      case 'google_drive':
        result = await executeGoogleDriveAction(base44, integration, action_type, params);
        break;
      case 'salesforce':
        result = await executeSalesforceAction(base44, integration, action_type, params);
        break;
      case 'webhook':
        result = await executeWebhookAction(integration, action_type, params);
        break;
      default:
        return Response.json({ error: 'Unknown service' }, { status: 400 });
    }

    // Log execution
    await base44.asServiceRole.entities.AuditLog.create({
      action_type: 'workflow_executed',
      entity_type: 'workflow',
      entity_id: integration_id,
      user_email: user.email,
      company_id,
      description: `Integration Action: ${integration.service_name} - ${action_type}`,
      metadata: { integration_id, action_type, success: result.success }
    });

    return Response.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Execute workflow integration action error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function executeSlackAction(base44, integration, actionType, params) {
  const config = integration.config || {};

  switch (actionType) {
    case 'send_message':
      return await base44.integrations.Slack.PostMessage({
        channel: params.channel,
        text: params.message,
        blocks: params.blocks
      });

    case 'send_file':
      return await base44.integrations.Slack.FilesUpload({
        channels: params.channels,
        file: params.file,
        title: params.title
      });

    case 'update_user_status':
      return await base44.integrations.Slack.UsersSetPresence({
        presence: params.presence
      });

    default:
      throw new Error(`Unknown Slack action: ${actionType}`);
  }
}

async function executeGoogleDriveAction(base44, integration, actionType, params) {
  switch (actionType) {
    case 'create_folder':
      return await base44.integrations.GoogleDrive.CreateFolder({
        name: params.folder_name,
        parent_folder_id: params.parent_id
      });

    case 'upload_file':
      return await base44.integrations.GoogleDrive.UploadFile({
        name: params.file_name,
        parent_folder_id: params.folder_id,
        file: params.file_content
      });

    case 'share_file':
      return await base44.integrations.GoogleDrive.ShareFile({
        file_id: params.file_id,
        email: params.email,
        role: params.role || 'viewer'
      });

    default:
      throw new Error(`Unknown Google Drive action: ${actionType}`);
  }
}

async function executeSalesforceAction(base44, integration, actionType, params) {
  const accessToken = await base44.asServiceRole.connectors.getAccessToken('salesforce');

  const sfBase = integration.config?.instance_url;
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  switch (actionType) {
    case 'create_record':
      const createRes = await fetch(`${sfBase}/services/data/v57.0/sobjects/${params.sobject_type}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params.record_data)
      });
      return await createRes.json();

    case 'update_record':
      await fetch(`${sfBase}/services/data/v57.0/sobjects/${params.sobject_type}/${params.record_id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(params.record_data)
      });
      return { success: true };

    case 'query':
      const queryRes = await fetch(`${sfBase}/services/data/v57.0/query?q=${encodeURIComponent(params.query)}`, {
        headers
      });
      return await queryRes.json();

    default:
      throw new Error(`Unknown Salesforce action: ${actionType}`);
  }
}

async function executeWebhookAction(integration, actionType, params) {
  const config = integration.config || {};
  
  const res = await fetch(config.webhook_url, {
    method: config.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...config.custom_headers
    },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      action: actionType,
      data: params
    })
  });

  return {
    status: res.status,
    response: await res.json()
  };
}