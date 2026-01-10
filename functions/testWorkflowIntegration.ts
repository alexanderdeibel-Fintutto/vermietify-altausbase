import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { service_name, config } = await req.json();

    let testResult = { success: false, message: '' };

    switch (service_name) {
      case 'slack':
        testResult = await testSlackConnection(base44);
        break;
      case 'google_drive':
        testResult = await testGoogleDriveConnection(base44);
        break;
      case 'salesforce':
        testResult = await testSalesforceConnection(base44, config);
        break;
      case 'webhook':
        testResult = await testWebhookConnection(config);
        break;
      default:
        testResult = { success: false, message: 'Unknown service' };
    }

    return Response.json({
      success: true,
      test_result: testResult
    });
  } catch (error) {
    console.error('Test integration error:', error);
    return Response.json({
      success: false,
      test_result: { success: false, message: error.message }
    }, { status: 500 });
  }
});

async function testSlackConnection(base44) {
  try {
    const result = await base44.integrations.Slack.AuthTest();
    return {
      success: true,
      message: `Connected as ${result.user}`,
      details: result
    };
  } catch (error) {
    return {
      success: false,
      message: `Slack connection failed: ${error.message}`
    };
  }
}

async function testGoogleDriveConnection(base44) {
  try {
    const result = await base44.integrations.GoogleDrive.GetAbout();
    return {
      success: true,
      message: `Connected to Google Drive`,
      details: { user: result.user.emailAddress }
    };
  } catch (error) {
    return {
      success: false,
      message: `Google Drive connection failed: ${error.message}`
    };
  }
}

async function testSalesforceConnection(base44, config) {
  try {
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('salesforce');
    const sfBase = config?.instance_url;

    const res = await fetch(`${sfBase}/services/data/v57.0/`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (res.ok) {
      return {
        success: true,
        message: `Connected to Salesforce`,
        details: { instance: sfBase }
      };
    } else {
      return {
        success: false,
        message: `Salesforce authentication failed: ${res.statusText}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Salesforce connection failed: ${error.message}`
    };
  }
}

async function testWebhookConnection(config) {
  try {
    const res = await fetch(config.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true, timestamp: new Date().toISOString() })
    });

    return {
      success: res.ok,
      message: res.ok ? 'Webhook test successful' : `HTTP ${res.status}`,
      status_code: res.status
    };
  } catch (error) {
    return {
      success: false,
      message: `Webhook test failed: ${error.message}`
    };
  }
}