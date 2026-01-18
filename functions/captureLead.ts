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
    const { email, name, phone, source, marketing_consent, utm_source, utm_medium, utm_campaign, property_count, unit_count } = body;

    if (!email || !isValidEmail(email)) {
      return Response.json({ success: false, error: 'Ungültige E-Mail' }, { status: 400, headers: corsHeaders });
    }

    if (!source) {
      return Response.json({ success: false, error: 'Source erforderlich' }, { status: 400, headers: corsHeaders });
    }

    const existing = await base44.asServiceRole.entities.Lead.filter({ email: email.toLowerCase().trim() });
    let lead, isNew = true;

    if (existing.length > 0) {
      lead = existing[0];
      isNew = false;
      const updatedScore = calculateLeadScore({ ...lead, ...body });
      await base44.asServiceRole.entities.Lead.update(lead.id, {
        last_activity_at: new Date().toISOString(),
        score: updatedScore,
        name: name || lead.name,
        phone: phone || lead.phone
      });
    } else {
      lead = await base44.asServiceRole.entities.Lead.create({
        email: email.toLowerCase().trim(),
        name: name || null,
        phone: phone || null,
        source,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        status: 'new',
        score: calculateLeadScore(body),
        marketing_consent: marketing_consent || false,
        consent_date: marketing_consent ? new Date().toISOString() : null,
        property_count: property_count || null,
        unit_count: unit_count || null,
        tags: '[]',
        last_activity_at: new Date().toISOString()
      });
    }

    return Response.json({ 
      success: true, 
      lead_id: lead.id, 
      is_new: isNew, 
      score: lead.score 
    }, { headers: corsHeaders });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function calculateLeadScore(data) {
  let score = 10;
  if (data.name) score += 10;
  if (data.phone) score += 15;
  if (data.property_count > 0) score += Math.min(data.property_count * 5, 25);
  if (data.unit_count > 5) score += 15;
  if (data.marketing_consent) score += 10;
  return Math.min(score, 100);
}