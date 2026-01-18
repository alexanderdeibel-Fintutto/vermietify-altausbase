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
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { recipient, document_url, letter_type = 'standard' } = await req.json();

    if (!recipient || !document_url) {
      return Response.json({ success: false, error: 'Empfänger und Dokument-URL erforderlich' }, { status: 400, headers: corsHeaders });
    }

    const apiKey = Deno.env.get('LETTERXPRESS_API_KEY');
    
    if (!apiKey) {
      return Response.json({ success: false, error: 'LetterXpress API Key nicht konfiguriert' }, { status: 500, headers: corsHeaders });
    }

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
        color: false,
        duplex: true
      })
    });

    const result = await letterxpressResponse.json();

    await base44.asServiceRole.entities.LetterShipment.create({
      empfaenger_name: recipient.name,
      empfaenger_adresse: `${recipient.street}, ${recipient.zip} ${recipient.city}`,
      letterxpress_id: result.id,
      tracking_nummer: result.tracking_number,
      status: 'Versendet',
      versand_datum: new Date().toISOString()
    });

    return Response.json({ 
      success: true, 
      letter_id: result.id, 
      status: result.status 
    }, { headers: corsHeaders });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
});