import React from 'react';
import { Button } from '@/components/ui/button';
import TimeAgo from '@/components/shared/TimeAgo';
import { Eye, Download, Trash2 } from 'lucide-react';

export default function DocumentTable({ documents = [], onView, onDownload, onDelete }) {
  return (
    <div className="vf-table-container">
      <table className="vf-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Typ</th>
            <th>Hochgeladen</th>
            <th>Größe</th>
            <th className="text-right">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td className="font-medium">{doc.name || doc.title}</td>
              <td>{doc.document_type || 'Dokument'}</td>
              <td><TimeAgo date={doc.created_date} /></td>
              <td className="text-sm text-[var(--theme-text-muted)]">
                {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : '-'}
              </td>
              <td className="text-right">
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => onView(doc)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDownload(doc)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(doc)}>
                    <Trash2 className="h-4 w-4 text-[var(--vf-error-500)]" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}