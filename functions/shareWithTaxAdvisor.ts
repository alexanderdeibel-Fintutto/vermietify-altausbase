import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { advisor_email, tax_year, country, data_types } = await req.json();

    if (!advisor_email || !tax_year) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const shareRecord = await base44.entities.PortfolioShare.create({
      portfolio_id: `tax_${country}_${tax_year}`,
      shared_by_user_id: user.id,
      shared_with_email: advisor_email,
      permission_level: 'view',
      share_type: 'advisor',
      advisor_role: 'tax_advisor'
    });

    await base44.integrations.Core.SendEmail({
      to: advisor_email,
      subject: `Tax Data Sharing Request from ${user.full_name}`,
      body: `You have been invited to view tax data for ${tax_year} in ${country}. 
      
Please log in to the platform to access the shared information.

Shared data types: ${(data_types || []).join(', ')}`
    });

    return Response.json({
      success: true,
      share_id: shareRecord.id,
      advisor_email,
      message: 'Tax advisor invitation sent successfully'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});