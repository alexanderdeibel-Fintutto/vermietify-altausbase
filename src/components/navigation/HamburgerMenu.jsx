import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";
import CollapsibleSidebar from './CollapsibleSidebar';

export default function HamburgerMenu({ currentSection, visibleFeatures = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </Button>
      <CollapsibleSidebar
        section={currentSection}
        visibleFeatures={visibleFeatures}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}