import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Check if user has completed onboarding
 * Returns redirect info if needed
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has completed onboarding
        const isOnboarded = user.onboarding_completed === true;

        if (!isOnboarded) {
            // Check if tax profile exists
            const profiles = await base44.asServiceRole.entities.TaxProfile.filter(
                { user_email: user.email },
                '-updated_date',
                1
            );

            if (profiles.length === 0) {
                return Response.json({
                    needs_onboarding: true,
                    redirect_to: '/onboarding-wizard',
                    message: 'Please complete onboarding'
                });
            }
        }

        return Response.json({
            needs_onboarding: false,
            onboarding_completed_at: user.onboarding_completed_at
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});