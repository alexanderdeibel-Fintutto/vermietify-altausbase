import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import WorkflowNode from './WorkflowNode';
import NodeLibrary from './NodeLibrary';

export default function WorkflowCanvas({ workflow, onChange }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const addNode = (nodeType, actionType) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: nodeType,
      action_type: actionType,
      parameters: {},
      order: (workflow.steps || []).length,
      ...(nodeType === 'approval' && {
        approval_config: {
          approvers: [],
          approval_type: 'sequential',
          timeout_days: 5
        }
      })
    };

    onChange({
      ...workflow,
      steps: [...(workflow.steps || []), newNode]
    });
  };

  const updateNode = (nodeId, updates) => {
    onChange({
      ...workflow,
      steps: workflow.steps.map(step =>
        step.id === nodeId ? { ...step, ...updates } : step
      )
    });
  };

  const deleteNode = (nodeId) => {
    const newSteps = workflow.steps.filter(step => step.id !== nodeId);
    onChange({
      ...workflow,
      steps: newSteps
    });
    setSelectedNode(null);
  };

  const connectNodes = (fromId, toId) => {
    updateNode(fromId, { next_step_id: toId });
  };

  const reorderNodes = (fromIndex, toIndex) => {
    const newSteps = [...workflow.steps];
    const [removed] = newSteps.splice(fromIndex, 1);
    newSteps.splice(toIndex, 0, removed);

    const reordered = newSteps.map((step, idx) => ({
      ...step,
      order: idx
    }));

    onChange({
      ...workflow,
      steps: reordered
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Workflow-Schritte</h3>
        <NodeLibrary onAddNode={addNode} />
      </div>

      {/* Canvas */}
      <Card className="bg-slate-50 min-h-96 overflow-auto">
        <CardContent className="pt-6">
          {workflow.steps && workflow.steps.length > 0 ? (
            <div className="space-y-3">
              {workflow.steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`relative ${selectedNode?.id === step.id ? 'ring-2 ring-blue-500 rounded' : ''}`}
                  onClick={() => setSelectedNode(step)}
                >
                  <WorkflowNode
                    node={step}
                    onUpdate={(updates) => updateNode(step.id, updates)}
                    onDelete={() => deleteNode(step.id)}
                    isSelected={selectedNode?.id === step.id}
                  />
                  {index < workflow.steps.length - 1 && (
                    <div className="flex justify-center py-2">
                      <div className="w-0.5 h-6 bg-slate-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">Fügen Sie einen Schritt hinzu, um zu beginnen</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Node Details */}
      {selectedNode && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-slate-900">Schritt bearbeiten</h4>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteNode(selectedNode.id)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Löschen
              </Button>
            </div>
            <WorkflowNodeDetails
              node={selectedNode}
              onUpdate={(updates) => {
                updateNode(selectedNode.id, updates);
                setSelectedNode({ ...selectedNode, ...updates });
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function WorkflowNodeDetails({ node, onUpdate }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">Schritt-Typ</label>
        <p className="text-sm text-slate-600 mt-1">{node.type}</p>
      </div>

      {node.type === 'action' && (
        <div>
          <label className="text-sm font-medium text-slate-700">Aktion</label>
          <p className="text-sm text-slate-600 mt-1">{node.action_type}</p>
        </div>
      )}

      {node.type === 'approval' && (
        <>
          <div>
            <label className="text-sm font-medium text-slate-700">Genehmigungstyp</label>
            <select
              value={node.approval_config?.approval_type || 'sequential'}
              onChange={(e) =>
                onUpdate({
                  approval_config: {
                    ...node.approval_config,
                    approval_type: e.target.value
                  }
                })
              }
              className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-md text-sm"
            >
              <option value="sequential">Sequenziell (nacheinander)</option>
              <option value="parallel">Parallel (gleichzeitig)</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Timeout (Tage)</label>
            <input
              type="number"
              value={node.approval_config?.timeout_days || 5}
              onChange={(e) =>
                onUpdate({
                  approval_config: {
                    ...node.approval_config,
                    timeout_days: parseInt(e.target.value)
                  }
                })
              }
              className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-md text-sm"
            />
          </div>
        </>
      )}
    </div>
  );
}