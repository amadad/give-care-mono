# Admin Dashboard Setup Commands

**Project**: give-care-admin-dashboard (separate from existing give-care-admin SaaS template)

## Step 1: Create Project

```bash
cd /Users/amadad/Projects/givecare
mkdir give-care-admin-dashboard
cd give-care-admin-dashboard

# Initialize Vite + React 19 + TypeScript
npm create vite@latest . -- --template react-ts
npm install
```

## Step 2: Install Dependencies

```bash
# Core dependencies
npm install convex @tanstack/react-query @tanstack/react-router @tanstack/react-table
npm install recharts react-hook-form zod lucide-react
npm install date-fns

# Tailwind CSS v4
npm install -D tailwindcss@next postcss autoprefixer
npx tailwindcss init -p
```

## Step 3: Setup shadcn/ui

```bash
# Initialize shadcn/ui
npx shadcn@latest init

# When prompted:
# - TypeScript: Yes
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes
# - Tailwind config: tailwind.config.ts
# - Components: src/components
# - Utils: src/lib/utils
# - React Server Components: No
# - Import alias: @/*

# Install required components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add tabs
npx shadcn@latest add dropdown-menu
npx shadcn@latest add alert
npx shadcn@latest add skeleton
```

## Step 4: Setup Convex

```bash
# Install Convex
npm install convex

# Initialize Convex (will prompt for team/project selection)
npx convex dev

# When prompted:
# - Select existing project: give-care-type
# - This will generate convex/_generated/ folder
```

## Step 5: Configure Vite

Create/edit `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'convex': ['convex/react'],
          'charts': ['recharts'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

## Step 6: Update package.json scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  }
}
```

## Step 7: Environment Variables

Create `.env.local`:

```bash
# Convex deployment URL (from give-care-type)
VITE_CONVEX_URL=https://YOUR_DEPLOYMENT.convex.cloud

# Get this from: cd ../give-care-type && npx convex dashboard
# Copy the deployment URL from the dashboard
```

## Step 8: Setup Tailwind Config

Edit `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config
```

## Step 9: Test Setup

```bash
# Start Convex (in give-care-type project)
cd /Users/amadad/Projects/givecare/give-care-type
npx convex dev  # Keep this running

# In another terminal, start Vite dev server
cd /Users/amadad/Projects/givecare/give-care-admin-dashboard
npm run dev  # Should open http://localhost:5173
```

## Next Steps

After setup completes successfully:
1. Create routing structure (TanStack Router)
2. Create layout components (Sidebar, Header)
3. Build dashboard pages (Home, Users, Crisis, Analytics, System)
4. Deploy to Cloudflare Pages

---

## Troubleshooting

**Problem**: `npx convex dev` creates new project instead of using existing
- **Solution**: Pass deployment name explicitly: `npx convex dev --configure=ask` and select give-care-type

**Problem**: Convex types not found
- **Solution**: Run `npx convex dev` once to generate `convex/_generated/` folder

**Problem**: Tailwind styles not applying
- **Solution**: Check that `src/index.css` imports Tailwind directives:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```

**Problem**: Import alias `@/` not working
- **Solution**: Check `tsconfig.json` has paths configured:
  ```json
  {
    "compilerOptions": {
      "paths": {
        "@/*": ["./src/*"]
      }
    }
  }
  ```
