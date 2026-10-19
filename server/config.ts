export interface Config {
  hostKey: string;
  port: number;
  origins: string[];
  trustProxy: boolean;
  questionsPath: string;
  powBits: number;
  readMs?: number;
  answerMs?: number;
}

export function loadConfig(env: NodeJS.ProcessEnv): Config {
  const hostKey = env.HOST_KEY || '';
  if (hostKey.length < 12) throw new Error('HOST_KEY musi mieć co najmniej 12 znaków');
  const port = Number(env.PORT || 3210);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) throw new Error('PORT jest nieprawidłowy');
  const bits = Number(env.POW_BITS || 14);
  return {
    hostKey,
    port,
    origins: (env.ALLOWED_ORIGINS || 'https://prezentacje.fatum.cc').split(',').map((s) => s.trim()).filter(Boolean),
    trustProxy: env.TRUST_PROXY === '1',
    questionsPath: env.QUESTIONS_PATH || 'data/questions.json',
    powBits: Number.isInteger(bits) ? Math.min(Math.max(bits, 0), 24) : 14
  };
}
