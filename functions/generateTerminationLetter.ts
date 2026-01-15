import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { terminationNoticeId } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // TerminationNotice laden
        const terminations = await base44.entities.TerminationNotice.list();
        const termination = terminations.find(t => t.id === terminationNoticeId);
        if (!termination) {
            return new Response(JSON.stringify({ error: 'Termination not found' }), { status: 404 });
        }

        // Lease laden
        const leases = await base44.entities.LeaseContract.list();
        const lease = leases.find(l => l.id === termination.lease_contract_id);

        // Unit laden
        const units = await base44.entities.Unit.list();
        const unit = units.find(u => u.id === termination.unit_id);

        // Building laden
        const buildings = await base44.entities.Building.list();
        const building = buildings.find(b => b.id === unit?.building_id);

        // Kündigungsbrief generieren
        const letter = generateTerminationLetter({
            termination,
            lease,
            unit,
            building,
            landlord_name: user.full_name || user.email
        });

        // TerminationNotice aktualisieren
        await base44.entities.TerminationNotice.update(terminationNoticeId, {
            status: 'DRAFTED',
            served_date: new Date().toISOString().split('T')[0]
        });

        return new Response(JSON.stringify({
            success: true,
            letter_html: letter,
            termination_id: terminationNoticeId
        }), { status: 200 });

    } catch (error) {
        console.error('Error generating termination letter:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});

function generateTerminationLetter({ termination, lease, unit, building, landlord_name }) {
    const reasonText = {
        TENANT_REQUEST: 'auf Anfrage des Mieters',
        LANDLORD_REQUEST: 'aus eigenbedarf des Vermieters',
        BREACH: 'aufgrund von Vertragsverletzung',
        NON_PAYMENT: 'aufgrund unbezahlter Miete',
        END_OF_TERM: 'zum Ende des Mietvertrages'
    };

    return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Kündigungsschreiben</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; color: #333; line-height: 1.6; }
        .header { margin-bottom: 30px; }
        .date { text-align: right; margin-bottom: 20px; }
        .recipient { margin-bottom: 30px; }
        .content { margin: 30px 0; text-align: justify; }
        .footer { margin-top: 40px; }
        .signature { margin-top: 30px; }
    </style>
</head>
<body>
    <div class="date">
        ${new Date().toLocaleDateString('de-DE')}
    </div>

    <div class="recipient">
        <p><strong>${lease?.tenant_name}</strong></p>
        <p>${unit?.street_address}</p>
        <p>${unit?.postal_code} ${unit?.city}</p>
    </div>

    <p><strong>Kündigungsschreiben für Wohnraum</strong></p>

    <div class="content">
        <p>Sehr geehrte/r ${lease?.tenant_name?.split(' ')[0]},</p>

        <p>hiermit kündigen wir das Mietverhältnis über die Wohnung in ${building?.name}, Einheit ${unit?.unit_number} 
        ${reasonText[termination.reason]}</p>

        <p><strong>Kündigungsstichtag:</strong> ${new Date(termination.termination_date).toLocaleDateString('de-DE')}</p>

        <p><strong>Kündigungsfrist:</strong> ${termination.notice_period} Tage</p>

        ${termination.reason_details ? `
        <p><strong>Begründung:</strong><br/>
        ${termination.reason_details}</p>
        ` : ''}

        <p>Die Wohnung ist bis zum genannten Stichtag vollständig geräumt und besenrein an uns zurückzugeben. 
        Ein Übergabeprotokoll wird aufgestellt.</p>

        ${termination.handover_scheduled ? `
        <p><strong>Übergabetermin:</strong> ${new Date(termination.handover_scheduled).toLocaleDateString('de-DE')}</p>
        ` : ''}

        <p>Falls Sie Fragen haben, stehen wir Ihnen gerne zur Verfügung.</p>

        <p>Mit freundlichen Grüßen,</p>
    </div>

    <div class="signature">
        <p>${landlord_name}</p>
        <p>Vermieter</p>
        <p style="margin-top: 20px; border-top: 1px solid #000; padding-top: 10px;">
            Ort, Datum: _________________<br/>
            Unterschrift: _________________
        </p>
    </div>

    <p style="text-align: center; margin-top: 40px; font-size: 12px; color: #999;">
        Dokumenten-ID: ${new Date().getTime()}
    </p>
</body>
</html>
    `;
}