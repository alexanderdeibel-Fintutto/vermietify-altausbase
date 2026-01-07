import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const startTime = Date.now();

        const markdown = `# Code-Standards & Konventionen

**Generiert am:** ${new Date().toISOString()}

## Naming Conventions

### Entities (Datenbank-Tabellen)
- **Format:** PascalCase
- **Beispiele:** \`Building\`, \`LeaseContract\`, \`PropertyTax\`
- **Regel:** Singular, aussagekräftig, keine Abkürzungen

### Felder in Entities
- **Format:** snake_case
- **Beispiele:** \`building_id\`, \`miete_kalt\`, \`created_at\`
- **Regel:** Deutsch für Business-Felder, Englisch für technische Felder

### React Components
- **Format:** PascalCase
- **Beispiele:** \`BuildingCard.jsx\`, \`DocumentsList.jsx\`
- **Regel:** Beschreibender Name, was sie darstellen

### Functions (Backend)
- **Format:** camelCase
- **Beispiele:** \`generateDocumentation.js\`, \`exportAnlageV.js\`
- **Regel:** Verb + Nomen, beschreibt Aktion

### Variablen & Konstanten
\`\`\`javascript
// ✅ Gut
const maxUploadSize = 50 * 1024 * 1024; // 50 MB
const isAdmin = user.role === 'admin';
const buildings = await loadBuildings();

// ❌ Schlecht
const x = 50000000;
const flag = user.role === 'admin';
const data = await load();
\`\`\`

## Code-Organisation

### Verzeichnisstruktur
\`\`\`
/entities/          # JSON-Schemas für Datenbank-Tabellen
/pages/             # React Pages (KEINE Unterordner!)
/components/        # React Components (MIT Unterordnern erlaubt)
  /buildings/       # Building-bezogene Components
  /documents/       # Dokument-bezogene Components
  /shared/          # Wiederverwendbare Components
/functions/         # Backend-Funktionen (Deno)
/Layout.js          # App-Layout Wrapper
\`\`\`

### Component-Struktur
\`\`\`jsx
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MyComponent({ buildingId }) {
    // 1. State
    const [showDialog, setShowDialog] = useState(false);
    
    // 2. Queries
    const { data: building, isLoading } = useQuery({
        queryKey: ['building', buildingId],
        queryFn: () => base44.entities.Building.get(buildingId)
    });
    
    // 3. Mutations
    const updateMutation = useMutation({
        mutationFn: (data) => base44.entities.Building.update(buildingId, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['building', buildingId]);
        }
    });
    
    // 4. Handlers
    const handleSave = async () => {
        await updateMutation.mutateAsync({ ...formData });
        setShowDialog(false);
    };
    
    // 5. Render
    if (isLoading) return <div>Loading...</div>;
    
    return (
        <Card>
            <h2>{building.name}</h2>
            <Button onClick={() => setShowDialog(true)}>Edit</Button>
        </Card>
    );
}
\`\`\`

### Backend Function Struktur
\`\`\`javascript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        // 1. Auth Check
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // 2. Parse Request
        const { building_id } = await req.json();
        
        // 3. Validate Input
        if (!building_id) {
            return Response.json({ error: 'Missing building_id' }, { status: 400 });
        }
        
        // 4. Business Logic
        const building = await base44.asServiceRole.entities.Building.get(building_id);
        const result = await processBuilding(building);
        
        // 5. Return Response
        return Response.json({ success: true, result });
        
    } catch (error) {
        console.error('Function error:', error);
        return Response.json({ 
            error: 'Operation failed', 
            details: error.message 
        }, { status: 500 });
    }
});
\`\`\`

## Kommentar-Stil

### JSDoc für Funktionen
\`\`\`javascript
/**
 * Generiert eine Betriebskostenabrechnung für ein Objekt
 * 
 * @param {string} buildingId - ID des Gebäudes
 * @param {Object} options - Optionen für die Abrechnung
 * @param {string} options.year - Abrechnungsjahr (YYYY)
 * @param {boolean} options.includeTax - Steuer einbeziehen
 * @returns {Promise<Object>} Die generierte Abrechnung
 */
async function generateOperatingCostStatement(buildingId, options) {
    // Implementation
}
\`\`\`

### Inline-Kommentare
\`\`\`javascript
// ✅ Gut: Erklärt WARUM
// Wir müssen hier einen Workaround verwenden, weil die API
// bei großen Objekten (>100 Einheiten) timeoutet
const chunks = splitIntoChunks(units, 50);

// ❌ Schlecht: Erklärt WAS (offensichtlich)
// Increment counter
counter++;
\`\`\`

### TODO-Kommentare
\`\`\`javascript
// TODO: Refactoring - Diese Funktion sollte in kleinere Teile aufgeteilt werden
// TODO(max): Performance-Optimierung - Caching implementieren
// FIXME: Bug bei leeren Arrays
// HACK: Temporärer Workaround für API-Limitation
\`\`\`

## Best Practices

### 1. Error Handling
\`\`\`javascript
// ✅ Gut: Spezifische Error Messages
try {
    const building = await base44.entities.Building.get(id);
    if (!building) {
        throw new Error(\`Building with ID \${id} not found\`);
    }
} catch (error) {
    console.error('Failed to load building:', error);
    toast.error('Objekt konnte nicht geladen werden');
}

// ❌ Schlecht: Keine Fehlerbehandlung
const building = await base44.entities.Building.get(id);
\`\`\`

### 2. Loading States
\`\`\`javascript
// ✅ Gut
if (isLoading) return <Loader />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;
return <DataView data={data} />;

// ❌ Schlecht
return data ? <DataView data={data} /> : null;
\`\`\`

### 3. Data Fetching
\`\`\`javascript
// ✅ Gut: React Query mit Caching
const { data: buildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(),
    staleTime: 5 * 60 * 1000 // 5 Minuten Cache
});

// ❌ Schlecht: useEffect + fetch
useEffect(() => {
    fetch('/api/buildings').then(res => setBuildings(res.data));
}, []);
\`\`\`

### 4. Conditional Rendering
\`\`\`javascript
// ✅ Gut: Frühe Returns
if (!user) return <LoginRequired />;
if (!hasPermission) return <AccessDenied />;
return <Dashboard user={user} />;

// ❌ Schlecht: Verschachtelte Ternaries
return user ? (hasPermission ? <Dashboard /> : <AccessDenied />) : <LoginRequired />;
\`\`\`

### 5. Props Destructuring
\`\`\`javascript
// ✅ Gut
export default function BuildingCard({ building, onEdit, onDelete }) {
    return <Card>...</Card>;
}

// ❌ Schlecht
export default function BuildingCard(props) {
    return <Card>{props.building.name}</Card>;
}
\`\`\`

## Anti-Patterns zu vermeiden

### ❌ Prop Drilling
\`\`\`javascript
// Schlecht: Props durch 5 Ebenen reichen
<Parent data={data}>
  <Child1 data={data}>
    <Child2 data={data}>
      <Child3 data={data} />
    </Child2>
  </Child1>
</Parent>

// Besser: Context oder State Management
const DataContext = createContext();
\`\`\`

### ❌ Zu große Komponenten
\`\`\`javascript
// Schlecht: 500+ Zeilen Komponente
export default function Dashboard() {
    // ... 500 Zeilen Code
}

// Besser: In kleinere Komponenten aufteilen
export default function Dashboard() {
    return (
        <>
            <DashboardHeader />
            <DashboardStats />
            <DashboardCharts />
            <DashboardRecentActivity />
        </>
    );
}
\`\`\`

### ❌ Inline Styles
\`\`\`javascript
// Schlecht
<div style={{ marginTop: 20, color: 'red' }}>

// Besser: Tailwind CSS
<div className="mt-5 text-red-600">
\`\`\`

## Entwicklungs-Standards

### Git Commit Messages
\`\`\`
✅ Gut:
feat: Add building search filter
fix: Resolve date formatting issue in contracts
refactor: Split BuildingForm into smaller components
docs: Update API documentation

❌ Schlecht:
update
fixed bug
changes
wip
\`\`\`

### Code Review Checklist
- [ ] Code folgt Naming Conventions
- [ ] Error Handling implementiert
- [ ] Loading States vorhanden
- [ ] Keine Console Logs (außer error)
- [ ] Keine Debug-Code
- [ ] Responsive Design getestet
- [ ] Performance überprüft (keine n+1 Queries)
- [ ] Kommentare wo nötig

### Performance Guidelines
- ✅ Pagination bei Listen >50 Items
- ✅ Lazy Loading für große Components
- ✅ Debouncing bei Such-Eingaben (300ms)
- ✅ Memoization bei teuren Berechnungen
- ✅ Virtualization bei langen Listen (>100 Items)
`;

        const duration = (Date.now() - startTime) / 1000;
        const fileSize = new TextEncoder().encode(markdown).length;

        const existingDocs = await base44.asServiceRole.entities.GeneratedDocumentation.filter({
            documentation_type: 'coding_conventions'
        });

        const docData = {
            documentation_type: 'coding_conventions',
            title: 'Code-Standards & Konventionen',
            description: 'Naming Conventions, Code-Organisation, Kommentar-Stil und Entwicklungs-Standards',
            content_markdown: markdown,
            content_json: {
                generated_at: new Date().toISOString()
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
            documentation_type: 'coding_conventions',
            duration,
            size: fileSize
        });

    } catch (error) {
        console.error('Coding conventions documentation generation error:', error);
        return Response.json({
            error: 'Generation failed',
            details: error.message
        }, { status: 500 });
    }
});