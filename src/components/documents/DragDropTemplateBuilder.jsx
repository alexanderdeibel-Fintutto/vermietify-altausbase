import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

function SortableBlock({ block, onUpdate, onDelete, isSelected, onSelect }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg p-3 cursor-move transition ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onSelect(block.id)}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          title="Zum Verschieben ziehen"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 text-sm">
          <p className="font-medium text-slate-700">{block.type}</p>
          <p className="text-slate-500 truncate">{block.content || 'Kein Inhalt'}</p>
        </div>
      </div>
    </div>
  );
}

export default function DragDropTemplateBuilder({ blocks, onBlocksReorder, onUpdate, onDelete, selectedBlockId, onSelect }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { distance: 8 }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      
      const newBlocks = [...blocks];
      [newBlocks[oldIndex], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[oldIndex]];
      onBlocksReorder(newBlocks);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {blocks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Keine Blöcke. Fügen Sie einen hinzu, um zu beginnen.</p>
            </div>
          ) : (
            blocks.map(block => (
              <SortableBlock
                key={block.id}
                block={block}
                onUpdate={onUpdate}
                onDelete={onDelete}
                isSelected={selectedBlockId === block.id}
                onSelect={onSelect}
              />
            ))
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}