import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { 
  FileText, 
  Loader2,
  CheckCircle,
  Zap,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentationSummary({ documentation }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('summarizeDocumentation', {
        markdownContent: documentation.content_markdown,
        maxLength: 500
      });

      setSummary(response.data);
      toast.success('Zusammenfassung erstellt');
    } catch (error) {
      toast.error('Fehler bei Zusammenfassung: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary.summary);
    toast.success('Zusammenfassung kopiert');
  };

  const getComplexityColor = (rating) => {
    switch (rating) {
      case 'HIGH': return 'bg-red-100 text-red-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'LOW': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Executive Summary
          </CardTitle>
          <Button
            size="sm"
            onClick={generateSummary}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Generiere...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-1" />
                Zusammenfassen
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      {summary && summary.needs_summary && (
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-600">Wörter:</span>
              <span className="font-semibold text-slate-900">{summary.word_count}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600">Kompression:</span>
              <span className="font-semibold text-blue-600">{summary.compression_ratio}%</span>
            </div>
            <Badge className={getComplexityColor(summary.complexity_rating)}>
              {summary.complexity_rating} Komplexität
            </Badge>
          </div>

          {/* Executive Summary */}
          <div className="bg-white border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-slate-900">📋 Zusammenfassung</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {summary.summary}
            </p>
          </div>

          {/* Key Points */}
          {summary.key_points && summary.key_points.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">🎯 Kernaussagen</h4>
              <ul className="space-y-2">
                {summary.key_points.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Items */}
          {summary.action_items && summary.action_items.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">⚡ Handlungsempfehlungen</h4>
              <ul className="space-y-2">
                {summary.action_items.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}

      {summary && !summary.needs_summary && (
        <CardContent>
          <p className="text-sm text-slate-600">
            Diese Dokumentation ist kurz genug und benötigt keine Zusammenfassung ({summary.word_count} Wörter).
          </p>
        </CardContent>
      )}
    </Card>
  );
}