import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function AIRecommendationsPanel({ buildingId }) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const handleGenerateRecommendations = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateAIRecommendations', {
        buildingId
      });

      setRecommendations(response.data.recommendations);
      toast.success('Empfehlungen generiert');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'HIGH':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'MEDIUM':
        return <Info className="w-5 h-5 text-yellow-600" />;
      case 'LOW':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      default:
        return null;
    }
  };

  const getPriorityBg = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-50 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-50 border-yellow-200';
      case 'LOW':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Sparkles className="w-5 h-5" />
              KI-Empfehlungen
            </CardTitle>
            <Button
              onClick={handleGenerateRecommendations}
              disabled={loading}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Generiere...
                </>
              ) : (
                'Generieren'
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {recommendations.length > 0 && (
        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <Card
              key={idx}
              className={`border-2 cursor-pointer transition-all ${getPriorityBg(rec.priority)}`}
              onClick={() => setExpandedId(expandedId === idx ? null : idx)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  {getPriorityIcon(rec.priority)}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900">{rec.title}</h3>
                    <p className="text-xs text-slate-600 mt-1">{rec.impact}</p>

                    {expandedId === idx && (
                      <div className="mt-4 pt-4 border-t border-current space-y-2">
                        <div>
                          <p className="text-xs font-medium text-slate-700">Beschreibung</p>
                          <p className="text-sm text-slate-700 mt-1">{rec.description}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700">Aktion</p>
                          <p className="text-sm text-slate-700 mt-1">{rec.action}</p>
                        </div>
                        <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700">
                          Umsetzen
                        </Button>
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                    rec.priority === 'HIGH' ? 'bg-red-200 text-red-900' :
                    rec.priority === 'MEDIUM' ? 'bg-yellow-200 text-yellow-900' :
                    'bg-green-200 text-green-900'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && recommendations.length === 0 && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6 text-center text-sm text-gray-600">
            Klicken Sie auf "Generieren" um personalisierte Empfehlungen zu erhalten
          </CardContent>
        </Card>
      )}
    </div>
  );
}