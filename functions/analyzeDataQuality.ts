import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[DATA-QUALITY] Analyzing submission data quality');

    const submissions = await base44.entities.ElsterSubmission.list('-created_date', 500);

    const analysis = {
      total_submissions: submissions.length,
      completeness: { score: 0, issues: [] },
      consistency: { score: 0, issues: [] },
      accuracy: { score: 0, issues: [] },
      timeliness: { score: 0, issues: [] },
      overall_score: 0
    };

    // Completeness Check
    let completeCount = 0;
    submissions.forEach(sub => {
      const hasRequired = sub.tax_year && sub.tax_form_type && sub.legal_form && sub.status;
      const hasFormData = sub.form_data && Object.keys(sub.form_data).length > 0;
      
      if (hasRequired && hasFormData) {
        completeCount++;
      } else {
        analysis.completeness.issues.push({
          submission_id: sub.id,
          missing: !hasRequired ? 'required_fields' : 'form_data'
        });
      }
    });
    analysis.completeness.score = Math.round((completeCount / submissions.length) * 100);

    // Consistency Check
    let consistentCount = 0;
    submissions.forEach(sub => {
      let isConsistent = true;
      
      if (sub.status === 'ACCEPTED' && !sub.elster_response) {
        isConsistent = false;
        analysis.consistency.issues.push({
          submission_id: sub.id,
          issue: 'accepted_without_response'
        });
      }

      if (sub.xml_data && !sub.form_data) {
        isConsistent = false;
        analysis.consistency.issues.push({
          submission_id: sub.id,
          issue: 'xml_without_form_data'
        });
      }

      if (isConsistent) consistentCount++;
    });
    analysis.consistency.score = Math.round((consistentCount / submissions.length) * 100);

    // Accuracy Check
    const withConfidence = submissions.filter(s => s.ai_confidence_score);
    if (withConfidence.length > 0) {
      const avgConfidence = withConfidence.reduce((sum, s) => sum + s.ai_confidence_score, 0) / withConfidence.length;
      analysis.accuracy.score = Math.round(avgConfidence);
      
      withConfidence.forEach(sub => {
        if (sub.ai_confidence_score < 70) {
          analysis.accuracy.issues.push({
            submission_id: sub.id,
            confidence: sub.ai_confidence_score
          });
        }
      });
    }

    // Timeliness Check
    const now = Date.now();
    let timelyCount = 0;
    submissions.forEach(sub => {
      const age = now - new Date(sub.created_date).getTime();
      const daysSinceCreated = age / (1000 * 60 * 60 * 24);
      
      if (sub.status === 'DRAFT' && daysSinceCreated > 30) {
        analysis.timeliness.issues.push({
          submission_id: sub.id,
          days_old: Math.round(daysSinceCreated)
        });
      } else {
        timelyCount++;
      }
    });
    analysis.timeliness.score = Math.round((timelyCount / submissions.length) * 100);

    // Overall Score
    analysis.overall_score = Math.round(
      (analysis.completeness.score + analysis.consistency.score + 
       analysis.accuracy.score + analysis.timeliness.score) / 4
    );

    return Response.json({ success: true, analysis });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});