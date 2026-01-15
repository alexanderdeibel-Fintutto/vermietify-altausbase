import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { rentPaymentId, reminderLevel = 1 } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // RentPayment laden
        const payments = await base44.entities.RentPayment.list();
        const payment = payments.find(p => p.id === rentPaymentId);
        if (!payment || payment.status === 'PAID') {
            return new Response(JSON.stringify({ error: 'Payment not found or already paid' }), { status: 404 });
        }

        // Unit & Building laden
        const units = await base44.entities.Unit.list();
        const unit = units.find(u => u.id === payment.unit_id);
        const buildings = await base44.entities.Building.list();
        const building = buildings.find(b => b.id === unit?.building_id);

        // LeaseContract laden
        const leases = await base44.entities.LeaseContract.list();
        const lease = leases.find(l => l.id === payment.lease_contract_id);

        const daysOverdue = Math.floor((new Date() - new Date(payment.due_date)) / (1000 * 60 * 60 * 24));

        // Mahnung generieren
        let reminderText = '';
        let reminderSubject = '';

        if (reminderLevel === 1) {
            reminderSubject = `Zahlungserinnerung Miete ${payment.payment_month}`;
            reminderText = generateFirstReminder({ payment, daysOverdue, building, unit, lease });
        } else if (reminderLevel === 2) {
            reminderSubject = `Erste Mahnung Miete ${payment.payment_month}`;
            reminderText = generateSecondReminder({ payment, daysOverdue, building, unit, lease });
        } else {
            reminderSubject = `Zweite Mahnung (Abmahnung) Miete ${payment.payment_month}`;
            reminderText = generateThirdReminder({ payment, daysOverdue, building, unit, lease });
        }

        // RentPayment aktualisieren
        await base44.entities.RentPayment.update(rentPaymentId, {
            reminders_sent: payment.reminders_sent + 1,
            last_reminder_date: new Date().toISOString()
        });

        return new Response(JSON.stringify({
            success: true,
            reminderLevel,
            subject: reminderSubject,
            content: reminderText,
            daysOverdue
        }), { status: 200 });

    } catch (error) {
        console.error('Error generating reminder:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});

function generateFirstReminder({ payment, daysOverdue, building, unit, lease }) {
    return `Sehr geehrte/r ${lease?.tenant_name || 'Mieter/in'},

wir möchten Sie höflich darauf hinweisen, dass die Miete für ${payment.payment_month} noch nicht auf unserem Konto eingegangen ist.

Zahlungsdetails:
- Objekt: ${building?.name}
- Einheit: ${unit?.unit_number}
- Fällig am: ${new Date(payment.due_date).toLocaleDateString('de-DE')}
- Betrag: €${payment.amount.toFixed(2)}
- Überfällig seit: ${daysOverdue} Tage

Bitte überweisen Sie den ausstehenden Betrag schnellstmöglich auf das angegebene Mietzahlungskonto.

Sollte die Zahlung bereits erfolgt sein, bitten wir um Entschuldigung.

Mit freundlichen Grüßen,
Ihr Vermieter`;
}

function generateSecondReminder({ payment, daysOverdue, building, unit, lease }) {
    return `MAHNUNG - Zahlungsaufforderung

Sehr geehrte/r ${lease?.tenant_name || 'Mieter/in'},

trotz unserer Zahlungserinnerung ist die Miete für ${payment.payment_month} nicht eingegangen.

Zahlungsdetails:
- Objekt: ${building?.name}
- Einheit: ${unit?.unit_number}
- Fälliges Datum: ${new Date(payment.due_date).toLocaleDateString('de-DE')}
- Betrag: €${payment.amount.toFixed(2)}
- Überfällig seit: ${daysOverdue} Tage

Wir mahnen Sie hiermit zur sofortigen Zahlung auf. Die Zahlung muss innerhalb von 3 Werktagen eingehen.

Sollte die Zahlung nicht erfolgen, werden wir Rechtsmittel in Betracht ziehen.

Mit freundlichen Grüßen,
Ihr Vermieter`;
}

function generateThirdReminder({ payment, daysOverdue, building, unit, lease }) {
    return `ABMAHNUNG / LETZTE AUFFORDERUNG

Sehr geehrte/r ${lease?.tenant_name || 'Mieter/in'},

die Miete für ${payment.payment_month} ist trotz vorheriger Mahnungen nicht gezahlt worden.

Zahlungsdetails:
- Objekt: ${building?.name}
- Einheit: ${unit?.unit_number}
- Betrag: €${payment.amount.toFixed(2)}
- Überfällig seit: ${daysOverdue} Tage

Dies ist unsere letzte Aufforderung zur Zahlung.

Sollte der Betrag nicht innerhalb von 3 Werktagen eingehen, werden wir ohne weitere Ankündigung rechtliche Schritte einleiten, einschließlich Kündigung des Mietvertrages und gerichtliche Geltendmachung aller Ansprüche.

Mit freundlichen Grüßen,
Ihr Vermieter`;
}