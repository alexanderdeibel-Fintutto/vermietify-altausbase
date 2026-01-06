import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Erstellt Anlage V für mehrere Objekte gleichzeitig
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { building_ids, tax_year } = await req.json();

        if (!building_ids || !Array.isArray(building_ids) || building_ids.length === 0) {
            return Response.json({ error: 'building_ids Array erforderlich' }, { status: 400 });
        }

        const results = [];
        let sequentialNumber = 1;

        for (const building_id of building_ids) {
            try {
                // Daten für dieses Gebäude ermitteln
                const mapResponse = await base44.functions.invoke('mapBuildingToAnlageV', {
                    building_id,
                    tax_year
                });

                const einnahmenResponse = await base44.functions.invoke('calculateAnlageVEinnahmen', {
                    building_id,
                    tax_year
                });

                const werbungskostenResponse = await base44.functions.invoke('calculateAnlageVWerbungskosten', {
                    building_id,
                    tax_year
                });

                const formData = {
                    ...mapResponse.data.mapped_data,
                    ...einnahmenResponse.data.einnahmen,
                    ...werbungskostenResponse.data.werbungskosten
                };

                // Validieren
                const validationResponse = await base44.functions.invoke('validateAnlageV', {
                    form_data: formData,
                    building_id
                });

                // Submission erstellen
                const submission = await base44.asServiceRole.entities.AnlageVSubmission.create({
                    tax_year,
                    building_id,
                    form_id: 'anlage_v_2024',
                    sequential_number: sequentialNumber,
                    form_data: formData,
                    status: validationResponse.data.validation.is_valid ? 'validiert' : 'entwurf',
                    validation_result: validationResponse.data.validation,
                    auto_calculated: true,
                    last_validated: new Date().toISOString()
                });

                results.push({
                    building_id,
                    submission_id: submission.id,
                    sequential_number: sequentialNumber,
                    status: 'success',
                    validation: validationResponse.data.validation
                });

                sequentialNumber++;

            } catch (error) {
                results.push({
                    building_id,
                    status: 'error',
                    error: error.message
                });
            }
        }

        // Zusammenfassung
        const summary = {
            total: building_ids.length,
            successful: results.filter(r => r.status === 'success').length,
            failed: results.filter(r => r.status === 'error').length,
            with_errors: results.filter(r => r.status === 'success' && !r.validation?.is_valid).length
        };

        return Response.json({
            success: true,
            summary,
            results,
            tax_year
        });

    } catch (error) {
        console.error('Create multiple Anlagen error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});