import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, CheckCircle2, FileText, Clock } from 'lucide-react';

export default function WorkflowNode({ node, onUpdate, onDelete, isSelected }) {
  const getNodeIcon = () => {
    switch (node.type) {
      case 'action':
        return <FileText className="w-4 h-4" />;
      case 'approval':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'condition':
        return <div className="w-4 h-4 border-2 rounded" />;
      case 'delay':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getNodeLabel = () => {
    switch (node.type) {
      case 'action':
        return node.action_type ? node.action_type.replace(/_/g, ' ') : 'Aktion';
      case 'approval':
        return `Genehmigung (${node.approval_config?.approval_type || 'Sequential'})`;
      case 'condition':
        return 'Bedingung';
      case 'delay':
        return 'Verzögerung';
      default:
        return 'Schritt';
    }
  };

  const getNodeColor = () => {
    switch (node.type) {
      case 'action':
        return 'bg-blue-50 border-blue-200';
      case 'approval':
        return 'bg-green-50 border-green-200';
      case 'condition':
        return 'bg-purple-50 border-purple-200';
      case 'delay':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <Card className={`p-4 border-2 ${getNodeColor()} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center">
            {getNodeIcon()}
          </div>
          <div>
            <p className="font-medium text-sm text-slate-900">{getNodeLabel()}</p>
            {node.order !== undefined && (
              <Badge variant="outline" className="mt-1 text-xs">
                Schritt {node.order + 1}
              </Badge>
            )}
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onDelete}
          className="text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {node.type === 'approval' && node.approval_config?.approvers && (
        <div className="mt-3 text-xs text-slate-600">
          <p>Genehmiger: {node.approval_config.approvers.length > 0 ? node.approval_config.approvers.join(', ') : 'Nicht konfiguriert'}</p>
        </div>
      )}
    </Card>
  );
}