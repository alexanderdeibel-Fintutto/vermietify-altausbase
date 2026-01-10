import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Download, FileSpreadsheet, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function FinancialExport() {
  const [exportType, setExportType] = useState('payments');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [exporting, setExporting] = useState(false);

  const { data: payments = [] } = useQuery({
    queryKey: ['payments-export'],
    queryFn: () => base44.entities.Payment.list()
  });

  const { data: financialItems = [] } = useQuery({
    queryKey: ['financial-items-export'],
    queryFn: () => base44.entities.FinancialItem.list()
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts-export'],
    queryFn: () => base44.entities.LeaseContract.list()
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants-export'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const convertToCSV = (data, headers) => {
    const csvRows = [];
    csvRows.push(headers.join(';'));
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        return `"${value}"`;
      });
      csvRows.push(values.join(';'));
    });
    
    return csvRows.join('\n');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    setExporting(true);
    
    try {
      let csvData, filename;

      if (exportType === 'payments') {
        const filteredPayments = payments.filter(p => {
          const paymentYear = new Date(p.payment_date).getFullYear().toString();
          return paymentYear === year;
        });

        const exportData = filteredPayments.map(payment => {
          const contract = contracts.find(c => c.id === payment.contract_id);
          const tenant = contract ? tenants.find(t => t.id === contract.tenant_id) : null;
          
          return {
            'Datum': new Date(payment.payment_date).toLocaleDateString('de-DE'),
            'Mieter': tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt',
            'Betrag': payment.amount || 0,
            'Status': payment.status === 'paid' ? 'Bezahlt' : payment.status === 'pending' ? 'Ausstehend' : 'Überfällig',
            'Zahlungsart': payment.payment_method || '',
            'Beschreibung': payment.description || '',
            'Erstellt am': new Date(payment.created_date).toLocaleDateString('de-DE')
          };
        });

        csvData = convertToCSV(exportData, Object.keys(exportData[0] || {}));
        filename = `Zahlungen_${year}.csv`;
      } 
      else if (exportType === 'income') {
        const activeContracts = contracts.filter(c => c.status === 'active');
        
        const exportData = activeContracts.map(contract => {
          const tenant = tenants.find(t => t.id === contract.tenant_id);
          
          return {
            'Mieter': tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unbekannt',
            'Kaltmiete': contract.base_rent || 0,
            'Nebenkosten': contract.utilities || 0,
            'Heizkosten': contract.heating || 0,
            'Warmmiete': contract.total_rent || 0,
            'Mietbeginn': new Date(contract.start_date).toLocaleDateString('de-DE'),
            'Status': 'Aktiv'
          };
        });

        csvData = convertToCSV(exportData, Object.keys(exportData[0] || {}));
        filename = `Mieteinnahmen_${year}.csv`;
      }
      else if (exportType === 'expenses') {
        const expenses = financialItems.filter(item => {
          return item.type === 'expense' && 
                 new Date(item.date).getFullYear().toString() === year;
        });

        const exportData = expenses.map(expense => ({
          'Datum': new Date(expense.date).toLocaleDateString('de-DE'),
          'Kategorie': expense.category || 'Sonstiges',
          'Beschreibung': expense.description || '',
          'Betrag': expense.amount || 0,
          'MwSt': expense.vat_amount || 0,
          'Gebäude': expense.building_id || '',
          'Erstellt am': new Date(expense.created_date).toLocaleDateString('de-DE')
        }));

        csvData = convertToCSV(exportData, Object.keys(exportData[0] || {}));
        filename = `Ausgaben_${year}.csv`;
      }
      else if (exportType === 'summary') {
        const monthlyData = [];
        
        for (let month = 0; month < 12; month++) {
          const monthPayments = payments.filter(p => {
            const pDate = new Date(p.payment_date);
            return pDate.getFullYear().toString() === year && 
                   pDate.getMonth() === month && 
                   p.status === 'paid';
          });

          const monthExpenses = financialItems.filter(item => {
            const iDate = new Date(item.date);
            return item.type === 'expense' &&
                   iDate.getFullYear().toString() === year && 
                   iDate.getMonth() === month;
          });

          const income = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
          const expenses = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

          monthlyData.push({
            'Monat': new Date(parseInt(year), month, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
            'Einnahmen': income,
            'Ausgaben': expenses,
            'Gewinn': income - expenses
          });
        }

        csvData = convertToCSV(monthlyData, ['Monat', 'Einnahmen', 'Ausgaben', 'Gewinn']);
        filename = `Finanzzusammenfassung_${year}.csv`;
      }

      downloadCSV(csvData, filename);
      toast.success('CSV-Datei erfolgreich exportiert');
    } catch (error) {
      toast.error('Fehler beim Export: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            CSV-Export für Buchhaltung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Export-Typ</Label>
              <Select value={exportType} onValueChange={setExportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payments">Zahlungsübersicht</SelectItem>
                  <SelectItem value="income">Mieteinnahmen</SelectItem>
                  <SelectItem value="expenses">Ausgaben</SelectItem>
                  <SelectItem value="summary">Finanzzusammenfassung</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Jahr</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Export-Details:</h4>
            {exportType === 'payments' && (
              <p className="text-sm text-slate-600">
                Enthält: Zahlungsdatum, Mieter, Betrag, Status, Zahlungsart und Beschreibung
              </p>
            )}
            {exportType === 'income' && (
              <p className="text-sm text-slate-600">
                Enthält: Mieter, Kalt-/Warmmiete, Nebenkosten, Mietbeginn und Status
              </p>
            )}
            {exportType === 'expenses' && (
              <p className="text-sm text-slate-600">
                Enthält: Datum, Kategorie, Beschreibung, Betrag, MwSt und Gebäudezuordnung
              </p>
            )}
            {exportType === 'summary' && (
              <p className="text-sm text-slate-600">
                Enthält: Monatliche Übersicht mit Einnahmen, Ausgaben und Gewinn
              </p>
            )}
          </div>

          <Button 
            onClick={handleExport} 
            disabled={exporting}
            className="w-full"
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            {exporting ? 'Exportiere...' : 'CSV exportieren'}
          </Button>
        </CardContent>
      </Card>

      {/* Export Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hinweise zum CSV-Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
            <p className="text-sm text-slate-600">
              Die CSV-Dateien sind kompatibel mit gängiger Buchhaltungssoftware (DATEV, Lexoffice, etc.)
            </p>
          </div>
          <div className="flex items-start gap-2">
            <FileSpreadsheet className="w-4 h-4 text-slate-400 mt-0.5" />
            <p className="text-sm text-slate-600">
              Das Trennzeichen ist Semikolon (;) für beste Kompatibilität mit Excel
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Download className="w-4 h-4 text-slate-400 mt-0.5" />
            <p className="text-sm text-slate-600">
              Die Dateien werden mit UTF-8 BOM kodiert für korrekte Umlaute
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}