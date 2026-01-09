import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    console.log(`GDPR export for user ${user.id}`);

    // Collect all user data
    const assets = await base44.asServiceRole.entities.AssetPortfolio.filter({
      user_id: user.id
    });

    const shares = await base44.asServiceRole.entities.PortfolioShare.filter({
      shared_by_user_id: user.id
    });

    const activities = await base44.asServiceRole.entities.TeamActivityLog.filter({
      user_id: user.id
    });

    const recommendations = await base44.asServiceRole.entities.AIRecommendation.filter({
      user_id: user.id
    });

    const taxCalc = await base44.asServiceRole.entities.TaxCalculation.filter({
      user_id: user.id
    });

    // Create export package
    const exportData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role,
        exported_at: new Date().toISOString()
      },
      assets: assets.map(a => ({
        id: a.id,
        name: a.name,
        category: a.asset_category,
        value: a.current_value,
        quantity: a.quantity,
        currency: a.currency
      })),
      shares: shares,
      activities: activities,
      recommendations: recommendations,
      tax_calculations: taxCalc,
      summary: {
        total_assets: assets.length,
        total_shares: shares.length,
        total_activities: activities.length
      }
    };

    // Upload as JSON file
    const jsonStr = JSON.stringify(exportData, null, 2);
    const fileResponse = await base44.integrations.Core.UploadFile({
      file: jsonStr
    });

    // Log GDPR event
    await base44.asServiceRole.entities.ComplianceAudit.create({
      user_id: user.id,
      audit_type: 'gdpr_export',
      action: 'User requested data export',
      requester_id: user.id,
      status: 'completed',
      record_count: assets.length,
      files_created: [fileResponse.file_url],
      completion_date: new Date().toISOString()
    });

    return Response.json({
      success: true,
      file_url: fileResponse.file_url,
      data_summary: exportData.summary,
      message: 'GDPR Datenexport erstellt'
    });
  } catch (error) {
    console.error('GDPR export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});