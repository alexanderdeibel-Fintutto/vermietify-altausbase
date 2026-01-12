import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { stock_id, year_start_value, year_end_value, basiszins = 2.55 } = await req.json();
    
    const stock = await base44.entities.Stock.get(stock_id);
    if (!stock) {
      return Response.json({ error: 'Stock not found' }, { status: 404 });
    }
    
    // Vorabpauschale nur für thesaurierende ETFs
    if (!stock.is_accumulating || stock.type !== "ETF") {
      return Response.json({
        vorabpauschale: 0,
        taxableAmount: 0,
        reason: "Keine Vorabpauschale für ausschüttende Fonds oder andere Wertpapiere"
      });
    }
    
    // 1. Basisertrag = Jahresanfangswert × Basiszins × 70%
    const basisertrag = year_start_value * (basiszins / 100) * 0.7;
    
    // 2. Wertsteigerung im Jahr
    const wertsteigerung = Math.max(0, year_end_value - year_start_value);
    
    // 3. Vorabpauschale = Minimum
    const vorabpauschale = Math.min(basisertrag, wertsteigerung);
    
    // 4. Teilfreistellung anwenden
    const teilfreistellung = stock.teilfreistellung_prozent || 30;
    const taxableAmount = vorabpauschale * (1 - teilfreistellung / 100);
    
    console.log(`[Vorabpauschale] ${stock.name}: ${vorabpauschale.toFixed(2)}€ (steuerpflichtig: ${taxableAmount.toFixed(2)}€)`);
    
    return Response.json({
      vorabpauschale: Number(vorabpauschale.toFixed(2)),
      taxableAmount: Number(taxableAmount.toFixed(2)),
      basisertrag: Number(basisertrag.toFixed(2)),
      wertsteigerung: Number(wertsteigerung.toFixed(2)),
      teilfreistellung: teilfreistellung,
      basiszins: basiszins
    });
  } catch (error) {
    console.error('[Vorabpauschale] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});