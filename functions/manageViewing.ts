import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { viewing_id, action } = await req.json();

    if (action === 'send_confirmation') {
      const viewing = await base44.asServiceRole.entities.Viewing.read(viewing_id);
      const applicant = await base44.asServiceRole.entities.Applicant.read(viewing.applicant_id);
      const unit = await base44.asServiceRole.entities.Unit.read(viewing.unit_id);

      await base44.integrations.Core.SendEmail({
        to: applicant.email,
        subject: 'Besichtigungstermin bestätigt',
        body: `Sehr geehrte/r ${applicant.first_name} ${applicant.last_name},

Ihr Besichtigungstermin wurde bestätigt:

Datum: ${new Date(viewing.viewing_date).toLocaleString('de-DE')}
Objekt: ${unit.name || 'Einheit ' + unit.id}
Typ: ${viewing.viewing_type === 'individual' ? 'Einzelbesichtigung' : 'Gruppenbesichtigung'}

Wir freuen uns auf Sie!

Mit freundlichen Grüßen`
      });

      await base44.asServiceRole.entities.Viewing.update(viewing_id, {
        status: 'confirmed'
      });

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});