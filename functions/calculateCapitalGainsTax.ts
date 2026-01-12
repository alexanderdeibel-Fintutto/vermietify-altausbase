import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { gain, fsa_available, kirchensteuer_satz = 0 } = await req.json();
    
    console.log(`[Tax Calc] Gain: ${gain}€, FSA available: ${fsa_available}€`);
    
    if (gain <= 0) {
      return Response.json({ 
        tax: 0,
        taxable_gain: 0,
        fsa_used: 0
      });
    }
    
    const fsa_used = Math.min(gain, fsa_available);
    const taxable_gain = Math.max(0, gain - fsa_available);
    
    const kapitalertragsteuer = taxable_gain * 0.25;
    const solidaritaetszuschlag = kapitalertragsteuer * 0.055;
    const kirchensteuer = kapitalertragsteuer * kirchensteuer_satz;
    
    const total_tax = kapitalertragsteuer + solidaritaetszuschlag + kirchensteuer;
    
    console.log(`[Tax Calc] Total tax: ${total_tax.toFixed(2)}€`);
    
    return Response.json({
      taxable_gain,
      kapitalertragsteuer,
      solidaritaetszuschlag,
      kirchensteuer,
      total_tax,
      fsa_used
    });
  } catch (error) {
    console.error('[Tax Calc] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});