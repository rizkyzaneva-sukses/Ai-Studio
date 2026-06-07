# Zaneva AI Content Studio

A web application for managing multiple ChatGPT Plus and Google AI Pro (Gemini) accounts to automate marketing content creation for **Zaneva** — a Muslimah sportswear brand.

## Features

- **Account Management** — Add and manage multiple ChatGPT and Gemini accounts with encrypted session cookies, quota tracking, and status monitoring
- **Smart Account Rotation** — Automatically selects accounts using an "exhaust first" strategy (highest usage first, then switch)
- **Project Management** — Create reusable projects with descriptions, brand notes, and reference images
- **AI Content Generation** — Generate storyboards (via ChatGPT/DALL-E) and short videos (via Gemini) with built-in prompt templates
- **Monitoring Dashboard** — Real-time quota usage, generation pipeline status, and account health overview
- **Generation History** — Searchable logs with filters by type, status, and full prompt details
- **File Management** — Local filesystem storage for uploaded reference images and generated content

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Styling | Tailwind CSS 4 |
| UI Components | Custom (shadcn/ui-style) |
| Package Manager | pnpm |
| Deployment | Docker + EasyPanel |

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── accounts/page.tsx     # Account management
│   ├── projects/page.tsx     # Project management
│   ├── generate/page.tsx     # Content generation
│   ├── monitoring/page.tsx   # Quota & health monitoring
│   ├── history/page.tsx      # Generation logs
│   └── api/
│       ├── accounts/         # Account CRUD API
│       ├── projects/         # Project CRUD API
│       ├── generations/      # Generation API with rotation
│       └── uploads/          # File serving API
├── components/
│   ├── sidebar.tsx           # Navigation sidebar
│   └── ui/                   # Reusable UI components
├── lib/
│   ├── db.ts                 # Prisma client singleton
│   ├── utils.ts              # Utility functions
│   ├── encryption.ts         # AES-256-CBC encryption
│   └── automation.ts         # Playwright automation (mocked)
prisma/
├── schema.prisma             # Database schema
docker-compose.yml            # Docker Compose setup
Dockerfile                    # Multi-stage Docker build
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- PostgreSQL 16+ (or use Docker)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Copy `.env` and customize as needed:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_studio"

# Encryption key for session cookies (64 hex chars = 32 bytes)
ENCRYPTION_KEY="a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"

# File upload directory
UPLOAD_DIR="./uploads"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Start PostgreSQL

Using Docker:

```bash
docker compose up db -d
```

Or connect to an existing PostgreSQL instance.

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

### 5. Start Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Docker Deployment

### Build and Run with Docker Compose

```bash
docker compose up --build -d
```

This starts:
- **PostgreSQL** on port 5432
- **Next.js App** on port 3000

### EasyPanel Deployment

1. Push your code to a Git repository
2. In EasyPanel, create a new service from the repository
3. Set environment variables:
   - `DATABASE_URL` — Your PostgreSQL connection string
   - `ENCRYPTION_KEY` — A secure 64-character hex string
4. EasyPanel will automatically build using the Dockerfile

## API Reference

### Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts` | List all accounts (cookies excluded) |
| POST | `/api/accounts` | Create new account |
| GET | `/api/accounts/:id` | Get account details |
| PUT | `/api/accounts/:id` | Update account |
| DELETE | `/api/accounts/:id` | Delete account |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects with images |
| POST | `/api/projects` | Create project (FormData with images) |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

### Generations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/generations` | List generations (filterable) |
| POST | `/api/generations` | Create generation job |

Query params for GET: `projectId`, `type`, `status`, `limit`

### File Serving

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/uploads/*` | Serve uploaded/generated files |

## Account Rotation Logic

The system uses an **"exhaust first"** rotation strategy:

1. Find active accounts of the required type (ChatGPT for storyboards, Gemini for videos)
2. Sort by usage count **descending** (highest usage first)
3. Select the account with the highest usage that hasn't exceeded its limit
4. This ensures each account is used to its maximum before switching to the next

## Automation Layer

The `src/lib/automation.ts` module provides a **mocked** Playwright automation interface. In production:

1. Install Playwright: `pnpm add playwright`
2. Install browsers: `npx playwright install chromium`
3. Replace mock implementations with actual browser automation
4. The code includes detailed comments showing the production implementation pattern

## Security

- Session cookies are encrypted with **AES-256-CBC** before storage
- Cookies are **never exposed** in API responses
- File serving includes **directory traversal protection**
- Environment variables for sensitive configuration

## License

Private — Zaneva Brand Internal Tool
