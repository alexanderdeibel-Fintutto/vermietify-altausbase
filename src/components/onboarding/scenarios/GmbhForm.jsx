import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

export default function GmbhForm({ onSubmit, isLoading }) {
  const [entities, setEntities] = useState([
    { name: '', country: 'DE', ownership_percentage: '', active: true }
  ]);

  const addEntity = () => {
    setEntities([...entities, { name: '', country: 'DE', ownership_percentage: '', active: true }]);
  };

  const removeEntity = (idx) => {
    setEntities(entities.filter((_, i) => i !== idx));
  };

  const updateEntity = (idx, field, value) => {
    const updated = [...entities];
    updated[idx][field] = value;
    setEntities(updated);
  };

  const handleSubmit = () => {
    const valid = entities.filter(e => e.name && e.ownership_percentage);
    if (valid.length > 0) {
      onSubmit({ business_entities: valid });
    }
  };

  return (
    <div className="space-y-4">
      {entities.map((entity, idx) => (
        <div key={idx} className="grid grid-cols-4 gap-2 p-3 bg-slate-50 rounded-lg">
          <Input
            placeholder="Firmenname"
            value={entity.name}
            onChange={(e) => updateEntity(idx, 'name', e.target.value)}
            className="text-xs col-span-2"
          />
          <select
            value={entity.country}
            onChange={(e) => updateEntity(idx, 'country', e.target.value)}
            className="text-xs px-2 rounded border border-slate-200"
          >
            <option>DE</option>
            <option>CH</option>
            <option>AT</option>
          </select>
          <div className="flex gap-1 items-center">
            <Input
              placeholder="%"
              type="number"
              value={entity.ownership_percentage}
              onChange={(e) => updateEntity(idx, 'ownership_percentage', e.target.value)}
              className="text-xs"
            />
            {entities.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeEntity(idx)}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={addEntity}
        className="w-full text-xs"
      >
        <Plus className="w-3 h-3 mr-1" />
        Weitere Entity
      </Button>

      <Button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Speichern...' : 'Fortfahren'}
      </Button>
    </div>
  );
}