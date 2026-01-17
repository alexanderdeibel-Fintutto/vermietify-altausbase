import React from 'react';
import { Button } from '@/components/ui/button';
import TimeAgo from '@/components/shared/TimeAgo';
import StatusBadge from '@/components/shared/StatusBadge';
import { Download, Eye } from 'lucide-react';

export default function ReportTable({ reports = [], onView, onDownload }) {
  return (
    <div className="vf-table-container">
      <table className="vf-table">
        <thead>
          <tr>
            <th>Berichtsname</th>
            <th>Typ</th>
            <th>Erstellt</th>
            <th>Status</th>
            <th className="text-right">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td className="font-medium">{report.name}</td>
              <td>{report.type}</td>
              <td><TimeAgo date={report.created_date} /></td>
              <td><StatusBadge status={report.status} /></td>
              <td className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => onView(report)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDownload(report)}>
                    <Download className="h-4 w-4" />
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