import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BRIEF_GENERATOR_PROMPT = `Du bist ein erfahrener Verfasser von rechtssicheren Geschäftsbriefen für Vermieter und Immobilieneigentümer.

DEINE AUFGABE:
Erstelle einen professionellen, rechtlich korrekten Brief basierend auf den Angaben des Nutzers.

VERFÜGBARE BRIEFTYPEN:
- mietkuendigung: Ordentliche oder außerordentliche Kündigung
- mietanpassung: Mieterhöhungsverlangen (§558 BGB)
- mahnung: Zahlungserinnerung oder Mahnung mit Fristsetzung
- nebenkostenwiderspruch: Widerspruch gegen Nebenkostenabrechnung
- maengelanzeige: Mängelanzeige mit Fristsetzung
- modernisierungsankuendigung: Ankündigung nach §555c BGB
- betriebskostenabrechnung_anschreiben: Begleitschreiben zur Abrechnung

ANTWORTE IM JSON-FORMAT:
{
  "brieftyp": "...",
  "betreff": "...",
  "brief_vollstaendig": "Der komplette Brief mit Formatierung",
  "versandhinweise": {
    "empfohlen": "normal|einschreiben|einschreiben_rueckschein",
    "begruendung": "..."
  },
  "fristen": [
    {
      "was": "...",
      "datum": "YYYY-MM-DD",
      "wichtig": true|false
    }
  ],
  "rechtliche_hinweise": ["..."],
  "anlagen": ["Liste benötigter Anlagen"]
}

WICHTIGE RECHTSGRUNDLAGEN:
- Kündigungsfrist Vermieter: §573c BGB (3-9 Monate je nach Mietdauer)
- Mieterhöhung: §558 BGB (Kappungsgrenze 15-20%, Begründung erforderlich)
- Mahnung: §286 BGB (Verzug nach Mahnung oder 30 Tage)
- Modernisierung: §555c BGB (3 Monate vorher ankündigen)

STIL:
- Professionell aber klar
- Rechtssicher formuliert
- Angemessene Fristen setzen
- Perfekte Formatierung`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { brieftyp, vermieter_name, vermieter_adresse, mieter_name, mieter_adresse, objekt_adresse, zusatzinfo, betrag, frist } = await req.json();

    const prompt = `Erstelle einen Brief vom Typ "${brieftyp}".

Absender (Vermieter):
${vermieter_name}
${vermieter_adresse}

Empfänger (Mieter):
${mieter_name}
${mieter_adresse}

Mietobjekt: ${objekt_adresse}

${zusatzinfo ? `Zusätzliche Informationen:\n${zusatzinfo}` : ''}
${betrag ? `Betrag: ${betrag}€` : ''}
${frist ? `Gewünschte Frist: ${frist}` : ''}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY"),
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 3000,
        system: BRIEF_GENERATOR_PROMPT,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      return Response.json({ error: result.error?.message || "API error" }, { status: 400 });
    }

    const content_text = result.content[0]?.text || "";
    const jsonMatch = content_text.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!data) {
      return Response.json({ error: "Konnte Brief nicht generieren" }, { status: 400 });
    }

    await base44.asServiceRole.entities.AIUsageLog.create({
      user_id: user.id,
      feature_key: "brief_generator",
      model: "claude-3-5-sonnet-20241022",
      tokens_used: result.usage.output_tokens + result.usage.input_tokens,
      cost_eur: ((result.usage.input_tokens * 0.003 + result.usage.output_tokens * 0.015) / 1000).toFixed(4)
    });

    return Response.json({
      ...data,
      _meta: {
        model: "claude-3-5-sonnet-20241022",
        tokens: result.usage.output_tokens + result.usage.input_tokens,
        costEur: ((result.usage.input_tokens * 0.003 + result.usage.output_tokens * 0.015) / 1000).toFixed(4)
      }
    });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});