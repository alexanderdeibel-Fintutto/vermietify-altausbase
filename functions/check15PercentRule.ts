import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { building_id, new_amount } = await req.json();
    
    // Hole Bibliothek
    const libraries = await base44.entities.BuildingTaxLibrary.filter({ building_id });
    
    if (!libraries || libraries.length === 0) {
      return Response.json({ applies: false });
    }
    
    const library = libraries[0];
    
    // Nur für Privatpersonen relevant
    if (library.legal_form !== 'PRIVATPERSON') {
      return Response.json({ applies: false });
    }
    
    // Hole Gebäudedaten
    const building = await base44.entities.Building.get(building_id);
    
    if (!building || !building.purchase_price || !building.purchase_date) {
      return Response.json({ applies: false });
    }
    
    const purchasePrice = building.purchase_price - (building.purchase_price_land || 0); // Nur Gebäude, ohne Grundstück
    const purchaseDate = new Date(building.purchase_date);
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    
    // Nur prüfen wenn innerhalb 3 Jahre nach Kauf
    if (purchaseDate <= threeYearsAgo) {
      return Response.json({ applies: false });
    }
    
    // Hole alle Erhaltungsaufwendungen seit Kauf
    // Filtere nach Kategorien vom Typ ERHALTUNG
    const erhaltungsCategories = library.cost_categories
      .filter(cat => cat.type === 'ERHALTUNG')
      .map(cat => cat.id);
    
    // Hole alle Rechnungen/Belege mit Erhaltungskategorien
    const invoices = await base44.entities.Invoice.filter({
      building_id: building_id,
      invoice_date_gte: purchaseDate.toISOString()
    });
    
    // Summiere nur Erhaltungsaufwendungen
    const totalExpenses = invoices
      .filter(inv => erhaltungsCategories.includes(inv.cost_category_id))
      .reduce((sum, inv) => sum + (inv.net_amount || 0), 0) + new_amount;
    
    const limit = purchasePrice * 0.15;
    
    if (totalExpenses > limit) {
      return Response.json({
        applies: true,
        total_expenses: totalExpenses,
        limit: limit,
        exceeded_by: totalExpenses - limit,
        purchase_price: purchasePrice,
        warning: '⚠️ 15%-Grenze überschritten! Aufwand kann verteilt werden (§6b EStG).'
      });
    }
    
    return Response.json({ 
      applies: false,
      total_expenses: totalExpenses,
      limit: limit,
      remaining: limit - totalExpenses
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});