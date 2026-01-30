import React from 'react';
import CommandPalette from './CommandPalette';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import QuickActionsFAB from './QuickActionsFAB';

export default function NavigationEnhanced() {
  return (
    <>
      <CommandPalette />
      <KeyboardShortcutsModal />
      <QuickActionsFAB />
    </>
  );
}