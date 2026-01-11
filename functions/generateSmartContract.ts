import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { contract_id } = await req.json();
    
    const contract = await base44.asServiceRole.entities.LeaseContract.read(contract_id);
    
    // Generate blockchain hash (simplified simulation)
    const contractData = JSON.stringify({
      contract_id,
      rent: contract.monthly_rent,
      deposit: contract.deposit_amount,
      start: contract.start_date,
      end: contract.end_date,
      timestamp: Date.now()
    });
    
    const blockchainHash = `0x${Array.from(
      new TextEncoder().encode(contractData)
    ).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 64)}`;

    const smartContract = await base44.asServiceRole.entities.SmartContract.create({
      contract_id,
      company_id: contract.company_id,
      blockchain_hash: blockchainHash,
      contract_terms: {
        rent_amount: contract.monthly_rent,
        payment_day: contract.payment_day || 1,
        deposit_amount: contract.deposit_amount,
        start_date: contract.start_date,
        end_date: contract.end_date
      },
      signatures: [{
        party: 'landlord',
        signature_hash: `sig_${Date.now()}`,
        timestamp: new Date().toISOString()
      }],
      automated_payments: true,
      status: 'pending'
    });

    return Response.json({ 
      success: true, 
      smart_contract: smartContract,
      blockchain_hash: blockchainHash
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});