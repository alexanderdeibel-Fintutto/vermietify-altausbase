import { base44 } from '@/api/base44Client';
import { showRateLimitWarning, showBudgetWarning } from './AIRateLimitToast';

/**
 * Zentraler Wrapper für alle AI-Anfragen
 * Nutzt aiCoreService und handhabt Fehler, Rate-Limits, Budget
 */
export async function callAI({ 
  action, 
  prompt, 
  systemPrompt,
  context,
  imageBase64,
  imageMediaType,
  model,
  maxTokens,
  featureKey 
}) {
  try {
    const user = await base44.auth.me();
    
    const response = await base44.functions.invoke('aiCoreService', {
      action,
      prompt,
      systemPrompt,
      context,
      imageBase64,
      imageMediaType,
      model,
      maxTokens,
      userId: user?.email,
      featureKey
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'AI-Anfrage fehlgeschlagen');
    }

    // UI-Warnungen anzeigen
    if (response.data.rate_limit_remaining !== undefined) {
      showRateLimitWarning(response.data.rate_limit_remaining, 'hour');
    }
    if (response.data.budget_remaining !== undefined && response.data.usage?.cost_eur) {
      const settings = await base44.entities.AISettings.list();
      const budget = settings?.[0]?.monthly_budget_eur || 50;
      const budgetPercent = ((budget - response.data.budget_remaining) / budget) * 100;
      showBudgetWarning(budgetPercent);
    }

    return {
      success: true,
      content: response.data.content,
      usage: response.data.usage,
      model: response.data.model,
      responseTime: response.data.response_time_ms
    };

  } catch (error) {
    console.error('AI Service Error:', error);
    
    // Benutzerfreundliche Fehlermeldungen
    if (error.message.includes('Budget')) {
      throw new Error('Monatliches KI-Budget erreicht. Bitte kontaktieren Sie den Administrator.');
    }
    if (error.message.includes('Rate-Limit')) {
      throw new Error('Zu viele Anfragen. Bitte warten Sie einen Moment.');
    }
    if (error.message.includes('ANTHROPIC_API_KEY')) {
      throw new Error('KI-Service nicht konfiguriert. Bitte kontaktieren Sie den Administrator.');
    }
    
    throw error;
  }
}

/**
 * React Hook für AI-Anfragen mit Loading-State
 */
export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const call = async (params) => {
    setLoading(true);
    setError(null);
    try {
      const response = await callAI(params);
      setResult(response);
      return response;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { call, loading, error, result };
}