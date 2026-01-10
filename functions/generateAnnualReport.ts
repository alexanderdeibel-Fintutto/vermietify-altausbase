import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { year } = await req.json();

  // Fetch all relevant data for the year
  const financialItems = await base44.entities.FinancialItem.filter({
    created_date: {
      $gte: `${year}-01-01`,
      $lte: `${year}-12-31`
    }
  }, '-created_date', 1000);

  const buildings = await base44.entities.Building.list(null, 100);
  const investments = await base44.entities.Investment.list(null, 100);

  // Calculate summary
  const income = financialItems.filter(i => i.amount > 0).reduce((sum, i) => sum + i.amount, 0);
  const expenses = financialItems.filter(i => i.amount < 0).reduce((sum, i) => sum + Math.abs(i.amount), 0);
  const netIncome = income - expenses;

  // Mock PDF generation (in production, use jsPDF or similar)
  const mockPdfUrl = `https://storage.example.com/reports/${user.email}_${year}.pdf`;

  return Response.json({
    success: true,
    pdf_url: mockPdfUrl,
    summary: {
      year,
      income,
      expenses,
      netIncome,
      buildings: buildings.length,
      investments: investments.length
    }
  });
});