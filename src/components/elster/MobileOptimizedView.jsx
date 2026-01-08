import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Download, Send, Eye } from 'lucide-react';

export default function MobileOptimizedView({ submissions = [] }) {
  const [expandedId, setExpandedId] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'DRAFT': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-2">
      {submissions.map(sub => (
        <div key={sub.id} className="border rounded-lg overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100"
          >
            <div className="text-left flex-1">
              <div className="font-medium text-sm">{sub.tax_form_type}</div>
              <div className="text-xs text-slate-600">{sub.tax_year} • {sub.legal_form}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(sub.status)} variant="outline">
                {sub.status}
              </Badge>
              <ChevronRight 
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  expandedId === sub.id ? 'rotate-90' : ''
                }`} 
              />
            </div>
          </button>

          {/* Expanded Content */}
          {expandedId === sub.id && (
            <div className="border-t px-4 py-3 bg-slate-50 space-y-3">
              {sub.ai_confidence_score && (
                <div>
                  <div className="text-xs text-slate-600 mb-1">KI-Vertrauen</div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${sub.ai_confidence_score}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-700 mt-1">{sub.ai_confidence_score}%</div>
                </div>
              )}

              {sub.submission_date && (
                <div>
                  <div className="text-xs text-slate-600">Übermittelt</div>
                  <div className="text-sm">
                    {new Date(sub.submission_date).toLocaleDateString('de-DE')}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs">
                  <Eye className="w-3 h-3 mr-1" />
                  Ansehen
                </Button>
                {sub.status === 'DRAFT' && (
                  <>
                    <Button size="sm" variant="outline" className="flex-1 text-xs">
                      <Send className="w-3 h-3 mr-1" />
                      Senden
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline" className="flex-1 text-xs">
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}