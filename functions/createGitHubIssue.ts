import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { problem_id } = await req.json();

    // Problem laden
    const problems = await base44.asServiceRole.entities.UserProblem.filter({ id: problem_id });
    if (problems.length === 0) {
      return Response.json({ error: 'Problem not found' }, { status: 404 });
    }
    const problem = problems[0];

    // GitHub Issue Body erstellen
    const issueBody = `
## Problem Report #${problem.id.substring(0, 8)}

**Reported by:** ${problem.tester_name || problem.created_by}
**Date:** ${new Date(problem.created_date).toLocaleString('de-DE')}

### Description
${problem.problem_beschreibung}

### Type
- **Category:** ${problem.problem_type}
- **Business Area:** ${problem.business_area}
- **Priority:** ${problem.business_priority || 'Not calculated'}

### Impact
- **Functional Severity:** ${problem.functional_severity || 'N/A'}
- **UX Severity:** ${problem.ux_severity || 'N/A'}
- **Business Impact:** ${problem.business_impact || 'N/A'}

### User Journey
- **Stage:** ${problem.user_journey_stage || 'N/A'}
- **Affected Users:** ${problem.affected_user_count_estimate || 'N/A'}

### Technical Details
${problem.expected_behavior ? `**Expected:** ${problem.expected_behavior}\n` : ''}
${problem.actual_behavior ? `**Actual:** ${problem.actual_behavior}\n` : ''}

${problem.steps_to_reproduce?.length > 0 ? `### Steps to Reproduce\n${problem.steps_to_reproduce.map((s, i) => `${i + 1}. ${s}`).join('\n')}` : ''}

${problem.page_url ? `\n**Page URL:** ${problem.page_url}` : ''}
${problem.screenshot_url ? `\n**Screenshot:** ${problem.screenshot_url}` : ''}

---
*Auto-generated from Tester-Collaboration-System*
`;

    // GitHub Issue erstellen (würde GitHub API Key benötigen)
    const githubToken = Deno.env.get('GITHUB_TOKEN');
    const githubRepo = Deno.env.get('GITHUB_REPO'); // Format: "owner/repo"

    if (!githubToken || !githubRepo) {
      return Response.json({ 
        error: 'GitHub not configured. Please set GITHUB_TOKEN and GITHUB_REPO secrets.',
        issue_body: issueBody 
      }, { status: 400 });
    }

    // GitHub API Call
    const githubResponse = await fetch(`https://api.github.com/repos/${githubRepo}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: problem.problem_titel,
        body: issueBody,
        labels: [
          problem.business_priority === 'p1_critical' ? 'critical' : 
          problem.business_priority === 'p2_high' ? 'high-priority' : 'bug',
          problem.business_area,
          problem.problem_type
        ].filter(Boolean)
      })
    });

    if (!githubResponse.ok) {
      const error = await githubResponse.text();
      return Response.json({ error: 'GitHub API error', details: error }, { status: 500 });
    }

    const githubIssue = await githubResponse.json();

    // Problem mit GitHub URL aktualisieren
    await base44.asServiceRole.entities.UserProblem.update(problem_id, {
      github_issue_url: githubIssue.html_url
    });

    return Response.json({
      success: true,
      github_url: githubIssue.html_url,
      issue_number: githubIssue.number
    });

  } catch (error) {
    console.error('Error creating GitHub issue:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});