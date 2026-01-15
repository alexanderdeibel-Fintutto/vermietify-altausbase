import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { proposalId } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // RentIncreaseProposal laden
        const proposals = await base44.entities.RentIncreaseProposal.list();
        const proposal = proposals.find(p => p.id === proposalId);
        if (!proposal) {
            return new Response(JSON.stringify({ error: 'Proposal not found' }), { status: 404 });
        }

        // Building & Unit für Adressdaten
        const units = await base44.entities.Unit.list();
        const unit = units.find(u => u.id === proposal.unit_id);
        const buildings = await base44.entities.Building.list();
        const building = buildings.find(b => b.id === unit?.building_id);

        const letterContent = generateLetterHTML({
            proposal,
            unit,
            building,
            ownerEmail: user.email
        });

        return new Response(JSON.stringify({
            success: true,
            letterContent,
            proposalId
        }), { status: 200 });

    } catch (error) {
        console.error('Error generating letter:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});

function generateLetterHTML({ proposal, unit, building, ownerEmail }) {
    const today = new Date().toLocaleDateString('de-DE');
    const effectiveDate = new Date(proposal.effective_date).toLocaleDateString('de-DE', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
    });

    return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Mieterhöhung</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .header { margin-bottom: 30px; }
        .date { text-align: right; margin-bottom: 20px; }
        .recipient { margin-bottom: 20px; }
        .content { margin-bottom: 20px; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table td { padding: 8px; border: 1px solid #ddd; }
        .footer { margin-top: 40px; font-size: 0.9em; }
        .legal { color: #666; font-size: 0.85em; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="date">${today}</div>

    <div class="header">
        <h2>Mitteilung über Mieterhöhung gemäß § 558 BGB</h2>
    </div>

    <div class="recipient">
        <p><strong>${proposal.tenant_email}</strong><br>
        ${unit?.street_address || ''}<br>
        ${unit?.postal_code || ''} ${unit?.city || ''}</p>
    </div>

    <div class="content">
        <p>Sehr geehrte Damen und Herren,</p>
        
        <p>hiermit teilen wir Ihnen mit, dass die Miete für die von Ihnen gemietete Wohnung/das Objekt</p>
        
        <p><strong>${building?.name || 'Objekt'}<br>
        Einheit: ${unit?.unit_number || ''}</strong></p>
        
        <p>zum <strong>${effectiveDate}</strong> erhöht wird.</p>

        <table class="table">
            <tr>
                <td><strong>Bisherige Miete</strong></td>
                <td style="text-align: right"><strong>€ ${proposal.current_rent.toFixed(2)}/Monat</strong></td>
            </tr>
            <tr>
                <td><strong>Neue Miete</strong></td>
                <td style="text-align: right"><strong>€ ${proposal.new_rent.toFixed(2)}/Monat</strong></td>
            </tr>
            <tr>
                <td><strong>Mieterhöhung</strong></td>
                <td style="text-align: right"><strong>€ ${proposal.increase_amount.toFixed(2)}/Monat (${proposal.increase_percentage.toFixed(1)}%)</strong></td>
            </tr>
        </table>

        <p><strong>Begründung der Mieterhöhung:</strong></p>
        <p>${getCalculationReason(proposal)}</p>

        <div class="legal">
            <p><strong>Ihre Rechte:</strong></p>
            <ul>
                <li>Sie können dieser Mieterhöhung schriftlich widersprechen (innerhalb von einem Monat nach Zugang).</li>
                <li>Die Mieterhöhung muss begründet sein und darf in 3 Jahren 20% nicht übersteigen (§ 558 Abs. 3 BGB).</li>
                <li>Bei Widerspruch können Sie ein Schiedsverfahren verlangen.</li>
            </ul>
            <p>Für Rückfragen stehe ich Ihnen gerne zur Verfügung.</p>
        </div>
    </div>

    <div class="footer">
        <p>Mit freundlichen Grüßen<br><br>
        ${ownerEmail}</p>
    </div>
</body>
</html>
    `;
}

function getCalculationReason(proposal) {
    switch (proposal.calculation_method) {
        case 'INDEX':
            return `Die Mieterhöhung erfolgt gemäß Mietindex auf Basis der aktuellen Indexwertentwicklung.`;
        case 'PERCENTAGE':
            return `Die Mieterhöhung erfolgt um ${proposal.increase_percentage.toFixed(1)}% zur Anpassung an die Marktsituation.`;
        case 'MARKET':
            return `Die Mieterhöhung erfolgt zur Anpassung an die ortsübliche Vergleichsmiete (§ 558 Abs. 2 BGB). Die Vergleichsmiete für vergleichbare Wohnungen in der Gemeinde liegt bei € ${proposal.market_rent?.toFixed(2) || 'X'}/Monat.`;
        default:
            return `Die Mieterhöhung wurde nach Überprüfung aller Marktgegebenheiten festgesetzt.`;
    }
}