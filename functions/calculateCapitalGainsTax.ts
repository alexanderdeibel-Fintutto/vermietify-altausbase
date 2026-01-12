import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { 
      gain, 
      fsa_available = 0, 
      kirchensteuer_satz = 0 
    } = await req.json();

    if (gain <= 0) {
      return Response.json({
        taxable_gain: 0,
        kapitalertragsteuer: 0,
        solidaritaetszuschlag: 0,
        kirchensteuer: 0,
        total_tax: 0,
        fsa_used: 0,
        net_gain: gain,
      });
    }

    const fsa_used = Math.min(gain, fsa_available);
    const taxable_gain = gain - fsa_used;

    const kapitalertragsteuer = taxable_gain * 0.25;
    const solidaritaetszuschlag = kapitalertragsteuer * 0.055;
    const kirchensteuer = kapitalertragsteuer * kirchensteuer_satz;

    const total_tax = kapitalertragsteuer + solidaritaetszuschlag + kirchensteuer;

    console.log(`[Tax] Gain: ${gain}€, Tax: ${total_tax}€, FSA Used: ${fsa_used}€`);

    return Response.json({
      taxable_gain,
      kapitalertragsteuer,
      solidaritaetszuschlag,
      kirchensteuer,
      total_tax,
      fsa_used,
      net_gain: gain - total_tax,
    });
  } catch (error) {
    console.error('[Capital Gains Tax] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});