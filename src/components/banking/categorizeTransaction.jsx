/**
 * Auto-categorizes a transaction based on keywords from categories
 */
export function categorizeTransaction(transaction, categories) {
    if (!transaction || !categories || categories.length === 0) {
        return null;
    }

    const searchText = [
        transaction.description,
        transaction.sender_receiver,
        transaction.reference
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    // Find category with matching keywords
    for (const category of categories) {
        if (!category.keywords) continue;

        const keywords = category.keywords
            .split(',')
            .map(k => k.trim().toLowerCase())
            .filter(Boolean);

        for (const keyword of keywords) {
            if (searchText.includes(keyword)) {
                return category.id;
            }
        }
    }

    return null;
}

/**
 * Bulk categorize transactions
 */
export async function bulkCategorizeTransactions(transactions, categories) {
    const updates = [];

    for (const transaction of transactions) {
        if (transaction.category_id) continue; // Skip already categorized

        const categoryId = categorizeTransaction(transaction, categories);
        if (categoryId) {
            updates.push({ transaction, categoryId });
        }
    }

    return updates;
}