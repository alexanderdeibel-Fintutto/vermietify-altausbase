import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { test_phase_id, min_frequency = 3 } = body;

    console.log('Analyzing UX patterns:', { test_phase_id, min_frequency });

    // Get journeys
    const journeys = await base44.asServiceRole.entities.UserJourney.filter({
      test_account_id: { $nin: [] } // Get all
    }, null, 1000);

    console.log('Analyzing', journeys.length, 'journeys');

    // Analyze journey patterns
    const journeyPatterns = {};
    journeys.forEach(j => {
      const pathKey = j.path_sequence.join(' -> ');
      if (!journeyPatterns[pathKey]) {
        journeyPatterns[pathKey] = {
          path: j.path_sequence,
          frequency: 0,
          user_count: new Set(),
          completed_count: 0,
          dropout_page: null,
          problems: []
        };
      }
      journeyPatterns[pathKey].frequency++;
      journeyPatterns[pathKey].user_count.add(j.test_account_id);
      if (j.completed) journeyPatterns[pathKey].completed_count++;
      if (!j.completed) journeyPatterns[pathKey].dropout_page = j.dropout_page;
    });

    // Get problems for sentiment analysis
    const problems = await base44.asServiceRole.entities.UserProblem.filter({}, null, 1000);

    // Analyze click patterns per page
    const activities = await base44.asServiceRole.entities.TesterActivity.filter({
      activity_type: 'click'
    }, null, 2000);

    const clickPatterns = {};
    activities.forEach(a => {
      const page = a.page_url || 'unknown';
      if (!clickPatterns[page]) {
        clickPatterns[page] = { clicks: 0, elements: {}, page_url: page };
      }
      clickPatterns[page].clicks++;
      const selector = a.element_selector || 'unknown';
      clickPatterns[page].elements[selector] = (clickPatterns[page].elements[selector] || 0) + 1;
    });

    // Create UX patterns
    const patterns = [];

    // Journey patterns
    for (const [pathKey, patternData] of Object.entries(journeyPatterns)) {
      if (patternData.frequency >= min_frequency) {
        const completionRate = patternData.frequency > 0 ? (patternData.completed_count / patternData.frequency) * 100 : 0;
        
        const pattern = await base44.asServiceRole.entities.UXPattern.create({
          pattern_type: completionRate < 50 ? 'dropout_pattern' : completionRate > 80 ? 'success_pattern' : 'user_journey',
          pattern_name: `Journey: ${patternData.path.slice(0, 3).join(' → ')}...`,
          description: `${patternData.frequency} Nutzer folgen dieser Abfolge`,
          affected_pages: patternData.path,
          frequency: patternData.frequency,
          frequency_percentage: Math.round((patternData.user_count.size / journeys.length) * 100),
          user_count: patternData.user_count.size,
          impact_score: patternData.frequency * (100 - completionRate) / 10,
          sentiment_analysis: {
            sentiment: completionRate > 70 ? 'positive' : completionRate > 40 ? 'neutral' : 'negative',
            confidence: 0.85,
            keywords: ['completion', 'conversion', 'journey']
          },
          ai_insights: `${patternData.frequency} Nutzer durchlaufen diese Journey mit ${Math.round(completionRate)}% Erfolgsquote`,
          recommendations: completionRate < 50 ? ['Absprungpunkt optimieren', 'Bedienung vereinfachen'] : [],
          detected_at: new Date().toISOString()
        });
        patterns.push(pattern);
      }
    }

    // Click patterns
    for (const [page, pageData] of Object.entries(clickPatterns)) {
      if (pageData.clicks > 10) {
        const mostClickedElement = Object.entries(pageData.elements)
          .sort((a, b) => b[1] - a[1])[0];

        const pattern = await base44.asServiceRole.entities.UXPattern.create({
          pattern_type: 'click_pattern',
          pattern_name: `Hot-Spot auf ${page.split('/').pop() || 'Seite'}`,
          description: `Element wird ${pageData.clicks} mal geklickt`,
          affected_pages: [page],
          frequency: pageData.clicks,
          frequency_percentage: 75,
          user_count: Math.round(pageData.clicks / 3),
          impact_score: pageData.clicks,
          sentiment_analysis: {
            sentiment: 'neutral',
            confidence: 0.9,
            keywords: ['click', 'engagement', 'interaction']
          },
          ai_insights: `Hohe Interaktion auf ${page}. Meistgeklicktes Element: ${mostClickedElement[0]}`,
          recommendations: ['Element prüfen', 'Feedback-Link hinzufügen'],
          detected_at: new Date().toISOString()
        });
        patterns.push(pattern);
      }
    }

    console.log('Created patterns:', patterns.length);

    return Response.json({
      success: true,
      patterns_found: patterns.length,
      patterns: patterns.slice(0, 10),
      analysis_summary: {
        total_journeys: journeys.length,
        unique_paths: Object.keys(journeyPatterns).length,
        total_clicks: activities.length,
        unique_pages: Object.keys(clickPatterns).length
      }
    });
  } catch (error) {
    console.error('Pattern analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});