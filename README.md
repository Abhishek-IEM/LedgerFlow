# LedgerFlow

A full-stack finance dashboard system with a RESTful backend API and a React-based frontend. It handles user management with role-based access control, financial record CRUD operations, and aggregated analytics endpoints. Built with Node.js, TypeScript, Express, PostgreSQL on the backend, and React with Vite on the frontend. Features Google OAuth sign-in, dark mode support, and a responsive UI.

The system supports three user roles — **Viewer**, **Analyst**, and **Admin** — each with clearly scoped permissions enforced at the middleware layer, not scattered across handlers.

## Tech Stack

| Layer       | Choice                      | Reasoning                                                                 |
|-------------|------------------------------|---------------------------------------------------------------------------|
| Language    | Node.js + TypeScript         | Type safety reduces bugs, especially around financial amounts and enums   |
| Framework   | Express.js                   | Minimal and transparent — routing, middleware, and error flow are explicit |
| Database    | PostgreSQL + Prisma ORM      | Relational DB fits financial data well; Prisma provides typed queries     |
| Auth        | JWT (jsonwebtoken + bcryptjs)| Stateless token auth, simple to implement and test                        |
| Validation  | Zod                          | Schema-first validation that integrates cleanly with TypeScript           |
| Docs        | Swagger UI (swagger-jsdoc)   | Reviewers can test every endpoint from a browser without extra tooling    |
| Testing     | Jest + Supertest             | Integration tests covering auth flows, CRUD, and role enforcement         |
| Frontend    | React + Vite + TypeScript    | Fast dev server, type-safe components, Recharts for analytics visuals     |

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL running locally (or a remote connection string)

### Setup

```bash
# 1. Clone and install
git clone <your-repo-url>
cd finance-backend
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set your DATABASE_URL and a strong JWT_SECRET

# 3. Push the schema to your database
npx prisma db push

# 4. Generate the Prisma client
npx prisma generate

# 5. Seed with test data
npm run db:seed

# 6. Start the dev server
npm run dev
```

Open [http://localhost:3000/api/docs](http://localhost:3000/api/docs) for the interactive Swagger UI.
Health check is at [http://localhost:3000/health](http://localhost:3000/health).

### Frontend Setup

```bash
# In a separate terminal
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to use the dashboard UI. The frontend proxies API requests to the backend at port 3000 during development.

## Test Credentials

The seed script creates these accounts for quick testing:

| Name          | Email               | Password    | Role    |
|---------------|---------------------|-------------|---------|
| Admin User    | admin@ledgerflow.com   | admin123    | ADMIN   |
| Analyst User  | analyst@ledgerflow.com | analyst123  | ANALYST |
| Viewer User   | viewer@ledgerflow.com  | viewer123   | VIEWER  |

It also creates 20 sample financial records across multiple categories and the last 6 months, so the dashboard endpoints return meaningful data right away.

## API Reference

| Method | Endpoint                    | Auth Required | Roles            | Description                                |
|--------|-----------------------------|---------------|------------------|--------------------------------------------|
| POST   | `/api/auth/register`        | No            | Public           | Create a new account (defaults to VIEWER)  |
| POST   | `/api/auth/login`           | No            | Public           | Login, returns JWT                         |
| POST   | `/api/auth/google`          | No            | Public           | Sign in with Google OAuth                  |
| GET    | `/api/users`                | Yes           | ADMIN            | List all users                             |
| GET    | `/api/users/:id`            | Yes           | ADMIN            | Get user by ID                             |
| PATCH  | `/api/users/:id/role`       | Yes           | ADMIN            | Update a user's role                       |
| PATCH  | `/api/users/:id/status`     | Yes           | ADMIN            | Activate or deactivate a user              |
| POST   | `/api/records`              | Yes           | ADMIN            | Create a financial record                  |
| GET    | `/api/records`              | Yes           | ALL              | List records (filterable, paginated)       |
| GET    | `/api/records/:id`          | Yes           | ALL              | Get a single record                        |
| PUT    | `/api/records/:id`          | Yes           | ADMIN            | Update a financial record                  |
| DELETE | `/api/records/:id`          | Yes           | ADMIN            | Soft-delete a record                       |
| GET    | `/api/dashboard/summary`    | Yes           | ANALYST, ADMIN   | Total income, expenses, net balance        |
| GET    | `/api/dashboard/categories` | Yes           | ANALYST, ADMIN   | Category-wise income/expense totals        |
| GET    | `/api/dashboard/trends`     | Yes           | ANALYST, ADMIN   | Monthly or weekly trends (?period=weekly)  |
| GET    | `/api/dashboard/recent`     | Yes           | ANALYST, ADMIN   | 10 most recent records                     |
| GET    | `/health`                   | No            | Public           | Health check                               |

**Filtering on `GET /api/records`:** supports `?type=INCOME`, `?category=Salary`, `?from=2025-01-01T00:00:00.000Z&to=2025-12-31T00:00:00.000Z`, `?page=1&limit=20`.

## Role Permission Matrix

| Action                          | VIEWER | ANALYST | ADMIN |
|---------------------------------|--------|---------|-------|
| View financial records          | Yes    | Yes     | Yes   |
| Filter records                  | Yes    | Yes     | Yes   |
| Create / update / delete records| No     | No      | Yes   |
| View dashboard analytics        | No     | Yes     | Yes   |
| Manage users                    | No     | No      | Yes   |

## Design Decisions

**Decimal(12,2) for amounts** — Floating-point numbers cannot represent money accurately. A value like 0.1 + 0.2 produces 0.30000000000000004 in JavaScript. Using PostgreSQL's `Decimal(12,2)` avoids this entirely.

**Soft delete** — Financial records are never hard-deleted. The `isDeleted` flag preserves audit trails. All query logic filters on `isDeleted = false` by default.

**UUID primary keys** — Sequential integer IDs leak information about the number and ordering of records. UUIDs remove that risk.

**Service / controller / route separation** — Controllers handle HTTP concerns (parsing, responding). Services contain business logic. Routes wire them together with middleware. This keeps each layer testable and focused.

**Zod validation** — Input is validated at the boundary before it reaches the service layer. Zod schemas produce TypeScript types automatically, so the validation and the type system stay in sync.

## Assumptions

- New users default to the VIEWER role. Only an ADMIN can promote them to ANALYST or ADMIN.
- Financial records are organisation-level, not per-user. Any authenticated user can view all records, but only ADMIN can create, update, or delete them.
- JWT tokens expire after 7 days. In a production system this would be shorter, paired with refresh token rotation.
- The trends endpoint uses calendar months by default, not rolling 30-day windows.
- The seed script creates known credentials so reviewers can test the API immediately without registering.

## Known Limitations / Future Improvements

Given more time, I would add:

- **Refresh token rotation** — Short-lived access tokens with a refresh flow for better security.
- **Audit log table** — Track every record modification with who changed what and when.
- **Cursor-based pagination** — More efficient for large datasets than offset-based pagination.
- **Rate limiting** — Per-user or per-IP request throttling.
- **Role-scoped record visibility** — Department or team-level scoping for multi-tenant use cases.
- **Docker Compose setup** — One-command local development with PostgreSQL included.

## Running Tests

```bash
npm test
```

Tests cover authentication flows (register, login, duplicate rejection), record CRUD with role enforcement (VIEWER cannot create, ADMIN can), and dashboard analytics (summary math, category breakdown, role restrictions).

## Project Structure

```
├── src/                # Backend source code
│   ├── config/         # Prisma client singleton
│   ├── middleware/      # Auth guard, role guard, centralised error handler
│   ├── modules/
│   │   ├── auth/       # Registration, login, JWT generation
│   │   ├── users/      # User CRUD and role/status management (ADMIN only)
│   │   ├── records/    # Financial record CRUD with filtering and pagination
│   │   └── dashboard/  # Summary analytics, category breakdown, trends
│   ├── types/          # Express type extensions
│   ├── utils/          # AppError, response helpers, pagination
│   ├── app.ts          # Express app setup, middleware, route mounting
│   └── server.ts       # HTTP server entry point
├── frontend/           # React frontend
│   └── src/
│       ├── components/ # Layout, ProtectedRoute
│       ├── context/    # AuthContext (JWT state management)
│       ├── pages/      # Dashboard, Records, UsersPage, Login, Register
│       └── services/   # Axios API client
├── prisma/             # Database schema and seed script
└── tests/              # Jest + Supertest integration tests
```
