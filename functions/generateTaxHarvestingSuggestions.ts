import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { portfolio_id, tax_year } = await req.json();

        // Hole aktuelle TaxSummary
        const [taxSummary] = await base44.asServiceRole.entities.TaxSummary.filter({
            portfolio_id,
            tax_year
        });

        if (!taxSummary) {
            return Response.json({ error: 'Tax summary not found. Please calculate tax summary first.' }, { status: 404 });
        }

        // Hole alle AssetHoldings
        const [portfolio] = await base44.asServiceRole.entities.Portfolio.filter({ id: portfolio_id });
        const accounts = await base44.asServiceRole.entities.PortfolioAccount.filter({ portfolio_id });
        
        const holdings = [];
        for (const account of accounts) {
            const accountHoldings = await base44.asServiceRole.entities.AssetHolding.filter({
                portfolio_account_id: account.id
            });
            holdings.push(...accountHoldings);
        }

        const suggestions = [];
        const today = new Date();
        const validUntil = new Date(today);
        validUntil.setDate(validUntil.getDate() + 7);

        for (const holding of holdings) {
            if (holding.quantity === 0) continue;

            // Hole Asset-Info
            const [asset] = await base44.asServiceRole.entities.Asset.filter({ id: holding.asset_id });
            if (!asset) continue;

            const unrealizedGainLoss = holding.unrealized_gain_loss || 0;

            // VERLUST-POSITIONEN
            if (unrealizedGainLoss < 0) {
                // Prüfe ob Verlust-Realisierung sinnvoll
                const hasGainsToOffset = taxSummary.total_capital_gains_stocks > 0 || 
                                        taxSummary.total_capital_gains_funds > 0;
                
                if (hasGainsToOffset) {
                    const estimatedTaxSavings = Math.abs(unrealizedGainLoss) * 0.26375;
                    
                    suggestions.push({
                        portfolio_id,
                        tax_year,
                        asset_id: holding.asset_id,
                        asset_holding_id: holding.id,
                        suggestion_type: 'realize_loss',
                        current_unrealized_gain_loss: unrealizedGainLoss,
                        suggested_quantity: holding.quantity,
                        estimated_tax_savings: estimatedTaxSavings,
                        priority: estimatedTaxSavings > 500 ? 'high' : estimatedTaxSavings > 100 ? 'medium' : 'low',
                        reasoning: `Verlust von ${Math.abs(unrealizedGainLoss).toFixed(2)}€ kann mit realisierten Gewinnen verrechnet werden. Geschätzte Steuerersparnis: ${estimatedTaxSavings.toFixed(2)}€`,
                        status: 'pending',
                        valid_until: validUntil.toISOString().split('T')[0]
                    });
                }
            }

            // GEWINN-POSITIONEN
            if (unrealizedGainLoss > 0) {
                // Hole TaxLots um Spekulationsfrist zu prüfen
                const taxLots = await base44.asServiceRole.entities.TaxLot.filter({
                    asset_holding_id: holding.id,
                    status: ['open', 'partially_sold']
                });

                // Prüfe Spekulationsfrist für Krypto/Edelmetalle
                if (asset.asset_class === 'crypto' || asset.asset_class === 'precious_metal') {
                    for (const lot of taxLots) {
                        if (lot.holding_period_end) {
                            const holdingPeriodEnd = new Date(lot.holding_period_end);
                            const daysUntilExempt = Math.ceil((holdingPeriodEnd - today) / (1000 * 60 * 60 * 24));

                            if (daysUntilExempt <= 30 && daysUntilExempt > 0) {
                                // Kurz vor Steuerfreiheit
                                suggestions.push({
                                    portfolio_id,
                                    tax_year,
                                    asset_id: holding.asset_id,
                                    asset_holding_id: holding.id,
                                    suggestion_type: 'defer_sale',
                                    current_unrealized_gain_loss: unrealizedGainLoss,
                                    suggested_quantity: lot.remaining_quantity,
                                    estimated_tax_savings: unrealizedGainLoss * 0.26375,
                                    days_until_tax_exempt: daysUntilExempt,
                                    priority: daysUntilExempt <= 7 ? 'high' : 'medium',
                                    reasoning: `Noch ${daysUntilExempt} Tage warten für steuerfreien Verkauf. Gewinn von ${unrealizedGainLoss.toFixed(2)}€ kann dann steuerfrei realisiert werden.`,
                                    status: 'pending',
                                    valid_until: validUntil.toISOString().split('T')[0]
                                });
                            } else if (daysUntilExempt <= 0) {
                                // Bereits steuerfrei
                                suggestions.push({
                                    portfolio_id,
                                    tax_year,
                                    asset_id: holding.asset_id,
                                    asset_holding_id: holding.id,
                                    suggestion_type: 'realize_gain_tax_free',
                                    current_unrealized_gain_loss: unrealizedGainLoss,
                                    suggested_quantity: lot.remaining_quantity,
                                    estimated_tax_savings: unrealizedGainLoss * 0.26375,
                                    days_until_tax_exempt: 0,
                                    priority: 'high',
                                    reasoning: `Gewinn von ${unrealizedGainLoss.toFixed(2)}€ kann steuerfrei realisiert werden (Spekulationsfrist überschritten).`,
                                    status: 'pending',
                                    valid_until: validUntil.toISOString().split('T')[0]
                                });
                            }
                        }
                    }
                }

                // Prüfe Sparerpauschbetrag
                if (taxSummary.saver_allowance_remaining > 0) {
                    const taxFreeGain = Math.min(unrealizedGainLoss, taxSummary.saver_allowance_remaining);
                    const quantityToSell = (taxFreeGain / unrealizedGainLoss) * holding.quantity;

                    suggestions.push({
                        portfolio_id,
                        tax_year,
                        asset_id: holding.asset_id,
                        asset_holding_id: holding.id,
                        suggestion_type: 'use_allowance',
                        current_unrealized_gain_loss: unrealizedGainLoss,
                        suggested_quantity: quantityToSell,
                        estimated_tax_savings: taxFreeGain * 0.26375,
                        priority: 'medium',
                        reasoning: `Sparerpauschbetrag von ${taxSummary.saver_allowance_remaining.toFixed(2)}€ noch nicht ausgeschöpft. ${taxFreeGain.toFixed(2)}€ Gewinn können steuerfrei realisiert werden.`,
                        status: 'pending',
                        valid_until: validUntil.toISOString().split('T')[0]
                    });
                }
            }
        }

        // Lösche alte Suggestions für dieses Portfolio/Jahr
        const oldSuggestions = await base44.asServiceRole.entities.TaxHarvestingSuggestion.filter({
            portfolio_id,
            tax_year,
            status: 'pending'
        });
        
        for (const old of oldSuggestions) {
            await base44.asServiceRole.entities.TaxHarvestingSuggestion.delete(old.id);
        }

        // Erstelle neue Suggestions
        const createdSuggestions = [];
        for (const suggestion of suggestions) {
            const created = await base44.asServiceRole.entities.TaxHarvestingSuggestion.create(suggestion);
            createdSuggestions.push(created);
        }

        return Response.json({ 
            success: true, 
            suggestions: createdSuggestions,
            count: createdSuggestions.length 
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});