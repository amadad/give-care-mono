# convex/lib/

Shared utilities and helpers for Convex functions.

## Modules

- `policy.ts` - Intent classification, tone rules, consent checks
- `prompts.ts` - System prompt loading and rendering
- `types.ts` - Shared TypeScript types
- `billing.ts` - Entitlement derivation (from src/services)
- `memory.ts` - In-memory caching utilities (from src/services)

## Usage

Import from `../lib/module` in any Convex function:

```typescript
import { classifyIntent } from '../lib/policy';
import { loadPrompt } from '../lib/prompts';
```
