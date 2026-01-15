import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PropertyAnalyticsReportBuilder from '@/components/reporting/PropertyAnalyticsReportBuilder';
import PropertyComparisonTool from '@/components/reporting/PropertyComparisonTool';
import FinancialReportBuilder from '@/components/reporting/FinancialReportBuilder';
import MaintenanceReportBuilder from '@/components/reporting/MaintenanceReportBuilder';
import { BarChart3, GitCompare, DollarSign, Wrench, FileText } from 'lucide-react';

export default function AdvancedReportingDashboard() {
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [activeReport, setActiveReport] = useState('overview');
  const [buildings, setBuildings] = useState([]);
  const [loadedBuildings, setLoadedBuildings] = useState(false);

  React.useEffect(() => {
    const loadBuildings = async () => {
      const { base44 } = await import('@/api/base44Client');
      const data = await base44.entities.Building.list();
      setBuildings(data);
      setLoadedBuildings(true);
    };
    loadBuildings();
  }, []);

  const reportTypes = [
    {
      id: 'property-analytics',
      icon: BarChart3,
      label: 'Immobilien-Analyse',
      color: 'blue'
    },
    {
      id: 'comparison',
      icon: GitCompare,
      label: 'Gebäudevergleich',
      color: 'purple'
    },
    {
      id: 'financial',
      icon: DollarSign,
      label: 'Finanzbericht',
      color: 'green'
    },
    {
      id: 'maintenance',
      icon: Wrench,
      label: 'Wartungsbericht',
      color: 'orange'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <FileText className="w-10 h-10 text-blue-600" />
            Erweiterte Berichterstattung
          </h1>
          <p className="text-slate-600">Umfassende Analysen und Vergleiche für Ihre Immobilien</p>
        </div>

        {/* Building Selector */}
        {loadedBuildings && (
          <Card className="mb-8 bg-white shadow-lg">
            <CardContent className="pt-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">Gebäude auswählen</label>
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-base"
              >
                <option value="">-- Wählen Sie ein Gebäude --</option>
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </CardContent>
          </Card>
        )}

        {/* Report Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {reportTypes.map(report => {
            const Icon = report.icon;
            const colorClasses = {
              blue: 'bg-blue-50 border-blue-200 hover:border-blue-400 text-blue-700',
              purple: 'bg-purple-50 border-purple-200 hover:border-purple-400 text-purple-700',
              green: 'bg-green-50 border-green-200 hover:border-green-400 text-green-700',
              orange: 'bg-orange-50 border-orange-200 hover:border-orange-400 text-orange-700'
            };

            return (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`p-4 border-2 rounded-lg transition-all ${colorClasses[report.color]} ${
                  activeReport === report.id ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                }`}
              >
                <Icon className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium">{report.label}</p>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <Card className="bg-white shadow-lg">
          <CardContent className="pt-6">
            {activeReport === 'property-analytics' && selectedBuilding && (
              <PropertyAnalyticsReportBuilder buildingId={selectedBuilding} />
            )}
            {activeReport === 'comparison' && (
              <PropertyComparisonTool />
            )}
            {activeReport === 'financial' && selectedBuilding && (
              <FinancialReportBuilder buildingId={selectedBuilding} />
            )}
            {activeReport === 'maintenance' && selectedBuilding && (
              <MaintenanceReportBuilder buildingId={selectedBuilding} />
            )}

            {!selectedBuilding && (activeReport === 'property-analytics' || activeReport === 'financial' || activeReport === 'maintenance') && (
              <div className="text-center py-12">
                <p className="text-slate-600">Bitte wählen Sie oben ein Gebäude aus</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}