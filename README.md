# ApparelFlow ERP: Cutting Gatekeeper Verification Terminal

Practical challenge for the Webtezza (Pvt) Ltd Software Engineering Intern position.
This app implements one mission-critical checkpoint of a garment ERP: **no unverified, mismatched or shortage cutting batch can ever reach the sewing queue.** The rule is enforced on the server, not only in the UI.

- **Live URL:** [https://apparelflow-xi.vercel.app/](https://apparelflow-xi.vercel.app/)
- **Repository:** [https://github.com/JayaniPerera27/apparelflow](https://github.com/JayaniPerera27/apparelflow)
- **AI usage report:** [AI_OPTIMIZATION_REPORT.md](./AI_OPTIMIZATION_REPORT.md)

## Demo credentials

Password for all three accounts: `Demo@1234`

| Role               | Email                         | What this role can do                                            |
| ------------------ | ----------------------------- | ---------------------------------------------------------------- |
| Cutting Supervisor | `supervisor@apparelflow.test` | Create cutting orders, view own orders, resubmit rejected orders |
| Cutting Verifier   | `verifier@apparelflow.test`   | Count components, approve or reject batches                      |
| Sewing Supervisor  | `sewing@apparelflow.test`     | See verified batches only, start sewing                          |

The login page has a one-click demo panel for all three roles.

## Tech stack

Next.js 16 (App Router) + React + TypeScript + Tailwind CSS, Prisma 7 with a Neon PostgreSQL database, JWT sessions in an httpOnly cookie (`jose`), `bcryptjs`, Zod validation, Vitest, deployed on Vercel.

## State machine

```
PENDING_VERIFICATION --approve (verifier, no RED/uncounted)--> VERIFIED --start (sewing)--> SEWING_STARTED
PENDING_VERIFICATION --reject (verifier, reason required)----> REJECTED --resubmit (supervisor)--> PENDING_VERIFICATION
```

| Transition                       | Who                | Endpoint                        | Rule                                                  |
| -------------------------------- | ------------------ | ------------------------------- | ----------------------------------------------------- |
| (new) to PENDING_VERIFICATION    | cutting_supervisor | `POST /api/orders`              | Zod validation, expected counts derived on the server |
| PENDING_VERIFICATION to VERIFIED | cutting_verifier   | `POST /api/verify/:id/approve`  | 422 if any component is RED, missing or uncounted     |
| PENDING_VERIFICATION to REJECTED | cutting_verifier   | `POST /api/verify/:id/reject`   | Reason of at least 5 characters                       |
| REJECTED to PENDING_VERIFICATION | cutting_supervisor | `POST /api/orders/:id/resubmit` | Counts reset, audit logs kept                         |
| VERIFIED to SEWING_STARTED       | sewing_supervisor  | `POST /api/sewing/:id/start`    | Only VERIFIED orders                                  |

Every transition uses an atomic `UPDATE ... WHERE status = <expected>` inside a transaction, so two requests cannot both win.

## Traffic-light rules

| Status | Condition          | Effect                                                |
| ------ | ------------------ | ----------------------------------------------------- |
| GREEN  | actual == expected | Counts as verified                                    |
| YELLOW | actual > expected  | Surplus recorded, batch may proceed                   |
| RED    | actual < expected  | Approve is disabled in the UI and rejected by the API |

Fabric wastage % = `((actual fabric - expected fabric) / expected fabric) x 100`, where expected fabric = `target qty x std fabric yards`. It is computed on the server and stored in `verification_logs`.

## API

| Method and path                 | Role               | Success      | Errors                 |
| ------------------------------- | ------------------ | ------------ | ---------------------- |
| `POST /api/auth/login`          | public             | 200 + cookie | 400, 401               |
| `POST /api/auth/logout`         | any                | 200          |                        |
| `GET /api/auth/me`              | any                | 200          | 401                    |
| `GET /api/recipes`              | cutting_supervisor | 200          | 401, 403               |
| `GET, POST /api/orders`         | cutting_supervisor | 200, 201     | 400, 401, 403, 404     |
| `POST /api/orders/:id/resubmit` | cutting_supervisor | 200          | 400, 403, 404, 409     |
| `GET /api/verify/pending`       | cutting_verifier   | 200          | 401, 403               |
| `POST /api/verify/:id/count`    | cutting_verifier   | 200          | 400, 403, 404, 409     |
| `POST /api/verify/:id/approve`  | cutting_verifier   | 200          | 403, 404, 409, **422** |
| `POST /api/verify/:id/reject`   | cutting_verifier   | 200          | 400, 403, 404, 409     |
| `GET /api/sewing/queue`         | sewing_supervisor  | 200          | 401, 403               |
| `POST /api/sewing/:id/start`    | sewing_supervisor  | 200          | 403, 404, 409          |
| `GET /api/health`               | public             | 200          |                        |

## Security design

- **Server-side RBAC:** every route calls `requireRole([...])` first. Not logged in gives 401, wrong role gives 403.
- **Hard stop:** approve re-reads the counts from the database and recomputes the status from the numbers. It does not trust the stored status column or the request body.
- **Identity from the session:** the verifier id comes from the JWT. The timestamp comes from the database. The approve request body is ignored.
- **Query isolation:** the sewing queue query is `WHERE status = 'VERIFIED'`, and the status is a typed argument chosen in code. URL parameters cannot change it. The sewing start endpoint answers 404 for orders that are not verified, so their existence is not leaked.
- **Strict input validation:** Zod schemas use `.strict()`, so unknown keys such as `status` or `createdBy` are rejected. Numbers are not coerced from strings.
- **Immutable audit trail:** there is no update or delete API for `verification_logs`, and a PostgreSQL trigger blocks `UPDATE` and `DELETE` on that table.

## Database schema

Six tables, defined in `prisma/schema.prisma`.

| Table                | Key columns                                                                                                           | Relations                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `users`              | id, email (unique), password_hash, role, full_name, created_at                                                        | has many orders and logs       |
| `recipes`            | id, recipe_code (unique), name, category, std_fabric_yards, wastage_cap                                               | has many components and orders |
| `recipe_components`  | id, recipe_id, component_name, pieces_per_garment, image_url                                                          | belongs to recipe              |
| `cutting_orders`     | id, order_no (unique), recipe_id, target_qty, fabric_roll_id, actual_fabric_yds, status, created_by, timestamps       | belongs to recipe and user     |
| `verification_items` | id, order_id, component_id, expected_qty, actual_qty (null = not counted), status. Unique on (order_id, component_id) | belongs to order and component |
| `verification_logs`  | id, order_id, verifier_id, decision, rejection_note, wastage_pct, timestamp. Append-only                              | belongs to order and verifier  |

Seeded recipes: `REC-BL01` Casual Blouse and `REC-CT02` Crop Top, with the components from the brief.

## Run locally

```bash
npm install
```

Create `.env` (never commit it):

```
DATABASE_URL="<Neon pooled connection string>"
DIRECT_URL="<Neon direct connection string>"
TEST_DATABASE_URL="<Neon direct connection string of a separate test branch>"
JWT_SECRET="<long random string>"
```

```bash
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open http://localhost:3000.

## Tests

Tests call the real route handlers against a separate Neon test branch. The test setup refuses to run if `TEST_DATABASE_URL` points at the app database.

```bash
# one time: apply migrations to the test branch (set DIRECT_URL to the test branch string first)
npx prisma migrate deploy

npm test
```

Covered: all-GREEN approval, RED shortage blocked with 422, uncounted component blocked, reject without a note, non-verifier roles get 403, unauthenticated gets 401, request body cannot spoof the verifier, double approval gets 409, sewing queue never lists unapproved orders, plus unit tests for the traffic-light and wastage rules.

`verification_logs` is append-only, so tests do not delete data. They create uniquely named orders instead.

## Project structure

```
app/            pages and API route handlers
components/     shared UI (modals, traffic light, status badge)
lib/            auth, rbac, domain rules, schemas, queries
prisma/         schema, migrations, seed
tests/          Vitest unit and integration tests
```
