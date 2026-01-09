import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Execute a scheduled sync job with error handling, retries, and audit logging
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sync_job_id, retry_attempt = 0 } = await req.json();

        // Get sync job
        const syncJobs = await base44.asServiceRole.entities.SyncJob.filter(
            { id: sync_job_id },
            '-updated_date',
            1
        );

        const syncJob = syncJobs[0];
        if (!syncJob) {
            return Response.json({ error: 'Sync job not found' }, { status: 404 });
        }

        if (!syncJob.is_active) {
            return Response.json({ error: 'Sync job is inactive' }, { status: 400 });
        }

        const startTime = Date.now();
        const auditLog = {
            user_email: user.email,
            sync_job_id: syncJob.id,
            job_name: syncJob.job_name,
            sync_type: syncJob.sync_type,
            status: 'pending',
            started_at: new Date().toISOString(),
            retry_attempt,
            errors: [],
            warnings: [],
            transactions_synced: 0,
            accounts_synced: 0,
            crypto_holdings_synced: 0,
            duplicates_detected: 0,
            data_inconsistencies: []
        };

        try {
            // Execute sync based on type
            let bankResult = null;
            let cryptoResult = null;

            if (syncJob.sync_type === 'bank' || syncJob.sync_type === 'all') {
                bankResult = await executeBankSync(base44, user, syncJob, auditLog);
            }

            if (syncJob.sync_type === 'crypto' || syncJob.sync_type === 'all') {
                cryptoResult = await executeCryptoSync(base44, user, syncJob, auditLog);
            }

            // Aggregate results
            if (bankResult) {
                auditLog.transactions_synced += bankResult.transactions_synced || 0;
                auditLog.accounts_synced += bankResult.accounts_synced || 0;
                auditLog.duplicates_detected += bankResult.duplicates_detected || 0;
                if (bankResult.errors) auditLog.errors.push(...bankResult.errors);
                if (bankResult.warnings) auditLog.warnings.push(...bankResult.warnings);
            }

            if (cryptoResult) {
                auditLog.crypto_holdings_synced += cryptoResult.crypto_holdings_synced || 0;
                if (cryptoResult.errors) auditLog.errors.push(...cryptoResult.errors);
                if (cryptoResult.warnings) auditLog.warnings.push(...cryptoResult.warnings);
            }

            // Determine overall status
            if (auditLog.errors.length === 0) {
                auditLog.status = 'success';
            } else if (auditLog.transactions_synced > 0 || auditLog.accounts_synced > 0 || auditLog.crypto_holdings_synced > 0) {
                auditLog.status = 'partial';
            } else {
                auditLog.status = 'failed';
            }

        } catch (error) {
            auditLog.status = 'failed';
            auditLog.errors.push({
                error_code: 'SYNC_EXECUTION_ERROR',
                error_message: error.message,
                source: 'executor',
                timestamp: new Date().toISOString()
            });

            // Handle retries
            if (syncJob.retry_on_failure && retry_attempt < syncJob.max_retries) {
                const nextRetryTime = new Date(Date.now() + syncJob.retry_interval_minutes * 60 * 1000);
                auditLog.next_retry_at = nextRetryTime.toISOString();
            }
        }

        // Complete audit log
        auditLog.completed_at = new Date().toISOString();
        auditLog.duration_seconds = Math.round((Date.now() - startTime) / 1000);

        // Save audit log
        const savedLog = await base44.asServiceRole.entities.SyncAuditLog.create(auditLog)
            .catch(err => {
                console.error('Failed to save audit log:', err);
                return null;
            });

        // Update sync job
        await base44.asServiceRole.entities.SyncJob.update(syncJob.id, {
            last_sync_at: new Date().toISOString(),
            last_sync_status: auditLog.status,
            last_sync_error: auditLog.errors.length > 0 ? auditLog.errors[0].error_message : null,
            next_sync_at: calculateNextSyncTime(syncJob),
            sync_count: syncJob.sync_count + (auditLog.status === 'success' ? 1 : 0),
            failure_count: syncJob.failure_count + (auditLog.status === 'failed' ? 1 : 0),
            consecutive_failures: auditLog.status === 'failed' ? (syncJob.consecutive_failures || 0) + 1 : 0
        }).catch(err => console.error('Failed to update sync job:', err));

        // Send notification if configured and failed
        if ((auditLog.status === 'failed' || auditLog.status === 'partial') && syncJob.notify_on_failure) {
            await sendSyncNotification(base44, user, syncJob, auditLog)
                .catch(err => console.error('Failed to send notification:', err));
        }

        return Response.json({
            success: true,
            audit_log_id: savedLog?.id,
            status: auditLog.status,
            duration_seconds: auditLog.duration_seconds,
            synced: {
                transactions: auditLog.transactions_synced,
                accounts: auditLog.accounts_synced,
                crypto: auditLog.crypto_holdings_synced
            },
            errors: auditLog.errors
        });

    } catch (error) {
        console.error('Error executing sync job:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

async function executeBankSync(base44, user, syncJob, auditLog) {
    try {
        const response = await base44.functions.invoke('syncFinancialDataFromBanks', {
            action: 'sync'
        });

        if (!response.data.success) {
            return {
                errors: [{ error_code: 'BANK_SYNC_FAILED', error_message: response.data.error, source: 'bank' }]
            };
        }

        return {
            transactions_synced: response.data.transactions_synced || 0,
            accounts_synced: response.data.accounts_synced || 0,
            duplicates_detected: 0
        };
    } catch (error) {
        return {
            errors: [{ error_code: 'BANK_SYNC_ERROR', error_message: error.message, source: 'bank' }]
        };
    }
}

async function executeCryptoSync(base44, user, syncJob, auditLog) {
    try {
        const response = await base44.functions.invoke('syncCryptoExchangeData', {
            wallet_addresses: syncJob.metadata?.wallet_addresses || [],
            exchange_api_keys: syncJob.metadata?.exchange_api_keys || [],
            crypto_assets: syncJob.metadata?.crypto_assets || []
        });

        if (!response.data.success) {
            return {
                errors: [{ error_code: 'CRYPTO_SYNC_FAILED', error_message: response.data.error, source: 'crypto' }]
            };
        }

        return {
            crypto_holdings_synced: response.data.holdings_synced || 0
        };
    } catch (error) {
        return {
            errors: [{ error_code: 'CRYPTO_SYNC_ERROR', error_message: error.message, source: 'crypto' }]
        };
    }
}

async function sendSyncNotification(base44, user, syncJob, auditLog) {
    try {
        await base44.integrations.Core.SendEmail({
            to: user.email,
            subject: `Sync-Fehler: ${syncJob.job_name}`,
            body: `
Automatische Synchronisierung: ${syncJob.job_name}
Status: ${auditLog.status.toUpperCase()}
Fehler: ${auditLog.errors.length}

Details:
${auditLog.errors.map(e => `- ${e.error_message}`).join('\n')}

Bitte überprüfen Sie die Sync-Einstellungen oder versuchen Sie es später erneut.

Audit Log ID: ${auditLog.sync_job_id}
Zeitstempel: ${auditLog.started_at}
            `
        });

        return true;
    } catch (error) {
        console.warn('Failed to send notification:', error);
        return false;
    }
}

function calculateNextSyncTime(syncJob) {
    const now = new Date();
    const next = new Date(now);

    switch (syncJob.frequency) {
        case 'hourly':
            next.setHours(next.getHours() + 1);
            break;
        case 'daily':
            next.setDate(next.getDate() + 1);
            if (syncJob.schedule_time) {
                const [hours, minutes] = syncJob.schedule_time.split(':');
                next.setHours(parseInt(hours), parseInt(minutes), 0);
            }
            break;
        case 'weekly':
            next.setDate(next.getDate() + 7);
            break;
        case 'monthly':
            next.setMonth(next.getMonth() + 1);
            break;
    }

    return next.toISOString();
}