### Microservice Task App

A Dockerized microservices-based task management system built with Node.js + Express + TypeScript.
Each service runs in its own container and communicates over HTTP through an API Gateway.
Postgres and Redis provide persistence and caching/infra, and RabbitMQ carries asynchronous
domain events between services.

#### Architecture

```
client ──▶ api-gateway (:5000)
                │
                ├──▶ user-service         (:5001)  ── Postgres
                ├──▶ task-service         (:5002)  ── Postgres
                └──▶ notification-service (:5003)  ── Postgres
                          ▲                             ▲
                          │                             │ (consumes domain events)
        postgres (:5432)  redis (:6379)          rabbitmq (:5672, UI :15672)
```

Services communicate **synchronously** over HTTP (through the gateway) and
**asynchronously** through a RabbitMQ topic exchange (`task_app.events`):

```
user-service  --user.registered------------------> ┐
task-service  --task.created / task.updated / --──►├─▶ task_app.events ──▶ notification-service
               task.deleted ----------------------► ┘      (auto-creates notifications)
```

#### Services

| Service              | Port | Responsibility                          | Datastore | Broker role      |
| -------------------- | ---- | --------------------------------------- | --------- | ---------------- |
| api-gateway          | 5000 | Reverse proxy, rate limiting, auth      | Redis     | —                |
| user-service         | 5001 | Users, JWT auth (access/refresh), RBAC  | Postgres  | publisher        |
| task-service         | 5002 | Task CRUD (per-user, admin sees all)    | Postgres  | publisher        |
| notification-service | 5003 | Notifications (per-user)                | Postgres  | consumer         |

#### Project Structure

```
microservice-task-app/
├── docker-compose.yml          # postgres, redis, rabbitmq + all services
├── .env / .env.example         # compose + shared variables
├── api-gateway/                # reverse proxy
├── user-service/               # auth & users (Postgres) — publishes user events
├── task-service/               # tasks (Postgres) — publishes task events
└── notification-service/       # notifications (Postgres) — consumes events

# each service follows the same layout:
#   src/
#     config/         # env, db connection, logger, rabbitmq
#     controllers/    # request handlers
#     events/         # event publishers / consumers + event types
#     middlewares/    # auth, error handler, not found
#     models/         # data models / interfaces
#     routes/         # express routers
#     services/       # business logic
#     types/          # shared types
#     utils/          # ApiError, ApiResponse, catchAsync
#     app.ts          # express app
#     server.ts       # bootstrap + graceful shutdown
#   Dockerfile
#   package.json
#   tsconfig.json
#   .env.example
```

#### Getting Started

1. Copy the env template and adjust values:

   ```bash
   cp .env.example .env
   ```

   For **user-service** set `DATABASE_URL` to your Postgres connection string (or a reachable Postgres instance).

2. Build and start the full stack:

   ```bash
   docker-compose down
   docker-compose up --build -d
   ```

3. Check running containers:

   ```bash
   docker ps
   ```

4. View logs:

   ```bash
   docker logs api-gateway
   docker logs task-service
   ```

#### Local Development (without Docker)

Each service can run on its own:

```bash
cd task-service
cp .env.example .env      # point DATABASE_URL/REDIS_URL/RABBITMQ_URL at localhost
npm install
npm run dev
```

Then start the infrastructure (Postgres, Redis and RabbitMQ) only:

```bash
docker-compose up -d postgres redis rabbitmq
```

> All services must share the same `JWT_ACCESS_SECRET` so tokens issued by
> `user-service` can be verified by `task-service` and `notification-service`.

#### Event-Driven Communication (RabbitMQ)

Domain events flow through a durable **topic exchange** named `task_app.events`.
Publishers just emit an event; consumers subscribe with routing-key bindings.

- RabbitMQ management UI: http://localhost:15672 (default `guest` / `guest`).

| Publisher      | Routing key                                        | Consumer               | Result                                   |
| -------------- | -------------------------------------------------- | ---------------------- | ---------------------------------------- |
| user-service   | `user.registered`                                  | notification-service   | welcome notification created             |
| task-service   | `task.created`                                     | notification-service   | "New task created" notification          |
| task-service   | `task.updated`                                     | notification-service   | "Task updated (status: …)" notification  |
| task-service   | `task.deleted`                                     | notification-service   | "Task deleted" notification              |

Every message uses a shared envelope:

```json
{
  "event": "task.created",
  "service": "task-service",
  "occurredAt": "2026-11-07T10:00:00.000Z",
  "data": { "id": 1, "title": "Write README", "status": "pending", "user_id": "1" }
}
```

Implementation notes:

- Each service connects through `RABBITMQ_URL` (default `amqp://guest:guest@localhost:5672`).
- Publishers reconnect automatically and degrade gracefully — if the broker is
  down, the HTTP API keeps working and events are logged as dropped until reconnect.
- `notification-service` declares a durable queue (`notification-service.events`)
  bound to the routing keys above, acks successful handling, and drops poisoned
  messages to avoid infinite requeues.

#### Seeding & Admin Bootstrap

Seed scripts live in `user-service` (all services share the same Postgres database).
Set the admin credentials in `user-service/.env`:

```
ADMIN_NAME=Super Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@12345
```

Then run:

```bash
cd user-service
npm run create-admin   # create/promote the admin using the ADMIN_* env vars
npm run seed           # seed the admin + demo users, tasks and notifications
```

- `create-admin` inserts the admin from env data, or promotes/updates the existing
  account with that email (safe to re-run).
- `seed` seeds the admin, two demo users (`alice@example.com`, `bob@example.com`,
  password `Passw0rd!`), plus sample tasks and notifications.
- Both scripts are idempotent — re-running them will not create duplicates.

#### Health Checks

| Service              | URL                                              |
| -------------------- | ------------------------------------------------ |
| api-gateway          | http://localhost:5000/health                     |
| user-service         | http://localhost:5001/api/health                 |
| task-service         | http://localhost:5002/api/health                 |
| notification-service | http://localhost:5003/api/health                 |

---

### Authentication

- `POST /api/auth/login` returns an **access token** (JWT, 15m) in the response body
  and sets a **refresh token** as an `httpOnly` cookie (7d).
- Send the access token on protected routes as a Bearer header:

  ```
  Authorization: Bearer <accessToken>
  ```

- The access token payload embeds the user identity and role so downstream services
  can authorize without calling `user-service`:

  ```json
  { "userId": "1", "role": "admin", "iat": 1700000000, "exp": 1700000900 }
  ```

- Roles: `user` (default) and `admin`. Admins can list/update/delete any user and
  see every task; regular users are scoped to their own resources.

#### Response Envelope

All JSON responses share the same shape:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Tasks fetched successfully",
  "data": {}
}
```

Errors return `success: false` plus an HTTP status code and message.

---

### API Reference

All routes below are shown through the gateway (`http://localhost:5000`).

Auth legend: **—** public · **user** authenticated · **admin** admin only.

#### Auth — `/api/auth`

| Method | Path       | Auth | Body                        | Description                          |
| ------ | ---------- | ---- | --------------------------- | ------------------------------------ |
| POST   | `/register`| —    | `{ name, email, password, image? }` | Create a new account (role `user`)   |
| POST   | `/login`   | —    | `{ email, password }`       | Login; returns access token + cookie |
| POST   | `/refresh` | —    | *(refresh cookie)* or `{ token }` | Issue a new access token         |
| POST   | `/logout`  | —    | *(refresh cookie)* or `{ token }` | Revoke the refresh token         |

**POST /api/auth/register** → `201`

```json
{ "name": "Alice Carter", "email": "alice@example.com", "password": "Passw0rd!" }
```

**POST /api/auth/login** → `200`

```json
{ "email": "alice@example.com", "password": "Passw0rd!" }
```

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": { "id": 1, "name": "Alice Carter", "email": "alice@example.com", "role": "user", "image": null },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Users — `/api/users`

| Method | Path          | Auth  | Body                              | Description                       |
| ------ | ------------- | ----- | --------------------------------- | --------------------------------- |
| GET    | `/me`         | user  | —                                 | Get current profile               |
| PATCH  | `/me`         | user  | `{ name?, image? }`               | Update current profile            |
| PUT    | `/me/password`| user  | `{ currentPassword, newPassword }`| Change password (min 6 chars)     |
| GET    | `/`           | admin | `?page&limit`                     | Paginated list of all users       |
| GET    | `/:id`        | admin | —                                 | Get one user                      |
| PATCH  | `/:id`        | admin | `{ name?, image?, role? }`        | Update a user (incl. role)        |
| DELETE | `/:id`        | admin | —                                 | Delete a user                     |

**PATCH /api/users/me**

```json
{ "name": "Alice C.", "image": "https://example.com/avatar.png" }
```

**PUT /api/users/me/password**

```json
{ "currentPassword": "Passw0rd!", "newPassword": "N3wPassw0rd!" }
```

**PATCH /api/users/:id** (admin)

```json
{ "role": "admin" }
```

#### Tasks — `/api/tasks` (all require auth)

| Method | Path   | Body                              | Description                                    |
| ------ | ------ | --------------------------------- | ---------------------------------------------- |
| GET    | `/`    | `?page&limit&status`              | List tasks (own tasks, or all if admin)        |
| POST   | `/`    | `{ title, description?, status? }`| Create a task                                  |
| GET    | `/:id` | —                                 | Get one task (404 if not yours and not admin)  |
| PATCH  | `/:id` | `{ title?, description?, status? }`| Update a task                                 |
| DELETE | `/:id` | —                                 | Delete a task                                  |

- `status` ∈ `pending` \| `in_progress` \| `done` (defaults to `pending`).
- `title` is required and non-empty.

**POST /api/tasks**

```json
{ "title": "Write project README", "description": "Document all APIs", "status": "in_progress" }
```

**GET /api/tasks?page=1&limit=10&status=pending** → `200`

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Tasks fetched successfully",
  "data": {
    "tasks": [
      {
        "id": 1,
        "title": "Write project README",
        "description": "Document all APIs",
        "status": "in_progress",
        "user_id": "1",
        "created_at": "2026-11-06T08:00:00.000Z",
        "updated_at": "2026-11-06T08:00:00.000Z"
      }
    ],
    "meta": { "page": 1, "limit": 10, "total": 1 }
  }
}
```

#### Notifications — `/api/notifications` (all require auth)

| Method | Path        | Body                    | Description                                    |
| ------ | ----------- | ----------------------- | ---------------------------------------------- |
| GET    | `/`         | `?page&limit&unread`    | List your notifications (`unread=true` filter) |
| POST   | `/`         | `{ message, userId? }`  | Create a notification                          |
| PATCH  | `/read-all` | —                       | Mark all your notifications as read            |
| PATCH  | `/:id/read` | —                       | Mark one notification as read                  |
| DELETE | `/:id`      | —                       | Delete one of your notifications               |

- `message` is required and non-empty.
- `userId` defaults to yourself. Only `admin` may target another user (others → `403`).

**POST /api/notifications**

```json
{ "message": "Your task was assigned" }
```

**POST /api/notifications** (admin → another user)

```json
{ "message": "Admin notice for Bob", "userId": "2" }
```

---

### Sample / Dummy Data

Use these credentials to explore the API. Register the users first (register always
creates role `user`); promote a user to `admin` with `PATCH /api/users/:id` (as an admin)
or directly in Postgres:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

**Users**

| Name         | Email              | Password     | Role  |
| ------------ | ------------------ | ------------ | ----- |
| Admin User   | admin@example.com  | Passw0rd!    | admin |
| Alice Carter | alice@example.com  | Passw0rd!    | user  |
| Bob Nguyen   | bob@example.com    | Passw0rd!    | user  |

**Tasks** (owner = Alice)

| title                    | description              | status      |
| ------------------------ | ------------------------ | ----------- |
| Write project README     | Document all APIs        | in_progress |
| Set up CI pipeline       | GitHub Actions           | pending     |
| Fix login refresh bug    | Read cookie for token    | done        |

**Notifications** (owner = Bob)

| message                        | is_read |
| ------------------------------ | ------- |
| Welcome to notifications       | false   |
| Your task was assigned         | false   |
| Password changed successfully  | true    |

#### End-to-end example (curl)

```bash
BASE=http://localhost:5000/api

# 1) Register + login
curl -s -X POST $BASE/auth/register -H 'Content-Type: application/json' \
  -d '{"name":"Alice Carter","email":"alice@example.com","password":"Passw0rd!"}'

TOKEN=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"Passw0rd!"}' | jq -r '.data.accessToken')

# 2) Profile
curl -s $BASE/users/me -H "Authorization: Bearer $TOKEN"

# 3) Create / list tasks
curl -s -X POST $BASE/tasks -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Write project README","description":"Document all APIs","status":"in_progress"}'

curl -s "$BASE/tasks?page=1&limit=10" -H "Authorization: Bearer $TOKEN"

# 4) Notifications
curl -s -X POST $BASE/notifications -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"message":"Welcome to notifications"}'

curl -s "$BASE/notifications?unread=true" -H "Authorization: Bearer $TOKEN"
curl -s -X PATCH $BASE/notifications/read-all -H "Authorization: Bearer $TOKEN"
```

For cookie-based refresh, persist the login cookie and call refresh without a body:

```bash
curl -s -c cookies.txt -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"Passw0rd!"}'

curl -s -b cookies.txt -X POST $BASE/auth/refresh
```

---

#### Features

- Microservice architecture with an API Gateway
- Centralized reverse proxy (`http-proxy-middleware`)
- Authentication with JWT (access + refresh) and role-based access control
- Per-user data scoping with admin override for tasks
- Event-driven communication over RabbitMQ (topic exchange + durable queues)
- Relational persistence with Postgres for all services
- Caching and rate-limiting via Redis
- Dockerized for easy development and deployment
- Environment-based configuration using `.env` files

#### Tech Stack

- **Node.js** + **Express** + **TypeScript**
- **Docker** + **Docker Compose**
- **Postgres** – persistence for all services
- **Redis** – caching, rate-limiting
- **RabbitMQ** + **amqplib** – asynchronous domain events
- **JWT** – authentication
- **http-proxy-middleware** – API Gateway
- **dotenv** – environment configuration
