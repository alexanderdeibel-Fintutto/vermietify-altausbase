import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const DOCUMENTATION_TYPES = [
            'database_structure',
            'module_architecture',
            'master_data',
            'business_logic',
            'external_integrations',
            'document_generation',
            'user_workflows',
            'permissions_roles',
            'error_handling',
            'data_migration',
            'executive_summary'
        ];

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const docType of DOCUMENTATION_TYPES) {
            try {
                console.log(`Updating documentation: ${docType}`);
                
                const response = await base44.asServiceRole.functions.invoke('generateDocumentation', {
                    documentation_type: docType
                });

                if (response.data?.success) {
                    successCount++;
                    console.log(`✓ ${docType} updated successfully`);
                } else {
                    throw new Error(response.data?.error || 'Unknown error');
                }
            } catch (error) {
                errorCount++;
                errors.push({ type: docType, error: error.message });
                console.error(`✗ Failed to update ${docType}:`, error.message);
            }
        }

        const result = {
            success: true,
            timestamp: new Date().toISOString(),
            summary: {
                total: DOCUMENTATION_TYPES.length,
                successful: successCount,
                failed: errorCount
            },
            errors: errors.length > 0 ? errors : undefined
        };

        console.log('Documentation update completed:', result);

        return Response.json(result);
    } catch (error) {
        console.error('Update documentation error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});