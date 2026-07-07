# Engineering Project Foundation & Workspace Specifications
## JCCAD Company Intelligence Platform (CIP)

**Prepared by the Principal Software Engineer**

| Version | Date | Status | Target Audience |
| :--- | :--- | :--- | :--- |
| v1.0.0 | 2026-06-30 | Released | Lead Developers, DevOps Engineers, SDETs, System Architects |

---

## SECTION 1: Monorepo Architecture & Folder Structure

CIP is initialized as a **stateless TypeScript monorepo** utilizing npm workspaces.

### Repository Layout

```
jccad-cip/
├── .github/                   # CI/CD Workflows, PR Templates
├── client/                    # Frontend React SPA
│   ├── src/
│   │   ├── assets/            # Fonts, branding vector graphics
│   │   ├── components/        # Atom & Molecule design system elements
│   │   ├── features/          # Decoupled functional modules (Chat, Ingest)
│   │   ├── hooks/             # Shared state custom hooks
│   │   ├── layouts/           # Page grid layout viewframes
│   │   ├── pages/             # Lazy-loaded route views
│   │   ├── services/          # REST/SSE api clients (Axios, EventSource)
│   │   └── types/             # TypeScript mappings
│   ├── tailwind.config.js     # Tailwind design system variables
│   ├── vite.config.ts         # Vite build configuration (Aliases, Proxy)
│   └── tsconfig.json          # Frontend TS Compiler configurations
├── server/                    # Backend Express API Server
│   ├── src/
│   │   ├── config/            # Database, Redis, and API configurations
│   │   ├── controllers/       # HTTP route handler entry points
│   │   ├── middleware/        # JWT validators, RBAC maps, rate limits
│   │   ├── models/            # MongoDB Mongoose schemas
│   │   ├── queues/            # BullMQ Redis workers (Crawler, Ingester)
│   │   ├── repositories/      # Database Atlas Vector query services
│   │   ├── services/          # Grounded dynamic prompt generators
│   │   └── index.ts           # App startup and server listener script
│   ├── Dockerfile             # Production multi-stage Docker build
│   └── tsconfig.json          # Backend TS compiler configuration
├── shared/                    # Common typescript interfaces & types
├── docker-compose.yml         # Local development orchestration (Redis, MinIO)
└── package.json               # Root monorepo workspace dependencies
```

---

## SECTION 2: Dependency Selection & Justifications

### Monorepo Workspaces Package Configuration (`package.json`)
```json
{
  "name": "jccad-cip-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "client",
    "server",
    "shared"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev --w client\" \"npm run dev --w server\"",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "typescript": "^5.3.3"
  }
}
```

### Core Frontend Stack (`client/package.json` dependencies)
* **React & Vite:** Core render framework and build utility.
* **Tailwind CSS:** Design system utility classes.
* **React Router:** Declarative page routing.
* **Zustand:** Client state management.
* **TanStack Query (React Query):** Server state caching.
* **React Hook Form & Zod:** Type-safe form validation.
* **Framer Motion:** Micro-interactions and animations.

### Core Backend Stack (`server/package.json` dependencies)
* **Express.js:** Server engine.
* **Mongoose:** Object Document Mapper (ODM) for MongoDB Atlas.
* **BullMQ & Redis:** Background task queuing.
* **jsonwebtoken & bcrypt:** Security and session management.
* **dotenv & zod:** Environment configuration parsing.

---

## SECTION 3: Workspace Configurations

### TypeScript Configuration (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### ESLint Configuration (`.eslintrc.json`)
```json
{
  "root": true,
  "env": { "browser": true, "es2022": true, "node": true },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "rules": {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### Editor Configuration (`.editorconfig`)
```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

---

## SECTION 4: Coding Standards

* **Naming Conventions:**
  * Directory Names: lowercase kebab-case (`components`, `chat-workspace`).
  * TSX Components: PascalCase (`ChatBubble.tsx`, `UploadButton.tsx`).
  * Utility Scripts: camelCase (`dateFormatter.ts`, `authValidator.ts`).
  * Environment Variables: UPPERCASE snake_case (`MONGODB_URI`, `OPENAI_API_KEY`).
* **Coding Boundaries:** Frontend pages must not import code from `/server` or local features privately. Common schemas must reside in `/shared`.

---

## SECTION 5: Git & Release Workflows

* **Branch Conventions:**
  * Feature branches: `feature/JCCAD-[ticket_id]-[summary]`.
  * Bug fixes: `bugfix/JCCAD-[ticket_id]-[summary]`.
  * Release candidates: `release/v[major].[minor].[patch]`.
* **Commit Message Format:** Commit messages must follow conventional standards:
  `feat(chat): implement SSE token stream controller`
* **Release Tagging:** Production updates use semantic tags (e.g., `v1.0.0`).

---

## SECTION 6: Environment Strategy

Environment configurations load variables dynamically based on deployment environments.

```
Development  --> Loads .env.development. Local mock APIs and storage active.
Testing (QA) --> Loads .env.test. Vitest database mocks active.
Staging      --> Loads secrets from vault. Replicates production configs.
Production   --> Managed by orchestration secrets managers. Strict limits active.
```

---

## SECTION 7: Monorepo Documentation Setup

### Local Quickstart Guide (`README.md`)
```markdown
# JCCAD Company Intelligence Platform (CIP)

## Local Development Quickstart

### Prerequisites
* Node.js v18+
* Docker Desktop (for local Redis/MinIO instances)

### Setup Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/jccad/cip.git
   cd cip
   ```
2. Install workspace dependencies:
   ```bash
   npm install
   ```
3. Initialize local helper services (Redis & MinIO):
   ```bash
   docker-compose up -d
   ```
4. Start development server loops:
   ```bash
   npm run dev
   ```
```

---

## SECTION 8: Container Strategy (Docker / Docker-Compose)

### Local Dev Orchestration (`docker-compose.yml`)
```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:RELEASE.2023-10-25T06-33-25Z
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: jccad_local_admin
      MINIO_ROOT_PASSWORD: local_dev_secret_password
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

volumes:
  redis_data:
  minio_data:
```

### Multi-stage Backend Container Configuration (`server/Dockerfile`)
```dockerfile
# Stage 1: Build Workspace
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY client/package*.json client/
COPY server/package*.json server/
COPY shared/package*.json shared/
RUN npm ci
COPY . .
RUN npm run build --w server

# Stage 2: Production Executions
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY server/package*.json server/
RUN npm ci --only=production
COPY --from=builder /app/server/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

## SECTION 9: Developer Experience Tools

VSCode settings automate format-on-save checks:

### IDE workspace settings (`.vscode/settings.json`)
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## SECTION 10: CI/CD Quality Gates

* **Build Quality Gates:** Commit hooks run checks before code is committed to the repository:
  1. *Linter verification:* Runs `npm run lint` on the codebase.
  2. *Formatter verification:* Runs Prettier checks.
  3. *Type checking:* Runs TypeScript compiler dry-runs (`tsc --noEmit`).
  4. *Unit verification:* Executes Vitest test sweeps.

---
*(End of Project Foundation Document)*
