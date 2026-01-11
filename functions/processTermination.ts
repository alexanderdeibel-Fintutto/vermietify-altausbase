import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { termination_id, action } = await req.json();
    const termination = await base44.asServiceRole.entities.Termination.read(termination_id);

    if (action === 'calculate_dates') {
      const terminationDate = new Date(termination.termination_date);
      const moveOutDate = new Date(terminationDate);
      moveOutDate.setMonth(moveOutDate.getMonth() + termination.notice_period_months);

      await base44.asServiceRole.entities.Termination.update(termination_id, {
        move_out_date: moveOutDate.toISOString().split('T')[0]
      });

      return Response.json({ 
        success: true, 
        move_out_date: moveOutDate.toISOString().split('T')[0] 
      });
    }

    if (action === 'send_confirmation') {
      const tenant = await base44.asServiceRole.entities.Tenant.read(termination.tenant_id);

      await base44.integrations.Core.SendEmail({
        to: tenant.email,
        subject: 'Kündigungsbestätigung',
        body: `Sehr geehrte/r ${tenant.first_name} ${tenant.last_name},

hiermit bestätigen wir den Eingang Ihrer Kündigung vom ${termination.termination_date}.

Kündigungsfrist: ${termination.notice_period_months} Monate
Auszugsdatum: ${termination.move_out_date}

Bitte vereinbaren Sie einen Termin für das Wohnungsübergabeprotokoll.

Mit freundlichen Grüßen`
      });

      await base44.asServiceRole.entities.Termination.update(termination_id, {
        status: 'confirmed'
      });

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});