import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Automatically categorizes financial transactions using AI
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { transactionIds = [] } = await req.json();

    if (transactionIds.length === 0) {
      return Response.json({ error: 'No transactions provided' }, { status: 400 });
    }

    console.log(`Categorizing ${transactionIds.length} transactions...`);

    // Fetch uncategorized transactions
    const transactions = await Promise.all(
      transactionIds.map(id => base44.entities.FinancialItem.filter({ id }))
    );

    const flatTransactions = transactions.flat();
    const uncategorizedTransactions = flatTransactions.filter(t => !t.category);

    if (uncategorizedTransactions.length === 0) {
      return Response.json({ success: true, categorized_count: 0 });
    }

    // Group transactions for AI processing
    const transactionTexts = uncategorizedTransactions.map(t => 
      `Beschreibung: ${t.description}, Betrag: ${t.amount}€, Typ: ${t.transaction_type}`
    ).join('\n');

    // Use LLM to categorize
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Kategorisiere die folgenden Finanztransaktionen. Gib für jede Transaktion die beste Kategorie zurück.

Verfügbare Kategorien:
- Einnahmen: rent_income, deposit_return, other_income
- Ausgaben: maintenance, utilities, insurance, property_tax, personnel, office, other_expense

Transaktionen:
${transactionTexts}

Antworte im JSON-Format:
[
  { "description": "...", "category": "..." }
]`,
      response_json_schema: {
        type: "object",
        properties: {
          categorizations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                category: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Create a map from description to category
    const categoryMap = {};
    if (result.categorizations) {
      result.categorizations.forEach(cat => {
        categoryMap[cat.description] = cat.category;
      });
    }

    // Update transactions with new categories
    let categorizedCount = 0;
    for (const transaction of uncategorizedTransactions) {
      const newCategory = categoryMap[transaction.description];
      if (newCategory) {
        await base44.entities.FinancialItem.update(transaction.id, {
          category: newCategory
        });
        categorizedCount++;
      }
    }

    console.log(`Categorized ${categorizedCount} transactions`);

    return Response.json({
      success: true,
      categorized_count: categorizedCount,
      total_processed: uncategorizedTransactions.length
    });
  } catch (error) {
    console.error('Error categorizing transactions:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});