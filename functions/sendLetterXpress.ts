import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const corsHeaders = { 
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json(
        { success: false, error: 'Nicht autorisiert' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.json();
    
    const {
      recipient,
      document_url,
      letter_type = 'standard',
      color = false,
      duplex = true
    } = body;
    
    if (!recipient || !document_url) {
      return Response.json(
        { success: false, error: 'Recipient und document_url erforderlich' },
        { status: 400, headers: corsHeaders }
      );
    }

    const apiKey = Deno.env.get('LETTERXPRESS_API_KEY');
    if (!apiKey) {
      return Response.json(
        { success: false, error: 'LetterXpress API Key nicht konfiguriert' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Call LetterXpress API
    const letterxpressResponse = await fetch('https://api.letterxpress.de/v1/letters', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        recipient: {
          name: recipient.name,
          street: recipient.street,
          zip: recipient.zip,
          city: recipient.city,
          country: recipient.country || 'DE'
        },
        document_url,
        letter_type,
        color,
        duplex
      })
    });
    
    if (!letterxpressResponse.ok) {
      const errorText = await letterxpressResponse.text();
      throw new Error(`LetterXpress API Error: ${errorText}`);
    }
    
    const result = await letterxpressResponse.json();
    
    // Save shipment record
    await base44.entities.LetterShipment.create({
      recipient_name: recipient.name,
      recipient_address: `${recipient.street}, ${recipient.zip} ${recipient.city}`,
      document_url,
      tracking_code: result.id,
      status: result.status || 'pending',
      letter_type,
      cost: result.cost || 0
    });
    
    return Response.json(
      { 
        success: true, 
        letter_id: result.id, 
        status: result.status,
        tracking_url: result.tracking_url 
      }, 
      { headers: corsHeaders }
    );
    
  } catch (error) {
    return Response.json(
      { success: false, error: error.message }, 
      { status: 500, headers: corsHeaders }
    );
  }
});