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
    const { year, month, from_year, from_month } = req.method === 'POST' ? await req.json() : {};

    let results;

    if (year && month) {
      results = await base44.asServiceRole.entities.VPIIndex.filter({ year, month });
    } else if (from_year && from_month) {
      const all = await base44.asServiceRole.entities.VPIIndex.list('-year', 100);
      results = all.filter(item => 
        item.year > from_year || (item.year === from_year && item.month >= from_month)
      );
    } else {
      results = await base44.asServiceRole.entities.VPIIndex.list('-year', 50);
    }

    return Response.json({ success: true, data: results }, { headers: corsHeaders });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
});