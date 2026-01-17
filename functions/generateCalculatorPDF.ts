import { jsPDF } from 'npm:jspdf@2.5.1';

const corsHeaders = { 
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const body = await req.json();
    const { calculator_type, input_data, result_data } = body;
    
    const doc = new jsPDF();
    
    // Header with gradient effect
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('vermitify', 20, 20);
    
    doc.setFontSize(14);
    doc.text(getCalculatorLabel(calculator_type), 20, 30);
    
    // Reset colors
    doc.setTextColor(0, 0, 0);
    
    // Date
    doc.setFontSize(10);
    doc.text(`Erstellt: ${new Date().toLocaleDateString('de-DE')}`, 20, 50);
    
    // Main result
    doc.setFontSize(12);
    doc.text('HAUPTERGEBNIS', 20, 65);
    doc.setFontSize(20);
    doc.setTextColor(30, 58, 138);
    doc.text(formatMainResult(calculator_type, result_data), 20, 80);
    
    // Input data
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text('EINGABEDATEN', 20, 100);
    
    let yPos = 110;
    doc.setFontSize(10);
    for (const [key, value] of Object.entries(input_data)) {
      doc.text(`${formatKey(key)}: ${value}`, 20, yPos);
      yPos += 8;
      if (yPos > 270) break;
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('vermitify GmbH • www.vermitify.de • support@vermitify.de', 105, 285, { align: 'center' });
    
    const pdfBytes = doc.output('arraybuffer');
    
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${calculator_type}_berechnung.pdf"`
      }
    });
    
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders }
    );
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
  return labels[type] || 'Berechnung';
}

function formatMainResult(type, result) {
  if (type === 'rendite') return `Netto-Rendite: ${result.netto_rendite}%`;
  if (type === 'afa') return `Jährliche AfA: ${result.annualAfa} €`;
  if (type === 'indexmiete') return `Neue Miete: ${result.neue_miete} €`;
  if (type === 'cashflow') return `Cashflow: ${result.cashflow_monat} €/Monat`;
  return JSON.stringify(result);
}

function formatKey(key) {
  const labels = {
    'kaufpreis': 'Kaufpreis',
    'miete_kalt_monat': 'Kaltmiete/Monat',
    'nebenkosten_prozent': 'Nebenkosten',
    'miete_aktuell': 'Aktuelle Miete',
    'letzte_anpassung_datum': 'Letzte Anpassung'
  };
  return labels[key] || key;
}