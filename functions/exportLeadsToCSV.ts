import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const leads = await base44.asServiceRole.entities.Lead.list('-created_date');

    // Create CSV
    const headers = [
      'Name', 'Email', 'Telefon', 'Quelle', 'Status', 
      'Score', 'Interest Level', 'Property Count', 
      'User Type', 'Created', 'Last Activity'
    ];

    const rows = leads.map(lead => [
      lead.name || '',
      lead.email,
      lead.phone || '',
      lead.source,
      lead.status,
      lead.score,
      lead.interest_level,
      lead.property_count || 0,
      lead.user_type || '',
      new Date(lead.created_date).toLocaleDateString('de-DE'),
      new Date(lead.last_activity_at).toLocaleDateString('de-DE')
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="leads_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});