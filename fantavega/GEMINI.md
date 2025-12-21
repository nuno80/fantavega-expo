# Fantavega - AI Agent Guide (Root)

## Project Snapshot
- **Type**: Next.js 15 Monorepo-style Application
- **Core Stack**: React 19, TypeScript, Tailwind CSS, Clerk (Auth), Socket.IO (Real-time).
- **Database**: Turso (Remote LibSQL) / BetterSQLite3 (Local).
- **Architecture**: App Router with distinct Server Components, Client Components, and Server Actions.

## Critical Workflow Rules (MANDATORY)
**After completion of EVERY sub-task**:
1.  **Update State Files**: You MUST generate and provide updated versions of these two JSON files in the same message:
    -   `guide/progetto-attuale/logica-app.json`: Document implemented logic, architectural patterns, and user flows.
    -   `guide/progetto-attuale/struttura-progetto.json`: Map new or modified files.
2.  **Wait for Confirmation**: Do not proceed to the next sub-task until confirmed.

## Root Setup Commands
```bash
pnpm install            # Install dependencies
pnpm run dev            # Start Next.js dev server
pnpm run db:migrate     # Apply Turso schema changes
pnpm run db:generate    # Generate Drizzle/SQL types (if applicable)
```

## Operational Modes

### Default Mode
- **Execute Immediately**: Follow instructions without deviation.
- **Concise Output**: Prioritize code and solutions. Minimal preamble.
- **Rationale**: Provide 1-2 sentences on *why* an approach was chosen.

### "ULTRATHINK" Protocol (Trigger Command)
When the user prompts **"ULTRATHINK"**, activate deep analysis mode:
- **Override Brevity**: Suspend conciseness rules.
- **Multi-Dimensional Analysis**: Evaluate through all lenses:
  - **Technical**: Performance, state complexity, rendering costs.
  - **UX/Accessibility**: Cognitive load, WCAG compliance.
  - **Architectural**: Scalability, maintainability, modularity.
- **Edge Case Analysis**: Document what could go wrong and how it's prevented.
- **Prohibition**: No surface-level reasoning. Dig deeper until the logic is irrefutable.

---

## Universal Conventions
- **Language**: TypeScript for everything.
- **Auth**: Clerk is the source of truth. User metadata contains `role` ('admin', 'manager').
- **Styling**: Tailwind CSS + Shadcn/UI. No arbitrary CSS files.
- **Strictness**: No `any`. Handle `null`/`undefined` explicitly.

### UI Library Discipline (CRITICAL)
- **Shadcn/UI is mandatory**: If a component exists in `src/components/ui/`, USE IT.
- **No custom primitives**: Do not build modals, dropdowns, buttons, or dialogs from scratch.
- **Wrapping is allowed**: You may wrap or style Shadcn components for custom aesthetics.
- **Rationale**: Ensures accessibility, stability, and code consistency.

---

## Design Philosophy: Intentional Minimalism
- **Anti-Generic**: Reject boilerplate "template" layouts when designing new UI.
- **Purpose-Driven**: Before placing any element, calculate its purpose. If none, delete it.
- **Functional First**: For app screens (auction, dashboard), prioritize **usability over novelty**.
- **Polish**: Focus on micro-interactions, perfect spacing, and "invisible" UX.
- **Exception**: Landing pages and marketing screens may prioritize visual flair.

## JIT Index - Documentation Map
**Go to the specific directory's GEMINI.md for detailed context:**

### 1. Application Logic & Routes
- **Path**: `src/app/`
- **Focus**: Pages, Layouts, API Routes, Server Actions.
- **Link**: [src/app/GEMINI.md](src/app/GEMINI.md)

### 2. User Interface
- **Path**: `src/components/`
- **Focus**: UI Components, Shadcn, Hooks, Client State.
- **Link**: [src/components/GEMINI.md](src/components/GEMINI.md)

### 3. Business Logic (The Brain)
- **Path**: `src/lib/db/services/`
- **Focus**: Auction rules, Bidding logic, Penalties, Budget management.
- **Link**: [src/lib/db/services/GEMINI.md](src/lib/db/services/GEMINI.md)

### 4. Database Layer
- **Path**: `database/`
- **Focus**: SQL Schema, Migrations, Seed data.
- **Link**: [database/GEMINI.md](database/GEMINI.md)

### Quick Find Commands
- Search business logic: `rg "class .*Service" src/lib/db/services`
- Find API endpoint: `rg "export async function (GET|POST)" src/app/api`
- Find React component: `rg "export function [A-Z]" src/components`
