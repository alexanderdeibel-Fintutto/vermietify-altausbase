import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { entityType, entityId, docType } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user?.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 });
        }

        let documentContent = '';
        let documentTitle = '';

        if (docType === 'rent_reminder' && entityType === 'LeaseContract') {
            const leases = await base44.entities.LeaseContract.list();
            const lease = leases.find(l => l.id === entityId);
            if (lease) {
                documentTitle = `Miet-Zahlungsaufforderung ${lease.tenant_name}`;
                documentContent = generateRentReminder(lease);
            }
        } else if (docType === 'deposit_receipt' && entityType === 'Deposit') {
            const deposits = await base44.entities.DepositManagement.list();
            const deposit = deposits.find(d => d.id === entityId);
            if (deposit) {
                const leases = await base44.entities.LeaseContract.list();
                const lease = leases.find(l => l.id === deposit.lease_contract_id);
                documentTitle = `Kautionsbestätigung ${lease?.tenant_name}`;
                documentContent = generateDepositReceipt(deposit, lease);
            }
        } else if (docType === 'operating_costs' && entityType === 'OperatingCostStatement') {
            const statements = await base44.entities.OperatingCostStatement.list();
            const statement = statements.find(s => s.id === entityId);
            if (statement) {
                documentTitle = `Nebenkostenabrechnung ${statement.abrechnungsjahr}`;
                documentContent = generateOperatingCostDoc(statement);
            }
        }

        // Dokument generieren & speichern
        const generatedDoc = await base44.entities.GeneratedDocument.create({
            entity_type: entityType,
            entity_id: entityId,
            doc_type: docType,
            title: documentTitle,
            content: documentContent,
            status: 'generated',
            created_at: new Date().toISOString()
        });

        return new Response(JSON.stringify({
            success: true,
            document_id: generatedDoc.id,
            title: documentTitle
        }), { status: 200 });

    } catch (error) {
        console.error('Document generation error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});

function generateRentReminder(lease) {
    return `
<!DOCTYPE html>
<html lang="de">
<body style="font-family: Arial; max-width: 600px; margin: 0 auto;">
    <p>Sehr geehrte/r ${lease.tenant_name},</p>
    <p>wir möchten Sie hiermit an die fällige Mietzahlung erinnern:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd;">Miete</td>
            <td style="padding: 10px; border: 1px solid #ddd;">€${lease.monthly_rent.toFixed(2)}</td>
        </tr>
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Fällig am</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${new Date().toLocaleDateString('de-DE')}</td>
        </tr>
    </table>
    
    <p>Bitte überweisen Sie den Betrag auf das in Ihrem Mietvertrag angegebene Konto.</p>
    <p>Bei Fragen stehe ich Ihnen gerne zur Verfügung.</p>
    <p>Mit freundlichen Grüßen,<br/>Ihre Hausverwaltung</p>
</body>
</html>
    `;
}

function generateDepositReceipt(deposit, lease) {
    return `
<!DOCTYPE html>
<html lang="de">
<body style="font-family: Arial; max-width: 600px; margin: 0 auto;">
    <h2>Kautionsbestätigung</h2>
    <p>Sehr geehrte/r ${lease?.tenant_name},</p>
    <p>wir bestätigen den Erhalt folgender Kaution:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd;">Betrag</td>
            <td style="padding: 10px; border: 1px solid #ddd;">€${deposit.amount.toFixed(2)}</td>
        </tr>
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Eingangsdatum</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${new Date(deposit.payment_date).toLocaleDateString('de-DE')}</td>
        </tr>
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">Status</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${deposit.status}</td>
        </tr>
    </table>
    
    <p>Die Kaution wird gemäß Mietvertrag verwahrt und bei Beendigung des Mietverhältnisses zurückgegeben.</p>
</body>
</html>
    `;
}

function generateOperatingCostDoc(statement) {
    return `
<!DOCTYPE html>
<html lang="de">
<body style="font-family: Arial; max-width: 600px; margin: 0 auto;">
    <h2>Nebenkostenabrechnung ${statement.abrechnungsjahr}</h2>
    <p>Abrechnung für den Zeitraum ${new Date(statement.zeitraum_von).toLocaleDateString('de-DE')} 
    bis ${new Date(statement.zeitraum_bis).toLocaleDateString('de-DE')}</p>
    
    <p><strong>Gesamtkosten:</strong> €${statement.gesamtkosten.toFixed(2)}</p>
    <p><strong>Vorauszahlungen:</strong> €${statement.gesamtvorauszahlungen.toFixed(2)}</p>
    
    ${statement.gesamtergebnis > 0 
        ? `<p style="color: green;"><strong>Nachzahlung fällig:</strong> €${statement.gesamtergebnis.toFixed(2)}</p>`
        : `<p style="color: blue;"><strong>Guthaben:</strong> €${Math.abs(statement.gesamtergebnis).toFixed(2)}</p>`
    }
</body>
</html>
    `;
}