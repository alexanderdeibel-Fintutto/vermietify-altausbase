import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Nur Admins können automatische Übermittlungen ausführen' }, { status: 403 });
        }

        console.log('[AutoSubmit] Starte automatische ELSTER-Übermittlung...');

        // 1. Hole alle Submissions im Status "ready"
        const readySubmissions = await base44.asServiceRole.entities.ElsterSubmission.filter({
            status: 'ready'
        });

        console.log(`[AutoSubmit] ${readySubmissions.length} bereite Submissions gefunden`);

        if (readySubmissions.length === 0) {
            return Response.json({
                success: true,
                message: 'Keine Submissions bereit zur Übermittlung',
                processed: 0
            });
        }

        const results = {
            total: readySubmissions.length,
            successful: 0,
            failed: 0,
            skipped: 0,
            details: []
        };

        // 2. Verarbeite jede Submission
        for (const submission of readySubmissions) {
            console.log(`[AutoSubmit] Verarbeite Submission ${submission.id}...`);

            try {
                // 2a. Prüfe Zertifikat
                const certificate = await base44.asServiceRole.entities.ElsterCertificate.filter({
                    id: submission.certificate_id
                }, null, 1);

                if (!certificate || certificate.length === 0) {
                    console.log(`[AutoSubmit] Zertifikat nicht gefunden für Submission ${submission.id}`);
                    results.skipped++;
                    results.details.push({
                        submission_id: submission.id,
                        status: 'skipped',
                        reason: 'Zertifikat nicht gefunden'
                    });
                    continue;
                }

                const cert = certificate[0];

                // Prüfe Zertifikat-Gültigkeit
                const now = new Date();
                const validUntil = new Date(cert.valid_until);
                
                if (now > validUntil) {
                    console.log(`[AutoSubmit] Zertifikat abgelaufen für Submission ${submission.id}`);
                    await base44.asServiceRole.entities.ElsterSubmission.update(submission.id, {
                        status: 'error',
                        last_error: 'Zertifikat ist abgelaufen'
                    });
                    results.skipped++;
                    results.details.push({
                        submission_id: submission.id,
                        status: 'skipped',
                        reason: 'Zertifikat abgelaufen'
                    });
                    continue;
                }

                if (cert.status !== 'active') {
                    console.log(`[AutoSubmit] Zertifikat nicht aktiv für Submission ${submission.id}`);
                    results.skipped++;
                    results.details.push({
                        submission_id: submission.id,
                        status: 'skipped',
                        reason: 'Zertifikat nicht aktiv'
                    });
                    continue;
                }

                // 2b. Prüfe ob Tax Return existiert
                const taxReturns = await base44.asServiceRole.entities.TaxReturn.filter({
                    id: submission.tax_return_id
                }, null, 1);

                if (!taxReturns || taxReturns.length === 0) {
                    console.log(`[AutoSubmit] Tax Return nicht gefunden für Submission ${submission.id}`);
                    results.skipped++;
                    results.details.push({
                        submission_id: submission.id,
                        status: 'skipped',
                        reason: 'Steuererklärung nicht gefunden'
                    });
                    continue;
                }

                // 2c. Führe Übermittlung durch
                console.log(`[AutoSubmit] Starte Übermittlung für Submission ${submission.id}...`);
                
                const submitResponse = await base44.asServiceRole.functions.invoke('submitToElster', {
                    submissionId: submission.id,
                    pin: null // PIN wird aus Zertifikat geholt oder ist bereits gespeichert
                });

                if (submitResponse.data?.success) {
                    console.log(`[AutoSubmit] Übermittlung erfolgreich für Submission ${submission.id}`);
                    results.successful++;
                    results.details.push({
                        submission_id: submission.id,
                        status: 'success',
                        transfer_ticket: submitResponse.data.transferTicket
                    });

                    // Sende Erfolgs-Benachrichtigung
                    await base44.asServiceRole.entities.Notification.create({
                        user_email: user.email,
                        type: 'elster_submission_success',
                        title: 'ELSTER-Übermittlung erfolgreich',
                        message: `Steuererklärung ${submission.tax_year} wurde erfolgreich übermittelt. Transferticket: ${submitResponse.data.transferTicket}`,
                        priority: 'normal',
                        is_read: false
                    });

                } else {
                    console.log(`[AutoSubmit] Übermittlung fehlgeschlagen für Submission ${submission.id}: ${submitResponse.data?.error}`);
                    results.failed++;
                    results.details.push({
                        submission_id: submission.id,
                        status: 'failed',
                        error: submitResponse.data?.error || 'Unbekannter Fehler'
                    });

                    // Sende Fehler-Benachrichtigung
                    await base44.asServiceRole.entities.Notification.create({
                        user_email: user.email,
                        type: 'elster_submission_error',
                        title: 'ELSTER-Übermittlung fehlgeschlagen',
                        message: `Fehler bei Steuererklärung ${submission.tax_year}: ${submitResponse.data?.error || 'Unbekannter Fehler'}`,
                        priority: 'high',
                        is_read: false
                    });
                }

            } catch (error) {
                console.error(`[AutoSubmit] Fehler bei Submission ${submission.id}:`, error);
                results.failed++;
                results.details.push({
                    submission_id: submission.id,
                    status: 'failed',
                    error: error.message
                });

                // Sende Fehler-Benachrichtigung
                await base44.asServiceRole.entities.Notification.create({
                    user_email: user.email,
                    type: 'elster_submission_error',
                    title: 'ELSTER-Übermittlung fehlgeschlagen',
                    message: `Technischer Fehler bei Submission ${submission.id}: ${error.message}`,
                    priority: 'high',
                    is_read: false
                });
            }
        }

        console.log('[AutoSubmit] Abgeschlossen:', results);

        // Sende Zusammenfassungs-Benachrichtigung
        if (results.successful > 0 || results.failed > 0) {
            await base44.asServiceRole.entities.Notification.create({
                user_email: user.email,
                type: 'elster_auto_submit_summary',
                title: 'ELSTER Auto-Übermittlung abgeschlossen',
                message: `${results.successful} erfolgreich, ${results.failed} fehlgeschlagen, ${results.skipped} übersprungen`,
                priority: results.failed > 0 ? 'high' : 'normal',
                is_read: false
            });
        }

        return Response.json({
            success: true,
            results
        });

    } catch (error) {
        console.error('[AutoSubmit] Kritischer Fehler:', error);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});