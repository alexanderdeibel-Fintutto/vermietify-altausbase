import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const LXP_API_BASE = 'https://api.letterxpress.de/v3';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, ...params } = await req.json();

        // Credentials laden
        const credentials = await base44.entities.LetterXpressCredential.filter({ is_active: true });
        if (credentials.length === 0) {
            return Response.json({ error: 'LetterXpress nicht konfiguriert' }, { status: 400 });
        }

        const cred = credentials[0];
        const auth = {
            username: cred.username,
            apikey: cred.api_key,
            mode: cred.mode
        };

        switch (action) {
            case 'check_balance': {
                const response = await fetch(`${LXP_API_BASE}/balance`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ auth })
                });

                const data = await response.json();
                
                if (data.status === 200) {
                    // Guthaben in DB aktualisieren
                    await base44.entities.LetterXpressCredential.update(cred.id, {
                        balance: data.data.balance,
                        last_balance_check: new Date().toISOString()
                    });

                    return Response.json({ 
                        success: true, 
                        balance: data.data.balance,
                        currency: data.data.currency
                    });
                }

                return Response.json({ error: data.message }, { status: data.status });
            }

            case 'calculate_price': {
                const { pages, color, mode, shipping, registered } = params;

                const response = await fetch(`${LXP_API_BASE}/price`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        auth,
                        letter: {
                            specification: {
                                pages,
                                color,
                                mode,
                                shipping: shipping || 'national',
                                c4: 0
                            },
                            registered: registered || undefined
                        }
                    })
                });

                const data = await response.json();
                
                if (data.status === 200) {
                    return Response.json({ 
                        success: true, 
                        price: data.data.price
                    });
                }

                return Response.json({ error: data.message }, { status: data.status });
            }

            case 'send_letter': {
                const { 
                    pdf_base64, 
                    checksum, 
                    filename, 
                    color, 
                    mode, 
                    registered,
                    dispatch_date,
                    notice,
                    document_id,
                    building_id,
                    recipient_address,
                    document_type
                } = params;

                const response = await fetch(`${LXP_API_BASE}/printjobs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        auth,
                        letter: {
                            base64_file: pdf_base64,
                            base64_file_checksum: checksum,
                            specification: {
                                color: color || '1',
                                mode: mode || 'simplex',
                                shipping: 'national',
                                c4: 0
                            },
                            filename_original: filename,
                            registered: registered === 'normal' ? undefined : registered,
                            dispatch_date: dispatch_date || undefined,
                            notice: notice || undefined
                        }
                    })
                });

                const data = await response.json();
                
                if (data.status === 200) {
                    const jobData = data.data;
                    const item = jobData.items[0];

                    // Postausgangsbuch-Eintrag erstellen
                    const shipment = await base44.entities.LetterShipment.create({
                        lxp_job_id: jobData.id,
                        document_id,
                        building_id,
                        recipient_name: item.address.split(',')[0],
                        recipient_address: item.address,
                        document_type,
                        filename,
                        pages: item.pages,
                        color: color || '1',
                        print_mode: mode || 'simplex',
                        shipping_type: registered || 'normal',
                        dispatch_date: jobData.dispatch_date,
                        status: jobData.status,
                        cost_net: item.amount,
                        cost_gross: item.amount + item.vat,
                        notice: notice,
                        sent_at: new Date().toISOString()
                    });

                    // Guthaben aktualisieren
                    const newBalance = cred.balance - (item.amount + item.vat);
                    await base44.entities.LetterXpressCredential.update(cred.id, {
                        balance: newBalance
                    });

                    return Response.json({ 
                        success: true, 
                        job_id: jobData.id,
                        shipment_id: shipment.id,
                        cost_gross: item.amount + item.vat,
                        status: jobData.status
                    });
                }

                return Response.json({ error: data.message || 'Versand fehlgeschlagen' }, { status: data.status || 500 });
            }

            case 'get_job': {
                const { job_id } = params;

                const response = await fetch(`${LXP_API_BASE}/printjobs/${job_id}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ auth })
                });

                const data = await response.json();
                
                if (data.status === 200) {
                    return Response.json({ 
                        success: true, 
                        job: data.data
                    });
                }

                return Response.json({ error: data.message }, { status: data.status });
            }

            case 'update_tracking': {
                // Alle Shipments ohne Tracking-Code laden
                const shipments = await base44.entities.LetterShipment.filter({
                    tracking_code: null
                });

                let updated = 0;

                for (const shipment of shipments) {
                    try {
                        const response = await fetch(`${LXP_API_BASE}/printjobs/${shipment.lxp_job_id}`, {
                            method: 'GET',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ auth })
                        });

                        const data = await response.json();
                        
                        if (data.status === 200 && data.data.items[0].tracking_code) {
                            await base44.entities.LetterShipment.update(shipment.id, {
                                tracking_code: data.data.items[0].tracking_code,
                                status: data.data.items[0].status
                            });
                            updated++;
                        }
                    } catch (error) {
                        console.error(`Tracking update failed for job ${shipment.lxp_job_id}:`, error);
                    }
                }

                return Response.json({ 
                    success: true, 
                    updated_count: updated
                });
            }

            default:
                return Response.json({ error: 'Unknown action' }, { status: 400 });
        }

    } catch (error) {
        console.error('LetterXpress function error:', error);
        return Response.json({ 
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
});