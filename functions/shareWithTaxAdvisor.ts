import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { advisor_email, tax_year, countries, data_types = ['all'] } = await req.json();
    // data_types: ['income', 'assets', 'transactions', 'calculations', 'all']

    // Create secure share with Tax Advisor
    const share = await base44.asServiceRole.entities.AdvisorPortal.create({
      user_email: user.email,
      advisor_email,
      access_level: 'view',
      tax_year,
      countries,
      data_types,
      shared_at: new Date().toISOString(),
      expires_in_days: 90,
      status: 'active'
    });

    // Send notification to advisor
    await base44.integrations.Core.SendEmail({
      to: advisor_email,
      subject: `${user.full_name} hat dir Steuerdaten freigegeben (${tax_year})`,
      body: `Du hast Zugriff auf die Steuerdaten von ${user.full_name} für ${tax_year}.
      
Länder: ${countries.join(', ')}
Datentypes: ${data_types.join(', ')}
Zugriff bis: 90 Tage
      
Melde dich an um die Daten zu sehen.`
    });

    // Log activity
    await base44.asServiceRole.entities.ActivityLog.create({
      user_email: user.email,
      action: 'share_with_advisor',
      details: JSON.stringify({
        advisor_email,
        tax_year,
        countries
      }),
      timestamp: new Date().toISOString()
    });

    return Response.json({
      user_email: user.email,
      share_id: share.id,
      advisor_email,
      expires_days: 90,
      status: 'shared'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});