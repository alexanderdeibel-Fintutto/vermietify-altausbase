import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { tenant_id, building_id } = await req.json();

    if (!tenant_id) {
      return Response.json({ error: 'Missing tenant_id' }, { status: 400 });
    }

    const createdDocs = [];

    // Create rental agreement template document
    const rentalAgreement = await base44.asServiceRole.entities.Document.create({
      tenant_id,
      document_type: 'rental_agreement',
      title: 'Mietvertrag',
      description: 'Standard-Mietvertrag für den Tenant',
      content: `
# Mietvertrag

## Parteien
Vermieter: [Verwaltung]
Mieter: [Tenant Name]

## Mietgegenstand
Einheit: [Unit Information]
Adresse: [Property Address]

## Mietdauer
Start: [Contract Start Date]
Ende: [Contract End Date]

## Miete und Nebenkosten
Monatliche Miete: [Rent Amount]
Nebenkosten: [Additional Costs]
Zahlungstermin: [Payment Due Date]

## Sicherheitsleistung
Kaution: [Deposit Amount]

## Vereinbarungen
[Weitere Vertragsbedingungen]

---
Ausgestellt: ${new Date().toLocaleDateString('de-DE')}
      `,
      status: 'template'
    });
    createdDocs.push({ type: 'rental_agreement', id: rentalAgreement.id });

    // Create house rules document
    const houseRules = await base44.asServiceRole.entities.Document.create({
      tenant_id,
      document_type: 'house_rules',
      title: 'Hausordnung',
      description: 'Allgemeine Hausordnung und Verhaltensregeln',
      content: `
# Hausordnung

## Allgemeine Regeln
1. Ruhezeiten beachten (22:00 - 06:00)
2. Gemeinschaftsbereiche sauber halten
3. Keine lauten Aktivitäten nach 22:00

## Parkplatz
- Nur zugewiesene Parkplätze nutzen
- Parkplätze nicht blockieren

## Müllwirtschaft
- Mülltrennung nach lokalen Vorschriften
- Müll nur an designierten Tagen herausstellen

## Reparaturen und Mängel
- Mängel sofort dem Verwalter melden
- Keine eigenständigen Reparaturen ohne Genehmigung

## Kontakt zur Verwaltung
Tel: [Administration Phone]
Email: [Administration Email]
      `,
      status: 'active'
    });
    createdDocs.push({ type: 'house_rules', id: houseRules.id });

    // Create welcome guide
    const welcomeGuide = await base44.asServiceRole.entities.Document.create({
      tenant_id,
      document_type: 'welcome_guide',
      title: 'Willkommensführer',
      description: 'Informationen für neue Mieter',
      content: `
# Willkommen in Ihrem neuen Zuhause!

## Erste Schritte
1. Haushalt-Übergabe durchführen
2. Zähler ablesen und dokumentieren
3. Alle Schlüssel erhalten und testen

## Wichtige Kontakte
- Notfälle: 110 / 112
- Verwaltung: [Contact Info]
- Technischer Support: [Tech Support]

## Zahlungsmodalitäten
- Miete: [Payment Info]
- Zahlungsart: [Payment Method]
- Zahlungsdag: [Payment Day]

## Häufig gestellte Fragen
[FAQ Content]

## Nützliche Links
- Mieterportal: [Portal Link]
- Dokumentencenter: [Documents Link]
- Wartungsanfragen: [Maintenance Link]
      `,
      status: 'active'
    });
    createdDocs.push({ type: 'welcome_guide', id: welcomeGuide.id });

    return Response.json({
      success: true,
      created_documents: createdDocs,
      message: `${createdDocs.length} initial documents created successfully`
    });
  } catch (error) {
    console.error('Error creating tenant documents:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});