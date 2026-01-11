import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const lastYear = new Date().getFullYear() - 1;
    const settlements = await base44.asServiceRole.entities.UtilitySettlement.filter({
      status: 'paid'
    });
    
    const adjustments = [];
    
    for (const settlement of settlements) {
      if (!settlement.period_end?.includes(String(lastYear))) continue;
      
      const contract = await base44.asServiceRole.entities.LeaseContract.read(settlement.contract_id);
      if (contract.status !== 'active') continue;
      
      const currentAdvance = contract.utility_advance || 0;
      const actualCosts = settlement.actual_costs || 0;
      const monthlyActual = actualCosts / 12;
      
      // Add 10% buffer
      const suggestedAdvance = Math.ceil(monthlyActual * 1.1);
      
      if (Math.abs(suggestedAdvance - currentAdvance) < 5) continue;
      
      await base44.asServiceRole.entities.LeaseContract.update(contract.id, {
        utility_advance: suggestedAdvance
      });
      
      const tenant = await base44.asServiceRole.entities.Tenant.read(contract.tenant_id);
      
      await base44.integrations.Core.SendEmail({
        to: tenant.email,
        subject: 'Anpassung Nebenkostenvorauszahlung',
        body: `Sehr geehrte/r ${tenant.first_name} ${tenant.last_name},

basierend auf der Nebenkostenabrechnung ${lastYear} passen wir Ihre monatliche Vorauszahlung an:

Bisherige Vorauszahlung: ${currentAdvance}€
Neue Vorauszahlung: ${suggestedAdvance}€

Die Anpassung erfolgt ab dem nächsten Monat.

Mit freundlichen Grüßen`
      });
      
      adjustments.push({
        contract_id: contract.id,
        old_advance: currentAdvance,
        new_advance: suggestedAdvance
      });
    }
    
    return Response.json({ success: true, adjustments_made: adjustments.length, adjustments });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});