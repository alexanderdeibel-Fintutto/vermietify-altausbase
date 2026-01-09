import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Sparkles, Lock } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export function FeatureTooltip({ 
  children, 
  feature, 
  isUnlocked = true, 
  unlockRequirement = null,
  isNew = false 
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative inline-flex">
            {children}
            {isNew && (
              <Badge className="absolute -top-1 -right-1 h-4 px-1 text-xs bg-orange-600">
                NEU
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold flex items-center gap-2">
              {isUnlocked ? (
                <Sparkles className="w-4 h-4 text-orange-500" />
              ) : (
                <Lock className="w-4 h-4 text-slate-400" />
              )}
              {feature.label}
            </p>
            <p className="text-xs text-slate-600">{feature.description}</p>
            {!isUnlocked && unlockRequirement && (
              <div className="pt-2 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  🔓 Freischaltung: {unlockRequirement}
                </p>
              </div>
            )}
            {isNew && (
              <div className="pt-2 border-t border-slate-200">
                <p className="text-xs text-orange-600 font-medium">
                  ✨ Kürzlich freigeschaltet!
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}