import React, { useEffect, useState } from 'react';

export default function SmartFormDefaults({ 
  formData = {},
  onDefaultsApplied,
  getDefaults
}) {
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const applyDefaults = async () => {
      if (!applied) {
        const defaults = await getDefaults?.();
        if (defaults) {
          onDefaultsApplied?.({ ...formData, ...defaults });
          setApplied(true);
        }
      }
    };

    applyDefaults();
  }, [applied, formData, getDefaults, onDefaultsApplied]);

  return null;
}