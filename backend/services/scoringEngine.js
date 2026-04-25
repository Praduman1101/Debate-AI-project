const { scoreArgument } = require('./aiService');
const { analyzeArgument, computeSimilarity } = require('./nlpService');

/**
 * Full scoring pipeline for a single argument
 * Combines LLM scoring with NLP-based adjustments
 */
const scoreDebateArgument = async ({ argument, topic, stance, previousArguments, round }) => {
  const context = previousArguments.length > 0
    ? previousArguments.slice(-2).map(a => `${a.speaker}: ${a.text}`).join('\n')
    : 'Opening argument';

  // Run NLP analysis and AI scoring in parallel
  const [nlpResult, aiScores] = await Promise.all([
    Promise.resolve(analyzeArgument(argument)),
    scoreArgument({ argument, topic, stance, context, round }),
  ]);

  // Adjust AI scores with NLP insights
  let { logic, relevance, clarity, confidence } = aiScores;

  // Penalise very short arguments
  if (nlpResult.wordCount < 10) { logic -= 10; clarity -= 10; }

  // Bonus for evidence-backed arguments
  if (nlpResult.intent === 'evidence') relevance += 5;

  // Bonus for counter-arguments (shows responsiveness)
  if (previousArguments.length > 0 && nlpResult.intent === 'counter') relevance += 5;

  // Similarity penalty — too similar to previous own argument = repetition
  const ownPrevious = previousArguments.filter(a => a.speaker === 'user');
  if (ownPrevious.length > 0) {
    const lastOwn = ownPrevious[ownPrevious.length - 1].text;
    const sim = computeSimilarity(argument, lastOwn);
    if (sim > 0.7) { logic -= 15; relevance -= 10; }
  }

  // Complexity bonus for expert-level vocabulary
  if (nlpResult.complexity > 60) clarity += 5;

  const clamp = n => Math.min(100, Math.max(0, Math.round(n)));

  const scores = {
    logic:      clamp(logic),
    relevance:  clamp(relevance),
    clarity:    clamp(clarity),
    confidence: clamp(confidence),
    reasoning:  aiScores.reasoning,
  };
  scores.total = Math.round((scores.logic + scores.relevance + scores.clarity + scores.confidence) / 4);

  return { scores, nlp: nlpResult };
};

/**
 * Recalculate cumulative scores for a full debate
 */
const computeDebateScores = (arguments_) => {
  const userArgs = arguments_.filter(a => a.speaker === 'user');
  const aiArgs   = arguments_.filter(a => a.speaker === 'ai' || a.speaker === 'opponent');

  const avgScores = (args) => {
    if (!args.length) return { logic: 0, relevance: 0, clarity: 0, confidence: 0, total: 0 };
    const sum = args.reduce(
      (acc, a) => ({
        logic:      acc.logic + (a.scores?.logic || 0),
        relevance:  acc.relevance + (a.scores?.relevance || 0),
        clarity:    acc.clarity + (a.scores?.clarity || 0),
        confidence: acc.confidence + (a.scores?.confidence || 0),
      }),
      { logic: 0, relevance: 0, clarity: 0, confidence: 0 }
    );
    const n = args.length;
    const result = {
      logic:      Math.round(sum.logic / n),
      relevance:  Math.round(sum.relevance / n),
      clarity:    Math.round(sum.clarity / n),
      confidence: Math.round(sum.confidence / n),
    };
    result.total = Math.round((result.logic + result.relevance + result.clarity + result.confidence) / 4);
    return result;
  };

  return {
    user:     avgScores(userArgs),
    opponent: avgScores(aiArgs),
  };
};

module.exports = { scoreDebateArgument, computeDebateScores };
