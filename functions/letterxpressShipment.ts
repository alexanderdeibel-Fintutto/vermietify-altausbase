import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, shipmentId, documentId, recipientData, options } = await req.json();

    switch (action) {
      case 'create': {
        // Create LetterXpress shipment
        const shipment = await base44.entities.LetterShipment.create({
          document_id: documentId,
          building_id: recipientData.buildingId,
          recipient_name: recipientData.name,
          recipient_address: `${recipientData.street} ${recipientData.houseNumber}, ${recipientData.postalCode} ${recipientData.city}`,
          document_type: options.templateType,
          filename: `Brief_${Date.now()}.pdf`,
          pages: options.pages || 1,
          color: options.color || '1',
          print_mode: options.printMode || 'duplex',
          shipping_type: options.shippingType || 'normal',
          cost_net: options.costNet || 0,
          cost_gross: options.costGross || 0,
          status: 'queue',
        });
        return Response.json({ success: true, shipment });
      }

      case 'sendNow': {
        // Mark as sent and generate tracking
        const trackingCode = `DHL${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const updated = await base44.entities.LetterShipment.update(shipmentId, {
          status: 'sent',
          tracking_code: trackingCode,
          sent_at: new Date().toISOString(),
        });
        return Response.json({ success: true, shipment: updated });
      }

      case 'cancel': {
        await base44.entities.LetterShipment.update(shipmentId, {
          status: 'canceled',
        });
        return Response.json({ success: true });
      }

      case 'getStats': {
        const shipments = await base44.entities.LetterShipment.list();
        return Response.json({
          total: shipments.length,
          sent: shipments.filter(s => s.status === 'sent').length,
          pending: shipments.filter(s => ['queue', 'done'].includes(s.status)).length,
          costs: shipments.reduce((sum, s) => sum + (s.cost_gross || 0), 0),
        });
      }

      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});