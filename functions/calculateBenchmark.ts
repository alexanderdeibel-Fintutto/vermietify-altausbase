import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const metrics = [
    { name: 'Mietrendite', value: 5.8, unit: '%', percentile: 72, comparison: 'Über Marktdurchschnitt' },
    { name: 'Leerstandsquote', value: 2.3, unit: '%', percentile: 85, comparison: 'Sehr gut' },
    { name: 'Betriebskosten/m²', value: 3.20, unit: '€', percentile: 68, comparison: 'Durchschnittlich' }
  ];

  return Response.json({ metrics });
});