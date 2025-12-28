import { base44 } from '@/api/base44Client';
import { addMonths, format, parseISO, isBefore, isAfter, setDate, startOfMonth, getDaysInMonth, getDate } from 'date-fns';

/**
 * Calculates partial rent for mid-month start
 */
export function calculatePartialRent(contract, startDate) {
    const dayOfMonth = getDate(startDate);
    const daysInMonth = getDaysInMonth(startDate);
    const remainingDays = daysInMonth - dayOfMonth + 1;
    const dailyRate = contract.total_rent / daysInMonth;
    return dailyRate * remainingDays;
}

/**
 * Checks if contract needs partial rent dialog
 */
export function needsPartialRentDialog(contract) {
    const startDate = parseISO(contract.start_date);
    const dayOfMonth = getDate(startDate);
    return dayOfMonth > 1;
}

/**
 * Generates monthly rent payment records for a lease contract
 * @param {Object} contract - The lease contract
 * @param {Array} rentChanges - Array of rent changes for this contract
 * @param {Number} partialRentAmount - Optional partial rent for first month
 */
export async function generatePaymentsForContract(contract, rentChanges = [], partialRentAmount = null) {
    const payments = [];
    const startDate = parseISO(contract.start_date);
    const endDate = contract.end_date ? parseISO(contract.end_date) : addMonths(new Date(), 24);
    
    // Load ALL existing payments for this contract once
    const existingPayments = await base44.entities.Payment.filter({
        contract_id: contract.id
    });
    
    // Sort rent changes by date (newest first)
    const sortedChanges = [...rentChanges].sort((a, b) => 
        new Date(b.effective_date) - new Date(a.effective_date)
    );

    // Generate rent payments from start to end
    let currentDate = startOfMonth(startDate);
    let isFirstMonth = true;
    
    while (isBefore(currentDate, endDate) || format(currentDate, 'yyyy-MM') === format(endDate, 'yyyy-MM')) {
        const paymentMonth = format(currentDate, 'yyyy-MM');
        
        // Check in memory if payment exists
        const paymentExists = existingPayments.some(p => 
            p.payment_month === paymentMonth && p.payment_type === 'rent'
        );
        
        if (!paymentExists) {
            // Find applicable rent for this month
            const applicableChange = sortedChanges.find(change => 
                isBefore(parseISO(change.effective_date), currentDate) || 
                format(parseISO(change.effective_date), 'yyyy-MM') === paymentMonth
            );

            const baseRent = applicableChange ? applicableChange.base_rent : contract.base_rent;
            const utilities = applicableChange ? (applicableChange.utilities || 0) : (contract.utilities || 0);
            const heating = applicableChange ? (applicableChange.heating || 0) : (contract.heating || 0);
            const totalRent = baseRent + utilities + heating;

            // Calculate due date
            let dueDate = startOfMonth(currentDate);
            if (contract.rent_due_day) {
                try {
                    dueDate = setDate(dueDate, contract.rent_due_day);
                } catch (e) {
                    dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                }
            }

            payments.push({
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
        }
        
        currentDate = addMonths(currentDate, 1);
    }

    // Generate deposit payments if deposit exists
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

            // Check in memory if deposit payment exists
            const depositExists = existingPayments.some(p => 
                p.payment_month === paymentMonth && p.payment_type === 'deposit'
            );

            if (!depositExists) {
                payments.push({
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
    }

    // Create all payments in batches
    if (payments.length > 0) {
        const batchSize = 20;
        for (let i = 0; i < payments.length; i += batchSize) {
            const batch = payments.slice(i, i + batchSize);
            await base44.entities.Payment.bulkCreate(batch);
            if (i + batchSize < payments.length) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
    }

    return payments.length;
}

/**
 * Updates future payments when rent changes
 * @param {Object} contract - The lease contract
 * @param {Array} rentChanges - Array of rent changes for this contract
 */
export async function updateFuturePayments(contract, rentChanges = []) {
    const today = new Date();
    const sortedChanges = [...rentChanges].sort((a, b) => 
        new Date(b.effective_date) - new Date(a.effective_date)
    );

    // Get all future pending rent payments
    const futurePayments = await base44.entities.Payment.filter({
        contract_id: contract.id,
        status: 'pending',
        payment_type: 'rent'
    });

    const paymentsToUpdate = [];

    for (const payment of futurePayments) {
        const paymentDate = parseISO(payment.payment_month + '-01');
        
        // Skip past payments
        if (isBefore(paymentDate, today)) {
            continue;
        }

        // Find applicable rent for this month
        const applicableChange = sortedChanges.find(change => 
            isBefore(parseISO(change.effective_date), paymentDate) || 
            format(parseISO(change.effective_date), 'yyyy-MM') === payment.payment_month
        );

        const baseRent = applicableChange ? applicableChange.base_rent : contract.base_rent;
        const utilities = applicableChange ? (applicableChange.utilities || 0) : (contract.utilities || 0);
        const heating = applicableChange ? (applicableChange.heating || 0) : (contract.heating || 0);
        const totalRent = baseRent + utilities + heating;

        // Calculate due date
        let dueDate = startOfMonth(paymentDate);
        if (contract.rent_due_day) {
            try {
                dueDate = setDate(dueDate, contract.rent_due_day);
            } catch (e) {
                dueDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 0);
            }
        }

        // Collect updates to batch them
        if (payment.expected_amount !== totalRent || payment.payment_date !== format(dueDate, 'yyyy-MM-dd')) {
            paymentsToUpdate.push({
                id: payment.id,
                data: {
                    expected_amount: totalRent,
                    payment_date: format(dueDate, 'yyyy-MM-dd')
                }
            });
        }
    }

    // Update all payments sequentially with delays
    for (let i = 0; i < paymentsToUpdate.length; i++) {
        await base44.entities.Payment.update(paymentsToUpdate[i].id, paymentsToUpdate[i].data);
        if (i < paymentsToUpdate.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
}

/**
 * Regenerates all payments for a specific contract
 * Deletes all pending payments and regenerates them
 */
export async function regenerateContractPayments(contractId) {
    try {
        const contract = await base44.entities.LeaseContract.filter({ id: contractId });
        if (!contract || contract.length === 0) return 0;
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const rentChanges = await base44.entities.RentChange.filter({ 
            contract_id: contractId 
        });

        await new Promise(resolve => setTimeout(resolve, 100));

        // Delete all pending payments for this contract sequentially to avoid rate limits
        const pendingPayments = await base44.entities.Payment.filter({
            contract_id: contractId,
            status: 'pending'
        });

        for (const payment of pendingPayments) {
            await base44.entities.Payment.delete(payment.id);
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        await new Promise(resolve => setTimeout(resolve, 200));

        // Regenerate payments
        return await generatePaymentsForContract(contract[0], rentChanges);
    } catch (error) {
        console.error('Error regenerating contract payments:', error);
        throw error;
    }
}

/**
 * Regenerates all payments for all contracts
 * This should be called when you want to update all existing contract payments
 */
export async function regenerateAllPayments() {
    try {
        // Get all contracts
        const contracts = await base44.entities.LeaseContract.list();
        
        let totalGenerated = 0;
        
        for (let i = 0; i < contracts.length; i++) {
            const contract = contracts[i];
            
            // Determine contract status
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDate = new Date(contract.start_date);
            const endDate = contract.end_date ? new Date(contract.end_date) : null;

            let isActive = false;
            if (startDate <= today) {
                if (endDate) {
                    isActive = endDate >= today;
                } else {
                    isActive = true;
                }
                if (contract.termination_date) {
                    const terminationDate = new Date(contract.termination_date);
                    if (terminationDate < today) {
                        isActive = false;
                    }
                }
            }

            // Only generate payments for active contracts
            if (isActive) {
                const generated = await regenerateContractPayments(contract.id);
                totalGenerated += generated;
                
                // Delay between contracts to avoid rate limits
                if (i < contracts.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
            }
        }

        return totalGenerated;
    } catch (error) {
        console.error('Error regenerating all payments:', error);
        throw error;
    }
}