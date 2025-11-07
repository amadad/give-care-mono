import { mainAgent } from './main';
import { assessmentAgent } from './assessment';
import { crisisAgent } from './crisis';
import { Agent } from './types';

const AGENTS: Agent[] = [crisisAgent, assessmentAgent, mainAgent];

export const agentRegistry = {
  list: () => [...AGENTS],
  get: (name: Agent['name']) => AGENTS.find((agent) => agent.name === name) ?? mainAgent,
};
