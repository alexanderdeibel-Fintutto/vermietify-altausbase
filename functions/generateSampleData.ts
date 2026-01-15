import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Abrufen von Beispieldaten aus Entitäten
        const buildings = await base44.entities.Building.list('-created_date', 3);
        const units = await base44.entities.Unit.list('-created_date', 5);
        const tenants = await base44.entities.Tenant.list('-created_date', 3);
        const contracts = await base44.entities.LeaseContract.list('-created_date', 3);

        // Markdown-Inhalt generieren
        const markdown = `# Beispiel-Daten & Szenarien

## Übersicht

Diese Dokumentation zeigt anonymisierte Beispiel-Daten typischer Objekte mit vollständigen User-Journeys und realistischen Nutzungsszenarien.

## Gebäude (${buildings.length} Beispiele)

${buildings.map((b, idx) => `
### Gebäude ${idx + 1}: ${b.name || 'Unbenannt'}
- **Adresse:** ${b.street_address || 'N/A'}, ${b.postal_code || ''} ${b.city || ''}
- **Baujahr:** ${b.construction_year || 'N/A'}
- **Anzahl Wohneinheiten:** ${b.total_units || 0}
- **Typ:** ${b.building_type || 'N/A'}
`).join('\n')}

## Wohneinheiten (${units.length} Beispiele)

${units.map((u, idx) => `
### Einheit ${idx + 1}: ${u.unit_number || 'N/A'}
- **Größe:** ${u.living_area || 'N/A'} m²
- **Zimmer:** ${u.rooms || 'N/A'}
- **Etage:** ${u.floor || 'N/A'}
- **Status:** ${u.status || 'N/A'}
`).join('\n')}

## Mieter (${tenants.length} Beispiele)

${tenants.map((t, idx) => `
### Mieter ${idx + 1}: ${t.full_name || 'Anonym'}
- **E-Mail:** ${t.email ? '***@***.***' : 'N/A'}
- **Telefon:** ${t.phone || 'N/A'}
- **Status:** ${t.tenant_status || 'N/A'}
`).join('\n')}

## Mietverträge (${contracts.length} Beispiele)

${contracts.map((c, idx) => `
### Vertrag ${idx + 1}
- **Startdatum:** ${c.start_date ? new Date(c.start_date).toLocaleDateString('de-DE') : 'N/A'}
- **Enddatum:** ${c.end_date ? new Date(c.end_date).toLocaleDateString('de-DE') : 'N/A'}
- **Miete:** ${c.monthly_rent ? '€ ' + c.monthly_rent : 'N/A'}
- **Status:** ${c.status || 'N/A'}
`).join('\n')}

## Typische User-Journeys

### Journey 1: Neue Wohneinheit hinzufügen
1. Gebäude auswählen
2. Wohneinheit-Daten eingeben (Größe, Zimmeranzahl, Etage)
3. Ausstattung definieren
4. Miete festlegen
5. Speichern und aktivieren

### Journey 2: Neuen Mieter aufnehmen
1. Mietdaten sammeln
2. Mietvertrag erstellen
3. Dokumente hochladen
4. Zahlungsbedingungen konfigurieren
5. Mieter im Portal aktivieren

### Journey 3: Miete erhöhen
1. Aktuelle Miete überprüfen
2. Erhöhungsbetrag berechnen
3. Gesetzliche Fristen überprüfen
4. Schreiben generieren
5. Dokumentieren und abspeichern
`;

        return Response.json({ 
            markdownContent: markdown,
            status: 'success',
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in generateSampleData:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});