import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { documentationTypes } = await req.json();
        
        if (!documentationTypes || documentationTypes.length === 0) {
            return Response.json({ 
                error: 'Keine Bereiche ausgewählt' 
            }, { status: 400 });
        }

        // Mapping: Typ → Dateiname-Präfix
        const DATEINAMEN = {
            'database_structure': '01_datenbankstruktur',
            'module_architecture': '02_modul_architektur',
            'master_data': '03_stammdaten',
            'business_logic': '04_geschaeftslogik',
            'external_integrations': '05_integrationen',
            'document_generation': '06_dokumente',
            'user_workflows': '07_workflows',
            'permissions_roles': '08_berechtigungen',
            'error_handling': '09_fehlerbehandlung',
            'data_migration': '10_datenhistorie',
            'executive_summary': '11_zusammenfassung',
            'sample_data': '13_beispiel_daten',
            'user_issues': '14_faq_probleme',
            'timeline_calendar': '15_geschaeftsprozesse',
            'performance_data': '16_performance',
            'coding_conventions': '18_code_standards',
            'testing_qa': '19_testing_qa',
        };

        // Dynamisches ZIP-Modul laden
        const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
        const zip = new JSZip();
        let anzahlDateien = 0;

        // README erstellen
        const readme = `# Entwickler-Dokumentation Export

**Exportiert am:** ${new Date().toISOString()}
**Anzahl Bereiche:** ${documentationTypes.length}
**Bereiche:** ${documentationTypes.join(', ')}

## VERWENDUNG

Diese Dokumentationen können einzeln hochgeladen oder analysiert werden.
Jede Datei ist eigenständig und enthält die vollständige Dokumentation
des jeweiligen Bereichs.

---
Generiert von: base44 Immobilienverwaltung
`;
        zip.file('README.md', readme);

        // Für jeden ausgewählten Typ
        for (const typ of documentationTypes) {
            // Dokumentation aus DB laden
            const docs = await base44.asServiceRole.entities.GeneratedDocumentation.filter({ 
                documentation_type: typ 
            });
            
            if (docs.length === 0) {
                console.warn(`Keine Dokumentation für Typ: ${typ}`);
                continue;
            }

            // Neueste Dokumentation nehmen
            const doc = docs.sort((a, b) => 
                new Date(b.last_generated_at || 0) - new Date(a.last_generated_at || 0)
            )[0];
            
            if (!doc.content_markdown) {
                console.warn(`Keine Markdown-Inhalte für ${typ}`);
                continue;
            }
            
            // Dateinamen erstellen
            const dateiname = DATEINAMEN[typ] || typ;
            
            // Markdown-Inhalt mit Header
            const inhalt = `# ${doc.title.toUpperCase()}

**Typ:** ${typ}
**Generiert am:** ${doc.last_generated_at || new Date().toISOString()}
**Größe:** ${doc.file_size_bytes ? Math.round(doc.file_size_bytes / 1024) + ' KB' : 'unbekannt'}

---

${doc.content_markdown}
`;

            // Datei zum ZIP hinzufügen
            zip.file(`${dateiname}.md`, inhalt);
            anzahlDateien++;
        }

        if (anzahlDateien === 0) {
            return Response.json({ 
                error: 'Keine Dokumentationen gefunden' 
            }, { status: 404 });
        }

        // ZIP-Archiv generieren
        const zipBlob = await zip.generateAsync({ 
            type: 'uint8array',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 }
        });

        // Dateinamen für ZIP
        const datum = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const zipDateiname = `entwickler_doku_${anzahlDateien}_bereiche_${datum}.zip`;

        // ZIP zurückgeben
        return new Response(zipBlob, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${zipDateiname}"`,
                'Content-Length': zipBlob.length.toString(),
            }
        });

    } catch (error) {
        console.error('Fehler bei ZIP-Erstellung:', error);
        return Response.json({ 
            error: 'ZIP-Erstellung fehlgeschlagen', 
            details: error.message 
        }, { status: 500 });
    }
});