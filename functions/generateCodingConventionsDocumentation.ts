import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const startTime = Date.now();

        const content = `# Coding Conventions & Code-Organisation

**Generiert am:** ${new Date().toISOString().split('T')[0]}  
**Version:** 1.0  
**Für:** Immobilienverwaltung App auf Base44

---

## 1. NAMING CONVENTIONS

### 📊 ENTITIES (Datenbank-Tabellen)

**Sprache:** Mix Englisch/Deutsch (historisch gewachsen)

**Konvention:**
- **Name:** PascalCase, Singular
- **Kern-Entities:** Englisch (Building, Unit, Tenant, Owner)
- **Domain-spezifisch:** Deutsch (AnlageVSubmission, Grundsteuer → PropertyTax, Versicherung → Insurance)

**Beispiele:**
\`\`\`
✅ Building (Englisch, Core-Entity)
✅ LeaseContract (Englisch)
✅ PropertyTax (Englisch, aber deutscher Kontext)
✅ AnlageVSubmission (Deutsch, weil sehr deutsch-spezifisch)
✅ OperatingCostStatement (Englisch)
⚠️ Gebaeude (veraltet, wird migriert zu Building)
\`\`\`

**Empfehlung für neue Entities:**
- **Englisch** wenn internationales Konzept (Invoice, Contract, Payment)
- **Deutsch** wenn sehr deutsch-spezifisch (AnlageV, Grundsteuer-Bescheid)
- **Kompromiss:** Englischer Name + deutsche Labels (z.B. PropertyTax statt Grundsteuer)

---

### 🔤 FELDER (Entity-Properties)

**Konvention:** camelCase (konsequent)

**Beispiele:**
\`\`\`javascript
✅ firstName
✅ lastName  
✅ baseRent
✅ totalAmount
✅ createdDate
✅ isActive
✅ buildingId (Referenzen)
❌ first_name (snake_case - nicht verwenden)
❌ FirstName (PascalCase - nicht verwenden)
\`\`\`

**Spezielle Präfixe/Suffixe:**
- **Boolean-Felder:** \`is*\`, \`has*\`, \`can*\`
  - \`isActive\`, \`hasBookings\`, \`canBeAllocated\`
- **Referenzen:** \`*Id\`, \`*Ids\` (Array)
  - \`buildingId\`, \`tenantId\`, \`unitIds\`
- **Datum-Felder:** \`*Date\`, \`*At\`
  - \`startDate\`, \`createdAt\`, \`dueDate\`
- **Zähl-Felder:** \`numberOf*\`, \`*Count\`
  - \`numberOfGeneratedBookings\`, \`pageCount\`

**Vermeiden:**
- ❌ Abkürzungen (außer etabliert wie \`id\`, \`url\`, \`pdf\`)
- ❌ Ungarische Notation (strName, intAge)
- ❌ Kryptische Namen (x, temp, data1)

---

### 🎯 FUNKTIONEN (Backend Functions)

**Konvention:** camelCase, Verb + Noun

**Pattern:**
- \`verb\` + \`Noun\` (z.B. \`generatePDF\`, \`createInvoice\`)
- Klar was die Funktion tut (Name sollte selbsterklärend sein)

**Beispiele:**
\`\`\`javascript
✅ generateBookingsFromSource
✅ exportAnlageVPDF
✅ calculateAnlageVEinnahmen
✅ linkBookingToTransaction
✅ analyzeInsurancePayments
✅ validateAnlageV
✅ syncEmails
❌ bookings (zu vague)
❌ doStuff (nicht beschreibend)
❌ helper1 (nicht aussagekräftig)
\`\`\`

**Verben die wir verwenden:**
- \`generate*\` - Erzeuge etwas (PDF, Buchungen, Dokument)
- \`create*\` - Erstelle Entity
- \`update*\` - Aktualisiere Entity
- \`delete*\` - Lösche Entity
- \`calculate*\` - Berechne etwas
- \`validate*\` - Validiere Daten
- \`analyze*\` - Analysiere (mit AI oder Heuristik)
- \`sync*\` - Synchronisiere mit externem Service
- \`export*\` - Exportiere Daten
- \`import*\` - Importiere Daten
- \`link*\` / \`unlink*\` - Verknüpfe/Trenne Entities

---

### 🔧 KOMPONENTEN (React Components)

**Konvention:** PascalCase, Noun + Type

**Pattern:**
- Funktionale Komponenten (default export)
- Name = Dateiname
- Suffix für Typ (Form, List, Card, Dialog, Wizard)

**Beispiele:**
\`\`\`javascript
✅ BuildingForm.jsx (Formular für Building)
✅ ContractsList.jsx (Liste von Contracts)
✅ TenantCard.jsx (Card für einen Tenant)
✅ DocumentPreviewDialog.jsx (Dialog für Dokument-Vorschau)
✅ AnlageVWizard.jsx (Multi-Step-Formular)
✅ NotificationCenter.jsx (Widget)
❌ building-form.jsx (kebab-case)
❌ BuildingFormComponent.jsx (redundant "Component")
\`\`\`

**Komponenten-Typen (Suffix):**
- \`*Form\` - Formular (Create/Edit)
- \`*List\` - Liste von Entities
- \`*Card\` - Einzelnes Item (in Liste oder Dashboard)
- \`*Dialog\` - Modal-Dialog
- \`*Wizard\` - Multi-Step-Prozess
- \`*Table\` - Tabellen-Ansicht
- \`*Detail\` - Detail-Ansicht (volle Seite)
- \`*Section\` - Abschnitt auf einer Seite
- \`*Widget\` - Dashboard-Widget
- \`*Manager\` - Verwaltungs-Komponente (CRUD)

---

### 📄 SEITEN (Pages)

**Konvention:** PascalCase, Singular oder Plural je nach Kontext

**Beispiele:**
\`\`\`javascript
✅ Dashboard.js (Singular - eine Dashboard-Seite)
✅ Buildings.js (Plural - Liste von Gebäuden)
✅ BuildingDetail.js (Singular + Suffix)
✅ TaxForms.js (Plural)
✅ Finanzen.js (Deutsch, da Seiten-Name deutsch)
❌ buildings.js (lowercase)
❌ BuildingsList.js (redundant, Page ist immer Liste oder Detail)
\`\`\`

**Regel:**
- Liste → Plural (Buildings, Contracts, Tasks)
- Detail → Singular + "Detail" (BuildingDetail, ContractDetail)
- Sonstige → Singular (Dashboard, Analytics, Tax)

---

### 🔀 VARIABLEN & KONSTANTEN

**Variablen:** camelCase
\`\`\`javascript
✅ const totalRent = baseRent + utilities + heating;
✅ let currentStep = 1;
✅ const filteredContracts = contracts.filter(...);
\`\`\`

**Konstanten (zur Laufzeit unveränderlich):** SCREAMING_SNAKE_CASE oder camelCase
\`\`\`javascript
✅ const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
✅ const DEFAULT_DUE_DAY = 3;
✅ const STATUS_CONFIG = { ... };
⚠️ const statusConfig = { ... }; (auch ok, wenn nicht wirklich konstant)
\`\`\`

**Enum-artige Arrays/Objects:** camelCase mit sprechendem Namen
\`\`\`javascript
✅ const STATUS_OPTIONS = ['offen', 'in_bearbeitung', 'erledigt'];
✅ const PRIORITY_COLORS = { low: 'bg-blue-100', ... };
\`\`\`

---

### 🎨 CSS-KLASSEN (Tailwind)

**Konvention:** Tailwind-Standard (kebab-case)

**Best Practices:**
\`\`\`javascript
✅ className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg"
✅ className={cn("base-classes", condition && "conditional-classes")}
❌ className="custom-button" (vermeiden, Tailwind bevorzugen)
\`\`\`

**Conditional Classes mit \`cn()\`:**
\`\`\`javascript
import { cn } from "@/lib/utils";

className={cn(
  "base classes here",
  isActive && "bg-emerald-500",
  !isActive && "bg-slate-300"
)}
\`\`\`

---

## 2. CODE-ORGANISATION

### 📁 ORDNER-STRUKTUR

\`\`\`
/
├── entities/              # Datenbank-Schemas (JSON)
│   ├── Building.json
│   ├── LeaseContract.json
│   └── ...
│
├── pages/                 # Seiten (FLACH, KEINE UNTERORDNER!)
│   ├── Dashboard.js
│   ├── Buildings.js
│   ├── BuildingDetail.js
│   └── ...
│
├── components/            # Komponenten (MIT Unterordnern)
│   ├── buildings/
│   │   ├── BuildingForm.jsx
│   │   ├── BuildingCard.jsx
│   │   └── OwnersSection.jsx
│   ├── contracts/
│   │   ├── ContractForm.jsx
│   │   └── FinancialItemsList.jsx
│   ├── shared/
│   │   ├── EmptyState.jsx
│   │   ├── PageHeader.jsx
│   │   └── HelpSystem.jsx
│   └── ui/                # shadcn/ui components
│       ├── button.jsx
│       ├── card.jsx
│       └── ...
│
├── functions/             # Backend Functions (Deno)
│   ├── generatePDF.js
│   ├── generateBookingsFromSource.js
│   ├── letterxpress.js
│   └── ...
│   # KEINE Unterordner (noch), aber geplant:
│   # finance/, documents/, tax/, etc.
│
├── Layout.js              # App-weites Layout
│
└── globals.css            # Globale Styles (Tailwind-Config)
\`\`\`

---

### 📦 IMPORT-KONVENTIONEN

**Reihenfolge:**
1. React / External Libraries
2. UI-Components (shadcn)
3. Base44 SDK
4. Eigene Components
5. Utils / Helpers
6. Typen / Constants
7. Styles

**Beispiel:**
\`\`\`javascript
// 1. React & External
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// 2. UI-Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// 3. Icons
import { Building2, Plus, Edit, Trash2 } from 'lucide-react';

// 4. Base44 SDK
import { base44 } from '@/api/base44Client';

// 5. Eigene Components
import BuildingForm from '../components/buildings/BuildingForm';
import BuildingCard from '../components/buildings/BuildingCard';

// 6. Utils
import { cn } from "@/lib/utils";
import { createPageUrl } from './utils';

// 7. Types (wenn TypeScript)
// import type { Building } from '@/types';
\`\`\`

**Aliase:**
- \`@/components/*\` für Components
- \`@/api/*\` für API-Client
- \`@/lib/*\` für Utils

---

### 🗂️ KOMPONENTEN-GRUPPIERUNG

**Nach Feature/Domain (BEVORZUGT):**
\`\`\`
components/
  ├── buildings/       # Alles rund um Gebäude
  ├── contracts/       # Alles rund um Verträge
  ├── invoices/        # Alles rund um Rechnungen
  ├── tax/             # Steuer-Komponenten
  ├── banking/         # Bank-Integration
  ├── documents/       # Dokumenten-Verwaltung
  └── shared/          # Wiederverwendbare Komponenten
\`\`\`

**NICHT nach Typ:**
\`\`\`
❌ components/
    ├── forms/       # NICHT SO
    ├── lists/
    └── dialogs/
\`\`\`

**Vorteil:** Alles zu einem Feature an einem Ort (Locality of Behavior)

---

### 📝 DATEI-ORGANISATION (innerhalb Components)

**Kleine Komponenten (< 200 Zeilen):** Alles in einer Datei
\`\`\`javascript
// BuildingCard.jsx
import React from 'react';
// ... imports

const STATUS_CONFIG = { ... }; // Konstanten oben

export default function BuildingCard({ building }) {
  // State
  const [expanded, setExpanded] = useState(false);
  
  // Queries/Mutations
  const { data } = useQuery(...);
  
  // Helper Functions
  const formatAddress = () => { ... };
  
  // Render
  return <Card>...</Card>;
}
\`\`\`

**Große Komponenten (> 200 Zeilen):** Splitten in Sub-Components
\`\`\`javascript
// ContractForm.jsx (Hauptkomponente)
import BasicInfoStep from './contract-form/BasicInfoStep';
import RentDetailsStep from './contract-form/RentDetailsStep';
import SummaryStep from './contract-form/SummaryStep';

export default function ContractForm() { ... }

// components/contracts/contract-form/BasicInfoStep.jsx
export default function BasicInfoStep({ data, onChange }) { ... }
\`\`\`

---

### ⚙️ BACKEND-FUNCTIONS

**Datei-Organisation:**
\`\`\`javascript
// functions/generatePDF.js

// 1. Imports
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import puppeteer from 'npm:puppeteer@...';

// 2. Helper Functions (optional)
const sanitizeHTML = (html) => { ... };

// 3. Main Handler
Deno.serve(async (req) => {
  try {
    // 3.1 Authentication
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 3.2 Parse Request
    const { html, fileName } = await req.json();
    
    // 3.3 Validation
    if (!html) {
      return Response.json({ error: 'HTML required' }, { status: 400 });
    }
    
    // 3.4 Business Logic
    const pdf = await generatePDF(html);
    
    // 3.5 Response
    return Response.json({ file_url: pdf.url });
    
  } catch (error) {
    console.error('Generate PDF error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
\`\`\`

**Namenskonvention Backend-Functions:**
- camelCase (wie Entities-Felder)
- Verb + Noun
- Sprechend (was tut die Funktion?)

---

## 3. KOMMENTAR-STIL

### 💬 WANN KOMMENTIEREN?

**JA kommentieren:**
- ✅ Komplexe Business-Logic (z.B. AfA-Berechnung, Umlageschlüssel)
- ✅ Rechtliche Anforderungen (z.B. §558 BGB bei Mieterhöhung)
- ✅ Nicht-offensichtliche Workarounds
- ✅ Magic Numbers erklären
- ✅ Performance-Optimierungen (warum so gemacht?)
- ✅ TODO/FIXME für Tech-Debt

**NICHT kommentieren:**
- ❌ Offensichtlicher Code (\`// Set name to firstName\`)
- ❌ Was der Code macht (Code sollte selbsterklärend sein)
- ❌ Auskommentierter alter Code (löschen!)

---

### 📐 KOMMENTAR-FORMAT

**Sprache:** Deutsch (da deutsche Fachdomäne)

**Inline-Kommentare:**
\`\`\`javascript
// Berechne AfA (2% vom Gebäudewert ohne Grundstück)
const afa = (purchasePrice - landValue) * 0.02;

// §558 BGB: Max. 20% Mieterhöhung in 3 Jahren
const maxIncrease = oldRent * 0.20;
\`\`\`

**Block-Kommentare für komplexe Logic:**
\`\`\`javascript
/**
 * Berechnet die Betriebskosten-Verteilung nach Umlageschlüssel
 * 
 * Verteilschlüssel:
 * - Fläche (m²): Grundsteuer, Versicherung, Hausreinigung
 * - Personen: Müll, Wasser (teilweise)
 * - Verbrauch: Heizung (nach Zählerständen)
 * 
 * Rechtliche Grundlage: §556 BGB, BetrKV §7-11
 */
const distributeOperatingCosts = (costs, contracts) => {
  // ...
};
\`\`\`

**JSDoc für wiederverwendbare Funktionen:**
\`\`\`javascript
/**
 * Berechnet den Jahres-AfA-Betrag für ein Gebäude
 * @param {number} purchasePrice - Kaufpreis gesamt
 * @param {number} landValue - Grundstückswert
 * @param {number} rate - AfA-Satz (Standard: 0.02 = 2%)
 * @returns {number} Jährlicher AfA-Betrag
 */
const calculateAfA = (purchasePrice, landValue, rate = 0.02) => {
  return (purchasePrice - landValue) * rate;
};
\`\`\`

**TODO/FIXME:**
\`\`\`javascript
// TODO: Implementiere Duplikats-Check
// FIXME: Performance-Problem bei >1000 Einträgen
// HACK: Workaround für finAPI-Bug, besser lösen sobald API gefixt
// NOTE: Wichtig - diese Berechnung muss mit §556 BGB konform sein
\`\`\`

---

### 🌐 DEUTSCH vs. ENGLISCH

**Konvention:** Gemischt (pragmatisch)

**DEUTSCH:**
- Code-Kommentare (weil deutsche Fachdomäne)
- Geschäftslogik-Erklärungen
- Rechtliche Hinweise
- User-sichtbare Texte (Labels, Descriptions, Error-Messages)

**ENGLISCH:**
- Code (Variablen, Funktionen, Entity-Namen)
- Technische Kommentare (z.B. "Performance optimization")
- Git-Commit-Messages
- API-Dokumentation

**Beispiel (Mix):**
\`\`\`javascript
// Berechne die Kappungsgrenze für Mieterhöhung (§558 BGB)
// Cap increase at 20% over 3 years
const calculateRentIncreaseCap = (oldRent, yearsElapsed) => {
  const maxIncreaseRate = 0.20; // 20% über 3 Jahre
  return oldRent * maxIncreaseRate;
};
\`\`\`

---

## 4. CODE-STYLE GUIDE

### ✨ REACT KOMPONENTEN

**Funktionale Komponenten (immer):**
\`\`\`javascript
// ✅ BEVORZUGT
export default function MyComponent({ prop1, prop2 }) {
  return <div>...</div>;
}

// ❌ NICHT VERWENDEN
class MyComponent extends React.Component { ... }
\`\`\`

**Hooks-Reihenfolge:**
\`\`\`javascript
export default function MyComponent() {
  // 1. State
  const [state, setState] = useState();
  
  // 2. Refs
  const ref = useRef();
  
  // 3. Context
  const context = useContext(MyContext);
  
  // 4. React Query
  const { data } = useQuery(...);
  const mutation = useMutation(...);
  
  // 5. Effects
  useEffect(() => { ... }, []);
  
  // 6. Callbacks
  const handleClick = useCallback(() => { ... }, []);
  
  // 7. Memoized Values
  const computed = useMemo(() => { ... }, []);
  
  // 8. Event Handlers
  const handleSubmit = (e) => { ... };
  
  // 9. Render
  return <div>...</div>;
}
\`\`\`

**Destructuring bevorzugen:**
\`\`\`javascript
// ✅ BEVORZUGT
const { firstName, lastName, email } = tenant;

// ❌ VERMEIDEN
const firstName = tenant.firstName;
const lastName = tenant.lastName;
\`\`\`

**Early Returns:**
\`\`\`javascript
// ✅ BEVORZUGT
if (isLoading) return <Loader />;
if (error) return <Error />;
if (!data) return <EmptyState />;

return <ActualContent />;

// ❌ VERMEIDEN (zu viele verschachtelte ifs)
return (
  <div>
    {isLoading ? <Loader /> : error ? <Error /> : data ? <Content /> : <Empty />}
  </div>
);
\`\`\`

---

### 🎯 BACKEND-FUNCTIONS

**Error-Handling Pattern:**
\`\`\`javascript
Deno.serve(async (req) => {
  try {
    // Main logic
  } catch (error) {
    console.error('Function name error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
\`\`\`

**Immer Response.json() verwenden:**
\`\`\`javascript
// ✅ RICHTIG
return Response.json({ success: true, data: result });

// ❌ FALSCH
return { success: true }; // Keine Response-Object
\`\`\`

---

### 🔄 STATE-MANAGEMENT

**React Query für Server-State:**
\`\`\`javascript
// ✅ BEVORZUGT
const { data: buildings, isLoading } = useQuery({
  queryKey: ['buildings'],
  queryFn: () => base44.entities.Building.list()
});
\`\`\`

**useState für UI-State:**
\`\`\`javascript
// ✅ RICHTIG
const [dialogOpen, setDialogOpen] = useState(false);
const [currentStep, setCurrentStep] = useState(1);
\`\`\`

**Mutations mit Cache-Invalidation:**
\`\`\`javascript
const queryClient = useQueryClient();

const createMutation = useMutation({
  mutationFn: (data) => base44.entities.Building.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['buildings'] });
    toast.success('Gebäude erstellt');
  }
});
\`\`\`

---

## 5. ENTITY-SCHEMA KONVENTIONEN

### 📋 JSON-SCHEMA FORMAT

**Beispiel:**
\`\`\`json
{
  "name": "Building",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Gebäudename"
    },
    "address": {
      "type": "string",
      "description": "Straße und Hausnummer"
    },
    "is_active": {
      "type": "boolean",
      "default": true,
      "description": "Aktiv"
    },
    "building_type": {
      "type": "string",
      "enum": ["Wohngebäude", "Gewerbe", "Gemischt"],
      "description": "Gebäudetyp"
    }
  },
  "required": ["name", "address"]
}
\`\`\`

**Feld-Konventionen:**
- \`type\`: string, number, boolean, array, object
- \`description\`: Deutsch (wird in UI angezeigt)
- \`default\`: Default-Wert (optional)
- \`enum\`: Array von erlaubten Werten
- \`required\`: Array von Pflichtfeldern

**Referenzen:**
- Suffix \`Id\` für 1:1 oder n:1 (z.B. \`buildingId\`)
- Suffix \`Ids\` für n:m (z.B. \`unitIds\`)

---

## 6. DATENBANK-ABFRAGE PATTERNS

### 🔍 Base44 SDK Queries

**Liste laden:**
\`\`\`javascript
// Alle (default: 50)
const buildings = await base44.entities.Building.list();

// Mit Sortierung (neueste zuerst)
const buildings = await base44.entities.Building.list('-created_date');

// Mit Limit
const buildings = await base44.entities.Building.list('-created_date', 100);
\`\`\`

**Filtern:**
\`\`\`javascript
// Einfacher Filter
const active = await base44.entities.LeaseContract.filter({ status: 'active' });

// Mit Sortierung
const active = await base44.entities.LeaseContract.filter(
  { status: 'active' }, 
  '-start_date',
  50
);
\`\`\`

**CRUD:**
\`\`\`javascript
// Create
const newBuilding = await base44.entities.Building.create(data);

// Update
await base44.entities.Building.update(id, data);

// Delete
await base44.entities.Building.delete(id);

// Bulk-Create
await base44.entities.Invoice.bulkCreate([invoice1, invoice2, ...]);
\`\`\`

---

## 7. STYLING CONVENTIONS

### 🎨 TAILWIND PATTERNS

**Responsive Design:**
\`\`\`javascript
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
// Mobil: 1 Spalte, Tablet: 2, Desktop: 3
\`\`\`

**Spacing System:**
- Verwende Tailwind-Spacing (px-4, py-6, gap-3)
- Nicht custom values (\`px-[13px]\` vermeiden)

**Farben:**
- Primärfarbe: \`emerald-600\`
- Success: \`green-600\`
- Warning: \`yellow-600\`
- Error: \`red-600\`
- Neutral: \`slate-...\`

**Pattern für Cards:**
\`\`\`javascript
className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
\`\`\`

**Pattern für Buttons:**
\`\`\`javascript
// Primary
className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"

// Secondary
className="bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2 rounded-lg"
\`\`\`

---

## 8. GIT CONVENTIONS (falls Git verwendet wird)

### 📝 COMMIT-MESSAGES

**Format:** \`type(scope): message\`

**Typen:**
- \`feat\` - Neues Feature
- \`fix\` - Bugfix
- \`refactor\` - Code-Refactoring (keine funktionale Änderung)
- \`style\` - Styling-Änderungen
- \`docs\` - Dokumentation
- \`test\` - Tests hinzugefügt
- \`chore\` - Build, Config, Dependencies

**Beispiele:**
\`\`\`
✅ feat(contracts): Add rent increase wizard
✅ fix(invoices): Correct tax calculation for partial months
✅ refactor(buildings): Split BuildingDetail into smaller components
✅ docs(readme): Add installation instructions
❌ Fixed stuff (zu vage)
❌ WIP (nicht committen)
\`\`\`

**Branch-Namen:**
\`\`\`
feature/mieter-portal
fix/booking-update-bug
refactor/contracts-list
hotfix/pdf-generation
\`\`\`

---

## 9. ERROR-HANDLING PATTERNS

### ⚠️ FRONTEND

**React Query Error-Handling:**
\`\`\`javascript
const { data, error, isLoading } = useQuery({
  queryKey: ['buildings'],
  queryFn: () => base44.entities.Building.list()
});

if (isLoading) return <Loader />;
if (error) return <ErrorDisplay message={error.message} />;
if (!data || data.length === 0) return <EmptyState />;

return <BuildingsList buildings={data} />;
\`\`\`

**Mutation Error-Handling:**
\`\`\`javascript
const mutation = useMutation({
  mutationFn: (data) => base44.entities.Building.create(data),
  onSuccess: () => {
    toast.success('Gebäude erstellt');
  },
  onError: (error) => {
    toast.error('Fehler: ' + error.message);
  }
});
\`\`\`

**Keine try/catch im Frontend (außer bei expliziten Anforderungen):**
\`\`\`javascript
// ❌ VERMEIDEN (React Query handled Errors)
try {
  const data = await base44.entities.Building.list();
} catch (error) {
  setError(error);
}

// ✅ BEVORZUGT (React Query)
const { data, error } = useQuery({ ... });
\`\`\`

---

### ⚠️ BACKEND

**Immer try/catch:**
\`\`\`javascript
Deno.serve(async (req) => {
  try {
    // Logic
  } catch (error) {
    console.error('Function error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
\`\`\`

**Spezifische Error-Codes:**
\`\`\`javascript
// 400 - Bad Request (User-Fehler)
if (!requiredField) {
  return Response.json({ error: 'Field required' }, { status: 400 });
}

// 401 - Unauthorized (nicht eingeloggt)
if (!user) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

// 403 - Forbidden (eingeloggt, aber keine Berechtigung)
if (user.role !== 'admin') {
  return Response.json({ error: 'Admin access required' }, { status: 403 });
}

// 404 - Not Found
if (!entity) {
  return Response.json({ error: 'Entity not found' }, { status: 404 });
}

// 500 - Server Error (unerwarteter Fehler)
catch (error) {
  return Response.json({ error: error.message }, { status: 500 });
}
\`\`\`

---

## 10. TESTING CONVENTIONS (geplant)

### 🧪 UNIT TESTS (noch nicht implementiert)

**Dateiname:** \`ComponentName.test.jsx\`

**Pattern:**
\`\`\`javascript
import { render, screen } from '@testing-library/react';
import BuildingCard from './BuildingCard';

describe('BuildingCard', () => {
  it('should render building name', () => {
    const building = { name: 'Test Gebäude' };
    render(<BuildingCard building={building} />);
    expect(screen.getByText('Test Gebäude')).toBeInTheDocument();
  });
  
  it('should calculate units correctly', () => {
    // ...
  });
});
\`\`\`

---

## 11. PERFORMANCE BEST PRACTICES

### ⚡ DO's

**1. React Query Caching nutzen:**
\`\`\`javascript
const { data } = useQuery({
  queryKey: ['buildings'],
  queryFn: () => base44.entities.Building.list(),
  staleTime: 5 * 60 * 1000, // 5 Minuten Cache
});
\`\`\`

**2. useMemo für teure Berechnungen:**
\`\`\`javascript
const totalRent = useMemo(() => {
  return contracts.reduce((sum, c) => sum + c.total_rent, 0);
}, [contracts]);
\`\`\`

**3. useCallback für Event-Handlers in Listen:**
\`\`\`javascript
const handleDelete = useCallback((id) => {
  // ...
}, []);
\`\`\`

**4. Lazy-Loading für große Komponenten:**
\`\`\`javascript
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Loader />}>
  <HeavyComponent />
</Suspense>
\`\`\`

### ⚠️ DON'Ts

**1. Nicht alle Daten auf einmal laden:**
\`\`\`javascript
// ❌ SCHLECHT
const allInvoices = await base44.entities.Invoice.list(); // lädt ALLE

// ✅ BESSER
const recentInvoices = await base44.entities.Invoice.filter(
  { invoice_date: { $gte: '2024-01-01' } },
  '-invoice_date',
  100
);
\`\`\`

**2. Nicht in Loops fetchen:**
\`\`\`javascript
// ❌ SCHLECHT (N+1 Problem)
contracts.map(async (c) => {
  const tenant = await base44.entities.Tenant.get(c.tenant_id);
  return { ...c, tenant };
});

// ✅ BESSER
const tenantIds = contracts.map(c => c.tenant_id);
const tenants = await base44.entities.Tenant.filter({
  id: { $in: tenantIds }
});
const tenantsMap = Object.fromEntries(tenants.map(t => [t.id, t]));
const contractsWithTenants = contracts.map(c => ({
  ...c,
  tenant: tenantsMap[c.tenant_id]
}));
\`\`\`

**3. Nicht unnötig re-rendern:**
\`\`\`javascript
// ❌ SCHLECHT (re-rendert bei jedem Parent-Render)
<HeavyComponent data={data} onChange={(val) => setValue(val)} />

// ✅ BESSER
const handleChange = useCallback((val) => setValue(val), []);
<HeavyComponent data={data} onChange={handleChange} />
\`\`\`

---

## 12. SECURITY BEST PRACTICES

### 🔒 DO's

**1. Input-Sanitization:**
\`\`\`javascript
// Backend
const sanitized = userInput.trim().slice(0, 255);
\`\`\`

**2. Authentication prüfen:**
\`\`\`javascript
// Immer in Backend-Functions
const user = await base44.auth.me();
if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
\`\`\`

**3. Secrets nur im Backend:**
\`\`\`javascript
// ✅ RICHTIG (Backend)
const apiKey = Deno.env.get('EXTERNAL_API_KEY');

// ❌ FALSCH (Frontend)
const apiKey = 'sk_live_...'; // NIEMALS!
\`\`\`

**4. SQL-Injection-Safe (Base44 SDK macht das automatisch):**
\`\`\`javascript
// ✅ SICHER (SDK escaped automatisch)
base44.entities.Building.filter({ name: userInput });
\`\`\`

---

## 13. DOKUMENTATIONS-KONVENTIONEN

### 📖 INLINE-DOKU

**Komplexe Funktionen:**
\`\`\`javascript
/**
 * Berechnet die Betriebskosten-Umlage nach §556 BGB
 * 
 * Berücksichtigt:
 * - Umlageschlüssel (Fläche, Personen, Verbrauch)
 * - Zeitanteilige Abrechnung bei Mieterwechsel
 * - Vorauszahlungen vs. tatsächliche Kosten
 * 
 * @param {string} buildingId - ID des Gebäudes
 * @param {number} year - Abrechnungsjahr
 * @returns {Promise<Object>} Abrechnung mit items und balances
 */
async function calculateOperatingCosts(buildingId, year) {
  // Implementation
}
\`\`\`

---

## 14. ANTI-PATTERNS (VERMEIDEN!)

**❌ Magic Numbers:**
\`\`\`javascript
// ❌ SCHLECHT
if (daysElapsed > 30) { ... }

// ✅ BESSER
const PAYMENT_DUE_DAYS = 30;
if (daysElapsed > PAYMENT_DUE_DAYS) { ... }
\`\`\`

**❌ Tief verschachtelte Ifs:**
\`\`\`javascript
// ❌ SCHLECHT
if (user) {
  if (user.role === 'admin') {
    if (building) {
      if (building.is_active) {
        // ...
      }
    }
  }
}

// ✅ BESSER (Early Returns)
if (!user) return;
if (user.role !== 'admin') return;
if (!building) return;
if (!building.is_active) return;
// ...
\`\`\`

**❌ Große Funktionen (>50 Zeilen):**
\`\`\`javascript
// ❌ SCHLECHT
function processEverything() {
  // 200 lines of code
}

// ✅ BESSER
function processStep1() { ... }
function processStep2() { ... }
function processStep3() { ... }

function processEverything() {
  processStep1();
  processStep2();
  processStep3();
}
\`\`\`

**❌ Prop-Drilling:**
\`\`\`javascript
// ❌ SCHLECHT
<Parent data={data}>
  <Child data={data}>
    <GrandChild data={data}>
      <GreatGrandChild data={data} />
    </GrandChild>
  </Child>
</Parent>

// ✅ BESSER (Context oder React Query)
const BuildingContext = createContext();
// oder
const { data } = useQuery(['building', id]);
\`\`\`

---

## 15. CHECKLISTE NEUE FEATURES

Bevor ein neues Feature als "fertig" gilt:

- [ ] Code folgt Naming-Conventions
- [ ] Keine duplizierten Code-Blöcke
- [ ] Error-Handling implementiert
- [ ] Loading-States vorhanden
- [ ] Empty-States vorhanden
- [ ] Responsive (Mobile + Desktop getestet)
- [ ] Performance-optimiert (keine N+1 Queries)
- [ ] Kommentare bei komplexer Logic
- [ ] TODO/FIXME aufgeräumt
- [ ] User-Feedback (Toast-Messages)
- [ ] Security: Input-Validierung
- [ ] Dokumentation aktualisiert (falls große Änderung)

---

**Ende der Dokumentation**

Diese Konventionen sind lebende Richtlinien und werden bei Bedarf angepasst.
`;

        const duration = (Date.now() - startTime) / 1000;

        // Speichere Dokumentation
        const doc = await base44.entities.GeneratedDocumentation.create({
            documentation_type: 'coding_conventions',
            title: 'Coding Conventions & Code-Organisation',
            description: 'Naming Conventions, Code-Organisation, Kommentar-Stil, Best Practices',
            content_markdown: content,
            content_json: {
                sections: [
                    'Naming Conventions',
                    'Code-Organisation',
                    'Kommentar-Stil',
                    'Code-Style Guide',
                    'Entity-Schema',
                    'Datenbank-Queries',
                    'Styling',
                    'Git Conventions',
                    'Error-Handling',
                    'Security',
                    'Anti-Patterns',
                    'Feature-Checkliste'
                ],
                key_conventions: {
                    entities: 'PascalCase, Mix Deutsch/Englisch',
                    fields: 'camelCase',
                    functions: 'camelCase, Verb+Noun',
                    components: 'PascalCase, Noun+Type',
                    variables: 'camelCase',
                    comments: 'Deutsch für Business-Logic'
                }
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
            generation_duration_seconds: duration
        });

    } catch (error) {
        console.error('Generate coding conventions documentation error:', error);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});