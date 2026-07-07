# Backend Engineering Specification
## JCCAD Company Intelligence Platform (CIP)

**Prepared by the Backend Engineering Council**

| Version | Date | Status | Target Audience |
| :--- | :--- | :--- | :--- |
| v1.0.0 | 2026-06-30 | Released | Backend Developers, DevOps Teams, QA Engineers, Tech Leads |

---

## SECTION 1: Backend Architecture & Request Lifecycle

The JCCAD Company Intelligence Platform (CIP) backend is designed as a stateless microservices application built with Node.js and Express.js.

### Request Lifecycle Diagram
```
Client Request
      |
      v
[API Gateway] --(Rate Limiting & TLS)
      |
      v
[Express Router] --(Route Resolution)
      |
      v
[Security Middleware] --(XSS Protection & CSRF Validation)
      |
      v
[Authentication Middleware] --(JWT Parse & Expiry Check)
      |
      v
[Authorization Middleware] --(RBAC Tag Evaluation)
      |
      v
[Validation Middleware] --(Express Validator / Schema check)
      |
      v
[Express Controller] --(Extract params & Orchestrate)
      |
      v
[Service Layer] --(Business logic / Dynamic Prompts / RAG)
      |
      v
[Repository Layer] --(MongoDB Database / Vector Search query)
      |
      v
Database Response
```

* **Layered Architecture:** Decoupled into Controllers (handling requests/responses), Services (housing business logic), and Repositories (performing data access).
* **Dependency Management:** Managed using `npm` workspaces. Core components utilize dependency injection to simplify testing and mock database connections.
* **Configuration & Environments:** Application settings are read from system environment variables during initialization, keeping secrets out of configuration files.

---

## SECTION 2: Project Structure

```
server/
├── config/             # Environment configurations, database initializers
├── controllers/        # Express route handlers
├── services/           # Business logic, RAG orchestrators, prompt compilers
├── repositories/       # Database access layers (MongoDB, Atlas Search queries)
├── middleware/         # Security, authentication, RBAC validators, PII scrubbers
├── validators/         # Input validation schemas (Express-Validator schemas)
├── routes/             # REST routing matrices, SSE registers
├── models/             # Mongoose database models and schema definitions
├── jobs/               # Background task workers (Parsers, Web Crawlers)
├── queues/             # BullMQ queue interfaces and Redis connections
├── events/             # System event brokers (Pub/Sub controllers)
├── storage/            # Local and S3 object storage adapters
├── prompts/            # Grounding prompt templates and rendering scripts
├── retrievers/         # Hybrid lexical-vector search query engines
├── embeddings/         # OpenAI Embedding API connection adapters
├── knowledge/          # Knowledge base management APIs
├── analytics/          # Logging and analytics collectors
├── logging/            # System JSON log output formats
├── monitoring/         # Prometheus telemetry exporter APIs
├── security/           # Rate limiting and payload encryption scripts
└── utils/              # Common utilities, constants, shared interfaces
```

---

## SECTION 3: API Design Standards

CIP implements RESTful API design standards:

* **Versioning:** Hardcoded into route paths: `/api/v1/chat/message`.
* **Resource Names:** Uses plural noun naming conventions: `/api/v1/documents`.
* **Pagination:** Query list endpoints require pagination parameters: `page=2&limit=50`.
* **Filtering & Sorting:** Filter vectors using query parameters: `status=active&sort_by=created_at:desc`.
* **Error Response Format:** Standardizes error outputs:
  ```json
  {
    "error": {
      "code": "VALIDATION_FAILED",
      "message": "Required parameter 'email' is missing.",
      "details": [{ "field": "email", "issue": "must be a valid email string" }]
    }
  }
  ```
* **Rate Limiting:** Enforces limits at the API Gateway: Guests are limited to 5 requests/minute; authenticated users are limited to 60 requests/minute.

---

## SECTION 4: Authentication & Session Management

Authentication is managed using signed JSON Web Tokens (JWT) combined with sliding refresh tokens.

```
                    +------------------------------------+
                    |            User Login              |
                    +------------------------------------+
                                       |
                                       v
                    +------------------------------------+
                    |       Generate token pair          |
                    |  - Access Token (JWT - 15m)        |
                    |  - Refresh Token (DB - 7d)         |
                    +------------------------------------+
                                       |
                     +-----------------+-----------------+
                     |                                   |
                     v                                   v
        +--------------------------+       +---------------------------+
        | Access Token Cookie      |       | Refresh Token Cookie      |
        | - httpOnly, secure       |       | - httpOnly, secure        |
        | - Path: /api/v1/         |       | - Path: /api/v1/auth/     |
        +--------------------------+       +---------------------------+
```

* **Access Tokens:** Signed with RS256 keys, containing the user's role and permission tags. Expires in 15 minutes.
* **Refresh Tokens:** Stored in MongoDB with sliding expiration windows. User activity extends session lifespans automatically.
* **Session Expiration:** Users are automatically logged out after 15 minutes of inactivity.

---

## SECTION 5: User Management & Lifecycles

CIP defines seven roles: Guest, Student, Professional, Employee, Manager, Admin, and Super Admin.

```
[Register] -> [Validate Email] -> [Active] -> [Suspend] -> [Archive] -> [Delete]
```

* **Registration & Activation:** New users enter a `PENDING_VERIFICATION` state. Email validation updates user status to `ACTIVE`.
* **Access Rules:** User permissions are evaluated on every request, blocking unauthorized operations at the gateway level.

---

## SECTION 6: Company Profile Management

The JCCAD Company Profile collection holds operational metadata:

```json
{
  "_id": "ObjectId",
  "org_name": "JCCAD",
  "org_type": "Engineering Hub",
  "domains": ["Aeronautical", "Automobile", "Mechanical", "Mechatronics"],
  "services": ["CAD Training", "UAV Research", "Internships", "Workshops"],
  "version_history": [
    {
      "version": 1,
      "updated_by": "ObjectId",
      "timestamp": "ISODate"
    }
  ]
}
```

* **Updates & Approvals:** Changes made by Administrators generate draft records. Managers must approve updates before changes are published to active prompts.

---

## SECTION 7: Knowledge Base Management

Manages corporate documents, courses, and FAQ assets.

* **Asset Lifecycle:** Files transition through states: `Draft` $\rightarrow$ `Pending` $\rightarrow$ `Active` $\rightarrow$ `Archived`.
* **Data Rollbacks:** Administrators can revert files to previous versions, automatically updating vector databases.

---

## SECTION 8: Document Processing Pipeline

Processes uploaded documents to generate clean Markdown text and vector embeddings.

```
[Upload to S3] -> [ClamAV Scan] -> [Layout Parsing] -> [Token Chunking] -> [Embed Vector] -> [Index Refresh]
```

* **Parsing Workers:** Workers parse PDF/DOCX layout formats, extracting tables and structure.
* **Vector Embeddings:** Sends chunk text payloads to OpenAI embedding models, saving the resulting vectors in MongoDB.

---

## SECTION 9: Website Crawling Service

An automated web crawler crawls target JCCAD sites to keep chatbot content updated.

```
                    +------------------------------------+
                    |        Start Crawl Trigger         |
                    +------------------------------------+
                                       |
                                       v
                    +------------------------------------+
                    |     Fetch HTML (Respect robots)    |
                    +------------------------------------+
                                       |
                                       v
                    +------------------------------------+
                    |       Compare content SHA256       |
                    +------------------------------------+
                                       |
                     +-----------------+-----------------+
                     | Modified                          | Unchanged
                     v                                   v
        +--------------------------+       +---------------------------+
        | 1. Strip HTML tags       |       | 1. Log update status      |
        | 2. Re-chunk content      |       | 2. Skip indexing steps    |
        | 3. Refresh embeddings    |       |                           |
        +--------------------------+       +---------------------------+
```

* **Rate Limits:** Enforces a 1000ms delay between page crawls. Crawling is restricted to JCCAD seed domains.

---

## SECTION 10: AI Orchestration & RAG Execution

Coordinates query classifications, document search, and response generation loops.

* **Intent Routing:** Evaluates query similarity against keywords locally.
* **Hybrid Search:** Combines BM25 lexical matches with vector search scores using Reciprocal Rank Fusion (RRF), reranked via Cohere APIs.
* **Response Generation:** Streams tokens to client viewports using Server-Sent Events (SSE).

---

## SECTION 11: Background Task Queues

CIP uses **BullMQ** (powered by Redis) for asynchronous task execution.

```
[Core API Upload Trigger] --> [Publish Ingest Job] --> [ BullMQ Redis Queue ]
                                                               |
                                                               v
[ Indexing Success ]      <-- [ Complete embedding ]  <-- [ Worker Ingestion Node ]
```

* **Dead-letter Queues (DLQ):** Failed jobs are retried up to three times before being routed to a DLQ for administrator review.

---

## SECTION 12: Caching Architecture

* **Response Cache (Redis):** Caches response payloads for frequent queries for 24 hours.
* **Session Cache (Redis):** Stores authenticated user profiles and permissions.
* **Dynamic Config Cache (Redis):** Caches company profile variables.

---

## SECTION 13: Logging & Audit Logs

* **Application Logs:** Structured JSON logs are written directly to standard streams (`stdout`/`stderr`).
* **Audit Trails:** Logs administrative actions, saving actor IDs, change tags, and timestamps. Sensitive values (such as credentials) are redacted before logs are written.

---

## SECTION 14: Monitoring & Telemetry

* **Metrics Exporter:** Exposes performance telemetry (database lock times, queue delays) at `/metrics` to be scraped by Prometheus.
* **Health Check Endpoint:** Exposes health status at `/health` to verify database connections and service availability.

---

## SECTION 15: Security Controls

* **Authorization Middlewares:** Validate user permissions on every route.
* **Input Sanitation:** Input strings are sanitized to block prompt injection and cross-site scripting (XSS) attempts.
* **File Upload Protections:** Inbound files are scanned with ClamAV before parsing processes run.

---

## SECTION 16: Performance Optimizations

* **Connection Pooling:** Database connections are pooled and reused across requests.
* **Asynchronous Jobs:** Heavy workloads (such as document indexing or crawling) are executed asynchronously to protect API availability.
* **SSE Streams:** Real-time token streaming reduces perceived user latency.

---

## SECTION 17: Testing Strategy

* **Unit Tests (Vitest):** Validates controller routing and service execution in isolation.
* **Integration Tests:** Verifies database queries and API endpoints using mock databases.
* **Load Tests:** Tests performance limits (up to 1,000 concurrent sessions) using test suites (e.g., K6).

---

## SECTION 18: Deployment Readiness

* **Containers:** Services are packaged into Docker containers.
* **Graceful Shutdown:** On shutdown signals, the server stops accepting new connections, processes active jobs for 10 seconds, and releases database pools.
* **CI/CD Pipeline:** Pipelines automate builds, verify tests, run security vulnerability scans, and deploy updates to Kubernetes namespaces.

---

## SECTION 19: Future Backend Roadmap

* **Integrations:** Decoupled database collections sync data with external systems (including CRM or LMS platforms) via event streams.
* **Multi-tenant Configurations:** Collections support multi-company data isolation using `company_id` partition keys.

---
*(End of Backend Engineering Specification)*
