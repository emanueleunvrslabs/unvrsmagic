import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SocialBrainRequest {
  user_id: string
  action: 'plan_content' | 'analyze_performance' | 'suggest_topics' | 'optimize_schedule'
  context?: {
    platform?: string
    timeframe?: string
    goals?: string[]
    recent_posts?: any[]
  }
}

// Placeholder - will be replaced with user's custom prompt
const SOCIAL_BRAIN_SYSTEM_PROMPT = `Sei UNVRS.SOCIAL.BRAIN, lo stratega AI per i contenuti social di UNVRS Labs.

Il tuo obiettivo è:
1. Pianificare strategie di contenuto efficaci
2. Analizzare le performance dei post
3. Suggerire argomenti e trend
4. Ottimizzare il calendario editoriale

PIATTAFORME SUPPORTATE:
- Instagram (focus visivo, stories, reels)
- LinkedIn (professionale, B2B, thought leadership)
- TikTok (breve, virale, trend)
- YouTube (long-form, tutorial, vlogs)
- Twitter/X (news, discussioni, thread)

BEST PRACTICES:
- Instagram: Post visuali di qualità, hashtag strategici, orari peak (12-14, 19-21)
- LinkedIn: Contenuti professionali, lunedì-venerdì, mattina (8-10)
- TikTok: Trend audio, hook nei primi 3 sec, hashtag virali
- YouTube: SEO titoli, miniature accattivanti, descrizioni complete

FORMATO RISPOSTA (JSON):
{
  "analysis": "Analisi della situazione attuale",
  "recommendations": [
    {
      "type": "content" | "timing" | "format" | "engagement",
      "priority": "high" | "medium" | "low",
      "suggestion": "Suggerimento specifico",
      "expected_impact": "Impatto previsto"
    }
  ],
  "content_plan": {
    "weekly_themes": ["tema1", "tema2"],
    "content_mix": {
      "educational": 40,
      "entertaining": 30,
      "promotional": 20,
      "ugc": 10
    },
    "suggested_posts": [
      {
        "platform": "instagram",
        "type": "reel",
        "topic": "argomento",
        "caption_idea": "idea caption",
        "best_time": "orario suggerito"
      }
    ]
  }
}`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const request: SocialBrainRequest = await req.json()
    console.log('[UNVRS.SOCIAL.BRAIN] Processing request:', JSON.stringify(request))

    // Get recent content performance if available
    const { data: recentContent } = await supabase
      .from('ai_social_content')
      .select('type, status, metadata, created_at')
      .eq('user_id', request.user_id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(20)

    // Get active workflows
    const { data: workflows } = await supabase
      .from('ai_social_workflows')
      .select('name, content_type, platforms, schedule_config, active')
      .eq('user_id', request.user_id)
      .eq('active', true)

    // Build context for AI
    const contextInfo = `
ACTION: ${request.action}
PLATFORM FOCUS: ${request.context?.platform || 'all'}
TIMEFRAME: ${request.context?.timeframe || 'this week'}
GOALS: ${request.context?.goals?.join(', ') || 'increase engagement'}

RECENT CONTENT (${recentContent?.length || 0} posts):
${recentContent?.map(c => `- ${c.type} on ${new Date(c.created_at).toLocaleDateString()}`).join('\n') || 'No recent content'}

ACTIVE WORKFLOWS: ${workflows?.length || 0}
${workflows?.map(w => `- ${w.name}: ${w.content_type} for ${w.platforms?.join(', ')}`).join('\n') || 'No active workflows'}
`

    // Get custom prompt if available
    const { data: customPrompt } = await supabase
      .from('agent_prompts')
      .select('prompt')
      .eq('user_id', request.user_id)
      .eq('agent_id', 'social-brain')
      .single()

    const systemPrompt = (customPrompt?.prompt || SOCIAL_BRAIN_SYSTEM_PROMPT) + `\n\nCONTEXTO ATTUALE:\n${contextInfo}`

    // Get Anthropic API key - Claude for strategic thinking
    const { data: apiKeyData } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', request.user_id)
      .eq('provider', 'anthropic')
      .single()

    if (!apiKeyData) {
      console.error('[UNVRS.SOCIAL.BRAIN] No Anthropic API key found')
      return new Response(JSON.stringify({
        success: false,
        error: 'API key not configured'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Call Anthropic Claude Sonnet
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKeyData.api_key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Esegui l'azione: ${request.action}. ${request.context?.goals ? `Obiettivi: ${request.context.goals.join(', ')}` : ''}`
          }
        ]
      })
    })

    if (!anthropicResponse.ok) {
      const error = await anthropicResponse.text()
      console.error('[UNVRS.SOCIAL.BRAIN] Anthropic error:', error)
      throw new Error('AI response failed')
    }

    const aiResult = await anthropicResponse.json()
    const aiText = aiResult.content[0]?.text || ''
    
    console.log('[UNVRS.SOCIAL.BRAIN] AI response:', aiText)

    // Parse AI response
    let parsedResponse
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      } else {
        parsedResponse = {
          analysis: aiText,
          recommendations: []
        }
      }
    } catch (e) {
      console.error('[UNVRS.SOCIAL.BRAIN] JSON parse error:', e)
      parsedResponse = {
        analysis: aiText.replace(/```json|```/g, '').trim(),
        recommendations: []
      }
    }

    // Log agent activity
    await supabase.from('agent_logs').insert({
      agent_name: 'unvrs-social-brain',
      user_id: request.user_id,
      log_level: 'info',
      message: `Social strategy: ${request.action}`,
      action: request.action,
      metadata: {
        platform: request.context?.platform,
        recommendation_count: parsedResponse.recommendations?.length,
        suggested_posts_count: parsedResponse.content_plan?.suggested_posts?.length
      },
      duration_ms: Date.now() - startTime
    })

    return new Response(JSON.stringify({
      success: true,
      ...parsedResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[UNVRS.SOCIAL.BRAIN] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
