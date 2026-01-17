import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const corsHeaders = { 
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const base44 = createClientFromRequest(req);
  
  try {
    let filter = {};
    
    if (req.method === 'POST') {
      const body = await req.json();
      const { year, month, from_year, from_month } = body;
      
      if (year && month) {
        filter = { year, month };
      } else if (from_year && from_month) {
        // Get all indices from a specific date onwards
        const results = await base44.asServiceRole.entities.VPIIndex.list();
        const filtered = results.filter(r => {
          if (r.year > from_year) return true;
          if (r.year === from_year && r.month >= from_month) return true;
          return false;
        });
        
        return Response.json(
          { success: true, data: filtered },
          { headers: corsHeaders }
        );
      }
    }
    
    const results = await base44.asServiceRole.entities.VPIIndex.filter(filter);
    
    return Response.json(
      { success: true, data: results },
      { headers: corsHeaders }
    );
    
  } catch (error) {
    return Response.json(
      { success: false, error: error.message }, 
      { status: 500, headers: corsHeaders }
    );
  }
});