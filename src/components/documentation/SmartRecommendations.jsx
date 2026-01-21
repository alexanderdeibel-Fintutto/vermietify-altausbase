import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { 
  Sparkles, 
  Loader2,
  ArrowRight,
  Star,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

export default function SmartRecommendations({ generatedTypes = [], onGenerate }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, [generatedTypes]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('recommendDocumentation', {
        generatedTypes,
        userActivity: {
          last_generated: generatedTypes[generatedTypes.length - 1],
          total_generated: generatedTypes.length,
          timestamp: new Date().toISOString()
        }
      });

      setRecommendations(response.data);
    } catch (error) {
      console.error('Recommendation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-700 border-red-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'LOW': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  if (loading) {
    return (
      <Card className="border-emerald-200">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-sm text-slate-600">Erstelle personalisierte Empfehlungen...</p>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations) return null;

  return (
    <div className="space-y-4">
      {/* Progress Overview */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Fortschritt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-700">Dokumentation abgeschlossen</span>
            <span className="font-bold text-2xl text-emerald-600">
              {recommendations.completion_percentage?.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-emerald-200 rounded-full h-3">
            <div 
              className="bg-emerald-600 h-3 rounded-full transition-all"
              style={{ width: `${recommendations.completion_percentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-600 mt-2">
            {generatedTypes.length} von {recommendations.total_count} Bereichen erstellt
          </p>
        </CardContent>
      </Card>

      {/* Next Best Action */}
      {recommendations.next_best_action && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 mb-1">Nächster Schritt:</p>
                <p className="text-sm text-blue-700">{recommendations.next_best_action}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-600" />
            Personalisierte Empfehlungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recommendations.recommendations?.slice(0, 5).map((rec, idx) => (
            <div 
              key={idx}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:border-emerald-400 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-slate-900">{rec.title}</span>
                    <Badge className={getPriorityColor(rec.priority)}>
                      {rec.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Nutzen: {rec.estimated_value}/10
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{rec.description}</p>
                  <p className="text-sm text-emerald-700">
                    <strong>Warum:</strong> {rec.reason}
                  </p>
                  {rec.dependencies && rec.dependencies.length > 0 && (
                    <p className="text-xs text-slate-500 mt-2">
                      Abhängigkeiten: {rec.dependencies.join(', ')}
                    </p>
                  )}
                  <div className="flex gap-3 mt-2 text-xs text-slate-500">
                    <span>~{rec.estimatedDuration}s</span>
                    <span>•</span>
                    <span>{rec.estimatedSize}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => onGenerate(rec.documentation_type)}
                  className="bg-emerald-600 hover:bg-emerald-700 flex-shrink-0"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}