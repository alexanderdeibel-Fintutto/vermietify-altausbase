import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { problem } = await req.json();

    // Alle Problem-Reports holen
    const allProblems = await base44.asServiceRole.entities.UserProblem.list('-created_date', 500);

    // Ähnlichkeit berechnen
    const similarReports = allProblems
      .filter(p => p.id !== problem.id)
      .map(p => {
        let similarityScore = 0;

        // Gleicher Business-Bereich (40 Punkte)
        if (p.business_area === problem.business_area) similarityScore += 40;

        // Gleicher Problem-Typ (30 Punkte)
        if (p.problem_type === problem.problem_type) similarityScore += 30;

        // Ähnlicher Titel (20 Punkte)
        const titleSimilarity = calculateTextSimilarity(p.problem_titel, problem.problem_titel);
        similarityScore += titleSimilarity * 20;

        // Gleiche Seite/Element (10 Punkte)
        if (p.page_url === problem.page_url) similarityScore += 5;
        if (p.element_selector === problem.element_selector) similarityScore += 5;

        return {
          problem: p,
          similarity_score: similarityScore,
          match_reasons: [
            p.business_area === problem.business_area && 'Gleicher Geschäftsbereich',
            p.problem_type === problem.problem_type && 'Gleicher Problem-Typ',
            p.page_url === problem.page_url && 'Gleiche Seite',
            p.element_selector === problem.element_selector && 'Gleiches Element',
            titleSimilarity > 0.5 && 'Ähnlicher Titel'
          ].filter(Boolean)
        };
      })
      .filter(result => result.similarity_score >= 30)
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, 10);

    return Response.json({
      similar_reports: similarReports,
      count: similarReports.length,
      is_potential_duplicate: similarReports.length > 0 && similarReports[0].similarity_score >= 70
    });

  } catch (error) {
    console.error('Error finding similar reports:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateTextSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  const similarity = (2 * commonWords.length) / (words1.length + words2.length);
  
  return similarity;
}