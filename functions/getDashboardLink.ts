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

        const loginLink = await stripe.accounts.createLoginLink(
            connectedAccount[0].stripe_account_id
        );

        return Response.json({
            success: true,
            dashboard_url: loginLink.url,
        });

    } catch (error) {
        console.error('Dashboard link error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});