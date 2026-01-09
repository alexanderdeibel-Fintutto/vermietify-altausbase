import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const configs = [
      {
        canton_code: 'ZH',
        canton_name: 'Zürich',
        region: 'german',
        federal_income_tax_rate: 0.077,
        cantonal_income_tax_rate: 0.082,
        communal_income_tax_rate: 0.038,
        wealth_tax_threshold: 100000,
        wealth_tax_rate: 0.001,
        property_tax_percent: 0.005,
        mortgage_deduction_allowed: true,
        rental_income_taxable: true,
        imputed_rent_taxable: false,
        notes: 'Standard Swiss canton tax rates for Zurich'
      },
      {
        canton_code: 'BE',
        canton_name: 'Bern',
        region: 'german',
        federal_income_tax_rate: 0.077,
        cantonal_income_tax_rate: 0.075,
        communal_income_tax_rate: 0.035,
        wealth_tax_threshold: 100000,
        wealth_tax_rate: 0.0008,
        property_tax_percent: 0.004,
        mortgage_deduction_allowed: true,
        rental_income_taxable: true,
        imputed_rent_taxable: false
      },
      {
        canton_code: 'GE',
        canton_name: 'Genève',
        region: 'french',
        federal_income_tax_rate: 0.077,
        cantonal_income_tax_rate: 0.095,
        communal_income_tax_rate: 0.025,
        wealth_tax_threshold: 50000,
        wealth_tax_rate: 0.0015,
        property_tax_percent: 0.006,
        mortgage_deduction_allowed: true,
        rental_income_taxable: true,
        imputed_rent_taxable: false
      },
      {
        canton_code: 'VD',
        canton_name: 'Vaud',
        region: 'french',
        federal_income_tax_rate: 0.077,
        cantonal_income_tax_rate: 0.085,
        communal_income_tax_rate: 0.030,
        wealth_tax_threshold: 100000,
        wealth_tax_rate: 0.0012,
        property_tax_percent: 0.005,
        mortgage_deduction_allowed: true,
        rental_income_taxable: true,
        imputed_rent_taxable: false
      },
      {
        canton_code: 'TI',
        canton_name: 'Ticino',
        region: 'italian',
        federal_income_tax_rate: 0.077,
        cantonal_income_tax_rate: 0.088,
        communal_income_tax_rate: 0.040,
        wealth_tax_threshold: 150000,
        wealth_tax_rate: 0.001,
        property_tax_percent: 0.006,
        mortgage_deduction_allowed: true,
        rental_income_taxable: true,
        imputed_rent_taxable: false
      }
    ];

    const created = [];
    for (const config of configs) {
      const result = await base44.entities.CantonConfig.create(config);
      created.push(result);
    }

    return Response.json({
      success: true,
      created: created.length,
      cantons: created.map(c => c.canton_name)
    });
  } catch (error) {
    console.error('Seed error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});