import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Paginierte Abfrage des Asset-Portfolios
 * Optimiert Queries für große Portfolios
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { page = 1, limit = 50, status = 'active', sort = '-created_date' } = await req.json();

    if (page < 1 || limit < 1 || limit > 200) {
      return Response.json(
        { error: 'Ungültige Pagination Parameter' },
        { status: 400 }
      );
    }

    // Gesamtanzahl laden
    const totalAssets = await base44.entities.AssetPortfolio.filter(
      { user_id: user.id, status },
      '',
      10000
    );

    const totalCount = totalAssets.length;
    const totalPages = Math.ceil(totalCount / limit);

    if (page > totalPages) {
      return Response.json(
        { error: 'Seite existiert nicht' },
        { status: 400 }
      );
    }

    // Paginierte Daten
    const skip = (page - 1) * limit;
    const items = totalAssets.slice(skip, skip + limit);

    return Response.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total_count: totalCount,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_previous: page > 1
      }
    });

  } catch (error) {
    console.error('Pagination error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});