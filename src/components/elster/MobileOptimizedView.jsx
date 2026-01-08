import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Eye, Edit3, Share2, Download,
  CheckCircle, AlertCircle, Clock, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function MobileOptimizedView({ submissions, onSelectSubmission }) {
  const statusConfig = {
    DRAFT: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    AI_PROCESSED: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    VALIDATED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    SUBMITTED: { icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    ACCEPTED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    REJECTED: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
  };

  return (
    <div className="space-y-3">
      {submissions.map((sub, idx) => {
        const config = statusConfig[sub.status] || statusConfig.DRAFT;
        const StatusIcon = config.icon;

        return (
          <motion.div
            key={sub.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onSelectSubmission(sub)}
            >
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                      <FileText className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div>
                      <div className="font-semibold">{sub.tax_form_type}</div>
                      <div className="text-sm text-slate-600">
                        {sub.legal_form} · {sub.tax_year}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={`${config.bg} ${config.color} border ${config.border}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {sub.status}
                  </Badge>
                  
                  {sub.ai_confidence_score && (
                    <Badge variant="outline">
                      KI: {sub.ai_confidence_score}%
                    </Badge>
                  )}

                  {sub.validation_errors?.length > 0 && (
                    <Badge variant="destructive">
                      {sub.validation_errors.length} Fehler
                    </Badge>
                  )}
                </div>

                {/* Key Metrics */}
                {sub.form_data && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {sub.form_data.einnahmen && (
                      <div className="p-2 bg-green-50 rounded">
                        <div className="text-green-600 mb-1">Einnahmen</div>
                        <div className="font-bold text-green-700">
                          {sub.form_data.einnahmen.toLocaleString('de-DE')} €
                        </div>
                      </div>
                    )}
                    {sub.form_data.werbungskosten && (
                      <div className="p-2 bg-red-50 rounded">
                        <div className="text-red-600 mb-1">Ausgaben</div>
                        <div className="font-bold text-red-700">
                          {sub.form_data.werbungskosten.toLocaleString('de-DE')} €
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSubmission(sub);
                    }}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Ansehen
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    PDF
                  </Button>
                </div>

                {/* Timestamp */}
                <div className="text-xs text-slate-500 mt-2 text-center">
                  {sub.created_date && new Date(sub.created_date).toLocaleDateString('de-DE')}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      {submissions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">Keine Einreichungen für die ausgewählten Jahre</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}