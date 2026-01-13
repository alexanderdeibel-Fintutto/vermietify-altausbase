import React, { useEffect, useState } from 'react';
import { Database, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DataCacheManager() {
  const [cacheSize, setCacheSize] = useState('0 MB');
  const [cacheEntries, setCacheEntries] = useState(0);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const calculateCacheSize = () => {
      let total = 0;
      let count = 0;

      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
          count++;
        }
      }

      const sizeInMB = (total / 1024 / 1024).toFixed(2);
      setCacheSize(`${sizeInMB} MB`);
      setCacheEntries(count);
    };

    calculateCacheSize();
  }, []);

  const handleClear = async () => {
    setClearing(true);
    try {
      localStorage.clear();
      setCacheSize('0 MB');
      setCacheEntries(0);
    } finally {
      setClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Cache-Verwaltung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-600 mb-1">Größe</p>
            <p className="text-2xl font-bold text-slate-900">{cacheSize}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-1">Einträge</p>
            <p className="text-2xl font-bold text-slate-900">{cacheEntries}</p>
          </div>
        </div>

        <Button
          onClick={handleClear}
          disabled={clearing || cacheEntries === 0}
          variant="outline"
          className="w-full gap-2 text-red-600 hover:text-red-700"
        >
          {clearing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Wird geleert...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Cache leeren
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}