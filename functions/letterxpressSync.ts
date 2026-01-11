import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Hole gespeicherte LetterXpress-Daten
    const credentials = await base44.auth.updateMe({}, true); // Hole benutzerdaten
    const apiKey = credentials?.letterxpress_api_key;
    const accountId = credentials?.letterxpress_account_id;

    if (!apiKey || !accountId) {
      return Response.json({ error: 'LetterXpress credentials not configured' }, { status: 400 });
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
      return Response.json({ error: 'LetterXpress API error', status: response.status }, { status: 400 });
    }

    const shipments = await response.json();

    // Speichere/Update Versände in Datenbank
    for (const shipment of shipments) {
      const existing = await base44.entities.LetterShipment.filter({
        letterxpress_id: shipment.id
      });

      if (existing.length === 0) {
        await base44.entities.LetterShipment.create({
          letterxpress_id: shipment.id,
          recipient_name: shipment.recipient?.name,
          recipient_address: `${shipment.recipient?.street} ${shipment.recipient?.housenumber}, ${shipment.recipient?.zipcode} ${shipment.recipient?.city}`,
          shipment_type: shipment.type, // letter, registered, etc.
          status: shipment.status, // pending, sent, delivered, failed
          tracking_number: shipment.tracking_number,
          sent_date: shipment.sent_date,
          delivery_date: shipment.delivered_date,
          cost: shipment.price,
          letterxpress_data: JSON.stringify(shipment)
        });
      } else {
        // Update existing
        await base44.entities.LetterShipment.update(existing[0].id, {
          status: shipment.status,
          delivery_date: shipment.delivered_date,
          tracking_number: shipment.tracking_number,
          letterxpress_data: JSON.stringify(shipment)
        });
      }
    }

    return Response.json({ 
      success: true, 
      synced: shipments.length,
      message: `${shipments.length} Versände synchronisiert`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});