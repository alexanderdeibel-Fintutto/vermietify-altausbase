import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function ConfettiCelebration({ trigger = false, config = {} }) {
  useEffect(() => {
    if (trigger) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        ...config
      });
    }
  }, [trigger, config]);

  return null;
}

export function useCelebration() {
  const celebrate = (config = {}) => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      ...config
    });
  };

  return { celebrate };
}