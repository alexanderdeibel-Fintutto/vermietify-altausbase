import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, file, document_type } = await req.json();

    if (!submission_id || !file || !document_type) {
      return Response.json({ 
        error: 'submission_id, file and document_type required' 
      }, { status: 400 });
    }

    console.log(`[DOC-UPLOAD] Uploading ${document_type} for ${submission_id}`);

    // Upload Dokument
    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    const fileUrl = uploadResult.file_url;

    // Hole Submission
    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    
    if (submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];

    // Update Submission mit Dokumenten-Referenz
    const existingDocs = sub.form_data?.uploaded_documents || [];
    const updatedDocs = [
      ...existingDocs,
      {
        type: document_type,
        url: fileUrl,
        uploaded_at: new Date().toISOString(),
        uploaded_by: user.email
      }
    ];

    await base44.asServiceRole.entities.ElsterSubmission.update(submission_id, {
      form_data: {
        ...sub.form_data,
        uploaded_documents: updatedDocs
      }
    });

    // Optionales OCR/Extraktion für PDFs
    if (document_type === 'receipt' || document_type === 'invoice') {
      try {
        const extractionResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: 'Extrahiere folgende Informationen aus diesem Dokument: Datum, Betrag, Zahlungsempfänger, Beschreibung. Gib ein JSON zurück.',
          file_urls: [fileUrl],
          response_json_schema: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              amount: { type: 'number' },
              recipient: { type: 'string' },
              description: { type: 'string' }
            }
          }
        });

        console.log('[DOC-UPLOAD] Extracted data:', extractionResult);

        return Response.json({
          success: true,
          file_url: fileUrl,
          extracted_data: extractionResult
        });
      } catch (extractError) {
        console.warn('[DOC-UPLOAD] Extraction failed:', extractError);
      }
    }

    return Response.json({
      success: true,
      file_url: fileUrl
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});