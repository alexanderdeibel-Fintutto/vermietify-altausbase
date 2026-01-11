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
    const accountId = creds[0].account_id;

    // Demo mode if no real credentials
    if (!apiKey || !accountId) {
      console.log('[letterxpressSync] Empty credentials - Demo mode');
      return Response.json({ 
        success: true,
        synced: 0,
        message: 'Demo-Modus: Zugangsdaten sind leer',
        isDemo: true
      });
    }

    // Für Demo: wenn keine echten Daten, gib leeres Array zurück
    if (apiKey === 'demo' || accountId === 'demo') {
      console.log('[letterxpressSync] Demo credentials detected');
      return Response.json({ 
        success: true, 
        synced: 0,
        message: 'Demo-Modus: Keine echten Daten verfügbar',
        isDemo: true
      });
    }

    // API-Call zu LetterXpress - versuche verschiedene Authentifizierungsmethoden
    console.log('[letterxpressSync] Calling LetterXpress API with account:', accountId);
    
    let response;
    
    // Versuche mit Bearer Token
    try {
      response = await fetch('https://api.letterxpress.de/v1/shipments', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[letterxpressSync] API Response status (Bearer):', response.status);
    } catch (fetchErr) {
      console.error('[letterxpressSync] Fetch error (Bearer):', fetchErr.message);
      
      // Fallback: versuche mit Basic Auth
      try {
        response = await fetch('https://api.letterxpress.de/v1/shipments', {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(accountId + ':' + apiKey)}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('[letterxpressSync] API Response status (Basic):', response.status);
      } catch (basicErr) {
        console.error('[letterxpressSync] Fetch error (Basic):', basicErr.message);
        return Response.json({ 
          success: false,
          message: `Verbindung zu LetterXpress fehlgeschlagen: ${basicErr.message}`
        }, { status: 500 });
      }
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
    console.log('[letterxpressSync] Sync completed in', duration, 'ms. Synced:', syncedCount);
    
    return Response.json({ 
      success: true, 
      synced: syncedCount,
      message: `${syncedCount} Versände synchronisiert`,
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