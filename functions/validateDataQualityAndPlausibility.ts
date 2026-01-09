import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year, country } = await req.json();

    // Gather all user tax data
    const profile = (await base44.entities.TaxProfile.filter(
      { user_email: user.email },
      '-updated_date',
      1
    ))[0];

    const transactions = await base44.entities.CrossBorderTransaction.filter({
      user_email: user.email,
      tax_year
    });

    const crypto = await base44.entities.CryptoHolding.filter({
      user_email: user.email
    });

    const documents = await base44.entities.TaxDocument.filter({
      user_email: user.email,
      tax_year
    });

    // Validate data quality
    const validation = await base44.integrations.Core.InvokeLLM({
      prompt: `Validiere Datenqualität & Plausibilität für komplexes Tax Scenario:

PROFIL:
${JSON.stringify(profile, null, 2)}

TRANSACTIONS (${transactions.length}):
${JSON.stringify(transactions.slice(0, 5), null, 2)}

CRYPTO (${crypto.length}):
${JSON.stringify(crypto.slice(0, 3), null, 2)}

DOCUMENTS: ${documents.length} uploaded

CHECK:
1. Missing Required Fields (für Complexity Level)
2. Data Consistency Issues (z.B. income ≠ transactions)
3. Outliers & Red Flags (unrealistic values)
4. Documentation Completeness
5. Threshold Compliance (CRS, FATCA, AEoI)
6. Internal Contradictions
7. Unusual Patterns

GEBE pro Issue:
- Severity: info, warning, critical
- Field: which data point
- Expected: what should be there
- Current: what is there
- Action: what to do

Fokus auf: Komplexe Multi-Country Cases mit Crypto/GmbH`,
      response_json_schema: {
        type: "object",
        properties: {
          overall_quality_score: { type: "number" },
          completeness_percentage: { type: "number" },
          issues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                severity: { type: "string" },
                issue_type: { type: "string" },
                current_value: { type: "string" },
                expected_value: { type: "string" },
                action_required: { type: "string" }
              }
            }
          },
          is_ready_for_filing: { type: "boolean" },
          missing_documents: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Save validation result
    const compliance = await base44.entities.TaxCompliance.create({
      user_email: user.email,
      country,
      tax_year,
      compliance_type: 'documentation',
      requirement: 'Data Quality Validation',
      description: `Quality Score: ${validation.overall_quality_score}/100, Completeness: ${validation.completeness_percentage}%`,
      status: validation.is_ready_for_filing ? 'completed' : 'at_risk',
      completion_percentage: validation.completeness_percentage,
      risk_flags: validation.issues.filter(i => i.severity === 'critical').map(i => i.field)
    });

    return Response.json({
      user_email: user.email,
      country,
      tax_year,
      quality_score: validation.overall_quality_score,
      completeness: validation.completeness_percentage,
      is_ready_for_filing: validation.is_ready_for_filing,
      critical_issues: validation.issues.filter(i => i.severity === 'critical'),
      compliance_id: compliance.id
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});