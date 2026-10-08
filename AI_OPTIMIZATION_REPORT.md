# AI Optimization Report

Author: Jayani Perera
Project: ApparelFlow ERP, Cutting Gatekeeper Verification Terminal

## 1. Tools and prompting

| Tool              | Used for                                                                                                                                                                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Claude (chat)** | Planning the 4-day build, database design (DBML for dbdiagram.io), Prisma schema and seed script, API route handlers, Zod schemas, React components, Tailwind styling, Vitest tests, debugging terminal errors                                     |
| **Google Gemini** | Designing and refining the UI/UX, developing an interactive and responsive landing page with animations/glassmorphism, fixing color contrast/theme inconsistencies across dashboard cards, and optimizing Next.js client/server navigation routing |

### How I Prompted

- **For Core Architecture & Backend (Claude):** I gave the full challenge brief first and asked for a step-by-step plan. After that I worked one feature at a time, one git branch per feature. I pasted real terminal errors and screenshots back into the chat and asked for fixes. I did not accept code without checking it start to end and running it.
- **For UI/UX & Landing Page (Gemini):** I provided my raw Next.js components and `globals.css` to Gemini, requesting accessible contrast adjustments, glassmorphism cards, CSS keyframe animations, and role-aware navigation highlighting. I pasted real terminal errors and screenshots back into the chat and asked why they occurred, ensuring all UI updates were manually verified before committing.

## 2. Flawed or broken AI code

### 2.1 Mixed Prisma 6 and Prisma 7 configuration

- **What the AI produced:** It gave a Prisma 6 style `datasource` block (`url` and `directUrl` inside `schema.prisma`) and also a Prisma 7 `datasource` snippet for the config file. I pasted both, because the instructions told me to.
- **What broke:** `npx prisma format` failed with error P1012 and 8 validation errors: duplicate datasource, `url` and `directUrl` no longer supported in the schema file.
- **Root cause:** The AI did not check the installed version (`@prisma/client` 7.10.0) before giving version-specific code.
- **Fix:** `schema.prisma` keeps only `provider`. The connection URL lives in the Prisma config file and reads `DIRECT_URL`.

### 2.2 Database client with no serverless connection handling

- **What the AI produced:** A plain `PrismaClient` with the default pool and default transaction settings, connected to a Neon serverless database.
- **What broke:** The verifier count endpoint returned 500 with `P2028` (transaction could not start in time), and a later page load failed with `P1017` (server closed the connection). Neon suspends idle compute, so a cold start takes several seconds and idle connections get closed.
- **Fix:** In `lib/prisma.ts` I set a longer transaction `maxWait` and `timeout`, a connection timeout, `keepAlive`, and a short `idleTimeoutMillis`, so stale connections are dropped before Neon closes them.

### 2.3 Wrong assumptions about the project setup

- **What the AI produced:** A seed script that imported the Prisma client from `../generated/prisma/client` and ran with `tsx`.
- **What broke:** The generator output in my project was `app/generated/prisma`, so the import path was wrong. `tsx` was also not installed, so `npx prisma db seed` failed with "'tsx' is not recognized".
- **Fix:** I corrected the import path to match my generator `output`, installed `tsx`, and re-ran the seed.

### 2.4 Sub-optimal UI: native dropdown on small screens

- **What the AI produced:** A native `<select>` for choosing the recipe in the order modal.
- **What broke:** On a narrow viewport the browser draws the list as a wide native popup that does not follow the modal width, and it cannot be styled for contrast. The brief asks for legible dropdowns and a responsive layout.
- **Fix:** With only two recipes, I replaced the dropdown with radio cards. They have explicit dark text on a light background, a visible selected state and an inline error state. The modal padding, the table scrolling and the button layout were also made responsive.

## 3. Human refactoring

- **Hard stop re-derives the truth.** The approve handler does not use the stored `status` column. It re-reads the counts from the database and recomputes RED, YELLOW, GREEN and uncounted from `expected_qty` and `actual_qty`. Editing the status column cannot unlock an approval.
- **Atomic state transitions.** Every transition is an `updateMany` with `WHERE status = <expected state>` inside a transaction. If the count is not 1, the request fails with 409. Double approval and approve-versus-reject races are covered.
- **Identity and time come from the server.** The verifier id is read from the JWT and the timestamp from the database. The approve body is ignored on purpose.
- **Input handling.** Zod schemas use `.strict()` and plain `z.number()` instead of `z.coerce.number()`. Quantity inputs are text fields with a regex, because `type="number"` accepts `e` and `-` and hides invalid input.
- **Contrast.** Light color scheme is forced, inputs, selects, textareas and options have explicit dark text and white background, and error text uses a dark red.
- **Sewing isolation.** The queue query takes a typed status chosen in code, never a request value. The sewing start endpoint returns 404 for unverified orders, so their existence does not leak.
- **Test safety.** The test setup refuses to run if `TEST_DATABASE_URL` points at the app database. Tests create uniquely named data, because the audit table is append-only.

## 4. Defensive architecture

**State machine.** Allowed transitions: `PENDING_VERIFICATION` to `VERIFIED` or `REJECTED`, `REJECTED` to `PENDING_VERIFICATION` (resubmit), `VERIFIED` to `SEWING_STARTED`. Every other transition fails with 409 because the guarded update matches zero rows. There is no generic "set status" endpoint.

**API guards, in order, on every route:**

1. `requireRole([...])`: 401 when there is no valid session, 403 when the role is wrong.
2. Id parsing: URL ids must be plain positive integers.
3. Zod validation with `.strict()`: unknown keys are rejected with 400.
4. State check inside a transaction: 404 or 409.
5. Business rule: approve returns 422 when any component is RED, missing or uncounted.
6. Atomic guarded update, then the audit row.

**Audit trail.** On approval the server writes the verifier id, timestamp, and wastage % into `verification_logs`. The API has no update or delete path for that table, and a PostgreSQL trigger raises an exception on `UPDATE` and `DELETE`.

**Query isolation.** The sewing queue runs `WHERE status = 'VERIFIED'` at the database level. URL parameters are ignored.

**Automated proof.** ✓ tests/verification.test.ts (24 tests) 110503ms
✓ Test 1: approval of a fully counted order (4)
✓ approves when every component is GREEN 6723ms
✓ allows YELLOW (excess) components 6082ms
✓ returns 409 on a second approval 6978ms
✓ ignores a verifierId sent in the request body 5523ms
✓ Test 2: hard stop on shortage (4)
✓ returns 422 and keeps the order pending when one component is RED 4886ms
✓ returns 422 when a component is uncounted 4227ms
✓ returns 422 when nothing was counted 4219ms
✓ does not trust a tampered status column 4178ms
✓ Test 3: rejection needs a reason (2)
✓ rejects an empty body, a blank reason and a too-short reason 2564ms
✓ rejects the batch when a reason is given 4407ms
✓ Test 4: role enforcement (4)
✓ returns 403 when a non-verifier tries to approve 2153ms
✓ returns 403 when a non-verifier tries to reject or save counts 1823ms
✓ returns 401 when nobody is logged in 1919ms
✓ Input validation (5)
✓ rejects negative, decimal and string counts 2102ms
✓ saves valid counts and computes the status on the server 4598ms
✓ creates an order with server-derived expected counts 4480ms
✓ Test 5: sewing queue isolation (2)
✓ lists only VERIFIED orders and ignores URL parameters 14751ms
✓ Sewing start (3)
✓ starts sewing only for VERIFIED orders 6054ms
✓ answers 404 for unverified orders so their existence is not leaked 6728ms
✓ returns 403 for other roles 2924ms
✓ tests/domain.test.ts (15 tests) 8ms

Test Files 2 passed (2)
Tests 39 passed (39)
Start at 18:22:41
Duration 118.53s (tests 98%, import 1%)
