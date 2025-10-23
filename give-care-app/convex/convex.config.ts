import { defineApp } from 'convex/server'
import twilio from '@convex-dev/twilio/convex.config'
import rateLimiter from '@convex-dev/rate-limiter/convex.config'

const app = defineApp()

app.use(twilio)
app.use(rateLimiter)

export default app
