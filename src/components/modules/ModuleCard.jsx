import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Package } from 'lucide-react';

export default function ModuleCard({ module, isBooked, onBook, disabled }) {
  return (
    <Card className={isBooked ? "border-emerald-200 bg-emerald-50/30" : ""}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <h3 className="font-semibold">{module.module_name}</h3>
              <p className="text-sm text-slate-600 mt-1">{module.description}</p>
            </div>
          </div>
          {isBooked && (
            <Badge className="bg-emerald-600">Aktiv</Badge>
          )}
        </div>
        
        <div className="space-y-3">
          <div className="text-2xl font-bold text-emerald-600">
            {module.price_monthly}€
            <span className="text-sm font-normal text-slate-600">/Monat</span>
          </div>
          
          {module.features && module.features.length > 0 && (
            <div className="space-y-2">
              {module.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          )}
          
          <Button 
            className="w-full" 
            disabled={isBooked || disabled}
            onClick={() => onBook(module.module_code)}
          >
            {isBooked ? "Bereits gebucht" : "Modul buchen"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}