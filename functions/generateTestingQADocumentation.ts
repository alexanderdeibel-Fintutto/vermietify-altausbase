import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const markdown = `# Testing & Qualitätssicherung

## Test-Strategie

### Pyramide: Unit → Integration → E2E

\`\`\`
        ╱╲          E2E Tests (10-20%)
       ╱  ╲         - Full User Workflows
      ╱────╲
     ╱      ╲       Integration Tests (30-40%)
    ╱        ╲      - API Endpoints
   ╱──────────╲     - Database Operations
  ╱            ╲    
 ╱              ╲   Unit Tests (50-60%)
╱────────────────╲  - Functions, Components, Utils
\`\`\`

## Unit Tests

### Test-Struktur

\`\`\`javascript
describe('calculateRentIncrease', () => {
  describe('with valid inputs', () => {
    it('should calculate 3% increase', () => {
      expect(calculateRentIncrease(1000, 3)).toBe(1030)
    })
    
    it('should handle decimal amounts', () => {
      expect(calculateRentIncrease(1000.50, 3)).toBe(1030.515)
    })
  })
  
  describe('with invalid inputs', () => {
    it('should throw error for negative amount', () => {
      expect(() => calculateRentIncrease(-1000, 3)).toThrow()
    })
  })
})
\`\`\`

### Test-Daten

\`\`\`javascript
const mockBuilding = {
  id: 'building_123',
  name: 'Teststraße 1',
  city: 'Berlin',
  totalUnits: 5
}

const mockTenant = {
  id: 'tenant_456',
  fullName: 'John Doe',
  email: 'john@example.com'
}

const mockLeaseContract = {
  id: 'lease_789',
  buildingId: 'building_123',
  tenantId: 'tenant_456',
  monthlyRent: 1000,
  startDate: '2024-01-01'
}
\`\`\`

## Integration Tests

### API Endpoint Tests

\`\`\`javascript
describe('POST /buildings', () => {
  it('should create a building', async () => {
    const response = await request(app)
      .post('/buildings')
      .send({
        name: 'New Building',
        city: 'Berlin',
        postalCode: '10115'
      })
    
    expect(response.status).toBe(201)
    expect(response.body.id).toBeDefined()
  })
  
  it('should validate required fields', async () => {
    const response = await request(app)
      .post('/buildings')
      .send({ city: 'Berlin' }) // Missing name
    
    expect(response.status).toBe(400)
    expect(response.body.error).toMatch(/name required/)
  })
})
\`\`\`

### Database Tests

\`\`\`javascript
describe('Building Entity', () => {
  beforeEach(async () => {
    await clearDatabase()
  })
  
  it('should create and retrieve building', async () => {
    const building = await base44.entities.Building.create({
      name: 'Test Building',
      city: 'Berlin'
    })
    
    const retrieved = await base44.entities.Building.get(building.id)
    expect(retrieved.name).toBe('Test Building')
  })
})
\`\`\`

## E2E Tests

### User Journey Tests

\`\`\`javascript
describe('Create Lease Contract Journey', () => {
  it('should complete full workflow', async () => {
    // 1. Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // 2. Navigate to buildings
    await page.click('a[href="/buildings"]')
    
    // 3. Create building
    await page.click('button:has-text("New Building")')
    await page.fill('[name="name"]', 'Test Building')
    await page.fill('[name="city"]', 'Berlin')
    await page.click('button:has-text("Create")')
    
    // 4. Navigate to building details
    await page.click('text=Test Building')
    
    // 5. Create lease contract
    await page.click('button:has-text("New Lease")')
    await page.select('[name="tenant"]', 'tenant_456')
    await page.fill('[name="rent"]', '1000')
    await page.click('button:has-text("Create Lease")')
    
    // Verify
    await expect(page).toHaveText('Lease created successfully')
  })
})
\`\`\`

## Test-Daten Management

### Fixtures

\`\`\`javascript
// fixtures/buildings.js
export const buildings = [
  {
    id: 'building_001',
    name: 'Residential Complex A',
    city: 'Berlin',
    units: 20
  },
  {
    id: 'building_002',
    name: 'Commercial Building B',
    city: 'Munich',
    units: 10
  }
]
\`\`\`

### Test-Setup

\`\`\`javascript
beforeAll(async () => {
  // Initialize test database
  await initializeTestDB()
  
  // Seed test data
  await seedTestData(buildings)
  await seedTestData(tenants)
  await seedTestData(leaseContracts)
})

afterAll(async () => {
  // Cleanup
  await cleanupTestDB()
})
\`\`\`

## QA-Prozess

### Test-Phase 1: Development
- Entwickler schreiben Unit Tests
- Lokales Testen vor Commit
- Minimum: 70% Code Coverage

### Test-Phase 2: Testing Environment
- Integration Tests ausführen
- Regression Testing
- Performance Testing
- Sicherheits-Überprüfung

### Test-Phase 3: Staging
- E2E Tests auf Staging-Umgebung
- Benutzungs-Szenarien testen
- Daten-Migrationen testen

### Test-Phase 4: Production
- Smoke Tests vor Release
- Monitoring aktivieren
- Rollback Plan bereit

## Automatisierte Test-Suite

### CI/CD Pipeline

\`\`\`yaml
test:
  stage: test
  script:
    - npm run test:unit
    - npm run test:integration
    - npm run test:coverage
  coverage: '/Statements\\s+:\\s+(\\d+.\\d+)/'

e2e:
  stage: e2e
  script:
    - npm run test:e2e
  only:
    - develop
    - main

security:
  stage: security
  script:
    - npm audit
    - npm run lint
\`\`\`

## Freigabe-Workflow

### Checklist vor Production

- [ ] Alle Unit Tests grün
- [ ] Alle Integration Tests grün
- [ ] E2E Tests auf Staging erfolgreich
- [ ] Code Review bestätigt
- [ ] Keine Security Issues
- [ ] Performance Tests ok
- [ ] Database Migration getestet
- [ ] Rollback Plan dokumentiert
- [ ] Change Log aktualisiert
- [ ] Stakeholder notifiziert

### Release Process

1. **Vorbereitung** (1 Stunde)
   - Tag erstellen
   - Release Notes generieren
   - Rollback Plan überprüfen

2. **Deployment** (30 Minuten)
   - Blue-Green Deployment
   - Health Checks durchführen
   - Monitoring aktivieren

3. **Verifikation** (30 Minuten)
   - Smoke Tests
   - Kritische Funktionen überprüfen
   - User Feedback sammeln

4. **Monitoring** (24 Stunden)
   - Error Rates überprüfen
   - Performance Metrics
   - User-Support Tickets

## Bug-Klassifizierung

| Severity | Impact | Response Time | Example |
|----------|--------|---|---------|
| Critical | System down | Immediate | Login broken |
| High | Feature broken | 1 hour | Payments not working |
| Medium | Reduced functionality | 4 hours | Slow reports |
| Low | Minor issue | 1 day | UI glitch |

## Regression Testing

### Critical Paths

1. Neue Mieter erstellen
2. Mietvertrag abschließen
3. Rechnung generieren
4. Zahlung verarbeiten
5. Bericht exportieren
6. Benutzer verwalten

Diese Pfade werden vor jedem Release getestet.

## Performance-Testing

### Load Test Szenarien

**Szenario 1: Normal**
- 100 Users
- 5 Requests pro User
- Target: p95 < 500ms

**Szenario 2: Peak**
- 500 Users
- 10 Requests pro User
- Target: p95 < 1s

**Szenario 3: Stress**
- 1000+ Users
- bis zum Fehler
- Target: Graceful degradation
`;

        return Response.json({ 
            markdownContent: markdown,
            status: 'success',
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in generateTestingQADocumentation:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});