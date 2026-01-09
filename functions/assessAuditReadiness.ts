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
    const documents = await base44.entities.TaxDocument.filter({ user_email: user.email, tax_year });
    const filings = await base44.entities.TaxFiling.filter({ user_email: user.email, tax_year });
    const compliance = await base44.entities.TaxCompliance.filter({ user_email: user.email, tax_year });

    // KI-basierte Audit-Readiness-Bewertung
    const assessment = await base44.integrations.Core.InvokeLLM({
      prompt: `Bewerte die Audit-Bereitschaft für ${user.email} (${tax_year}):

PROFIL:
- Typ: ${profile.profile_type}
- Länder: ${profile.tax_jurisdictions.join(', ')}
- Kryptowährungen: ${profile.has_crypto_assets}
- Grenzüberschreitend: ${profile.cross_border_transactions}

DOKUMENTATION:
- Dokumente: ${documents.length}
- Eingaben: ${filings.length}
- Compliance-Items: ${compliance.length}

PRÜFE AUF:
1. Dokumentenvollständigkeit (90%+ = gut)
2. Fehlerhafte/Widersprüchliche Daten
3. Risikobereiche (Krypto, Beteiligungen, Grenzüberschreitend)
4. Fehlende Begründungen
5. Timing-Probleme
6. Reportable Thresholds überschritten?

GEBE ZURÜCK:
- Audit Readiness Score (0-100)
- Critical Issues (müssen vor Prüfung gelöst werden)
- Dokumentenlücken (prioritätsgeordnet)
- Rekommendierte Maßnahmen
- Estimated Audit Risk (low/medium/high)`,
      response_json_schema: {
        type: "object",
        properties: {
          readiness_score: { type: "number" },
          risk_level: { type: "string", enum: ["low", "medium", "high"] },
          critical_issues: { type: "array", items: { type: "string" } },
          document_gaps: { type: "array", items: { type: "string" } },
          high_risk_areas: { type: "array", items: { type: "string" } },
          recommended_actions: { type: "array", items: { type: "string" } },
          estimated_audit_probability: { type: "number" }
        }
      }
    });

    // Als TaxAuditFile speichern
    await base44.asServiceRole.entities.TaxAuditFile.create({
      user_email: user.email,
      country: profile.tax_jurisdictions[0],
      tax_year,
      audit_type: 'standard_audit',
      audit_notice_date: new Date().toISOString().split('T')[0],
      audit_scope: assessment.high_risk_areas || [],
      supporting_documents: documents.map(d => ({
        document_type: d.document_type,
        file_url: d.file_url,
        uploaded_date: d.uploaded_at
      })),
      readiness_score: assessment.readiness_score,
      status: 'notice_received'
    });

    return Response.json({
      user_email: user.email,
      tax_year,
      assessment
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});