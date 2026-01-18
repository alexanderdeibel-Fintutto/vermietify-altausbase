import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

const corsHeaders = { 
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const base44 = createClientFromRequest(req);

  try {
    const { document_type, data, lead_id, user_id } = await req.json();

    if (!document_type || !data) {
      return Response.json({ success: false, error: 'Dokumenttyp und Daten erforderlich' }, { status: 400, headers: corsHeaders });
    }

    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Vermitify', 20, 20);
    
    doc.setFontSize(16);
    doc.text(getDocumentTitle(document_type), 20, 40);
    
    doc.setFontSize(12);
    let yPos = 60;
    
    Object.entries(data).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 20, yPos);
      yPos += 10;
    });

    const pdfBytes = doc.output('arraybuffer');
    const fileName = `${document_type}_${Date.now()}.pdf`;

    const generatedDoc = await base44.asServiceRole.entities.GeneratedDocument.create({
      lead_id: lead_id || null,
      dokumenttyp: document_type,
      titel: getDocumentTitle(document_type),
      inhalt_html: JSON.stringify(data),
      dateiformat: 'PDF',
      versand_status: 'Entwurf'
    });

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
});

function getDocumentTitle(type) {
  const titles = {
    'mietvertrag': 'Mietvertrag',
    'kuendigung': 'Kündigung',
    'mietanpassung': 'Mietanpassung',
    'nebenkostenabrechnung': 'Nebenkostenabrechnung',
    'uebergabeprotokoll': 'Übergabeprotokoll',
    'mahnung': 'Mahnung'
  };
  return titles[type] || 'Dokument';
}