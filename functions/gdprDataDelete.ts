import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { confirmationToken } = await req.json();

    const user = await base44.auth.me();

    console.log(`GDPR delete request for user ${user.id}`);

    // Get all assets to delete
    const assets = await base44.asServiceRole.entities.AssetPortfolio.filter({
      user_id: user.id
    });

    const shares = await base44.asServiceRole.entities.PortfolioShare.filter({
      shared_by_user_id: user.id
    });

    const comments = await base44.asServiceRole.entities.PortfolioComment.filter({
      author_id: user.id
    });

    // Soft delete - anonymize data
    let deletedCount = 0;

    // Delete assets
    for (const asset of assets) {
      await base44.asServiceRole.entities.AssetPortfolio.delete(asset.id);
      deletedCount++;
    }

    // Delete shares
    for (const share of shares) {
      await base44.asServiceRole.entities.PortfolioShare.delete(share.id);
      deletedCount++;
    }

    // Anonymize comments (keep for audit trail)
    for (const comment of comments) {
      await base44.asServiceRole.entities.PortfolioComment.update(comment.id, {
        content: '[Gelöschter Kommentar]',
        author_email: '[Gelöschter Nutzer]'
      });
    }

    // Log GDPR event
    await base44.asServiceRole.entities.ComplianceAudit.create({
      user_id: user.id,
      audit_type: 'gdpr_delete',
      action: 'User requested complete data deletion',
      requester_id: user.id,
      status: 'completed',
      record_count: deletedCount,
      completion_date: new Date().toISOString()
    });

    return Response.json({
      success: true,
      deleted_records: deletedCount,
      message: 'GDPR Datenlöschung abgeschlossen'
    });
  } catch (error) {
    console.error('GDPR delete error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});