import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Euro, TrendingDown } from 'lucide-react';

export default function AfaScheduleViewer({ assetId }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState(null);

  useEffect(() => {
    loadSchedule();
  }, [assetId]);

  const loadSchedule = async () => {
    try {
      const assetData = await base44.entities.AfaAsset.get(assetId);
      setAsset(assetData);

      const entries = await base44.entities.AfaYearlyEntry.filter({
        afa_asset_id: assetId
      });
      setSchedule(entries.sort((a, b) => a.year - b.year));
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Lädt...</div>;
  if (!schedule.length) return <div>Keine Abschreibungspläne vorhanden</div>;

  return (
    <div className="space-y-4">
      {/* Zusammenfassung */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">Abschreibungsbasis</div>
            <div className="text-2xl font-bold">
              {((asset?.acquisition_cost || 0) - (asset?.land_value || 0)).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">Jährliche AfA</div>
            <div className="text-2xl font-bold">{schedule[0]?.afa_amount?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">Restwert (aktuell)</div>
            <div className="text-2xl font-bold">{schedule[schedule.length - 1]?.remaining_value?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Abschreibungsverlauf
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={schedule}>
              <CartesianGrid />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(v) => v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} />
              <Legend />
              <Line type="monotone" dataKey="remaining_value" stroke="#ef4444" name="Restwert" />
              <Line type="monotone" dataKey="cumulative_afa" stroke="#10b981" name="Kumulierte AfA" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabelle */}
      <Card>
        <CardHeader>
          <CardTitle>Abschreibungsplan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Jahr</th>
                  <th className="text-right py-2">AfA-Betrag</th>
                  <th className="text-right py-2">Kumuliert</th>
                  <th className="text-right py-2">Restwert</th>
                  <th className="text-center py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((entry) => (
                  <tr key={entry.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{entry.year}{entry.is_partial_year ? ` (${entry.partial_months} Mo.)` : ''}</td>
                    <td className="text-right py-2">{entry.afa_amount?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                    <td className="text-right py-2">{entry.cumulative_afa?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                    <td className="text-right py-2">{entry.remaining_value?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                    <td className="text-center py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        entry.status === 'BOOKED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {entry.status === 'BOOKED' ? 'Gebucht' : 'Geplant'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}