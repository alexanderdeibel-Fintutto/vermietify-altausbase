import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { portfolioId, userId, sections } = await req.json();

    console.log(`Generating report for portfolio ${portfolioId}, sections: ${sections.join(',')}`);

    // Fetch portfolio data
    const portfolios = await base44.asServiceRole.entities.AssetPortfolio.filter({
      user_id: userId
    });

    const portfolio = portfolios.find(p => p.id === portfolioId);
    if (!portfolio) {
      return Response.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Fetch related data
    const allAssets = portfolios;
    const benchmarks = await base44.asServiceRole.entities.PortfolioBenchmark.filter({
      portfolio_id: portfolioId
    });

    // Build report content
    let reportData = {
      title: `Portfolio Report - ${portfolio.name}`,
      generated_date: new Date().toISOString(),
      sections: {}
    };

    if (sections.includes('summary')) {
      const totalValue = allAssets.reduce((sum, a) => sum + (a.quantity * a.current_value), 0);
      const totalInvested = allAssets.reduce((sum, a) => sum + (a.quantity * a.purchase_price), 0);
      reportData.sections.summary = {
        total_value: totalValue,
        total_invested: totalInvested,
        gain_loss: totalValue - totalInvested,
        gain_loss_percent: ((totalValue - totalInvested) / totalInvested * 100)
      };
    }

    if (sections.includes('allocation')) {
      const allocation = {};
      allAssets.forEach(asset => {
        allocation[asset.asset_category] = (allocation[asset.asset_category] || 0) + (asset.quantity * asset.current_value);
      });
      reportData.sections.allocation = allocation;
    }

    if (sections.includes('benchmarks')) {
      reportData.sections.benchmarks = benchmarks;
    }

    // Store report metadata
    const reportId = `report_${Date.now()}`;
    
    // In production, generate actual PDF
    const pdf_url = `https://example.com/reports/${reportId}.pdf`;

    console.log(`Report generated: ${reportId}`);

    return Response.json({
      success: true,
      report_id: reportId,
      pdf_url: pdf_url,
      data: reportData
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});