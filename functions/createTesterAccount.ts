import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { data } = await req.json();
    const { invitationToken, testerEmail } = data;

    // Verify invitation
    const invitations = await base44.asServiceRole.entities.TesterInvitation.filter({ 
      invitation_token: invitationToken,
      status: 'pending'
    });

    if (invitations.length === 0) {
      return Response.json({ error: 'Invalid or expired invitation' }, { status: 400 });
    }

    const invitation = invitations[0];

    // Check if invitation expired
    if (new Date(invitation.expires_at) < new Date()) {
      return Response.json({ error: 'Invitation expired' }, { status: 400 });
    }

    // Invite user with special tester role
    await base44.users.inviteUser(testerEmail, 'admin');

    // Mark invitation as accepted
    await base44.asServiceRole.entities.TesterInvitation.update(invitation.id, {
      status: 'accepted',
      used_at: new Date().toISOString()
    });

    // Create UserPackageConfiguration for unlimited access
    const users = await base44.asServiceRole.entities.User.filter({ email: testerEmail });
    
    if (users.length > 0) {
      const user = users[0];
      
      await base44.asServiceRole.entities.UserPackageConfiguration.create({
        user_id: user.id,
        package_type: 'easyVermieter',
        max_buildings: 999,
        max_units: 999,
        additional_modules: ['dokumentation', 'kommunikation', 'aufgaben', 'analytics', 'ai'],
        valid_from: new Date().toISOString(),
        valid_until: null,
        price_per_month: 0,
        is_active: true
      });

      // Create initial onboarding record
      await base44.asServiceRole.entities.UserOnboarding.create({
        user_id: user.id,
        completed_steps: [],
        onboarding_progress: 0,
        feature_usage: {},
        data_quality_score: 0,
        days_since_signup: 0,
        user_level: 'beginner'
      });
    }

    return Response.json({ 
      success: true, 
      message: 'Tester account created successfully'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});