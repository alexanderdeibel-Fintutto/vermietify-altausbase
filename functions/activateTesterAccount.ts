import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { token, name, password, agreed_to_tracking } = body;

    if (!token || !name || !password) {
      return Response.json({
        success: false,
        error: 'Erforderliche Felder fehlen'
      }, { status: 400 });
    }

    // Initialize service-role client for admin operations
    const base44 = createClientFromRequest(req);

    // Step 1: Validate token
    const invitations = await base44.asServiceRole.entities.TesterInvitation.filter({
      invitation_token: token
    });

    if (!invitations || invitations.length === 0) {
      return Response.json({
        success: false,
        error: 'Token nicht gefunden'
      }, { status: 400 });
    }

    const invitation = invitations[0];

    // Verify status
    if (invitation.status !== 'pending') {
      return Response.json({
        success: false,
        error: `Einladung hat Status: ${invitation.status}`
      }, { status: 400 });
    }

    // Verify not expired
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      return Response.json({
        success: false,
        error: 'Einladungs-Token ist abgelaufen'
      }, { status: 400 });
    }

    // Step 2: Create User with hashed password
    // Note: Base44 SDK handles password hashing automatically
    const userEmail = invitation.invited_email;
    
    // Check if user already exists
    const existingUsers = await base44.asServiceRole.entities.User.filter({
      email: userEmail
    });

    let userId;
    if (existingUsers && existingUsers.length > 0) {
      userId = existingUsers[0].id;
    } else {
      // Create new user with admin role for testing
      const newUser = await base44.asServiceRole.entities.User.create({
        email: userEmail,
        full_name: name,
        role: 'admin' // Tester get admin access
      });
      userId = newUser.id;

      // Update password via auth endpoint (secure)
      await base44.asServiceRole.auth.setUserPassword(userId, password);
    }

    // Step 3: Create TestAccount
    const testAccount = await base44.asServiceRole.entities.TestAccount.create({
      tester_id: userId,
      invitation_id: invitation.id,
      tester_name: name,
      test_email: userEmail,
      simulated_role: 'admin',
      package_level: 'enterprise',
      is_active: true,
      created_at_timestamp: new Date().toISOString(),
      first_login: new Date().toISOString(),
      metadata: {
        onboarded_at: new Date().toISOString(),
        agreed_to_tracking: agreed_to_tracking
      }
    });

    // Step 4: Create UserPackageConfiguration (all modules enabled)
    const expiresIn30Days = new Date();
    expiresIn30Days.setDate(expiresIn30Days.getDate() + 30);

    await base44.asServiceRole.entities.UserPackageConfiguration.create({
      user_id: userId,
      package_type: 'easyVermieter',
      max_buildings: 999,
      max_units: 999,
      additional_modules: [
        'dokumentation',
        'kommunikation',
        'aufgaben',
        'elster',
        'banking',
        'contracts'
      ],
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: expiresIn30Days.toISOString().split('T')[0],
      price_per_month: 0,
      is_active: true
    });

    // Step 5: Create NavigationState with full feature access
    const visibleFeatures = [
      'dashboard',
      'immobilien',
      'mieter',
      'finanzen',
      'steuer',
      'kommunikation',
      'aufgaben',
      'dokumentation',
      'elster',
      'einstellungen'
    ];

    await base44.asServiceRole.entities.NavigationState.create({
      user_id: userId,
      computed_navigation: {
        main_sections: visibleFeatures
      },
      visible_features: visibleFeatures,
      system_state: {
        is_tester: true,
        test_account_id: testAccount.id,
        onboarded: true
      }
    });

    // Step 6: Seed test data for tester
    try {
      await base44.asServiceRole.functions.invoke('seedTestData', {});
    } catch (err) {
      console.log('Could not seed test data:', err.message);
    }

    // Step 7: Log initial activity
    await base44.asServiceRole.entities.TesterActivity.create({
      test_account_id: testAccount.id,
      session_id: `init_${Date.now()}`,
      activity_type: 'login',
      timestamp: new Date().toISOString(),
      metadata: {
        onboarding_completed: true,
        agreed_to_tracking: agreed_to_tracking
      }
    });

    // Step 7: Update TesterInvitation status
    await base44.asServiceRole.entities.TesterInvitation.update(invitation.id, {
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      accepted_by: userEmail
    });

    return Response.json({
      success: true,
      user_id: userId,
      test_account_id: testAccount.id,
      message: 'Test-Account erfolgreich aktiviert'
    });
  } catch (error) {
    console.error('Account activation error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Fehler bei Account-Erstellung'
    }, { status: 500 });
  }
});