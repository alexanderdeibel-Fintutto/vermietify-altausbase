import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, scenarioType, parameters } = await req.json();

    if (!country || !taxYear || !scenarioType || !parameters) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Base calculation scenarios
    const scenarios = {
      AT: {
        income_adjustment: {
          description: 'Einkommen erhöhen/senken',
          calculate: (params, base) => {
            const adjustedIncome = (base.income || 0) + (params.income_change || 0);
            const kest = adjustedIncome * 0.275;
            const taxableAfterKESt = Math.max(0, adjustedIncome - params.sparer_allowance || 730);
            const incomeTax = taxableAfterKESt * 0.42; // Top rate
            return {
              adjusted_income: adjustedIncome,
              kest_withheld: kest,
              income_tax: incomeTax,
              total_tax: kest + incomeTax,
              savings: (base.total_tax || 0) - (kest + incomeTax)
            };
          }
        },
        deduction_optimization: {
          description: 'Werbungskosten optimieren',
          calculate: (params, base) => {
            const additionalDeductions = params.additional_deductions || 0;
            const taxSavings = additionalDeductions * 0.42;
            return {
              additional_deductions: additionalDeductions,
              tax_savings: taxSavings,
              new_total_tax: Math.max(0, (base.total_tax || 0) - taxSavings),
              savings: taxSavings
            };
          }
        },
        capital_gain_planning: {
          description: 'Kapitalgewinne planen',
          calculate: (params, base) => {
            const capitalGain = params.capital_gain || 0;
            const holdingPeriod = params.holding_period_years || 0;
            const isTaxFree = holdingPeriod > 1 && params.private_asset === true;
            const tax = isTaxFree ? 0 : capitalGain * 0.27;
            return {
              capital_gain: capitalGain,
              is_tax_exempt: isTaxFree,
              tax_on_gain: tax,
              savings: isTaxFree ? capitalGain * 0.27 : 0
            };
          }
        },
        tax_loss_harvesting: {
          description: 'Steuerverluste ernten',
          calculate: (params, base) => {
            const losses = params.losses || 0;
            const incomeToOffset = Math.min(losses, (base.income || 0));
            const taxSavings = incomeToOffset * 0.42;
            return {
              losses: losses,
              income_offset: incomeToOffset,
              tax_savings: taxSavings,
              savings: taxSavings
            };
          }
        }
      },
      CH: {
        income_adjustment: {
          description: 'Einkommen erhöhen/senken',
          calculate: (params, base) => {
            const adjustedIncome = (base.income || 0) + (params.income_change || 0);
            const federalTax = adjustedIncome * 0.115;
            const cantonalTax = adjustedIncome * (params.cantonal_rate || 0.07);
            const communalTax = adjustedIncome * (params.communal_rate || 0.05);
            const totalTax = federalTax + cantonalTax + communalTax;
            return {
              adjusted_income: adjustedIncome,
              federal_tax: federalTax,
              cantonal_tax: cantonalTax,
              communal_tax: communalTax,
              total_tax: totalTax,
              savings: (base.total_tax || 0) - totalTax
            };
          }
        },
        wealth_tax_reduction: {
          description: 'Vermögenssteuer reduzieren',
          calculate: (params, base) => {
            const wealthReduction = params.wealth_reduction || 0;
            const wealthTaxRate = params.wealth_tax_rate || 0.002;
            const taxSavings = wealthReduction * wealthTaxRate;
            return {
              wealth_reduction: wealthReduction,
              wealth_tax_savings: taxSavings,
              new_total_tax: Math.max(0, (base.total_tax || 0) - taxSavings),
              savings: taxSavings
            };
          }
        },
        mortgage_optimization: {
          description: 'Hypothekarzinsen optimieren',
          calculate: (params, base) => {
            const mortgageInterest = params.mortgage_interest || 0;
            const deductionRate = params.combined_tax_rate || 0.25;
            const taxSavings = mortgageInterest * deductionRate;
            return {
              mortgage_interest: mortgageInterest,
              tax_deductible_amount: mortgageInterest,
              tax_savings: taxSavings,
              savings: taxSavings
            };
          }
        },
        canton_change: {
          description: 'Kantonwechsel simulieren',
          calculate: (params, base) => {
            const income = base.income || 0;
            const oldTax = income * (params.old_combined_rate || 0.25);
            const newTax = income * (params.new_combined_rate || 0.20);
            const savings = oldTax - newTax;
            return {
              income: income,
              old_total_tax: oldTax,
              new_total_tax: newTax,
              savings: savings
            };
          }
        }
      },
      DE: {
        income_adjustment: {
          description: 'Einkommen erhöhen/senken',
          calculate: (params, base) => {
            const adjustedIncome = (base.income || 0) + (params.income_change || 0);
            const incomeTax = adjustedIncome * 0.42; // Top progressive rate
            const solidarityTax = incomeTax * 0.055;
            const churchTax = incomeTax * (params.church_tax_rate || 0.08);
            const totalTax = incomeTax + solidarityTax + churchTax;
            return {
              adjusted_income: adjustedIncome,
              income_tax: incomeTax,
              solidarity_tax: solidarityTax,
              church_tax: churchTax,
              total_tax: totalTax,
              savings: (base.total_tax || 0) - totalTax
            };
          }
        },
        deduction_strategy: {
          description: 'Werbungskosten & Sonderausgaben',
          calculate: (params, base) => {
            const deductions = params.additional_deductions || 0;
            const taxSavings = deductions * 0.42;
            return {
              additional_deductions: deductions,
              tax_savings: taxSavings,
              new_total_tax: Math.max(0, (base.total_tax || 0) - taxSavings),
              savings: taxSavings
            };
          }
        },
        capital_gains_timing: {
          description: 'Kapitalgewinne zeitlich verschieben',
          calculate: (params, base) => {
            const capitalGain = params.capital_gain || 0;
            const holdingPeriod = params.holding_period_years || 0;
            const isTaxFree = holdingPeriod > 1;
            const tax = isTaxFree ? 0 : capitalGain * 0.26375;
            return {
              capital_gain: capitalGain,
              is_tax_exempt: isTaxFree,
              tax_on_gain: tax,
              savings: isTaxFree ? capitalGain * 0.26375 : 0
            };
          }
        },
        loss_harvesting: {
          description: 'Realisierte Verluste nutzen',
          calculate: (params, base) => {
            const losses = params.losses || 0;
            const incomeToOffset = Math.min(losses, (base.income || 0));
            const taxSavings = incomeToOffset * 0.42;
            return {
              losses: losses,
              income_offset: incomeToOffset,
              tax_savings: taxSavings,
              savings: taxSavings
            };
          }
        }
      }
    };

    // Get calculation function
    const countryScenarios = scenarios[country] || {};
    const scenarioCalc = countryScenarios[scenarioType];

    if (!scenarioCalc) {
      return Response.json({ error: 'Invalid scenario type for country' }, { status: 400 });
    }

    // Base calculation (simplified)
    const baseCalc = {
      income: parameters.base_income || 0,
      total_tax: parameters.base_total_tax || 0
    };

    // Run scenario
    const results = scenarioCalc.calculate(parameters, baseCalc);

    // Determine feasibility
    let feasibility = 'feasible';
    if (parameters.risk_level === 'high') {
      feasibility = 'limited';
    }

    return Response.json({
      status: 'success',
      country,
      tax_year: taxYear,
      scenario_type: scenarioType,
      description: scenarioCalc.description,
      results,
      summary: {
        total_tax_before: baseCalc.total_tax,
        total_tax_after: results.new_total_tax || results.total_tax || (baseCalc.total_tax - results.savings),
        tax_savings: Math.round(results.savings || 0),
        effective_rate_before: baseCalc.income > 0 ? ((baseCalc.total_tax / baseCalc.income) * 100).toFixed(2) : 0,
        effective_rate_after: (results.adjusted_income || baseCalc.income) > 0 
          ? (((results.new_total_tax || results.total_tax || baseCalc.total_tax - results.savings) / (results.adjusted_income || baseCalc.income)) * 100).toFixed(2)
          : 0
      },
      feasibility,
      risk_level: parameters.risk_level || 'medium',
      implementation_effort: parameters.implementation_effort || 'medium'
    });
  } catch (error) {
    console.error('Scenario error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});