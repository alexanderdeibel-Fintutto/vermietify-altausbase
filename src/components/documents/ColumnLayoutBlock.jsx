import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

export default function ColumnLayoutBlock({ block, onUpdate, onDelete }) {
  const [columnCount, setColumnCount] = useState(block.columnCount || 2);
  const [gap, setGap] = useState(block.gap || 'md');
  const [columns, setColumns] = useState(block.columns || Array(columnCount).fill(null).map(() => ({ content: [], id: Date.now() + Math.random() })));
  const [expandedColumn, setExpandedColumn] = useState(null);

  const handleColumnCountChange = (newCount) => {
    if (newCount < 1 || newCount > 4) return;
    
    let newColumns = [...columns];
    if (newCount > columns.length) {
      // Spalten hinzufügen
      for (let i = columns.length; i < newCount; i++) {
        newColumns.push({ content: [], id: Date.now() + Math.random() });
      }
    } else {
      // Spalten entfernen
      newColumns = newColumns.slice(0, newCount);
    }
    setColumnCount(newCount);
    setColumns(newColumns);
    updateBlock(newCount, newColumns, gap);
  };

  const updateBlock = (colCount, cols, gapValue) => {
    onUpdate({
      ...block,
      columnCount: colCount,
      columns: cols,
      gap: gapValue
    });
  };

  const handleGapChange = (newGap) => {
    setGap(newGap);
    updateBlock(columnCount, columns, newGap);
  };

  const addContentToColumn = (columnIndex) => {
    const newColumns = [...columns];
    newColumns[columnIndex].content.push({
      id: Date.now(),
      type: 'text',
      text: 'Spalteninhalt'
    });
    setColumns(newColumns);
    updateBlock(columnCount, newColumns, gap);
    toast.success('Text zu Spalte hinzugefügt');
  };

  const removeContentFromColumn = (columnIndex, contentIndex) => {
    const newColumns = [...columns];
    newColumns[columnIndex].content.splice(contentIndex, 1);
    setColumns(newColumns);
    updateBlock(columnCount, newColumns, gap);
  };

  const updateContent = (columnIndex, contentIndex, newText) => {
    const newColumns = [...columns];
    newColumns[columnIndex].content[contentIndex].text = newText;
    setColumns(newColumns);
    updateBlock(columnCount, newColumns, gap);
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  };

  return (
    <div className="space-y-4 bg-slate-50 p-4 rounded-lg border">
      <h4 className="font-medium text-sm text-slate-900">Spalten-Layout</h4>

      <div className="flex gap-3">
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-2">Spaltenanzahl</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(num => (
              <Button
                key={num}
                onClick={() => handleColumnCountChange(num)}
                size="sm"
                variant={columnCount === num ? 'default' : 'outline'}
                className="h-8 w-8 p-0 text-xs"
              >
                {num}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700 block mb-2">Abstand</label>
          <select
            value={gap}
            onChange={(e) => handleGapChange(e.target.value)}
            className="h-8 text-xs border rounded px-2"
          >
            <option value="sm">Klein</option>
            <option value="md">Mittel</option>
            <option value="lg">Groß</option>
          </select>
        </div>
      </div>

      <div className={`grid ${gridClasses[columnCount]} ${gapClasses[gap]} p-3 bg-white rounded border`}>
        {columns.map((column, colIdx) => (
          <div key={column.id} className="border-2 border-dashed border-slate-300 rounded p-2 min-h-32 bg-slate-50">
            <div className="space-y-2">
              {column.content.map((item, itemIdx) => (
                <div key={item.id} className="bg-white rounded p-2 border text-xs">
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => updateContent(colIdx, itemIdx, e.target.value)}
                    className="w-full text-xs border rounded p-1 mb-1"
                  />
                  <button
                    onClick={() => removeContentFromColumn(colIdx, itemIdx)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Entfernen
                  </button>
                </div>
              ))}
              
              <Button
                onClick={() => addContentToColumn(colIdx)}
                size="sm"
                variant="ghost"
                className="w-full h-7 text-xs gap-1"
              >
                <Plus className="w-3 h-3" /> Text hinzufügen
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={onDelete}
        variant="destructive"
        size="sm"
        className="w-full h-8 text-xs"
      >
        <Trash2 className="w-3 h-3 mr-1" /> Löschen
      </Button>
    </div>
  );
}