import React from 'react';
import { VfInput } from './VfInput';
import { VfSelect } from './VfSelect';
import { VfTextarea } from './VfTextarea';
import { VfCheckbox } from './VfCheckbox';
import { VfRadio } from './VfRadio';
import { VfSwitch } from './VfSwitch';
import { VfDatePicker } from './VfDatePicker';

export function VfFormField({ type = 'text', ...props }) {
  switch (type) {
    case 'text':
    case 'email':
    case 'number':
    case 'password':
      return <VfInput type={type} {...props} />;
    
    case 'textarea':
      return <VfTextarea {...props} />;
    
    case 'select':
      return <VfSelect {...props} />;
    
    case 'checkbox':
      return <VfCheckbox {...props} />;
    
    case 'radio':
      return <VfRadio {...props} />;
    
    case 'switch':
      return <VfSwitch {...props} />;
    
    case 'date':
      return <VfDatePicker {...props} />;
    
    default:
      return <VfInput {...props} />;
  }
}