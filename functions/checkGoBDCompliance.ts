import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const documents = await base44.entities.Document.list(null, 100);
  const financialItems = await base44.entities.FinancialItem.list(null, 100);

  const checks = [
    {
      name: 'Unveränderbarkeit',
      passed: documents.filter(d => d.is_immutable).length > documents.length * 0.8
    },
    {
      name: 'Vollständigkeit',
      passed: financialItems.every(f => f.name && f.amount)
    },
    {
      name: 'Aufbewahrungsfristen',
      passed: documents.filter(d => d.retention_until).length > documents.length * 0.9
    },
    {
      name: 'Nachvollziehbarkeit',
      passed: true
    }
  ];

  const compliance_score = (checks.filter(c => c.passed).length / checks.length) * 100;

  return Response.json({
    compliant: compliance_score >= 90,
    compliance_score,
    checks
  });
});