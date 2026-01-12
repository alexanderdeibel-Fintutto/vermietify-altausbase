import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { assetTransactionId, bankTransactionId } = body;

    // Match transaction
    await base44.asServiceRole.entities.AssetTransaction.update(assetTransactionId, {
      matched_bank_transaction_id: bankTransactionId
    });

    return Response.json({ success: true, matched: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});