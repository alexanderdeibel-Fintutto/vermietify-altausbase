import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { bank_transaction_id } = await req.json();

    const tx = await base44.asServiceRole.entities.BankTransaction?.read?.(bank_transaction_id);
    if (!tx) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Fetch invoices for matching
    const invoices = await base44.asServiceRole.entities.Invoice?.list?.() || [];

    // Smart matching: amount ±5%, date ±7 days, recipient similarity
    const matches = invoices
      .filter(inv => {
        const amountMatch = Math.abs(inv.amount - tx.amount) / tx.amount < 0.05; // ±5%
        const dateMatch = tx.transaction_date && inv.invoice_date &&
          Math.abs(new Date(tx.transaction_date) - new Date(inv.invoice_date)) / (1000 * 60 * 60 * 24) <= 7; // ±7 days
        const recipientMatch = tx.purpose?.toLowerCase().includes(inv.recipient?.toLowerCase()) ||
          inv.recipient?.toLowerCase().includes(tx.counterparty?.toLowerCase());

        return (amountMatch || dateMatch) && (recipientMatch || (amountMatch && dateMatch));
      })
      .map(inv => ({
        invoice_id: inv.id,
        recipient: inv.recipient,
        amount: inv.amount,
        invoice_date: inv.invoice_date,
        confidence: (
          Math.abs(inv.amount - tx.amount) / tx.amount < 0.01 ? 0.95 : 0.85
        )
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    return Response.json({
      bank_transaction_id,
      amount: tx.amount,
      potential_matches: matches,
      has_matches: matches.length > 0
    });
  } catch (error) {
    console.error('Matching error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});