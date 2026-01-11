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

    // Hole Versände von LetterXpress API
    console.log('[letterxpressSync] Fetching shipments from LetterXpress...');
    const letterxpressResponse = await fetch(`https://api.letterxpress.de/v1/shipments?api_key=${encodeURIComponent(cred.api_key)}&account_id=${encodeURIComponent(cred.account_id)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!letterxpressResponse.ok) {
      const error = await letterxpressResponse.text();
      console.error('[letterxpressSync] LetterXpress API error:', error);
      throw new Error(`LetterXpress API error: ${letterxpressResponse.status}`);
    }

    const letterxpressData = await letterxpressResponse.json();
    console.log('[letterxpressSync] Got shipments from LetterXpress:', letterxpressData);

    // Synchronisiere in LetterShipment-Entity
    const shipments = letterxpressData.shipments || [];
    let synced = 0;
    const errors = [];

    for (const shipment of shipments) {
      try {
        // Prüfe ob Versand bereits existiert
        const existing = await base44.entities.LetterShipment.filter({
          letterxpress_id: shipment.id
        });

        if (existing.length === 0) {
          // Erstelle neuen Versand
          await base44.entities.LetterShipment.create({
            letterxpress_id: shipment.id,
            recipient_name: shipment.recipient_name,
            recipient_address: shipment.recipient_address,
            shipment_type: shipment.type || 'letter',
            status: shipment.status || 'pending',
            tracking_number: shipment.tracking_number,
            sent_date: shipment.sent_date,
            delivery_date: shipment.delivery_date,
            cost: shipment.cost,
            letterxpress_data: JSON.stringify(shipment)
          });
          synced++;
        } else {
          // Update existierenden Versand
          await base44.entities.LetterShipment.update(existing[0].id, {
            status: shipment.status || 'pending',
            tracking_number: shipment.tracking_number,
            delivery_date: shipment.delivery_date,
            letterxpress_data: JSON.stringify(shipment)
          });
          synced++;
        }
      } catch (err) {
        console.error('[letterxpressSync] Error syncing shipment:', err);
        errors.push(shipment.id);
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