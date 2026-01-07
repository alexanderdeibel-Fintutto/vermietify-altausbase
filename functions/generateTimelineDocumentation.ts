import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const startTime = Date.now();

        const markdown = `# Geschäftsprozesse & Zeitplanung

**Generiert am:** ${new Date().toISOString()}

## Jahreskalender - Kritische Fristen

### Januar
- **15.01.** - Grundsteuer Q4 fällig
- **31.01.** - Betriebskostenabrechnungen Vorjahr versenden (Frist: 12 Monate nach Abrechnungsperiode)

### Februar
- **15.02.** - Grundsteuer Q1 fällig
- **28.02.** - Jahresabschlüsse für GmbH vorbereiten

### März
- **31.03.** - Anlage V für Steuererklärung fertigstellen
- **15.03.** - Nebenkostenabrechnungen prüfen

### April
- **15.04.** - Grundsteuer Q2 fällig
- **30.04.** - Steuererklärungen einreichen (Privatpersonen)

### Mai
- **31.05.** - Nebenkostenvorauszahlungen anpassen (falls nötig)

### Juni
- **15.06.** - Mietspiegel-Updates prüfen
- **30.06.** - Halbjahresabschluss erstellen

### Juli
- **15.07.** - Grundsteuer Q3 fällig
- **31.07.** - Steuererklärungen GmbH einreichen (mit Steuerberater)

### August
- **15.08.** - Versicherungen prüfen (Jahresverträge oft Sep-Okt)

### September
- **30.09.** - Heizkosten-Abrechnungszeitraum oft Ende (wenn nicht Kalenderjahr)

### Oktober
- **15.10.** - Grundsteuer Q4 fällig
- **31.10.** - Winterdienst-Verträge abschließen

### November
- **30.11.** - Jahresplanung 2026 beginnen

### Dezember
- **31.12.** - Jahresabschluss vorbereiten
- **15.12.** - Weihnachtsgeld/Sonderzahlungen

## Typischer Tagesablauf eines Verwalters

### Morgens (8:00 - 10:00)
1. **E-Mails prüfen** - Mieter-Anfragen, Handwerker-Bestätigungen
2. **Dashboard checken** - Offene Zahlungen, fällige Aufgaben
3. **Dringende Tickets bearbeiten** - Heizungsausfälle, Wasserschäden

### Vormittags (10:00 - 12:00)
4. **Dokumente erstellen** - Nebenkostenabrechnungen, Mahnungen
5. **Telefonate** - Handwerker koordinieren, Mieter-Rückfragen
6. **Bankkonten prüfen** - Zahlungseingänge verbuchen

### Nachmittags (13:00 - 17:00)
7. **Objektbesichtigungen** - Neue Mieter, Schäden aufnehmen
8. **Verträge vorbereiten** - Mietverträge, Handwerker-Aufträge
9. **Buchhaltung** - Belege erfassen, Rechnungen freigeben

### Abends (optional)
10. **Notfall-Bereitschaft** - Kritische Schadensmeldungen

## Saisonale Besonderheiten

### Winter (Dez - Feb)
- **Heizperiode** - Höhere Heizkosten, mehr Support-Anfragen
- **Schnee & Eis** - Winterdienst koordinieren, Rutschgefahr minimieren
- **Leerstand** - Wohnungsbesichtigungen schwieriger (dunkel, kalt)

### Frühling (Mär - Mai)
- **Nebenkostenabrechnungen** - Hauptsaison für Versand
- **Garten/Außenanlagen** - Frühjahrsputz, Bepflanzung
- **Wohnungswechsel** - Viele Mieter ziehen um (Schuljahresende)

### Sommer (Jun - Aug)
- **Urlaubszeit** - Weniger Anfragen, aber auch weniger Personal
- **Bauarbeiten** - Hauptsaison für Renovierungen (Wetter)
- **Leerstand füllen** - Beste Zeit für Vermietungen

### Herbst (Sep - Nov)
- **Heizungsstart** - Wartungen, erste Heizanfragen
- **Jahresplanung** - Budget 2026, Investitionen planen
- **Versicherungen** - Viele Jahresverträge laufen aus

## Kritische Workflows - Zeitliche Abläufe

### Workflow: Neue Wohnung vermieten
**Gesamtdauer:** 2-4 Wochen

- **Tag 0:** Kündigung erhalten
- **Tag 1-3:** Wohnung besichtigen, Schäden dokumentieren
- **Tag 4-7:** Inserat erstellen, online stellen
- **Tag 8-14:** Besichtigungstermine (5-10 Interessenten)
- **Tag 15:** Mieter auswählen, Bonitätsprüfung
- **Tag 16-17:** Mietvertrag vorbereiten
- **Tag 18:** Unterschrift Mietvertrag
- **Tag 19-21:** Wohnung renovieren (falls nötig)
- **Tag 22-28:** Übergabe an neuen Mieter

### Workflow: Betriebskostenabrechnung erstellen
**Gesamtdauer:** 3-5 Stunden pro Objekt

- **0:00-0:30h:** Alle Rechnungen zusammensuchen
- **0:30-1:30h:** Rechnungen in System erfassen
- **1:30-2:00h:** Umlageschlüssel definieren
- **2:00-3:00h:** Abrechnung generieren, Plausibilität prüfen
- **3:00-4:00h:** Nachforderungen/Guthaben berechnen
- **4:00-5:00h:** Dokument finalisieren, per Post versenden

### Workflow: Schaden melden & beheben
**Gesamtdauer:** 1-7 Tage

- **Stunde 0:** Meldung erhalten (E-Mail/Telefon)
- **Stunde 0-1:** Dringlichkeit einschätzen (Notfall = sofort!)
- **Stunde 1-2:** Handwerker kontaktieren, Termin vereinbaren
- **Tag 1-2:** Handwerker vor Ort, Reparatur
- **Tag 3-5:** Rechnung erhalten
- **Tag 5-7:** Rechnung prüfen, freigeben, Zahlung veranlassen

## Performance-kritische Zeiten

### Hohe Last (viele Nutzer gleichzeitig):
- **Montagmorgen 9:00-10:00** - Wochenstart, viele Anfragen
- **1. des Monats** - Mietzahlungen prüfen
- **Mitte des Monats** - Rechnungen buchen

### Niedrige Last:
- **Wochenenden** - Kaum Aktivität
- **Feiertage** - System-Wartung möglich
- **Nachts 22:00-6:00** - Backup-Fenster

## Zeitplanung für KI-Assistenten

**Kontext:** Ein KI-Assistent muss verstehen, dass bestimmte Anfragen zeitkritisch sind.

### Kritisch (sofort):
- "Heizung ausgefallen" (Winter)
- "Wasserschaden"
- "Einbruch"

### Dringend (heute):
- "Abrechnung muss heute raus" (Frist!)
- "Mieter zieht morgen ein"

### Normal (diese Woche):
- "Nebenkostenabrechnung erstellen"
- "Dokument generieren"

### Kann warten (nächste Woche+):
- "Statistiken anzeigen"
- "Optionale Optimierungen"
`;

        const duration = (Date.now() - startTime) / 1000;
        const fileSize = new TextEncoder().encode(markdown).length;

        // Dokumentation speichern
        const existingDocs = await base44.asServiceRole.entities.GeneratedDocumentation.filter({
            documentation_type: 'timeline_calendar'
        });

        const docData = {
            documentation_type: 'timeline_calendar',
            title: 'Geschäftsprozesse & Zeitplanung',
            description: 'Jahreskalender, kritische Fristen, typische Tagesabläufe und saisonale Besonderheiten',
            content_markdown: markdown,
            content_json: {
                generated_at: new Date().toISOString(),
                type: 'timeline_calendar'
            },
            file_size_bytes: fileSize,
            generation_duration_seconds: duration,
            last_generated_at: new Date().toISOString(),
            status: 'completed'
        };

        if (existingDocs.length > 0) {
            await base44.asServiceRole.entities.GeneratedDocumentation.update(existingDocs[0].id, docData);
        } else {
            await base44.asServiceRole.entities.GeneratedDocumentation.create(docData);
        }

        return Response.json({
            success: true,
            documentation_type: 'timeline_calendar',
            duration,
            size: fileSize
        });

    } catch (error) {
        console.error('Timeline documentation generation error:', error);
        return Response.json({
            error: 'Generation failed',
            details: error.message
        }, { status: 500 });
    }
});