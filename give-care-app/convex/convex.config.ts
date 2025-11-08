import { defineApp } from 'convex/server';
// @ts-expect-error - TypeScript moduleResolution issue with convex.config export
import agent from '@convex-dev/agent/convex.config';
// @ts-expect-error - TypeScript moduleResolution issue with convex.config export
import rateLimiter from '@convex-dev/rate-limiter/convex.config';
// @ts-expect-error - TypeScript moduleResolution issue with convex.config export
import workflow from '@convex-dev/workflow/convex.config';
// @ts-expect-error - TypeScript moduleResolution issue with convex.config export
import rag from '@convex-dev/rag/convex.config';

const app = defineApp();
app.use(agent);
app.use(rateLimiter);
app.use(workflow);
app.use(rag);

export default app;
