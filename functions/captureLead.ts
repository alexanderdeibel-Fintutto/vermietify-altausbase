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
    
    // Validation
    if (!body.email || !isValidEmail(body.email)) {
      return Response.json(
        { success: false, error: 'Ungültige E-Mail-Adresse' }, 
        { status: 400, headers: corsHeaders }
      );
    }
    
    if (!body.source) {
      return Response.json(
        { success: false, error: 'Source erforderlich' }, 
        { status: 400, headers: corsHeaders }
      );
    }
    
    const email = body.email.toLowerCase().trim();
    
    // Check if lead already exists
    const existing = await base44.asServiceRole.entities.Lead.filter({ email });
    
    let lead;
    let isNew = true;
    
    if (existing.length > 0) {
      // Update existing lead
      lead = existing[0];
      isNew = false;
      
      const updatedScore = calculateLeadScore({ ...lead, ...body });
      
      await base44.asServiceRole.entities.Lead.update(lead.id, {
        last_activity_at: new Date().toISOString(),
        score: updatedScore,
        ...(body.name && { name: body.name }),
        ...(body.phone && { phone: body.phone }),
        ...(body.company && { company: body.company }),
        ...(body.property_count && { property_count: body.property_count }),
        ...(body.unit_count && { unit_count: body.unit_count }),
        ...(body.user_type && { user_type: body.user_type }),
        ...(body.marketing_consent !== undefined && { 
          marketing_consent: body.marketing_consent,
          consent_date: body.marketing_consent ? new Date().toISOString() : lead.consent_date
        })
      });
      
      lead = await base44.asServiceRole.entities.Lead.get(lead.id);
    } else {
      // Create new lead
      lead = await base44.asServiceRole.entities.Lead.create({
        email,
        name: body.name || null,
        phone: body.phone || null,
        company: body.company || null,
        source: body.source,
        source_detail: body.source_detail || null,
        utm_source: body.utm_source || null,
        utm_medium: body.utm_medium || null,
        utm_campaign: body.utm_campaign || null,
        status: 'new',
        score: calculateLeadScore(body),
        interest_level: body.interest_level || 'unknown',
        property_count: body.property_count || null,
        unit_count: body.unit_count || null,
        user_type: body.user_type || null,
        marketing_consent: body.marketing_consent || false,
        consent_date: body.marketing_consent ? new Date().toISOString() : null,
        tags: body.tags || [],
        last_activity_at: new Date().toISOString()
      });
    }
    
    return Response.json(
      { 
        success: true, 
        lead_id: lead.id, 
        is_new: isNew,
        score: lead.score 
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function calculateLeadScore(data) {
  let score = 10; // Base score
  
  if (data.name) score += 10;
  if (data.phone) score += 15;
  if (data.company) score += 5;
  
  if (data.property_count) {
    score += Math.min(data.property_count * 5, 25);
  }
  
  if (data.unit_count) {
    if (data.unit_count > 5) score += 15;
    else if (data.unit_count > 0) score += 10;
  }
  
  if (data.marketing_consent) score += 10;
  
  if (data.user_type) {
    if (['gewerblich_vermieter', 'verwalter'].includes(data.user_type)) {
      score += 15;
    }
  }
  
  return Math.min(score, 100);
}