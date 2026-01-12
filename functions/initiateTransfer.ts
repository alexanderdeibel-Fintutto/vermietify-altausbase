import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const {
      bank_account_id,
      transfer_type,
      recipient_name,
      recipient_iban,
      recipient_bic,
      amount,
      purpose,
      reference_id,
      reference_type,
      approval_threshold = 5000
    } = await req.json();

    // Validierung IBAN
    if (!isValidIBAN(recipient_iban)) {
      return Response.json({ error: 'Ungültige IBAN' }, { status: 400 });
    }

    // Bestimme ob Genehmigung erforderlich
    const requires_approval = amount > approval_threshold;

    // Erstelle Transfer-Entwurf
    const transferDraft = await base44.entities.TransferDraft.create({
      bank_account_id,
      transfer_type,
      recipient_name,
      recipient_iban,
      recipient_bic: recipient_bic || null,
      amount,
      currency: 'EUR',
      purpose: purpose.substring(0, 140),
      reference_id,
      reference_type,
      status: 'ENTWURF',
      created_by: user.email,
      requires_approval,
      approval_threshold,
      tan_required: true,
      tan_verified: false,
    });

    console.log(`[Transfer] Draft created: ${transferDraft.id}, Amount: ${amount}€, RequiresApproval: ${requires_approval}`);

    return Response.json({
      transferDraftId: transferDraft.id,
      status: 'ENTWURF',
      requires_approval,
      requires_tan: true,
      message: requires_approval 
        ? 'Überweisung erstellt. Genehmigung erforderlich.'
        : 'Überweisung erstellt. Bitte TAN eingeben.'
    });
  } catch (error) {
    console.error('[Transfer] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function isValidIBAN(iban) {
  if (!iban || !/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(iban)) {
    return false;
  }
  
  const moveFirstFour = iban.slice(4) + iban.slice(0, 4);
  const numerified = moveFirstFour.replace(/[A-Z]/g, (char) => {
    return (char.charCodeAt(0) - 55).toString();
  });
  
  let remainder = numerified;
  while (remainder.length > 2) {
    remainder = (BigInt(remainder.slice(0, 9)) % 97n).toString() + remainder.slice(9);
  }
  
  return BigInt(remainder) % 97n === 1n;
}