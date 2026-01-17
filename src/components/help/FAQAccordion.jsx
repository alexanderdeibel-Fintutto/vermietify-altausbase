import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function FAQAccordion({ faqs = [] }) {
  return (
    <Accordion type="single" collapsible className="space-y-2">
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`faq-${index}`} className="vf-card">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <span className="font-semibold text-left">{faq.question}</span>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <p className="text-[var(--theme-text-secondary)] leading-relaxed">
              {faq.answer}
            </p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}