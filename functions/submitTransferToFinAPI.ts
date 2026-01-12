import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { transfer_draft_id } = await req.json();

    const transfer = await base44.entities.TransferDraft.get(transfer_draft_id);
    if (!transfer) {
      return Response.json({ error: 'Transfer nicht gefunden' }, { status: 404 });
    }

    // Prüfe: TAN verifiziert UND (keine Genehmigung nötig ODER genehmigt)
    if (!transfer.tan_verified) {
      return Response.json({ error: 'TAN nicht verifiziert' }, { status: 400 });
    }

    if (transfer.requires_approval && transfer.status !== 'GENEHMIGT') {
      return Response.json({ error: 'Genehmigung erforderlich' }, { status: 400 });
    }

    // Hole Bank Account
    const bankAccount = await base44.entities.BankAccount.get(transfer.bank_account_id);
    if (!bankAccount) {
      return Response.json({ error: 'Bankkonto nicht gefunden' }, { status: 404 });
    }

    // Rufe finAPI auf
    const finapiBaseUrl = Deno.env.get('FINAPI_BASE_URL') || 'https://banking-sandbox.finapi.io';
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('finapi');

    const response = await fetch(`${finapiBaseUrl}/api/v1/accounts/${bankAccount.finapi_account_id}/execSepa`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountNumber: bankAccount.account_number,
        bankCode: bankAccount.bank_code,
        orderedAmount: transfer.amount,
        orderDate: new Date().toISOString().split('T')[0],
        recipientName: transfer.recipient_name,
        recipientIban: transfer.recipient_iban,
        recipientBic: transfer.recipient_bic,
        purpose: transfer.purpose,
        singleStep: false, // Ermöglicht TAN-Verifikation
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`finAPI error: ${error.errors?.[0]?.message || 'Unknown error'}`);
    }

    const data = await response.json();

    // Update Transfer mit finAPI Response
    await base44.entities.TransferDraft.update(transfer_draft_id, {
      status: 'VERSENDET',
      finapi_transaction_id: data.id,
      tracking_number: data.executionId,
      sent_at: new Date().toISOString(),
    });

    console.log(`[Transfer] Submitted to finAPI: ${transfer_draft_id}, finAPI ID: ${data.id}`);

    return Response.json({
      status: 'VERSENDET',
      finapi_id: data.id,
      tracking_number: data.executionId,
      message: 'Überweisung versendet',
      executionId: data.executionId
    });
  } catch (error) {
    console.error('[Submit finAPI] Error:', error);
    
    // Update Transfer mit Fehlerstatus
    if (req.json().transfer_draft_id) {
      const transferDraftId = req.json().transfer_draft_id;
      try {
        await base44.entities.TransferDraft.update(transferDraftId, {
          status: 'FEHLER',
          error_message: error.message
        });
      } catch (updateError) {
        console.error('[Update Error] Could not update transfer:', updateError);
      }
    }
    
    return Response.json({ error: error.message }, { status: 500 });
  }
});