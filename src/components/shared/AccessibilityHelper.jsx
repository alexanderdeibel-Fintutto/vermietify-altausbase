/**
 * Accessibility helpers for improved usability
 */

export const a11y = {
  // Generate unique IDs for form fields
  generateId: (prefix = 'field') => `${prefix}-${Math.random().toString(36).substr(2, 9)}`,

  // Announce messages to screen readers
  announceToScreenReader: (message) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  },

  // Create accessible label
  createLabel: (text, htmlFor) => ({
    htmlFor,
    children: text,
  }),

  // Create accessible button attributes
  createButtonAttrs: (onClick, label) => ({
    onClick,
    'aria-label': label,
  }),

  // Get ARIA attributes for loading state
  getLoadingAttrs: (isLoading) => ({
    'aria-busy': isLoading,
    disabled: isLoading,
  }),

  // Get ARIA attributes for error state
  getErrorAttrs: (error, fieldId) => ({
    'aria-invalid': !!error,
    'aria-describedby': error ? `${fieldId}-error` : undefined,
  }),
};