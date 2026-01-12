import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { taxable_amount, user_email, use_saver_allowance = true } = await req.json();
    
    // User Tax Settings laden
    const settings = await base44.entities.UserTaxSettings.filter({ user_email });
    if (settings.length === 0) {
      return Response.json({ error: 'Steuereinstellungen nicht gefunden' }, { status: 400 });
    }
    
    const userSettings = settings[0];
    
    // Sparerpauschbetrag berechnen
    const sparerpauschbetrag = userSettings.marital_status === "VERHEIRATET" ? 2000 : 1000;
    const sparerpauschbetragAvailable = Math.max(0, sparerpauschbetrag - (userSettings.sparerpauschbetrag_used || 0));
    
    let effectiveAmount = taxable_amount;
    let freibetragUsed = 0;
    
    if (use_saver_allowance && sparerpauschbetragAvailable > 0) {
      freibetragUsed = Math.min(sparerpauschbetragAvailable, effectiveAmount);
      effectiveAmount -= freibetragUsed;
    }
    
    if (effectiveAmount <= 0) {
      return Response.json({
        kest: 0,
        soli: 0,
        kirchensteuer: 0,
        total: 0,
        netAmount: taxable_amount,
        freibetragUsed: freibetragUsed,
        effectiveTaxRate: 0
      });
    }
    
    // Günstigerprüfung
    let effectiveTaxRate = 0.25;
    if (userSettings.guenstigerpruefung && userSettings.personal_tax_rate) {
      effectiveTaxRate = Math.min(0.25, userSettings.personal_tax_rate / 100);
    }
    
    // Steuerberechnung
    let kest, soli, kirchensteuer;
    
    if (userSettings.church_member && userSettings.church_tax_state) {
      const kirchensteuerRate = 
        userSettings.church_tax_state === "BAYERN" || 
        userSettings.church_tax_state === "BADEN_WUERTTEMBERG" ? 0.08 : 0.09;
      
      const divisor = 1 + 0.055 * effectiveTaxRate + kirchensteuerRate * effectiveTaxRate;
      kest = (effectiveAmount * effectiveTaxRate) / divisor;
      soli = kest * 0.055;
      kirchensteuer = kest * kirchensteuerRate;
    } else {
      kest = effectiveAmount * effectiveTaxRate;
      soli = kest * 0.055;
      kirchensteuer = 0;
    }
    
    const total = kest + soli + kirchensteuer;
    const netAmount = taxable_amount - total;
    
    console.log(`[Tax] Amount: ${taxable_amount}, KESt: ${kest.toFixed(2)}, Total: ${total.toFixed(2)}`);
    
    return Response.json({
      kest: Number(kest.toFixed(2)),
      soli: Number(soli.toFixed(2)),
      kirchensteuer: Number(kirchensteuer.toFixed(2)),
      total: Number(total.toFixed(2)),
      netAmount: Number(netAmount.toFixed(2)),
      freibetragUsed: Number(freibetragUsed.toFixed(2)),
      effectiveTaxRate: effectiveTaxRate,
      sparerpauschbetragRemaining: sparerpauschbetragAvailable - freibetragUsed
    });
  } catch (error) {
    console.error('[Tax] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});