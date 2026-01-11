import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, Star, TrendingUp, TrendingDown } from 'lucide-react';

export default function TenantFeedbackWidget({ companyId }) {
  const { data: feedback = [] } = useQuery({
    queryKey: ['tenant-feedback', companyId],
    queryFn: () => base44.entities.TenantFeedback.filter({ company_id: companyId }, '-created_date', 30)
  });

  const avgRating = feedback.length > 0
    ? feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length
    : 0;

  const last7Days = feedback.slice(0, 7).reverse();
  const chartData = last7Days.map((f, i) => ({
    day: `Tag ${i + 1}`,
    rating: f.rating || 0
  }));

  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: feedback.filter(f => f.rating === rating).length
  }));

  const trend = feedback.length >= 2
    ? feedback[0].rating > feedback[feedback.length - 1].rating
    : null;

  const positiveCount = feedback.filter(f => f.rating >= 4).length;
  const negativeCount = feedback.filter(f => f.rating <= 2).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="w-5 h-5 text-green-600" />
          Mieter-Feedback & KI-Zufriedenheit
        </CardTitle>
      </CardHeader>
      <CardContent>
        {feedback.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600">Kein Feedback verfügbar</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-3xl font-bold text-slate-900">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-slate-600">/ 5.0</span>
                </div>
                <p className="text-xs text-slate-600">Durchschnittliche Bewertung</p>
                {trend !== null && (
                  <Badge className={`mt-2 ${trend ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {trend ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {trend ? 'Steigend' : 'Fallend'}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Positiv (4-5★)
                  </span>
                  <span className="font-medium">{positiveCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    Negativ (1-2★)
                  </span>
                  <span className="font-medium">{negativeCount}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-700">Bewertungsverteilung</p>
                {ratingDistribution.reverse().map(({ rating, count }) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-xs w-8">{rating}★</span>
                    <div className="flex-1 bg-slate-100 rounded h-4">
                      <div
                        className="bg-yellow-400 h-4 rounded"
                        style={{ width: `${(count / feedback.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <p className="text-xs text-slate-600 mb-2 font-medium">Bewertungsverlauf (letzte 7 Einträge)</p>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="rating" stroke="#10b981" strokeWidth={2} name="Bewertung" />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-slate-700">Neueste Kommentare:</p>
                {feedback.slice(0, 3).map((f, i) => (
                  <div key={i} className="p-2 bg-slate-50 rounded text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, j) => (
                          <Star
                            key={j}
                            className={`w-3 h-3 ${j < f.rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'}`}
                          />
                        ))}
                      </div>
                      <span className="text-slate-500">
                        {new Date(f.created_date).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                    <p className="text-slate-700">{f.comments || 'Kein Kommentar'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}