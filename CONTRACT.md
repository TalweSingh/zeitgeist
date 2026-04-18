# Contract

The boundary between frontend and backend. Both sides read from here. **Any change to the items below requires updating this file in the same commit** — that is the coordination rule that prevents conflicts.

## What lives here

- `types/index.ts` — shared TypeScript types
- API route request/response JSON shapes (under `app/api/**`)
- SSE event names and payload shapes
- Tool input/output types that cross the FE/BE boundary

## Current surface

### HTTP routes

| Route | Method | Request | Response | Consumed by |
| --- | --- | --- | --- | --- |
| `/api/agent/turn` | POST | _fill in_ | SSE stream | `components/Chat/useAgentTurn.ts` |
| `/api/research` | POST | _fill in_ | SSE stream | `components/Chat/useResearchStream.ts` |
| `/api/learnings` | GET | — | _fill in_ | `components/Artifacts/_hooks/useLearnings.ts` |
| `/api/channels/linkedin/copy` | POST | _fill in_ | _fill in_ | _fill in_ |
| `/api/channels/x/publish` | POST | _fill in_ | _fill in_ | _fill in_ |

### SSE events

List each event name emitted by an SSE endpoint and its payload shape. Add rows as events are introduced or changed.

| Endpoint | Event | Payload |
| --- | --- | --- |
| _fill in_ | _fill in_ | _fill in_ |

### Shared types (`types/index.ts`)

Keep a one-line summary per exported type so either side can scan without opening the file.

- _fill in as types are added / changed_

## Change protocol

1. **Propose** the change here first (edit this file).
2. **Implement** on the producing side (usually backend).
3. **Consume** on the other side.
4. Never rename or remove a field in a single commit without also updating every consumer listed in the tables above.

## Ownership recap

- Backend paths → see `BACKEND.md`
- Frontend paths → see `FRONTEND.md`
- This file → jointly owned; either side may edit, but both sides must stay in sync with it.
