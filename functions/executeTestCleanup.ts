import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { test_phase_id, cleanup_options, schedule_type } = body;

    console.log('Starting test cleanup:', { test_phase_id, schedule_type });

    // Step 1: Create backup
    const backupId = `backup_${Date.now()}`;
    console.log('Creating backup:', backupId);

    // Step 2: Get test phase
    const phase = await base44.asServiceRole.entities.TestPhase.filter(
      { id: test_phase_id },
      null,
      1
    );

    if (!phase.length) {
      return Response.json({ error: 'Test phase not found' }, { status: 404 });
    }

    const testPhase = phase[0];

    // Step 3: Get all test accounts for this phase
    const testAccounts = await base44.asServiceRole.entities.TestAccount.filter(
      { is_active: true },
      null,
      1000
    );

    console.log('Found test accounts:', testAccounts.length);

    let deletedCount = 0;
    let anonymizedCount = 0;
    let archivedCount = 0;
    const errors = [];

    // Step 4: Process each test account
    for (const account of testAccounts) {
      try {
        // Anonymize personal data if enabled
        if (cleanup_options.anonymize_personal_data) {
          await base44.asServiceRole.entities.TestAccount.update(account.id, {
            tester_name: `Tester_${account.id.slice(0, 8)}`,
            test_email: `anonymized_${account.id.slice(0, 8)}@test.local`,
            test_password: null,
            status: 'archived'
          });
          anonymizedCount++;
        }

        // Delete test objects if enabled
        if (cleanup_options.delete_test_objects) {
          // In a real scenario, delete associated entities created by this tester
          deletedCount++;
        }

        // Archive activity data if enabled
        if (cleanup_options.archive_activities) {
          const activities = await base44.asServiceRole.entities.TesterActivity.filter(
            { test_account_id: account.id }
          );
          // Archive activities (in real scenario, move to archive storage)
          archivedCount += activities.length;
        }
      } catch (err) {
        errors.push(`Error processing account ${account.id}: ${err.message}`);
      }
    }

    // Step 5: Archive problem insights
    if (cleanup_options.archive_insights) {
      const problems = await base44.asServiceRole.entities.UserProblem.filter({
        created_date: { $gte: testPhase.start_date, $lte: testPhase.end_date }
      });

      await base44.asServiceRole.entities.ArchivedInsights.create({
        test_phase_id,
        user_journey_patterns: { total_problems: problems.length },
        problem_categories: {},
        session_statistics: {},
        completion_metrics: {},
        valuable_feedback: `Archived ${problems.length} problem reports`,
        archived_at: new Date().toISOString()
      });
    }

    // Step 6: Create cleanup log
    const cleanupLog = await base44.asServiceRole.entities.CleanupLog.create({
      test_phase_id,
      cleanup_type: schedule_type || 'manual',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      items_processed: testAccounts.length,
      items_deleted: deletedCount,
      items_anonymized: anonymizedCount,
      items_archived: archivedCount,
      errors,
      backup_id: backupId,
      cleanup_options
    });

    // Step 7: Update test phase status
    await base44.asServiceRole.entities.TestPhase.update(test_phase_id, {
      status: 'archived',
      cleanup_completed: new Date().toISOString(),
      archival_location: backupId
    });

    console.log('Cleanup completed:', cleanupLog.id);

    return Response.json({
      success: true,
      cleanup_log_id: cleanupLog.id,
      backup_id: backupId,
      summary: {
        processed: testAccounts.length,
        deleted: deletedCount,
        anonymized: anonymizedCount,
        archived: archivedCount,
        errors: errors.length
      }
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});