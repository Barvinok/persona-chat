const LANG_LABELS = {
  ru: 'Russian',
  uk: 'Ukrainian',
  both: 'Russian and Ukrainian mixed naturally (as the person would)',
  en: 'English',
}

export function buildSystemPrompt(profile) {
  const langInstruction = LANG_LABELS[profile.language] || 'Russian'

  const fileSection = profile.fileContent
    ? `Here are their actual messages that define their voice:\n---\n${profile.fileContent.substring(0, 8000)}\n---`
    : 'No file uploaded — respond in a warm, personal style.'

  const relationshipSection = profile.relationship
    ? `\nRelationship: The person you are talking to is ${profile.relationship}.`
    : ''

  const extraInfoSection = profile.extraInfo
    ? `\nExtra context about ${profile.name}:\n${profile.extraInfo}`
    : ''

  const topicsSection = profile.topics?.length
    ? `\nPreferred conversation topics: ${profile.topics.join(', ')}. Lean into these naturally when relevant.`
    : ''

  return `You are roleplaying as ${profile.name}, a real person. You have learned their communication style from their messages.

${fileSection}
${relationshipSection}
${extraInfoSection}
${topicsSection}

Rules:
- Always respond as ${profile.name} would — use their vocabulary, sentence rhythm, emotional warmth, topics they care about, typical expressions
- Language: respond in ${langInstruction}
- Mirror their personality: warmth, humor, directness, and quirks
- Keep responses natural and conversational, true to their voice
- Never break character or mention you are an AI
- If they write short messages, keep replies short; if they write long, match the energy`
}

export async function sendChatMessage(profile, messages) {
  const systemPrompt = buildSystemPrompt(profile)

  const apiMessages = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }))

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: apiMessages, systemPrompt }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `Request failed: ${response.status}`)
  }

  const data = await response.json()

  if (data.error) throw new Error(data.error.message || 'API error')

  return data.content?.map(c => c.text || '').join('') || ''
}
