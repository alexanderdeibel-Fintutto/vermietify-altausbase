import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { leaseContractId, protocolData } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // LeaseContract laden
        const leases = await base44.entities.LeaseContract.list();
        const lease = leases.find(l => l.id === leaseContractId);
        if (!lease) {
            return new Response(JSON.stringify({ error: 'Lease not found' }), { status: 404 });
        }

        // Unit laden
        const units = await base44.entities.Unit.list();
        const unit = units.find(u => u.id === lease.unit_id);

        // HandoverProtocol erstellen
        const protocol = {
            lease_contract_id: leaseContractId,
            unit_id: lease.unit_id,
            protocol_type: protocolData.protocol_type || 'MOVE_IN',
            date: protocolData.date || new Date().toISOString().split('T')[0],
            tenant_name: protocolData.tenant_name || lease.tenant_name,
            room_condition: protocolData.room_condition || 'GOOD',
            meter_readings: protocolData.meter_readings || {},
            inventory_items: protocolData.inventory_items || [],
            damage_report: protocolData.damage_report || '',
            signatures_obtained: false
        };

        const created = await base44.entities.HandoverProtocol.create(protocol);

        // HTML generieren
        const html = generateProtocolHTML(created, unit, lease);

        return new Response(JSON.stringify({
            success: true,
            protocol_id: created.id,
            html_content: html,
            protocol: created
        }), { status: 200 });

    } catch (error) {
        console.error('Error generating handover protocol:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});

function generateProtocolHTML(protocol, unit, lease) {
    return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Übergabeprotokoll</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 900px; margin: 20px auto; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .section-title { font-weight: bold; font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 8px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .signature-block { margin-top: 30px; display: flex; gap: 100px; }
        .signature { border-top: 1px solid #000; padding-top: 10px; min-width: 150px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ÜBERGABEPROTOKOLL</h1>
        <p>${protocol.protocol_type === 'MOVE_IN' ? 'Einzugsprotokoll' : 'Auszugsprotokoll'}</p>
    </div>

    <div class="section">
        <div class="section-title">Objektdaten</div>
        <table>
            <tr><td><strong>Adresse:</strong></td><td>${unit?.street_address}, ${unit?.postal_code} ${unit?.city}</td></tr>
            <tr><td><strong>Wohnfläche:</strong></td><td>${unit?.living_area} m²</td></tr>
            <tr><td><strong>Übergabedatum:</strong></td><td>${new Date(protocol.date).toLocaleDateString('de-DE')}</td></tr>
            <tr><td><strong>Zustand:</strong></td><td>${protocol.room_condition}</td></tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Mieterdaten</div>
        <table>
            <tr><td><strong>Name:</strong></td><td>${protocol.tenant_name}</td></tr>
            <tr><td><strong>Mietbeginn:</strong></td><td>${new Date(lease.start_date).toLocaleDateString('de-DE')}</td></tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Zählerstand</div>
        <table>
            <tr><th>Zähler</th><th>Stand</th></tr>
            <tr><td>Strom (kWh)</td><td>${protocol.meter_readings?.electricity || '___________'}</td></tr>
            <tr><td>Gas (m³)</td><td>${protocol.meter_readings?.gas || '___________'}</td></tr>
            <tr><td>Wasser (m³)</td><td>${protocol.meter_readings?.water || '___________'}</td></tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Inventar & Ausstattung</div>
        <table>
            <tr><th>Gegenstand</th><th>Zustand</th><th>Notizen</th></tr>
            ${protocol.inventory_items?.map(item => `
                <tr>
                    <td>${item.item}</td>
                    <td>${item.condition}</td>
                    <td>${item.notes || ''}</td>
                </tr>
            `).join('') || '<tr><td colspan="3">Keine Einträge</td></tr>'}
        </table>
    </div>

    <div class="section">
        <div class="section-title">Mängel & Schäden</div>
        <div style="border: 1px solid #ddd; padding: 10px; min-height: 80px; white-space: pre-wrap;">
${protocol.damage_report || 'Keine Mängel festgestellt'}
        </div>
    </div>

    <div class="signature-block">
        <div class="signature">
            <p><strong>Mieter</strong></p>
            <p>Ort, Datum: ________________</p>
            <p>Unterschrift: ________________</p>
        </div>
        <div class="signature">
            <p><strong>Vermieter</strong></p>
            <p>Ort, Datum: ${new Date().toLocaleDateString('de-DE')}</p>
            <p>Unterschrift: ________________</p>
        </div>
    </div>

    <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
        Protokoll generiert am ${new Date().toLocaleString('de-DE')}
    </p>
</body>
</html>
    `.trim();
}