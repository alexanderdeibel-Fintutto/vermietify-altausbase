import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Code, Layout, GripVertical, RotateCcw, RotateCw, Download } from 'lucide-react';
import TemplateComponentLibrary from './TemplateComponentLibrary';
import TemplateDesignPanel from './TemplateDesignPanel';
import TemplateBlockEditor from './TemplateBlockEditor';
import TemplateCanvasPreview from './TemplateCanvasPreview';
import PageSetupPanel from './PageSetupPanel';
import { UndoRedoManager } from './UndoRedoManager';
import { exportTemplateAsHTML, exportTemplateAsPDF } from './TemplateExporter';

export default function VisualTemplateBuilder({ template, onChange }) {
  const [blocks, setBlocks] = useState(template.blocks || []);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [design, setDesign] = useState(template.design || {
    primaryColor: '#1e293b',
    font: 'Arial, sans-serif',
    spacing: 'medium',
    borderRadius: '0.5rem'
  });
  const [pageSetup, setPageSetup] = useState(template.pageSetup || {
    format: 'a4',
    width: 210,
    height: 297,
    marginTop: 20,
    marginRight: 20,
    marginBottom: 20,
    marginLeft: 20,
    orientation: 'portrait'
  });
  const [undoRedo] = useState(() => new UndoRedoManager({ blocks, design, pageSetup }));
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const unsubscribe = undoRedo.subscribe(() => {
      setCanUndo(undoRedo.canUndo());
      setCanRedo(undoRedo.canRedo());
    });
    return unsubscribe;
  }, [undoRedo]);

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
    undoRedo.push({ blocks: newBlocks, design, pageSetup });
    onChange({ ...template, blocks: newBlocks });
  };

  const handleUpdateBlock = (blockId, updates) => {
    const newBlocks = blocks.map(b => b.id === blockId ? { ...b, ...updates } : b);
    setBlocks(newBlocks);
    undoRedo.push({ blocks: newBlocks, design, pageSetup });
    onChange({ ...template, blocks: newBlocks });
  };

  const handleDeleteBlock = (blockId) => {
    const newBlocks = blocks.filter(b => b.id !== blockId);
    setBlocks(newBlocks);
    setSelectedBlockId(null);
    undoRedo.push({ blocks: newBlocks, design, pageSetup });
    onChange({ ...template, blocks: newBlocks });
  };

  const moveBlock = (fromIndex, toIndex) => {
    const newBlocks = [...blocks];
    [newBlocks[fromIndex], newBlocks[toIndex]] = [newBlocks[toIndex], newBlocks[fromIndex]];
    setBlocks(newBlocks);
    undoRedo.push({ blocks: newBlocks, design, pageSetup });
    onChange({ ...template, blocks: newBlocks });
  };

  const handleDesignChange = (newDesign) => {
    setDesign(newDesign);
    undoRedo.push({ blocks, design: newDesign, pageSetup });
    onChange({ ...template, design: newDesign });
  };

  const handlePageSetupChange = (newPageSetup) => {
    setPageSetup(newPageSetup);
    undoRedo.push({ blocks, design, pageSetup: newPageSetup });
    onChange({ ...template, pageSetup: newPageSetup });
  };

  const handleUndo = () => {
    const state = undoRedo.undo();
    if (state) {
      setBlocks(state.blocks);
      setDesign(state.design);
      setPageSetup(state.pageSetup);
      onChange({ ...template, ...state });
    }
  };

  const handleRedo = () => {
    const state = undoRedo.redo();
    if (state) {
      setBlocks(state.blocks);
      setDesign(state.design);
      setPageSetup(state.pageSetup);
      onChange({ ...template, ...state });
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      if (format === 'html') {
        await exportTemplateAsHTML(blocks, design, pageSetup);
      } else if (format === 'pdf') {
        await exportTemplateAsPDF(blocks, design, pageSetup);
      }
    } catch (err) {
      console.error('Export fehler:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-2 bg-white p-3 rounded-lg border">
        <Button
          size="sm"
          variant="outline"
          onClick={handleUndo}
          disabled={!canUndo}
          className="gap-1 h-8 text-xs"
          title="Rückgängig machen"
        >
          <RotateCcw className="w-3 h-3" /> Undo
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRedo}
          disabled={!canRedo}
          className="gap-1 h-8 text-xs"
          title="Wiederherstellen"
        >
          <RotateCw className="w-3 h-3" /> Redo
        </Button>
        <div className="border-l mx-2"></div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleExport('html')}
          disabled={exporting}
          className="gap-1 h-8 text-xs"
        >
          <Download className="w-3 h-3" /> HTML
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleExport('pdf')}
          disabled={exporting}
          className="gap-1 h-8 text-xs"
        >
          <Download className="w-3 h-3" /> PDF
        </Button>
      </div>

      <Tabs defaultValue="visual" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="visual" className="gap-2">
            <Layout className="w-4 h-4" /> Visual
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-2">
            <Eye className="w-4 h-4" /> Design
          </TabsTrigger>
          <TabsTrigger value="pages" className="gap-2">
            <Layout className="w-4 h-4" /> Seite
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

            {/* Canvas mit Drag & Drop */}
            <div className="col-span-2">
              <div className="bg-white border-2 border-slate-200 rounded-lg min-h-96 p-6 shadow-sm">
                <DragDropTemplateBuilder
                  blocks={blocks}
                  onBlocksReorder={(newBlocks) => {
                    setBlocks(newBlocks);
                    undoRedo.push({ blocks: newBlocks, design, pageSetup });
                    onChange({ ...template, blocks: newBlocks });
                  }}
                  onUpdate={(id, updates) => handleUpdateBlock(id, updates)}
                  onDelete={(id) => handleDeleteBlock(id)}
                  selectedBlockId={selectedBlockId}
                  onSelect={setSelectedBlockId}
                />
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

        <TabsContent value="pages">
          <PageSetupPanel pageSetup={pageSetup} onChange={handlePageSetupChange} />
        </TabsContent>

        <TabsContent value="preview">
          <TemplateCanvasPreview blocks={blocks} design={design} template={template} />
        </TabsContent>
      </Tabs>
    </div>
  );
}