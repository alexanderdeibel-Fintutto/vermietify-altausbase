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

    const { invoice_id } = await req.json();

    // Hole Invoice Details
    const invoice = await stripe.invoices.retrieve(invoice_id);

    // Verifiziere dass User dieser Invoice gehört
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    if (customers.data.length === 0 || invoice.customer !== customers.data[0].id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Download PDF vom Stripe
    if (!invoice.invoice_pdf) {
      return Response.json({ error: 'PDF not available' }, { status: 404 });
    }

    const response = await fetch(invoice.invoice_pdf);
    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice_${invoice.number}.pdf"`
      }
    });
  } catch (error) {
    console.error('PDF Download Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});