export interface Scheduler {
  enqueue(
    name: string,
    payload: Record<string, unknown>,
    runAt: Date,
    opts: { userExternalId: string; timezone: string }
  ): Promise<string>;
  scheduleTrigger(input: {
    userExternalId: string;
    rrule: string;
    timezone: string;
    nextRun: Date;
    payload: Record<string, unknown>;
  }): Promise<string>;
  cancelTrigger(triggerId: string): Promise<void>;
}
