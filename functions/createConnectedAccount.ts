import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { partner_id, partner_type, email, business_name, business_type = 'individual' } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const mccCodes = {
            HANDWERKER: '1520',
            STEUERBERATER: '7392',
            MAKLER: '6531',
            VERSICHERUNG: '6411',
            SONSTIGE: '7299'
        };

        const account = await stripe.accounts.create({
            type: 'express',
            country: 'DE',
            email: email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
                sepa_debit_payments: { requested: true },
            },
            business_type: business_type,
            business_profile: {
                mcc: mccCodes[partner_type] || '1520',
                url: 'https://fintutto.de',
                name: business_name,
            },
            metadata: {
                partner_id: partner_id,
                partner_type: partner_type,
                created_by: user.email,
            },
            settings: {
                payouts: {
                    schedule: {
                        interval: 'daily',
                        delay_days: 2,
                    },
                },
            },
        });

        const connectedAccountRecord = await base44.asServiceRole.entities.StripeConnectedAccount.create({
            partner_type: partner_type,
            partner_id: partner_id,
            stripe_account_id: account.id,
            account_status: 'PENDING',
            onboarding_completed: false,
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            business_type: business_type.toUpperCase(),
            business_name: business_name,
            email: email,
            country: 'DE',
            default_currency: 'EUR',
            total_volume: 0,
            total_fees_collected: 0,
        });

        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${Deno.env.get('BASE_URL') || 'https://fintutto.de'}/partner/onboarding/refresh`,
            return_url: `${Deno.env.get('BASE_URL') || 'https://fintutto.de'}/partner/onboarding/complete`,
            type: 'account_onboarding',
            collect: 'eventually_due',
        });

        await base44.asServiceRole.entities.StripeConnectedAccount.update(connectedAccountRecord.id, {
            onboarding_link: accountLink.url,
        });

        return Response.json({
            success: true,
            account_id: account.id,
            onboarding_url: accountLink.url,
        });

    } catch (error) {
        console.error('Connected account error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});