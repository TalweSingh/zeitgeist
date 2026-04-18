# Frontend

Client-side UI for the Zeitgeist agent. Touch only the paths listed here to avoid conflicts with backend work.

## Owned paths

- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `components/**` — all UI
  - `components/Artifacts/**` — brand brief, content board, drafts, research log, etc.
  - `components/Chat/**` — chat column, composer, message bubbles
  - `components/ui/**` — shadcn primitives
- `tailwind.config.ts`, `components.json`, `postcss.config.js`
- `public/**`

## Shared (do NOT change without updating `CONTRACT.md` in the same edit)

- `types/index.ts`
- Any fetch body or SSE consumer shape that must match a backend route

## Grey areas (frontend-owned, but coupled to backend contracts)

These are yours to edit, but their data shapes come from the backend. If a field is missing or renamed, check `CONTRACT.md` first — don't silently reshape the consumer:

- `components/Chat/useAgentTurn.ts` — consumes `/api/agent/turn` SSE
- `components/Chat/useResearchStream.ts` — consumes `/api/research` SSE
- `components/Artifacts/_hooks/useLearnings.ts` — consumes `/api/learnings`

## Workflow

1. Stay inside owned paths.
2. If you need a new field from the backend, update `CONTRACT.md` first and ping backend — don't reach into `app/api/**` or `lib/**`.
3. Run `pnpm build` before handing off.
