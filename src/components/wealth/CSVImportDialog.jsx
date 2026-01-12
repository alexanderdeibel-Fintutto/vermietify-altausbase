import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Upload, FileText } from 'lucide-react';

export default function CSVImportDialog({ open, onOpenChange, portfolioId, onComplete }) {
  const [file, setFile] = useState(null);
  const [brokerFormat, setBrokerFormat] = useState('generic');
  const [accountId, setAccountId] = useState('');
  const [importing, setImporting] = useState(false);
  const [accounts, setAccounts] = useState([]);

  React.useEffect(() => {
    if (portfolioId) {
      base44.entities.PortfolioAccount.filter({ portfolio_id: portfolioId })
        .then(setAccounts);
    }
  }, [portfolioId]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      toast.error('Bitte CSV-Datei auswählen');
    }
  };

  const handleImport = async () => {
    if (!file || !accountId) {
      toast.error('Datei und Konto erforderlich');
      return;
    }

    setImporting(true);
    try {
      // Upload CSV
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Import starten
      const result = await base44.functions.invoke('importTransactionsFromCSV', {
        fileUrl: file_url,
        portfolioAccountId: accountId,
        brokerFormat
      });

      toast.success(result.data.message);
      onComplete?.();
      onOpenChange(false);
    } catch (error) {
      toast.error('Import fehlgeschlagen: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>CSV-Import</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Broker-Format
            </label>
            <select
              value={brokerFormat}
              onChange={(e) => setBrokerFormat(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="generic">Generisch (CSV)</option>
              <option value="trade_republic">Trade Republic</option>
              <option value="scalable">Scalable Capital</option>
              <option value="ing">ING DiBa</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Zielkonto
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">Bitte wählen...</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              CSV-Datei
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-600">
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">{file.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">
                      CSV-Datei auswählen
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || !accountId || importing}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {importing ? 'Importiere...' : 'Importieren'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}