import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { building_id } = await req.json();
    
    // Hole installierte Bibliothek
    const libraries = await base44.entities.BuildingTaxLibrary.filter({ building_id });
    
    if (!libraries || libraries.length === 0) {
      return Response.json({ 
        error: `No tax library installed for building ${building_id}. Call loadTaxLibrary first.`,
        building_id 
      }, { status: 404 });
    }
    
    return Response.json(libraries[0]);
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});