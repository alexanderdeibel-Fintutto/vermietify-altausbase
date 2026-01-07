import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Nur Admins können Beispieldaten generieren' }, { status: 403 });
        }

        const { preset = 'komplett', format = 'json' } = await req.json();

        const startTime = Date.now();

        // Generiere strukturierte Beispieldaten mit LLM
        const prompt = `Generiere VOLLSTÄNDIG REALISTISCHE, ANONYMISIERTE Beispiel-Daten für eine deutsche Immobilienverwaltungs-Software.

WICHTIG: Alle Daten müssen VOLLSTÄNDIG und REALISTISCH sein. Keine Platzhalter oder "..."!

${preset === 'komplett' ? 'Erstelle ALLE 5 Immobilientypen:' : `Erstelle nur: ${preset}`}

1. EINFAMILIENHAUS (Privater Eigentümer):
   - Eigentümer: Privatperson (Name, Adresse, Kontakt)
   - Objekt: Einfamilienhaus in Vorort, Baujahr 1995, 120m² Wohnfläche, 300m² Grundstück
   - Selbstgenutzt (keine Vermietung)
   - Kaufpreis: 450.000€ (Jahr 2020)
   - Finanzierung: Darlehen 300.000€, 2.5% Zins, Laufzeit 25 Jahre
   - Versicherungen: Wohngebäude, Haftpflicht, Glasbruch
   - Grundsteuer: ~800€/Jahr
   - Versorger: Strom (120€/Monat), Gas (180€/Monat), Wasser (45€/Monat), Müll (20€/Monat)
   - Rechnungen 2024: Mind. 10 typische Belege (Handwerker, Versicherung, Grundsteuer, Versorger)

2. MEHRFAMILIENHAUS (2 Eigentümer, Bruchteilsgemeinschaft):
   - Eigentümer 1: 60% Anteil
   - Eigentümer 2: 40% Anteil
   - Objekt: Mehrfamilienhaus in Stadtrandlage, Baujahr 1985, 6 Wohneinheiten (je 60-80m²)
   - 5 Einheiten vermietet, 1 leerstand
   - Mieten: 650€-850€ kalt pro Einheit
   - NK-Vorauszahlungen: 180€-220€ pro Einheit
   - Kaufpreis: 980.000€ (Jahr 2018)
   - Finanzierung: 600.000€ Darlehen, 3.2% Zins
   - Versicherungen: Wohngebäude, Mietverlust, Haftpflicht
   - Grundsteuer: ~2.400€/Jahr
   - Versorger: Strom (Allgemeinstrom 200€/Monat), Heizung zentral (18.000€/Jahr), Wasser zentral
   - Betriebskostenabrechnung 2023 komplett (alle Positionen, Verteilung nach m²)
   - Anlage V 2023 für Eigentümer 1
   - Rechnungen 2024: Mind. 15 Belege

3. GEWERBEIMMOBILIE (GmbH als Eigentümer):
   - Eigentümer: "Immobilien GmbH" (Firmenname, Adresse, Geschäftsführer, Steuernummer)
   - Objekt: Bürogebäude in Innenstadt, Baujahr 2010, 450m² Gewerbefläche, 3 Etagen
   - 3 Gewerbeeinheiten vermietet (je 150m²)
   - Mieten: 1.800€-2.200€/m² pro Jahr (netto kalt)
   - NK nach Gewerbe-Umlage
   - Kaufpreis: 1.850.000€ (Jahr 2019)
   - Finanzierung: 1.200.000€, 2.8% Zins
   - Versicherungen: Gewerbegebäude, Betriebsunterbrechung, Elektronik
   - Grundsteuer: ~8.500€/Jahr
   - Versorger: Strom (hoher Verbrauch), Heizung, Wasser, Reinigung
   - Rechnungen 2024: Mind. 20 Belege (inkl. Wartungsverträge, Reinigung, etc.)

4. GEMISCHT GENUTZTES OBJEKT (Wohnen + Gewerbe):
   - Eigentümer: GbR (2 Gesellschafter)
   - Objekt: Innerstädtisches Gebäude, Erdgeschoss Gewerbe, 1.-2. OG Wohnungen
   - 2 Gewerbeeinheiten (Ladenlokal 80m², Büro 60m²)
   - 4 Wohneinheiten (50-70m²)
   - Mieten gemischt: Gewerbe 18€/m², Wohnen 12€/m²
   - Kaufpreis: 1.250.000€ (Jahr 2021)
   - Finanzierung: 800.000€
   - Versicherungen: kombiniert
   - Grundsteuer: ~4.200€/Jahr
   - Versorger: getrennte Zähler
   - BK-Abrechnung 2023 mit getrennter Umlage Wohnen/Gewerbe
   - Rechnungen 2024: Mind. 12 Belege

5. FERIENIMMOBILIE (Privat):
   - Eigentümer: Ehepaar (beide als Eigentümer)
   - Objekt: Ferienwohnung an der Ostsee, 75m², Baujahr 2005
   - Kurzfristige Vermietung (Feriengäste)
   - Jahreseinkünfte: ~18.000€ (ca. 150 Belegungstage)
   - Kaufpreis: 280.000€ (Jahr 2022)
   - Finanzierung: 180.000€
   - Versicherungen: Ferien-/Zweitwohnung, Hausrat
   - Grundsteuer: ~450€/Jahr
   - Versorger: variable Abrechnung
   - Reinigung nach jedem Gast (externe Firma)
   - Rechnungen 2024: Mind. 10 Belege (Reinigung, Bettwäsche, Reparaturen)

Für JEDES Objekt brauche ich:

GEBÄUDE-STAMMDATEN:
- name (z.B. "Einfamilienhaus Musterstraße")
- address (vollständig: Straße, Hausnr, PLZ, Ort)
- year_built
- living_area (m²)
- land_area (m²)
- building_type (Wohngebäude/Gewerbe/Gemischt)
- usage_type (Eigennutzung/Vermietung/Teilvermietung)
- acquisition_date (ISO date)
- purchase_price (€)

EIGENTÜMER:
- legal_form (Privatperson/GbR/GmbH/etc.)
- name / company_name
- address
- email
- phone
- tax_id (wenn Firma)
- Bei GbR/Bruchteilsgemeinschaft: Alle Gesellschafter mit Anteilen

EINHEITEN (Units):
- unit_number (z.B. "EG links", "1.OG", "Gewerbe EG")
- floor
- living_area
- rooms
- type (Wohnung/Büro/Laden/etc.)
- rental_status (vermietet/leer/eigengenutzt)

MIETER (nur für vermietete Einheiten):
- first_name, last_name
- email, phone
- move_in_date

MIETVERTRÄGE (für jede vermietete Einheit):
- start_date (ISO date)
- is_unlimited (true)
- base_rent (€)
- utilities (€)
- heating (€)
- total_rent (€)
- deposit (€, meist 3x Kaltmiete)
- rent_due_day (meist 3)
- number_of_persons

KAUFVERTRAG:
- purchase_date (ISO date)
- purchase_price
- notary_costs (1,5% vom Kaufpreis)
- land_registry_fee (0,5%)
- real_estate_transfer_tax (je nach Bundesland 3,5%-6,5%, nimm 5%)
- broker_commission (wenn vorhanden, 3-7%)

FINANZIERUNG (wenn vorhanden):
- bank_name (realistischer Name)
- loan_amount
- interest_rate (%)
- term_years
- monthly_rate (berechnet)
- start_date
- end_date

VERSICHERUNGEN (mehrere pro Objekt):
- insurance_type (Wohngebäude/Haftpflicht/Glasbruch/etc.)
- provider_name (realistischer Versicherer)
- policy_number (z.B. "VG-2024-123456")
- annual_premium (€)
- coverage_amount (€)
- start_date
- payment_rhythm (Jährlich/Halbjährlich/Vierteljährlich)

GRUNDSTEUER:
- year (2024)
- annual_amount (€)
- quarterly_rate (€)
- due_dates_q1/q2/q3/q4 (15.02, 15.05, 15.08, 15.11)
- municipality_name
- tax_type (B für Wohngebäude, A für land-/forstwirtschaft)

VERSORGER (mehrere pro Objekt):
- supplier_type (Strom/Gas/Wasser/Heizung/Müll/Internet/etc.)
- name (realistischer Anbieter)
- customer_number
- monthly_amount (€)
- payment_rhythm (Monatlich/Vierteljährlich)

RECHNUNGEN/BELEGE (mind. 10-20 pro Objekt für 2024):
- Typen: Handwerker, Versicherungen, Grundsteuer, Versorger, Hausverwaltung, Reinigung, Schornsteinfeger, Wartung, Reparaturen, Material
- invoice_number (realistisch)
- invoice_date (verteilt über 2024)
- due_date (+14 Tage)
- total_amount (€, realistische Beträge)
- category (z.B. "Erhaltungsaufwand", "Betriebskosten", etc.)
- description (detailliert, z.B. "Heizungswartung inkl. Kessel-Check und Drucktest")
- supplier_name (realistischer Name)

BETRIEBSKOSTENABRECHNUNG 2023 (für Mehrfamilienhaus + Gemischtgenutzt):
- building_id
- year: 2023
- period_start: "2023-01-01"
- period_end: "2023-12-31"
- Positionen (OperatingCostStatementItems):
  * Grundsteuer (Gesamtbetrag, Verteilung nach m²)
  * Versicherung (Gebäudeversicherung)
  * Wasser/Abwasser (nach Verbrauch oder m²)
  * Heizung (nach Verbrauch mit Zählerständen)
  * Allgemeinstrom (nach m²)
  * Müllabfuhr (nach Personen oder m²)
  * Hausreinigung (nach m²)
  * Gartenpflege (nach m²)
  * Hausverwaltung (nach m² oder Einheit)
  * Schornsteinfeger (nach m²)
- Für JEDE Einheit: total_costs, prepayments, balance (Nachzahlung/Guthaben)

ANLAGE V 2023 (für Mehrfamilienhaus Eigentümer 1):
- year: 2023
- building_address
- Einnahmen:
  * Sollmieten (12x Kaltmiete für jede Einheit)
  * Umlagen (12x NK-Vorauszahlung)
  * Summe Mieteinnahmen
- Werbungskosten:
  * AfA (2% vom Gebäudewert, ohne Grundstück)
  * Schuldzinsen (aus Finanzierung)
  * Grundsteuer (60% Anteil)
  * Versicherungen (60% Anteil)
  * Reparaturen/Instandhaltung (Summe aller Handwerker-Rechnungen, 60%)
  * Hausverwaltung (60%)
  * Sonstige Kosten
  * Summe Werbungskosten
- Überschuss/Verlust: Einnahmen - Werbungskosten
- owner_id
- ownership_share: 60%

USER-JOURNEYS (beschreibe kurz, welche Schritte nötig sind):
1. "Neues Objekt vom Kauf bis zur ersten BK-Abrechnung":
   - Objekt anlegen mit Kaufvertrag
   - Eigentümer anlegen
   - Einheiten definieren
   - Verträge mit Mietern abschließen
   - Versorger-Verträge anlegen
   - Finanzierung hinterlegen
   - Versicherungen abschließen
   - Laufende Rechnungen erfassen (12 Monate)
   - Nach 12 Monaten: BK-Abrechnung erstellen
   - Anlage V für Steuerjahr erstellen

2. "Eigentümerwechsel komplett durchspielen":
   - Altes Eigentümer-Verhältnis beenden (Verkauf)
   - Neuen Eigentümer anlegen
   - Kaufvertrag mit neuem Datum
   - Bestehende Verträge übernehmen (Mieter bleiben)
   - Versorger ummelden
   - Versicherungen anpassen
   - Finanzierung neu oder Übernahme

3. "Jahresabschluss für ein Objekt":
   - Alle Rechnungen des Jahres kategorisiert
   - BK-Abrechnung erstellen
   - Anlage V(s) für alle Eigentümer
   - AfA-Plan prüfen
   - Rückstellungen bilden
   - Liquiditätsplanung für nächstes Jahr

Gib mir das Ergebnis als valides JSON mit dieser EXAKTEN Struktur:

{
  "metadata": {
    "generated_at": "ISO timestamp",
    "preset": "${preset}",
    "description": "Anonymisierte Beispieldaten für deutsche Immobilienverwaltung",
    "total_buildings": number,
    "total_units": number,
    "total_contracts": number,
    "total_invoices": number
  },
  "buildings": [
    {
      "name": "...",
      "address": "...",
      "postal_code": "...",
      "city": "...",
      "year_built": number,
      "living_area": number,
      "land_area": number,
      "building_type": "...",
      "usage_type": "...",
      "acquisition_date": "ISO date",
      "purchase_price": number
    }
  ],
  "owners": [
    {
      "legal_form": "...",
      "name": "...",
      "address": "...",
      "postal_code": "...",
      "city": "...",
      "email": "...",
      "phone": "...",
      "tax_id": "..."
    }
  ],
  "owner_relationships": [
    {
      "building_id_ref": 0,
      "owner_id_ref": 0,
      "ownership_share": number,
      "valid_from": "ISO date",
      "is_current": true
    }
  ],
  "units": [
    {
      "building_id_ref": 0,
      "unit_number": "...",
      "floor": number,
      "living_area": number,
      "rooms": number,
      "type": "...",
      "rental_status": "..."
    }
  ],
  "tenants": [
    {
      "first_name": "...",
      "last_name": "...",
      "email": "...",
      "phone": "..."
    }
  ],
  "lease_contracts": [
    {
      "unit_id_ref": 0,
      "tenant_id_ref": 0,
      "start_date": "ISO date",
      "is_unlimited": true,
      "base_rent": number,
      "utilities": number,
      "heating": number,
      "total_rent": number,
      "deposit": number,
      "deposit_paid": true,
      "rent_due_day": 3,
      "number_of_persons": number,
      "status": "active"
    }
  ],
  "purchase_contracts": [
    {
      "building_id_ref": 0,
      "purchase_date": "ISO date",
      "purchase_price": number,
      "notary_costs": number,
      "land_registry_fee": number,
      "real_estate_transfer_tax": number,
      "broker_commission": number
    }
  ],
  "financings": [
    {
      "building_id_ref": 0,
      "bank_name": "...",
      "loan_amount": number,
      "interest_rate": number,
      "term_years": number,
      "monthly_rate": number,
      "start_date": "ISO date",
      "end_date": "ISO date",
      "purpose": "Kauffinanzierung"
    }
  ],
  "insurances": [
    {
      "building_id_ref": 0,
      "insurance_type": "...",
      "provider_name": "...",
      "policy_number": "...",
      "annual_premium": number,
      "coverage_amount": number,
      "start_date": "ISO date",
      "payment_rhythm": "..."
    }
  ],
  "property_taxes": [
    {
      "building_id_ref": 0,
      "year": 2024,
      "annual_amount": number,
      "quarterly_rate": number,
      "due_date_q1": "2024-02-15",
      "due_date_q2": "2024-05-15",
      "due_date_q3": "2024-08-15",
      "due_date_q4": "2024-11-15",
      "municipality_name": "...",
      "tax_type": "B"
    }
  ],
  "suppliers": [
    {
      "building_id_ref": 0,
      "supplier_type": "...",
      "name": "...",
      "customer_number": "...",
      "monthly_amount": number,
      "payment_rhythm": "..."
    }
  ],
  "invoices": [
    {
      "building_id_ref": 0,
      "invoice_number": "...",
      "invoice_date": "ISO date",
      "due_date": "ISO date",
      "total_amount": number,
      "category": "...",
      "description": "...",
      "supplier_name": "...",
      "status": "paid"
    }
  ],
  "operating_cost_statements": [
    {
      "building_id_ref": 1,
      "year": 2023,
      "period_start": "2023-01-01",
      "period_end": "2023-12-31",
      "total_costs": number,
      "allocatable_costs": number,
      "status": "abgerechnet",
      "items": [
        {
          "cost_type": "...",
          "description": "...",
          "total_amount": number,
          "allocation_key": "Fläche",
          "unit_allocations": [
            {
              "unit_id_ref": 0,
              "allocated_amount": number,
              "prepayment": number,
              "balance": number
            }
          ]
        }
      ]
    }
  ],
  "anlage_v_submissions": [
    {
      "building_id_ref": 1,
      "owner_id_ref": 0,
      "year": 2023,
      "ownership_share": 60,
      "einnahmen": {
        "sollmieten": number,
        "umlagen": number,
        "summe": number
      },
      "werbungskosten": {
        "afa": number,
        "schuldzinsen": number,
        "grundsteuer": number,
        "versicherungen": number,
        "reparaturen": number,
        "hausverwaltung": number,
        "sonstige": number,
        "summe": number
      },
      "ueberschuss": number
    }
  ],
  "user_journeys": {
    "kauf_bis_bk_abrechnung": [...],
    "eigentuemerwechsel": [...],
    "jahresabschluss": [...]
  }
}

WICHTIG: 
- Alle Beträge in Euro, keine Währungszeichen
- Alle Daten als ISO-Strings (YYYY-MM-DD)
- Alle Namen, Adressen, Emails, Telefonnummern ANONYMISIERT aber realistisch
- Referenzen als _ref (z.B. building_id_ref: 0 für erstes Gebäude im Array)
- VOLLSTÄNDIGE Daten, keine Platzhalter oder "..."
- Alle Berechnungen müssen stimmig sein (z.B. Quartalsrate = Jahresbetrag/4)`;

        const response = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    metadata: { 
                        type: 'object',
                        properties: {
                            generated_at: { type: 'string' },
                            preset: { type: 'string' },
                            description: { type: 'string' },
                            total_buildings: { type: 'number' },
                            total_units: { type: 'number' },
                            total_contracts: { type: 'number' },
                            total_invoices: { type: 'number' }
                        }
                    },
                    buildings: { type: 'array', items: { type: 'object' } },
                    owners: { type: 'array', items: { type: 'object' } },
                    owner_relationships: { type: 'array', items: { type: 'object' } },
                    units: { type: 'array', items: { type: 'object' } },
                    tenants: { type: 'array', items: { type: 'object' } },
                    lease_contracts: { type: 'array', items: { type: 'object' } },
                    purchase_contracts: { type: 'array', items: { type: 'object' } },
                    financings: { type: 'array', items: { type: 'object' } },
                    insurances: { type: 'array', items: { type: 'object' } },
                    property_taxes: { type: 'array', items: { type: 'object' } },
                    suppliers: { type: 'array', items: { type: 'object' } },
                    invoices: { type: 'array', items: { type: 'object' } },
                    operating_cost_statements: { type: 'array', items: { type: 'object' } },
                    anlage_v_submissions: { type: 'array', items: { type: 'object' } },
                    user_journeys: { type: 'object' }
                }
            }
        });

        const sampleData = response;
        const duration = (Date.now() - startTime) / 1000;

        // Optional: Speichere als Dokumentation
        const doc = await base44.asServiceRole.entities.GeneratedDocumentation.create({
            documentation_type: 'sample_data',
            title: `Beispieldaten - ${preset}`,
            description: `Anonymisierte, vollständige Beispieldaten für ${preset}`,
            content_markdown: `# Beispieldaten - ${preset}\n\nGeneriert am ${new Date().toISOString()}\n\n## Übersicht\n\n- **Gebäude:** ${sampleData.metadata.total_buildings}\n- **Einheiten:** ${sampleData.metadata.total_units}\n- **Verträge:** ${sampleData.metadata.total_contracts}\n- **Rechnungen:** ${sampleData.metadata.total_invoices}\n\n## Download\n\nDie vollständigen Daten sind als JSON verfügbar.`,
            content_json: sampleData,
            file_size_bytes: JSON.stringify(sampleData).length,
            generation_duration_seconds: duration,
            last_generated_at: new Date().toISOString(),
            status: 'completed'
        });

        if (format === 'json') {
            return Response.json({
                success: true,
                data: sampleData,
                documentation_id: doc.id,
                generation_duration_seconds: duration
            });
        } else {
            // Excel-Export wäre hier möglich (mit xlsx-Library)
            return Response.json({
                success: true,
                message: 'Excel-Export noch nicht implementiert, nutze JSON',
                data: sampleData,
                documentation_id: doc.id
            });
        }

    } catch (error) {
        console.error('Generate sample data error:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});