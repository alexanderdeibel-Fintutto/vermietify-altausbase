import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, taxYear, formats = ['xml'] } = await req.json();

    console.log(`Batch tax export for ${userId}, year ${taxYear}`);

    const exports = [];

    // Generate ELSTER XML
    if (formats.includes('xml')) {
      const xmlRes = await base44.functions.invoke('generateELSTERXML', {
        userId,
        taxYear
      });
      exports.push({
        format: 'ELSTER-XML',
        file_url: xmlRes.file_url,
        file_name: xmlRes.file_name
      });
    }

    // Calculate all
    const [kap, so, vg] = await Promise.all([
      base44.functions.invoke('calculateTaxKAP', { userId, taxYear, federalState: 'DE' }),
      base44.functions.invoke('calculateTaxSO', { userId, taxYear }),
      base44.functions.invoke('calculateTaxVG', { userId, taxYear })
    ]);

    return Response.json({
      success: true,
      exports,
      summary: {
        anlageKAP: {
          taxableIncome: kap.result.totals.taxableIncome,
          tax: kap.result.calculations.abgeltungssteuer
        },
        anlageSO: {
          taxableIncome: so.result.threshold.taxable,
          isFreeFromTax: so.result.threshold.isExempt
        },
        anlageVG: {
          taxableGains: vg.result.totals.taxableAfterThreshold,
          exemptGains: vg.result.totals.exemptGains
        }
      }
    });
  } catch (error) {
    console.error('Batch export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});