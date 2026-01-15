import React, { useState, Suspense } from 'react';
import AIChatButton from './AIChatButton';

const AIChatPanel = React.lazy(() => import('./AIChatPanel'));

const AIChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);

    // TODO: Get currentPage and contextData from a new PageContextProvider
    const currentPage = window.location.pathname;
    const contextData = {}; // Placeholder

    const handleToggleChat = () => {
        setIsOpen(prev => !prev);
    };
    
    return (
        <>
            <AIChatButton onToggleChat={handleToggleChat} />
            <Suspense fallback={null}>
              {isOpen && <AIChatPanel 
                  isOpen={isOpen} 
                  onClose={() => setIsOpen(false)} 
                  currentPage={currentPage}
                  contextData={contextData}
              />}
            </Suspense>
        </>
    );
};

export default AIChatWidget;