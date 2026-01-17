import React from 'react';
import MultiFormatExporter from '@/components/export/MultiFormatExporter';

export default function ExportButton({ data, filename }) {
  const handleExportPDF = () => {
    console.log('Export PDF', data);
  };

  const handleExportCSV = () => {
    const csv = Object.keys(data[0] || {}).join(',') + '\n' +
      data.map(row => Object.values(row).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <MultiFormatExporter
      data={data}
      filename={filename}
      onExportPDF={handleExportPDF}
      onExportCSV={handleExportCSV}
    />
  );
}