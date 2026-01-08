import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin required' }, { status: 403 });
    }

    console.log('[COMPLIANCE] Monitoring for violations...');

    // 1. Hole alle Transaktionen der letzten 7 Tage
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentTxs = await base44.entities.BankTransaction.filter({
      transaction_date: { $gte: sevenDaysAgo }
    });

    const violations = [];

    // 2. Prüfe Compliance-Regeln
    for (const tx of recentTxs) {
      // Regel 1: Große Beträge ohne Dokumentation
      if (Math.abs(tx.amount) > 5000 && !tx.is_categorized) {
        violations.push({
          type: 'UNDOCUMENTED_LARGE_AMOUNT',
          transaction_id: tx.id,
          severity: 'HIGH',
          message: `Betrag €${Math.abs(tx.amount)} nicht kategorisiert`,
          timestamp: new Date().toISOString()
        });
      }

      // Regel 2: Ungewöhnliche Sender
      if (tx.sender_receiver && tx.sender_receiver.includes('BANK') && tx.amount > 1000) {
        violations.push({
          type: 'SUSPICIOUS_SENDER',
          transaction_id: tx.id,
          severity: 'MEDIUM',
          message: 'Verdächtige Bankverbindung erkannt',
          timestamp: new Date().toISOString()
        });
      }

      // Regel 3: Fehlende IBAN
      if (!tx.iban && Math.abs(tx.amount) > 1000) {
        violations.push({
          type: 'MISSING_IBAN',
          transaction_id: tx.id,
          severity: 'MEDIUM',
          message: 'IBAN für großen Betrag fehlt',
          timestamp: new Date().toISOString()
        });
      }
    }

    // 3. Sende Benachrichtigungen für kritische Verstöße
    const criticalViolations = violations.filter(v => v.severity === 'HIGH');
    
    if (criticalViolations.length > 0) {
      console.log(`[COMPLIANCE] Found ${criticalViolations.length} critical violations`);
      
      // Log als Activity
      for (const violation of criticalViolations) {
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: `Compliance Alert: ${violation.type}`,
          body: violation.message
        });
      }
    }

    return Response.json({
      success: true,
      total_violations: violations.length,
      critical: criticalViolations.length,
      violations
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});