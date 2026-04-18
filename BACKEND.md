# Backend

Server-side code for the Zeitgeist agent. Touch only the paths listed here to avoid conflicts with frontend work.

## Owned paths

- `app/api/**` — Next.js route handlers
  - `app/api/agent/turn/route.ts` — main agent turn endpoint
  - `app/api/research/route.ts` — research stream
  - `app/api/learnings/route.ts`
  - `app/api/channels/linkedin/copy/route.ts`
  - `app/api/channels/x/publish/route.ts`
- `lib/agent/**` — loop, phases, prompts
- `lib/tools/**` — agent tools (searchWeb, scrapeCompany, findJobs, etc.)
- `lib/channels/**` — LinkedIn / X integrations (mock + real)
- `lib/store/**` — in-memory session & performance stores
- `lib/sse.ts` — SSE helpers
- `data/*.json` — fixtures & seed data

## Shared (do NOT change without updating `CONTRACT.md` in the same edit)

- `types/index.ts`
- API request/response JSON shapes
- SSE event names and payloads
- Tool input/output types consumed by the frontend

## Grey areas (frontend-owned, but coupled to backend contracts)

These files live under `components/` but depend on backend shapes. If you rename/reshape an SSE event or API body, expect to update these too — or bump `CONTRACT.md` and let the frontend follow:

- `components/Chat/useAgentTurn.ts`
- `components/Chat/useResearchStream.ts`
- `components/Artifacts/_hooks/useLearnings.ts`

## Workflow

1. Stay inside owned paths.
2. If a change requires touching `types/index.ts`, an API shape, or an SSE event → update `CONTRACT.md` in the same commit.
3. Run `pnpm build` before handing off.
