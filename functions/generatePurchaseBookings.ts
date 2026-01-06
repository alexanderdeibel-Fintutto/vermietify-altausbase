import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generiert Buchungen aus Kaufvertrag
 * Kaufpreis + Nebenkosten
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { purchase_contract_id } = await req.json();

        const contracts = await base44.entities.PurchaseContract.filter({ id: purchase_contract_id });
        if (contracts.length === 0) {
            return Response.json({ error: 'Kaufvertrag nicht gefunden' }, { status: 404 });
        }

        const contract = contracts[0];
        const handoverDate = contract.handover_date || contract.contract_date;
        const bookings = [];

        // Kaufpreis (Gebäude)
        if (contract.building_value) {
            bookings.push({
                due_date: handoverDate,
                amount: contract.building_value,
                description: 'Kaufpreis Gebäude',
                cost_category: 'Anschaffungskosten-Gebäude'
            });
        }

        // Kaufpreis (Grundstück)
        if (contract.land_value) {
            bookings.push({
                due_date: handoverDate,
                amount: contract.land_value,
                description: 'Kaufpreis Grundstück',
                cost_category: 'Anschaffungskosten-Grundstück (nicht abzugsfähig)'
            });
        }

        // Falls keine Aufteilung, Gesamtpreis
        if (!contract.building_value && !contract.land_value && contract.purchase_price) {
            bookings.push({
                due_date: handoverDate,
                amount: contract.purchase_price,
                description: 'Kaufpreis Immobilie',
                cost_category: 'Anschaffungskosten-Gebäude'
            });
        }

        // Grunderwerbsteuer
        if (contract.real_estate_transfer_tax && contract.real_estate_transfer_tax > 0) {
            bookings.push({
                due_date: handoverDate,
                amount: contract.real_estate_transfer_tax,
                description: 'Grunderwerbsteuer',
                cost_category: 'Anschaffungsnebenkosten'
            });
        }

        // Notarkosten
        if (contract.notary_costs && contract.notary_costs > 0) {
            bookings.push({
                due_date: handoverDate,
                amount: contract.notary_costs,
                description: 'Notarkosten',
                cost_category: 'Anschaffungsnebenkosten'
            });
        }

        // Maklerkosten
        if (contract.broker_commission && contract.broker_commission > 0) {
            bookings.push({
                due_date: handoverDate,
                amount: contract.broker_commission,
                description: 'Maklerkosten',
                cost_category: 'Anschaffungsnebenkosten'
            });
        }

        // Grundbuchkosten
        if (contract.land_registry_costs && contract.land_registry_costs > 0) {
            bookings.push({
                due_date: handoverDate,
                amount: contract.land_registry_costs,
                description: 'Grundbuchkosten',
                cost_category: 'Anschaffungsnebenkosten'
            });
        }

        // Sonstige Kosten
        if (contract.other_costs && contract.other_costs > 0) {
            bookings.push({
                due_date: handoverDate,
                amount: contract.other_costs,
                description: 'Sonstige Kaufnebenkosten',
                cost_category: 'Anschaffungsnebenkosten'
            });
        }

        const totalAmount = bookings.reduce((sum, b) => sum + b.amount, 0);

        return Response.json({
            success: true,
            purchase_contract_id,
            contract_date: contract.contract_date,
            handover_date: handoverDate,
            purchase_price: contract.purchase_price,
            bookings: bookings,
            total_amount: totalAmount,
            count: bookings.length
        });

    } catch (error) {
        console.error('Generate purchase bookings error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});