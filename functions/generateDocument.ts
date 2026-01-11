import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';
import html2canvas from 'npm:html2canvas@1.4.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            document_type, 
            tenant_id, 
            contract_id, 
            unit_id, 
            building_id,
            document_data 
        } = await req.json();

        console.log(`Generating document: ${document_type} for tenant ${tenant_id}`);

        // Get template
        const templates = await base44.entities.DocumentTemplate.filter({
            document_type: document_type,
            is_active: true
        });

        if (!templates || templates.length === 0) {
            return Response.json({ error: 'No template found' }, { status: 404 });
        }

        const template = templates[0];
        let html = template.template_html;

        // Replace placeholders with data
        const placeholders = document_data || {};
        Object.keys(placeholders).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            let value = placeholders[key];
            if (typeof value === 'object') {
                value = JSON.stringify(value);
            }
            html = html.replace(regex, value || '');
        });

        // Generate PDF from HTML
        const canvas = await html2canvas(new DOMParser().parseFromString(html, 'text/html'), {
            scale: 2,
            logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

        const pdfBytes = pdf.output('arraybuffer');

        // Save PDF to private storage
        const filename = `${document_type}_${tenant_id}_${Date.now()}.pdf`;
        const fileUri = `documents/${building_id}/${document_type}/${filename}`;
        
        const uploadResult = await base44.integrations.Core.UploadPrivateFile({
            file: new Blob([pdfBytes])
        });

        // Create GeneratedDocument record
        const generatedDoc = await base44.entities.GeneratedDocument.create({
            document_type,
            tenant_id,
            contract_id,
            unit_id,
            building_id,
            pdf_file_uri: uploadResult.file_uri,
            document_data: document_data,
            distribution_status: 'generated'
        });

        console.log(`Document ${document_type} generated successfully: ${generatedDoc.id}`);

        return Response.json({
            success: true,
            document_id: generatedDoc.id,
            file_uri: uploadResult.file_uri,
            document_type
        });

    } catch (error) {
        console.error('Error generating document:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});