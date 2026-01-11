import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all contracts with index clause
    const contracts = await base44.asServiceRole.entities.LeaseContract.filter({ status: 'active' });
    const indexContracts = contracts.filter(c => c.rent_type === 'index' || c.index_linked);
    
    const adjustments = [];
    
    // Current VPI (Verbraucherpreisindex) - simplified, in reality fetch from API
    const currentVPI = 118.5; // Example value
    
    for (const contract of indexContracts) {
      const baseIndex = contract.base_index || 100;
      const baseRent = contract.base_rent || contract.monthly_rent;
      
      const indexChange = ((currentVPI - baseIndex) / baseIndex) * 100;
      
      // Only adjust if change >= 5%
      if (indexChange < 5) continue;
      
      const adjustedRent = Math.round((baseRent * (currentVPI / baseIndex)) * 100) / 100;
      
      // Check if already adjusted this year
      const existingAdjustments = await base44.asServiceRole.entities.IndexRentAdjustment.filter({
        contract_id: contract.id
      });
      
      const thisYear = new Date().getFullYear();
      const alreadyAdjusted = existingAdjustments.some(a => 
        a.effective_date?.includes(String(thisYear))
      );
      
      if (alreadyAdjusted) continue;
      
      const effectiveDate = new Date();
      effectiveDate.setMonth(effectiveDate.getMonth() + 3); // 3 months notice
      
      const adjustment = await base44.asServiceRole.entities.IndexRentAdjustment.create({
        contract_id: contract.id,
        company_id: contract.company_id,
        base_rent: baseRent,
        base_index: baseIndex,
        current_index: currentVPI,
        adjusted_rent: adjustedRent,
        adjustment_percentage: Math.round(indexChange * 100) / 100,
        effective_date: effectiveDate.toISOString().split('T')[0],
        status: 'calculated'
      });
      
      const tenant = await base44.asServiceRole.entities.Tenant.read(contract.tenant_id);
      
      await base44.integrations.Core.SendEmail({
        to: tenant.email,
        subject: 'Mietanpassung aufgrund Indexentwicklung',
        body: `Sehr geehrte/r ${tenant.first_name} ${tenant.last_name},

aufgrund der Entwicklung des Verbraucherpreisindex (VPI) wird Ihre Miete wie folgt angepasst:

Bisherige Miete: ${contract.monthly_rent}€
Neue Miete: ${adjustedRent}€
Indexsteigerung: ${indexChange.toFixed(2)}%

Die Anpassung wird gültig ab: ${effectiveDate.toLocaleDateString('de-DE')}

Mit freundlichen Grüßen`
      });
      
      await base44.asServiceRole.entities.IndexRentAdjustment.update(adjustment.id, {
        status: 'notified'
      });
      
      adjustments.push(adjustment);
    }
    
    return Response.json({ success: true, adjustments_calculated: adjustments.length, adjustments });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});