import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Check } from 'lucide-react';

export default function QuickTemplateSelector({ 
  templates = [],
  onSelect,
  loading = false,
  showCopyFeedback = true
}) {
  const [copied, setCopied] = React.useState(null);

  const handleSelect = (template) => {
    onSelect?.(template);
    if (showCopyFeedback) {
      setCopied(template.id);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {templates.map(template => (
        <Card
          key={template.id}
          className="p-3 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-sm text-slate-900">{template.name}</p>
              {template.description && (
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {template.description}
                </p>
              )}
            </div>
            <Button
              onClick={() => handleSelect(template)}
              disabled={loading}
              size="sm"
              className="h-7 w-7 p-0 flex-shrink-0 bg-blue-600 hover:bg-blue-700"
            >
              {copied === template.id ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}