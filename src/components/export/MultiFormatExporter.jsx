import React from 'react';
import BulkExportButton from './BulkExportButton';

export default function MultiFormatExporter({ data, filename }) {
  const handleExport = (format) => {
    console.log(`Exporting as ${format}:`, data);
    // Export logic here
  };

  return <BulkExportButton onExport={handleExport} />;
}