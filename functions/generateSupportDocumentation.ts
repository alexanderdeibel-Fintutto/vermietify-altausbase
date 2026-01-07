import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const startTime = Date.now();

        // Zeitraum: Letzte 30 Tage
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

        // Lade alle Probleme
        const [allProblems, recentProblems, statistics, solutions] = await Promise.all([
            base44.entities.UserProblem.list('-created_date', 1000).catch(() => []),
            base44.entities.UserProblem.filter(
                { created_date: { $gte: thirtyDaysAgoStr } },
                '-created_date',
                500
            ).catch(() => []),
            base44.entities.ProblemStatistics.filter(
                { datum: { $gte: thirtyDaysAgoStr } }
            ).catch(() => []),
            base44.entities.ProblemSolution.filter({ is_published: true }).catch(() => [])
        ]);

        // Statistiken berechnen
        const totalProblems = allProblems.length;
        const recentCount = recentProblems.length;
        const solvedProblems = allProblems.filter(p => p.status === 'Gelöst').length;
        const solvedRate = totalProblems > 0 ? ((solvedProblems / totalProblems) * 100).toFixed(1) : 0;
        
        // Durchschnittliche Lösungszeit
        const solvedWithTime = allProblems.filter(p => p.loesungszeit_stunden);
        const avgSolutionTime = solvedWithTime.length > 0
            ? (solvedWithTime.reduce((sum, p) => sum + p.loesungszeit_stunden, 0) / solvedWithTime.length).toFixed(1)
            : 0;

        // Probleme nach Kategorie
        const byCategory = {};
        recentProblems.forEach(p => {
            if (!byCategory[p.kategorie]) {
                byCategory[p.kategorie] = { count: 0, critical: 0, solved: 0 };
            }
            byCategory[p.kategorie].count++;
            if (p.schweregrad === 'Kritisch') byCategory[p.kategorie].critical++;
            if (p.status === 'Gelöst') byCategory[p.kategorie].solved++;
        });

        // Probleme nach Modul
        const byModule = {};
        recentProblems.forEach(p => {
            if (p.betroffenes_modul) {
                if (!byModule[p.betroffenes_modul]) {
                    byModule[p.betroffenes_modul] = { count: 0, critical: 0, solved: 0 };
                }
                byModule[p.betroffenes_modul].count++;
                if (p.schweregrad === 'Kritisch') byModule[p.betroffenes_modul].critical++;
                if (p.status === 'Gelöst') byModule[p.betroffenes_modul].solved++;
            }
        });

        // Top 10 häufigste Probleme (nach Duplikaten)
        const topProblems = [...allProblems]
            .filter(p => p.anzahl_duplikate > 1)
            .sort((a, b) => b.anzahl_duplikate - a.anzahl_duplikate)
            .slice(0, 10);

        // Kritische/Ungelöste Probleme
        const criticalOpen = allProblems.filter(p => 
            p.schweregrad === 'Kritisch' && p.status !== 'Gelöst'
        );
        const highOpen = allProblems.filter(p => 
            p.schweregrad === 'Hoch' && p.status !== 'Gelöst'
        );

        // Feature-Requests
        const featureRequests = allProblems.filter(p => p.ist_feature_request);
        const topFeatures = {};
        featureRequests.forEach(p => {
            const key = p.problem_titel.toLowerCase();
            if (!topFeatures[key]) {
                topFeatures[key] = { title: p.problem_titel, count: 0 };
            }
            topFeatures[key].count++;
        });
        const topFeaturesList = Object.values(topFeatures)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const content = `# User-Fehler & Support-Dokumentation

**Generiert am:** ${new Date().toISOString().replace('T', ' ').split('.')[0]}  
**Zeitraum:** Letzte 30 Tage (${thirtyDaysAgoStr} - ${new Date().toISOString().split('T')[0]})  
**Anzahl erfasster Probleme:** ${totalProblems}  
**Anzahl gelöster Probleme:** ${solvedProblems} (${solvedRate}%)  
**Durchschnittliche Lösungszeit:** ${avgSolutionTime}h

---

## 📊 STATISTIK-ÜBERSICHT

### Top 10 Häufigste Probleme (Letzte 30 Tage)

${topProblems.length > 0 ? `
| Rang | Problem | Kategorie | Anzahl | Schweregrad | Status |
|------|---------|-----------|--------|-------------|--------|
${topProblems.map((p, i) => `| ${i + 1} | ${p.problem_titel} | ${p.kategorie} | ${p.anzahl_duplikate}x | ${p.schweregrad} | ${p.status} |`).join('\n')}
` : '_Noch keine Probleme mit Duplikaten erfasst_'}

### Probleme nach Kategorie

| Kategorie | Anzahl | Kritisch | Gelöst % |
|-----------|--------|----------|----------|
${Object.entries(byCategory).map(([cat, data]) => 
    `| ${cat} | ${data.count} | ${data.critical} | ${data.count > 0 ? ((data.solved / data.count) * 100).toFixed(0) : 0}% |`
).join('\n')}

### Probleme nach Modul

| Modul | Anzahl | Kritisch | Gelöst % |
|-------|--------|----------|----------|
${Object.entries(byModule).length > 0 ? Object.entries(byModule).map(([mod, data]) => 
    `| ${mod} | ${data.count} | ${data.critical} | ${data.count > 0 ? ((data.solved / data.count) * 100).toFixed(0) : 0}% |`
).join('\n') : '| _Keine Modul-Zuordnungen_ | - | - | - |'}

---

## 🔥 KRITISCHE/UNGELÖSTE PROBLEME

### Kritisch (verhindert Arbeit)

${criticalOpen.length > 0 ? criticalOpen.map(p => `
**${p.problem_titel}**
- **Beschreibung:** ${p.problem_beschreibung.substring(0, 200)}${p.problem_beschreibung.length > 200 ? '...' : ''}
- **Modul:** ${p.betroffenes_modul || 'Nicht angegeben'}
- **Erstmals gemeldet:** ${p.created_date ? new Date(p.created_date).toLocaleDateString('de-DE') : 'N/A'}
- **Status:** ${p.status}
- **Bearbeiter:** ${p.bearbeiter_email || 'Noch nicht zugewiesen'}
${p.workaround ? `- **Workaround:** ${p.workaround}` : ''}
`).join('\n---\n') : '_Keine kritischen offenen Probleme_ ✅'}

### Hochpriorität (erschwert Arbeit)

${highOpen.length > 0 ? highOpen.slice(0, 5).map(p => `
**${p.problem_titel}**
- Modul: ${p.betroffenes_modul || 'N/A'}
- Erstmals: ${p.created_date ? new Date(p.created_date).toLocaleDateString('de-DE') : 'N/A'}
- Status: ${p.status}
`).join('\n') : '_Keine hochprioren offenen Probleme_ ✅'}

---

## 📚 WISSENSDATENBANK

### Veröffentlichte Lösungen: ${solutions.length}

${solutions.length > 0 ? solutions.slice(0, 10).map(s => `
#### ${s.titel}

- **Kategorie:** ${s.gilt_fuer_kategorien?.join(', ') || 'Allgemein'}
- **Schwierigkeitsgrad:** ${s.schwierigkeitsgrad || 'N/A'}
- **Geschätzte Dauer:** ${s.geschaetzte_dauer_minuten || 'N/A'} Min
- **Aufrufe:** ${s.anzahl_aufrufe || 0}
- **Hilfreich:** ${s.anzahl_hilfreich || 0} 👍 / ${s.anzahl_nicht_hilfreich || 0} 👎 ${s.hilfreich_prozent ? `(${s.hilfreich_prozent}%)` : ''}

**Beschreibung:**
${s.beschreibung.substring(0, 300)}${s.beschreibung.length > 300 ? '...' : ''}

${s.schritte?.length > 0 ? `
**Schritte:**
${s.schritte.slice(0, 3).map((step, i) => `${i + 1}. ${step.text || step}`).join('\n')}
${s.schritte.length > 3 ? `... (${s.schritte.length - 3} weitere Schritte)` : ''}
` : ''}

---
`).join('\n') : '_Noch keine Lösungen in der Wissensdatenbank veröffentlicht_'}

---

## 🎯 FEATURE-REQUESTS AUS SUPPORT

### Top 10 Feature-Wünsche

${topFeaturesList.length > 0 ? `
| Rang | Feature | Anzahl Anfragen |
|------|---------|-----------------|
${topFeaturesList.map((f, i) => `| ${i + 1} | ${f.title} | ${f.count}x |`).join('\n')}
` : '_Noch keine Feature-Requests erfasst_'}

---

## 🔍 ANALYSE & EMPFEHLUNGEN

### Datenqualität
- **Erfasste Probleme:** ${totalProblems}
- **Mit Lösung dokumentiert:** ${allProblems.filter(p => p.loesung_beschreibung).length}
- **Mit Modul-Zuordnung:** ${allProblems.filter(p => p.betroffenes_modul).length}
- **Mit Screenshot:** ${allProblems.filter(p => p.screenshots?.length > 0).length}

### Status-Verteilung
${Object.entries(
    allProblems.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
    }, {})
).map(([status, count]) => `- **${status}:** ${count}`).join('\n')}

### Schweregrad-Verteilung
${Object.entries(
    allProblems.reduce((acc, p) => {
        acc[p.schweregrad] = (acc[p.schweregrad] || 0) + 1;
        return acc;
    }, {})
).map(([grad, count]) => `- **${grad}:** ${count}`).join('\n')}

### Empfehlungen

${criticalOpen.length > 5 ? '🔴 **DRINGEND:** Es gibt ' + criticalOpen.length + ' kritische offene Probleme - sofortige Aufmerksamkeit erforderlich!' : ''}
${highOpen.length > 10 ? '🟡 **WICHTIG:** ' + highOpen.length + ' hochpriore Probleme offen - priorisieren!' : ''}
${solvedRate < 70 ? '⚠️ **AKTION:** Lösungsrate bei nur ' + solvedRate + '% - Support-Kapazität erhöhen!' : ''}
${avgSolutionTime > 24 ? '⏱️ **VERBESSERUNG:** Durchschnittliche Lösungszeit ' + avgSolutionTime + 'h - zu langsam!' : ''}
${solutions.length < 10 ? '📚 **TODO:** Nur ' + solutions.length + ' Lösungen in Wissensdatenbank - mehr dokumentieren!' : ''}

${topProblems.length > 0 ? `
### Häufigste Probleme priorisieren
Die folgenden Probleme treten am häufigsten auf und sollten zuerst gelöst werden:
${topProblems.slice(0, 3).map((p, i) => `${i + 1}. **${p.problem_titel}** (${p.anzahl_duplikate}x gemeldet)`).join('\n')}
` : ''}

---

## 📈 NÄCHSTE SCHRITTE

1. **Kritische Probleme lösen:** ${criticalOpen.length} offene kritische Probleme
2. **Wissensdatenbank erweitern:** Häufige Probleme dokumentieren
3. **Feature-Requests evaluieren:** Top 3 Features prüfen und ggf. in Roadmap aufnehmen
4. **Performance verbessern:** Lösungszeit unter 12h bringen
5. **Automatisierung:** Häufige Fragen automatisch beantworten

---

**Hinweis:** Diese Dokumentation wird automatisch aus den erfassten Support-Tickets generiert.  
Für detaillierte Statistiken siehe Support-Dashboard.
`;

        const duration = (Date.now() - startTime) / 1000;

        // Speichere Dokumentation
        const doc = await base44.entities.GeneratedDocumentation.create({
            documentation_type: 'support_fehler',
            title: 'User-Fehler & Support-Dokumentation',
            description: 'Dokumentation aller von Endnutzern gemeldeten Probleme, Fehler und Support-Anfragen',
            content_markdown: content,
            content_json: {
                statistics: {
                    total_problems: totalProblems,
                    recent_problems: recentCount,
                    solved_problems: solvedProblems,
                    solved_rate: parseFloat(solvedRate),
                    avg_solution_time: parseFloat(avgSolutionTime),
                    critical_open: criticalOpen.length,
                    high_open: highOpen.length
                },
                by_category: byCategory,
                by_module: byModule,
                top_problems: topProblems.map(p => ({
                    id: p.id,
                    title: p.problem_titel,
                    count: p.anzahl_duplikate,
                    category: p.kategorie
                })),
                top_features: topFeaturesList,
                solutions_count: solutions.length
            },
            file_size_bytes: new Blob([content]).size,
            generation_duration_seconds: duration,
            last_generated_at: new Date().toISOString(),
            status: 'completed'
        });

        return Response.json({
            success: true,
            documentation_id: doc.id,
            file_size_bytes: doc.file_size_bytes,
            generation_duration_seconds: duration,
            statistics: {
                total_problems: totalProblems,
                solved_rate: solvedRate,
                critical_open: criticalOpen.length
            }
        });

    } catch (error) {
        console.error('Generate support documentation error:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});