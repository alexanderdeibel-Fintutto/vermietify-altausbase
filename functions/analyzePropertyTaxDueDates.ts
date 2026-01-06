import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Analysiert Grundsteuerbescheid und extrahiert Fälligkeiten
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { property_tax_id } = await req.json();

        const propertyTaxes = await base44.entities.PropertyTax.filter({ id: property_tax_id });
        if (propertyTaxes.length === 0) {
            return Response.json({ error: 'Grundsteuerbescheid nicht gefunden' }, { status: 404 });
        }

        const propertyTax = propertyTaxes[0];
        const quarterlyAmount = propertyTax.grundsteuer_quartalsrate || 
                               (propertyTax.grundsteuer_jahresbetrag / 4);

        const dueDates = [];

        if (propertyTax.faelligkeit_q1) {
            dueDates.push({
                quarter: 1,
                due_date: propertyTax.faelligkeit_q1,
                amount: quarterlyAmount,
                description: `Grundsteuer ${propertyTax.grundsteuerbescheid_jahr} - 1. Rate (Q1)`
            });
        }

        if (propertyTax.faelligkeit_q2) {
            dueDates.push({
                quarter: 2,
                due_date: propertyTax.faelligkeit_q2,
                amount: quarterlyAmount,
                description: `Grundsteuer ${propertyTax.grundsteuerbescheid_jahr} - 2. Rate (Q2)`
            });
        }

        if (propertyTax.faelligkeit_q3) {
            dueDates.push({
                quarter: 3,
                due_date: propertyTax.faelligkeit_q3,
                amount: quarterlyAmount,
                description: `Grundsteuer ${propertyTax.grundsteuerbescheid_jahr} - 3. Rate (Q3)`
            });
        }

        if (propertyTax.faelligkeit_q4) {
            dueDates.push({
                quarter: 4,
                due_date: propertyTax.faelligkeit_q4,
                amount: quarterlyAmount,
                description: `Grundsteuer ${propertyTax.grundsteuerbescheid_jahr} - 4. Rate (Q4)`
            });
        }

        return Response.json({
            success: true,
            property_tax_id,
            year: propertyTax.grundsteuerbescheid_jahr,
            yearly_amount: propertyTax.grundsteuer_jahresbetrag,
            quarterly_amount: quarterlyAmount,
            due_dates: dueDates,
            count: dueDates.length
        });

    } catch (error) {
        console.error('Analyze property tax error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});