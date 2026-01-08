import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const calculateLevenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

const calculateLevenshteinSimilarity = (str1, str2) => {
  const distance = calculateLevenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return ((maxLength - distance) / maxLength) * 100;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report_id } = await req.json();

    const newReport = await base44.entities.UserProblem.filter({ id: report_id });
    if (!newReport || newReport.length === 0) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    const report = newReport[0];
    const allReports = await base44.asServiceRole.entities.UserProblem.list();

    const similarities = allReports
      .filter(r => r.id !== report.id)
      .map(existingReport => {
        let similarityScore = 0;
        const reasons = [];

        if (report.element_selector && report.element_selector === existingReport.element_selector) {
          similarityScore += 60;
          reasons.push("Gleiches UI-Element");
        }

        if (report.page_url && report.page_url === existingReport.page_url && 
            report.problem_type === existingReport.problem_type) {
          similarityScore += 40;
          reasons.push("Gleiche Seite + Problem-Typ");
        }

        if (report.business_area && report.business_area === existingReport.business_area) {
          similarityScore += 25;
          reasons.push("Gleicher Business-Bereich");
        }

        if (report.problem_titel && existingReport.problem_titel) {
          const titleSimilarity = calculateLevenshteinSimilarity(
            report.problem_titel, 
            existingReport.problem_titel
          );
          if (titleSimilarity > 70) {
            similarityScore += 30;
            reasons.push(`Ähnlicher Titel (${Math.round(titleSimilarity)}%)`);
          }
        }

        if (report.functional_severity && report.functional_severity === existingReport.functional_severity) {
          similarityScore += 15;
          reasons.push("Gleiche funktionale Schwere");
        }

        return {
          report_id: existingReport.id,
          report_title: existingReport.problem_titel,
          similarity_score: similarityScore,
          similarity_reasons: reasons
        };
      })
      .filter(s => s.similarity_score >= 50)
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, 5);

    if (similarities.length > 0) {
      await base44.asServiceRole.entities.UserProblem.update(report_id, {
        related_reports: similarities.map(s => s.report_id)
      });
    }

    return Response.json({ similarities });

  } catch (error) {
    console.error('Error finding similar reports:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});