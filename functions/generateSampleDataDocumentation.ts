import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Sample data documentation
    const markdownContent = `# BEISPIEL-DATEN & SZENARIEN

Generiert am: ${new Date().toISOString()}

## TYPISCHE USER-JOURNEYS

### Szenario 1: Kleiner Vermieter (1-2 Objekte)
**Profil:** Privatperson mit 1-2 vermieteten Wohnungen
**Hauptziele:** 
- Einfache Mietverwaltung
- Nebenkostenabrechnung
- Anlage V für Steuererklärung

**Beispiel-Daten:**
- Gebäude: Mehrfamilienhaus, Baujahr 1985, 4 Einheiten
- Einheiten: 2x 65m², 2x 80m²
- Mieter: 4 aktive Mietverträge
- Kaltmiete: 650-850 EUR/Monat
- Nebenkosten: ca. 180 EUR/Monat

**Typischer Workflow:**
1. Monatlich: Mietzahlungen prüfen
2. Quartalsweise: Rechnungen erfassen
3. Jährlich: Betriebskostenabrechnung erstellen
4. Jährlich: Anlage V für Finanzamt

---

### Szenario 2: Mittelgroßer Bestand (5-10 Objekte)
**Profil:** Privater Investor mit Portfolio
**Hauptziele:**
- Portfolio-Übersicht
- Rendite-Tracking
- Steueroptimierung

**Beispiel-Daten:**
- Gebäude: 8 Objekte, gemischt (Alt-/Neubau)
- Einheiten: 35 Wohnungen insgesamt
- Durchschnittliche Kaltmiete: 720 EUR
- Leerstandsquote: 3-5%
- Jährliche Mieteinnahmen: ca. 300.000 EUR

**Typischer Workflow:**
1. Wöchentlich: Dashboard-Check
2. Monatlich: Zahlungseingänge kontrollieren
3. Quartalsweise: Performance-Analyse
4. Jährlich: Steuerplanung mit Berater

---

### Szenario 3: Professioneller Verwalter (>20 Objekte)
**Profil:** Gewerblicher Verwalter / WEG
**Hauptziele:**
- Mandanten-Trennung
- Automatisierung
- Rechtssicherheit

**Beispiel-Daten:**
- Mandate: 15 verschiedene Eigentümer
- Gebäude: 45 Objekte
- Einheiten: 250+ Wohnungen
- Team: 5 Mitarbeiter
- Dokumenten-Volumen: 5000+ Dateien/Jahr

**Typischer Workflow:**
1. Täglich: Ticketsystem prüfen
2. Wöchentlich: Team-Meetings
3. Monatlich: Bulk-Abrechnungen
4. Quartalsweise: WEG-Abrechnungen

---

## REALISTISCHE TESTDATEN

### Beispiel-Gebäude: "Musterstraße 15"
\`\`\`json
{
  "adresse": "Musterstraße 15",
  "plz": "80331",
  "stadt": "München",
  "baujahr": 1985,
  "wohnflaeche_gesamt": 320,
  "grundstueckgroesse": 450,
  "anzahl_einheiten": 4,
  "energieausweis_typ": "Verbrauchsausweis",
  "heizungsart": "Gasheizung",
  "kaufpreis": 850000,
  "kaufdatum": "2020-03-15"
}
\`\`\`

### Beispiel-Mieter: "Familie Müller"
\`\`\`json
{
  "vorname": "Thomas",
  "nachname": "Müller",
  "email": "thomas.mueller@example.com",
  "telefon": "+49 89 12345678",
  "geburtsdatum": "1985-06-12",
  "beruf": "Angestellter",
  "netto_einkommen": 3200,
  "anzahl_personen": 3
}
\`\`\`

### Beispiel-Mietvertrag
\`\`\`json
{
  "mietbeginn": "2021-04-01",
  "kaltmiete": 850,
  "nebenkosten_vorauszahlung": 180,
  "kaution": 2550,
  "kuendigungsfrist_monate": 3,
  "indexierung": true,
  "haustiere_erlaubt": true
}
\`\`\`

### Beispiel-Betriebskosten
\`\`\`json
{
  "abrechnungsjahr": 2023,
  "zeitraum_von": "2023-01-01",
  "zeitraum_bis": "2023-12-31",
  "kosten": [
    {"art": "Grundsteuer", "betrag": 1200, "schluessel": "Flaeche"},
    {"art": "Wasser", "betrag": 2400, "schluessel": "Personen"},
    {"art": "Heizung", "betrag": 8500, "schluessel": "Verbrauch"},
    {"art": "Muellabfuhr", "betrag": 960, "schluessel": "Einheiten"},
    {"art": "Hausmeister", "betrag": 3600, "schluessel": "Flaeche"}
  ]
}
\`\`\`

---

## HÄUFIGE EDGE-CASES

### Mieterwechsel während des Jahres
- Anteilige Abrechnung
- Kaution-Transfer
- Zählerstände erfassen
- Schlüsselübergabe

### Mieterhöhung nach Modernisierung
- §559 BGB: 8% der Kosten
- Ankündigungsfrist: 3 Monate
- Härtefall-Prüfung
- Kappungsgrenze beachten

### Reparatur-Großschaden
- Versicherung informieren
- Schadensprotokoll
- Kostenschätzung
- Mieterbenachrichtigung

### Leerstand
- Renovierungskosten
- Vermarktung
- Besichtigungen
- Mietausfall-Versicherung

---

## TYPISCHE ZAHLENWERTE (Deutschland 2024)

### Durchschnittliche Mieten (Kaltmiete/m²)
- München: 18-22 EUR
- Berlin: 12-16 EUR
- Hamburg: 14-18 EUR
- Köln: 12-15 EUR
- Leipzig: 8-11 EUR

### Betriebskosten (pro m²/Jahr)
- Durchschnitt: 2.40-3.20 EUR/m²/Monat
- Mit Heizung: 3.80-5.50 EUR/m²/Monat

### Kaufpreisfaktoren
- München: 30-40
- Berlin: 25-35
- Leipzig: 15-20

### Renditen (Brutto)
- A-Städte: 2.5-3.5%
- B-Städte: 3.5-5%
- C-Städte: 5-7%

---

## ANONYMISIERTE BEISPIELE

Alle Daten sind anonymisiert und dienen nur zu Testzwecken.
Keine echten Personen oder Adressen.

**Beispiel-Namen:** Müller, Schmidt, Meier, Weber, Schneider
**Beispiel-Straßen:** Musterstraße, Beispielweg, Testplatz
**Beispiel-Städte:** Beispielstadt, Testheim, Musterhausen
`;

    return Response.json({ 
      success: true,
      markdownContent
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});