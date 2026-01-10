import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, BarChart3 } from 'lucide-react';

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700'
};

export default function TemplateCard({ template, onSelect }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-sm">{template.name}</h3>
            <p className="text-xs text-slate-600 mt-1">{template.description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {template.category && (
            <Badge variant="outline" className="text-xs">
              {template.category}
            </Badge>
          )}
          {template.difficulty && (
            <Badge className={`text-xs ${DIFFICULTY_COLORS[template.difficulty] || ''}`}>
              {template.difficulty}
            </Badge>
          )}
        </div>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t">
          <div className="flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            <span>{template.usage_count || 0}x verwendet</span>
          </div>
        </div>

        {/* Action */}
        <Button
          onClick={() => onSelect(template)}
          size="sm"
          className="w-full"
        >
          <Copy className="w-3 h-3 mr-1" />
          Verwenden
        </Button>
      </CardContent>
    </Card>
  );
}