import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { transaction_id } = await req.json();

        // Hole die Transaktion
        const [transaction] = await base44.entities.AssetTransaction.filter({ id: transaction_id });
        if (!transaction) {
            return Response.json({ error: 'Transaction not found' }, { status: 404 });
        }

        const { portfolio_account_id, asset_id, transaction_type, quantity, price_per_unit, transaction_date, fees, exchange_rate } = transaction;

        // Hole Asset-Info für Steuerlogik
        const [asset] = await base44.entities.Asset.filter({ id: asset_id });
        if (!asset) {
            return Response.json({ error: 'Asset not found' }, { status: 404 });
        }

        if (transaction_type === 'buy') {
            // KAUF: Erstelle neues TaxLot
            const feesPerUnit = fees ? fees / quantity : 0;
            const costBasisPerUnit = (price_per_unit * (exchange_rate || 1)) + feesPerUnit;
            const totalCostBasis = costBasisPerUnit * quantity;

            // Berechne holding_period_end für Krypto/Edelmetalle (1 Jahr)
            let holdingPeriodEnd = null;
            if (asset.asset_class === 'crypto' || asset.asset_class === 'precious_metal') {
                const date = new Date(transaction_date);
                date.setFullYear(date.getFullYear() + 1);
                holdingPeriodEnd = date.toISOString().split('T')[0];
            }

            const taxLot = await base44.asServiceRole.entities.TaxLot.create({
                asset_holding_id: transaction.asset_holding_id || null,
                asset_id,
                portfolio_account_id,
                purchase_transaction_id: transaction_id,
                purchase_date: transaction_date,
                original_quantity: quantity,
                remaining_quantity: quantity,
                cost_basis_per_unit: costBasisPerUnit,
                total_cost_basis: totalCostBasis,
                fees_allocated: fees || 0,
                holding_period_end: holdingPeriodEnd,
                is_tax_exempt: false,
                status: 'open'
            });

            return Response.json({ success: true, tax_lot: taxLot });
        }

        if (transaction_type === 'sell') {
            // VERKAUF: FIFO-Prinzip anwenden
            const sellQuantity = Math.abs(quantity);
            const salePrice = price_per_unit * (exchange_rate || 1);
            
            // Hole offene TaxLots nach FIFO (älteste zuerst)
            const openLots = await base44.asServiceRole.entities.TaxLot.filter({
                asset_id,
                portfolio_account_id,
                status: ['open', 'partially_sold']
            });
            
            const sortedLots = openLots.sort((a, b) => new Date(a.purchase_date) - new Date(b.purchase_date));

            let remainingSellQuantity = sellQuantity;
            const taxEvents = [];

            for (const lot of sortedLots) {
                if (remainingSellQuantity <= 0) break;

                const quantityToSell = Math.min(remainingSellQuantity, lot.remaining_quantity);
                const costBasis = lot.cost_basis_per_unit * quantityToSell;
                const proceeds = salePrice * quantityToSell;
                const gainLoss = proceeds - costBasis;

                // Berechne Haltedauer
                const purchaseDate = new Date(lot.purchase_date);
                const saleDate = new Date(transaction_date);
                const holdingPeriodDays = Math.floor((saleDate - purchaseDate) / (1000 * 60 * 60 * 24));

                // Prüfe Steuerfreiheit (Spekulationsfrist)
                let isTaxExempt = false;
                if ((asset.asset_class === 'crypto' || asset.asset_class === 'precious_metal') && holdingPeriodDays > 365) {
                    isTaxExempt = true;
                }

                // Bestimme Steuerkategorie
                let taxCategory = 'capital_gains_stocks';
                if (asset.asset_class === 'crypto') taxCategory = 'capital_gains_crypto';
                else if (asset.asset_class === 'precious_metal') taxCategory = 'capital_gains_precious_metals';
                else if (asset.asset_class === 'etf' || asset.asset_class === 'bond') taxCategory = 'capital_gains_funds';

                // Berechne Teilfreistellung für Fonds
                let partialExemptionRate = 0;
                let taxableAmount = gainLoss;
                
                if (taxCategory === 'capital_gains_funds') {
                    const exemptionMap = {
                        'equity_fund_30': 0.30,
                        'mixed_fund_15': 0.15,
                        'real_estate_fund_60': 0.60,
                        'bond_fund_0': 0
                    };
                    partialExemptionRate = exemptionMap[asset.tax_category] || 0;
                    taxableAmount = gainLoss * (1 - partialExemptionRate);
                }

                // Hole Portfolio für TaxEvent
                const [account] = await base44.asServiceRole.entities.PortfolioAccount.filter({ id: portfolio_account_id });
                
                // Erstelle TaxEvent
                const taxEvent = await base44.asServiceRole.entities.TaxEvent.create({
                    portfolio_id: account.portfolio_id,
                    tax_year: new Date(transaction_date).getFullYear(),
                    event_type: asset.asset_class === 'crypto' ? 'crypto_sale' : 
                                asset.asset_class === 'precious_metal' ? 'precious_metal_sale' : 'sale',
                    event_date: transaction_date,
                    asset_id,
                    source_transaction_id: transaction_id,
                    gross_amount: proceeds,
                    cost_basis: costBasis,
                    gain_loss: gainLoss,
                    partial_exemption_rate: partialExemptionRate,
                    taxable_amount: isTaxExempt ? 0 : taxableAmount,
                    holding_period_days: holdingPeriodDays,
                    is_tax_exempt: isTaxExempt,
                    tax_category: taxCategory,
                    withholding_tax_paid: 0
                });

                taxEvents.push(taxEvent);

                // Aktualisiere TaxLot
                const newRemainingQuantity = lot.remaining_quantity - quantityToSell;
                const newStatus = newRemainingQuantity === 0 ? 'closed' : 'partially_sold';

                await base44.asServiceRole.entities.TaxLot.update(lot.id, {
                    remaining_quantity: newRemainingQuantity,
                    status: newStatus
                });

                remainingSellQuantity -= quantityToSell;
            }

            return Response.json({ success: true, tax_events: taxEvents });
        }

        return Response.json({ success: true, message: 'No tax lot action needed for this transaction type' });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});