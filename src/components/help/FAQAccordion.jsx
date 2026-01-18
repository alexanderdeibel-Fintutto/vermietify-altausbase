import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FAQAccordion({ faqs }) {
  const defaultFaqs = [
    {
      question: 'Wie erstelle ich ein neues Objekt?',
      answer: 'Navigieren Sie zu Objekte und klicken Sie auf "Neues Objekt". Füllen Sie alle erforderlichen Felder aus.'
    },
    {
      question: 'Wie funktioniert die Betriebskostenabrechnung?',
      answer: 'Gehen Sie zu Betriebskosten und starten Sie den Assistenten für eine Schritt-für-Schritt Anleitung.'
    },
    {
      question: 'Kann ich mehrere Mieter verwalten?',
      answer: 'Ja, Sie können beliebig viele Mieter anlegen und verwalten. Die Anzahl hängt von Ihrem Tarif ab.'
    }
  ];

  const displayFaqs = faqs || defaultFaqs;

  return (
    <Accordion type="single" collapsible className="w-full">
      {displayFaqs.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger className="text-left font-medium">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-[var(--theme-text-secondary)]">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}