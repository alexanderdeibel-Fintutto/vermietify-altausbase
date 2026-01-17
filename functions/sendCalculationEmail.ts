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
    const body = await req.json();
    
    const {
      email,
      calculator_type,
      result
    } = body;
    
    if (!email || !calculator_type || !result) {
      return Response.json(
        { success: false, error: 'Email, calculator_type und result erforderlich' },
        { status: 400, headers: corsHeaders }
      );
    }

    const calculatorLabels = {
      'rendite': 'Rendite-Rechner',
      'afa': 'AfA-Rechner',
      'indexmiete': 'Indexmieten-Rechner',
      'cashflow': 'Cashflow-Rechner',
      'kaufpreis': 'Kaufpreis-Rechner',
      'tilgung': 'Tilgungs-Rechner'
    };

    const subject = `Ihre ${calculatorLabels[calculator_type]} Berechnung`;
    
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #334155; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1E3A8A 0%, #F97316 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #E2E8F0; }
    .result { background: #EEF2FF; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .result-value { font-size: 32px; font-weight: bold; color: #1E3A8A; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">vermitify</h1>
      <p style="margin: 10px 0 0;">Ihre Berechnung</p>
    </div>
    
    <div class="content">
      <h2>${calculatorLabels[calculator_type]}</h2>
      
      <div class="result">
        <div style="font-size: 14px; color: #64748B; margin-bottom: 8px;">ERGEBNIS</div>
        <div class="result-value">${JSON.stringify(result)}</div>
      </div>
      
      <p>Diese Berechnung wurde mit den kostenlosen Tools von vermitify erstellt.</p>
      
      <p>Möchten Sie mehr? Mit vermitify Professional erhalten Sie:</p>
      <ul>
        <li>✓ Unbegrenzt Objekte verwalten</li>
        <li>✓ Automatische Anlage V Erstellung</li>
        <li>✓ BK-Abrechnungen automatisch</li>
        <li>✓ Alle Berechnungen gespeichert</li>
      </ul>
      
      <center style="margin-top: 30px;">
        <a href="https://app.vermitify.de/signup" style="display: inline-block; background: linear-gradient(135deg, #1E3A8A 0%, #F97316 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Jetzt 14 Tage kostenlos testen
        </a>
      </center>
    </div>
  </div>
</body>
</html>
    `;

    await base44.integrations.Core.SendEmail({
      to: email,
      subject,
      body: htmlBody,
      from_name: 'vermitify Tools'
    });

    return Response.json({ success: true }, { headers: corsHeaders });
    
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});