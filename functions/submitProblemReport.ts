import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { test_account_id, problem_title, problem_description, problem_type, severity, page_url, page_title, screenshot_base64, expected_behavior, actual_behavior, steps_to_reproduce } = await req.json();

    if (!test_account_id || !problem_title || !problem_description) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let screenshot_url = null;

    // Upload screenshot if provided
    if (screenshot_base64) {
      try {
        const buffer = Buffer.from(screenshot_base64.split(',')[1] || screenshot_base64, 'base64');
        const file = new File([buffer], `screenshot_${Date.now()}.png`, { type: 'image/png' });
        const uploadResult = await base44.integrations.Core.UploadFile({ file });
        screenshot_url = uploadResult.file_url;
      } catch (err) {
        console.log('Screenshot upload failed:', err.message);
      }
    }

    // Create problem report
    const problem = await base44.asServiceRole.entities.UserProblem.create({
      test_account_id,
      tester_id: (await base44.auth.me())?.id,
      tester_name: (await base44.auth.me())?.full_name,
      problem_titel: problem_title,
      problem_beschreibung: problem_description,
      problem_type: problem_type || 'functional_bug',
      functional_severity: severity || 'minor_bug',
      page_url: page_url || window?.location?.href,
      page_title: page_title || document?.title,
      screenshot_url,
      expected_behavior,
      actual_behavior,
      steps_to_reproduce: steps_to_reproduce ? steps_to_reproduce.split('\n') : [],
      status: 'open',
      first_reported: new Date().toISOString(),
      browser_info: {
        user_agent: req.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      }
    });

    // Calculate priority
    const priorityRes = await base44.asServiceRole.functions.invoke('calculateIntelligentPriority', {
      problem_type,
      severity,
      test_account_id
    });

    if (priorityRes.data?.priority_score) {
      await base44.asServiceRole.entities.UserProblem.update(problem.id, {
        priority_score: priorityRes.data.priority_score,
        priority_breakdown: priorityRes.data.breakdown
      });
    }

    // Update TestAccount problem count
    const testAccount = await base44.asServiceRole.entities.TestAccount.read(test_account_id);
    await base44.asServiceRole.entities.TestAccount.update(test_account_id, {
      problems_reported: (testAccount.problems_reported || 0) + 1
    });

    // Log activity
    await base44.asServiceRole.functions.invoke('trackTesterActivity', {
      test_account_id,
      activity_type: 'problem_report',
      page_url,
      page_title
    });

    // Send notification to admin
    try {
      await base44.integrations.Core.SendEmail({
        to: 'admin@immoVerwalter.de',
        subject: `🐛 Neuer Problem-Report von Tester: ${problem_title}`,
        body: `Test-Account: ${test_account_id}\nProblem: ${problem_title}\nSeverität: ${severity}\nURL: ${page_url}`
      });
    } catch (err) {
      console.log('Email notification failed:', err.message);
    }

    return Response.json({
      success: true,
      problem_id: problem.id,
      screenshot_url,
      priority_score: priorityRes.data?.priority_score
    });
  } catch (error) {
    console.error('Problem report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});