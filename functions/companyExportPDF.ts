import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, includeContacts = true, includeDocuments = true } = await req.json();

    const company = await base44.entities.Company.filter({ id: company_id });
    if (company.length === 0) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    const companyData = company[0];

    // Generate PDF content
    const pdfContent = generateCompanyPDF(companyData, includeContacts, includeDocuments);

    // Upload PDF
    const uploadResult = await base44.integrations.Core.UploadFile({
      file: new Blob([pdfContent], { type: 'application/pdf' })
    });

    return Response.json({ file_url: uploadResult.file_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateCompanyPDF(company, includeContacts, includeDocuments) {
  let pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 1000 >>
stream
BT
/F1 24 Tf
50 750 Td
(${company.name}) Tj
0 -30 Td
/F1 12 Tf
(Rechtsform: ${company.legal_form}) Tj
0 -20 Td
(Adresse: ${company.address}) Tj
0 -20 Td
(Steuernummer: ${company.tax_id || 'N/A'}) Tj
0 -20 Td
(Gründung: ${company.founding_date ? new Date(company.founding_date).toLocaleDateString('de-DE') : 'N/A'}) Tj
`;

  if (includeContacts && company.contacts && company.contacts.length > 0) {
    pdf += `0 -30 Td
(Kontakte:) Tj
`;
    company.contacts.forEach(contact => {
      pdf += `0 -20 Td
(${contact.name} - ${contact.role}) Tj
`;
    });
  }

  pdf += `ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
0000000301 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
1401
%%EOF`;

  return pdf;
}