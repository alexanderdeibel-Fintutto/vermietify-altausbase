import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const USER_TYPE_DETECTION_PROMPTS = {
  immobilienverwaltung: {
    eigenheimbesitzer: ['eigenheim', 'selbstgenutzt', 'eigene wohnung', 'eigenes haus', 'steuer', 'afa'],
    vermieter: ['vermiete', 'mieter', '1-3', 'vermietung', 'mietwohnung', 'mietvertrag'],
    verwalter: ['verwalte', 'viele objekte', '4+', 'professionell', 'hausverwaltung']
  },
  persoenliche_finanzen: {
    angestellter: ['angestellt', 'gehalt', 'arbeitnehmer', 'festanstellung'],
    rentner: ['rente', 'rentner', 'pension', 'ruhestand'],
    student: ['student', 'studium', 'uni', 'ausbildung']
  },
  selbstaendig: {
    freelancer: ['freelance', 'freiberuflich', 'selbstständig', 'projekte'],
    kleinunternehmer: ['kleinunternehmer', 'gewerbetreibend', 'geschäft'],
    dienstleister: ['dienstleistung', 'service', 'kunde', 'aufträge']
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversation_history, user_package } = await req.json();

    // Extrahiere User-Messages
    const userMessages = conversation_history
      .filter(msg => msg.sender === 'user')
      .map(msg => msg.message.toLowerCase())
      .join(' ');

    // Erkenne User-Typ basierend auf Keywords
    const packageTypes = USER_TYPE_DETECTION_PROMPTS[user_package] || {};
    let detectedType = null;
    let maxScore = 0;

    for (const [type, keywords] of Object.entries(packageTypes)) {
      const score = keywords.filter(keyword => userMessages.includes(keyword)).length;
      if (score > maxScore) {
        maxScore = score;
        detectedType = type;
      }
    }

    // Fallback: Nutze AI für komplexere Erkennung
    if (!detectedType || maxScore < 2) {
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Analysiere folgende User-Nachrichten und erkenne den User-Typ für das ${user_package}-Paket:

Verfügbare Typen: ${Object.keys(packageTypes).join(', ')}

User-Nachrichten: "${userMessages}"

Antworte mit JSON: {"user_type": "typ", "confidence": 0-1, "reasoning": "kurze begründung"}`,
        response_json_schema: {
          type: "object",
          properties: {
            user_type: { type: "string" },
            confidence: { type: "number" },
            reasoning: { type: "string" }
          }
        }
      });

      detectedType = aiResponse.user_type;
      maxScore = aiResponse.confidence * 10;
    }

    return Response.json({
      user_type: detectedType || 'unbekannt',
      confidence: Math.min(maxScore / 5, 1),
      reasoning: `Erkannt basierend auf Keywords und Kontext`
    });

  } catch (error) {
    console.error('Error analyzing user type:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});