import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { documentId, extractedData } = await req.json();

        console.log(`Processing termination document ${documentId} for user ${user.email}`);

        // 1. Extract contract and tenant information
        const contract = await base44.entities.LeaseContract.read(extractedData.contractId);
        const tenant = await base44.entities.Tenant.read(contract.tenant_id);

        // 2. Calculate move-out date based on notice period
        const receivedDate = new Date(extractedData.receivedDate);
        const requestedMoveOutDate = new Date(extractedData.requestedMoveOutDate);
        const noticePeriodMonths = contract.notice_period_months || 3;
        
        // Calculate the correct move-out date (end of month after notice period)
        const calculatedMoveOut = new Date(receivedDate);
        calculatedMoveOut.setMonth(calculatedMoveOut.getMonth() + noticePeriodMonths + 1);
        calculatedMoveOut.setDate(0); // Last day of previous month

        // 3. Check if notice period is correct
        const daysDifference = Math.floor((requestedMoveOutDate - calculatedMoveOut) / (1000 * 60 * 60 * 24));
        const isNoticePeriodCorrect = daysDifference >= 0;

        // 4. Create Termination record
        const termination = await base44.entities.Termination.create({
            contract_id: contract.id,
            tenant_id: tenant.id,
            company_id: contract.company_id || user.email,
            document_id: documentId,
            received_date: extractedData.receivedDate,
            termination_date: extractedData.terminationDate,
            requested_move_out_date: extractedData.requestedMoveOutDate,
            calculated_move_out_date: calculatedMoveOut.toISOString().split('T')[0],
            move_out_date: isNoticePeriodCorrect ? extractedData.requestedMoveOutDate : calculatedMoveOut.toISOString().split('T')[0],
            notice_period_months: noticePeriodMonths,
            is_notice_period_correct: isNoticePeriodCorrect,
            notice_period_discrepancy_days: daysDifference,
            initiated_by: extractedData.initiatedBy || 'tenant',
            status: 'received',
            automated_checks_completed: true
        });

        // 5. Determine response type
        let responseType = 'confirmation';
        let responseOptions = [];

        if (!isNoticePeriodCorrect) {
            responseType = 'correction_notice_period';
            responseOptions = [
                {
                    id: 'send_correction',
                    label: 'Eingangsbestätigung mit Hinweis auf korrekte Kündigungsfrist senden',
                    template: 'termination_correction',
                    correctMoveOutDate: calculatedMoveOut.toISOString().split('T')[0]
                },
                {
                    id: 'accept_early',
                    label: 'Frühere Kündigung akzeptieren (kulant)',
                    template: 'termination_confirmation',
                    acceptedMoveOutDate: extractedData.requestedMoveOutDate
                }
            ];
        } else {
            responseOptions = [
                {
                    id: 'send_confirmation',
                    label: 'Kündigungsbestätigung senden',
                    template: 'termination_confirmation',
                    moveOutDate: extractedData.requestedMoveOutDate
                }
            ];
        }

        // 6. Get tenant communication preferences
        const commPrefs = tenant.communication_preferences || {
            primary_method: 'email',
            secondary_method: 'in_app',
            allow_email: true,
            allow_in_app: true
        };

        return Response.json({
            success: true,
            termination,
            analysis: {
                isNoticePeriodCorrect,
                requestedMoveOutDate: extractedData.requestedMoveOutDate,
                calculatedMoveOutDate: calculatedMoveOut.toISOString().split('T')[0],
                discrepancyDays: daysDifference,
                noticePeriodMonths
            },
            responseType,
            responseOptions,
            communicationPreferences: commPrefs,
            tenant: {
                id: tenant.id,
                name: `${tenant.first_name} ${tenant.last_name}`,
                email: tenant.email,
                phone: tenant.phone
            }
        });

    } catch (error) {
        console.error('Error processing termination:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});