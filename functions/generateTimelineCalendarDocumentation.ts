import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const markdown = `# Geschäftsprozesse & Zeitplanung

## Jahreskalender

### Januar
**Kritische Fristen:**
- Jahresabschluss/Betriebskostenabrechnung für Vorjahr
- Einkommensteuererklärung-Deadline (01.02. für Privatpersonen)

**Typische Aktivitäten:**
- Verträge überprüfen (Jahresanpassungen)
- Neue Mietpreise für Jahreswechsel implementieren
- Betriebskostenvorauszahlungen aktualisieren

### Februar
**Kritische Fristen:**
- Umsatzsteuererklärung (falls monatlich)
- Steuer-Anmeldetermine

**Typische Aktivitäten:**
- Steuern & Compliance überprüfen
- Finanzberichterstattung für Januar

### März
**Kritische Fristen:**
- Quartalsabschluss Q1
- Mieterhöhungen können angekündigt werden (für Mai/Juni)

**Typische Aktivitäten:**
- Q1 Reports generieren
- Betriebskostenplanung für 2025

### April
**Kritische Fristen:**
- Osterfest (variable Daten, bis 21.04.)

**Typische Aktivitäten:**
- Saisonale Wartungsarbeiten planen
- Gebäudeinspektionen durchführen

### Mai
**Kritische Fristen:**
- Maifeiertag (01.05.) - Kein Kundenservice
- Pfingsten (variable)

**Typische Aktivitäten:**
- Gartenpflege startet
- Außenreparaturen durchführen

### Juni
**Kritische Fristen:**
- Quartalsabschluss Q2
- Mieterhöhungen implementieren (falls angekündigt)

**Typische Aktivitäten:**
- Halbjahres-Reports
- Zahlungsrückstände überprüfen

### Juli/August
**Kritische Fristen:**
- Ferienzeiten (reduzierter Betrieb)
- Sommerurlaub für Staff

**Typische Aktivitäten:**
- Planungsarbeiten
- Große Renovierungen (während Ferienzeiten)
- Datenbereinigung

### September
**Kritische Fristen:**
- Schulstart (Auswirkung auf Mietnebenkosten)

**Typische Aktivitäten:**
- Back-to-Business nach Ferien
- Q3 Reports

### Oktober
**Kritische Fristen:**
- Quartalsabschluss Q3
- Heizperiode startet (01.10.)

**Typische Aktivitäten:**
- Heizung-Inspektionen
- Wintervorbereitung (Dächer, Leitungen)

### November
**Kritische Fristen:**
- Betriebskosten-Vorauszahlungen für nächstes Jahr anpassen
- Gartenpflege-Abschluss

**Typische Aktivitäten:**
- Black Friday (Relevanz für Mieter-Kommunikation)
- Jahresplanung 2025

### Dezember
**Kritische Fristen:**
- Jahresabschluss (31.12.)
- Betriebskostenabrechnung (bis 31.12. oder 30.04. nächstes Jahr)
- Steuer-Pläne finalisieren

**Typische Aktivitäten:**
- Betriebskostenabrechnung durchführen
- Jahresbilanz
- Winterfestigkeit überprüfen
- Weihnachtspausen berücksichtigen

## Typische Tagesabläufe

### Admin/Manager

**Morgens (08:00 - 10:00)**
- E-Mails überprüfen und bearbeiten
- Neue Anfragen/Tickets überprüfen
- Tagesprioritäten setzen

**Mittags (10:00 - 12:00)**
- Mieter-Kommunikation
- Dokumenten-Verwaltung
- Wartungsanfragen bearbeiten

**Nachmittags (13:00 - 17:00)**
- Finanzielle Operationen
- Berichts-Generierung
- Planung für Morgen

### Accountant

**Täglich**
- Neue Transaktionen überprüfen (06:00)
- Zahlungsabgleich (10:00)
- Rechnungen verarbeiten (14:00)
- Wochenabschluss (freitags)

### Mieter

**On-Demand**
- Miete bezahlen
- Rechnungen einsehen
- Wartungsanfragen stellen
- Mit Verwalter kommunizieren

## Saisonale Besonderheiten

### Frühling (März-Mai)
- Gartenarbeiten beginnen
- Außenreparaturen (Wetter wird besser)
- Erhöhte Besichtigungstätigkeit
- Heizperiode endet

### Sommer (Juni-August)
- Ferienzeiten
- Große Renovierungen
- Reduzierte Kundenaktivität
- Gartenunterhalt auf Maximum

### Herbst (September-November)
- Heizperiode beginnt
- Wintervorbereitung
- Schulstart
- Laub-Management

### Winter (Dezember-Februar)
- Heizperiode aktiv
- Schnee/Eis-Management
- Jahresabschluss
- Wenigere Außenaktivitäten

## Automatische Prozesse nach Zeitplan

### Täglich (06:00 Uhr)
- Banktransaktionen synchronisieren
- Überdue-Payments überprüfen
- Erinnerungen generieren

### Wöchentlich (Sonntag 23:00)
- Wochenabschluss-Bericht
- Datenqualität überprüfen
- Backups durchführen

### Monatlich (1. des Monats, 05:00)
- Automatische Rechnungen generieren
- Betriebskosten-Vorauszahlungen
- Monatliche Reports

### Jährlich (31.12., 20:00)
- Jahresabschluss
- Betriebskostenabrechnung
- Archivierung alter Daten

## Kritische Deadlines

| Datum | Aufgabe | Puffer |
|-------|---------|--------|
| 01.02 | Einkommensteuererklärung | 1 Monat |
| 31.03 | Betriebskostenabrechnungen | 3 Monate |
| 15.05 | Mieterhöhung wirksam | 3 Monate Ankündigung |
| 30.10 | Heizperiode Start | 1 Woche |
| 31.12 | Jahresabschluss | 1 Monat |
| 30.04 | Betriebskostenabrechnungen (Frist) | 5 Monate |

## Urlaubszeiten zu beachten

- Ostern (variable)
- Pfingsten (variable)
- Sommerferien (Juli-August)
- Weihnachten (22.12.-02.01.)
- Neujahrstag
- Feiertage (landesspezifisch)
`;

        return Response.json({ 
            markdownContent: markdown,
            status: 'success',
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in generateTimelineCalendarDocumentation:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});