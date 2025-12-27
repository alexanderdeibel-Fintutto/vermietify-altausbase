import { base44 } from '@/api/base44Client';
import { addMonths, format, parseISO, isBefore, isAfter } from 'date-fns';

/**
 * Generates monthly payment records for a lease contract
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

    // Generate payments for the next X months
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

        // Check if payment already exists for this month
        const existingPayments = await base44.entities.Payment.filter({
            contract_id: contract.id,
            payment_month: paymentMonth
        });

        if (existingPayments.length === 0) {
            payments.push({
                contract_id: contract.id,
                tenant_id: contract.tenant_id,
                unit_id: contract.unit_id,
                payment_month: paymentMonth,
                expected_amount: totalRent,
                amount: 0,
                payment_type: 'rent',
                status: 'pending',
                reference: `Miete ${paymentMonth}`
            });
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

    // Get all future pending payments
    const futurePayments = await base44.entities.Payment.filter({
        contract_id: contract.id,
        status: 'pending'
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

        // Update payment if amount changed
        if (payment.expected_amount !== totalRent) {
            await base44.entities.Payment.update(payment.id, {
                expected_amount: totalRent
            });
        }
    }
}