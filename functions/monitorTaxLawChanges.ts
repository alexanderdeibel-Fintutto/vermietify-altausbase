import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { countries = ['DE', 'CH', 'AT'] } = await req.json();

    // Monitor Tax Law Changes
    const updates = await base44.integrations.Core.InvokeLLM({
      prompt: `Überwache aktuelle Steuergesetzes-Änderungen für ${countries.join(', ')} (2024-2025):

LÄNDER: ${countries.join(', ')}

RELEVANTE BEREICHE:
1. Income Tax Changes
2. Capital Gains Treatment
3. Crypto Regulations
4. International Reporting (FATCA, CRS, AEoI)
5. Business Entity Changes
6. Withholding Tax Adjustments
7. Deduction Limits
8. Filing Deadline Changes

GEBE:
- Neuerungen pro Land
- Gültig ab Datum
- Impact auf User
- Required Actions
- Deadline zum Handeln

FOKUS: DACH-Region + International`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          updates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                country: { type: "string" },
                law_title: { type: "string" },
                effective_date: { type: "string" },
                impact_type: { type: "string" },
                user_impact: { type: "string" },
                action_required: { type: "boolean" },
                severity: { type: "string", enum: ["low", "medium", "high", "critical"] }
              }
            }
          }
        }
      }
    });

    // Erstelle Alerts für relevante User
    const profiles = await base44.asServiceRole.entities.TaxProfile.list();
    
    for (const update of updates.updates || []) {
      for (const profile of profiles) {
        if (profile.tax_jurisdictions.includes(update.country)) {
          await base44.asServiceRole.entities.TaxLawUpdate.create({
            user_email: profile.user_email,
            country: update.country,
            title: update.law_title,
            description: update.user_impact,
            effective_date: update.effective_date,
            severity: update.severity,
            action_required: update.action_required
          });

          if (update.action_required || update.severity === 'critical') {
            await base44.asServiceRole.entities.TaxAlert.create({
              user_email: profile.user_email,
              country: update.country,
              alert_type: 'tax_law_change',
              title: `Neue Steuergesetz: ${update.law_title}`,
              message: update.user_impact,
              severity: update.severity === 'critical' ? 'critical' : 'warning',
              priority: update.severity === 'critical' ? 'critical' : 'high'
            });
          }
        }
      }
    }

    return Response.json({
      updates_found: updates.updates?.length || 0,
      users_affected: profiles.length,
      updates: updates.updates
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});