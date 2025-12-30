import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { itemIds, updateData } = await req.json();

        if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
            return Response.json({ error: 'No item IDs provided' }, { status: 400 });
        }

        if (!updateData || typeof updateData !== 'object') {
            return Response.json({ error: 'No update data provided' }, { status: 400 });
        }

        const results = {
            success: 0,
            errors: 0,
            details: []
        };

        // Update all items
        for (const itemId of itemIds) {
            try {
                await base44.asServiceRole.entities.FinancialItem.update(itemId, updateData);
                results.success++;
            } catch (error) {
                console.error(`Error updating financial item ${itemId}:`, error);
                results.errors++;
                results.details.push({ itemId, error: error.message });
            }
        }

        return Response.json(results);
    } catch (error) {
        console.error('Bulk update error:', error);
        return Response.json({ 
            error: error.message,
            success: 0,
            errors: 0,
            details: []
        }, { status: 500 });
    }
});