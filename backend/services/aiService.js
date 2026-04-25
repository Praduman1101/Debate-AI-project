

const DIFFICULTY_PERSONAS = {
  beginner: 'You are a casual debater. Use simple language, straightforward arguments, and make occasional logical gaps the user could catch.',
  intermediate: 'You are a skilled debater. Use structured arguments, relevant facts, and logical reasoning. Be persuasive but beatable.',
  expert: 'You are an expert debater and critical thinker. Use sophisticated rhetoric, cite specific data, anticipate counterarguments, and construct near-airtight logical chains.',
};

/**
 * Generate an AI counter-argument for the debate
 */
const generateAIArgument = async ({ topic, stance, history, difficulty, round, totalRounds }) => {
  const persona = DIFFICULTY_PERSONAS[difficulty] || DIFFICULTY_PERSONAS.intermediate;

  const historyText = history
    .map(a => `[${a.speaker.toUpperCase()}]: ${a.text}`)
    .join('\n');

  const prompt = `You are debating the topic: "${topic}"
Your stance: ${stance}
Round: ${round} of ${totalRounds}
${round === totalRounds ? 'This is the FINAL round — make your strongest closing argument.' : ''}

Debate history so far:
${historyText || 'No arguments yet — make your opening statement.'}

${persona}

Respond with ONLY your argument. Be concise (2-4 sentences max). No preamble, no meta-commentary.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].text.trim();
};

/**
 * Score a user's argument on 4 dimensions (0–100 each)
 */
const scoreArgument = async ({ argument, topic, stance, context, round }) => {
  const prompt = `You are an impartial debate judge. Score this argument on the topic: "${topic}"

Argument: "${argument}"
Speaker's stance: ${stance}
Round: ${round}
Debate context: ${context || 'Opening argument'}

Score each dimension from 0-100. Return ONLY valid JSON, no markdown:
{
  "logic": <0-100>,
  "relevance": <0-100>,
  "clarity": <0-100>,
  "confidence": <0-100>,
  "reasoning": "<one sentence explaining the scores>"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    const text = response.content[0].text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const scores = JSON.parse(clean);
    return {
      logic:      Math.min(100, Math.max(0, Math.round(scores.logic))),
      relevance:  Math.min(100, Math.max(0, Math.round(scores.relevance))),
      clarity:    Math.min(100, Math.max(0, Math.round(scores.clarity))),
      confidence: Math.min(100, Math.max(0, Math.round(scores.confidence))),
      reasoning:  scores.reasoning || '',
    };
  } catch {
    // Fallback scoring if parse fails
    return { logic: 65, relevance: 65, clarity: 65, confidence: 65, reasoning: '' };
  }
};

/**
 * Generate end-of-debate feedback and declare winner
 */
const generateFeedback = async ({ topic, userArguments, aiArguments, userScores, aiScores }) => {
  const userText = userArguments.map((a, i) => `Round ${i + 1}: ${a.text}`).join('\n');
  const prompt = `You are a debate coach reviewing a completed debate on: "${topic}"

User's arguments:
${userText}

User's average scores: Logic ${userScores.logic}, Clarity ${userScores.clarity}, Relevance ${userScores.relevance}, Confidence ${userScores.confidence}
AI's average scores: Logic ${aiScores.logic}, Clarity ${aiScores.clarity}, Relevance ${aiScores.relevance}, Confidence ${aiScores.confidence}

Provide coaching feedback. Return ONLY valid JSON, no markdown:
{
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "improvements": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "summary": "<2 sentence overall assessment>",
  "winner": "<'user' if user total > ai total, 'opponent' if ai total > user total, 'draw' if equal>"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    const clean = response.content[0].text.trim().replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return {
      strengths:    ['Good effort throughout the debate'],
      weaknesses:   ['Could use more structured arguments'],
      improvements: ['Focus on evidence-backed claims', 'Structure each argument: claim → evidence → impact'],
      summary:      'A competitive debate. Keep practicing to sharpen your argumentation skills.',
      winner:       userScores.total >= aiScores.total ? 'user' : 'opponent',
    };
  }
};

/**
 * Generate a set of AI debate topics
 */
const generateTopics = async (category = 'technology', count = 5) => {
  const prompt = `Generate ${count} thought-provoking debate topics for the category: "${category}".
Each topic should be a debatable proposition (not a question).
Return ONLY valid JSON array, no markdown:
[
  { "title": "...", "description": "...", "difficulty": "beginner|intermediate|expert" }
]`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  });

  try {
    const clean = response.content[0].text.trim().replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return [];
  }
};

module.exports = { generateAIArgument, scoreArgument, generateFeedback, generateTopics };
