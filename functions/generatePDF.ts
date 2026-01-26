import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import puppeteer from 'npm:puppeteer@23.11.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { html, fileName = 'document.pdf', pageFormat = 'A4', margins = {} } = await req.json();

        if (!html) {
            return Response.json({ error: 'HTML content required' }, { status: 400 });
        }

        // Launch browser
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        
        // Set content
        await page.setContent(html, {
            waitUntil: 'networkidle0'
        });

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: pageFormat,
            margin: {
                top: margins.top || '20mm',
                bottom: margins.bottom || '20mm',
                left: margins.left || '20mm',
                right: margins.right || '20mm'
            },
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: margins.headerTemplate || '<div></div>',
            footerTemplate: margins.footerTemplate || `
                <div style="font-size: 10px; text-align: center; width: 100%; padding: 5px;">
                    <span class="pageNumber"></span> / <span class="totalPages"></span>
                </div>
            `
        });

        await browser.close();

        // Upload to storage
        const file = new File([pdfBuffer], fileName, { type: 'application/pdf' });
        const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });

        // Seitenzahl extrahieren
        const { PDFDocument } = await import('npm:pdf-lib@1.17.1');
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pages = pdfDoc.getPageCount();

        return Response.json({ 
            success: true, 
            file_url,
            fileName,
            pages
        });

    } catch (error) {
        console.error('PDF generation error:', error);
        return Response.json({ 
            error: error.message,
            details: 'Failed to generate PDF'
        }, { status: 500 });
    }
});