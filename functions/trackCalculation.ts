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
      calculator_type,
      input_data,
      result_data,
      primary_result,
      primary_result_label,
      lead_id,
      user_id,
      building_id
    } = body;
    
    if (!calculator_type || !input_data || !result_data) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400, headers: corsHeaders }
      );
    }

    const calculation = await base44.asServiceRole.entities.CalculationHistory.create({
      calculator_type,
      input_data,
      result_data,
      primary_result,
      primary_result_label,
      lead_id: lead_id || null,
      user_id: user_id || null,
      building_id: building_id || null,
      saved: false,
      shared: false,
      pdf_generated: false
    });

    // Update lead score if lead exists
    if (lead_id) {
      const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
      const newScore = Math.min(lead.score + 5, 100);
      
      await base44.asServiceRole.entities.Lead.update(lead_id, {
        score: newScore,
        last_activity_at: new Date().toISOString()
      });
    }

    return Response.json(
      { success: true, calculation_id: calculation.id },
      { headers: corsHeaders }
    );
    
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});