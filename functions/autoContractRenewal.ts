import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const today = new Date();
    const threeMonthsFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
    
    const expiringContracts = await base44.asServiceRole.entities.LeaseContract.filter({ 
      status: 'active' 
    });
    
    const renewals = [];
    
    for (const contract of expiringContracts) {
      const endDate = new Date(contract.end_date);
      
      if (endDate > threeMonthsFromNow || endDate < today) continue;
      
      // Check if renewal already exists
      const existing = await base44.asServiceRole.entities.ContractRenewal.filter({
        contract_id: contract.id
      });
      if (existing.length > 0) continue;
      
      const proposedEndDate = new Date(endDate);
      proposedEndDate.setFullYear(proposedEndDate.getFullYear() + 1);
      
      const renewal = await base44.asServiceRole.entities.ContractRenewal.create({
        contract_id: contract.id,
        company_id: contract.company_id,
        current_end_date: contract.end_date,
        proposed_end_date: proposedEndDate.toISOString().split('T')[0],
        renewal_type: 'automatic',
        status: 'pending',
        notification_sent: false
      });
      
      // Send notification to tenant
      const tenant = await base44.asServiceRole.entities.Tenant.read(contract.tenant_id);
      
      await base44.integrations.Core.SendEmail({
        to: tenant.email,
        subject: 'Vertragsverlängerung - Ihre Mietwohnung',
        body: `Sehr geehrte/r ${tenant.first_name} ${tenant.last_name},

Ihr Mietvertrag läuft am ${endDate.toLocaleDateString('de-DE')} aus.

Wir möchten Ihnen hiermit eine Verlängerung bis zum ${proposedEndDate.toLocaleDateString('de-DE')} anbieten.
Die Konditionen bleiben unverändert bei ${contract.monthly_rent}€ monatlich.

Bitte teilen Sie uns bis spätestens 30 Tage vor Vertragsende mit, ob Sie verlängern möchten.

Mit freundlichen Grüßen`
      });
      
      await base44.asServiceRole.entities.ContractRenewal.update(renewal.id, {
        notification_sent: true,
        status: 'sent'
      });
      
      renewals.push(renewal);
    }
    
    return Response.json({ success: true, renewals_processed: renewals.length, renewals });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});