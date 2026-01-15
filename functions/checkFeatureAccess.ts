import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { userEmail, featureCode } = await req.json();

    try {
        // Nutzer-Subscription laden
        const subscription = await base44.entities.UserSubscription.filter({
            user_email: userEmail,
            status: { $in: ['ACTIVE', 'TRIAL'] }
        });

        if (!subscription || subscription.length === 0) {
            return new Response(JSON.stringify({
                allowed: false,
                reason: 'NO_SUBSCRIPTION',
                message: 'Bitte wähle einen Tarif'
            }), { status: 200 });
        }

        const sub = subscription[0];
        const plan = await base44.entities.SubscriptionPlan.get(sub.plan_id);

        // Features aus JSON-String parsen
        const features = JSON.parse(plan.features || '[]');

        // Feature prüfen
        if (!features.includes(featureCode)) {
            const minPlan = getMinPlanForFeature(featureCode);
            return new Response(JSON.stringify({
                allowed: false,
                reason: 'FEATURE_NOT_INCLUDED',
                message: `Dieses Feature ist ab dem ${minPlan}-Tarif verfügbar`,
                upgrade_cta: true
            }), { status: 200 });
        }

        return new Response(JSON.stringify({ allowed: true }), { status: 200 });

    } catch (error) {
        console.error('Error in checkFeatureAccess:', error);
        return new Response(JSON.stringify({ 
            allowed: false, 
            reason: 'ERROR',
            message: error.message 
        }), { status: 500 });
    }
});

function getMinPlanForFeature(featureCode) {
    const featurePlans = {
        'basic_management': 'Starter',
        'document_upload': 'Starter',
        'invoice_generation': 'Basic',
        'bank_sync': 'Pro',
        'ocr_basic': 'Pro',
        'ocr_pro': 'Business',
        'datev_export': 'Business',
        'api_access': 'Business'
    };
    return featurePlans[featureCode] || 'Business';
}