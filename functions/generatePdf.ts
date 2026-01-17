import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
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
  
  const base44 = createClientFromRequest(req);
  
  try {
    const body = await req.json();
    
    const {
      document_type,
      data,
      lead_id,
      user_id
    } = body;
    
    if (!document_type || !data) {
      return Response.json(
        { success: false, error: 'Document type und data erforderlich' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Generate PDF
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text(getDocumentTitle(document_type), 20, 20);
    
    // Add content based on document type
    let yPos = 40;
    
    if (document_type === 'mietvertrag') {
      doc.setFontSize(12);
      doc.text(`Vermieter: ${data.landlord || '-'}`, 20, yPos);
      yPos += 10;
      doc.text(`Mieter: ${data.tenant || '-'}`, 20, yPos);
      yPos += 10;
      doc.text(`Wohnung: ${data.address || '-'}`, 20, yPos);
      yPos += 10;
      doc.text(`Kaltmiete: ${data.rent || '0'} €`, 20, yPos);
    } else if (document_type === 'kuendigung') {
      doc.setFontSize(12);
      doc.text(`An: ${data.tenant || '-'}`, 20, yPos);
      yPos += 10;
      doc.text(`Wohnung: ${data.address || '-'}`, 20, yPos);
      yPos += 10;
      doc.text(`Kündigungsdatum: ${data.date || '-'}`, 20, yPos);
    }
    
    const pdfBytes = doc.output('arraybuffer');
    const fileName = `${document_type}_${Date.now()}.pdf`;
    
    // Save document record
    const docRecord = await base44.asServiceRole.entities.GeneratedDocument.create({
      lead_id: lead_id || null,
      user_id: user_id || null,
      document_type,
      template_version: '1.0',
      input_data: data,
      file_name: fileName,
      file_size: pdfBytes.byteLength,
      download_count: 0,
      email_sent: false
    });
    
    // Return PDF as response
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
    
  } catch (error) {
    return Response.json(
      { success: false, error: error.message }, 
      { status: 500, headers: corsHeaders }
    );
  }
});

function getDocumentTitle(type) {
  const titles = {
    'mietvertrag': 'Mietvertrag',
    'kuendigung': 'Kündigung',
    'mietanpassung': 'Mietanpassung',
    'nebenkostenabrechnung': 'Nebenkostenabrechnung',
    'uebergabeprotokoll': 'Übergabeprotokoll',
    'mahnung': 'Mahnung',
    'indexanpassung': 'Indexanpassung',
    'steuer_report': 'Steuer-Report'
  };
  
  return titles[type] || 'Dokument';
}