import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenant_id, invoice_id, amount, description } = await req.json();

    if (!tenant_id || !amount) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get tenant info
    const tenant = await base44.entities.Tenant.read(tenant_id);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: description || 'Mietzahlung',
            },
            unit_amount: Math.round(amount),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: tenant.email,
      success_url: `${Deno.env.get('APP_URL')}/tenant-portal?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('APP_URL')}/tenant-portal?payment=cancelled`,
      metadata: {
        tenant_id,
        invoice_id: invoice_id || 'custom',
        user_id: user.id,
      },
    });

    // Create payment record in pending state
    const payment = await base44.entities.Payment.create({
      tenant_id,
      amount: amount / 100,
      payment_date: new Date().toISOString(),
      payment_method: 'stripe',
      status: 'pending',
      description: description || 'Mietzahlung',
      stripe_session_id: session.id,
      reference_number: session.id,
    });

    return Response.json({
      checkout_url: session.url,
      session_id: session.id,
      payment_id: payment.id,
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});