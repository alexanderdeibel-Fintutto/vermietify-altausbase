import React from 'react';
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bot, User } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ChatMessage({ message, onSuggestionClick }) {
  const isUser = message.sender === 'user';

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className={cn("flex flex-col gap-2 max-w-2xl", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser 
              ? "bg-slate-800 text-white rounded-tr-sm" 
              : "bg-white border border-slate-200 rounded-tl-sm shadow-sm"
          )}
        >
          <p className="text-sm whitespace-pre-line leading-relaxed">{message.message}</p>
        </div>

        {message.suggestions && message.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.suggestions.map((suggestion, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => onSuggestionClick(suggestion)}
                className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
              >
                {suggestion.label}
              </Button>
            ))}
          </div>
        )}

        <span className="text-xs text-slate-400">
          {new Date(message.timestamp).toLocaleTimeString('de-DE', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}