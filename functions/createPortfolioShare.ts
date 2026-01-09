import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function generateShareToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      portfolioId,
      sharedByUserId,
      sharedWithEmail,
      permissionLevel,
      shareType,
      expiresAt
    } = await req.json();

    console.log(`Creating share: ${portfolioId} → ${sharedWithEmail}`);

    const share = await base44.asServiceRole.entities.PortfolioShare.create({
      portfolio_id: portfolioId,
      shared_by_user_id: sharedByUserId,
      shared_with_email: sharedWithEmail,
      permission_level: permissionLevel,
      share_type: shareType,
      share_token: generateShareToken(),
      shared_at: new Date().toISOString(),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null
    });

    // Send notification email
    await base44.functions.invoke('sendPortfolioNotification', {
      userId: sharedByUserId,
      type: 'share_created',
      title: 'Portfolio geteilt',
      message: `Portfolio freigegeben für ${sharedWithEmail} (${permissionLevel})`,
      channels: ['in_app']
    });

    return Response.json({
      success: true,
      share,
      share_link: `${Deno.env.get('APP_URL') || 'https://app.example.com'}/wealth/shared/${share.share_token}`
    });
  } catch (error) {
    console.error('Create share error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});