import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Claude Preise (Stand Januar 2026) - in USD pro 1M Tokens
const CLAUDE_PRICES = {
  "claude-sonnet-4-20250514": { input: 3.00, output: 15.00, cacheWrite: 3.75, cacheRead: 0.30 },
  "claude-haiku-3-5-20241022": { input: 0.80, output: 4.00, cacheWrite: 1.00, cacheRead: 0.08 },
  "claude-opus-4-20250514": { input: 15.00, output: 75.00, cacheWrite: 18.75, cacheRead: 1.50 },
};

// EUR/USD Wechselkurs (vereinfacht)
const EUR_USD_RATE = 0.92;

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const { 
      action,           // "chat" | "analyze" | "ocr" | "categorize"
      prompt,           // User-Prompt
      systemPrompt,     // System-Prompt (wird gecacht)
      context,          // Optionaler Kontext
      imageBase64,      // Optional: Bild für Vision
      imageMediaType,   // Optional: "image/jpeg", "image/png"
      model,            // Optional: Überschreibt default
      maxTokens,        // Optional: Überschreibt default
      userId,           // Für Usage-Tracking
      featureKey,       // Für Feature-Config
      conversationId,   // Optional: Für Chat-Historie
    } = await req.json();

    // 1. AISettings laden
    const settings = await getAISettings(base44);
    
    if (!settings.is_enabled) {
      return Response.json({ 
        success: false, 
        error: "AI-Features sind deaktiviert" 
      }, { status: 403 });
    }

    // 2. Budget prüfen
    const budgetCheck = await checkMonthlyBudget(base44, settings);
    if (!budgetCheck.allowed) {
      return Response.json({ 
        success: false, 
        error: "Monatliches AI-Budget erreicht",
        budget_used: budgetCheck.used,
        budget_limit: budgetCheck.limit
      }, { status: 429 });
    }

    // 3. Rate-Limit prüfen
    const rateLimitCheck = await checkRateLimit(base44, userId, settings, featureKey);
    if (!rateLimitCheck.allowed) {
      return Response.json({ 
        success: false, 
        error: `Rate-Limit erreicht. Nächste Anfrage in ${rateLimitCheck.retryAfter} Sekunden`,
        retry_after: rateLimitCheck.retryAfter
      }, { status: 429 });
    }

    // 4. Feature-Config laden (falls vorhanden)
    const featureConfig = await getFeatureConfig(base44, featureKey);
    
    // 5. Modell bestimmen (Priorität: Parameter > FeatureConfig > Settings)
    const selectedModel = model || featureConfig?.preferred_model || settings.default_model;
    const selectedMaxTokens = maxTokens || featureConfig?.max_tokens || 1024;

    // 6. Claude API aufrufen MIT PROMPT CACHING
    const startTime = Date.now();
    const response = await callClaudeWithCaching({
      systemPrompt: systemPrompt || featureConfig?.system_prompt || getDefaultSystemPrompt(action),
      userPrompt: prompt,
      context,
      imageBase64,
      imageMediaType,
      model: selectedModel,
      maxTokens: selectedMaxTokens,
      enableCaching: settings.enable_prompt_caching,
    });
    const responseTime = Date.now() - startTime;

    // 7. Kosten berechnen
    const costs = calculateCosts(response.usage, selectedModel);

    // 8. Usage loggen
    await logUsage(base44, {
      userId,
      feature: featureKey || action,
      model: selectedModel,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheCreationTokens: response.usage.cache_creation_input_tokens || 0,
      cacheReadTokens: response.usage.cache_read_input_tokens || 0,
      costEur: costs.totalEur,
      costWithoutCacheEur: costs.withoutCacheEur,
      responseTimeMs: responseTime,
      success: true,
      contextType: action,
      metadata: { conversationId }
    });

    // 9. Erfolgreiche Antwort
    return Response.json({
      success: true,
      content: response.content[0]?.text || "",
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        cache_read_tokens: response.usage.cache_read_input_tokens || 0,
        cache_creation_tokens: response.usage.cache_creation_input_tokens || 0,
        cost_eur: costs.totalEur,
        savings_eur: costs.savingsEur,
        savings_percent: costs.savingsPercent,
      },
      model: selectedModel,
      response_time_ms: responseTime,
      budget_remaining: budgetCheck.remaining - costs.totalEur,
      rate_limit_remaining: rateLimitCheck.remaining - 1,
    });

  } catch (error) {
    console.error("AI Service Error:", error);
    
    // Error loggen
    await logUsage(base44, {
      userId: userId || "unknown",
      feature: "error",
      model: "unknown",
      inputTokens: 0,
      outputTokens: 0,
      costEur: 0,
      success: false,
      errorMessage: error.message,
    });

    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});


// ============================================================================
// CLAUDE API MIT PROMPT CACHING
// ============================================================================

async function callClaudeWithCaching({ 
  systemPrompt, 
  userPrompt, 
  context, 
  imageBase64, 
  imageMediaType,
  model, 
  maxTokens,
  enableCaching 
}) {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY nicht konfiguriert");
  }

  // System-Content mit Cache-Control (wenn aktiviert)
  const systemContent = enableCaching ? [
    {
      type: "text",
      text: systemPrompt,
      cache_control: { type: "ephemeral" }  // 5-Minuten Cache
    }
  ] : systemPrompt;

  // Messages aufbauen
  const messages = [];
  
  // Optional: Kontext als erste Message
  if (context) {
    messages.push({
      role: "user",
      content: `Kontext: ${context}`
    });
    messages.push({
      role: "assistant", 
      content: "Verstanden, ich berücksichtige diesen Kontext."
    });
  }

  // User-Prompt (mit optionalem Bild)
  const userContent = [];
  
  if (imageBase64 && imageMediaType) {
    userContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: imageMediaType,
        data: imageBase64,
      }
    });
  }
  
  userContent.push({
    type: "text",
    text: userPrompt
  });

  messages.push({
    role: "user",
    content: userContent.length === 1 ? userContent[0].text : userContent
  });

  // API-Call
  const headers = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  };

  // Cache-Beta-Header wenn aktiviert
  if (enableCaching) {
    headers["anthropic-beta"] = "prompt-caching-2024-07-31";
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemContent,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `Claude API Fehler: ${response.status}`);
  }

  return response.json();
}


// ============================================================================
// KOSTEN-BERECHNUNG
// ============================================================================

function calculateCosts(usage, model) {
  const prices = CLAUDE_PRICES[model] || CLAUDE_PRICES["claude-sonnet-4-20250514"];
  
  // Normale Token-Kosten (USD)
  const inputCostUsd = (usage.input_tokens / 1_000_000) * prices.input;
  const outputCostUsd = (usage.output_tokens / 1_000_000) * prices.output;
  
  // Cache-Kosten (USD)
  const cacheWriteCostUsd = ((usage.cache_creation_input_tokens || 0) / 1_000_000) * prices.cacheWrite;
  const cacheReadCostUsd = ((usage.cache_read_input_tokens || 0) / 1_000_000) * prices.cacheRead;
  
  // Total mit Cache
  const totalUsd = inputCostUsd + outputCostUsd + cacheWriteCostUsd + cacheReadCostUsd;
  
  // Was hätte es OHNE Cache gekostet?
  const tokensWithoutCache = usage.input_tokens + (usage.cache_read_input_tokens || 0);
  const withoutCacheUsd = (tokensWithoutCache / 1_000_000) * prices.input + outputCostUsd;
  
  // Ersparnis
  const savingsUsd = Math.max(0, withoutCacheUsd - totalUsd);
  const savingsPercent = withoutCacheUsd > 0 ? Math.round((savingsUsd / withoutCacheUsd) * 100) : 0;

  return {
    totalEur: Math.round(totalUsd * EUR_USD_RATE * 10000) / 10000,
    withoutCacheEur: Math.round(withoutCacheUsd * EUR_USD_RATE * 10000) / 10000,
    savingsEur: Math.round(savingsUsd * EUR_USD_RATE * 10000) / 10000,
    savingsPercent,
  };
}


// ============================================================================
// HILFSFUNKTIONEN
// ============================================================================

async function getAISettings(base44) {
  try {
    const data = await base44.asServiceRole.entities.AISettings.list();
    return data?.[0] || {
      is_enabled: true,
      default_model: "claude-sonnet-4-20250514",
      monthly_budget_eur: 50,
      enable_prompt_caching: true,
      rate_limit_per_user_hour: 20,
      rate_limit_per_user_day: 100,
    };
  } catch {
    // Falls Entity nicht existiert: Defaults
    return {
      is_enabled: true,
      default_model: "claude-sonnet-4-20250514",
      monthly_budget_eur: 50,
      enable_prompt_caching: true,
      rate_limit_per_user_hour: 20,
      rate_limit_per_user_day: 100,
    };
  }
}

async function getFeatureConfig(base44, featureKey) {
  if (!featureKey) return null;
  try {
    const data = await base44.asServiceRole.entities.AIFeatureConfig.list();
    return data?.find(f => f.feature_key === featureKey) || null;
  } catch {
    return null;
  }
}

async function checkMonthlyBudget(base44, settings) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const logs = await base44.asServiceRole.entities.AIUsageLog.filter({
      created_date: { $gte: startOfMonth.toISOString() }
    });
    
    const used = logs?.reduce((sum, log) => sum + (log.cost_eur || 0), 0) || 0;
    const limit = settings.monthly_budget_eur || 50;
    
    return {
      allowed: used < limit,
      used: Math.round(used * 100) / 100,
      limit,
      remaining: Math.round((limit - used) * 100) / 100,
      percent: Math.round((used / limit) * 100),
    };
  } catch {
    return { allowed: true, used: 0, limit: 50, remaining: 50, percent: 0 };
  }
}

async function checkRateLimit(base44, userId, settings, featureKey) {
  if (!userId) return { allowed: true, remaining: 999 };
  
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const logs = await base44.asServiceRole.entities.AIUsageLog.filter({
      user_email: userId,
      created_date: { $gte: oneHourAgo.toISOString() }
    });
    
    const count = logs?.length || 0;
    const limit = settings.rate_limit_per_user_hour || 20;
    
    if (count >= limit) {
      // Berechne wann ältester Request "abläuft"
      const oldestLog = logs?.sort((a, b) => new Date(a.created_date) - new Date(b.created_date))[0];
      const retryAfter = oldestLog 
        ? Math.ceil((new Date(oldestLog.created_date).getTime() + 3600000 - now.getTime()) / 1000)
        : 60;
      
      return { allowed: false, remaining: 0, retryAfter };
    }
    
    return { allowed: true, remaining: limit - count };
  } catch {
    return { allowed: true, remaining: 999 };
  }
}

async function logUsage(base44, data) {
  try {
    await base44.asServiceRole.entities.AIUsageLog.create({
      user_email: data.userId || "anonymous",
      feature: data.feature || "unknown",
      model: data.model || "unknown",
      input_tokens: data.inputTokens || 0,
      output_tokens: data.outputTokens || 0,
      cache_creation_tokens: data.cacheCreationTokens || 0,
      cache_read_tokens: data.cacheReadTokens || 0,
      cost_eur: data.costEur || 0,
      cost_without_cache_eur: data.costWithoutCacheEur || 0,
      response_time_ms: data.responseTimeMs || 0,
      success: data.success !== false,
      error_message: data.errorMessage || null,
      context_type: data.contextType || null,
      request_metadata: data.metadata || null,
    });
  } catch (e) {
    console.error("Failed to log usage:", e);
  }
}

function getDefaultSystemPrompt(action) {
  const prompts = {
    chat: `Du bist ein hilfreicher Assistent für deutsche Immobilienverwaltung. 
Antworte auf Deutsch, präzise und praxisorientiert.
Beachte deutsches Mietrecht (BGB §§ 535ff), Steuerrecht und BetrKV.`,
    
    ocr: `Du bist ein Experte für Dokumentenerkennung.
Extrahiere alle relevanten Daten aus dem Dokument.
Antworte als strukturiertes JSON.`,
    
    analysis: `Du bist ein Analyst für Immobilieninvestitionen.
Analysiere die Daten und gib fundierte Einschätzungen.
Berücksichtige den deutschen Markt und Steueraspekte.`,
    
    categorize: `Du kategorisierst Buchungen nach SKR03/SKR04.
Gib die passende Kategorie und Kontonummer zurück.
Antworte als JSON: { "category": "...", "account": "..." }`,
  };
  
  return prompts[action] || prompts.chat;
}

async function callClaudeWithCaching({ 
  systemPrompt, 
  userPrompt, 
  context, 
  imageBase64, 
  imageMediaType,
  model, 
  maxTokens,
  enableCaching 
}) {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY nicht konfiguriert");
  }

  // System-Content mit Cache-Control (wenn aktiviert)
  const systemContent = enableCaching ? [
    {
      type: "text",
      text: systemPrompt,
      cache_control: { type: "ephemeral" }  // 5-Minuten Cache
    }
  ] : systemPrompt;

  // Messages aufbauen
  const messages = [];
  
  // Optional: Kontext als erste Message
  if (context) {
    messages.push({
      role: "user",
      content: `Kontext: ${context}`
    });
    messages.push({
      role: "assistant", 
      content: "Verstanden, ich berücksichtige diesen Kontext."
    });
  }

  // User-Prompt (mit optionalem Bild)
  const userContent = [];
  
  if (imageBase64 && imageMediaType) {
    userContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: imageMediaType,
        data: imageBase64,
      }
    });
  }
  
  userContent.push({
    type: "text",
    text: userPrompt
  });

  messages.push({
    role: "user",
    content: userContent.length === 1 ? userContent[0].text : userContent
  });

  // API-Call
  const headers = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  };

  // Cache-Beta-Header wenn aktiviert
  if (enableCaching) {
    headers["anthropic-beta"] = "prompt-caching-2024-07-31";
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemContent,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `Claude API Fehler: ${response.status}`);
  }

  return response.json();
}

function calculateCosts(usage, model) {
  const prices = CLAUDE_PRICES[model] || CLAUDE_PRICES["claude-sonnet-4-20250514"];
  
  // Normale Token-Kosten (USD)
  const inputCostUsd = (usage.input_tokens / 1_000_000) * prices.input;
  const outputCostUsd = (usage.output_tokens / 1_000_000) * prices.output;
  
  // Cache-Kosten (USD)
  const cacheWriteCostUsd = ((usage.cache_creation_input_tokens || 0) / 1_000_000) * prices.cacheWrite;
  const cacheReadCostUsd = ((usage.cache_read_input_tokens || 0) / 1_000_000) * prices.cacheRead;
  
  // Total mit Cache
  const totalUsd = inputCostUsd + outputCostUsd + cacheWriteCostUsd + cacheReadCostUsd;
  
  // Was hätte es OHNE Cache gekostet?
  const tokensWithoutCache = usage.input_tokens + (usage.cache_read_input_tokens || 0);
  const withoutCacheUsd = (tokensWithoutCache / 1_000_000) * prices.input + outputCostUsd;
  
  // Ersparnis
  const savingsUsd = Math.max(0, withoutCacheUsd - totalUsd);
  const savingsPercent = withoutCacheUsd > 0 ? Math.round((savingsUsd / withoutCacheUsd) * 100) : 0;

  return {
    totalEur: Math.round(totalUsd * EUR_USD_RATE * 10000) / 10000,
    withoutCacheEur: Math.round(withoutCacheUsd * EUR_USD_RATE * 10000) / 10000,
    savingsEur: Math.round(savingsUsd * EUR_USD_RATE * 10000) / 10000,
    savingsPercent,
  };
}