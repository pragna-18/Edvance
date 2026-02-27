## PrepSmart-C — Technology Stack

This document summarizes the main technologies used in the PrepSmart-C project, why they were chosen, and brief alternatives / trade-offs for each choice.

---

## High-level architecture

- Frontend: Single Page Application (React) built with Vite, styled with Tailwind CSS. Uses Socket.IO client for realtime collaboration and axios for HTTP requests.
- Backend: Node.js + Express (ESM) serving REST endpoints and Socket.IO for realtime features. Uses Prisma ORM to access a PostgreSQL database.
- AI: Server-side integration with Google Gemini (via the server-side client) to generate lesson plans, quizzes, and other educational content.
- Exports & Utilities: Puppeteer (headless Chrome) for HTML→PDF, and pptxgenjs for PowerPoint generation.
- Dev / Deployment: Docker and docker-compose for containerized deployment; client is served behind nginx in production build.

---

## Client-side

- Core: React (via Vite)
  - Why: React is a mature, component-based UI library with large ecosystem and good fit for interactive, stateful UIs (lesson editor, dashboards, assistant chat). Vite provides fast dev server and quick builds.
  - Alternatives considered: Vue or Angular. Vue is lighter for some teams but the codebase already uses React patterns and many team members/tools integrate with React. Angular is more opinionated and heavier.

- Build: Vite
  - Why: Extremely fast dev server and build times compared to older tooling (CRA / webpack). Simpler configuration for modern apps.
  - Alternatives: Create React App (slower builds), Next.js (more full-stack SSR — not necessary here as app is SPA with an API backend).

- Styling: Tailwind CSS
  - Why: Utility-first CSS for rapid UI development and consistent styles without large custom CSS code. Good fit for a design-system-driven dashboard.
  - Alternatives: Styled-components, plain CSS Modules, Bootstrap. Tailwind is chosen for speed and design consistency.

- Realtime: socket.io-client
  - Why: Provides reliable real-time messaging, room management, and fallbacks for different environments. Integrates directly with the server-side Socket.IO.
  - Alternatives: plain WebSocket, Pusher, Ably. Plain WebSocket is lower-level and would need more plumbing (presence, reconnect, rooms); Pusher/Ably are hosted services (cost & vendor lock-in).

- HTTP: axios
  - Why: Widely-used, promise-based HTTP client, easy to configure with interceptors for auth headers.

  

---

## Server-side

- Runtime & Framework: Node.js + Express (ESM)
  - Why: Lightweight, unopinionated, and well-known stack for building REST APIs. Many NPM packages and middleware simplify common needs (auth, CORS, helmet, etc.).
  - Alternatives: NestJS (more structure, DI and decorators), Fastify (faster), or other languages (Go, Python). Express keeps implementation straightforward and familiar.

- Realtime: Socket.IO (server)
  - Why: Easy to wire into Express and manage rooms/presence and fallbacks. Fits the collaboration features (live editing, comments, presence updates).

- ORM / Database Client: Prisma
  - Why: Type-safe database access, a pleasant developer experience, and first-class support for PostgreSQL. Prisma migrations simplify schema evolution and the generated types reduce runtime errors.
  - Alternatives: Sequelize, TypeORM, Knex. Prisma is chosen for developer ergonomics and type-safety advantages.

- Database: PostgreSQL
  - Why: Relational data with strong consistency is a good fit for lesson plans, versioning, approvals, and relational queries. PostgreSQL offers robust features and good performance.
  - Alternatives: MySQL (similar tradeoffs), MongoDB (document DB—not ideal for relational versioned data and transactions). PostgreSQL chosen for maturity and features (JSONB, indexing, constraints).

- Authentication: JWT + bcrypt for password hashing
  - Why: JWTs are stateless and simple to verify in HTTP and Socket.IO handshakes. bcrypt is standard for secure password hashing.
  - Alternatives: Sessions (server-side session store). Sessions work fine but add stateful server-side infrastructure; JWTs suit the decoupled frontend + API design.

---

## AI / LLM Integration

- Provider: Google Gemini (server-side integration)
  - Why: Chosen in this codebase for advanced generation capabilities. Using the model from the server provides centralized control of prompts, response parsing, and rate-limiting.
  - Alternatives: OpenAI (GPT family), Anthropic, local LLMs (Llama-family). Each alternative has trade-offs around cost, latency, API shape, and features. Server-side integration keeps keys out of the browser and allows for safe prompt engineering.

Notes: The code currently expects `GEMINI_API_KEY` (or similar). Avoid hardcoding API keys in code and prefer secrets in environment variables or secret stores.

---

## Export / File Generation

- PDF generation: Puppeteer (headless Chromium)
  - Why: Allows generating PDFs from styled HTML that matches the frontend UI. Good fidelity for rich exports.
  - Alternatives: wkhtmltopdf, headless Chromium wrappers, server-side libraries that render PDFs from templates. Puppeteer provides full browser rendering and JS execution.

- PPTX generation: pptxgenjs
  - Why: Directly generate .pptx files programmatically on the server.

---

## Dev / Ops

- Containerization: Docker (+ docker-compose)
  - Why: Reproducible environment and simplified deployment across machines/services. Useful for bundling Puppeteer dependencies in the server container.

- Reverse proxy / static serving: nginx (client Dockerfile)
  - Why: Lightweight static serving and reverse-proxying to the API path in production.

---

## Observed / Recommended Security & Operational Notes

- Environment variables required (examples seen in code):
  - `DATABASE_URL` — PostgreSQL connection
  - `JWT_SECRET` — secret used to sign tokens (must be strong)
  - `GEMINI_API_KEY` (or named variant) — AI provider API key

- Recommendations:
  - Remove any hard-coded API keys or default JWT secrets. Fail fast if secrets are missing.
  - Validate JWTs during Socket.IO handshake and do not trust client-sent user fields for authorization.
  - Add strict schema validation (e.g., Zod or Joi) for AI outputs and API inputs to avoid brittle parsing.
  - For Puppeteer in Docker, ensure the image includes required system dependencies (or use an official playwright/pwservice base image).

---

## Why this stack (summary)

- Developer productivity: React + Vite + Tailwind + Prisma greatly reduce iteration time for frontend and backend changes.
- Type-safety and ergonomics: Prisma provides typed database access; modern JS tooling (ESM + Vite) improves developer DX.
- Realtime collaboration: Socket.IO is the pragmatic choice for presence, rooms, and reconnect logic without introducing extra services.
- AI integration: Server-side LLM calls centralize prompt control, safety filters, and billing.

This combination produces a fast developer loop, a flexible API-first backend, and a capable frontend that supports real-time collaboration and rich exports.

---

## Next steps & improvements (low-effort wins)

- Move secrets into environment variables or a secrets manager and remove any hard-coded fallbacks.
- Add unit/integration tests around AI-response parsing and Socket.IO auth.
- Add a short README entry describing required environment variables and how to run locally (if not already present).

---

File created by project automation — update as architecture changes.