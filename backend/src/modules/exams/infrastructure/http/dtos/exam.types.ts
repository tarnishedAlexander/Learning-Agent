export type GenerateExamInput = {
  templateId: string;
  subject: string;
  level: 'easy' | 'medium' | 'hard';
  numQuestions: number;
  format?: 'json' | 'markdown';
  model?: { provider: string; name: string };
  extra?: Record<string, any>;
};

export type GeneratedExamResult = {
  output: string;
  provider?: string;
  model?: string;
};
