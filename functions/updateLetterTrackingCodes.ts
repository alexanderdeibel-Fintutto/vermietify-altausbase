import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Automatischer Job zum Aktualisieren von Tracking-Codes
 * Sollte täglich oder mehrmals täglich laufen
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // Admin-Check für automatische Jobs
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // Credentials laden
        const credentials = await base44.asServiceRole.entities.LetterXpressCredential.filter({ is_active: true });
        if (credentials.length === 0) {
            return Response.json({ error: 'LetterXpress nicht konfiguriert' }, { status: 400 });
        }

        const cred = credentials[0];
        const auth = {
            username: cred.username,
            apikey: cred.api_key,
            mode: cred.mode
        };

        // Alle Shipments ohne Tracking-Code der letzten 7 Tage
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const shipments = await base44.asServiceRole.entities.LetterShipment.filter({});
        const pendingShipments = shipments.filter(s => 
            !s.tracking_code && 
            new Date(s.created_date) > sevenDaysAgo
        );

        let updated = 0;
        const errors = [];

        for (const shipment of pendingShipments) {
            try {
                const response = await fetch(`https://api.letterxpress.de/v3/printjobs/${shipment.lxp_job_id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ auth })
                });

                const data = await response.json();
                
                if (data.status === 200 && data.data.items[0]) {
                    const item = data.data.items[0];
                    const updates = {
                        status: data.data.status
                    };

                    if (item.tracking_code) {
                        updates.tracking_code = item.tracking_code;
                        updated++;
                    }

                    await base44.asServiceRole.entities.LetterShipment.update(shipment.id, updates);
                }
            } catch (error) {
                errors.push({
                    shipment_id: shipment.id,
                    lxp_job_id: shipment.lxp_job_id,
                    error: error.message
                });
            }
        }

        return Response.json({ 
            success: true, 
            checked: pendingShipments.length,
            updated_count: updated,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Tracking update error:', error);
        return Response.json({ 
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
});