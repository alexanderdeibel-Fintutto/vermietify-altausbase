import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Datei hochladen
    const uploadResult = await base44.integrations.Core.UploadFile({ file });
    
    // CSV-Daten extrahieren
    const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url: uploadResult.file_url,
      json_schema: {
        type: "object",
        properties: {
          categories: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category_code: { type: "string" },
                display_name: { type: "string" },
                legal_forms: { type: "array", items: { type: "string" } },
                tax_treatment: { type: "string" },
                allocatable: { type: "boolean" },
                tax_form_lines: { type: "object" },
                skr03_account: { type: "string" },
                skr04_account: { type: "string" },
                description: { type: "string" },
                keywords: { type: "array", items: { type: "string" } },
                examples: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      }
    });

    if (extractResult.status !== 'success') {
      return Response.json({ 
        error: 'CSV extraction failed', 
        details: extractResult.details 
      }, { status: 400 });
    }

    const categories = extractResult.output.categories || [];
    
    let created = 0;
    const errors = [];

    for (const cat of categories) {
      try {
        await base44.asServiceRole.entities.TaxCategoryMaster.create({
          ...cat,
          is_active: true
        });
        created++;
      } catch (error) {
        errors.push({ category: cat.category_code, error: error.message });
      }
    }

    return Response.json({
      success: true,
      imported: created,
      total: categories.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${created} von ${categories.length} Kategorien importiert`
    });

  } catch (error) {
    console.error('Error importing categories:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});