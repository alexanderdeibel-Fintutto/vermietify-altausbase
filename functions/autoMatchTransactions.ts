import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { description, amount, limit = 3 } = await req.json();

    // Get all invoices
    const invoices = await base44.entities.Invoice.list();
    
    // Score each invoice based on similarity
    const scored = invoices
      .filter(inv => Math.abs(inv.amount - amount) < amount * 0.1) // Within 10%
      .map(inv => {
        const descMatch = description.toLowerCase().includes(inv.description?.toLowerCase() || '');
        const recipientMatch = description.toLowerCase().includes(inv.recipient?.toLowerCase() || '');
        const confidence = (descMatch ? 60 : 0) + (recipientMatch ? 30 : 0) + 10;
        
        return { ...inv, confidence };
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);

    return Response.json({ suggestions: scored });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});