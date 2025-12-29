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
 * Generates monthly rent financial items (receivables) for a lease contract
 */
export async function generateFinancialItemsForContract(contract, rentChanges = [], partialRentAmount = null) {
    const items = [];
    const startDate = parseISO(contract.start_date);
    const endDate = contract.end_date ? parseISO(contract.end_date) : addMonths(new Date(), 24);
    
    // Load ALL existing financial items for this contract once
    const existingItems = await base44.entities.FinancialItem.filter({
        related_to_contract_id: contract.id,
        is_automatic_from_contract: true
    });
    
    // Sort rent changes by date (newest first)
    const sortedChanges = [...rentChanges].sort((a, b) => 
        new Date(b.effective_date) - new Date(a.effective_date)
    );

    // Generate rent financial items from start to end
    let currentDate = startOfMonth(startDate);
    
    while (isBefore(currentDate, endDate) || format(currentDate, 'yyyy-MM') === format(endDate, 'yyyy-MM')) {
        const paymentMonth = format(currentDate, 'yyyy-MM');
        
        // Check in memory if item exists
        const itemExists = existingItems.some(item => 
            item.payment_month === paymentMonth && item.category === 'rent'
        );
        
        if (!itemExists) {
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

            items.push({
                type: 'receivable',
                related_to_contract_id: contract.id,
                related_to_tenant_id: contract.tenant_id,
                related_to_unit_id: contract.unit_id,
                payment_month: paymentMonth,
                due_date: format(dueDate, 'yyyy-MM-dd'),
                expected_amount: totalRent,
                amount: 0,
                category: 'rent',
                status: 'pending',
                is_automatic_from_contract: true,
                description: `Miete ${paymentMonth}`,
                reference: `Miete ${paymentMonth}`,
                currency: 'EUR'
            });
        }
        
        currentDate = addMonths(currentDate, 1);
    }

    // Generate deposit financial items if deposit exists
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

            // Check in memory if deposit item exists
            const depositExists = existingItems.some(item => 
                item.payment_month === paymentMonth && item.category === 'deposit'
            );

            if (!depositExists) {
                items.push({
                    type: 'receivable',
                    related_to_contract_id: contract.id,
                    related_to_tenant_id: contract.tenant_id,
                    related_to_unit_id: contract.unit_id,
                    payment_month: paymentMonth,
                    due_date: format(dueDate, 'yyyy-MM-dd'),
                    expected_amount: installmentAmount,
                    amount: 0,
                    category: 'deposit',
                    status: 'pending',
                    is_automatic_from_contract: true,
                    description: `Kaution ${i + 1}/${installments}`,
                    reference: `Kaution ${i + 1}/${installments}`,
                    currency: 'EUR'
                });
            }
        }
    }

    // Create all items in batches
    if (items.length > 0) {
        const batchSize = 20;
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            await base44.entities.FinancialItem.bulkCreate(batch);
            if (i + batchSize < items.length) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
    }

    return items.length;
}

/**
 * Updates future financial items when rent changes
 */
export async function updateFutureFinancialItems(contract, rentChanges = []) {
    const today = new Date();
    const sortedChanges = [...rentChanges].sort((a, b) => 
        new Date(b.effective_date) - new Date(a.effective_date)
    );

    // Get all future pending rent financial items
    const futureItems = await base44.entities.FinancialItem.filter({
        related_to_contract_id: contract.id,
        status: 'pending',
        category: 'rent',
        is_automatic_from_contract: true
    });

    const itemsToUpdate = [];

    for (const item of futureItems) {
        const itemDate = parseISO(item.payment_month + '-01');
        
        // Skip past items
        if (isBefore(itemDate, today)) {
            continue;
        }

        // Find applicable rent for this month
        const applicableChange = sortedChanges.find(change => 
            isBefore(parseISO(change.effective_date), itemDate) || 
            format(parseISO(change.effective_date), 'yyyy-MM') === item.payment_month
        );

        const baseRent = applicableChange ? applicableChange.base_rent : contract.base_rent;
        const utilities = applicableChange ? (applicableChange.utilities || 0) : (contract.utilities || 0);
        const heating = applicableChange ? (applicableChange.heating || 0) : (contract.heating || 0);
        const totalRent = baseRent + utilities + heating;

        // Calculate due date
        let dueDate = startOfMonth(itemDate);
        if (contract.rent_due_day) {
            try {
                dueDate = setDate(dueDate, contract.rent_due_day);
            } catch (e) {
                dueDate = new Date(itemDate.getFullYear(), itemDate.getMonth() + 1, 0);
            }
        }

        // Collect updates to batch them
        if (item.expected_amount !== totalRent || item.due_date !== format(dueDate, 'yyyy-MM-dd')) {
            itemsToUpdate.push({
                id: item.id,
                data: {
                    expected_amount: totalRent,
                    due_date: format(dueDate, 'yyyy-MM-dd')
                }
            });
        }
    }

    // Update all items sequentially with delays
    for (let i = 0; i < itemsToUpdate.length; i++) {
        await base44.entities.FinancialItem.update(itemsToUpdate[i].id, itemsToUpdate[i].data);
        if (i < itemsToUpdate.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
}

/**
 * Regenerates all financial items for a specific contract
 */
export async function regenerateContractFinancialItems(contractId) {
    try {
        const contract = await base44.entities.LeaseContract.filter({ id: contractId });
        if (!contract || contract.length === 0) return 0;
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const rentChanges = await base44.entities.RentChange.filter({ 
            contract_id: contractId 
        });

        await new Promise(resolve => setTimeout(resolve, 100));

        // Delete all pending automatic financial items for this contract
        const pendingItems = await base44.entities.FinancialItem.filter({
            related_to_contract_id: contractId,
            status: 'pending',
            is_automatic_from_contract: true
        });

        for (const item of pendingItems) {
            await base44.entities.FinancialItem.delete(item.id);
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        await new Promise(resolve => setTimeout(resolve, 200));

        // Regenerate financial items
        return await generateFinancialItemsForContract(contract[0], rentChanges);
    } catch (error) {
        console.error('Error regenerating contract financial items:', error);
        throw error;
    }
}

/**
 * Regenerates all financial items for all contracts
 */
export async function regenerateAllFinancialItems() {
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

            // Only generate items for active contracts
            if (isActive) {
                const generated = await regenerateContractFinancialItems(contract.id);
                totalGenerated += generated;
                
                // Delay between contracts to avoid rate limits
                if (i < contracts.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
            }
        }

        return totalGenerated;
    } catch (error) {
        console.error('Error regenerating all financial items:', error);
        throw error;
    }
}