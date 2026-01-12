import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { bank_transaction_id } = await req.json();

    const transaction = await base44.entities.BankTransaction.get(bank_transaction_id);
    if (!transaction) {
      return Response.json({ error: 'Banktransaktion nicht gefunden' }, { status: 404 });
    }

    const purpose = transaction.purpose?.toLowerCase() || '';
    let match_type = null;
    let keywords = [];

    // Pattern-Erkennung
    if (purpose.includes('wertpapierkauf') || (purpose.includes('kauf') && purpose.includes('aktie'))) {
      match_type = 'BUY';
      keywords = ['wertpapierkauf', 'aktienk', 'etf-kauf'];
    } else if (purpose.includes('dividende') || purpose.includes('ausschüttung') || purpose.includes('dividend')) {
      match_type = 'DIVIDEND';
      keywords = ['dividende', 'ausschüttung', 'distribution'];
    } else if (purpose.includes('verkauf') || purpose.includes('verkauft')) {
      match_type = 'SELL';
      keywords = ['verkauf', 'verkauft'];
    } else if (purpose.includes('staking') || purpose.includes('reward')) {
      match_type = 'DIVIDEND';
      keywords = ['staking', 'reward'];
    }

    if (!match_type) {
      return Response.json({ 
        match: null, 
        reason: 'Keine erkannten Keywords für Vermögenstransaktionen' 
      });
    }

    // Finde passende AssetTransaction
    const asset_transactions = await base44.entities.AssetTransaction.filter({
      transaction_type: match_type,
      matched_bank_transaction_id: null, // noch nicht zugeordnet
    });

    // Filtere nach Betrag (±5% Toleranz)
    const tolerance = Math.abs(transaction.amount) * 0.05;
    const candidates = asset_transactions.filter(
      at => Math.abs(Math.abs(at.total_amount) - Math.abs(transaction.amount)) <= tolerance
    );

    if (candidates.length === 1) {
      // Eindeutige Zuordnung
      await base44.entities.AssetTransaction.update(candidates[0].id, {
        matched_bank_transaction_id: bank_transaction_id,
      });

      console.log(`[Match] Auto-matched: ${bank_transaction_id} to AssetTransaction ${candidates[0].id}`);

      return Response.json({
        match: 'AUTO',
        confidence: 95,
        asset_transaction_id: candidates[0].id,
      });
    } else if (candidates.length > 1) {
      // Mehrere Kandidaten → Vorschläge
      console.log(`[Match] Found ${candidates.length} suggestions for: ${bank_transaction_id}`);

      return Response.json({
        match: 'SUGGESTIONS',
        confidence: 70,
        suggestions: candidates.map(c => ({
          id: c.id,
          asset_id: c.asset_id,
          transaction_type: c.transaction_type,
          amount: c.total_amount,
          date: c.transaction_date,
        })),
      });
    }

    return Response.json({
      match: null,
      reason: 'Keine passenden Transaktionen gefunden',
    });
  } catch (error) {
    console.error('[Bank Transaction Match] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});