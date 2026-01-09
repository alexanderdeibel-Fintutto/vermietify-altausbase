import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year } = await req.json();
    const profile = (await base44.entities.TaxProfile.filter({ user_email: user.email }, '-updated_date', 1))[0];

    const complianceChecks = [];

    // Pro Land Compliance prüfen
    for (const country of profile.tax_jurisdictions) {
      const filings = await base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year });
      const documents = await base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year });

      // KI-Compliance Check
      const check = await base44.integrations.Core.InvokeLLM({
        prompt: `Führe Compliance-Check für ${country} (${tax_year}) durch.

Status:
- Filings: ${filings.length}
- Dokumente: ${documents.length}
- Profil: ${profile.profile_type}

Prüfe auf:
- Einreichungsfristen
- Dokumentenvollständigkeit
- Meldepflichten (CRS/FATCA/AEoI)
- Risikogebiete
- Fehlende Unterlagen`,
        response_json_schema: {
          type: "object",
          properties: {
            country: { type: "string" },
            compliance_score: { type: "number" },
            status: { type: "string", enum: ["compliant", "at_risk", "critical"] },
            issues: { type: "array", items: { type: "string" } },
            required_actions: { type: "array", items: { type: "string" } }
          }
        }
      });

      complianceChecks.push(check);

      // Alerts erstellen
      if (check.status !== 'compliant') {
        await base44.asServiceRole.entities.TaxAlert.bulkCreate(check.issues.map(issue => ({
          user_email: user.email,
          country,
          alert_type: check.status === 'critical' ? 'compliance_issue' : 'action_required',
          title: `${country}: Compliance-Problem`,
          message: issue,
          severity: check.status === 'critical' ? 'critical' : 'warning',
          related_deadline: new Date().toISOString().split('T')[0]
        })));
      }
    }

    return Response.json({
      user_email: user.email,
      tax_year,
      compliance_checks: complianceChecks,
      overall_status: complianceChecks.every(c => c.status === 'compliant') ? 'compliant' : 'issues_detected'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});