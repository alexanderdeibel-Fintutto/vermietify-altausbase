import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { asset_id, gain_loss } = await req.json();

        // Hole Asset
        const [asset] = await base44.asServiceRole.entities.Asset.filter({ id: asset_id });
        if (!asset) {
            return Response.json({ error: 'Asset not found' }, { status: 404 });
        }

        // Bestimme Teilfreistellungsquote nach § 20 InvStG
        const exemptionMap = {
            'equity_fund_30': 0.30,      // Aktienfonds (>50% Aktien)
            'mixed_fund_15': 0.15,       // Mischfonds (25-50% Aktien)
            'real_estate_fund_60': 0.60, // Immobilienfonds (>50% Immobilien)
            'bond_fund_0': 0,            // Rentenfonds
            'standard': 0                // Keine Teilfreistellung
        };

        let partialExemptionRate = 0;
        
        // Prüfe Asset-Klasse und Steuerkategorie
        if (asset.asset_class === 'etf' || asset.asset_class === 'bond') {
            partialExemptionRate = exemptionMap[asset.tax_category] || 0;
        }

        // Berechne Beträge
        const exemptAmount = gain_loss * partialExemptionRate;
        const taxableAmount = gain_loss - exemptAmount;

        const result = {
            asset_name: asset.name,
            asset_class: asset.asset_class,
            tax_category: asset.tax_category,
            gain_loss: gain_loss,
            partial_exemption_rate: partialExemptionRate,
            exempt_amount: exemptAmount,
            taxable_amount: taxableAmount,
            explanation: getExemptionExplanation(asset.tax_category, partialExemptionRate)
        };

        return Response.json(result);

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function getExemptionExplanation(taxCategory, rate) {
    const explanations = {
        'equity_fund_30': 'Aktienfonds mit >50% Aktienanteil: 30% Teilfreistellung nach § 20 InvStG',
        'mixed_fund_15': 'Mischfonds mit 25-50% Aktienanteil: 15% Teilfreistellung nach § 20 InvStG',
        'real_estate_fund_60': 'Immobilienfonds mit >50% Immobilienanteil: 60% Teilfreistellung nach § 20 InvStG',
        'bond_fund_0': 'Rentenfonds: Keine Teilfreistellung',
        'standard': 'Keine Teilfreistellung anwendbar'
    };

    return explanations[taxCategory] || `${rate * 100}% Teilfreistellung`;
}