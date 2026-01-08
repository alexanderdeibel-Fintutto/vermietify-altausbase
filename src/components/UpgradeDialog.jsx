import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Zap } from 'lucide-react';

export default function UpgradeDialog({ 
  open, 
  onOpenChange, 
  moduleName, 
  currentPackage,
  upgradeSuggestions = []
}) {
  const handleUpgrade = () => {
    // TODO: Integration mit Payment-Provider
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            Feature nicht verfügbar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            <strong>{moduleName}</strong> ist in Ihrem aktuellen Paket <strong>{currentPackage}</strong> nicht enthalten.
          </p>

          {upgradeSuggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Upgrade-Optionen:</p>
              {upgradeSuggestions.map((option, idx) => (
                <Card key={idx} className="p-3 border-blue-200 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{option.package_name}</p>
                      <p className="text-xs text-slate-600">{option.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">€{option.price}/M</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-800">
              💡 <strong>Tipp:</strong> Sie können auch einzelne Module als Add-on buchen (+10-20€/Monat)
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Später
            </Button>
            <Button onClick={handleUpgrade} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Zap className="w-4 h-4 mr-2" />
              Jetzt upgraden
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}