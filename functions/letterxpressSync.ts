import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Hole LetterXpress-Zugangsdaten vom aktuellen User
    let creds = [];
    try {
      creds = await base44.entities.LetterXpressCredential.filter({
        created_by: user.email
      });
    } catch (err) {
      console.log('LetterXpressCredential entity may not exist yet');
    }

    if (!creds || creds.length === 0) {
      // Return empty list if no credentials configured (demo mode)
      return Response.json({ 
        success: true,
        synced: 0,
        message: 'Keine LetterXpress-Zugangsdaten konfiguriert - Demo-Modus'
      });
    }

    const apiKey = creds[0].api_key;
    const accountId = creds[0].account_id;

    if (!apiKey || !accountId) {
      return Response.json({ 
        success: false,
        error: 'LetterXpress credentials incomplete'
      }, { status: 400 });
    }

    // Für Demo: wenn keine echten Daten, gib leeres Array zurück
    if (apiKey === 'demo' || accountId === 'demo') {
      return Response.json({ 
        success: true, 
        synced: 0,
        message: 'Demo-Modus: Keine echten Daten'
      });
    }

    // API-Call zu LetterXpress
    const response = await fetch('https://www.letterxpress.de/api/v1/shipments', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Account-ID': accountId,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('LetterXpress API error:', response.status, errorBody);
      return Response.json({ 
        success: false,
        error: 'LetterXpress API error',
        status: response.status,
        message: 'Verbindung zu LetterXpress fehlgeschlagen'
      }, { status: 400 });
    }

    const shipments = await response.json();

    // Speichere/Update Versände in Datenbank
    let syncedCount = 0;
    for (const shipment of shipments || []) {
      try {
        const existing = await base44.entities.LetterShipment.filter({
          letterxpress_id: shipment.id
        });

        if (existing.length === 0) {
          await base44.entities.LetterShipment.create({
            letterxpress_id: shipment.id,
            recipient_name: shipment.recipient?.name || 'Unknown',
            recipient_address: `${shipment.recipient?.street || ''} ${shipment.recipient?.housenumber || ''}, ${shipment.recipient?.zipcode || ''} ${shipment.recipient?.city || ''}`.trim(),
            shipment_type: shipment.type || 'letter',
            status: shipment.status || 'pending',
            tracking_number: shipment.tracking_number || '',
            sent_date: shipment.sent_date,
            delivery_date: shipment.delivered_date,
            cost: shipment.price || 0,
            letterxpress_data: JSON.stringify(shipment)
          });
          syncedCount++;
        } else {
          await base44.entities.LetterShipment.update(existing[0].id, {
            status: shipment.status || 'pending',
            delivery_date: shipment.delivered_date,
            tracking_number: shipment.tracking_number || '',
            letterxpress_data: JSON.stringify(shipment)
          });
          syncedCount++;
        }
      } catch (itemError) {
        console.error('Error syncing shipment:', itemError);
      }
    }

    return Response.json({ 
      success: true, 
      synced: syncedCount,
      message: `${syncedCount} Versände synchronisiert`
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ 
      success: false,
      error: error.message || 'Unknown error',
      message: 'Fehler beim Synchronisieren'
    }, { status: 500 });
  }
});