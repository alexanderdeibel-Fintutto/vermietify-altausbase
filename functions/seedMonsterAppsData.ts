import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    // Seed Contractors
    const contractors = await base44.entities.Contractor.bulkCreate([
      { name: 'Müller Klempnerei', category: 'plumbing', email: 'mueller@klempner.de', phone: '+49301234567', rating: 4.8, review_count: 45, hourly_rate: 65, verified: true, region: 'Berlin' },
      { name: 'Schmidt Elektrik', category: 'electrical', email: 'schmidt@elektrik.de', phone: '+49302345678', rating: 4.6, review_count: 38, hourly_rate: 75, verified: true, region: 'Berlin' },
      { name: 'Weber Heizung', category: 'hvac', email: 'weber@heizung.de', phone: '+49303456789', rating: 4.9, review_count: 52, hourly_rate: 85, verified: true, region: 'München' },
      { name: 'Becker Malerei', category: 'painting', email: 'becker@malerei.de', phone: '+49304567890', rating: 4.7, review_count: 41, hourly_rate: 55, verified: false, region: 'Hamburg' },
      { name: 'Fischer Reinigung', category: 'cleaning', email: 'fischer@reinigung.de', phone: '+49305678901', rating: 4.5, review_count: 28, hourly_rate: 45, verified: true, region: 'Köln' }
    ]);

    // Seed Vetting Reports
    const vettingReports = await base44.entities.TenantVettingReport.bulkCreate([
      { tenant_id: 'tenant_1', credit_score: 750, income_verification: true, background_check: true, risk_level: 'low', risk_score: 25, default_probability: 8, recommendation: 'approve' },
      { tenant_id: 'tenant_2', credit_score: 680, income_verification: true, background_check: false, risk_level: 'medium', risk_score: 52, default_probability: 35, recommendation: 'conditional' },
      { tenant_id: 'tenant_3', credit_score: 620, income_verification: false, background_check: false, risk_level: 'high', risk_score: 78, default_probability: 62, recommendation: 'reject' }
    ]);

    // Seed Valuations
    const valuations = await base44.entities.PropertyValuation.bulkCreate([
      { building_id: 'bld_1', estimated_value: 850000, price_per_sqm: 5200, valuation_method: 'ai_model', rental_yield: 4.2, market_trend: 'rising', confidence_score: 82, comparable_properties_count: 15 },
      { building_id: 'bld_2', estimated_value: 1200000, price_per_sqm: 6100, valuation_method: 'ai_model', rental_yield: 3.8, market_trend: 'stable', confidence_score: 78, comparable_properties_count: 12 },
      { building_id: 'bld_3', estimated_value: 650000, price_per_sqm: 4800, valuation_method: 'ai_model', rental_yield: 5.1, market_trend: 'falling', confidence_score: 75, comparable_properties_count: 10 }
    ]);

    // Seed Banking Rules
    const bankingRules = await base44.entities.BankingAutomationRule.bulkCreate([
      { rule_name: 'Mietzahlungen', bank_account_id: 'acc_1', pattern_match: 'miete|rent', auto_category: 'Mieteinnahmen', confidence_level: 95, active: true, tax_relevant: true },
      { rule_name: 'Instandhaltung', bank_account_id: 'acc_1', pattern_match: 'reparatur|handwerker|instandhaltung', auto_category: 'Betriebskosten', confidence_level: 85, active: true, tax_relevant: true },
      { rule_name: 'Versicherungen', bank_account_id: 'acc_1', pattern_match: 'allianz|axa|versicherung', auto_category: 'Versicherung', confidence_level: 90, active: true, tax_relevant: true }
    ]);

    // Seed Operating Cost Automations
    const automations = await base44.entities.OperatingCostAutomation.bulkCreate([
      { building_id: 'bld_1', automation_type: 'automatic', allocation_method: 'square_meter', status: 'active', accuracy_rate: 94 },
      { building_id: 'bld_2', automation_type: 'automatic', allocation_method: 'usage_meter', status: 'active', accuracy_rate: 91 },
      { building_id: 'bld_3', automation_type: 'semi_automatic', allocation_method: 'square_meter', status: 'active', accuracy_rate: 87 }
    ]);

    // Seed White Label Instances
    const whiteLabels = await base44.entities.WhiteLabelInstance.bulkCreate([
      { account_holder: 'Steuerberatung Müller GmbH', domain: 'finx-mueller.de', subscription_tier: 'professional', active: true, users_count: 5, monthly_revenue_share: 299, contract_until: '2027-12-31' },
      { account_holder: 'Dentax Steuerkanzlei', domain: 'finx-dentax.de', subscription_tier: 'enterprise', active: true, users_count: 12, monthly_revenue_share: 799, contract_until: '2027-06-30' },
      { account_holder: 'A+M Consulting', domain: 'finx-am.de', subscription_tier: 'starter', active: true, users_count: 2, monthly_revenue_share: 99, contract_until: '2026-12-31' }
    ]);

    // Seed Elster Audits
    const elsterAudits = await base44.entities.ElsterComplianceAudit.bulkCreate([
      { user_email: 'owner@example.de', tax_year: 2025, submission_status: 'pending', compliance_score: 92, issues_found: 2, auto_corrected: 2 },
      { user_email: 'manager@property.de', tax_year: 2025, submission_status: 'submitted', compliance_score: 98, issues_found: 0, auto_corrected: 0, submission_id: 'ELSTER_123456' },
      { user_email: 'investor@immobilie.de', tax_year: 2024, submission_status: 'accepted', compliance_score: 100, issues_found: 0, auto_corrected: 0, submission_id: 'ELSTER_789012' }
    ]);

    return Response.json({ 
      success: true,
      created: {
        contractors: contractors.length,
        vettingReports: vettingReports.length,
        valuations: valuations.length,
        bankingRules: bankingRules.length,
        automations: automations.length,
        whiteLabels: whiteLabels.length,
        elsterAudits: elsterAudits.length
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});