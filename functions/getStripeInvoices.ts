import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@15.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Finde Stripe Customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    if (customers.data.length === 0) {
      return Response.json({ invoices: [] });
    }

    const customerId = customers.data[0].id;

    // Hole alle Invoices
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 50
    });

    const formatted = invoices.data.map(invoice => ({
      id: invoice.id,
      created: new Date(invoice.created * 1000),
      amount_paid: invoice.amount_paid,
      amount_due: invoice.amount_due,
      paid: invoice.paid,
      status: invoice.status,
      description: invoice.description || `Invoice ${invoice.number}`,
      invoice_pdf: invoice.invoice_pdf,
      number: invoice.number
    }));

    return Response.json({ invoices: formatted });
  } catch (error) {
    console.error('Stripe Invoices Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});