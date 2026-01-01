import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { parseISO, addMonths, format, isBefore, startOfMonth } from 'npm:date-fns';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { contractId } = body;

        if (!contractId) {
            return Response.json({ error: 'contractId is required' }, { status: 400 });
        }

        const contract = (await base44.asServiceRole.entities.LeaseContract.filter({ id: contractId }))[0];

        if (!contract) {
            return Response.json({ error: 'Contract not found' }, { status: 404 });
        }

        // Get all rent changes for the contract, sorted by effective_date
        const rentChanges = await base44.asServiceRole.entities.RentChange.filter(
            { contract_id: contractId },
            'effective_date'
        );

        // Determine the earliest date from which payments should be regenerated
        const regenerateFromDate = startOfMonth(parseISO(contract.start_date));

        // 1. Delete all existing pending/overdue payments for this contract from regenerateFromDate onwards
        const paymentsToDelete = await base44.asServiceRole.entities.Payment.filter({
            contract_id: contractId,
            payment_month: { $gte: format(regenerateFromDate, 'yyyy-MM') },
            status: { $in: ['pending', 'overdue'] }
        });
        
        let deletedCount = 0;
        for (const payment of paymentsToDelete) {
            await base44.asServiceRole.entities.Payment.delete(payment.id);
            deletedCount++;
        }

        // 2. Re-generate payments
        let currentDate = regenerateFromDate;
        const generationEndDate = contract.end_date ? startOfMonth(parseISO(contract.end_date)) : addMonths(new Date(), 24);
        
        let generatedCount = 0;
        while (isBefore(currentDate, generationEndDate) || format(currentDate, 'yyyy-MM') === format(generationEndDate, 'yyyy-MM')) {
            const paymentMonth = format(currentDate, 'yyyy-MM');
            
            // Find the active rent for the current month
            let activeRent = {
                base_rent: contract.base_rent,
                utilities: contract.utilities || 0,
                heating: contract.heating || 0,
                total_rent: contract.total_rent,
            };

            // Apply all rent changes that are effective for this month
            for (const change of rentChanges) {
                const changeDate = startOfMonth(parseISO(change.effective_date));
                const changeMonth = format(changeDate, 'yyyy-MM');
                
                // If the change is effective in or before the current month, apply it
                if (changeMonth <= paymentMonth) {
                    activeRent = {
                        base_rent: change.base_rent,
                        utilities: change.utilities || 0,
                        heating: change.heating || 0,
                        total_rent: change.total_rent,
                    };
                }
            }

            // Create payment for the current month
            await base44.asServiceRole.entities.Payment.create({
                contract_id: contract.id,
                tenant_id: contract.tenant_id,
                unit_id: contract.unit_id,
                payment_date: currentDate.toISOString().split('T')[0],
                expected_amount: activeRent.total_rent,
                payment_month: paymentMonth,
                payment_type: 'rent',
                status: 'pending',
                reference: `Miete ${paymentMonth}`,
            });
            generatedCount++;

            currentDate = addMonths(currentDate, 1);
        }

        return Response.json({
            success: true,
            message: `Zahlungen neu berechnet: ${deletedCount} gelöscht, ${generatedCount} erstellt`, 
            deletedCount, 
            generatedCount
        });

    } catch (error) {
        console.error('Error recalculating contract payments:', error);
        return Response.json({ error: error.message || 'Fehler bei der Neuberechnung' }, { status: 500 });
    }
});