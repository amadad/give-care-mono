import { readFileSync } from 'node:fs';
import path from 'node:path';

// Use __dirname to get prompts relative to this file, not cwd
const PROMPT_DIR = path.join(__dirname);

const readPrompt = (name: string) => readFileSync(path.join(PROMPT_DIR, `${name}.md`), 'utf-8');

export const prompts = {
  main: readPrompt('main_agent'),
  crisis: readPrompt('crisis_agent'),
  assessment: readPrompt('assessment_agent'),
};

export type PromptName = keyof typeof prompts;
