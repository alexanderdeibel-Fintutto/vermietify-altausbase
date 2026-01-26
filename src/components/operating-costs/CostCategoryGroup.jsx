import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CostTypeSelector from './CostTypeSelector';

export default function CostCategoryGroup({ 
  category, 
  costTypes, 
  selectedCosts,
  onToggleCost,
  onDistributionChange 
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const selectedInCategory = costTypes.filter(ct => selectedCosts[ct.id]).length;

  return (
    <div className="space-y-2">
      <div 
        className="flex items-center justify-between p-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-150"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="font-semibold text-gray-700 text-sm uppercase">
          {category}
          {selectedInCategory > 0 && (
            <span className="ml-2 text-xs bg-blue-900 text-white px-2 py-1 rounded-full">
              {selectedInCategory}
            </span>
          )}
        </h3>
        <Button variant="ghost" size="sm">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-2 ml-2">
          {costTypes.map(costType => (
            <CostTypeSelector
              key={costType.id}
              costType={costType}
              isSelected={!!selectedCosts[costType.id]}
              distributionKey={selectedCosts[costType.id]?.distributionKey}
              totalAmount={selectedCosts[costType.id]?.total}
              onToggle={() => onToggleCost(costType)}
              onDistributionChange={(key) => onDistributionChange(costType.id, key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}