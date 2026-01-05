import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TAX_LIBRARY_CONFIG = {
  
  // KOSTENKATEGORIEN MASTER (Universal für alle Rechtsformen)
  cost_categories_master: [
    {
      name: "Heizungswartung",
      name_short: "Heizung",
      description: "Wartung und Inspektion der Heizungsanlage",
      category_type: "ERHALTUNG",
      applicable_for_legal_form: ["ALLE"],
      applicable_for_usage: ["ALLE"],
      tax_treatment: "SOFORT",
      default_afa_duration: null,
      allocatable: true,
      requires_additional_info: []
    },
    {
      name: "Neue Heizungsanlage",
      name_short: "Heizung Neu",
      description: "Austausch der gesamten Heizungsanlage",
      category_type: "HERSTELLUNG",
      applicable_for_legal_form: ["ALLE"],
      applicable_for_usage: ["ALLE"],
      tax_treatment: "AFA",
      default_afa_duration: 15,
      allocatable: false,
      requires_additional_info: ["Nutzungsdauer"]
    },
    {
      name: "Darlehens-Zinsen",
      name_short: "Zinsen",
      description: "Zinszahlungen für Immobilien-Darlehen",
      category_type: "FINANZIERUNG",
      applicable_for_legal_form: ["ALLE"],
      applicable_for_usage: ["ALLE"],
      tax_treatment: "SOFORT",
      default_afa_duration: null,
      allocatable: false,
      requires_additional_info: ["Darlehens-ID"]
    },
    {
      name: "Darlehens-Tilgung",
      name_short: "Tilgung",
      description: "Tilgungszahlungen für Immobilien-Darlehen",
      category_type: "FINANZIERUNG",
      applicable_for_legal_form: ["ALLE"],
      applicable_for_usage: ["ALLE"],
      tax_treatment: "NICHT_ABSETZBAR",
      default_afa_duration: null,
      allocatable: false,
      requires_additional_info: ["Darlehens-ID"]
    },
    {
      name: "Schönheitsreparatur",
      name_short: "Schönheitsrep.",
      description: "Malerarbeiten, Tapezieren, etc.",
      category_type: "ERHALTUNG",
      applicable_for_legal_form: ["ALLE"],
      applicable_for_usage: ["ALLE"],
      tax_treatment: "SOFORT",
      default_afa_duration: null,
      allocatable: true,
      requires_additional_info: []
    },
    {
      name: "Anbau/Erweiterung",
      name_short: "Anbau",
      description: "Bauliche Erweiterung des Gebäudes",
      category_type: "HERSTELLUNG",
      applicable_for_legal_form: ["ALLE"],
      applicable_for_usage: ["ALLE"],
      tax_treatment: "AFA",
      default_afa_duration: 50,
      allocatable: false,
      requires_additional_info: ["Nutzungsdauer", "qm"]
    },
    {
      name: "Grundsteuer",
      name_short: "Grundsteuer",
      description: "Jährliche Grundsteuer",
      category_type: "BETRIEB",
      applicable_for_legal_form: ["ALLE"],
      applicable_for_usage: ["ALLE"],
      tax_treatment: "SOFORT",
      default_afa_duration: null,
      allocatable: true,
      requires_additional_info: []
    },
    {
      name: "Gebäudeversicherung",
      name_short: "Versicherung",
      description: "Versicherungsbeiträge für das Gebäude",
      category_type: "BETRIEB",
      applicable_for_legal_form: ["ALLE"],
      applicable_for_usage: ["ALLE"],
      tax_treatment: "SOFORT",
      default_afa_duration: null,
      allocatable: true,
      requires_additional_info: []
    },
    {
      name: "Hausmeisterservice",
      name_short: "Hausmeister",
      description: "Kosten für Hausmeisterleistungen",
      category_type: "BETRIEB",
      applicable_for_legal_form: ["ALLE"],
      applicable_for_usage: ["ALLE"],
      tax_treatment: "SOFORT",
      default_afa_duration: null,
      allocatable: true,
      requires_additional_info: []
    },
    {
      name: "Gartenpflege",
      name_short: "Garten",
      description: "Pflege von Außenanlagen",
      category_type: "BETRIEB",
      applicable_for_legal_form: ["ALLE"],
      applicable_for_usage: ["ALLE"],
      tax_treatment: "SOFORT",
      default_afa_duration: null,
      allocatable: true,
      requires_additional_info: []
    }
  ],

  // STEUERKATEGORIEN - PRIVATPERSON (Anlage V)
  tax_categories_privatperson: [
    {
      legal_form: "PRIVATPERSON",
      form_name: "Anlage V",
      line_field: "Zeile 33",
      designation: "Erhaltungsaufwand",
      skr03_account: "4120",
      skr04_account: "6340",
      elster_field: "E7100503",
      account_framework: "SKR03"
    },
    {
      legal_form: "PRIVATPERSON",
      form_name: "Anlage V",
      line_field: "Zeile 34",
      designation: "Abschreibungen (AfA)",
      skr03_account: "4830",
      skr04_account: "6220",
      elster_field: "E7100504",
      account_framework: "SKR03"
    },
    {
      legal_form: "PRIVATPERSON",
      form_name: "Anlage V",
      line_field: "Zeile 37",
      designation: "Schuldzinsen",
      skr03_account: "4900",
      skr04_account: "6930",
      elster_field: "E7100507",
      account_framework: "SKR03"
    },
    {
      legal_form: "PRIVATPERSON",
      form_name: "Anlage V",
      line_field: "Zeile 40",
      designation: "Grundsteuer",
      skr03_account: "4140",
      skr04_account: "6730",
      elster_field: "E7100510",
      account_framework: "SKR03"
    },
    {
      legal_form: "PRIVATPERSON",
      form_name: "Anlage V",
      line_field: "Zeile 41",
      designation: "Versicherungen",
      skr03_account: "4360",
      skr04_account: "6300",
      elster_field: "E7100511",
      account_framework: "SKR03"
    }
  ],

  // STEUERKATEGORIEN - GmbH (KSt + GuV)
  tax_categories_gmbh: [
    {
      legal_form: "GMBH",
      form_name: "GuV",
      line_field: "Position 5a",
      designation: "Erhaltungsaufwand",
      skr03_account: "4120",
      skr04_account: "6340",
      elster_field: null,
      account_framework: "SKR03"
    },
    {
      legal_form: "GMBH",
      form_name: "GuV",
      line_field: "Position 7a",
      designation: "Abschreibungen auf Sachanlagen",
      skr03_account: "4830",
      skr04_account: "6220",
      elster_field: null,
      account_framework: "SKR03"
    },
    {
      legal_form: "GMBH",
      form_name: "GuV",
      line_field: "Position 12",
      designation: "Zinsen und ähnliche Aufwendungen",
      skr03_account: "4900",
      skr04_account: "6930",
      elster_field: null,
      account_framework: "SKR03"
    },
    {
      legal_form: "GMBH",
      form_name: "GuV",
      line_field: "Position 5b",
      designation: "Grundsteuer",
      skr03_account: "4140",
      skr04_account: "6730",
      elster_field: null,
      account_framework: "SKR03"
    }
  ],

  // STEUERKATEGORIEN - GbR
  tax_categories_gbr: [
    {
      legal_form: "GBR",
      form_name: "Feststellungserklärung",
      line_field: "Zeile 20",
      designation: "Erhaltungsaufwand",
      skr03_account: "4120",
      skr04_account: "6340",
      elster_field: null,
      account_framework: "SKR03"
    },
    {
      legal_form: "GBR",
      form_name: "Feststellungserklärung",
      line_field: "Zeile 21",
      designation: "Abschreibungen",
      skr03_account: "4830",
      skr04_account: "6220",
      elster_field: null,
      account_framework: "SKR03"
    },
    {
      legal_form: "GBR",
      form_name: "Feststellungserklärung",
      line_field: "Zeile 24",
      designation: "Schuldzinsen",
      skr03_account: "4900",
      skr04_account: "6930",
      elster_field: null,
      account_framework: "SKR03"
    }
  ],

  // VERKNÜPFUNGEN Kosten → Steuer
  cost_tax_links: [
    {
      cost_name: "Heizungswartung",
      tax_line_privatperson: "Zeile 33",
      tax_line_gmbh: "Position 5a",
      tax_line_gbr: "Zeile 20",
      condition: null
    },
    {
      cost_name: "Neue Heizungsanlage",
      tax_line_privatperson: "Zeile 34",
      tax_line_gmbh: "Position 7a",
      tax_line_gbr: "Zeile 21",
      condition: null
    },
    {
      cost_name: "Darlehens-Zinsen",
      tax_line_privatperson: "Zeile 37",
      tax_line_gmbh: "Position 12",
      tax_line_gbr: "Zeile 24",
      condition: null
    },
    {
      cost_name: "Darlehens-Tilgung",
      tax_line_privatperson: null,
      tax_line_gmbh: null,
      tax_line_gbr: null,
      condition: "Nicht steuerlich absetzbar"
    },
    {
      cost_name: "Schönheitsreparatur",
      tax_line_privatperson: "Zeile 33",
      tax_line_gmbh: "Position 5a",
      tax_line_gbr: "Zeile 20",
      condition: null
    },
    {
      cost_name: "Anbau/Erweiterung",
      tax_line_privatperson: "Zeile 34",
      tax_line_gmbh: "Position 7a",
      tax_line_gbr: "Zeile 21",
      condition: null
    },
    {
      cost_name: "Grundsteuer",
      tax_line_privatperson: "Zeile 40",
      tax_line_gmbh: "Position 5b",
      tax_line_gbr: "Zeile 20",
      condition: null
    },
    {
      cost_name: "Gebäudeversicherung",
      tax_line_privatperson: "Zeile 41",
      tax_line_gmbh: "Position 5a",
      tax_line_gbr: "Zeile 20",
      condition: null
    },
    {
      cost_name: "Hausmeisterservice",
      tax_line_privatperson: "Zeile 33",
      tax_line_gmbh: "Position 5a",
      tax_line_gbr: "Zeile 20",
      condition: null
    },
    {
      cost_name: "Gartenpflege",
      tax_line_privatperson: "Zeile 33",
      tax_line_gmbh: "Position 5a",
      tax_line_gbr: "Zeile 20",
      condition: null
    }
  ]
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, legal_form, account_framework = 'SKR03', action = 'install' } = await req.json();

    if (action === 'get_all') {
      return Response.json(TAX_LIBRARY_CONFIG);
    }

    if (!building_id || !legal_form) {
      return Response.json({ 
        error: 'building_id und legal_form sind erforderlich' 
      }, { status: 400 });
    }

    // Get building to check if already installed
    const building = await base44.entities.Building.get(building_id);
    if (building.tax_library_installed) {
      return Response.json({ 
        message: 'Bibliothek bereits installiert',
        already_installed: true 
      });
    }

    // Filter cost categories for this legal form
    const relevantCostCategories = TAX_LIBRARY_CONFIG.cost_categories_master.filter(
      cat => cat.applicable_for_legal_form.includes('ALLE') || 
             cat.applicable_for_legal_form.includes(legal_form)
    );

    // Get tax categories for this legal form
    let taxCategories = [];
    switch(legal_form) {
      case 'PRIVATPERSON':
        taxCategories = TAX_LIBRARY_CONFIG.tax_categories_privatperson;
        break;
      case 'GMBH':
      case 'AG':
        taxCategories = TAX_LIBRARY_CONFIG.tax_categories_gmbh;
        break;
      case 'GBR':
        taxCategories = TAX_LIBRARY_CONFIG.tax_categories_gbr;
        break;
    }

    // Create cost categories for this building
    const createdCostCategories = [];
    for (const cat of relevantCostCategories) {
      const created = await base44.asServiceRole.entities.CostCategory.create({
        ...cat,
        is_master: false,
        building_id: building_id
      });
      createdCostCategories.push(created);
    }

    // Create tax categories for this building
    const createdTaxCategories = [];
    for (const cat of taxCategories) {
      const created = await base44.asServiceRole.entities.TaxCategory.create({
        ...cat,
        is_master: false,
        building_id: building_id,
        account_framework: account_framework
      });
      createdTaxCategories.push(created);
    }

    // Create links between cost and tax categories
    const createdLinks = [];
    for (const link of TAX_LIBRARY_CONFIG.cost_tax_links) {
      const costCat = createdCostCategories.find(c => c.name === link.cost_name);
      if (!costCat) continue;

      let taxLineField;
      switch(legal_form) {
        case 'PRIVATPERSON':
          taxLineField = link.tax_line_privatperson;
          break;
        case 'GMBH':
        case 'AG':
          taxLineField = link.tax_line_gmbh;
          break;
        case 'GBR':
          taxLineField = link.tax_line_gbr;
          break;
      }

      if (!taxLineField) continue;

      const taxCat = createdTaxCategories.find(t => t.line_field === taxLineField);
      if (!taxCat) continue;

      const created = await base44.asServiceRole.entities.CostTaxLink.create({
        cost_category_id: costCat.id,
        tax_category_id: taxCat.id,
        legal_form: legal_form,
        priority: 1,
        condition: link.condition,
        is_master: false,
        building_id: building_id
      });
      createdLinks.push(created);
    }

    // Mark library as installed
    await base44.asServiceRole.entities.Building.update(building_id, {
      tax_library_installed: true
    });

    return Response.json({
      success: true,
      installed: {
        cost_categories: createdCostCategories.length,
        tax_categories: createdTaxCategories.length,
        links: createdLinks.length
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});