import React from 'react';
import { VfSelect } from './VfSelect';

export default function SearchableSelect({ options, value, onChange, label, placeholder }) {
  return (
    <VfSelect
      label={label}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      searchable
    />
  );
}