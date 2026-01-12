import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bank_transfer_id, tan } = await req.json();

    if (!bank_transfer_id) {
      return Response.json({ error: 'bank_transfer_id required' }, { status: 400 });
    }

    // Laden BankTransfer
    const transfers = await base44.entities.BankTransfer.filter({ id: bank_transfer_id });
    if (!transfers || transfers.length === 0) {
      return Response.json({ error: 'BankTransfer not found' }, { status: 404 });
    }
    const transfer = transfers[0];

    if (transfer.status !== 'pending_tan') {
      return Response.json({ error: `Transfer must be in 'pending_tan' status, current: ${transfer.status}` }, { status: 400 });
    }

    if (!transfer.finapi_payment_id) {
      return Response.json({ error: 'finapi_payment_id missing' }, { status: 400 });
    }

    // finAPI TAN Submit
    const finapiResponse = await fetch(
      `${Deno.env.get('FINAPI_BASE_URL')}/api/v2/payments/moneyTransfers/${transfer.finapi_payment_id}/submit`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('FINAPI_CLIENT_ID')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tan: tan || undefined
        })
      }
    );

    const finapiData = await finapiResponse.json();

    if (!finapiResponse.ok) {
      // Update Transfer to failed
      await base44.entities.BankTransfer.update(bank_transfer_id, {
        status: 'failed',
        error_message: finapiData.message || 'TAN submission failed'
      });

      return Response.json({
        success: false,
        error: finapiData.message || 'TAN submission failed'
      }, { status: 400 });
    }

    // Update BankTransfer to completed
    const now = new Date().toISOString();
    await base44.entities.BankTransfer.update(bank_transfer_id, {
      status: 'completed',
      executed_at: now
    });

    console.log(`[finapiSubmitTan] Transfer ${bank_transfer_id} completed. Executed: ${now}`);

    return Response.json({
      success: true,
      status: 'completed',
      executed_at: now
    });

  } catch (error) {
    console.error('[finapiSubmitTan] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});