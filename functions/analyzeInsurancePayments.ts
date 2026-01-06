import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Analysiert Versicherungsvertrag und berechnet Zahlungstermine
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { insurance_id, year } = await req.json();

        const insurances = await base44.entities.Insurance.filter({ id: insurance_id });
        if (insurances.length === 0) {
            return Response.json({ error: 'Versicherung nicht gefunden' }, { status: 404 });
        }

        const insurance = insurances[0];
        const yearlyAmount = insurance.praemie_jaehrlich;
        const paymentMethod = insurance.zahlungsweise;
        const startDate = new Date(insurance.vertragsbeginn);
        
        // Falls Jahr angegeben, starte ab diesem Jahr
        if (year) {
            startDate.setFullYear(year);
        }

        let numberOfPayments = 1;
        let amountPerPayment = yearlyAmount;
        let monthsBetween = 12;

        switch (paymentMethod) {
            case 'monatlich':
                numberOfPayments = 12;
                amountPerPayment = yearlyAmount / 12;
                monthsBetween = 1;
                break;
            case 'vierteljährlich':
                numberOfPayments = 4;
                amountPerPayment = yearlyAmount / 4;
                monthsBetween = 3;
                break;
            case 'halbjährlich':
                numberOfPayments = 2;
                amountPerPayment = yearlyAmount / 2;
                monthsBetween = 6;
                break;
            case 'jährlich':
                numberOfPayments = 1;
                amountPerPayment = yearlyAmount;
                monthsBetween = 12;
                break;
        }

        const payments = [];
        for (let i = 0; i < numberOfPayments; i++) {
            const dueDate = new Date(startDate);
            dueDate.setMonth(dueDate.getMonth() + (i * monthsBetween));
            
            payments.push({
                payment_number: i + 1,
                due_date: dueDate.toISOString().split('T')[0],
                amount: amountPerPayment,
                description: `${insurance.versicherungstyp} - ${paymentMethod} Rate ${i + 1}`
            });
        }

        return Response.json({
            success: true,
            insurance_id,
            insurance_type: insurance.versicherungstyp,
            payment_method: paymentMethod,
            yearly_amount: yearlyAmount,
            amount_per_payment: amountPerPayment,
            number_of_payments: numberOfPayments,
            payments: payments
        });

    } catch (error) {
        console.error('Analyze insurance error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});