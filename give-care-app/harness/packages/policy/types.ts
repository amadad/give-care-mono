export type PolicyRule = {
  id: string;
  when: string;
  action: string;
};

export type PolicyBundle = {
  name: string;
  rules: PolicyRule[];
};

export type PolicyDecision = {
  allow: boolean;
  actions: { ruleId: string; action: string }[];
  message?: string;
  routeOverride?: 'crisis' | 'assessment';
};
