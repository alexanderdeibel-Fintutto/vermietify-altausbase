import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    console.log('[BOOKING-LINK] Linking bookings to ELSTER submission:', submission_id);

    const submissions = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (!submissions || submissions.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissions[0];

    // Alle FinancialItems für das Jahr und Gebäude laden
    const financialItems = await base44.entities.FinancialItem.filter({
      building_id: submission.building_id
    });

    // Nach Typ und Jahr filtern (würde normalerweise bessere Filter geben)
    const yearItems = financialItems.filter(item => {
      const itemYear = new Date(item.date).getFullYear();
      return itemYear === submission.tax_year;
    });

    // Pro Kostenkategorie Summen berechnen
    const categories = {};
    for (const item of yearItems) {
      const category = item.cost_category || 'SONSTIGE';
      categories[category] = (categories[category] || 0) + (item.amount || 0);
    }

    // Form-Daten mit Booking-Daten aktualisieren
    const updatedFormData = {
      ...submission.form_data,
      // Automatisch berechnete Werte aus Bookings
      mieteinnahmen: yearItems
        .filter(i => i.type === 'INCOME')
        .reduce((sum, i) => sum + (i.amount || 0), 0),
      gesamtausgaben: yearItems
        .filter(i => i.type === 'EXPENSE')
        .reduce((sum, i) => sum + (i.amount || 0), 0),
      // Kategorisierte Ausgaben
      ...Object.fromEntries(
        Object.entries(categories).map(([cat, amount]) => 
          [`ausgaben_${cat.toLowerCase()}`, amount]
        )
      )
    };

    // Submission aktualisieren
    await base44.entities.ElsterSubmission.update(submission_id, {
      form_data: updatedFormData,
      validation_errors: [] // Zurücksetzen da neue Daten
    });

    return Response.json({ 
      success: true, 
      linked_items: yearItems.length,
      categories_found: Object.keys(categories).length,
      updated_values: {
        income: updatedFormData.mieteinnahmen,
        expenses: updatedFormData.gesamtausgaben
      }
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});