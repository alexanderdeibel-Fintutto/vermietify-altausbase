import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { applicant_id, action } = await req.json();
    const applicant = await base44.asServiceRole.entities.Applicant.read(applicant_id);

    if (action === 'calculate_score') {
      const unit = await base44.asServiceRole.entities.Unit.read(applicant.unit_id);
      const incomeRatio = applicant.monthly_income / unit.rent;

      let score = 0;
      if (incomeRatio >= 3) score += 40;
      else if (incomeRatio >= 2.5) score += 30;
      else if (incomeRatio >= 2) score += 20;

      if (applicant.documents?.length >= 3) score += 20;
      if (applicant.schufa_status === 'approved') score += 30;
      if (applicant.current_residence) score += 10;

      await base44.asServiceRole.entities.Applicant.update(applicant_id, {
        credit_score: score,
        status: score >= 60 ? 'approved' : 'screening'
      });

      return Response.json({ success: true, credit_score: score });
    }

    if (action === 'send_application_confirmation') {
      await base44.integrations.Core.SendEmail({
        to: applicant.email,
        subject: 'Bewerbungseingang bestätigt',
        body: `Sehr geehrte/r ${applicant.first_name} ${applicant.last_name},

vielen Dank für Ihre Bewerbung. Wir haben Ihre Unterlagen erhalten und werden uns in Kürze bei Ihnen melden.

Mit freundlichen Grüßen`
      });

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});