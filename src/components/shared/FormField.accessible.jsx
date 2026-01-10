import React from 'react';

/**
 * Accessible form field with proper labels and error handling
 */
export const AccessibleFormField = React.forwardRef((
  {
    label,
    id,
    error,
    required,
    helperText,
    children,
    className = '',
  },
  ref
) => {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <div ref={ref}>
        {React.cloneElement(children, {
          id,
          'aria-invalid': !!error,
          'aria-describedby': [errorId, helperId].filter(Boolean).join(' ') || undefined,
        })}
      </div>
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="text-xs text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
});

AccessibleFormField.displayName = 'AccessibleFormField';