import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const markdown = `# Dokumenten-Generierung

## Überblick

Das System generiert automatisch verschiedene Dokumenttypen basierend auf Vorlagen und Daten.

## Automatisch generierte Dokumenttypen

### 1. Mietvertrag (LeaseContract)

**Auslöser:** Mietvertrag erstellen/finalisieren
**Template:** \`lease_contract_standard_de.html\`
**Output:** PDF

**Felder:**
\`\`\`
{{building.name}}
{{unit.number}}
{{tenant.fullName}}
{{tenant.email}}
{{contract.monthlyRent}}
{{contract.startDate | dateFormat}}
{{contract.endDate | dateFormat}}
{{contract.deposit}}
\`\`\`

**Prozess:**
\`\`\`javascript
1. Validiere Mieterdaten
2. Lade Template
3. Fülle Platzhalter
4. Generiere PDF
5. Speichere in Dokumenten-Verwaltung
6. Sende Link an Mieter
\`\`\`

### 2. Rechnung (Invoice)

**Auslöser:** Rechnung generieren (monatlich automatisch)
**Template:** \`invoice_standard_de.html\`
**Output:** PDF

**Felder:**
\`\`\`
{{invoice.number}}
{{invoice.date | dateFormat}}
{{invoice.dueDate | dateFormat}}
{{building.name}}
{{unit.number}}
{{items[].description}}
{{items[].amount}}
{{invoice.totalAmount}}
{{payment.bankDetails}}
\`\`\`

### 3. Betriebskostenabrechnung

**Auslöser:** Jährlich (normalerweise März/April)
**Template:** \`operating_costs_statement_de.html\`
**Output:** PDF + CSV

**Berechnung:**
\`\`\`javascript
totalCosts = sum(operatingCostItems.amount)
unitShare = (unit.area / building.totalArea) * totalCosts
alreadyPaid = sum(unit.monthlyAdvancePayments)
settlement = unitShare - alreadyPaid
\`\`\`

### 4. Zahlungsquittung (PaymentReceipt)

**Auslöser:** Zahlung verarbeitet
**Template:** \`payment_receipt_de.html\`
**Output:** PDF + E-Mail

**Felder:**
\`\`\`
{{receipt.number}}
{{payment.date}}
{{tenant.fullName}}
{{payment.amount}}
{{payment.method}}
{{receipt.reference}}
\`\`\`

### 5. Kündigungsschreiben (TerminationLetter)

**Auslöser:** Kündigung einleiten
**Template:** \`termination_letter_de.html\`
**Output:** PDF

**Felder:**
\`\`\`
{{building.address}}
{{tenant.fullName}}
{{contract.id}}
{{termination.effectiveDate}}
{{termination.reason}}
{{deposit.amount}}
{{deposit.refundDate}}
\`\`\`

### 6. Mieterhöhungsankündigung

**Auslöser:** Mieterhöhung planen
**Template:** \`rent_increase_notice_de.html\`
**Output:** PDF

**Felder:**
\`\`\`
{{building.address}}
{{tenant.fullName}}
{{contract.currentRent}}
{{newRent}}
{{effectiveDate}}
{{rentIncreaseReason}}
{{legalBasis}} (z.B. BGH § 559)
\`\`\`

## Template-System

### Template-Struktur

\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { border-bottom: 2px solid #333; }
    .footer { margin-top: 40px; font-size: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>MIETVERTRAG</h1>
    <p>Vertragsnummer: {{contract.id}}</p>
  </div>
  
  <section class="contract-terms">
    <h2>Vertragsparteien</h2>
    <p><strong>Mieter:</strong> {{tenant.fullName}}</p>
    <p><strong>Gebäude:</strong> {{building.name}}</p>
  </section>
  
  <div class="footer">
    <p>Generiert am {{generatedDate | dateFormat}}</p>
  </div>
</body>
</html>
\`\`\`

### Platzhalter-Syntax

| Syntax | Beschreibung | Beispiel |
|--------|---|---|
| \`{{field}}\` | Einfaches Feld | \`{{tenant.name}}\` |
| \`{{field \| filter}}\` | Mit Filter | \`{{date \| dateFormat('de-DE')}}\` |
| \`{{#if condition}}\` | Bedingung | \`{{#if contract.deposit > 0}}\` |
| \`{{#each items}}\` | Loop | \`{{#each items}} {{this.amount}} {{/each}}\` |

### Verfügbare Filter

\`\`\`javascript
dateFormat(value, locale = 'de-DE')
  // 2024-01-15 → 15. Januar 2024

currencyFormat(value, currency = 'EUR')
  // 1234.56 → 1.234,56 €

uppercase(value)
  // hello → HELLO

lowercase(value)
  // HELLO → hello

number(value, decimals = 2)
  // 1234.5 → 1.234,50
\`\`\`

## Dokumenten-Generierungs-Engine

### Generierungs-Prozess

\`\`\`javascript
async function generateDocument(type, data) {
  // 1. Template laden
  const template = await loadTemplate(type)
  
  // 2. Daten validieren
  validateData(data, template.schema)
  
  // 3. Platzhalter ersetzen
  const html = replacePlaceholders(template.html, data)
  
  // 4. In PDF konvertieren
  const pdf = await htmlToPDF(html, {
    format: 'A4',
    margin: { top: 20, bottom: 20 }
  })
  
  // 5. Speichern
  const document = await base44.entities.Document.create({
    title: generateTitle(type, data),
    content: pdf,
    documentType: type,
    relatedEntity: data.entityId
  })
  
  // 6. Rückgabe
  return document
}
\`\`\`

### Error Handling

\`\`\`javascript
try {
  const doc = await generateDocument('lease_contract', data)
  return { success: true, documentId: doc.id }
} catch (error) {
  if (error instanceof ValidationError) {
    return { 
      success: false, 
      error: 'Missing required fields',
      missing: error.missingFields 
    }
  }
  
  if (error instanceof TemplateError) {
    return { 
      success: false, 
      error: 'Template not found',
      template: error.templateName 
    }
  }
  
  logger.error('Document generation failed', { error, type: 'lease_contract' })
  throw error
}
\`\`\`

## Batch-Generierung

### Mehrere Dokumente auf einmal

\`\`\`javascript
async function generateMonthlyInvoices() {
  const contracts = await base44.entities.LeaseContract.filter({
    status: 'ACTIVE'
  })
  
  const invoices = []
  for (const contract of contracts) {
    const invoice = await generateInvoice({
      contractId: contract.id,
      month: getCurrentMonth(),
      items: await calculateInvoiceItems(contract)
    })
    invoices.push(invoice)
  }
  
  return invoices
}
\`\`\`

### Asynchrone Verarbeitung

\`\`\`javascript
async function generateBatchDocuments(documentRequests) {
  const results = await Promise.allSettled(
    documentRequests.map(req => generateDocument(req.type, req.data))
  )
  
  const successful = results.filter(r => r.status === 'fulfilled')
  const failed = results.filter(r => r.status === 'rejected')
  
  return {
    successful: successful.map(r => r.value),
    failed: failed.map(r => r.reason),
    totalProcessed: results.length
  }
}
\`\`\`

## Dokumenten-Versioning

### Änderungsverfolgung

\`\`\`javascript
{
  "documentId": "doc_123",
  "version": 1,
  "createdAt": "2024-01-15T10:00:00Z",
  "changedFields": ["monthlyRent"],
  "previousValues": { "monthlyRent": 1000 },
  "newValues": { "monthlyRent": 1030 },
  "reason": "Mieterhöhung 2024",
  "approvedBy": "admin@example.com"
}
\`\`\`

### Archivierung

Alte Dokumentversionen werden archiviert, können aber wiederhergestellt werden:

\`\`\`javascript
const previousVersion = await getDocumentVersion(documentId, version: 1)
await restoreDocumentVersion(documentId, version: 1)
\`\`\`

## Sicherheit & Compliance

### Audit Trail

Alle Dokumenten-Generierungen werden protokolliert:

\`\`\`javascript
{
  "documentId": "doc_456",
  "generatedBy": "user@example.com",
  "generatedAt": "2024-01-15T14:30:00Z",
  "type": "invoice",
  "relatedEntity": "contract_789",
  "fileSize": 125440,
  "hash": "sha256_abc123..."
}
\`\`\`

### Zugriffskontrolle

- Nur Besitzer kann Dokument einsehen
- Mieter sehen nur eigene Dokumente
- Admin sieht alle Dokumente
- Alle Zugriffe werden protokolliert

## Automatische Generierung (Scheduled)

### Monatliche Rechnungen

\`\`\`
Trigger: 1. des Monats um 05:00 Uhr
Action: Generiere Rechnungen für alle aktiven Verträge
Distribution: Per E-Mail an Mieter
\`\`\`

### Jährliche Betriebskostenabrechnungen

\`\`\`
Trigger: 1. März um 06:00 Uhr
Action: Berechne Betriebskostenabrechnung
Distribution: Per E-Mail + Druck
Deadline: 31. März
\`\`\`

### Kündigungserinnerungen

\`\`\`
Trigger: 90 Tage vor Vertragsende
Action: Generiere Erinnerungs-PDF
Distribution: Intern für Manager
\`\`\`

## Performance-Optimierungen

### Caching

- Templates werden gecacht (TTL: 1 Stunde)
- Häufige Platzhalter-Ersetzungen optimiert
- PDF-Generierung asynchron mit Queue

### Batch-Verarbeitung

- Maximale Batch-Größe: 1000 Dokumente
- Parallelisierung: max 10 gleichzeitig
- Retry-Logik für fehlgeschlagene Items
`;

        return Response.json({ 
            markdownContent: markdown,
            status: 'success',
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in generateDocumentGenerationDocumentation:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});