import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Apply approved AI-generated tax rules and configurations to the system
 * Logs all changes for audit purposes
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { tax_law_update_id, approved_configs, approved_rules } = await req.json();

        if (!tax_law_update_id) {
            return Response.json({ error: 'tax_law_update_id required' }, { status: 400 });
        }

        // Fetch the tax law update
        const update = await base44.asServiceRole.entities.TaxLawUpdate.read(tax_law_update_id);

        if (!update) {
            return Response.json({ error: 'Tax law update not found' }, { status: 404 });
        }

        const results = {
            configs_created: [],
            rules_created: [],
            errors: []
        };

        // Apply approved configurations
        if (approved_configs && Array.isArray(approved_configs)) {
            for (const configId of approved_configs) {
                try {
                    const suggestion = update.suggested_config_changes?.find(s => s.id === configId);
                    if (!suggestion) continue;

                    // Create or update config
                    const created = await base44.asServiceRole.entities.TaxConfig.create({
                        config_key: suggestion.config_key,
                        category_id: suggestion.category_id,
                        display_name: suggestion.display_name,
                        value_type: suggestion.value_type,
                        value: suggestion.value,
                        unit: suggestion.unit,
                        valid_from_tax_year: suggestion.valid_from_tax_year,
                        legal_reference: suggestion.legal_reference,
                        bgbl_reference: update.bgbl_reference,
                        notes: `AI-suggested from: ${update.title}`,
                        is_active: true,
                        source: 'AI_SUGGESTION',
                        approved_by: user.email,
                        approved_at: new Date().toISOString()
                    });

                    results.configs_created.push(created.id);

                    // Audit log
                    await base44.asServiceRole.entities.TaxRuleAuditLog.create({
                        entity_type: 'TaxConfig',
                        entity_id: created.id,
                        action: 'CREATE',
                        new_values: created,
                        change_reason: `AI-suggested from law update: ${update.title}`,
                        tax_law_update_id,
                        performed_by: user.email,
                        performed_at: new Date().toISOString()
                    });
                } catch (error) {
                    results.errors.push({
                        type: 'config',
                        id: configId,
                        error: error.message
                    });
                }
            }
        }

        // Apply approved rules
        if (approved_rules && Array.isArray(approved_rules)) {
            for (const ruleId of approved_rules) {
                try {
                    const suggestion = update.suggested_rule_changes?.find(s => s.id === ruleId);
                    if (!suggestion) continue;

                    // Create or update rule
                    const created = await base44.asServiceRole.entities.TaxRule.create({
                        rule_code: suggestion.rule_code,
                        category_id: suggestion.category_id,
                        display_name: suggestion.display_name,
                        description: suggestion.description,
                        rule_type: suggestion.rule_type,
                        priority: suggestion.priority || 100,
                        conditions: suggestion.conditions || {},
                        actions: suggestion.actions || {},
                        input_fields: suggestion.input_fields || [],
                        output_fields: suggestion.output_fields || [],
                        valid_from_tax_year: suggestion.valid_from_tax_year,
                        legal_reference: suggestion.legal_reference,
                        bgbl_reference: update.bgbl_reference,
                        is_active: true,
                        source: 'AI_SUGGESTION',
                        approved_by: user.email,
                        approved_at: new Date().toISOString()
                    });

                    results.rules_created.push(created.id);

                    // Audit log
                    await base44.asServiceRole.entities.TaxRuleAuditLog.create({
                        entity_type: 'TaxRule',
                        entity_id: created.id,
                        action: 'CREATE',
                        new_values: created,
                        change_reason: `AI-suggested from law update: ${update.title}`,
                        tax_law_update_id,
                        performed_by: user.email,
                        performed_at: new Date().toISOString()
                    });
                } catch (error) {
                    results.errors.push({
                        type: 'rule',
                        id: ruleId,
                        error: error.message
                    });
                }
            }
        }

        // Update the TaxLawUpdate to mark as implemented
        const implemented = await base44.asServiceRole.entities.TaxLawUpdate.update(tax_law_update_id, {
            status: 'IMPLEMENTED',
            implemented_configs: results.configs_created,
            implemented_rules: results.rules_created
        });

        return Response.json({
            success: true,
            results,
            message: `Successfully deployed ${results.configs_created.length + results.rules_created.length} changes`
        });

    } catch (error) {
        console.error('Error applying suggestions:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});