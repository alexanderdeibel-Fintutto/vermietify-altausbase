import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const markdown = `# Code-Standards & Konventionen

## Naming Conventions

### JavaScript/TypeScript

**Variablen & Funktionen:** camelCase
\`\`\`javascript
const userId = 'user_123'
const calculateTotalRent = (contracts) => { ... }
let isLoading = false
\`\`\`

**Konstanten:** UPPER_SNAKE_CASE
\`\`\`javascript
const MAX_FILE_SIZE = 50 * 1024 * 1024
const API_TIMEOUT = 30000
const DEFAULT_PAGE_SIZE = 20
\`\`\`

**Klassen & Komponenten:** PascalCase
\`\`\`javascript
class PaymentProcessor { ... }
function LeaseContractForm() { ... }
const BuildingCard = ({ building }) => { ... }
\`\`\`

**Datei-Namen:** camelCase (komponenten), snake_case (funktionen)
\`\`\`
components/LeaseContractForm.jsx
functions/process_lease_contract.js
pages/BuildingManagement.jsx
\`\`\`

### Database/Entity Names

**Tabellen:** snake_case, Singular
\`\`\`
building (nicht buildings)
lease_contract (nicht lease-contracts)
user_payment (nicht userpayment)
\`\`\`

**Spalten:** snake_case
\`\`\`
building_name
unit_number
monthly_rent
lease_start_date
\`\`\`

## Code-Organisation

### Verzeichnisstruktur

\`\`\`
components/
  ├── common/           # Wiederverwendbare Komponenten
  │   ├── Button.jsx
  │   └── Card.jsx
  ├── buildings/        # Gebäude-spezifische Komponenten
  │   ├── BuildingForm.jsx
  │   └── BuildingCard.jsx
  └── tenants/          # Mieter-spezifische Komponenten

functions/
  ├── building/         # Gebäude-Funktionen
  ├── tenant/           # Mieter-Funktionen
  └── finance/          # Finanz-Funktionen

pages/
  ├── Buildings.jsx
  ├── Tenants.jsx
  └── Finance.jsx
\`\`\`

### Datei-Größe & Komplexität

**Kleine Komponenten:** < 200 Zeilen
\`\`\`javascript
// Button.jsx
const Button = ({ label, onClick }) => (
  <button onClick={onClick}>{label}</button>
)
\`\`\`

**Mittlere Komponenten:** 200-500 Zeilen (mit mehreren Funktionen)
\`\`\`javascript
// LeaseContractForm.jsx
// useState, useEffect, Formularverwaltung, validierungen
\`\`\`

**Große Komponenten:** > 500 Zeilen → Aufbrechen
\`\`\`javascript
// Statt monolithisches BuildingDetailPage.jsx:
// BuildingDetailPage.jsx (Layout)
// ├── BuildingInfoPanel.jsx
// ├── BuildingUnitsList.jsx
// ├── BuildingTenantsPanel.jsx
// └── BuildingDocumentsPanel.jsx
\`\`\`

## Import-Reihenfolge

\`\`\`javascript
// 1. External imports
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

// 2. Internal imports (components)
import Button from '@/components/common/Button'
import BuildingForm from '@/components/buildings/BuildingForm'

// 3. Utilities & helpers
import { formatDate } from '@/utils/dateHelpers'

// 4. API/Services
import { base44 } from '@/api/base44Client'

// 5. Styles
import './BuildingPage.css'
\`\`\`

## Kommentar-Stil

### Block-Kommentare für komplexe Logik

\`\`\`javascript
// Berechne Betriebskostenanteil für diese Einheit
// Formel: (einheit_fläche / gesamt_fläche) × gesamtkosten
const unitShare = (unit.area / building.totalArea) * totalCosts
\`\`\`

### JSDoc für Funktionen

\`\`\`javascript
/**
 * Generiert einen Mietvertrag aus Template-Daten
 * @param {Object} contract - Vertragsdaten
 * @param {string} contract.id - Vertrags-ID
 * @param {Object} contract.tenant - Mieterdaten
 * @returns {Promise<string>} URL zum generierten PDF
 * @throws {Error} Falls Template nicht gefunden
 */
async function generateLeaseContract(contract) {
  // implementation
}
\`\`\`

### TODO/FIXME Kommentare

\`\`\`javascript
// TODO: Pagination einführen wenn > 1000 items
const buildings = await base44.entities.Building.list()

// FIXME: Fehlerbehandlung verbesern (derzeit nur console.error)
const response = await fetchFromAPI()
\`\`\`

## Error Handling

### Try-Catch mit sprechenden Fehlern

\`\`\`javascript
try {
  const lease = await createLeaseContract(data)
  return { success: true, data: lease }
} catch (error) {
  if (error instanceof ValidationError) {
    return { success: false, error: error.message, type: 'validation' }
  }
  logger.error('Failed to create lease contract', { error, data })
  throw new Error('Lease contract creation failed')
}
\`\`\`

## Testing

### Unit Tests

\`\`\`javascript
// calculateRentIncrease.test.js
describe('calculateRentIncrease', () => {
  it('should calculate 3% increase correctly', () => {
    const result = calculateRentIncrease(1000, 3)
    expect(result).toBe(1030)
  })
  
  it('should handle decimal amounts', () => {
    const result = calculateRentIncrease(1000.50, 3)
    expect(result).toBe(1030.515)
  })
})
\`\`\`

### Integration Tests

\`\`\`javascript
// leaseContract.integration.test.js
describe('Lease Contract Workflow', () => {
  it('should create and update lease contract', async () => {
    const lease = await createLeaseContract(testData)
    expect(lease.id).toBeDefined()
    
    const updated = await updateLeaseContract(lease.id, { rent: 1050 })
    expect(updated.rent).toBe(1050)
  })
})
\`\`\`

## Performance Best Practices

### React Optimization

\`\`\`javascript
// Memo für häufig re-render Komponenten
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{data.name}</div>
})

// useCallback für stabile Funktionen
const handleSave = useCallback((data) => {
  saveBuilding(data)
}, [])

// useMemo für teure Berechnungen
const totalCosts = useMemo(() => {
  return buildings.reduce((sum, b) => sum + b.costs, 0)
}, [buildings])
\`\`\`

### Query Optimization

\`\`\`javascript
// Nutze Pagination
const { data } = useQuery({
  queryKey: ['buildings', page],
  queryFn: () => base44.entities.Building.list('-updated_date', 20, page * 20),
  staleTime: 5 * 60 * 1000, // 5 Minuten
})

// Nur benötigte Felder
const buildings = await base44.entities.Building.list('-updated_date', 20)
// Nicht: const allData = await fetchEverything()
\`\`\`

## Security Best Practices

### Input Validation

\`\`\`javascript
function validateBuildingData(data) {
  if (!data.name || data.name.length < 2) {
    throw new ValidationError('Building name too short')
  }
  if (!data.address || !data.city) {
    throw new ValidationError('Missing address or city')
  }
  return true
}
\`\`\`

### Sanitization

\`\`\`javascript
// Nutze Templating statt string concatenation
const message = \`Building: \${building.name}\` // Sicher
// Nicht: const message = 'Building: ' + userInput // Unsicher
\`\`\`

## Documentation

### README für größere Module

\`\`\`markdown
# Building Management Module

## Features
- Create, read, update, delete buildings
- Manage units within buildings
- Generate building reports

## Usage
const building = await createBuilding({
  name: 'Beispielstraße 42',
  city: 'Berlin'
})

## Dependencies
- base44.entities.Building
- formatAddress utility
\`\`\`

## Code Review Checklist

- [ ] Naming conventions follow standards
- [ ] Functions are < 50 lines
- [ ] Proper error handling
- [ ] Input validation
- [ ] Comments for complex logic
- [ ] Tests included
- [ ] No console.log statements (use logger)
- [ ] Performance optimized
- [ ] Security reviewed
- [ ] Documentation updated
`;

        return Response.json({ 
            markdownContent: markdown,
            status: 'success',
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in generateCodingConventionsDocumentation:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});