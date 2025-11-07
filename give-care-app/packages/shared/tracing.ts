import { StepLog } from './types';

export type TraceOptions = {
  id: string;
  onEmit?: (log: StepLog) => void;
};

export const createTrace = ({ id, onEmit }: TraceOptions) => {
  const steps: StepLog[] = [];
  const push = (event: string, data: Record<string, unknown> = {}) => {
    const log: StepLog = { t: Date.now(), event, data };
    steps.push(log);
    onEmit?.(log);
  };
  return { id, steps, push };
};
