import React, { useState } from 'react';
import { usePackageAccess } from '@/components/hooks/usePackageAccess';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from 'lucide-react';

export default function LimitGuard({ 
  limitType, // 'buildings' | 'units'
  currentCount,
  onLimitReached,
  children 
}) {
  const { packageConfig, canCreateBuilding, canCreateUnit } = usePackageAccess();
  const [showDialog, setShowDialog] = useState(false);

  const checkLimit = async () => {
    let canCreate = false;
    
    if (limitType === 'buildings') {
      canCreate = await canCreateBuilding(currentCount);
    } else if (limitType === 'units') {
      canCreate = await canCreateUnit(currentCount);
    }

    if (!canCreate) {
      setShowDialog(true);
      if (onLimitReached) onLimitReached();
      return false;
    }

    return true;
  };

  const limit = limitType === 'buildings' 
    ? packageConfig?.max_buildings 
    : packageConfig?.max_units;

  return (
    <>
      {React.cloneElement(children, {
        onClick: async (e) => {
          const canProceed = await checkLimit();
          if (canProceed && children.props.onClick) {
            children.props.onClick(e);
          }
        }
      })}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Limit erreicht
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Sie haben das Maximum von <strong>{limit} {limitType === 'buildings' ? 'Gebäuden' : 'Einheiten'}</strong> für Ihr Paket <strong>{packageConfig?.package_type}</strong> erreicht.
            </p>

            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <p className="text-xs text-orange-800">
                💡 <strong>Tipp:</strong> Upgraden Sie auf ein höheres Paket für mehr Objekte und Einheiten.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                Schließen
              </Button>
              <Button className="flex-1 bg-orange-600 hover:bg-orange-700">
                Paket upgraden
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}