import { OAIModelDriver } from '../drivers/model/oai.driver';
import { ConvexStore } from '../drivers/store/convex.store';
import { ConvexScheduler } from '../drivers/scheduler/convex.scheduler';

export const runtime = {
  model: OAIModelDriver,
  store: ConvexStore,
  scheduler: ConvexScheduler,
};

export type Runtime = typeof runtime;
