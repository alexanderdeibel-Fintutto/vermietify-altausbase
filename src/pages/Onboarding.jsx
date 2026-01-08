import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ChatMessage from '@/components/onboarding/ChatMessage';
import SimpleObjectForm from '@/components/onboarding/SimpleObjectForm';
import QuickTenantSetup from '@/components/onboarding/QuickTenantSetup';
import TaxCategoryQuickSetup from '@/components/onboarding/TaxCategoryQuickSetup';
import CompletionScreen from '@/components/onboarding/CompletionScreen';

export default function Onboarding() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentComponent, setCurrentComponent] = useState(null);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: packageInfo, isLoading: loadingPackage } = useQuery({
    queryKey: ['user-package'],
    queryFn: async () => {
      const response = await base44.functions.invoke('detectUserPackage', {});
      return response.data;
    },
    enabled: !!user
  });

  const { data: progress } = useQuery({
    queryKey: ['onboarding-progress', user?.id],
    queryFn: async () => {
      const results = await base44.entities.OnboardingProgress.filter({ user_id: user.id });
      return results[0];
    },
    enabled: !!user
  });

  const saveProgressMutation = useMutation({
    mutationFn: (data) => {
      if (progress?.id) {
        return base44.entities.OnboardingProgress.update(progress.id, data);
      }
      return base44.entities.OnboardingProgress.create({ ...data, user_id: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
    }
  });

  // Initial welcome message
  useEffect(() => {
    if (packageInfo && messages.length === 0) {
      const welcomeMessage = {
        sender: 'assistant',
        message: `Hallo! 👋 Willkommen bei Easy${packageInfo.package_display_name}!

Ich bin EasyStart, Ihr persönlicher Setup-Assistent und helfe Ihnen dabei, alles für den perfekten Start einzurichten.

Was beschreibt Ihre Situation am besten?`,
        timestamp: new Date(),
        message_type: 'text',
        suggestions: packageInfo.user_types.map(type => ({
          label: type === 'eigenheimbesitzer' ? '🏠 Eigenheimbesitzer' :
                 type === 'vermieter' ? '🏘️ Vermieter (1-3 Objekte)' :
                 type === 'verwalter' ? '🏢 Immobilienverwalter (4+)' :
                 type === 'angestellter' ? '💼 Angestellter' :
                 type === 'freelancer' ? '💻 Freelancer' :
                 type === 'kleinunternehmer' ? '🏪 Kleinunternehmer' : type,
          value: type
        }))
      };
      setMessages([welcomeMessage]);
    }
  }, [packageInfo]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim() && !currentComponent) return;

    const userMessage = {
      sender: 'user',
      message: messageText,
      timestamp: new Date(),
      message_type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const conversationHistory = [...messages, userMessage];
      
      // Check if we need to detect user type
      if (!progress?.user_type && conversationHistory.length > 2) {
        const typeResponse = await base44.functions.invoke('analyzeUserTypeFromConversation', {
          conversation_history: conversationHistory,
          user_package: packageInfo.package
        });

        if (typeResponse.data.user_type && typeResponse.data.user_type !== 'unbekannt') {
          // User type detected - orchestrate next step
          await saveProgressMutation.mutateAsync({
            user_package: packageInfo.package,
            user_type: typeResponse.data.user_type,
            conversation_history: conversationHistory,
            current_step: 'user_type_detected',
            completed_steps: ['user_type_detected']
          });

          const stepResponse = await base44.functions.invoke('orchestrateOnboardingStep', {
            user_package: packageInfo.package,
            user_type: typeResponse.data.user_type,
            current_step: 'user_type_detected',
            completed_steps: ['user_type_detected']
          });

          const assistantMessage = {
            sender: 'assistant',
            message: stepResponse.data.message,
            timestamp: new Date(),
            message_type: 'text',
            suggestions: stepResponse.data.suggestions
          };

          setMessages(prev => [...prev, assistantMessage]);
          
          if (stepResponse.data.component) {
            setCurrentComponent(stepResponse.data.component);
          }

          return;
        }
      }

      // Handle specific user actions
      if (messageText === 'tenant_yes') {
        setCurrentComponent('tenant');
        const msg = {
          sender: 'assistant',
          message: 'Perfekt! Fügen wir Ihren ersten Mieter hinzu. 👥',
          timestamp: new Date(),
          message_type: 'text'
        };
        setMessages(prev => [...prev, msg]);
        return;
      }

      if (messageText === 'tenant_skip' || messageText === 'bank_skip') {
        // Continue to next step
        const stepResponse = await base44.functions.invoke('orchestrateOnboardingStep', {
          user_package: packageInfo.package,
          user_type: progress?.user_type,
          current_step: progress?.current_step,
          completed_steps: progress?.completed_steps || []
        });

        const msg = {
          sender: 'assistant',
          message: stepResponse.data.message,
          timestamp: new Date(),
          message_type: 'text',
          suggestions: stepResponse.data.suggestions
        };
        setMessages(prev => [...prev, msg]);
        
        if (stepResponse.data.component) {
          setCurrentComponent(stepResponse.data.component);
        }
        return;
      }

      // Default AI response
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Du bist EasyStart, der freundliche Onboarding-Assistant.
        
User Package: ${packageInfo.package}
User Message: ${messageText}

Antworte kurz und freundlich. Stelle Fragen um den User-Typ zu erkennen (${packageInfo.user_types.join(', ')}).`,
        add_context_from_internet: false
      });

      const assistantMessage = {
        sender: 'assistant',
        message: response,
        timestamp: new Date(),
        message_type: 'text'
      };

      setMessages(prev => [...prev, assistantMessage]);

      await saveProgressMutation.mutateAsync({
        user_package: packageInfo.package,
        conversation_history: [...conversationHistory, assistantMessage],
        current_step: progress?.current_step || 'conversation'
      });

    } catch (error) {
      console.error('Error processing message:', error);
      toast.error('Fehler beim Verarbeiten der Nachricht');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion.value);
  };

  const handleComponentComplete = async (data) => {
    setCurrentComponent(null);
    
    // Update completed steps
    const newCompletedSteps = [...(progress?.completed_steps || [])];
    if (currentComponent === 'object') newCompletedSteps.push('simple_object');
    if (currentComponent === 'tenant') newCompletedSteps.push('quick_tenant');
    if (currentComponent === 'tax') newCompletedSteps.push('tax_setup');

    await saveProgressMutation.mutateAsync({
      ...progress,
      completed_steps: newCompletedSteps,
      current_step: currentComponent
    });

    // Orchestrate next step
    try {
      const stepResponse = await base44.functions.invoke('orchestrateOnboardingStep', {
        user_package: packageInfo.package,
        user_type: progress?.user_type,
        current_step: currentComponent,
        completed_steps: newCompletedSteps
      });

      const completionMessage = {
        sender: 'assistant',
        message: stepResponse.data.message,
        timestamp: new Date(),
        message_type: 'text',
        suggestions: stepResponse.data.suggestions
      };
      
      setMessages(prev => [...prev, completionMessage]);
      
      if (stepResponse.data.component) {
        setTimeout(() => setCurrentComponent(stepResponse.data.component), 500);
      }
    } catch (error) {
      console.error('Error orchestrating next step:', error);
      const fallbackMessage = {
        sender: 'assistant',
        message: `Super! Das haben Sie toll gemacht! 🎉`,
        timestamp: new Date(),
        message_type: 'text'
      };
      setMessages(prev => [...prev, fallbackMessage]);
    }
  };

  if (loadingPackage) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-emerald-50 to-white">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">EasyStart</h1>
            <p className="text-sm text-slate-600">{packageInfo?.package_display_name}</p>
          </div>
        </div>
        {progress && (
          <Badge variant="outline">
            {progress.completed_steps?.length || 0} Schritte abgeschlossen
          </Badge>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => (
          <ChatMessage
            key={idx}
            message={msg}
            onSuggestionClick={handleSuggestionClick}
          />
        ))}
        
        {currentComponent && (
          <div className="max-w-2xl mx-auto">
            {currentComponent === 'object' && (
              <SimpleObjectForm onComplete={handleComponentComplete} />
            )}
            {currentComponent === 'tenant' && (
              <QuickTenantSetup onComplete={handleComponentComplete} />
            )}
            {currentComponent === 'tax' && (
              <TaxCategoryQuickSetup 
                userType={progress?.user_type} 
                onComplete={handleComponentComplete} 
              />
            )}
            {currentComponent === 'completion' && (
              <CompletionScreen 
                userType={progress?.user_type}
                packageName={packageInfo?.package}
              />
            )}
          </div>
        )}
        
        {isProcessing && (
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>EasyStart tippt...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
            placeholder="Ihre Nachricht..."
            disabled={isProcessing}
            className="flex-1"
          />
          <Button
            onClick={() => handleSendMessage(inputValue)}
            disabled={isProcessing || !inputValue.trim()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}