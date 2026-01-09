// Rules Engine für komplexe Steuerszenarien
class RulesEngine {
  constructor() {
    this.rules = [];
  }

  addRule(condition, action, priority = 0) {
    this.rules.push({ condition, action, priority });
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  evaluate(context) {
    const results = [];
    for (const rule of this.rules) {
      if (rule.condition(context)) {
        const result = rule.action(context);
        results.push(result);
      }
    }
    return results;
  }
}

// Tax Rules für AT
export const createATTaxRules = () => {
  const engine = new RulesEngine();

  // Regel 1: Erhöhte Betriebsausgabenpauschalquote für bestimmte Berufe
  engine.addRule(
    (ctx) => ['freelancer', 'consultant', 'artist'].includes(ctx.profession_type),
    (ctx) => ({
      rule: 'increased_expense_quota',
      expense_quota: 0.30,
      message: 'Erhöhte Betriebsausgabenquote (30%) für freie Berufe'
    }),
    10
  );

  // Regel 2: Werbungskosten mindestens EUR 1.000
  engine.addRule(
    (ctx) => ctx.income > 0 && ctx.actual_expenses < 1000,
    (ctx) => ({
      rule: 'minimum_deduction',
      minimum_amount: 1000,
      message: 'Mindestabzug für Werbungskosten: EUR 1.000'
    }),
    9
  );

  // Regel 3: Fiktive Betriebsausgaben (20%)
  engine.addRule(
    (ctx) => ctx.income > 0 && !ctx.actual_expenses,
    (ctx) => ({
      rule: 'fictional_expenses',
      amount: ctx.income * 0.20,
      message: 'Fiktive Betriebsausgaben: 20% des Einkommens'
    }),
    8
  );

  // Regel 4: Sonderausgabenabzug (max EUR 3.200)
  engine.addRule(
    (ctx) => ctx.special_expenses > 0,
    (ctx) => ({
      rule: 'special_expenses_deduction',
      max_amount: 3200,
      allowed_amount: Math.min(ctx.special_expenses, 3200),
      message: `Sonderausgabenabzug (max. EUR 3.200): EUR ${Math.min(ctx.special_expenses, 3200)}`
    }),
    7
  );

  // Regel 5: Außergewöhnliche Belastung
  engine.addRule(
    (ctx) => ctx.extraordinary_burden > 0,
    (ctx) => ({
      rule: 'extraordinary_burden',
      amount: ctx.extraordinary_burden,
      reduction_percentage: 0.06,
      message: `Außergewöhnliche Belastung: EUR ${ctx.extraordinary_burden}`
    }),
    6
  );

  return engine;
};

// Tax Rules für CH
export const createCHTaxRules = () => {
  const engine = new RulesEngine();

  // Regel 1: Berufsausgaben-Pauschalabzug
  engine.addRule(
    (ctx) => ctx.self_employment_income > 0 && !ctx.actual_expenses,
    (ctx) => ({
      rule: 'professional_expenses_default',
      percentage: 0.20,
      amount: ctx.self_employment_income * 0.20,
      message: 'Berufsausgaben Pauschalabzug: 20%'
    }),
    10
  );

  // Regel 2: Wohnkosten (Miete oder Eigenmietwert)
  engine.addRule(
    (ctx) => ctx.rental_property_value > 0,
    (ctx) => ({
      rule: 'imputed_rent',
      rate: 0.035,
      amount: ctx.rental_property_value * 0.035,
      message: 'Eigenmietwert für Einfamilienhaus'
    }),
    9
  );

  // Regel 3: Kinderabzug (variiert je Kanton)
  engine.addRule(
    (ctx) => ctx.children_count > 0 && ctx.canton,
    (ctx) => ({
      rule: 'child_deduction',
      amount: ctx.children_count * 250, // Durchschnitt
      message: `Kinderabzug: ${ctx.children_count} Kinder`
    }),
    8
  );

  // Regel 4: Sozialversicherungsbeiträge
  engine.addRule(
    (ctx) => ctx.self_employment_income > 0,
    (ctx) => ({
      rule: 'social_insurance',
      percentage: 0.105,
      amount: ctx.self_employment_income * 0.105,
      message: 'Sozialversicherungsbeiträge (AHV/IV/EO): ~10.5%'
    }),
    7
  );

  // Regel 5: Vermögensabzug (progressive Sätze)
  engine.addRule(
    (ctx) => ctx.wealth > 0,
    (ctx) => {
      let deduction = 0;
      if (ctx.wealth < 50000) deduction = 0;
      else if (ctx.wealth < 100000) deduction = 50000 * 0.01;
      else if (ctx.wealth < 500000) deduction = 100000 * 0.02;
      else deduction = 100000 * 0.03 + (ctx.wealth - 500000) * 0.015;
      
      return {
        rule: 'wealth_deduction',
        amount: deduction,
        message: `Vermögensabzug: CHF ${Math.round(deduction)}`
      };
    },
    6
  );

  return engine;
};

// Export für use
Deno.serve(async (req) => {
  try {
    const { country, context } = await req.json();

    if (!country || !context) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    let engine;
    if (country === 'AT') {
      engine = createATTaxRules();
    } else if (country === 'CH') {
      engine = createCHTaxRules();
    } else {
      return Response.json({ error: 'Unsupported country' }, { status: 400 });
    }

    const results = engine.evaluate(context);

    return Response.json({
      status: 'success',
      country,
      rules_applied: results.length,
      results
    });
  } catch (error) {
    console.error('Rules engine error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});