export type CrisisSeverity = 'low' | 'medium' | 'high';

const crisisKeywordMap: Array<{ keyword: string; severity: CrisisSeverity }> = [
  { keyword: 'kill myself', severity: 'high' },
  { keyword: 'suicide', severity: 'high' },
  { keyword: 'i want to die', severity: 'high' },
  { keyword: 'end my life', severity: 'high' },
  { keyword: 'hurt myself', severity: 'medium' },
  { keyword: 'self harm', severity: 'medium' },
  { keyword: "can't go on", severity: 'medium' },
  { keyword: 'hopeless', severity: 'medium' },
  { keyword: 'done with life', severity: 'medium' },
  { keyword: 'make it stop', severity: 'medium' },
  { keyword: 'panic attack', severity: 'low' },
  { keyword: 'overdose', severity: 'high' },
  { keyword: 'lost control', severity: 'medium' },
];

export type CrisisDetection = {
  hit: boolean;
  severity?: CrisisSeverity;
  keyword?: string;
};

export const detectCrisis = (text: string): CrisisDetection => {
  const lower = text.toLowerCase();
  const match = crisisKeywordMap.find(({ keyword }) => lower.includes(keyword));
  if (!match) return { hit: false };
  return { hit: true, severity: match.severity, keyword: match.keyword };
};

export const crisisResponse = (userName?: string) =>
  `I hear how hard this is${userName ? `, ${userName}` : ''}. You are not alone.\n\n988 Suicide & Crisis Lifeline (call or text)\n741741 Crisis Text Line (text HOME)\n911 if you're in immediate danger.\n\nWant help contacting one?`;

/**
 * Get tone guidance based on context
 */
export const getTone = (context: any): string => {
  return 'Be warm, empathetic, and concise. Validate feelings before offering solutions.';
};

