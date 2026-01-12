import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import PriceAlertDialog from './PriceAlertDialog';

export default function PortfolioAlertsWidget({ portfolioId }) {
  const [showAlertForm, setShowAlertForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ['portfolio-alerts', portfolioId],
    queryFn: () => base44.entities.PortfolioAlert.filter({ portfolio_id: portfolioId })
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list()
  });

  const createAlertMutation = useMutation({
    mutationFn: (data) => base44.entities.PortfolioAlert.create({ ...data, portfolio_id: portfolioId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-alerts'] });
      setShowAlertForm(false);
      toast.success('Alarm erstellt');
    }
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id) => base44.entities.PortfolioAlert.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-alerts'] });
      toast.success('Alarm gelöscht');
    }
  });

  const getAssetName = (assetId) => {
    const asset = assets.find(a => a.id === assetId);
    return asset ? asset.symbol : 'N/A';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600" />
              Kurs-Alarme
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAlertForm(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Alarm
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-sm text-slate-500">Keine Alarme definiert</p>
          ) : (
            <div className="space-y-2">
              {alerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <div>
                    <div className="font-medium text-sm text-slate-900">
                      {getAssetName(alert.asset_id)}
                    </div>
                    <div className="text-xs text-slate-600">
                      {alert.alert_type === 'price_above' ? 'Über' : 'Unter'} {alert.threshold_value} EUR
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteAlertMutation.mutate(alert.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PriceAlertDialog
        open={showAlertForm}
        onOpenChange={setShowAlertForm}
        assets={assets}
        onSave={(data) => createAlertMutation.mutate(data)}
      />
    </>
  );
}