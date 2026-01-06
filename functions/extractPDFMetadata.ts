import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { PDFDocument } from 'npm:pdf-lib@1.17.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { pdf_url } = await req.json();

        if (!pdf_url) {
            return Response.json({ error: 'PDF URL required' }, { status: 400 });
        }

        // PDF herunterladen
        const pdfResponse = await fetch(pdf_url);
        if (!pdfResponse.ok) {
            return Response.json({ error: 'Failed to fetch PDF' }, { status: 400 });
        }

        const pdfBytes = await pdfResponse.arrayBuffer();
        
        // PDF analysieren
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pageCount = pdfDoc.getPageCount();
        
        // PDF-Größe
        const fileSize = pdfBytes.byteLength;
        
        // Erste Seite für Text-Extraktion (vereinfacht)
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        return Response.json({
            success: true,
            metadata: {
                pages: pageCount,
                fileSize: fileSize,
                dimensions: {
                    width: Math.round(width),
                    height: Math.round(height)
                },
                isA4Portrait: Math.abs(width - 595) < 10 && Math.abs(height - 842) < 10
            }
        });

    } catch (error) {
        console.error('PDF metadata extraction error:', error);
        return Response.json({ 
            error: error.message,
            details: 'Failed to extract PDF metadata'
        }, { status: 500 });
    }
});