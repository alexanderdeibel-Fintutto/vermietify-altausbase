import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { quarter, year } = await req.json();

  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text(`Quartalsbericht ${quarter} ${year}`, 20, 20);
  
  doc.setFontSize(12);
  doc.text('Finanzübersicht:', 20, 40);
  doc.text('Einnahmen: 125.000 EUR', 20, 50);
  doc.text('Ausgaben: 87.000 EUR', 20, 60);
  doc.text('Gewinn: 38.000 EUR', 20, 70);

  const pdfBytes = doc.output('arraybuffer');

  return new Response(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Quartalsbericht_${quarter}_${year}.pdf`
    }
  });
});