import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { analysis_id, overrides } = await req.json();

    // Get analysis
    const analysis = await base44.entities.DocumentAnalysis.get(analysis_id);

    // Create financial item with optional overrides
    const financialItemData = {
      type: analysis.document_type === 'invoice' || analysis.document_type === 'receipt' ? 'expense' : 'income',
      category: overrides?.category || analysis.category || 'general',
      amount: overrides?.amount || analysis.amount,
      date: overrides?.date || analysis.date,
      description: overrides?.description || 
        `${analysis.vendor_name || analysis.tenant_name || 'Unbekannt'} - ${analysis.invoice_number || ''}`,
      building_id: overrides?.building_id || analysis.building_id,
      unit_id: overrides?.unit_id || analysis.unit_id,
      invoice_number: analysis.invoice_number,
      notes: `Erstellt aus Dokumentenanalyse (ID: ${analysis_id})`
    };

    const financialItem = await base44.entities.FinancialItem.create(financialItemData);

    // Update analysis status
    await base44.entities.DocumentAnalysis.update(analysis_id, {
      financial_item_id: financialItem.id,
      status: 'linked'
    });

    // Create notification
    await base44.asServiceRole.entities.Notification.create({
      user_id: user.id,
      title: 'Buchung erstellt',
      message: `${financialItemData.description} - ${financialItemData.amount.toFixed(2)} €`,
      type: 'success',
      is_read: false
    });

    return Response.json({
      financial_item: financialItem,
      analysis
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});