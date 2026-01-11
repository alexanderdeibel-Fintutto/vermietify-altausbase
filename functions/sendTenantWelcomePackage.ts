import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tenant_id, contract_id } = await req.json();
    const tenant = await base44.asServiceRole.entities.Tenant.read(tenant_id);
    const contract = await base44.asServiceRole.entities.LeaseContract.read(contract_id);

    // Create onboarding workflow
    const onboarding = await base44.asServiceRole.entities.OnboardingWorkflow.create({
      tenant_id,
      company_id: tenant.company_id,
      steps: [
        { name: 'portal_login', completed: false },
        { name: 'profile_complete', completed: false },
        { name: 'documents_uploaded', completed: false },
        { name: 'payment_setup', completed: false },
        { name: 'welcome_tour', completed: false }
      ],
      status: 'in_progress'
    });

    // Create welcome documents
    const welcomeDoc = await base44.asServiceRole.entities.Document.create({
      company_id: tenant.company_id,
      name: 'Willkommenspaket',
      content: `Willkommen in Ihrer neuen Wohnung!

Wichtige Informationen:
- Mietbeginn: ${contract.start_date}
- Monatliche Miete: ${contract.monthly_rent}€
- Hausordnung beachten
- Müllentsorgungszeiten

Ihr Zugang zum Mieterportal wurde freigeschaltet.`,
      type: 'info',
      tags: ['onboarding', 'willkommen']
    });

    await base44.asServiceRole.entities.DocumentPermission.create({
      document_id: welcomeDoc.id,
      user_email: tenant.email,
      permission: 'view'
    });

    // Send welcome email
    await base44.integrations.Core.SendEmail({
      to: tenant.email,
      subject: '🏡 Willkommen in Ihrer neuen Wohnung!',
      body: `Sehr geehrte/r ${tenant.first_name} ${tenant.last_name},

herzlich willkommen in Ihrer neuen Wohnung!

Ihr Mieterportal ist jetzt aktiviert. Dort finden Sie:
✓ Ihren Mietvertrag und wichtige Dokumente
✓ Kontaktmöglichkeiten für Anfragen
✓ Übersicht Ihrer Zahlungen
✓ Möglichkeit zur Schadensmeldung

Einzugsdatum: ${contract.start_date}

Wir wünschen Ihnen einen guten Start!

Mit freundlichen Grüßen`
    });

    return Response.json({ 
      success: true, 
      onboarding_id: onboarding.id 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});