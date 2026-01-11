import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Mic, Camera, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import SmartActionDialog from './SmartActionDialog';
import MobileActionSheet from './MobileActionSheet';
import VoiceCommandDialog from './VoiceCommandDialog';

const FIRST_LEVEL_ACTIONS = [
  { id: 'voice', icon: Mic, label: 'Sprechen', color: 'from-blue-500 to-blue-600' },
  { id: 'photo', icon: Camera, label: 'Foto', color: 'from-green-500 to-green-600' },
  { id: 'document', icon: FileText, label: 'Beleg', color: 'from-purple-500 to-purple-600' }
];

const SECOND_LEVEL_ACTIONS = {
  document: [
    { id: 'income', label: 'Einnahme', emoji: '💰' },
    { id: 'expense', label: 'Ausgabe', emoji: '💸' },
    { id: 'contract', label: 'Mietvertrag', emoji: '📋' },
    { id: 'protocol', label: 'Übergabeprotokoll', emoji: '📝' },
    { id: 'invoice', label: 'Rechnung', emoji: '🧾' }
  ]
};

export default function SmartActionButton() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFirstLevel, setSelectedFirstLevel] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [showMobileSheet, setShowMobileSheet] = useState(false);

  const handleFirstLevelClick = (action) => {
    if (action.id === 'voice' || action.id === 'photo') {
      setSelectedAction({ type: action.id });
      setIsExpanded(false);
    } else if (action.id === 'document') {
      setSelectedFirstLevel(action.id);
    }
  };

  const handleSecondLevelClick = (action) => {
    setSelectedAction({ type: 'document', subtype: action.id });
    setIsExpanded(false);
    setSelectedFirstLevel(null);
  };

  const handleClose = () => {
    setSelectedAction(null);
    setSelectedFirstLevel(null);
  };

  const secondLevelActions = selectedFirstLevel ? SECOND_LEVEL_ACTIONS[selectedFirstLevel] || [] : [];

  const handleMainButtonClick = () => {
    if (window.innerWidth < 1024) {
      setShowMobileSheet(true);
    } else {
      setIsExpanded(!isExpanded);
      setSelectedFirstLevel(null);
    }
  };

  const handleMobileSelect = (actionId) => {
    if (actionId === 'document') {
      setSelectedFirstLevel('document');
    } else {
      setSelectedAction({ type: actionId });
    }
  };

  return (
    <>
      {/* Main Button */}
      <motion.div
        className="fixed bottom-24 right-6 z-40"
        animate={{ rotate: isExpanded ? 45 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={handleMainButtonClick}
          className={cn(
            "h-16 w-16 rounded-full shadow-2xl",
            "bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600",
            "hover:shadow-blue-500/50 transition-all duration-300",
            "relative overflow-hidden group"
          )}
          size="icon"
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400"
            animate={{ 
              opacity: [0, 0.3, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              ease: "easeInOut"
            }}
          />
          <Plus className="h-8 w-8 text-white relative z-10" strokeWidth={2.5} />
        </Button>
      </motion.div>

      {/* First Level Actions */}
      <AnimatePresence>
        {isExpanded && !selectedFirstLevel && (
          <>
            {FIRST_LEVEL_ACTIONS.map((action, index) => {
              const Icon = action.icon;
              const angle = (index * 70) - 70; // -70, 0, 70 degrees
              const radius = 90;
              const x = radius * Math.cos((angle * Math.PI) / 180);
              const y = radius * Math.sin((angle * Math.PI) / 180);

              return (
                <motion.div
                  key={action.id}
                  className="fixed bottom-24 right-6 z-39"
                  initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    x: x, 
                    y: -y,
                    opacity: 1 
                  }}
                  exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    delay: index * 0.05
                  }}
                >
                  <Button
                    onClick={() => handleFirstLevelClick(action)}
                    className={cn(
                      "h-14 w-14 rounded-full shadow-lg",
                      `bg-gradient-to-br ${action.color}`,
                      "hover:scale-110 transition-transform duration-200",
                      "relative overflow-hidden group"
                    )}
                    size="icon"
                    title={action.label}
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    <Icon className="h-6 w-6 text-white relative z-10" />
                  </Button>
                  <motion.div
                    className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 + 0.2 }}
                  >
                    <span className="text-xs font-medium text-slate-700 bg-white px-2 py-1 rounded-full shadow-sm">
                      {action.label}
                    </span>
                  </motion.div>
                </motion.div>
              );
            })}
          </>
        )}
      </AnimatePresence>

      {/* Second Level Actions */}
      <AnimatePresence>
        {selectedFirstLevel && secondLevelActions.length > 0 && (
          <>
            {secondLevelActions.map((action, index) => {
              const totalActions = secondLevelActions.length;
              const startAngle = -90;
              const endAngle = 90;
              const angleStep = (endAngle - startAngle) / (totalActions - 1);
              const angle = startAngle + (index * angleStep);
              const radius = 140;
              const x = radius * Math.cos((angle * Math.PI) / 180);
              const y = radius * Math.sin((angle * Math.PI) / 180);

              return (
                <motion.div
                  key={action.id}
                  className="fixed bottom-24 right-6 z-39"
                  initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    x: x, 
                    y: -y,
                    opacity: 1 
                  }}
                  exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    delay: index * 0.06
                  }}
                >
                  <Button
                    onClick={() => handleSecondLevelClick(action)}
                    className={cn(
                      "h-16 w-16 rounded-full shadow-xl",
                      "bg-gradient-to-br from-indigo-500 to-purple-600",
                      "hover:scale-110 transition-all duration-200",
                      "border-2 border-white",
                      "relative overflow-hidden group"
                    )}
                    size="icon"
                    title={action.label}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    <span className="text-2xl relative z-10">{action.emoji}</span>
                  </Button>
                  <motion.div
                    className="absolute -bottom-9 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 + 0.3 }}
                  >
                    <span className="text-xs font-semibold text-slate-800 bg-white px-3 py-1.5 rounded-full shadow-md border border-slate-200">
                      {action.label}
                    </span>
                  </motion.div>
                </motion.div>
              );
            })}
          </>
        )}
      </AnimatePresence>

      {/* Mobile Action Sheet */}
      <AnimatePresence>
        {showMobileSheet && (
          <MobileActionSheet
            onSelect={handleMobileSelect}
            onClose={() => setShowMobileSheet(false)}
          />
        )}
      </AnimatePresence>

      {/* Dialog */}
      <SmartActionDialog 
        isOpen={!!selectedAction && selectedAction?.type !== 'voice'} 
        onClose={handleClose}
        actionType={selectedAction?.type}
        actionSubtype={selectedAction?.subtype}
      />

      <VoiceCommandDialog
        isOpen={selectedAction?.type === 'voice'}
        onClose={handleClose}
      />
    </>
  );
}