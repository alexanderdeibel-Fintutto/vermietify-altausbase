import React from 'react';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminAnalyticsDashboardPage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: feedbackList = [] } = useQuery({
    queryKey: ['user-feedback'],
    queryFn: () => base44.entities.TenantFeedback.list('-created_date', 100)
  });

  if (user?.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-600">Zugriff verweigert. Nur für Administratoren.</p>
      </div>
    );
  }

  const avgRating = feedbackList.length > 0
    ? feedbackList.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbackList.filter(f => f.rating).length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-light text-slate-900">Analytics & Feedback</h1>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      <Tabs defaultValue="analytics">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="feedback">
            User Feedback ({feedbackList.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feedback-Übersicht</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">Gesamt</p>
                  <p className="text-2xl font-bold">{feedbackList.length}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-slate-600">Ø Bewertung</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {avgRating.toFixed(1)}/3
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-slate-600">Mit Text</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {feedbackList.filter(f => f.comment).length}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {feedbackList.map((feedback) => (
                  <div key={feedback.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{feedback.feedback_type || 'Allgemein'}</p>
                        <p className="text-xs text-slate-500">{feedback.page_context}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map(r => (
                          <div
                            key={r}
                            className={`w-2 h-2 rounded-full ${
                              r <= feedback.rating ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {feedback.comment && (
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded">
                        "{feedback.comment}"
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(feedback.created_date).toLocaleString('de-DE')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}