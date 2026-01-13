import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stripeKey = Deno.env.get('STRIPE_API_KEY');
    if (!stripeKey) {
      return Response.json({ error: 'Stripe not configured' }, { status: 400 });
    }

    const { action, amount, description, customerId } = await req.json();

    if (action === 'create-payment-intent') {
      // Create payment intent
      const response = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'eur',
          description: description,
          customer: customerId,
          metadata: {
            user_email: user.email
          }
        })
      });

      const intent = await response.json();
      
      if (intent.error) {
        throw new Error(intent.error.message);
      }

      return Response.json({
        success: true,
        client_secret: intent.client_secret,
        intent_id: intent.id
      });
    }

    if (action === 'create-charge') {
      // Create charge
      const response = await fetch('https://api.stripe.com/v1/charges', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          amount: Math.round(amount * 100),
          currency: 'eur',
          customer: customerId,
          description: description
        })
      });

      const charge = await response.json();

      if (charge.error) {
        throw new Error(charge.error.message);
      }

      // Save transaction
      await base44.entities.StripeTransaction?.create?.({
        charge_id: charge.id,
        amount: amount,
        currency: 'eur',
        status: charge.status,
        customer_id: customerId
      });

      return Response.json({
        success: true,
        charge_id: charge.id,
        status: charge.status
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('Stripe error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});