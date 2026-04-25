const { computeDebateScores } = require('../services/scoringEngine');

describe('scoringEngine', () => {

  describe('computeDebateScores()', () => {
    const makeArg = (speaker, logic, relevance, clarity, confidence) => ({
      speaker,
      scores: { logic, relevance, clarity, confidence },
    });

    it('should calculate correct averages for user and opponent', () => {
      const args = [
        makeArg('user',     80, 70, 90, 85),
        makeArg('ai',       60, 75, 65, 70),
        makeArg('user',     70, 80, 80, 75),
        makeArg('ai',       75, 65, 80, 60),
      ];

      const scores = computeDebateScores(args);

      // User: (80+70)/2=75, (70+80)/2=75, (90+80)/2=85, (85+75)/2=80
      expect(scores.user.logic).toBe(75);
      expect(scores.user.relevance).toBe(75);
      expect(scores.user.clarity).toBe(85);
      expect(scores.user.confidence).toBe(80);
      expect(scores.user.total).toBe(Math.round((75+75+85+80)/4));

      // Opponent: (60+75)/2=68, (75+65)/2=70, (65+80)/2=73, (70+60)/2=65
      expect(scores.opponent.logic).toBe(68);
      expect(scores.opponent.relevance).toBe(70);
      expect(scores.opponent.clarity).toBe(73);
      expect(scores.opponent.confidence).toBe(65);
    });

    it('should return zeros for empty arguments array', () => {
      const scores = computeDebateScores([]);
      expect(scores.user.total).toBe(0);
      expect(scores.opponent.total).toBe(0);
    });

    it('should handle only user arguments', () => {
      const args = [
        makeArg('user', 80, 80, 80, 80),
        makeArg('user', 60, 60, 60, 60),
      ];
      const scores = computeDebateScores(args);
      expect(scores.user.total).toBe(70);
      expect(scores.opponent.total).toBe(0);
    });

    it('should treat "opponent" speaker as AI side', () => {
      const args = [
        makeArg('user',     80, 80, 80, 80),
        makeArg('opponent', 70, 70, 70, 70),
      ];
      const scores = computeDebateScores(args);
      expect(scores.opponent.total).toBe(70);
    });

    it('should compute correct total as average of 4 metrics', () => {
      const args = [makeArg('user', 100, 80, 60, 40)];
      const scores = computeDebateScores(args);
      expect(scores.user.total).toBe(70); // (100+80+60+40)/4 = 70
    });

    it('should produce correct winner when user score is higher', () => {
      const args = [
        makeArg('user', 90, 90, 90, 90),
        makeArg('ai',   50, 50, 50, 50),
      ];
      const scores = computeDebateScores(args);
      expect(scores.user.total).toBeGreaterThan(scores.opponent.total);
    });
  });
});
