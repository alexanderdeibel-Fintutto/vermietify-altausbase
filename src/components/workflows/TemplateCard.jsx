import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Copy, Star } from 'lucide-react';

const ICONS = {
  Zap: Zap,
  Star: Star,
  Copy: Copy
};

export default function TemplateCard({ template, onUse, onInfo }) {
  const Icon = ICONS[template.icon] || Zap;

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-blue-100 text-blue-700',
    advanced: 'bg-orange-100 text-orange-700'
  };

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      <div 
        className="h-2"
        style={{ backgroundColor: template.color }}
      />
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4 text-slate-600" />
              <CardTitle className="text-base">{template.name}</CardTitle>
            </div>
            <p className="text-xs text-slate-600">{template.category}</p>
          </div>
          {template.usage_count > 0 && (
            <Badge variant="secondary" className="text-xs">
              {template.usage_count}× verwendet
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-slate-700 line-clamp-2">
          {template.description}
        </p>

        <div className="flex flex-wrap gap-1">
          {template.tags?.slice(0, 3).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.tags?.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{template.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <Badge className={difficultyColors[template.difficulty]}>
            {template.difficulty}
          </Badge>
          <Button
            size="sm"
            onClick={() => onUse(template)}
            className="gap-1"
          >
            <Copy className="w-3 h-3" />
            Verwenden
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}