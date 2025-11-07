import { defineApp } from 'convex/server';
// @ts-expect-error - TypeScript moduleResolution issue with convex.config export
import agent from '@convex-dev/agent/convex.config';

const app = defineApp();
app.use(agent);

export default app;
