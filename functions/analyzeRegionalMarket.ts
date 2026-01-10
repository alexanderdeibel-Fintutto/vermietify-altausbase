import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const history = [
    { year: '2022', price: 3200 },
    { year: '2023', price: 3400 },
    { year: '2024', price: 3600 },
    { year: '2025', price: 3800 }
  ];

  return Response.json({
    avg_rent: 12.50,
    trend: 5.5,
    vacancy_rate: 2.3,
    history
  });
});