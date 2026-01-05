import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { building_id, cost_category_id } = await req.json();
    
    // Hole Bibliothek
    const libraries = await base44.entities.BuildingTaxLibrary.filter({ building_id });
    
    if (!libraries || libraries.length === 0) {
      return Response.json({ 
        error: `No tax library installed for building ${building_id}` 
      }, { status: 404 });
    }
    
    const library = libraries[0];
    
    // Finde Mapping
    const mapping = library.account_mappings.find(m => m.cost_category_id === cost_category_id);
    
    if (!mapping) {
      return Response.json({ 
        error: `No account mapping found for category ${cost_category_id}` 
      }, { status: 404 });
    }
    
    return Response.json(mapping);
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});