import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportTemplateAsHTML(blocks, design, pageSetup) {
  const html = generateHTML(blocks, design, pageSetup);
  const blob = new Blob([html], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template.html';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}

export async function exportTemplateAsPDF(blocks, design, pageSetup) {
  const element = document.getElementById('template-preview');
  if (!element) {
    throw new Error('Template preview nicht gefunden');
  }

  const canvas = await html2canvas(element, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');

  const orientation = pageSetup.orientation === 'landscape' ? 'l' : 'p';
  const pageFormat = pageSetup.format === 'letter' ? 'letter' : 
                     pageSetup.format === 'legal' ? 'legal' : 'a4';
  
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageFormat
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginTop = pageSetup.marginTop || 20;
  const marginLeft = pageSetup.marginLeft || 20;

  const imgWidth = pageWidth - (marginLeft * 2);
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', marginLeft, marginTop, imgWidth, imgHeight);
  pdf.save('template.pdf');
}

function generateHTML(blocks, design, pageSetup) {
  const marginTop = pageSetup.marginTop || 20;
  const marginRight = pageSetup.marginRight || 20;
  const marginBottom = pageSetup.marginBottom || 20;
  const marginLeft = pageSetup.marginLeft || 20;

  let content = '';
  blocks.forEach(block => {
    content += renderBlockHTML(block, design);
  });

  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Template</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${design.font || 'Arial, sans-serif'};
      color: ${design.primaryColor || '#1e293b'};
    }
    @page {
      size: ${pageSetup.width}mm ${pageSetup.height}mm;
      margin: ${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm;
    }
    .template-container {
      width: 100%;
      background: white;
    }
    h1 { font-size: 24px; margin-bottom: 16px; }
    h2 { font-size: 20px; margin-bottom: 12px; }
    h3 { font-size: 16px; margin-bottom: 10px; }
    p { margin-bottom: 8px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th, td { padding: 8px; border: 1px solid #e2e8f0; }
    th { background: #f1f5f9; }
    img { max-width: 100%; height: auto; }
    hr { border: none; border-top: 1px solid #cbd5e1; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="template-container">
    ${content}
  </div>
</body>
</html>
  `;
}

function renderBlockHTML(block, design) {
  const style = block.styles ? `style="${Object.entries(block.styles)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ')}"` : '';

  switch (block.type) {
    case 'heading':
      const headingLevel = block.size || 'h2';
      return `<${headingLevel} ${style}>${block.content}</${headingLevel}>`;
    
    case 'text':
      return `<p ${style}>${block.content}</p>`;
    
    case 'image':
      return `<img src="${block.imageUrl}" alt="${block.altText || 'Bild'}" style="width: ${block.width}px; height: ${block.height}px;">`;
    
    case 'table':
      let tableHTML = '<table>';
      if (block.rows) {
        block.rows.forEach(row => {
          tableHTML += '<tr>';
          row.cells.forEach(cell => {
            tableHTML += `<td>${cell}</td>`;
          });
          tableHTML += '</tr>';
        });
      }
      tableHTML += '</table>';
      return tableHTML;
    
    case 'divider':
      return '<hr>';
    
    case 'spacer':
      return `<div style="height: ${block.height || 16}px;"></div>`;
    
    case 'signature':
      return `
        <div style="margin-top: 40px;">
          <p style="border-bottom: 1px solid #000; width: 150px; margin-bottom: 4px;">&nbsp;</p>
          <p style="font-size: 12px;">${block.content || 'Unterschrift'}</p>
        </div>
      `;
    
    case 'columns':
      return `
        <div style="display: grid; grid-template-columns: repeat(${block.columnCount || 2}, 1fr); gap: 16px;">
          ${block.columns?.map(col => `<div>${col}</div>`).join('')}
        </div>
      `;
    
    case 'qrcode':
      return `<img src="${block.qrUrl}" alt="QR-Code" style="width: 100px; height: 100px;">`;
    
    default:
      return '';
  }
}