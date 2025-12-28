import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { addMonths, format, parseISO, isBefore, setDate, startOfMonth, getDaysInMonth, getDate } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { contractId } = await req.json();

        if (!contractId) {
            return Response.json({ error: 'contractId is required' }, { status: 400 });
        }

        // Fetch contract and rent changes
        const contracts = await base44.asServiceRole.entities.LeaseContract.filter({ id: contractId });
        if (!contracts || contracts.length === 0) {
            return Response.json({ error: 'Contract not found' }, { status: 404 });
        }

        const contract = contracts[0];
        const rentChanges = await base44.asServiceRole.entities.RentChange.filter({ 
            contract_id: contractId 
        });

        // Fetch ALL existing payments for this contract once
        const existingPayments = await base44.asServiceRole.entities.Payment.filter({
            contract_id: contractId
        });

        const startDate = parseISO(contract.start_date);
        const endDate = contract.end_date ? parseISO(contract.end_date) : addMonths(new Date(), 24);
        const sortedChanges = [...rentChanges].sort((a, b) => 
            new Date(b.effective_date) - new Date(a.effective_date)
        );

        // Build map of expected payments
        const expectedPayments = new Map();
        let currentDate = startOfMonth(startDate);

        // Generate expected rent payments
        while (isBefore(currentDate, endDate) || format(currentDate, 'yyyy-MM') === format(endDate, 'yyyy-MM')) {
            const paymentMonth = format(currentDate, 'yyyy-MM');
            
            const applicableChange = sortedChanges.find(change => 
                isBefore(parseISO(change.effective_date), currentDate) || 
                format(parseISO(change.effective_date), 'yyyy-MM') === paymentMonth
            );

            const baseRent = applicableChange ? applicableChange.base_rent : contract.base_rent;
            const utilities = applicableChange ? (applicableChange.utilities || 0) : (contract.utilities || 0);
            const heating = applicableChange ? (applicableChange.heating || 0) : (contract.heating || 0);
            const totalRent = baseRent + utilities + heating;

            let dueDate = startOfMonth(currentDate);
            if (contract.rent_due_day) {
                try {
                    dueDate = setDate(dueDate, contract.rent_due_day);
                } catch (e) {
                    dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                }
            }

            expectedPayments.set(`rent-${paymentMonth}`, {
                contract_id: contract.id,
                tenant_id: contract.tenant_id,
                unit_id: contract.unit_id,
                payment_month: paymentMonth,
                payment_date: format(dueDate, 'yyyy-MM-dd'),
                expected_amount: totalRent,
                amount: 0,
                payment_type: 'rent',
                status: 'pending',
                reference: `Miete ${paymentMonth}`
            });
            
            currentDate = addMonths(currentDate, 1);
        }

        // Generate expected deposit payments
        if (contract.deposit && contract.deposit > 0) {
            const installments = contract.deposit_installments || 1;
            const installmentAmount = contract.deposit / installments;
            const firstDueDate = contract.contract_date ? parseISO(contract.contract_date) : startDate;

            for (let i = 0; i < installments; i++) {
                let dueDate;
                if (i === 0) {
                    dueDate = firstDueDate;
                } else {
                    let monthDate = addMonths(firstDueDate, i);
                    if (contract.rent_due_day) {
                        try {
                            dueDate = setDate(monthDate, contract.rent_due_day);
                        } catch (e) {
                            dueDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
                        }
                    } else {
                        dueDate = monthDate;
                    }
                }
                
                const paymentMonth = format(dueDate, 'yyyy-MM');
                expectedPayments.set(`deposit-${paymentMonth}-${i}`, {
                    contract_id: contract.id,
                    tenant_id: contract.tenant_id,
                    unit_id: contract.unit_id,
                    payment_month: paymentMonth,
                    payment_date: format(dueDate, 'yyyy-MM-dd'),
                    expected_amount: installmentAmount,
                    amount: 0,
                    payment_type: 'deposit',
                    status: 'pending',
                    reference: `Kaution ${i + 1}/${installments}`
                });
            }
        }

        // Analyze existing vs expected
        const paymentsToCreate = [];
        const paymentsToUpdate = [];
        const paymentsToDelete = [];

        // Check which payments need to be created or updated
        for (const [key, expectedPayment] of expectedPayments) {
            const existing = existingPayments.find(p => 
                p.payment_month === expectedPayment.payment_month && 
                p.payment_type === expectedPayment.payment_type &&
                (p.status === 'pending' || p.status === 'partial')
            );

            if (!existing) {
                paymentsToCreate.push(expectedPayment);
            } else if (
                existing.expected_amount !== expectedPayment.expected_amount ||
                existing.payment_date !== expectedPayment.payment_date
            ) {
                paymentsToUpdate.push({
                    id: existing.id,
                    expected_amount: expectedPayment.expected_amount,
                    payment_date: expectedPayment.payment_date
                });
            }
        }

        // Check which payments need to be deleted (pending/partial that are not expected)
        for (const existing of existingPayments) {
            if (existing.status !== 'pending' && existing.status !== 'partial') {
                continue; // Don't delete paid payments
            }

            const key = `${existing.payment_type}-${existing.payment_month}`;
            const isExpected = Array.from(expectedPayments.keys()).some(k => k.startsWith(key));
            
            if (!isExpected) {
                paymentsToDelete.push(existing.id);
            }
        }

        // Execute operations
        let created = 0, updated = 0, deleted = 0;

        // Create new payments in batches
        if (paymentsToCreate.length > 0) {
            const batchSize = 25;
            for (let i = 0; i < paymentsToCreate.length; i += batchSize) {
                const batch = paymentsToCreate.slice(i, i + batchSize);
                await base44.asServiceRole.entities.Payment.bulkCreate(batch);
                created += batch.length;
            }
        }

        // Update existing payments
        for (const update of paymentsToUpdate) {
            await base44.asServiceRole.entities.Payment.update(update.id, {
                expected_amount: update.expected_amount,
                payment_date: update.payment_date
            });
            updated++;
        }

        // Delete obsolete payments
        for (const id of paymentsToDelete) {
            await base44.asServiceRole.entities.Payment.delete(id);
            deleted++;
        }

        return Response.json({ 
            success: true,
            stats: { created, updated, deleted }
        });
    } catch (error) {
        console.error('Error updating contract payments:', error);
        return Response.json({ 
            error: error.message || 'Failed to update payments' 
        }, { status: 500 });
    }
});