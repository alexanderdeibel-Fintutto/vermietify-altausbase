import React, { useState, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Lightbulb, Zap, TrendingUp, Loader2 } from 'lucide-react';

export default function AdminAIAnalytics() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('patterns');

  // Fetch patterns
  const { data: patterns, refetch: refetchPatterns } = useQuery({
    queryKey: ['uxPatterns'],
    queryFn: async () => {
      return base44.functions.invoke('analyzeUXPatterns', {
        min_frequency: 2
      });
    },
    staleTime: 5 * 60 * 1000, // 5min cache.
    gcTime: 15 * 60 * 1000 // 15min garbage collection
  });

  // Fetch insights
  const { data: insights } = useQuery({
    queryKey: ['aiInsights', patterns?.data?.patterns],
    queryFn: async () => {
      if (!patterns?.data?.patterns) return null;
      return base44.functions.invoke('generateAIInsights', {
        patterns: patterns.data.patterns,
        analytics_data: {}
      });
    },
    enabled: !!patterns?.data?.patterns,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  // Fetch A/B tests
  const { data: abTests } = useQuery({
    queryKey: ['abTests', insights?.data?.insights],
    queryFn: async () => {
      if (!insights?.data?.insights) return null;
      return base44.functions.invoke('generateABTestRecommendations', {
        insights: insights.data.insights,
        user_segments: []
      });
    },
    enabled: !!insights?.data?.insights,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  // Memoize computed stats
  const stats = useMemo(() => ({
    patterns_found: patterns?.data?.patterns_found || 0,
    insights_generated: insights?.data?.insights_generated || 0,
    ab_test_recommendations: abTests?.data?.ab_test_recommendations || 0
  }), [patterns?.data?.patterns_found, insights?.data?.insights_generated, abTests?.data?.ab_test_recommendations]);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      await refetchPatterns();
    } finally {
      setLoading(false);
    }
  }, [refetchPatterns]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light text-slate-900 mb-2">🤖 AI-gesteuerte UX-Analytics</h1>
            <p className="text-sm font-light text-slate-600">Automatische Pattern-Erkennung, Sentiment-Analyse & A/B-Test-Empfehlungen</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-slate-700 hover:bg-slate-800 font-light gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Neu analysieren
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-white border border-slate-200">
            <p className="text-sm font-light text-slate-600 mb-2">Erkannte Muster</p>
            <h3 className="text-2xl font-light text-slate-900">{stats.patterns_found}</h3>
          </Card>
          <Card className="p-6 bg-white border border-slate-200">
            <p className="text-sm font-light text-slate-600 mb-2">AI-Insights</p>
            <h3 className="text-2xl font-light text-slate-900">{stats.insights_generated}</h3>
          </Card>
          <Card className="p-6 bg-white border border-slate-200">
            <p className="text-sm font-light text-slate-600 mb-2">A/B-Test-Empfehlungen</p>
            <h3 className="text-2xl font-light text-slate-900">{stats.ab_test_recommendations}</h3>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white rounded-lg border border-slate-200">
          <TabsList className="grid w-full grid-cols-3 border-b border-slate-200 bg-slate-50 font-light">
            <TabsTrigger value="patterns">🔍 UX-Muster</TabsTrigger>
            <TabsTrigger value="insights">💡 AI-Insights</TabsTrigger>
            <TabsTrigger value="abtests">🧪 A/B-Tests</TabsTrigger>
          </TabsList>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="p-6 space-y-4">
            {patterns?.data?.patterns?.length > 0 ? (
              <div className="space-y-3">
                {patterns.data.patterns.map((pattern, idx) => (
                  <Card key={idx} className="p-4 border border-slate-200 hover:border-slate-300 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-light text-slate-900 flex items-center gap-2">
                          {pattern.pattern_type === 'dropout_pattern' && '🚫'}
                          {pattern.pattern_type === 'success_pattern' && '✅'}
                          {pattern.pattern_type === 'click_pattern' && '🖱️'}
                          {pattern.pattern_name}
                        </h4>
                        <p className="text-sm font-light text-slate-600 mt-1">{pattern.description}</p>
                      </div>
                      <Badge
                        className={`font-light ${
                          pattern.sentiment_analysis?.sentiment === 'negative'
                            ? 'bg-red-100 text-red-800'
                            : pattern.sentiment_analysis?.sentiment === 'positive'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {pattern.sentiment_analysis?.sentiment === 'negative' && '😞 Negativ'}
                        {pattern.sentiment_analysis?.sentiment === 'positive' && '😊 Positiv'}
                        {pattern.sentiment_analysis?.sentiment === 'neutral' && '😐 Neutral'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-light text-slate-600 mb-3">
                      <div>📊 Häufigkeit: <strong>{pattern.frequency}</strong></div>
                      <div>👥 User: <strong>{pattern.user_count}</strong></div>
                      <div>📈 Anteil: <strong>{pattern.frequency_percentage}%</strong></div>
                      <div>💥 Impact: <strong>{Math.round(pattern.impact_score)}/100</strong></div>
                    </div>

                    {pattern.recommendations?.length > 0 && (
                      <div className="bg-blue-50 rounded p-3 text-sm font-light text-slate-700">
                        <p className="font-semibold mb-1">💡 Empfehlungen:</p>
                        <ul className="space-y-1 ml-4 list-disc">
                          {pattern.recommendations.slice(0, 2).map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 font-light py-8">Analysiere zuerst Tester-Daten...</p>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="p-6 space-y-4">
            {insights?.data?.insights?.length > 0 ? (
              <div className="space-y-3">
                {insights.data.insights.map((insight, idx) => (
                  <Card key={idx} className="p-4 border border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-light text-slate-900 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-500" />
                          {insight.title}
                        </h4>
                        <p className="text-sm font-light text-slate-600 mt-2">{insight.description}</p>
                      </div>
                      <Badge className={`font-light ${
                        insight.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        insight.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {insight.priority?.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm font-light text-slate-700 mt-3">
                      <p><strong>Root Cause:</strong> {insight.ai_analysis}</p>
                      <p><strong>Empfehlung:</strong> {insight.recommendation}</p>
                      {insight.expected_impact && (
                        <div className="bg-green-50 p-2 rounded">
                          <p><strong>📈 Erwarteter Impact:</strong></p>
                          <p>Verbesserung: {insight.expected_impact.improvement_percentage}%</p>
                          <p>Von {insight.expected_impact.current_value} → {insight.expected_impact.predicted_value}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 font-light py-8">Keine Insights generiert...</p>
            )}
          </TabsContent>

          {/* A/B Tests Tab */}
          <TabsContent value="abtests" className="p-6 space-y-4">
            {abTests?.data?.recommendations?.length > 0 ? (
              <div className="space-y-3">
                {abTests.data.recommendations.map((rec, idx) => (
                  <Card key={idx} className="p-4 border border-slate-200">
                    <h4 className="font-light text-slate-900 mb-3 text-lg">{rec.ab_test.test_name}</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm font-light">
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="font-semibold text-slate-900 mb-1">✅ Control (aktuell)</p>
                        <p className="text-slate-700">{rec.ab_test.control_variant}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <p className="font-semibold text-slate-900 mb-1">🧪 Variante (neu)</p>
                        <p className="text-slate-700">{rec.ab_test.test_variant}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded mb-3 text-sm font-light">
                      <p><strong>📋 Hypothese:</strong> {rec.ab_test.hypothesis}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-light text-slate-600">
                      <div>📊 Sample-Größe: <strong>{rec.ab_test.sample_size}</strong></div>
                      <div>⏱️ Dauer: <strong>{rec.ab_test.duration_days} Tage</strong></div>
                      <div>📈 Expected Lift: <strong>+{rec.ab_test.expected_lift}%</strong></div>
                      <div>🎯 Metriken: <strong>{rec.ab_test.success_metrics?.length}</strong></div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <Button className="w-full bg-slate-700 hover:bg-slate-800 font-light text-sm">
                        A/B-Test starten
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 font-light py-8">Keine A/B-Test-Empfehlungen verfügbar...</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}