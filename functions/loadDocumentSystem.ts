import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const DOCUMENT_SYSTEM_CONFIG = {
  
  main_modules: {
    documents: {
      name: "Dokumente",
      description: "Finale Dokumente und Neuerstellung",
      icon: "file-text",
      permissions: ["sachbearbeiter", "administrator"]
    },
    templates: {
      name: "Vorlagen", 
      description: "Templates mit visuellem Editor",
      icon: "layout-template",
      permissions: ["administrator"]
    },
    textblocks: {
      name: "Textbausteine",
      description: "Wiederverwendbare Module", 
      icon: "puzzle",
      permissions: ["administrator"]
    },
    originals: {
      name: "Originale",
      description: "Scan-Upload und Verknüpfungen",
      icon: "folder",
      permissions: ["sachbearbeiter", "administrator"]
    }
  },

  document_statuses: [
    { id: "todo", name: "Zu erledigen", color: "#ff9800", icon: "clock" },
    { id: "remind", name: "Erinnern", color: "#2196f3", icon: "bell" },
    { id: "created", name: "Erstellt", color: "#4caf50", icon: "check-circle" },
    { id: "modified", name: "Geändert", color: "#ff5722", icon: "edit" },
    { id: "sent", name: "Versendet", color: "#9c27b0", icon: "send" },
    { id: "signed", name: "Unterschrieben", color: "#00bcd4", icon: "signature" },
    { id: "scanned", name: "Gescannt", color: "#607d8b", icon: "scan" }
  ],

  default_templates: {
    mietrecht: {
      category: "Mietrecht",
      templates: [
        {
          id: "mietvertrag",
          name: "Mietvertrag",
          description: "Standard-Mietvertrag für Wohnräume",
          required_data: ["mieter", "wohneinheit", "mietvertrag"],
          textblocks: ["anrede", "rechtliche_klauseln", "grussformel"]
        },
        {
          id: "kuendigung",
          name: "Kündigung", 
          description: "Mietvertrag-Kündigung",
          required_data: ["mieter", "wohneinheit", "mietvertrag"],
          textblocks: ["anrede", "kuendigungsgruende", "grussformel"]
        },
        {
          id: "mieterhoehung",
          name: "Mieterhöhung",
          description: "Ankündigung Mieterhöhung",
          required_data: ["mieter", "wohneinheit", "mietvertrag", "forderungen"],
          textblocks: ["anrede", "mieterhoehungsbegruendung", "grussformel"]
        }
      ]
    },
    verwaltung: {
      category: "Verwaltung",
      templates: [
        {
          id: "uebergabeprotokoll", 
          name: "Übergabeprotokoll",
          description: "Wohnungsübergabe dokumentieren",
          required_data: ["mieter", "wohneinheit"],
          textblocks: ["anrede", "uebergabe_standard", "grussformel"]
        },
        {
          id: "mahnung",
          name: "Mahnung",
          description: "Zahlungsaufforderung",
          required_data: ["mieter", "forderungen"],
          textblocks: ["anrede", "mahnungstexte", "grussformel"]
        },
        {
          id: "nebenkostenabrechnung",
          name: "Nebenkostenabrechnung", 
          description: "Jährliche Nebenkostenabrechnung",
          required_data: ["mieter", "wohneinheit", "nebenkosten", "zahlungen"],
          textblocks: ["anrede", "nk_erklaerung", "grussformel"]
        }
      ]
    }
  },

  textblock_categories: [
    {
      id: "hoeflichkeit",
      name: "Höflichkeitsformeln",
      blocks: [
        { id: "anrede_herr", content: "Sehr geehrter Herr {{Mieter.Nachname}}," },
        { id: "anrede_frau", content: "Sehr geehrte Frau {{Mieter.Nachname}}," },
        { id: "anrede_neutral", content: "Sehr geehrte Damen und Herren," },
        { id: "gruss_formal", content: "Mit freundlichen Grüßen\n\n{{Verwalter.Name}}" },
        { id: "gruss_herzlich", content: "Mit herzlichen Grüßen\n\n{{Verwalter.Name}}" }
      ]
    },
    {
      id: "kuendigung", 
      name: "Kündigungsgründe",
      blocks: [
        { 
          id: "eigenbedarf",
          content: "hiermit kündige ich Ihnen das oben genannte Mietverhältnis ordentlich zum {{Kuendigungsdatum}} wegen Eigenbedarfs gemäß § 573 Abs. 2 Nr. 2 BGB."
        },
        {
          id: "zahlungsverzug", 
          content: "hiermit kündige ich Ihnen das Mietverhältnis fristlos zum {{Kuendigungsdatum}} gemäß § 543 BGB wegen erheblicher Mietrückstände."
        }
      ]
    },
    {
      id: "rechtlich",
      name: "Rechtliche Klauseln", 
      blocks: [
        {
          id: "schriftform",
          content: "Änderungen und Ergänzungen dieses Vertrages bedürfen der Schriftform."
        },
        {
          id: "salvatorisch", 
          content: "Sollten einzelne Bestimmungen dieses Vertrages unwirksam sein, bleibt die Wirksamkeit des Vertrages im Übrigen unberührt."
        }
      ]
    },
    {
      id: "mahnung",
      name: "Mahnungstexte",
      blocks: [
        {
          id: "mahnung_1",
          content: "hiermit mahne ich Sie, die rückständigen Mietforderungen in Höhe von {{Offene.Summe}} EUR bis zum {{Zahlungsziel}} zu begleichen."
        },
        {
          id: "mahnung_2", 
          content: "trotz meiner ersten Mahnung sind die Mietforderungen noch nicht beglichen. Ich setze Ihnen hiermit eine letzte Frist bis {{Zahlungsziel}}."
        }
      ]
    },
    {
      id: "mieterhoehung",
      name: "Mieterhöhungsbegründungen",
      blocks: [
        {
          id: "mietspiegel",
          content: "Die Mieterhöhung orientiert sich am aktuellen Mietspiegel der Stadt {{Objekt.Stadt}} und liegt damit im ortsüblichen Rahmen."
        },
        {
          id: "modernisierung",
          content: "Aufgrund durchgeführter Modernisierungsmaßnahmen ist eine Mieterhöhung gemäß § 559 BGB gerechtfertigt."
        }
      ]
    }
  ],

  placeholder_structure: {
    objekt: [
      "{{Objekt.Name}}", "{{Objekt.Adresse}}", "{{Objekt.Stadt}}", 
      "{{Objekt.PLZ}}", "{{Objekt.Eigentuemer}}", "{{Objekt.Verwalter}}"
    ],
    gebaeude: [
      "{{Gebaeude.Bezeichnung}}", "{{Gebaeude.Baujahr}}", "{{Gebaeude.Wohnflaeche}}",
      "{{Gebaeude.Einheiten}}", "{{Gebaeude.Aufzug}}", "{{Gebaeude.Keller}}"
    ],
    flaeche: [
      "{{Flaeche.Nummer}}", "{{Flaeche.Groesse}}", "{{Flaeche.Typ}}",
      "{{Flaeche.Stockwerk}}", "{{Flaeche.Zimmer}}", "{{Flaeche.Balkon}}"
    ],
    mietvertrag: [
      "{{Mietvertrag.Beginn}}", "{{Mietvertrag.Ende}}", "{{Mietvertrag.Miete}}",
      "{{Mietvertrag.Kaution}}", "{{Mietvertrag.Nebenkosten}}", "{{Mietvertrag.Typ}}"
    ],
    mieter: [
      "{{Mieter.Vorname}}", "{{Mieter.Nachname}}", "{{Mieter.Titel}}",
      "{{Mieter.Adresse}}", "{{Mieter.Telefon}}", "{{Mieter.Email}}"
    ],
    forderungen: [
      "{{Forderung.Summe}}", "{{Forderung.Datum}}", "{{Forderung.Typ}}",
      "{{Forderung.Status}}", "{{Forderung.Faellig}}", "{{Forderung.Beschreibung}}"
    ]
  },

  default_queries: [
    {
      id: "offene_forderungen",
      name: "Alle offenen Forderungen",
      query: "SELECT * FROM forderungen WHERE status = 'offen' AND mieter_id = {{current_mieter}}"
    },
    {
      id: "aktuelle_miete", 
      name: "Aktuelle Miete",
      query: "SELECT miete, nebenkosten FROM mietvertraege WHERE aktiv = true AND mieter_id = {{current_mieter}}"
    },
    {
      id: "nebenkosten_jahr",
      name: "Nebenkosten aktuelles Jahr", 
      query: "SELECT * FROM nebenkosten WHERE YEAR(datum) = YEAR(NOW()) AND wohneinheit_id = {{current_wohneinheit}}"
    },
    {
      id: "zahlungen_12m",
      name: "Alle Zahlungen letzten 12 Monate",
      query: "SELECT * FROM zahlungen WHERE datum >= DATE_SUB(NOW(), INTERVAL 12 MONTH) AND mieter_id = {{current_mieter}}"
    }
  ],

  workflows: {
    document_creation: [
      {
        step: 1,
        title: "Vorlage auswählen",
        description: "Liste aller verfügbaren Vorlagen nach Kategorien",
        required_input: "template_id",
        validation: "template_exists"
      },
      {
        step: 2, 
        title: "Datenquelle festlegen",
        description: "Für jedes Datenobjekt: vorhandene auswählen oder neue erstellen",
        required_input: ["data_sources", "new_data_flags"],
        validation: "data_consistency"
      },
      {
        step: 3,
        title: "Fehlende Daten eingeben", 
        description: "Vollständige Eingabeformulare mit Pflichtfeld-Validierung",
        required_input: "missing_data",
        validation: "mandatory_fields"
      },
      {
        step: 4,
        title: "Textbausteine auswählen",
        description: "Verfügbare Bausteine für gewählte Vorlage",
        required_input: "selected_textblocks", 
        validation: "textblock_compatibility"
      },
      {
        step: 5,
        title: "Vorschau und Generierung",
        description: "Dokumentenvorschau mit Entwurf/Finalisierung-Optionen",
        required_input: "final_action",
        validation: "document_completeness"
      }
    ],
    
    template_creation: [
      {
        step: 1,
        title: "Grundeinstellungen",
        description: "Name, Kategorie, Seitenformat",
        required_input: ["name", "category", "page_format"],
        validation: "unique_template_name"
      },
      {
        step: 2,
        title: "Layout-Elemente",
        description: "Textfelder, Platzhalter, Tabellen, Bilder positionieren",
        required_input: "layout_elements",
        validation: "layout_consistency"
      },
      {
        step: 3,
        title: "Platzhalter konfigurieren",
        description: "Strukturierte Datenauswahl aus allen Systemmodulen",
        required_input: "selected_placeholders",
        validation: "placeholder_validity"
      },
      {
        step: 4, 
        title: "Abfragen definieren",
        description: "Standard-Abfragen oder neue Abfragen erstellen",
        required_input: "query_definitions",
        validation: "query_syntax"
      },
      {
        step: 5,
        title: "Formatierung",
        description: "Schriftarten, Größen, Farben, Ausrichtung",
        required_input: "formatting_options",
        validation: "format_compatibility"
      }
    ]
  },

  user_roles: {
    administrator: {
      name: "Administrator",
      permissions: [
        "templates_create", "templates_edit", "templates_delete",
        "textblocks_manage", "system_settings", 
        "documents_create", "documents_edit", "originals_upload"
      ]
    },
    sachbearbeiter: {
      name: "Sachbearbeiter", 
      permissions: [
        "documents_create", "documents_edit", "templates_use",
        "textblocks_use", "originals_upload", "originals_link"
      ]
    },
    nur_lesen: {
      name: "Nur-Leser",
      permissions: [
        "documents_view", "status_view"
      ]
    }
  },

  performance_limits: {
    preview_generation_seconds: 3,
    document_creation_seconds: 5, 
    upload_max_size_mb: 50,
    batch_upload_max_files: 20
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { module = 'all' } = await req.json();
    
    let result;
    switch(module) {
      case 'templates':
        result = DOCUMENT_SYSTEM_CONFIG.default_templates;
        break;
      case 'textblocks': 
        result = DOCUMENT_SYSTEM_CONFIG.textblock_categories;
        break;
      case 'placeholders':
        result = DOCUMENT_SYSTEM_CONFIG.placeholder_structure;
        break;
      case 'workflows':
        result = DOCUMENT_SYSTEM_CONFIG.workflows;
        break;
      case 'statuses':
        result = DOCUMENT_SYSTEM_CONFIG.document_statuses;
        break;
      case 'queries':
        result = DOCUMENT_SYSTEM_CONFIG.default_queries;
        break;
      case 'roles':
        result = DOCUMENT_SYSTEM_CONFIG.user_roles;
        break;
      default:
        result = DOCUMENT_SYSTEM_CONFIG;
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});