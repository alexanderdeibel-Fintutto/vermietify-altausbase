import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Code, Layout, GripVertical } from 'lucide-react';
import TemplateComponentLibrary from './TemplateComponentLibrary';
import TemplateDesignPanel from './TemplateDesignPanel';
import TemplateBlockEditor from './TemplateBlockEditor';
import TemplateCanvasPreview from './TemplateCanvasPreview';

export default function VisualTemplateBuilder({ template, onChange }) {
  const [blocks, setBlocks] = useState(template.blocks || []);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [design, setDesign] = useState(template.design || {
    primaryColor: '#1e293b',
    font: 'Arial, sans-serif',
    spacing: 'medium',
    borderRadius: '0.5rem'
  });

  const handleAddBlock = (blockType) => {
    const newBlock = {
      id: `block_${Date.now()}`,
      type: blockType,
      content: blockType === 'text' ? 'Text eingeben...' : '',
      styles: {}
    };
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    setSelectedBlockId(newBlock.id);
    onChange({ ...template, blocks: newBlocks });
  };

  const handleUpdateBlock = (blockId, updates) => {
    const newBlocks = blocks.map(b => b.id === blockId ? { ...b, ...updates } : b);
    setBlocks(newBlocks);
    onChange({ ...template, blocks: newBlocks });
  };

  const handleDeleteBlock = (blockId) => {
    const newBlocks = blocks.filter(b => b.id !== blockId);
    setBlocks(newBlocks);
    setSelectedBlockId(null);
    onChange({ ...template, blocks: newBlocks });
  };

  const moveBlock = (fromIndex, toIndex) => {
    const newBlocks = [...blocks];
    [newBlocks[fromIndex], newBlocks[toIndex]] = [newBlocks[toIndex], newBlocks[fromIndex]];
    setBlocks(newBlocks);
    onChange({ ...template, blocks: newBlocks });
  };

  const handleDesignChange = (newDesign) => {
    setDesign(newDesign);
    onChange({ ...template, design: newDesign });
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="visual" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="visual" className="gap-2">
            <Layout className="w-4 h-4" /> Visual
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-2">
            <Eye className="w-4 h-4" /> Design
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="w-4 h-4" /> Vorschau
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {/* Component Library */}
            <div className="col-span-1 bg-slate-50 rounded-lg p-4 border">
              <TemplateComponentLibrary onAddBlock={handleAddBlock} />
            </div>

            {/* Canvas */}
            <div className="col-span-2">
              <div className="bg-white border-2 border-slate-200 rounded-lg min-h-96 p-6 shadow-sm">
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <div className="space-y-3">
                    {blocks.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        Komponenten links hinzufügen zum starten
                      </div>
                    ) : (
                      blocks.map(block => (
                        <div
                          key={block.id}
                          className={`p-3 border rounded cursor-move ${
                            selectedBlockId === block.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                          onClick={() => setSelectedBlockId(block.id)}
                        >
                          <TemplateBlockEditor
                            block={block}
                            isSelected={selectedBlockId === block.id}
                            onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                            onDelete={() => handleDeleteBlock(block.id)}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </DndContext>
              </div>
            </div>

            {/* Block Inspector */}
            <div className="col-span-1">
              {selectedBlockId ? (
                <TemplateBlockEditor
                  block={blocks.find(b => b.id === selectedBlockId)}
                  isSelected={true}
                  onUpdate={(updates) => handleUpdateBlock(selectedBlockId, updates)}
                  onDelete={() => handleDeleteBlock(selectedBlockId)}
                  showInspector={true}
                />
              ) : (
                <div className="bg-slate-50 rounded-lg p-4 text-center text-slate-500 text-sm">
                  Block auswählen zum Bearbeiten
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="design" className="space-y-4">
          <TemplateDesignPanel design={design} onChange={handleDesignChange} />
        </TabsContent>

        <TabsContent value="preview">
          <TemplateCanvasPreview blocks={blocks} design={design} template={template} />
        </TabsContent>
      </Tabs>
    </div>
  );
}