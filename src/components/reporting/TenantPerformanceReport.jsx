import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2, User, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantPerformanceReport() {
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => {
    const loadTenants = async () => {
      const data = await base44.entities.Tenant.list();
      setTenants(data);
    };
    loadTenants();
  }, []);

  const handleGenerate = async () => {
    if (!selectedTenant) {
      toast.error('Bitte Mieter auswählen');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateTenantPerformanceReport', {
        tenantId: selectedTenant
      });

      setReport(response.data.report);
      toast.success('Bericht erstellt');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'EXCELLENT') return 'bg-green-100 text-green-900';
    if (status === 'GOOD') return 'bg-blue-100 text-blue-900';
    if (status === 'FAIR') return 'bg-yellow-100 text-yellow-900';
    return 'bg-red-100 text-red-900';
  };

  return (
    <div className="space-y-4">
      {!report ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Mieter-Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Mieter auswählen</label>
              <select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="w-full mt-2 border rounded-lg px-4 py-2 text-sm"
              >
                <option value="">-- Wählen --</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.first_name} {t.last_name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generiere...
                </>
              ) : (
                'Bericht generieren'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Tenant Info */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold text-slate-900">{report.tenant_info.name}</h3>
              <p className="text-sm text-slate-600 mt-1">
                {report.tenant_info.lease_count} Vertrag{report.tenant_info.lease_count !== 1 ? 'e' : ''}
              </p>
            </CardContent>
          </Card>

          {/* Payment Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Zahlungsverhalten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-600">Zahlungsquote</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {report.payment_performance.payment_rate}%
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-600">Pünktlichkeit</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {(report.payment_performance.on_time_percentage || 0).toFixed(0)}%
                  </p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-lg text-center font-medium ${getStatusColor(report.payment_performance.status)}`}>
                Status: {report.payment_performance.status}
              </div>
            </CardContent>
          </Card>

          {/* Rating */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="w-5 h-5 text-yellow-500" />
                Bewertung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(report.rating).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700 capitalize">{key.replace(/_/g, ' ')}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i <= value ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Insights */}
          {report.insights?.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Erkenntnisse</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.insights.map((insight, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-blue-900">
                      <span>•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Button onClick={() => setReport(null)} variant="outline" className="w-full">
            Neuer Bericht
          </Button>
        </div>
      )}
    </div>
  );
}