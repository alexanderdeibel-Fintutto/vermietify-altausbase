import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from 'framer-motion';

export default function DataTable({
  data = [],
  columns = [],
  selectable = false,
  onSelectionChange,
  sortable = true,
  onRowClick
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selected, setSelected] = useState([]);

  const handleSort = (key) => {
    if (!sortable) return;
    
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const toggleSelection = (id) => {
    const newSelected = selected.includes(id)
      ? selected.filter(s => s !== id)
      : [...selected, id];
    setSelected(newSelected);
    if (onSelectionChange) onSelectionChange(newSelected);
  };

  const toggleAll = () => {
    const newSelected = selected.length === data.length ? [] : data.map(d => d.id);
    setSelected(newSelected);
    if (onSelectionChange) onSelectionChange(newSelected);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <tr>
            {selectable && (
              <th className="w-12 px-4 py-3">
                <Checkbox checked={selected.length === data.length} onCheckedChange={toggleAll} />
              </th>
            )}
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => col.sortable !== false && handleSort(col.key)}
                className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase ${
                  col.sortable !== false && sortable ? 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-200' : ''
                }`}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable !== false && sortable && (
                    sortConfig.key === col.key ? (
                      sortConfig.direction === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    ) : (
                      <ChevronsUpDown className="w-4 h-4 opacity-30" />
                    )
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, idx) => (
            <motion.tr
              key={row.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.02 }}
              onClick={() => onRowClick && onRowClick(row)}
              className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              {selectable && (
                <td className="px-4 py-3">
                  <Checkbox
                    checked={selected.includes(row.id)}
                    onCheckedChange={() => toggleSelection(row.id)}
                  />
                </td>
              )}
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>

      {sortedData.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Keine Daten vorhanden
        </div>
      )}
    </div>
  );
}