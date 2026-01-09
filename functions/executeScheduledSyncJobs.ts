import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Scheduled task that runs periodically to execute all due sync jobs
 * Called by the scheduler every 15 minutes
 */
Deno.serve(async (req) => {
    try {
        console.log('Starting scheduled sync job execution...');

        const base44 = createClientFromRequest(req);

        // Get all active sync jobs
        const syncJobs = await base44.asServiceRole.entities.SyncJob.filter(
            { is_active: true },
            '-updated_date',
            100
        );

        const now = new Date();
        let executedCount = 0;
        let skippedCount = 0;
        const results = [];

        for (const job of syncJobs) {
            try {
                const nextSyncTime = job.next_sync_at ? new Date(job.next_sync_at) : null;

                // Check if job is due for execution
                if (!nextSyncTime || nextSyncTime <= now) {
                    console.log(`Executing sync job: ${job.job_name}`);

                    // Execute the sync job
                    const response = await base44.functions.invoke('executeSyncJob', {
                        sync_job_id: job.id,
                        retry_attempt: 0
                    });

                    results.push({
                        job_id: job.id,
                        job_name: job.job_name,
                        status: response.data.status,
                        synced: response.data.synced
                    });

                    executedCount++;
                } else {
                    skippedCount++;
                }
            } catch (error) {
                console.error(`Error executing sync job ${job.job_name}:`, error);
                results.push({
                    job_id: job.id,
                    job_name: job.job_name,
                    status: 'error',
                    error: error.message
                });
            }
        }

        console.log(`Sync scheduler completed: ${executedCount} executed, ${skippedCount} skipped`);

        return Response.json({
            success: true,
            executed_count: executedCount,
            skipped_count: skippedCount,
            results,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in scheduled sync execution:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});