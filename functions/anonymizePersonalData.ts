import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { test_account_ids, anonymization_level = 'full' } = body;

    console.log('Starting anonymization:', { account_count: test_account_ids?.length, level: anonymization_level });

    const anonymized = [];
    const errors = [];

    for (const accountId of test_account_ids || []) {
      try {
        const account = await base44.asServiceRole.entities.TestAccount.filter(
          { id: accountId },
          null,
          1
        );

        if (account.length === 0) continue;

        const accountData = account[0];
        const anonymousId = `Anon_${accountData.id.slice(0, 8)}_${Math.random().toString(36).slice(2, 8)}`;

        // Anonymize personal data
        const updateData = {
          tester_name: anonymousId,
          test_email: `${anonymousId}@anonymous.local`,
          test_password: null,
          metadata: {
            ...accountData.metadata,
            anonymized: true,
            anonymization_date: new Date().toISOString(),
            anonymization_level
          }
        };

        // Full anonymization - remove more personal data
        if (anonymization_level === 'full') {
          updateData.description = null;
        }

        await base44.asServiceRole.entities.TestAccount.update(accountId, updateData);

        // Anonymize activities
        const activities = await base44.asServiceRole.entities.TesterActivity.filter(
          { test_account_id: accountId }
        );

        for (const activity of activities) {
          try {
            await base44.asServiceRole.entities.TesterActivity.update(activity.id, {
              element_text: null,
              user_agent: null,
              metadata: {
                ...activity.metadata,
                anonymized: true
              }
            });
          } catch (err) {
            console.warn(`Could not anonymize activity ${activity.id}:`, err.message);
          }
        }

        anonymized.push({
          original_id: accountId,
          anonymous_id: anonymousId
        });
      } catch (err) {
        errors.push(`Error anonymizing ${accountId}: ${err.message}`);
      }
    }

    console.log('Anonymization complete:', { anonymized: anonymized.length, errors: errors.length });

    return Response.json({
      success: true,
      anonymized_count: anonymized.length,
      mapping_table: anonymized,
      errors
    });
  } catch (error) {
    console.error('Anonymization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});