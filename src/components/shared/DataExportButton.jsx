import React from 'react';
import ExportButton from '@/components/reporting/ExportButton';

export default function DataExportButton({ data, filename }) {
  return <ExportButton data={data} filename={filename} />;
}