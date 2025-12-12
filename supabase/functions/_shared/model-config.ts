// UNVRS LABS - AI Model Configuration
// This file defines the model assignments for each agent

export const MODEL_CONFIG = {
  // UNVRS.BRAIN: Orchestration, routing, state management
  brain: {
    primary: 'gpt-5-2025-08-07',           // GPT-5.2 Pro for complex decisions
    routing: 'gpt-5-mini-2025-08-07',       // GPT-5 mini for simple routing
    fallback: 'claude-opus-4-1-20250805',   // Claude Opus 4.5 for hard reasoning
  },

  // UNVRS.SWITCH: Triage for non-clients (1-3 messages)
  switch: {
    primary: 'claude-3-5-haiku-20241022',   // Claude Haiku 4.5 - fast/cheap
  },

  // UNVRS.HLO: Personal client agent
  hlo: {
    primary: 'gpt-5-2025-08-07',            // GPT-5.2 Pro for complex requests
    costOptimized: 'gpt-5-mini-2025-08-07', // GPT-5 mini for most chats
  },

  // UNVRS.INTAKE: Requirements collection
  intake: {
    primary: 'gpt-5-2025-08-07',            // GPT-5.2 for quality briefs
  },

  // UNVRS.QUOTE: Quote estimation
  quote: {
    primary: 'gpt-5-2025-08-07',            // GPT-5.2 Pro for precision
  },

  // UNVRS.DECK: Pitch/presentation generation
  deck: {
    primary: 'claude-opus-4-1-20250805',    // Claude Opus 4.5 for deck-grade writing
  },

  // UNVRS.CALL: Voice realtime
  call: {
    primary: 'gpt-realtime',                // OpenAI realtime for low latency
    costOptimized: 'gpt-realtime-mini',     // Mini for cost savings
  },

  // UNVRS.SOCIAL.REPLY: Fast social responses
  socialReply: {
    primary: 'claude-3-5-haiku-20241022',   // Claude Haiku 4.5 - fast/cheap
  },

  // UNVRS.SOCIAL.BRAIN/PUBLISHER: Content planning
  socialBrain: {
    primary: 'gpt-5-mini-2025-08-07',       // GPT-5 mini - balanced
  },
}

// Complexity thresholds for model escalation
export const ESCALATION_KEYWORDS = [
  'preventivo', 'quote', 'prezzo', 'costo', 'budget',
  'contratto', 'fattura', 'urgente', 'problema grave',
  'non funziona', 'errore critico', 'nuovo progetto',
  'modifica importante', 'deadline', 'scadenza'
]

// Escalation rules:
// - Use fast/cheap model for: triage, short responses, social reply
// - Escalate to top model when:
//   - Complex reasoning required
//   - Client data permissions/actions
//   - Generating final quotes/decks
//   - Message count > 5 in session
//   - Contains escalation keywords
