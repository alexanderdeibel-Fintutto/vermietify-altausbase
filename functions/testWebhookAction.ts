import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { webhook_config, test_data } = await req.json();

  const { url, method = 'POST', headers = [], body, auth_type } = webhook_config;

  const requestHeaders = {
    'Content-Type': 'application/json'
  };

  headers.forEach(h => {
    if (h.key && h.value) {
      requestHeaders[h.key] = h.value;
    }
  });

  if (auth_type === 'bearer' && webhook_config.auth_token) {
    requestHeaders['Authorization'] = `Bearer ${webhook_config.auth_token}`;
  } else if (auth_type === 'basic' && webhook_config.auth_username && webhook_config.auth_password) {
    const credentials = btoa(`${webhook_config.auth_username}:${webhook_config.auth_password}`);
    requestHeaders['Authorization'] = `Basic ${credentials}`;
  } else if (auth_type === 'api_key' && webhook_config.api_key_header && webhook_config.api_key_value) {
    requestHeaders[webhook_config.api_key_header] = webhook_config.api_key_value;
  }

  const requestBody = body ? replacePlaceholders(body, {
    ...test_data,
    entity_id: 'test-123',
    timestamp: new Date().toISOString(),
    user_email: user.email
  }) : JSON.stringify({ test: true });

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: method !== 'GET' ? requestBody : undefined
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return Response.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      response: responseData,
      request: {
        url,
        method,
        headers: requestHeaders,
        body: requestBody
      }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});

function replacePlaceholders(template, data) {
  if (!template) return template;
  
  let result = template;
  
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, data[key] || '');
  });

  result = result.replace(/{{data}}/g, JSON.stringify(data));
  
  return result;
}