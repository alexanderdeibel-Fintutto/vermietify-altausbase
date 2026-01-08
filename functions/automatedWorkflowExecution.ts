import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin required' }, { status: 403 });
    }

    console.log('[WORKFLOW] Executing automated workflows...');

    // 1. Hole alle aktiven Workflows
    const workflows = await base44.entities.Workflow.filter({
      is_active: true
    });

    let executed = 0;
    let failed = 0;

    for (const workflow of workflows) {
      try {
        // 2. Prüfe Trigger-Bedingungen
        const trigger = workflow.trigger_type; // 'on_transaction', 'on_schedule', 'on_milestone'

        if (trigger === 'on_transaction') {
          // Hole kategorisierte Transaktionen der letzten Stunde
          const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
          const recentTxs = await base44.entities.BankTransaction.filter({
            is_categorized: true,
            updated_date: { $gte: oneHourAgo }
          });

          for (const tx of recentTxs) {
            // 3. Führe Workflow-Steps aus
            for (const step of workflow.steps || []) {
              if (step.action === 'create_invoice') {
                await base44.functions.invoke('createInvoiceAndAllocateTransaction', {
                  transaction_id: tx.id,
                  category: tx.category
                });
              } else if (step.action === 'send_notification') {
                // Log für Admin-Notification
                console.log(`[WORKFLOW] Action: ${step.action}`);
              } else if (step.action === 'link_financial_item') {
                // Verknüpfe mit Forderung
                console.log(`[WORKFLOW] Linking to financial item`);
              }
            }
            executed++;
          }
        }

      } catch (error) {
        console.error(`[WORKFLOW ERROR] ${workflow.id}:`, error.message);
        failed++;
      }
    }

    return Response.json({
      success: true,
      workflows_executed: executed,
      workflows_failed: failed
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});