import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { calculation_id } = body;
    
    const calculation = await base44.entities.CalculationHistory.get(calculation_id);
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('vermitify', 20, 20);
    doc.setFontSize(16);
    doc.text(getCalculatorLabel(calculation.calculator_type), 20, 30);
    
    // Date
    doc.setFontSize(10);
    doc.text(`Erstellt: ${new Date(calculation.created_date).toLocaleDateString('de-DE')}`, 20, 40);
    
    // Result
    doc.setFontSize(14);
    doc.text('ERGEBNIS', 20, 55);
    doc.setFontSize(24);
    doc.text(`${calculation.primary_result_label}: ${calculation.primary_result}`, 20, 70);
    
    // Input data
    doc.setFontSize(12);
    doc.text('EINGABEDATEN', 20, 90);
    let yPos = 100;
    
    for (const [key, value] of Object.entries(calculation.input_data)) {
      doc.setFontSize(10);
      doc.text(`${key}: ${value}`, 20, yPos);
      yPos += 8;
    }
    
    // Footer
    doc.setFontSize(8);
    doc.text('vermitify GmbH • www.vermitify.de', 20, 280);
    
    const pdfBytes = doc.output('arraybuffer');
    
    // Update calculation record
    await base44.entities.CalculationHistory.update(calculation_id, {
      pdf_generated: true
    });
    
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="berechnung_${calculation.calculator_type}_${Date.now()}.pdf"`
      }
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getCalculatorLabel(type) {
  const labels = {
    'rendite': 'Rendite-Rechner',
    'afa': 'AfA-Rechner',
    'indexmiete': 'Indexmieten-Rechner',
    'cashflow': 'Cashflow-Rechner',
    'kaufpreis': 'Kaufpreis-Rechner',
    'tilgung': 'Tilgungs-Rechner',
    'wertentwicklung': 'Wertentwicklungs-Rechner'
  };
  return labels[type] || type;
}