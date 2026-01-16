import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { connected_account_id } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const connectedAccount = await base44.entities.StripeConnectedAccount.filter({ id: connected_account_id });

        if (!connectedAccount[0]) {
            return Response.json({ error: 'Account nicht gefunden' }, { status: 404 });
        }

        const accountLink = await stripe.accountLinks.create({
            account: connectedAccount[0].stripe_account_id,
            refresh_url: `${Deno.env.get('BASE_URL') || 'https://fintutto.de'}/partner/onboarding/refresh`,
            return_url: `${Deno.env.get('BASE_URL') || 'https://fintutto.de'}/partner/onboarding/complete`,
            type: 'account_onboarding',
            collect: 'eventually_due',
        });

        await base44.asServiceRole.entities.StripeConnectedAccount.update(connected_account_id, {
            onboarding_link: accountLink.url,
        });

        return Response.json({
            success: true,
            onboarding_url: accountLink.url,
        });

    } catch (error) {
        console.error('Refresh link error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});