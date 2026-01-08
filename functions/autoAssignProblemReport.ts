import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { problem_id } = await req.json();

    // Problem laden
    const problems = await base44.asServiceRole.entities.UserProblem.filter({ id: problem_id });
    if (problems.length === 0) {
      return Response.json({ error: 'Problem not found' }, { status: 404 });
    }
    const problem = problems[0];

    // Alle User mit Entwickler-Rolle holen
    const allUsers = await base44.asServiceRole.entities.User.list();
    const developers = allUsers.filter(u => u.role === 'admin' || u.is_developer);

    if (developers.length === 0) {
      return Response.json({ 
        assigned_to: null,
        reason: 'Keine Entwickler verfügbar'
      });
    }

    // Workload für jeden Entwickler berechnen
    const allProblems = await base44.asServiceRole.entities.UserProblem.filter({
      status: ['open', 'in_progress']
    });

    const developerWorkload = developers.map(dev => {
      const assignedProblems = allProblems.filter(p => p.assigned_to === dev.id);
      const totalPriority = assignedProblems.reduce((sum, p) => sum + (p.priority_score || 0), 0);
      
      return {
        developer: dev,
        assigned_count: assignedProblems.length,
        total_priority: totalPriority,
        workload_score: assignedProblems.length * 100 + totalPriority
      };
    });

    // Spezialisierung berücksichtigen
    let bestMatch = null;
    let bestScore = Infinity;

    for (const devWorkload of developerWorkload) {
      let score = devWorkload.workload_score;

      // Spezialisierung Bonus
      if (devWorkload.developer.specialization?.includes(problem.business_area)) {
        score -= 200; // Bevorzuge Spezialisten
      }

      // Erfahrung mit ähnlichen Problemen
      const similarHandled = allProblems.filter(p => 
        p.assigned_to === devWorkload.developer.id &&
        p.business_area === problem.business_area &&
        p.status === 'resolved'
      ).length;
      score -= similarHandled * 50;

      if (score < bestScore) {
        bestScore = score;
        bestMatch = devWorkload.developer;
      }
    }

    // Problem zuweisen
    await base44.asServiceRole.entities.UserProblem.update(problem_id, {
      assigned_to: bestMatch.id,
      status: 'triaged'
    });

    return Response.json({
      assigned_to: bestMatch.id,
      assigned_to_name: bestMatch.full_name || bestMatch.email,
      reason: `Beste Verfügbarkeit (Workload: ${developerWorkload.find(d => d.developer.id === bestMatch.id).assigned_count} offene Issues)`,
      workload_before: developerWorkload.find(d => d.developer.id === bestMatch.id).assigned_count
    });

  } catch (error) {
    console.error('Error auto-assigning problem:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});