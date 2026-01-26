import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Seed-Funktion: Standard-Kostenarten nach BetrKV
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const costTypes = [
      {
        main_category: 'Grundsteuer',
        sub_category: 'Grundsteuer',
        betrkv_paragraph: '§2 Nr. 1',
        distributable: true,
        distribution_key: 'Flaeche',
        sort_order: 1
      },
      {
        main_category: 'Wasser/Abwasser',
        sub_category: 'Wasserversorgung',
        betrkv_paragraph: '§2 Nr. 2',
        distributable: true,
        distribution_key: 'Personen',
        sort_order: 2
      },
      {
        main_category: 'Wasser/Abwasser',
        sub_category: 'Abwasserentsorgung',
        betrkv_paragraph: '§2 Nr. 3',
        distributable: true,
        distribution_key: 'Personen',
        sort_order: 3
      },
      {
        main_category: 'Heizung',
        sub_category: 'Heizkosten',
        betrkv_paragraph: '§2 Nr. 4a-c',
        distributable: true,
        distribution_key: 'HeizkostenV',
        requires_meter: true,
        is_heating_related: true,
        sort_order: 4
      },
      {
        main_category: 'Warmwasser',
        sub_category: 'Warmwasserkosten',
        betrkv_paragraph: '§2 Nr. 4d',
        distributable: true,
        distribution_key: 'HeizkostenV',
        requires_meter: true,
        is_heating_related: true,
        sort_order: 5
      },
      {
        main_category: 'Aufzug',
        sub_category: 'Aufzugswartung',
        betrkv_paragraph: '§2 Nr. 5',
        distributable: true,
        distribution_key: 'Flaeche',
        sort_order: 6
      },
      {
        main_category: 'Reinigung',
        sub_category: 'Straßenreinigung',
        betrkv_paragraph: '§2 Nr. 6',
        distributable: true,
        distribution_key: 'Flaeche',
        sort_order: 7
      },
      {
        main_category: 'Müllabfuhr',
        sub_category: 'Müllbeseitigung',
        betrkv_paragraph: '§2 Nr. 7',
        distributable: true,
        distribution_key: 'Personen',
        sort_order: 8
      },
      {
        main_category: 'Reinigung',
        sub_category: 'Gebäudereinigung',
        betrkv_paragraph: '§2 Nr. 8',
        distributable: true,
        distribution_key: 'Flaeche',
        sort_order: 9
      },
      {
        main_category: 'Reinigung',
        sub_category: 'Ungezieferbekämpfung',
        betrkv_paragraph: '§2 Nr. 9',
        distributable: true,
        distribution_key: 'Flaeche',
        sort_order: 10
      },
      {
        main_category: 'Garten',
        sub_category: 'Gartenpflege',
        betrkv_paragraph: '§2 Nr. 10',
        distributable: true,
        distribution_key: 'Flaeche',
        sort_order: 11
      },
      {
        main_category: 'Allgemeinstrom',
        sub_category: 'Beleuchtung',
        betrkv_paragraph: '§2 Nr. 11',
        distributable: true,
        distribution_key: 'Flaeche',
        sort_order: 12
      },
      {
        main_category: 'Reinigung',
        sub_category: 'Schornsteinreinigung',
        betrkv_paragraph: '§2 Nr. 12',
        distributable: true,
        distribution_key: 'Einheiten',
        sort_order: 13
      },
      {
        main_category: 'Versicherungen',
        sub_category: 'Gebäudeversicherung',
        betrkv_paragraph: '§2 Nr. 13',
        distributable: true,
        distribution_key: 'Flaeche',
        sort_order: 14
      },
      {
        main_category: 'Hauswart',
        sub_category: 'Hausmeister',
        betrkv_paragraph: '§2 Nr. 14',
        distributable: true,
        distribution_key: 'Flaeche',
        sort_order: 15
      },
      {
        main_category: 'Sonstige',
        sub_category: 'Kabelanschluss',
        betrkv_paragraph: '§2 Nr. 15',
        distributable: true,
        distribution_key: 'Einheiten',
        sort_order: 16
      },
      {
        main_category: 'Sonstige',
        sub_category: 'Waschküche',
        betrkv_paragraph: '§2 Nr. 16',
        distributable: true,
        distribution_key: 'Einheiten',
        sort_order: 17
      }
    ];

    const created = await base44.asServiceRole.entities.CostType.bulkCreate(costTypes);

    return Response.json({
      success: true,
      created: created.length,
      costTypes: created
    });

  } catch (error) {
    console.error('Error seeding cost types:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});