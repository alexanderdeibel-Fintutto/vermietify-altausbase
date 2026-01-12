import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { portfolio_id, tax_year } = await req.json();

        // Hole TaxSettings
        const taxSettings = await base44.asServiceRole.entities.TaxSettings.filter({ user_email: user.email });
        const settings = taxSettings[0] || {
            saver_allowance: 1000,
            church_tax_rate: 0,
            include_solidarity_surcharge: true,
            loss_carryforward_stocks: 0,
            loss_carryforward_other: 0
        };

        // Hole alle TaxEvents für das Jahr
        const taxEvents = await base44.asServiceRole.entities.TaxEvent.filter({
            portfolio_id,
            tax_year
        });

        // Initialisiere Summen
        let totalDividends = 0;
        let totalInterest = 0;
        let totalCapitalGainsStocks = 0;
        let totalCapitalLossesStocks = 0;
        let totalCapitalGainsFunds = 0;
        let totalCapitalGainsCrypto = 0;
        let totalCapitalGainsCryptoExempt = 0;
        let totalCapitalGainsPreciousMetals = 0;
        let totalCapitalGainsPreciousMetalsExempt = 0;
        let totalWithholdingTax = 0;

        // Gruppiere Events nach Kategorie
        for (const event of taxEvents) {
            const { tax_category, event_type, gain_loss, taxable_amount, is_tax_exempt, withholding_tax_paid } = event;

            if (withholding_tax_paid) {
                totalWithholdingTax += withholding_tax_paid;
            }

            if (event_type === 'dividend') {
                totalDividends += event.gross_amount;
            } else if (event_type === 'interest') {
                totalInterest += event.gross_amount;
            } else if (tax_category === 'capital_gains_stocks') {
                if (gain_loss > 0) {
                    totalCapitalGainsStocks += gain_loss;
                } else {
                    totalCapitalLossesStocks += gain_loss;
                }
            } else if (tax_category === 'capital_gains_funds') {
                totalCapitalGainsFunds += taxable_amount; // Bereits nach Teilfreistellung
            } else if (tax_category === 'capital_gains_crypto') {
                if (is_tax_exempt) {
                    totalCapitalGainsCryptoExempt += gain_loss;
                } else {
                    totalCapitalGainsCrypto += taxable_amount;
                }
            } else if (tax_category === 'capital_gains_precious_metals') {
                if (is_tax_exempt) {
                    totalCapitalGainsPreciousMetalsExempt += gain_loss;
                } else {
                    totalCapitalGainsPreciousMetals += taxable_amount;
                }
            }
        }

        // Berechne Netto-Aktiengewinne mit Verlustvortrag
        let netCapitalGainsStocks = totalCapitalGainsStocks + totalCapitalLossesStocks + settings.loss_carryforward_stocks;
        let lossCarryforwardStocks = 0;
        
        if (netCapitalGainsStocks < 0) {
            lossCarryforwardStocks = Math.abs(netCapitalGainsStocks);
            netCapitalGainsStocks = 0;
        }

        // Berechne steuerpflichtige Summe
        const grossTaxable = totalDividends + netCapitalGainsStocks + totalCapitalGainsFunds + 
                            totalCapitalGainsCrypto + totalCapitalGainsPreciousMetals + totalInterest;

        // Sparerpauschbetrag abziehen
        const saverAllowance = settings.saver_allowance;
        const netTaxableCapitalIncome = Math.max(0, grossTaxable - saverAllowance);
        const saverAllowanceUsed = Math.min(saverAllowance, grossTaxable);
        const saverAllowanceRemaining = saverAllowance - saverAllowanceUsed;

        // Steuerschuld berechnen
        const baseTaxRate = 0.25; // Abgeltungssteuer
        const soliRate = settings.include_solidarity_surcharge ? 0.055 : 0;
        const churchTaxRate = settings.church_tax_rate / 100;
        const effectiveRate = baseTaxRate * (1 + soliRate + churchTaxRate);
        
        let estimatedTaxLiability = netTaxableCapitalIncome * effectiveRate;
        
        // Quellensteuer anrechnen
        estimatedTaxLiability = Math.max(0, estimatedTaxLiability - totalWithholdingTax);

        // Erstelle oder aktualisiere TaxSummary
        const existingSummary = await base44.asServiceRole.entities.TaxSummary.filter({
            portfolio_id,
            tax_year
        });

        const summaryData = {
            portfolio_id,
            tax_year,
            total_dividends: totalDividends,
            total_interest: totalInterest,
            total_capital_gains_stocks: totalCapitalGainsStocks,
            total_capital_losses_stocks: totalCapitalLossesStocks,
            total_capital_gains_funds: totalCapitalGainsFunds,
            total_capital_gains_crypto: totalCapitalGainsCrypto,
            total_capital_gains_crypto_exempt: totalCapitalGainsCryptoExempt,
            total_capital_gains_precious_metals: totalCapitalGainsPreciousMetals,
            total_capital_gains_precious_metals_exempt: totalCapitalGainsPreciousMetalsExempt,
            total_withholding_tax: totalWithholdingTax,
            net_taxable_capital_income: netTaxableCapitalIncome,
            saver_allowance_used: saverAllowanceUsed,
            saver_allowance_remaining: saverAllowanceRemaining,
            estimated_tax_liability: estimatedTaxLiability,
            loss_carryforward_stocks: lossCarryforwardStocks,
            loss_carryforward_other: settings.loss_carryforward_other,
            last_calculated: new Date().toISOString()
        };

        let summary;
        if (existingSummary.length > 0) {
            summary = await base44.asServiceRole.entities.TaxSummary.update(existingSummary[0].id, summaryData);
        } else {
            summary = await base44.asServiceRole.entities.TaxSummary.create(summaryData);
        }

        return Response.json({ success: true, summary });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});