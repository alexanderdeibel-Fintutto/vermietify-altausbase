import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { proposalId } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Proposal laden
        const proposals = await base44.entities.RentIncreaseProposal.list();
        const proposal = proposals.find(p => p.id === proposalId);
        if (!proposal) {
            return new Response(JSON.stringify({ error: 'Proposal not found' }), { status: 404 });
        }

        // Unit & Building laden
        const units = await base44.entities.Unit.list();
        const unit = units.find(u => u.id === proposal.unit_id);
        const buildings = await base44.entities.Building.list();
        const building = buildings.find(b => b.id === proposal.building_id);

        // Anhänge generieren
        const letter = generateIncreaseNotice({
            proposal,
            unit,
            building,
            landlord_name: user.full_name || user.email
        });

        // Status aktualisieren
        await base44.entities.RentIncreaseProposal.update(proposalId, {
            status: 'PROPOSED',
            notice_date: new Date().toISOString().split('T')[0]
        });

        return new Response(JSON.stringify({
            success: true,
            letter_html: letter,
            proposal_id: proposalId
        }), { status: 200 });

    } catch (error) {
        console.error('Error generating rent increase notice:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});

function generateIncreaseNotice({ proposal, unit, building, landlord_name }) {
    const justificationTexts = {
        INDEX: `Die Mieterhöhung basiert auf dem Mietindex für ${new Date().getFullYear()}.`,
        MODERNIZATION: `Die Erhöhung ist aufgrund von Modernisierungsmaßnahmen gerechtfertigt.`,
        MARKET_ANALYSIS: `Basierend auf einer Marktanalyse entspricht die neue Miete den aktuellen Marktpreisen.`,
        OPERATING_COSTS: `Die Erhöhung berücksichtigt steigende Betriebskosten.`
    };

    return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Mieterhöhung</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; color: #333; line-height: 1.6; }
        .header { margin-bottom: 30px; }
        .date { text-align: right; margin-bottom: 20px; }
        .content { margin: 30px 0; text-align: justify; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table td { border: 1px solid #ddd; padding: 10px; }
        .signature { margin-top: 40px; }
    </style>
</head>
<body>
    <div class="date">
        ${new Date().toLocaleDateString('de-DE')}
    </div>

    <p><strong>Ankündigung einer Mieterhöhung</strong></p>

    <div class="content">
        <p>Sehr geehrte/r ${proposal.tenant_name?.split(' ')[0]},</p>

        <p>hiermit teilen wir Ihnen mit, dass wir die Miete für die Wohnung ${unit?.unit_number} 
        in ${building?.name} ab ${new Date(proposal.effective_date).toLocaleDateString('de-DE')} erhöhen möchten.</p>

        <table class="table">
            <tr>
                <td><strong>Aktuelle Miete:</strong></td>
                <td>€${proposal.current_rent.toFixed(2)}</td>
            </tr>
            <tr>
                <td><strong>Neue Miete:</strong></td>
                <td>€${proposal.proposed_rent.toFixed(2)}</td>
            </tr>
            <tr>
                <td><strong>Erhöhung:</strong></td>
                <td>€${proposal.increase_amount.toFixed(2)} (${proposal.increase_percentage.toFixed(1)}%)</td>
            </tr>
            <tr>
                <td><strong>Gültig ab:</strong></td>
                <td>${new Date(proposal.effective_date).toLocaleDateString('de-DE')}</td>
            </tr>
        </table>

        <p><strong>Begründung der Erhöhung:</strong></p>
        <p>${justificationTexts[proposal.justification] || 'Die Mieterhöhung ist berechtigt.'}</p>

        ${proposal.market_comparable_price ? `
        <p><strong>Marktvergleich:</strong><br/>
        Vergleichbare Immobilien in der Umgebung erzielen Mietpreise von ca. €${proposal.market_comparable_price.toFixed(2)}.
        Die neue Miete ist daher marktgerecht.</p>
        ` : ''}

        <p><strong>Kündigungsfrist:</strong><br/>
        Die Kündigungsfrist für diese Mieterhöhung beträgt ${proposal.notice_period_months} Monate 
        und läuft bis zum ${new Date(proposal.effective_date).toLocaleDateString('de-DE')}.</p>

        <p>Falls Sie gegen diese Mieterhöhung Einspruch erheben möchten, müssen Sie dies innerhalb 
        einer Frist von einem Monat nach Erhalt dieses Schreibens schriftlich mitteilen.</p>

        <p>Für Fragen stehe ich Ihnen gerne zur Verfügung.</p>

        <p>Mit freundlichen Grüßen,</p>
    </div>

    <div class="signature">
        <p>${landlord_name}</p>
        <p>Vermieter</p>
    </div>
</body>
</html>
    `;
}