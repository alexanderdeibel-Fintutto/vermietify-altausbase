import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { asset_holding_id, quantity, sale_price, sale_date } = await req.json();

        // Hole Holding
        const [holding] = await base44.asServiceRole.entities.AssetHolding.filter({ id: asset_holding_id });
        if (!holding) {
            return Response.json({ error: 'Holding not found' }, { status: 404 });
        }

        // Hole Asset
        const [asset] = await base44.asServiceRole.entities.Asset.filter({ id: holding.asset_id });
        if (!asset) {
            return Response.json({ error: 'Asset not found' }, { status: 404 });
        }

        // Hole TaxLots (FIFO)
        const allLots = await base44.asServiceRole.entities.TaxLot.filter({
            asset_holding_id,
            status: ['open', 'partially_sold']
        });
        const taxLots = allLots.sort((a, b) => new Date(a.purchase_date) - new Date(b.purchase_date));

        // Simuliere Verkauf
        let remainingSellQuantity = quantity;
        let totalCostBasis = 0;
        const lotsUsed = [];

        for (const lot of taxLots) {
            if (remainingSellQuantity <= 0) break;

            const quantitySold = Math.min(remainingSellQuantity, lot.remaining_quantity);
            const costBasis = lot.cost_basis_per_unit * quantitySold;
            totalCostBasis += costBasis;

            const purchaseDate = new Date(lot.purchase_date);
            const saleDateTime = new Date(sale_date);
            const holdingPeriodDays = Math.floor((saleDateTime - purchaseDate) / (1000 * 60 * 60 * 24));

            const gainLoss = (sale_price * quantitySold) - costBasis;
            
            let isTaxExempt = false;
            if ((asset.asset_class === 'crypto' || asset.asset_class === 'precious_metal') && holdingPeriodDays > 365) {
                isTaxExempt = true;
            }

            lotsUsed.push({
                purchase_date: lot.purchase_date,
                quantity_sold: quantitySold,
                cost_basis: lot.cost_basis_per_unit,
                gain_loss: gainLoss,
                holding_period_days: holdingPeriodDays,
                is_tax_exempt: isTaxExempt
            });

            remainingSellQuantity -= quantitySold;
        }

        const grossProceeds = sale_price * quantity;
        const grossGainLoss = grossProceeds - totalCostBasis;

        // Bestimme Steuerkategorie
        let taxCategory = 'capital_gains_stocks';
        if (asset.asset_class === 'crypto') taxCategory = 'capital_gains_crypto';
        else if (asset.asset_class === 'precious_metal') taxCategory = 'capital_gains_precious_metals';
        else if (asset.asset_class === 'etf' || asset.asset_class === 'bond') taxCategory = 'capital_gains_funds';

        // Berechne Teilfreistellung
        let partialExemptionRate = 0;
        let taxableGain = grossGainLoss;

        if (taxCategory === 'capital_gains_funds') {
            const exemptionMap = {
                'equity_fund_30': 0.30,
                'mixed_fund_15': 0.15,
                'real_estate_fund_60': 0.60,
                'bond_fund_0': 0
            };
            partialExemptionRate = exemptionMap[asset.tax_category] || 0;
            taxableGain = grossGainLoss * (1 - partialExemptionRate);
        }

        // Prüfe ob steuerfrei (alle Lots müssen steuerfrei sein)
        const allLotsExempt = lotsUsed.every(lot => lot.is_tax_exempt);
        if (allLotsExempt) {
            taxableGain = 0;
        }

        // Berechne Steuer
        const taxRate = 0.26375; // Abgeltungssteuer + Soli
        const estimatedTax = taxableGain > 0 ? taxableGain * taxRate : 0;
        const netProceedsAfterTax = grossProceeds - estimatedTax;

        // Generiere Optimierungshinweise
        const optimizationHints = [];

        // Prüfe Spekulationsfrist
        const lotsNearExemption = lotsUsed.filter(lot => 
            !lot.is_tax_exempt && 
            lot.holding_period_days < 365 && 
            lot.holding_period_days > 330
        );
        
        if (lotsNearExemption.length > 0) {
            const daysRemaining = 365 - lotsNearExemption[0].holding_period_days;
            optimizationHints.push(`Wenn Sie noch ${daysRemaining} Tage warten, ist der Gewinn steuerfrei (${asset.asset_class === 'crypto' ? 'Krypto' : 'Edelmetall'})`);
        }

        // Hole TaxSummary für Sparerpauschbetrag
        const [account] = await base44.asServiceRole.entities.PortfolioAccount.filter({ 
            id: holding.portfolio_account_id 
        });
        const currentYear = new Date(sale_date).getFullYear();
        const [taxSummary] = await base44.asServiceRole.entities.TaxSummary.filter({
            portfolio_id: account.portfolio_id,
            tax_year: currentYear
        });

        if (taxSummary && taxSummary.saver_allowance_remaining > 0) {
            optimizationHints.push(`Sie haben noch ${taxSummary.saver_allowance_remaining.toFixed(2)}€ Sparerpauschbetrag übrig`);
        }

        const result = {
            sale_summary: {
                asset_name: asset.name,
                quantity,
                sale_price_per_unit: sale_price,
                gross_proceeds: grossProceeds,
                total_cost_basis: totalCostBasis,
                gross_gain_loss: grossGainLoss
            },
            tax_calculation: {
                tax_category: taxCategory,
                partial_exemption_rate: partialExemptionRate,
                taxable_gain: taxableGain,
                tax_rate: taxRate,
                estimated_tax: estimatedTax,
                net_proceeds_after_tax: netProceedsAfterTax
            },
            tax_lots_used: lotsUsed,
            optimization_hints: optimizationHints
        };

        return Response.json(result);

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});