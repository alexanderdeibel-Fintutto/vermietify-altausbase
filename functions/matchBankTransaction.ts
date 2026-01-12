import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { bank_transaction_id } = await req.json();
    
    const tx = await base44.entities.BankTransaction.get(bank_transaction_id);
    if (!tx) {
      return Response.json({ error: 'Bank transaction not found' }, { status: 404 });
    }
    
    const purpose = (tx.purpose || "").toLowerCase();
    const amount = tx.amount || 0;
    
    // Pattern-Matching für Dividenden
    const dividendPatterns = [
      /dividende/i,
      /ausschüttung/i,
      /ertrag/i,
      /kapitalertrag/i,
      /zinsen/i
    ];
    
    // ISIN-Erkennung
    const isinMatch = purpose.match(/[A-Z]{2}[A-Z0-9]{9}[0-9]/);
    
    // WKN-Erkennung
    const wknMatch = purpose.match(/wkn[:\s]*([A-Z0-9]{6})/i);
    
    // Broker-Erkennung
    const brokerPatterns = {
      "Trade Republic": /trade republic/i,
      "Scalable Capital": /scalable/i,
      "comdirect": /comdirect/i,
      "ING": /ing-diba|ing\.de/i,
      "DKB": /dkb|deutsche kreditbank/i,
      "Consorsbank": /consorsbank|consors/i,
      "flatex": /flatex/i,
      "Binance": /binance/i,
      "Kraken": /kraken/i,
      "Coinbase": /coinbase/i
    };
    
    let matchedBroker = null;
    for (const [broker, pattern] of Object.entries(brokerPatterns)) {
      if (pattern.test(purpose) || pattern.test(tx.counterpart_name || "")) {
        matchedBroker = broker;
        break;
      }
    }
    
    // Krypto-Erkennung
    const cryptoPatterns = [
      /bitcoin|btc/i,
      /ethereum|eth/i,
      /crypto|krypto/i
    ];
    
    // Logik für Dividend-Matching
    if (isinMatch && dividendPatterns.some(p => p.test(purpose))) {
      const stocks = await base44.entities.Stock.list();
      const matchedStock = stocks.find(s => s.isin === isinMatch[0]);
      
      return Response.json({
        type: "DIVIDEND",
        matchedAsset: matchedStock || null,
        suggestedTransaction: {
          stock_id: matchedStock?.id,
          dividend_type: "BAR_DIVIDENDE",
          gross_amount_total: Math.abs(amount),
          payment_date: tx.booking_date
        },
        confidence: matchedStock ? "HIGH" : "MEDIUM",
        broker: matchedBroker
      });
    }
    
    // Logik für Stock Purchase
    if (isinMatch && amount < 0) {
      const stocks = await base44.entities.Stock.list();
      const matchedStock = stocks.find(s => s.isin === isinMatch[0]);
      
      return Response.json({
        type: "STOCK_PURCHASE",
        matchedAsset: matchedStock || null,
        suggestedTransaction: {
          asset_type: "STOCK",
          asset_id: matchedStock?.id,
          transaction_type: "KAUF",
          total_amount: Math.abs(amount),
          transaction_date: tx.booking_date,
          broker_name: matchedBroker
        },
        confidence: matchedStock ? "HIGH" : "MEDIUM",
        broker: matchedBroker
      });
    }
    
    // Krypto-Erkennung
    if (cryptoPatterns.some(p => p.test(purpose))) {
      return Response.json({
        type: "CRYPTO_TRANSACTION",
        matchedAsset: null,
        suggestedTransaction: {
          asset_type: "CRYPTO",
          transaction_type: amount > 0 ? "VERKAUF" : "KAUF",
          total_amount: Math.abs(amount),
          transaction_date: tx.booking_date,
          broker_name: matchedBroker
        },
        confidence: "LOW",
        broker: matchedBroker
      });
    }
    
    return Response.json({
      type: "UNKNOWN",
      matchedAsset: null,
      suggestedTransaction: null,
      confidence: "NONE",
      reason: "Keine erkannten Muster"
    });
  } catch (error) {
    console.error('[Match] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});