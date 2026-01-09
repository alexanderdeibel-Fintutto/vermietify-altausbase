import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year, country } = await req.json();

    // Audit Preparation Checklist generieren
    const checklist = await base44.integrations.Core.InvokeLLM({
      prompt: `Erstelle umfassende Audit Preparation Checklist für ${user.email} (${country}, ${tax_year}):

AUDIT READINESS FRAMEWORK:

PRE-AUDIT PHASE:
- Dokumentation Vollständigkeit
- Missing Records Identification
- Inconsistencies Check
- Support-Evidence Gathering

DOCUMENTATION KATEGORIEN:
1. Income Documentation
   - Bank Statements (all accounts)
   - Investment Statements
   - Salary/W-2/1099 docs
   - Foreign Income (if any)

2. Expense Documentation
   - Invoices & Receipts
   - Mileage Logs
   - Medical Records
   - Charitable Receipts

3. Asset Documentation
   - Real Estate Deeds
   - Brokerage Statements
   - Crypto Exchange Reports
   - Loan Documents

4. Cross-Border (if applicable)
   - FBAR (Foreign Bank Account)
   - FATCA Forms
   - 5471 (Foreign Corp)
   - Transfer Pricing docs

GEBE KONKRETE CHECKLIST:`,
      response_json_schema: {
        type: "object",
        properties: {
          country: { type: "string" },
          total_items: { type: "number" },
          phases: {
            type: "array",
            items: {
              type: "object",
              properties: {
                phase_name: { type: "string" },
                items: { type: "array", items: { type: "string" } }
              }
            }
          },
          critical_items: { type: "array", items: { type: "string" } },
          timeline_weeks: { type: "number" },
          estimated_prep_hours: { type: "number" }
        }
      }
    });

    // Speichern als TaxCompliance
    await base44.asServiceRole.entities.TaxCompliance.create({
      user_email: user.email,
      country,
      tax_year,
      compliance_type: 'audit_readiness',
      requirement: 'Audit Preparation Checklist',
      description: JSON.stringify(checklist),
      status: 'pending',
      priority: 'high',
      required_documents: checklist.phases?.flatMap(p => p.items) || [],
      completion_percentage: 0
    });

    return Response.json({
      user_email: user.email,
      country,
      tax_year,
      audit_checklist: checklist
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});