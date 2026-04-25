const Sentiment = require('sentiment');
const nlp = require('compromise');

const sentimentAnalyzer = new Sentiment();

// Debate-specific intent patterns
const INTENT_PATTERNS = {
  claim:         /\b(is|are|will|should|must|would|has|have)\b/i,
  counter:       /\b(however|but|although|despite|contrary|disagree|wrong|false|incorrect|flawed)\b/i,
  evidence:      /\b(study|research|data|statistics|according|shows|proves|evidence|fact|report|percent|%)\b/i,
  rebuttal:      /\b(your point|you said|you claim|you argue|earlier|previously|mentioned)\b/i,
  concession:    /\b(granted|admittedly|true|agree|fair point|concede|valid)\b/i,
  conclusion:    /\b(therefore|thus|hence|in conclusion|ultimately|overall|finally|in summary)\b/i,
};

const COMPLEXITY_INDICATORS = [
  /\b(furthermore|moreover|consequently|nevertheless|notwithstanding)\b/i,
  /\b(paradigm|framework|empirical|systemic|holistic|dichotomy)\b/i,
  /\b(correlation|causation|implication|ramification|proposition)\b/i,
];

/**
 * Full NLP analysis of a debate argument
 */
const analyzeArgument = (text) => {
  if (!text || text.trim().length === 0) {
    return { sentiment: 'neutral', intent: 'claim', keywords: [], complexity: 0 };
  }

  // Sentiment
  const sentResult = sentimentAnalyzer.analyze(text);
  let sentiment = 'neutral';
  if (sentResult.score > 2) sentiment = 'positive';
  else if (sentResult.score < -2) sentiment = 'negative';

  // Intent detection
  let intent = 'claim';
  for (const [key, pattern] of Object.entries(INTENT_PATTERNS)) {
    if (pattern.test(text)) {
      intent = key;
      break;
    }
  }

  // Keyword extraction using compromise
  const doc = nlp(text);
  const nouns  = doc.nouns().out('array').slice(0, 5);
  const topics = doc.topics().out('array').slice(0, 3);
  const keywords = [...new Set([...nouns, ...topics])]
    .filter(k => k.length > 3)
    .slice(0, 6);

  // Complexity score (0–100)
  const wordCount  = text.split(/\s+/).length;
  const sentences  = text.split(/[.!?]+/).filter(Boolean).length;
  const avgWordLen = text.replace(/\s+/g, '').length / wordCount;
  const complexWordsCount = COMPLEXITY_INDICATORS.filter(p => p.test(text)).length;

  const complexity = Math.min(
    100,
    Math.round(
      (avgWordLen - 3) * 10 +
      (wordCount / 5) +
      (complexWordsCount * 15) +
      (sentences > 1 ? 10 : 0)
    )
  );

  return {
    sentiment,
    intent,
    keywords,
    complexity: Math.max(0, complexity),
    wordCount,
    sentimentScore: sentResult.score,
  };
};

/**
 * Check argument quality heuristics
 */
const getQualityHints = (text) => {
  const hints = [];
  const wordCount = text.split(/\s+/).length;

  if (wordCount < 10) hints.push('Argument is very short — add more detail');
  if (wordCount > 150) hints.push('Consider being more concise');
  if (!INTENT_PATTERNS.evidence.test(text)) hints.push('Back up your claim with evidence');
  if (INTENT_PATTERNS.counter.test(text)) hints.push('Good use of counter-argument framing');
  if (INTENT_PATTERNS.conclusion.test(text)) hints.push('Clear concluding language detected');

  return hints;
};

/**
 * Compute NLP-based similarity between two texts (0–1)
 * Simple cosine similarity on term frequency
 */
const computeSimilarity = (text1, text2) => {
  const tokenize = t => t.toLowerCase().match(/\b\w{3,}\b/g) || [];
  const t1 = tokenize(text1);
  const t2 = tokenize(text2);

  const allTerms = [...new Set([...t1, ...t2])];
  const tf1 = Object.fromEntries(allTerms.map(t => [t, t1.filter(w => w === t).length]));
  const tf2 = Object.fromEntries(allTerms.map(t => [t, t2.filter(w => w === t).length]));

  const dot    = allTerms.reduce((s, t) => s + tf1[t] * tf2[t], 0);
  const norm1  = Math.sqrt(allTerms.reduce((s, t) => s + tf1[t] ** 2, 0));
  const norm2  = Math.sqrt(allTerms.reduce((s, t) => s + tf2[t] ** 2, 0));

  return norm1 && norm2 ? Math.round((dot / (norm1 * norm2)) * 100) / 100 : 0;
};

module.exports = { analyzeArgument, getQualityHints, computeSimilarity };
