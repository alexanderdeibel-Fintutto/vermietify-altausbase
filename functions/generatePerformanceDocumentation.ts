import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const startTime = Date.now();

        // Sammle echte Statistiken aus der Datenbank
        const buildings = await base44.asServiceRole.entities.Building.list();
        const units = await base44.asServiceRole.entities.Unit.list();
        const contracts = await base44.asServiceRole.entities.LeaseContract.list();
        const documents = await base44.asServiceRole.entities.Document.list();

        const markdown = `# Performance-Metriken & System-Limits

**Generiert am:** ${new Date().toISOString()}

## Aktuelle System-Auslastung

### Datenbankgröße (Stand heute)
- **Gebäude:** ${buildings.length} Einträge
- **Einheiten:** ${units.length} Einträge
- **Mietverträge:** ${contracts.length} Einträge
- **Dokumente:** ${documents.length} Einträge
- **Geschätzte DB-Größe:** ~${Math.round((buildings.length * 2 + units.length * 1.5 + contracts.length * 3 + documents.length * 5) / 1024)} MB

### Typische Datenmengen pro Kunde
- **Klein:** 1-5 Objekte, 10-50 Einheiten, 20-100 Verträge
- **Mittel:** 5-20 Objekte, 50-200 Einheiten, 100-500 Verträge
- **Groß:** 20-100 Objekte, 200-1000 Einheiten, 500-2000 Verträge
- **Enterprise:** 100+ Objekte, 1000+ Einheiten, 2000+ Verträge

## Performance-kritische Operationen

### Sehr schnell (<100ms)
- ✅ Einzelnes Objekt laden
- ✅ Mieter-Dashboard anzeigen
- ✅ Dokument-Vorschau
- ✅ Einfache Listen (bis 50 Einträge)

### Schnell (100-500ms)
- ⚡ Dashboard mit allen KPIs
- ⚡ Objekt-Detailseite mit allen Verknüpfungen
- ⚡ Betriebskosten-Abrechnung generieren (Standard-Objekt)
- ⚡ PDF-Dokument erstellen (1-3 Seiten)

### Mittel (500ms-2s)
- 🔄 Liste aller Transaktionen (100-500 Einträge)
- 🔄 Komplexe Filter-Operationen
- 🔄 Anlage V generieren
- 🔄 Bulk-Import CSV (50-200 Zeilen)

### Langsam (2-10s)
- ⏳ Betriebskosten-Abrechnung für große Objekte (100+ Einheiten)
- ⏳ Jahresübersicht alle Objekte
- ⏳ Bulk-Operations (1000+ Datensätze)
- ⏳ Komplexe Reports mit vielen Aggregationen

### Sehr langsam (>10s)
- ⏲️ Vollständiger Daten-Export (alle Objekte)
- ⏲️ KI-gestützte Analyse über gesamten Datenbestand
- ⏲️ Historische Trends (5+ Jahre Daten)

## System-Limits & Schwellenwerte

### Datei-Upload
- **Max. Dateigröße einzeln:** 50 MB
- **Max. Dateigröße pro Request:** 100 MB
- **Empfohlene Dateigröße:** <10 MB
- **Unterstützte Formate:** PDF, JPG, PNG, CSV, XLSX

### Datensätze
- **Max. Objekte pro Account:** 10.000 (technisch unbegrenzt)
- **Max. Einheiten pro Objekt:** 1.000 (empfohlen: <200)
- **Max. Verträge pro Einheit:** 100 (Historie)
- **Max. Belege pro Monat:** 10.000

### Listen & Pagination
- **Standard Page Size:** 50 Einträge
- **Max. Page Size:** 500 Einträge
- **Empfohlen bei großen Datenmengen:** Server-seitige Pagination + Filter

### API Rate Limits
- **Standard User:** 1000 Requests / Stunde
- **Admin User:** 5000 Requests / Stunde
- **Burst Limit:** 50 Requests / Minute

### Concurrent Users
- **Optimal:** 1-10 gleichzeitige Nutzer
- **Gut:** 10-50 gleichzeitige Nutzer
- **Grenze:** 100 gleichzeitige Nutzer
- **Über 100:** Performance-Degradation möglich

## Performance-Optimierungsstrategien

### 1. Pagination & Lazy Loading
\`\`\`javascript
// ❌ Schlecht: Alle laden
const allContracts = await loadAllContracts();

// ✅ Gut: Paginiert laden
const page1 = await loadContracts({ page: 1, limit: 50 });
\`\`\`

### 2. Selective Loading
\`\`\`javascript
// ❌ Schlecht: Alles laden
const building = await loadBuildingWithEverything(id);

// ✅ Gut: Nur was benötigt wird
const building = await loadBuilding(id);
const units = await loadUnits({ building_id: id });
\`\`\`

### 3. Caching
- **Browser-Cache:** Static Assets (24h)
- **API-Cache:** Listen-Daten (5 min)
- **Session-Cache:** User-Daten (bis Logout)

### 4. Debouncing & Throttling
\`\`\`javascript
// ✅ Such-Eingabe debounced (300ms)
const debouncedSearch = debounce(searchFunction, 300);
\`\`\`

### 5. Background Jobs
- ✅ Betriebskosten-Generierung (asynchron)
- ✅ PDF-Erstellung (Queue)
- ✅ E-Mail-Versand (Batch)

## Bottlenecks & Problembereiche

### 🔴 Kritisch
1. **Betriebskosten-Abrechnung bei 100+ Einheiten**
   - Problem: Zu viele Berechnungen auf einmal
   - Lösung: Batch-Processing, Progress-Indicator

2. **Dashboard mit 1000+ Objekten**
   - Problem: Zu viele DB-Queries
   - Lösung: Aggregationen auf DB-Ebene

### 🟡 Verbesserungswürdig
1. **PDF-Generierung**
   - Aktuell: 2-5s für 10 Seiten
   - Ziel: <1s

2. **Volltext-Suche**
   - Aktuell: 500ms-1s
   - Ziel: <200ms (Elastic Search)

### 🟢 Gut optimiert
- Objekt-Listen
- Mieter-Dashboard
- Dokument-Vorschau
- Einfache CRUD-Operationen

## Monitoring & Metriken

### Key Performance Indicators (KPIs)
- **Average Response Time:** <500ms (Ziel)
- **P95 Response Time:** <2s
- **Error Rate:** <1%
- **Uptime:** >99.5%

### Zu überwachende Metriken
1. **Response Times** - pro Endpoint
2. **Database Query Times** - langsame Queries identifizieren
3. **Memory Usage** - Memory Leaks vermeiden
4. **CPU Usage** - Spitzen erkennen
5. **Concurrent Users** - Skalierung planen

## Skalierungs-Strategien

### Kurzfristig (bis 100 Nutzer)
- ✅ Vertikale Skalierung (mehr RAM/CPU)
- ✅ Database Indexing optimieren
- ✅ Caching Layer einführen

### Mittelfristig (100-500 Nutzer)
- 🔄 Horizontale Skalierung (Load Balancer)
- 🔄 Read-Replicas für Datenbank
- 🔄 CDN für Static Assets

### Langfristig (>500 Nutzer)
- 🚀 Microservices-Architektur
- 🚀 Sharding der Datenbank
- 🚀 Geo-Distributed Setup
`;

        const duration = (Date.now() - startTime) / 1000;
        const fileSize = new TextEncoder().encode(markdown).length;

        const existingDocs = await base44.asServiceRole.entities.GeneratedDocumentation.filter({
            documentation_type: 'performance_data'
        });

        const docData = {
            documentation_type: 'performance_data',
            title: 'Performance-Metriken & Limits',
            description: 'Typische Datenmengen, Performance-kritische Operationen, System-Limits und Optimierungs-Strategien',
            content_markdown: markdown,
            content_json: {
                generated_at: new Date().toISOString(),
                current_stats: {
                    buildings: buildings.length,
                    units: units.length,
                    contracts: contracts.length,
                    documents: documents.length
                }
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
            documentation_type: 'performance_data',
            duration,
            size: fileSize
        });

    } catch (error) {
        console.error('Performance documentation generation error:', error);
        return Response.json({
            error: 'Generation failed',
            details: error.message
        }, { status: 500 });
    }
});