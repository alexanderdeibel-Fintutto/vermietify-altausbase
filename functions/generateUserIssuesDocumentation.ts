import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Abrufen von Problemen und Lösungen
        const problems = await base44.entities.UserProblem.list('-priority_score', 20);
        
        let markdown = `# Häufige Probleme & FAQ

## Übersicht

Top 20 User-Fragen, typische Fehler, bekannte Bugs, Limitierungen, Edge-Cases und deren Lösungen.

## Häufigste Probleme

`;

        if (problems && problems.length > 0) {
            markdown += problems.map((p, idx) => `
### ${idx + 1}. ${p.problem_titel || 'Problem ohne Titel'}

**Kategorie:** ${p.kategorie || 'N/A'}  
**Schweregrad:** ${p.schweregrad || 'N/A'}  
**Status:** ${p.status || 'offen'}

**Problem:**
${p.problem_beschreibung || 'Keine Beschreibung verfügbar'}

${p.loesung_beschreibung ? `
**Lösung:**
${p.loesung_beschreibung}
` : ''}

${p.loesungs_schritte && p.loesungs_schritte.length > 0 ? `
**Lösungsschritte:**
${p.loesungs_schritte.map((step, i) => `${i + 1}. ${step}`).join('\n')}
` : ''}

${p.workaround ? `
**Workaround:**
${p.workaround}
` : ''}
`).join('\n---\n');
        } else {
            markdown += '\nKeine Probleme in der Datenbank gefunden.\n';
        }

        markdown += `

## Häufig gestellte Fragen

### Wie füge ich ein neues Gebäude hinzu?
Navigieren Sie zu "Gebäude" → "Neues Gebäude" und füllen Sie die erforderlichen Felder aus (Name, Adresse, Baujahr, etc.).

### Wie erstelle ich Wohneinheiten?
Gehen Sie zum Gebäude-Detail und klicken Sie auf "Wohneinheit hinzufügen". Geben Sie die Größe, Zimmeranzahl und Etage an.

### Wie verwalte ich Mietverträge?
Navigieren Sie zu "Mieter" oder "Verträge" und erstellen Sie einen neuen Vertrag mit den relevanten Bedingungen.

### Was ist der Unterschied zwischen Soll und Ist?
- **Soll:** Geplante Buchungen basierend auf Mietverträgen
- **Ist:** Tatsächlich empfangene Zahlungen und Buchungen

### Wie generiere ich einen Abrechnungsbericht?
Gehen Sie zu "Berichte" → "Betriebskostenabrechnungen" und wählen Sie das Gebäude und Zeitfenster aus.

## Bekannte Limitierungen

- **Maximale Dateigröße für Uploads:** 50 MB
- **Maximale Anzahl Mieter pro Gebäude:** Unbegrenzt, aber Performance-Optimierungen ab 500+ Mietern empfohlen
- **Berichts-Generierung:** Kann bei sehr großen Datenmengen (1000+ Transaktionen) 30+ Sekunden dauern

## Edge Cases

### Fall 1: Mehrere Mieter pro Wohneinheit
Das System unterstützt Co-Mieter durch separate Verträge für dieselbe Einheit.

### Fall 2: Renovierungsperioden
Während Renovierungen können Wohneinheiten auf "Nicht verfügbar" gesetzt werden.

### Fall 3: Mieterwechsel am Monatsende
Überlappeende Verträge sollten manuell überprüft werden.
`;

        return Response.json({ 
            markdownContent: markdown,
            status: 'success',
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in generateUserIssuesDocumentation:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});