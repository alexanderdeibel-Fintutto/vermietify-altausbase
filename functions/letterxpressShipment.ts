import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data } = await req.json();

    if (action === 'createShipment') {
      const { recipients, templateId, buildingId } = data;

      // Erstelle LetterShipment Einträge
      const shipments = [];
      for (const recipient of recipients) {
        const shipment = await base44.entities.LetterShipment.create({
          recipient_name: recipient.full_name || recipient.name,
          recipient_address: `${recipient.address_history?.[0]?.street || ''} ${recipient.address_history?.[0]?.postal_code || ''} ${recipient.address_history?.[0]?.city || ''}`.trim(),
          document_type: templateId,
          shipping_type: 'normal',
          color: '4',
          pages: 4,
          cost_gross: 1.50,
          status: 'queue',
          building_id: buildingId,
        });
        shipments.push(shipment);
      }

      return Response.json({
        success: true,
        shipments,
        message: `${shipments.length} Briefe erstellt und in Warteschlange eingefügt`,
      });
    }

    if (action === 'cancelShipment') {
      const { shipmentId } = data;
      await base44.entities.LetterShipment.update(shipmentId, {
        status: 'canceled',
      });
      return Response.json({ success: true, message: 'Brief storniert' });
    }

    if (action === 'trackShipment') {
      const { trackingCode } = data;
      // Mock tracking update
      return Response.json({
        success: true,
        tracking: {
          code: trackingCode,
          status: 'in_transit',
          lastUpdate: new Date().toISOString(),
          estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE'),
        },
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('LetterXpress error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});