import React from 'react';
import { cn } from '@/lib/utils';

export default function CompactTable({ headers, rows, className }) {
  return (
    <div className="vf-table-container">
      <table className={cn("vf-table vf-table-compact", className)}>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}