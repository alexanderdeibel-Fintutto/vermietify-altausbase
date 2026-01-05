import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';

export default function TemplatePreview({ open, onOpenChange, template }) {
    const generatePreviewHTML = () => {
        if (!template) return '';

        const styles = template.styles || {};
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: ${styles.font_family || 'Arial, sans-serif'};
                        font-size: ${styles.font_size || '11pt'};
                        color: ${styles.primary_color || '#000000'};
                        margin: 0;
                        padding: 20px;
                    }
                    .header {
                        border-bottom: 2px solid #ccc;
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                    }
                    .content {
                        min-height: 400px;
                    }
                    .footer {
                        border-top: 2px solid #ccc;
                        padding-top: 10px;
                        margin-top: 20px;
                        font-size: 9pt;
                        color: ${styles.secondary_color || '#666666'};
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    table th, table td {
                        border: 1px solid #ccc;
                        padding: 8px;
                        text-align: left;
                    }
                    table th {
                        background-color: #f0f0f0;
                        font-weight: bold;
                    }
                    ${template.logo_url ? `
                    .header img {
                        max-height: 60px;
                        margin-bottom: 10px;
                    }
                    ` : ''}
                </style>
            </head>
            <body>
                ${template.logo_url ? `<div class="header"><img src="${template.logo_url}" alt="Logo" /></div>` : ''}
                ${template.header_html ? `<div class="header">${template.header_html}</div>` : ''}
                <div class="content">
                    ${template.content || '<p>Noch kein Inhalt</p>'}
                </div>
                ${template.footer_html ? `<div class="footer">${template.footer_html}</div>` : ''}
            </body>
            </html>
        `;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Vorschau: {template?.name}</DialogTitle>
                </DialogHeader>

                <div className="border rounded-lg overflow-hidden bg-white" style={{ height: '70vh' }}>
                    <iframe
                        srcDoc={generatePreviewHTML()}
                        className="w-full h-full"
                        title="Template Preview"
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Schließen
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}