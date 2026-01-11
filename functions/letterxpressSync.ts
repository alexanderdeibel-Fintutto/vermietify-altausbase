import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    console.log('[letterxpressSync] Starting sync...');
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    console.log('[letterxpressSync] User authenticated:', user?.email);

    if (!user) {
      console.log('[letterxpressSync] No user found');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Hole LetterXpress-Zugangsdaten vom aktuellen User
    let creds = [];
    try {
      console.log('[letterxpressSync] Fetching credentials...');
      creds = await base44.entities.LetterXpressCredential.list();
      creds = creds.filter(c => c.created_by === user.email);
      console.log('[letterxpressSync] Found credentials:', creds.length);
    } catch (err) {
      console.log('[letterxpressSync] LetterXpressCredential entity may not exist:', err.message);
      // Continue without credentials (demo mode)
    }

    // If no credentials configured, return demo response
    if (!creds || creds.length === 0) {
      console.log('[letterxpressSync] No credentials - Demo mode');
      return Response.json({ 
        success: true,
        synced: 0,
        message: 'Demo-Modus: Bitte konfigurieren Sie Ihre LetterXpress-Zugangsdaten in den Einstellungen',
        isDemo: true
      });
    }

    const apiKey = creds[0].api_key;
    const username = creds[0].account_id;  // Username like "LXPApi62881"

    // Demo mode if no real credentials
    if (!apiKey || !username) {
      console.log('[letterxpressSync] Empty credentials - Demo mode');
      return Response.json({ 
        success: true,
        synced: 0,
        message: 'Demo-Modus: Zugangsdaten sind leer',
        isDemo: true
      });
    }

    // Für Demo: wenn keine echten Daten, gib leeres Array zurück
    if (apiKey === 'demo' || username === 'demo') {
      console.log('[letterxpressSync] Demo credentials detected');
      return Response.json({ 
        success: true, 
        synced: 0,
        message: 'Demo-Modus: Keine echten Daten verfügbar',
        isDemo: true
      });
    }

    // API-Call zu LetterXpress mit korrekter Authentifizierung (JSON Body mit username + api_key)
    console.log('[letterxpressSync] Calling LetterXpress API with username:', username);
    
    const authPayload = {
      username: username,  // e.g., "LXPApi62881"
      api_key: apiKey      // e.g., "435346ab6c70a1f05c4f9cc5416399f9fdc6556c92ab16a03eeee274f8d640d4"
    };

    console.log('[letterxpressSync] Auth payload:', { username: username, api_key: apiKey.substring(0, 10) + '...' });
    
    let response;
    try {
      response = await fetch('https://api.letterxpress.de/v1/shipments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(authPayload)
      });
      
      console.log('[letterxpressSync] API Response status:', response.status);
    } catch (fetchErr) {
      console.error('[letterxpressSync] Fetch error:', fetchErr.message);
      return Response.json({ 
        success: false,
        message: `Verbindung zu LetterXpress fehlgeschlagen: ${fetchErr.message}`
      }, { status: 500 });
    }
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[letterxpressSync] API error:', response.status, errorBody);
      return Response.json({ 
        success: false,
        error: 'LetterXpress API error',
        status: response.status,
        message: `LetterXpress API Fehler: ${response.status} - ${errorBody.substring(0, 200)}`
      }, { status: response.status });
    }

    let shipments = [];
    const responseText = await response.text();
    console.log('[letterxpressSync] Raw response:', responseText.substring(0, 500));
    
    try {
      const jsonData = JSON.parse(responseText);
      console.log('[letterxpressSync] Parsed JSON type:', typeof jsonData, 'is array:', Array.isArray(jsonData));
      
      // Handle different response formats
      if (Array.isArray(jsonData)) {
        shipments = jsonData;
        console.log('[letterxpressSync] Found array format, items:', jsonData.length);
      } else if (jsonData.shipments && Array.isArray(jsonData.shipments)) {
        shipments = jsonData.shipments;
        console.log('[letterxpressSync] Found shipments property, items:', jsonData.shipments.length);
      } else if (jsonData.data && Array.isArray(jsonData.data)) {
        shipments = jsonData.data;
        console.log('[letterxpressSync] Found data property, items:', jsonData.data.length);
      } else {
        console.log('[letterxpressSync] Unexpected response format. Keys:', Object.keys(jsonData).join(', '));
        console.log('[letterxpressSync] Full response:', JSON.stringify(jsonData).substring(0, 500));
      }
    } catch (parseErr) {
      console.error('[letterxpressSync] Error parsing JSON:', parseErr.message, 'Raw:', responseText.substring(0, 100));
    }
    
    console.log('[letterxpressSync] Starting to process', shipments.length, 'shipments');

    // Speichere/Update Versände in Datenbank
    let syncedCount = 0;
    let errorCount = 0;
    
    for (const shipment of shipments || []) {
      try {
        console.log('[letterxpressSync] Processing shipment:', shipment.id);
        
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
          console.log('[letterxpressSync] Created new shipment:', shipment.id);
          syncedCount++;
        } else {
          await base44.entities.LetterShipment.update(existing[0].id, {
            status: shipment.status || 'pending',
            delivery_date: shipment.delivered_date,
            tracking_number: shipment.tracking_number || '',
            letterxpress_data: JSON.stringify(shipment)
          });
          console.log('[letterxpressSync] Updated shipment:', shipment.id);
          syncedCount++;
        }
      } catch (itemError) {
        console.error('[letterxpressSync] Error syncing shipment', shipment.id, ':', itemError.message);
        errorCount++;
      }
    }

    const duration = Date.now() - startTime;
    console.log('[letterxpressSync] Sync completed in', duration, 'ms. Synced:', syncedCount, 'Errors:', errorCount);
    
    return Response.json({ 
      success: true, 
      synced: syncedCount,
      errors: errorCount,
      message: syncedCount > 0 ? `${syncedCount} Versände synchronisiert` : 'Keine Versände zu synchronisieren',
      duration
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[letterxpressSync] Fatal error:', error);
    return Response.json({ 
      success: false,
      error: error.message || 'Unknown error',
      message: 'Fehler beim Synchronisieren: ' + (error.message || 'Unbekannter Fehler'),
      duration
    }, { status: 500 });
  }
});