import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";
import workflow from "@convex-dev/workflow/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import twilio from "@convex-dev/twilio/convex.config";

const app = defineApp();
app.use(agent);       // Thread/message management, vector search, RAG
app.use(workflow);    // Durable workflows for check-ins, engagement, trends
app.use(rateLimiter); // Rate limiting (30 SMS/day)
app.use(twilio);      // SMS sending/receiving with built-in handling

export default app;

