import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const FINAPI_BASE_URL = Deno.env.get('FINAPI_BASE_URL');
    const FINAPI_CLIENT_ID = Deno.env.get('FINAPI_CLIENT_ID');
    const FINAPI_CLIENT_SECRET = Deno.env.get('FINAPI_CLIENT_SECRET');

    // Create FinAPI user
    const finapi_user = await fetch(`${FINAPI_BASE_URL}/api/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(FINAPI_CLIENT_ID + ':' + FINAPI_CLIENT_SECRET)}`
      },
      body: JSON.stringify({
        id: user.email.replace('@', '_').replace(/\./g, '_'),
        email: user.email
      })
    });

    const finapi_data = await finapi_user.json();

    // Save connection
    const profile = await base44.entities.TaxProfile.filter(
      { user_email: user.email },
      '-updated_date',
      1
    );

    if (profile.length > 0) {
      await base44.entities.TaxProfile.update(profile[0].id, {
        finapi_connected: true
      });
    }

    // Create auth link for user to connect accounts
    const authLinkRes = await fetch(`${FINAPI_BASE_URL}/api/v1/oAuthToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(FINAPI_CLIENT_ID + ':' + FINAPI_CLIENT_SECRET)}`
      },
      body: JSON.stringify({
        grant_type: 'client_credentials'
      })
    });

    const authData = await authLinkRes.json();

    return Response.json({
      user_email: user.email,
      finapi_user_id: finapi_data.id,
      finapi_setup_ready: true,
      next_step: 'redirect_to_finapi_connect',
      authorization_token: authData.access_token
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});