import React from 'react';
import { motion } from 'framer-motion';
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bot, User } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ChatMessage({ message, onSuggestionClick }) {
  const isUser = message.sender === 'user';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0"
        >
          <Bot className="w-4 h-4 text-white" />
        </motion.div>
      )}
      
      <div className={cn("flex flex-col gap-2 max-w-2xl", isUser && "items-end")}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.2 }}
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser 
              ? "bg-slate-800 text-white rounded-tr-sm shadow-md" 
              : "bg-white border border-slate-200 rounded-tl-sm shadow-sm"
          )}
        >
          <p className="text-sm whitespace-pre-line leading-relaxed">{message.message}</p>
        </motion.div>

        {message.suggestions && message.suggestions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2"
          >
            {message.suggestions.map((suggestion, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + (idx * 0.1) }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSuggestionClick(suggestion)}
                  className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:scale-105 transition-transform"
                >
                  {suggestion.label}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}

        <span className="text-xs text-slate-400">
          {new Date(message.timestamp).toLocaleTimeString('de-DE', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>

      {isUser && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0"
        >
          <User className="w-4 h-4 text-white" />
        </motion.div>
      )}
    </motion.div>
  );
}