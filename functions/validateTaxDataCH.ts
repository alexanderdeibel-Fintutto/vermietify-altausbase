import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { taxYear, canton } = await req.json();

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    console.log(`Validating CH tax data for ${canton} in ${taxYear}`);

    const [investments, realEstate] = await Promise.all([
      base44.entities.InvestmentCH.filter({ tax_year: taxYear, canton }) || [],
      base44.entities.RealEstateCH.filter({ tax_year: taxYear, canton }) || []
    ]);

    const errors = [];
    const warnings = [];
    const info = [];

    // Validate investments
    for (const inv of investments) {
      if (!inv.title) errors.push(`Wertschrift: Titel fehlt`);
      if (!inv.acquisition_date) errors.push(`Wertschrift "${inv.title}": Erwerbsdatum fehlt`);
      if (!inv.institution) errors.push(`Wertschrift "${inv.title}": Depotbank fehlt`);
      
      if (inv.acquisition_price <= 0) {
        errors.push(`Wertschrift "${inv.title}": Erwerbspreis muss > 0 sein`);
      }
      
      if (inv.current_value && inv.current_value < 0) {
        errors.push(`Wertschrift "${inv.title}": Aktueller Wert darf nicht negativ sein`);
      }

      if (inv.quantity && inv.quantity <= 0) {
        errors.push(`Wertschrift "${inv.title}": Anzahl muss > 0 sein`);
      }

      // Check for missing canton info
      if (!inv.canton) {
        errors.push(`Wertschrift "${inv.title}": Kanton fehlt`);
      }
    }

    // Validate real estate
    for (const re of realEstate) {
      if (!re.title) errors.push(`Liegenschaft: Titel fehlt`);
      if (!re.address) errors.push(`Liegenschaft "${re.title}": Adresse fehlt`);
      if (!re.acquisition_date) errors.push(`Liegenschaft "${re.title}": Erwerbsdatum fehlt`);

      if (re.acquisition_price <= 0) {
        errors.push(`Liegenschaft "${re.title}": Kaufpreis muss > 0 sein`);
      }

      if (re.current_market_value <= 0) {
        errors.push(`Liegenschaft "${re.title}": Marktwert muss > 0 sein`);
      }

      if (re.mortgage_debt < 0) {
        errors.push(`Liegenschaft "${re.title}": Hypothekarschuld darf nicht negativ sein`);
      }

      // Check mortgage interest plausibility
      if (re.mortgage_debt > 0 && re.mortgage_interest_deductible) {
        const interestRate = re.mortgage_interest_deductible / re.mortgage_debt;
        if (interestRate > 0.1) {
          warnings.push(`Liegenschaft "${re.title}": Hypothekarzinssatz scheint hoch (${(interestRate * 100).toFixed(2)}%)`);
        }
      }

      // Check primary residence flag
      if (re.is_primary_residence && re.rental_income > 0) {
        warnings.push(`Liegenschaft "${re.title}": Hauptwohnsitz hat Mieteinnahmen - bitte überprüfen`);
      }

      // Canton validation
      if (!re.canton) {
        errors.push(`Liegenschaft "${re.title}": Kanton fehlt`);
      }
    }

    // Summary checks
    const hasInvestments = investments.length > 0;
    const hasRealEstate = realEstate.length > 0;

    if (!hasInvestments && !hasRealEstate) {
      warnings.push('Keine Vermögensdaten für Steuerjahr gefunden');
    }

    const totalValue = investments.reduce((s, i) => s + ((i.quantity || 0) * (i.current_value || 0)), 0) +
                       realEstate.reduce((s, re) => s + (re.current_market_value || 0), 0);

    const totalMortgage = realEstate.reduce((s, re) => s + (re.mortgage_debt || 0), 0);

    if (totalValue > 0) {
      info.push(`Gesamtvermögen: CHF ${totalValue.toFixed(2)}`);
    }

    if (totalMortgage > 0) {
      info.push(`Hypothekarschuld: CHF ${totalMortgage.toFixed(2)}`);
    }

    const isValid = errors.length === 0;

    return Response.json({
      isValid,
      errors,
      warnings,
      info,
      canton,
      timestamp: new Date().toISOString(),
      summary: {
        errorsCount: errors.length,
        warningsCount: warnings.length,
        dataCount: {
          investments: investments.length,
          realEstate: realEstate.length,
          totalAssets: hasInvestments || hasRealEstate ? Math.round(totalValue) : 0
        }
      }
    });
  } catch (error) {
    console.error('Validation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});