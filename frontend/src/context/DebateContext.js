import React, { createContext, useContext, useReducer, useRef, useCallback } from 'react';
import socketService from '../services/socket';

const DebateContext = createContext(null);

const ZERO_SCORES = { logic: 0, relevance: 0, clarity: 0, confidence: 0, total: 0 };

const initialState = {
  debate:       null,
  arguments:    [],
  scores:       { user: { ...ZERO_SCORES }, opponent: { ...ZERO_SCORES } },
  currentRound: 1,
  totalRounds:  4,
  currentTurn:  'user',
  timeLeft:     30,
  status:       'idle',
  winner:       null,
  feedback:     null,
  error:        null,
};

const avgScores = (args) => {
  if (!args.length) return { ...ZERO_SCORES };
  const keys = ['logic', 'relevance', 'clarity', 'confidence'];
  const result = {};
  keys.forEach(k => {
    result[k] = Math.round(args.reduce((s, a) => s + (a.scores?.[k] || 0), 0) / args.length);
  });
  result.total = Math.round((result.logic + result.relevance + result.clarity + result.confidence) / 4);
  return result;
};

const debateReducer = (state, action) => {
  switch (action.type) {

    case 'DEBATE_STARTED':
      return {
        ...initialState,
        debate:       action.payload,
        status:       'active',
        currentTurn:  'user',
        timeLeft:     action.payload.config?.turnTimeSeconds || 30,
        totalRounds:  action.payload.config?.totalRounds || 4,
      };

    case 'DEBATE_STATE_RESTORED': {
      const p = action.payload;
      return {
        ...state,
        debate:       p,
        arguments:    p.arguments || [],
        scores:       p.scores || initialState.scores,
        currentRound: p.currentRound || 1,
        currentTurn:  p.currentTurn  || 'user',
        totalRounds:  p.config?.totalRounds || state.totalRounds,
        status:       p.status === 'active' ? 'active' : p.status,
      };
    }

    case 'ARGUMENT_SCORED': {
      const newArg = {
        speaker: action.payload.speaker,
        text:    action.payload.text,
        scores:  action.payload.scores,
        nlp:     action.payload.nlp,
        round:   state.currentRound,
      };
      return {
        ...state,
        arguments: [...state.arguments, newArg],
        status:    'ai_thinking',
      };
    }

    case 'AI_THINKING':
      return { ...state, status: 'ai_thinking' };

    case 'AI_ARGUMENT': {
      const newArg = {
        speaker: 'ai',
        text:    action.payload.text,
        scores:  action.payload.scores,
        nlp:     action.payload.nlp,
        round:   action.payload.round,
      };
      const allArgs   = [...state.arguments, newArg];
      const userArgs  = allArgs.filter(a => a.speaker === 'user');
      const aiArgs    = allArgs.filter(a => a.speaker === 'ai' || a.speaker === 'opponent');
      return {
        ...state,
        arguments:    allArgs,
        scores:       { user: avgScores(userArgs), opponent: avgScores(aiArgs) },
        currentRound: action.payload.round,
        currentTurn:  'user',
        status:       action.payload.status === 'completed' ? 'completed' : 'active',
      };
    }

    case 'TIMER_UPDATE':
      return { ...state, timeLeft: action.payload };

    case 'DEBATE_COMPLETE':
      return {
        ...state,
        status:   'completed',
        winner:   action.payload.winner,
        feedback: action.payload.feedback,
        scores:   action.payload.scores || state.scores,
      };

    case 'DEBATE_ABANDONED':
      return { ...state, status: 'abandoned' };

    case 'SET_ERROR':
      return {
        ...state,
        error:  action.payload,
        status: state.status === 'ai_thinking' ? 'active' : state.status,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
};

export const DebateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(debateReducer, initialState);
  const socketRef = useRef(null);

  const connectSocket = useCallback(async (token) => {
  try {
    socketRef.current = await socketService.connect(token);
    const s = socketRef.current;
    s.on('debate:started',   (d) => dispatch({ type: 'DEBATE_STARTED',        payload: d }));
    s.on('debate:state',     (d) => dispatch({ type: 'DEBATE_STATE_RESTORED', payload: d }));
    s.on('argument:scored',  (d) => dispatch({ type: 'ARGUMENT_SCORED',       payload: d }));
    s.on('ai:thinking',      ()  => dispatch({ type: 'AI_THINKING' }));
    s.on('ai:argument',      (d) => dispatch({ type: 'AI_ARGUMENT',           payload: d }));
    s.on('timer:update',     (d) => dispatch({ type: 'TIMER_UPDATE',          payload: d.timeLeft }));
    s.on('debate:complete',  (d) => dispatch({ type: 'DEBATE_COMPLETE',       payload: d }));
    s.on('debate:abandoned', ()  => dispatch({ type: 'DEBATE_ABANDONED' }));
    s.on('error',            (d) => dispatch({ type: 'SET_ERROR',             payload: d.message }));
  } catch (err) {
    console.error('Socket connection failed:', err.message);
    dispatch({ type: 'SET_ERROR', payload: 'Could not connect to server' });
  }
}, []);
  const disconnectSocket = useCallback(() => {
    socketService.disconnect();
    socketRef.current = null;
  }, []);

  const startDebate    = useCallback((cfg)          => { dispatch({ type: 'RESET' }); socketService.emit('debate:start',   cfg); }, []);
  const submitArgument = useCallback((id, text, v)  => socketService.emit('argument:submit', { debateId: id, text, voiceInput: v }), []);
  const abandonDebate  = useCallback((id)           => socketService.emit('debate:abandon',  { debateId: id }), []);
  const resetDebate    = useCallback(()             => dispatch({ type: 'RESET' }), []);

  return (
    <DebateContext.Provider value={{
      ...state,
      connectSocket,
      disconnectSocket,
      startDebate,
      submitArgument,
      abandonDebate,
      resetDebate,
    }}>
      {children}
    </DebateContext.Provider>
  );
};

export const useDebate = () => {
  const ctx = useContext(DebateContext);
  if (!ctx) throw new Error('useDebate must be used inside DebateProvider');
  return ctx;
};
