import { supabase } from './supabase'
const LANG_LABELS = { ru: 'Russian', uk: 'Ukrainian', both: 'Russian and Ukrainian mixed', en: 'English' }

export function buildSystemPrompt(profile, fileContent) {
  const langInstruction = LANG_LABELS[profile.language] || 'Russian'
  const fileSection = fileContent
    ? `Here are their actual messages that define their voice:\n---\n${fileContent.substring(0, 8000)}\n---`
    : 'No file uploaded — respond in a warm, personal style.'
  const relationshipSection = profile.relationship
    ? `\nRelationship: The person you are talking to is ${profile.relationship}.`
    : ''
  const extraInfoSection = profile.extra_info
    ? `\nExtra context about ${profile.name}:\n${profile.extra_info}`
    : ''
  const topicsSection = profile.topics?.length
    ? `\nPreferred conversation topics: ${profile.topics.join(', ')}. Lean into these naturally when relevant.`
    : ''
  const factsSection = buildFactsSection(profile.facts, profile.name)

  return `You are roleplaying as ${profile.name}, a real person. You have learned their communication style from their messages.
${fileSection}
${relationshipSection}
${extraInfoSection}
${topicsSection}
${factsSection}
Rules:
- Always respond as ${profile.name} would — use their vocabulary, sentence rhythm, emotional warmth, topics they care about, typical expressions
- Language: respond in ${langInstruction}
- Mirror their personality: warmth, humor, directness, and quirks
- Keep responses natural and conversational, true to their voice
- Never break character or mention you are an AI
- If they write short messages, keep replies short; if they write long, match the energy
- Use the "known facts about people" below naturally when relevant, the way ${profile.name} would remember and reference things about people in their life`
}

function buildFactsSection(facts, personaName) {
  if (!facts || facts.length === 0) return ''
  const byPerson = {}
  for (const f of facts) {
    if (!byPerson[f.person_name]) byPerson[f.person_name] = []
    byPerson[f.person_name].push(f.fact)
  }
  const lines = Object.entries(byPerson)
    .map(([name, list]) => `- ${name}: ${list.join('; ')}`)
    .join('\n')
  return `\nKnown facts about people mentioned in past conversations (not about ${personaName} themselves):\n${lines}`
}

export async function getFileContent(profile) {
  if (profile.fileContent) return profile.fileContent
  if (!profile.file_url) return null
  const { data, error } = await supabase.storage
    .from('persona-files')
    .download(profile.file_url)
  if (error) {
    console.error('Failed to download file:', error.message)
    return null
  }
  return await data.text()
}

export async function sendChatMessage(profile, messages) {
  const fileContent = await getFileContent(profile)
  const systemPrompt = buildSystemPrompt(profile, fileContent)
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

// Background fact extraction — call after saving the assistant's reply.
// Non-blocking by design: caller should not await this before clearing "typing" state.
export async function extractFacts(profile, userText, assistantText) {
  try {
    const existingNames = [...new Set((profile.facts || []).map(f => f.person_name))]
    const extractionSystemPrompt = `You extract factual information about named people mentioned in a conversation. The conversation is between a user and an AI roleplaying as "${profile.name}".

Rules:
- Only extract facts about OTHER named people mentioned — never about ${profile.name} themselves.
- Only extract concrete, durable facts (life events, jobs, health, relationships, milestones) — not moods, opinions, or small talk.
- People already tracked: ${existingNames.join(', ') || 'none yet'}.
- Do not repeat a fact that's essentially already known.
- Respond with ONLY a raw JSON array, nothing else, no markdown fences. Example: [{"name":"David","fact":"graduated and started a new job"}]
- If there is nothing new to extract, respond with exactly: []`

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: `User said: ${userText}\n\n${profile.name} replied: ${assistantText}` }
        ],
        systemPrompt: extractionSystemPrompt,
      })
    })
    if (!response.ok) return []

    const data = await response.json()
    const text = data.content?.map(c => c.text || '').join('') || '[]'
    const cleaned = text.replace(/```json|```/g, '').trim()

    let facts
    try {
      facts = JSON.parse(cleaned)
    } catch {
      console.warn('Fact extraction returned non-JSON, skipping:', text)
      return []
    }
    if (!Array.isArray(facts) || facts.length === 0) return []

    const rows = facts
      .filter(f => f?.name && f?.fact)
      .map(f => ({ profile_id: profile.id, person_name: String(f.name).trim(), fact: String(f.fact).trim() }))
    if (rows.length === 0) return []

    const { data: inserted, error } = await supabase
      .from('profile_facts')
      .insert(rows)
      .select()

    if (error) {
      console.error('Failed to save extracted facts:', error.message)
      return []
    }
    return inserted || []
  } catch (e) {
    console.error('Fact extraction failed:', e.message)
    return []
  }
}