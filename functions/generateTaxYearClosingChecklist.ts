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

    // KI-generierte Year-End Checklist
    const checklist = await base44.integrations.Core.InvokeLLM({
      prompt: `Erstelle eine umfassende Year-End Tax Checklist für ${user.email} (${tax_year}):

SITUATION:
- Länder: ${profile.tax_jurisdictions.join(', ')}
- Profil: ${profile.profile_type}
- Kryptowährungen: ${profile.has_crypto_assets}
- Grenzüberschreitend: ${profile.cross_border_transactions}
- Immobilien: ${profile.number_of_properties}
- Firmen: ${profile.number_of_companies}

MUST-HAVES:
1. Dokumentensammlung & Archivierung
2. Datenvalidierung & Reconciliation
3. Formularfüllung & Review
4. Tax Planning für nächstes Jahr
5. Compliance-Checks
6. Electronic filing Setup

GEBE STRUKTURIERT FÜR JEDES LAND:
- Pre-filing Checklist (bis 31.12)
- Filing Period Checklist (01.01-Deadline)
- Post-filing Tasks
- Mit Prioritäten und Verantwortlichen`,
      response_json_schema: {
        type: "object",
        properties: {
          year_end_checklist: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                items: { type: "array", items: { type: "string" } },
                deadline: { type: "string" },
                priority: { type: "string" }
              }
            }
          },
          country_specific: { type: "object", additionalProperties: { type: "array" } },
          estimated_timeline_days: { type: "number" },
          critical_deadlines: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      tax_year,
      checklist
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});