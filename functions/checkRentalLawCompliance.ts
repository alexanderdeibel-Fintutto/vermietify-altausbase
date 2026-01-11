import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { building_id } = await req.json();
    const building = await base44.asServiceRole.entities.Building.read(building_id);

    const findings = [];

    // Check 1: Energy passport requirement
    const energyPassports = await base44.asServiceRole.entities.EnergyPassport.filter({ building_id });
    if (energyPassports.length === 0) {
      findings.push({
        rule: 'GEG §80 - Energieausweis',
        severity: 'high',
        description: 'Kein Energieausweis vorhanden',
        recommendation: 'Energieausweis erstellen lassen'
      });
    }

    // Check 2: Rent increase cap compliance
    const rentIncreases = await base44.asServiceRole.entities.RentIncrease.filter({ 
      company_id: building.company_id 
    });
    const nonCompliantIncreases = rentIncreases.filter(ri => !ri.cap_limit_check?.is_compliant);
    if (nonCompliantIncreases.length > 0) {
      findings.push({
        rule: '§558 BGB - Kappungsgrenze',
        severity: 'critical',
        description: `${nonCompliantIncreases.length} Mieterhöhungen überschreiten Kappungsgrenze`,
        recommendation: 'Mieterhöhungen überprüfen und anpassen'
      });
    }

    // Check 3: Deposit regulations
    const deposits = await base44.asServiceRole.entities.Deposit.filter({ company_id: building.company_id });
    for (const deposit of deposits) {
      const contract = await base44.asServiceRole.entities.LeaseContract.read(deposit.contract_id);
      if (deposit.amount > contract.monthly_rent * 3) {
        findings.push({
          rule: '§551 BGB - Mietsicherheit',
          severity: 'high',
          description: 'Kaution überschreitet 3 Monatsmieten',
          recommendation: 'Kaution auf maximal 3 Monatsmieten reduzieren'
        });
      }
    }

    const status = findings.some(f => f.severity === 'critical') ? 'violation' :
                   findings.some(f => f.severity === 'high') ? 'warning' : 'compliant';

    const complianceCheck = await base44.asServiceRole.entities.ComplianceCheck.create({
      building_id,
      company_id: building.company_id,
      check_type: 'rental_law',
      check_date: new Date().toISOString().split('T')[0],
      status,
      findings,
      next_check_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    return Response.json({ success: true, compliance_check: complianceCheck, findings });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});