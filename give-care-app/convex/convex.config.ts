import { defineApp } from 'convex/server';
import agent from '@convex-dev/agent/convex.config';
import workflow from '@convex-dev/workflow/convex.config';
import rateLimiter from '@convex-dev/rate-limiter/convex.config';
import twilio from '@convex-dev/twilio/convex.config';

const app = defineApp();
app.use(agent);      // Thread/message management
app.use(workflow);   // Durable workflows
app.use(rateLimiter); // Rate limiting
app.use(twilio);     // SMS sending/receiving

export default app;
