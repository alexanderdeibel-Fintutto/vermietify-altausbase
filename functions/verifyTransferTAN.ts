import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { transfer_draft_id, tan_value } = await req.json();

    // Hole Transfer-Entwurf
    const transfer = await base44.entities.TransferDraft.get(transfer_draft_id);
    if (!transfer) {
      return Response.json({ error: 'Transfer nicht gefunden' }, { status: 404 });
    }

    if (transfer.status !== 'ENTWURF') {
      return Response.json({ error: 'Transfer kann nicht mehr geändert werden' }, { status: 400 });
    }

    // TODO: TAN gegen finAPI verifizieren
    // Für jetzt: Einfache Validierung (6 Ziffern)
    if (!/^\d{6}$/.test(tan_value)) {
      return Response.json({ error: 'Ungültige TAN (6 Ziffern erforderlich)' }, { status: 400 });
    }

    // In Produktivcode: TAN über finAPI mit challengeId verifizieren
    // const finapiResponse = await finapi.verifyChallenge(transfer.finapi_challenge_id, tan_value);

    // Update Transfer als TAN-verifiziert
    const updated = await base44.entities.TransferDraft.update(transfer_draft_id, {
      tan_verified: true,
      tan_value: encryptTAN(tan_value), // Verschlüsseln
      status: transfer.requires_approval ? 'EINGEREICHT' : 'GENEHMIGT',
      approved_by: transfer.requires_approval ? null : user.email,
      approved_at: transfer.requires_approval ? null : new Date().toISOString(),
    });

    console.log(`[Transfer] TAN verified: ${transfer_draft_id}`);

    return Response.json({
      status: updated.status,
      message: transfer.requires_approval
        ? 'TAN verifiziert. Überweisung wartet auf Genehmigung.'
        : 'TAN verifiziert. Überweisung wird versendet...'
    });
  } catch (error) {
    console.error('[TAN Verify] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function encryptTAN(tan) {
  // Placeholder: In Produktiv mit echtem Encryption
  return Buffer.from(tan).toString('base64');
}