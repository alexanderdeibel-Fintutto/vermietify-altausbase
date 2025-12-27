import { base44 } from '@/api/base44Client';
import { addMonths, format, parseISO, isBefore, isAfter, setDate, startOfMonth } from 'date-fns';

/**
 * Generates monthly rent payment records for a lease contract
 * @param {Object} contract - The lease contract
 * @param {Array} rentChanges - Array of rent changes for this contract
 * @param {number} monthsAhead - How many months ahead to generate (default: 12)
 */
export async function generatePaymentsForContract(contract, rentChanges = [], monthsAhead = 12) {
    const payments = [];
    const today = new Date();
    const startDate = parseISO(contract.start_date);
    
    // Sort rent changes by date (newest first)
    const sortedChanges = [...rentChanges].sort((a, b) => 
        new Date(b.effective_date) - new Date(a.effective_date)
    );

    // Generate rent payments for the next X months
    for (let i = 0; i < monthsAhead; i++) {
        const paymentDate = addMonths(today, i);
        const paymentMonth = format(paymentDate, 'yyyy-MM');
        
        // Don't generate payments before contract start
        if (isBefore(paymentDate, startDate)) {
            continue;
        }
        
        // Stop if contract has ended
        if (contract.end_date && isAfter(paymentDate, parseISO(contract.end_date))) {
            break;
        }

        // Find applicable rent for this month
        const applicableChange = sortedChanges.find(change => 
            isBefore(parseISO(change.effective_date), paymentDate) || 
            format(parseISO(change.effective_date), 'yyyy-MM') === paymentMonth
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
                // If day doesn't exist in month (e.g., 31st in February), use last day
                dueDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 0);
            }
        }

        // Check if payment already exists for this month
        const existingPayments = await base44.entities.Payment.filter({
            contract_id: contract.id,
            payment_month: paymentMonth,
            payment_type: 'rent'
        });

        if (existingPayments.length === 0) {
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
    }

    // Generate deposit payments if deposit exists
    if (contract.deposit && contract.deposit > 0) {
        const installments = contract.deposit_installments || 1;
        const installmentAmount = contract.deposit / installments;

        for (let i = 0; i < installments; i++) {
            const dueDate = addMonths(startDate, i);
            const paymentMonth = format(dueDate, 'yyyy-MM');

            // Check if deposit payment already exists
            const existingDepositPayments = await base44.entities.Payment.filter({
                contract_id: contract.id,
                payment_month: paymentMonth,
                payment_type: 'deposit'
            });

            if (existingDepositPayments.length === 0) {
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

    // Create all payments
    if (payments.length > 0) {
        await base44.entities.Payment.bulkCreate(payments);
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

        // Update payment if amount or date changed
        if (payment.expected_amount !== totalRent || payment.payment_date !== format(dueDate, 'yyyy-MM-dd')) {
            await base44.entities.Payment.update(payment.id, {
                expected_amount: totalRent,
                payment_date: format(dueDate, 'yyyy-MM-dd')
            });
        }
    }
}

/**
 * Regenerates all payments for all active contracts
 * This should be called when you want to update all existing contract payments
 */
export async function regenerateAllPayments() {
    try {
        // Get all active contracts
        const contracts = await base44.entities.LeaseContract.filter({ status: 'active' });
        
        let totalGenerated = 0;
        
        for (const contract of contracts) {
            // Get rent changes for this contract
            const rentChanges = await base44.entities.RentChange.filter({ 
                contract_id: contract.id 
            });

            // Delete all future pending payments
            const futurePayments = await base44.entities.Payment.filter({
                contract_id: contract.id,
                status: 'pending'
            });

            for (const payment of futurePayments) {
                await base44.entities.Payment.delete(payment.id);
            }

            // Regenerate payments
            const generated = await generatePaymentsForContract(contract, rentChanges, 12);
            totalGenerated += generated;
        }

        return totalGenerated;
    } catch (error) {
        console.error('Error regenerating all payments:', error);
        throw error;
    }
}