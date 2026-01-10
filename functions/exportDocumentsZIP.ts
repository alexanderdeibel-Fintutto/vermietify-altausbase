import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { filter_type, filter_value } = await req.json();

  let query = {};
  
  if (filter_type === 'category') {
    query.category = filter_value;
  } else if (filter_type === 'year') {
    const year = parseInt(filter_value);
    query.created_date = {
      $gte: `${year}-01-01`,
      $lte: `${year}-12-31`
    };
  }

  const documents = await base44.entities.Document.filter(query, '-created_date', 500);

  // In real implementation, would create actual ZIP file
  // For now, return mock download URL
  const mockDownloadUrl = `https://storage.example.com/exports/${user.email}_${Date.now()}.zip`;

  return Response.json({
    success: true,
    download_url: mockDownloadUrl,
    document_count: documents.length,
    message: `${documents.length} Dokumente werden heruntergeladen`
  });
});