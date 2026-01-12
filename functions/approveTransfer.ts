import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Admin-Check: Nur Admins können genehmigen
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    const { transfer_draft_id, approved = true, rejection_reason = null } = await req.json();

    const transfer = await base44.entities.TransferDraft.get(transfer_draft_id);
    if (!transfer) {
      return Response.json({ error: 'Transfer nicht gefunden' }, { status: 404 });
    }

    if (transfer.status !== 'EINGEREICHT') {
      return Response.json({ error: 'Transfer kann nicht genehmigt werden' }, { status: 400 });
    }

    if (approved) {
      // Genehmigung
      await base44.entities.TransferDraft.update(transfer_draft_id, {
        status: 'GENEHMIGT',
        approved_by: user.email,
        approved_at: new Date().toISOString(),
      });

      console.log(`[Transfer] Approved: ${transfer_draft_id}, Amount: ${transfer.amount}€`);

      return Response.json({
        status: 'GENEHMIGT',
        message: 'Überweisung genehmigt. Wird versendet...'
      });
    } else {
      // Ablehnung
      await base44.entities.TransferDraft.update(transfer_draft_id, {
        status: 'ABGELEHNT',
        approved_by: user.email,
        approved_at: new Date().toISOString(),
        error_message: rejection_reason || 'Durch Admin abgelehnt'
      });

      console.log(`[Transfer] Rejected: ${transfer_draft_id}, Reason: ${rejection_reason}`);

      return Response.json({
        status: 'ABGELEHNT',
        message: 'Überweisung abgelehnt'
      });
    }
  } catch (error) {
    console.error('[Approval] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});