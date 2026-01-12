import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bank_transfer_id, bank_account_id } = await req.json();

    if (!bank_transfer_id || !bank_account_id) {
      return Response.json({ error: 'bank_transfer_id and bank_account_id required' }, { status: 400 });
    }

    // Laden BankTransfer und BankAccount
    const transfers = await base44.entities.BankTransfer.filter({ id: bank_transfer_id });
    if (!transfers || transfers.length === 0) {
      return Response.json({ error: 'BankTransfer not found' }, { status: 404 });
    }
    const transfer = transfers[0];

    if (transfer.status !== 'approved') {
      return Response.json({ error: `Transfer must be in 'approved' status, current: ${transfer.status}` }, { status: 400 });
    }

    const accounts = await base44.entities.BankAccount.filter({ id: bank_account_id });
    if (!accounts || accounts.length === 0) {
      return Response.json({ error: 'BankAccount not found' }, { status: 404 });
    }
    const account = accounts[0];

    // finAPI API Call - Payment Initiation
    const finapiResponse = await fetch(`${Deno.env.get('FINAPI_BASE_URL')}/api/v2/payments/moneyTransfers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('FINAPI_CLIENT_ID')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountId: account.finapi_account_id,
        amount: transfer.amount,
        purpose: transfer.purpose,
        recipientName: transfer.recipient_name,
        recipientIban: transfer.recipient_iban,
        recipientBic: transfer.recipient_bic || undefined
      })
    });

    const finapiData = await finapiResponse.json();

    if (!finapiResponse.ok) {
      // Update Transfer Status to failed
      await base44.entities.BankTransfer.update(bank_transfer_id, {
        status: 'failed',
        error_message: finapiData.message || 'finAPI error'
      });

      return Response.json({
        success: false,
        error: finapiData.message || 'finAPI payment initiation failed'
      }, { status: 400 });
    }

    // Extract payment_id and TAN requirements
    const payment_id = finapiData.id;
    const tan_required = !!finapiData.twoStepProcedure;
    const challenge = finapiData.multiStepAuthentication;

    // Update BankTransfer mit finAPI Payment ID
    await base44.entities.BankTransfer.update(bank_transfer_id, {
      status: tan_required ? 'pending_tan' : 'executing',
      finapi_payment_id: payment_id,
      executed_at: !tan_required ? new Date().toISOString() : undefined
    });

    // Log Activity
    console.log(`[finapiInitiateTransfer] Transfer ${bank_transfer_id} initiated. PaymentID: ${payment_id}, TAN required: ${tan_required}`);

    return Response.json({
      success: true,
      payment_id,
      tan_required,
      challenge_type: challenge?.procedureName || null,
      challenge_message: challenge?.challengeMessage || null
    });

  } catch (error) {
    console.error('[finapiInitiateTransfer] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});