import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  console.log('[letterxpressSync] Function started');
  
  if (req.method !== 'POST') {
    return Response.json({ success: false, message: 'POST only' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.log('[letterxpressSync] User not authenticated');
      return Response.json({ success: false, message: 'Authentifizierung erforderlich' }, { status: 401 });
    }

    console.log('[letterxpressSync] User authenticated:', user.email);

    // Lade LetterXpress-Credentials
    console.log('[letterxpressSync] Loading LetterXpress credentials...');
    const credentials = await base44.entities.LetterXpressCredential.list();

    if (!credentials || credentials.length === 0) {
      console.log('[letterxpressSync] No LetterXpress credentials found');
      return Response.json({ 
        success: false, 
        message: 'Keine LetterXpress-Credentials konfiguriert' 
      }, { status: 400 });
    }

    const cred = credentials[0];
    console.log('[letterxpressSync] Using account:', cred.email);

    // Hole Versände von LetterXpress API (v2)
    console.log('[letterxpressSync] Fetching printjobs from LetterXpress...');
    const letterxpressResponse = await fetch('https://api.letterxpress.de/v2/printjobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        auth: {
          username: cred.account_id,
          apikey: cred.api_key,
          mode: 'live'
        }
      })
    });

    if (!letterxpressResponse.ok) {
      const error = await letterxpressResponse.text();
      console.error('[letterxpressSync] LetterXpress API error:', error);
      throw new Error(`LetterXpress API error: ${letterxpressResponse.status}`);
    }

    const letterxpressData = await letterxpressResponse.json();
    console.log('[letterxpressSync] Got printjobs from LetterXpress:', letterxpressData);

    // Synchronisiere in LetterShipment-Entity
    const printjobs = letterxpressData.data?.printjobs || [];
    let synced = 0;
    const errors = [];

    for (const job of printjobs) {
      try {
        // Jeder printjob kann mehrere items (Briefe) haben
        for (const item of job.items || []) {
          const letterxpress_id = `${job.id}-${printjobs.indexOf(job)}-${job.items.indexOf(item)}`;

          // Prüfe ob Versand bereits existiert
          const existing = await base44.entities.LetterShipment.filter({
            letterxpress_id: letterxpress_id
          });

          const shipmentData = {
            letterxpress_id: letterxpress_id,
            recipient_name: item.address?.split(',')[0] || 'Unbekannt',
            recipient_address: item.address || '',
            shipment_type: job.color === '1' ? 'letter' : 'color',
            status: item.status === 'sent' ? 'delivered' : (item.status === 'failed' ? 'failed' : 'pending'),
            tracking_number: job.id.toString(),
            cost: item.amount || 0,
            letterxpress_data: JSON.stringify({ job, item })
          };

          if (job.dispatch_date) {
            shipmentData.sent_date = job.dispatch_date;
          }
          if (job.updated_at) {
            shipmentData.delivery_date = item.status === 'sent' ? job.updated_at : null;
          }

          if (existing.length === 0) {
            await base44.entities.LetterShipment.create(shipmentData);
            synced++;
          } else {
            await base44.entities.LetterShipment.update(existing[0].id, shipmentData);
            synced++;
          }
        }
      } catch (err) {
        console.error('[letterxpressSync] Error syncing job:', err);
        errors.push(job.id);
      }
    }

    const message = errors.length > 0 
      ? `${synced} Versände synchronisiert, ${errors.length} Fehler`
      : `${synced} Versände erfolgreich synchronisiert`;

    console.log('[letterxpressSync] Sync complete:', message);
    return Response.json({
      success: true,
      synced,
      message,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('[letterxpressSync] Error:', error);
    return Response.json({ 
      success: false,
      message: 'Fehler: ' + error.message
    }, { status: 500 });
  }
});