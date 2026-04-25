const {
  analyzeArgument,
  getQualityHints,
  computeSimilarity,
} = require('../services/nlpService');

describe('nlpService', () => {

  // ── analyzeArgument ────────────────────────────────────────────────────
  describe('analyzeArgument()', () => {
    it('should return neutral sentiment for empty string', () => {
      const result = analyzeArgument('');
      expect(result.sentiment).toBe('neutral');
      expect(result.intent).toBe('claim');
    });

    it('should detect positive sentiment', () => {
      const result = analyzeArgument('AI greatly improves healthcare and saves many lives through advanced diagnostics.');
      expect(result.sentiment).toBe('positive');
    });

    it('should detect negative sentiment', () => {
      const result = analyzeArgument('AI is dangerous and harmful and will destroy jobs and cause widespread misery.');
      expect(result.sentiment).toBe('negative');
    });

    it('should detect counter-argument intent', () => {
      const result = analyzeArgument('However, despite these claims, the evidence clearly contradicts this position.');
      expect(result.intent).toBe('counter');
    });

    it('should detect evidence intent', () => {
      const result = analyzeArgument('According to research data and statistics, 85% of experts agree on this matter.');
      expect(result.intent).toBe('evidence');
    });

    it('should detect conclusion intent', () => {
      const result = analyzeArgument('Therefore, in conclusion, AI development must be carefully regulated.');
      expect(result.intent).toBe('conclusion');
    });

    it('should extract keywords from a substantive argument', () => {
      const result = analyzeArgument('Artificial intelligence and machine learning algorithms are transforming healthcare diagnostics.');
      expect(result.keywords).toBeDefined();
      expect(Array.isArray(result.keywords)).toBe(true);
    });

    it('should calculate higher complexity for advanced vocabulary', () => {
      const simple   = analyzeArgument('AI is good. It helps people. We should use it more.');
      const advanced = analyzeArgument('The paradigmatic shift in artificial intelligence notwithstanding, the empirical evidence for systemic ramifications remains inconclusive.');
      expect(advanced.complexity).toBeGreaterThan(simple.complexity);
    });

    it('should return wordCount', () => {
      const result = analyzeArgument('AI is dangerous to society');
      expect(result.wordCount).toBe(5);
    });
  });

  // ── getQualityHints ────────────────────────────────────────────────────
  describe('getQualityHints()', () => {
    it('should warn about very short arguments', () => {
      const hints = getQualityHints('AI is good.');
      expect(hints.some(h => h.toLowerCase().includes('short'))).toBe(true);
    });

    it('should praise evidence-backed arguments', () => {
      const hints = getQualityHints('Research shows that 90% of scientists agree that climate change is real and dangerous according to peer-reviewed data.');
      expect(hints.some(h => h.toLowerCase().includes('evidence'))).toBe(true);
    });

    it('should praise counter-argument framing', () => {
      const hints = getQualityHints('However, despite what opponents argue, the data clearly contradicts this interpretation of the evidence.');
      expect(hints.some(h => h.toLowerCase().includes('counter'))).toBe(true);
    });
  });

  // ── computeSimilarity ─────────────────────────────────────────────────
  describe('computeSimilarity()', () => {
    it('should return 1 for identical texts', () => {
      const text = 'Artificial intelligence will transform medicine and healthcare globally.';
      const sim  = computeSimilarity(text, text);
      expect(sim).toBeCloseTo(1, 1);
    });

    it('should return 0 for completely unrelated texts', () => {
      const sim = computeSimilarity('The ocean is vast', 'Quantum computers process information differently');
      expect(sim).toBeLessThan(0.3);
    });

    it('should return a score between 0 and 1', () => {
      const sim = computeSimilarity(
        'AI benefits healthcare research and diagnostics',
        'Machine learning improves medical outcomes significantly'
      );
      expect(sim).toBeGreaterThanOrEqual(0);
      expect(sim).toBeLessThanOrEqual(1);
    });

    it('should handle empty strings gracefully', () => {
      const sim = computeSimilarity('', 'some text here');
      expect(sim).toBe(0);
    });
  });
});
