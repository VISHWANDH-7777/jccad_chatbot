# Engineering Execution Roadmap
## JCCAD Company Intelligence Platform (CIP)

**Prepared by the Engineering Leadership Team**

| Version | Date | Status | Target Audience |
| :--- | :--- | :--- | :--- |
| v1.0.0 | 2026-06-30 | Released | Engineering Directors, Tech Leads, Project Managers, SREs |

---

## SECTION 1: Project Breakdown (Epics, Features & Tasks)

The platform is broken down into six main Epics:

```
+-----------------------------------------------------------------------------+
|                                JCCAD CIP Epics                              |
+-----------------------------------------------------------------------------+
   | (Epic 1)          | (Epic 2)          | (Epic 3)          | (Epic 4)
   v                   v                   v                   v
+--------------+    +--------------+    +--------------+    +--------------+
| Core RAG &   |    | Auth & User  |    | Admin Portal |    | Web Crawler  |
| Semantic DB  |    | Contexts     |    | & Dashboard  |    | & Sync Loops |
+--------------+    +--------------+    +--------------+    +--------------+
```

* **Epic 1: Core RAG & Semantic Database (AI Team / Backend Team)**
  * *Features:* Hybrid search indexes, Cohere Cross-Encoder reranking integrations.
  * *Research Tasks:* Evaluate local intent router embedding model options (e.g., `BGE-M3` vs `all-MiniLM-L6-v2`).
  * *Technical Tasks:* Implement recursive character text chunking (512 tokens with 64-token overlap).
* **Epic 2: Authentication & User Contexts (Backend Team / Security Team)**
  * *Features:* RS256 JWT access token signatures, sliding refresh tokens.
  * *Infrastructure Tasks:* Integrate JCCAD Active Directory (SSO) interfaces.
* **Epic 3: Admin Portal & Dashboard UI (Frontend Team / Backend Team)**
  * *Features:* Ingested document tables, settings managers, system parameters (Version 1 profile).
* **Epic 4: Web Crawler & Synchronization Loop (Platform Team / Backend Team)**
  * *Features:* CRON tasks to monitor HTML hash differences and schedule crawls.

---

## SECTION 2: Product Backlog

| Item ID | Epic | Description | Priority | Dependencies | Complexity (Story Points) | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PBI-101** | Core RAG | Setup MongoDB Atlas Vector Search index. | Critical | None | 5 | Cosine similarity query checks return valid vectors. |
| **PBI-102** | Core RAG | Implement RRF Reranking pipeline. | Critical | PBI-101 | 8 | Top 4 contexts returned match test queries. |
| **PBI-201** | Auth | Implement JWT token verification middleware. | Critical | None | 5 | API returns `401 Unauthorized` for requests without tokens. |
| **PBI-301** | Admin | Create file upload forms in Admin Portal. | High | PBI-201 | 5 | UI displays progress bars and validates file formats. |
| **PBI-401** | Crawler | Implement weekly web crawler sync tasks. | Medium | PBI-101 | 8 | Crawler respects `robots.txt` and updates modified hashes. |

---

## SECTION 3: Sprint-by-Sprint Execution Plan

The execution schedule is structured into six 2-week sprints.

```
Sprint 1: RAG & DB Setup --> Sprint 2: Core Chat & SSE --> Sprint 3: Ingestion Worker --> Sprint 4: Admin Panel --> Sprint 5: Web Crawler --> Sprint 6: Security & Perf
```

### Sprint 1: Setup & Core RAG Pipeline
* **Sprint Goal:** Establish database schemas, vector indices, and basic search retrieval.
* **Risks:** Delay in MongoDB Atlas setup. *Mitigation:* Developers use local Docker instances for early sprint tasks.
* **Definition of Done:** Relational and vector database models are configured, and search query tests pass.

### Sprint 2: Core Chat UI & Streaming
* **Sprint Goal:** Implement the conversational chat UI and SSE streaming APIs.
* **Risks:** Model API latency spikes. *Mitigation:* Configure fallback model endpoints during this sprint.
* **Definition of Done:** The chat thread renders markdown, streams tokens, and displays citations.

---

## SECTION 4: Development Roadmap Phases

* **Phase 1: Foundation (Sprints 1 - 2):** Set up databases, create schemas, configure local routers, and implement core chat streaming APIs.
* **Phase 2: Authentication & Admin Portal (Sprints 3 - 4):** Integrate JCCAD SSO directories, set up user roles (RBAC), and build file upload forms.
* **Phase 3: Crawler & Telemetry (Sprints 5 - 6):** Build the web crawler, schedule sync tasks, and configure Prometheus metrics exporters.

---

## SECTION 5: Parallel Team Workflows

To optimize delivery times, teams work on tasks in parallel:

```
Frontend Team: [Build Chat UI Component] ----> [Integrate Auth Page] ---> [Build Admin Dashboard]
                                                                                ^
Backend Team:  [Setup Express Server & APIs] -> [Integrate OAuth/JWT] -> [API Database Integrations]
                                                                                ^
Platform Team: [Setup K8s & Prometheus] -----> [Configure Docker] -----> [Deploy CI/CD Pipelines]
```

---

## SECTION 6: Milestone Chart

* **MS-1: Architecture Approved (Week 1):** Document specifications approved by the Architecture Review Board.
* **MS-2: Backend MVP Ready (Week 4):** Database schemas, basic search services, and API endpoints are online.
* **MS-3: Chat UI Complete (Week 6):** UI supports token streaming, citations popovers, and feedback ratings.
* **MS-4: Production Ready (Week 12):** Security penetration checks pass and performance targets are met.

---

## SECTION 7: Definition of Ready (DoR)

Tasks are ready to enter development sprints when:
* Functional requirements and user stories are defined.
* Security risks have been reviewed.
* Test cases are planned.
* Dependencies are identified.

---

## SECTION 8: Definition of Done (DoD)

Tasks are complete when:
* Code changes pass peer reviews.
* Unit tests achieve $> 80\%$ code coverage.
* Container builds complete successfully.
* Security scans verify that there are no critical vulnerabilities.

---

## SECTION 9: Git & Branching Strategy

CIP uses GitFlow development workflows:

```
[Main Branch (Prod Releases)] <--- [Release Branch (Release Candidates)] <--- [Develop Branch]
                                                                                   ^
                                                                          [Feature Branches]
```

* **Branch Mappings:** Feature branches merge into `develop` via Pull Requests. Release branches are created from `develop` for testing before merging into `main`.
* **Commit Format:** Commits must use structured headers: `feat(chat): add suggested prompt chips`.
* **Merge Policies:** Merging requires at least two peer approvals and successful CI/CD pipeline builds.

---

## SECTION 10: Engineering Coding Standards

* **TypeScript Type Controls:** Enforce strict type checking configurations:
  ```json
  "strict": true
  ```
* **Directory Layouts:** Standardize on feature-first folder layouts.
* **Error Logs:** Operational errors are logged in structured JSON formats containing error codes and component origins.

---

## SECTION 11: Code Review Checklists

### Backend Code Review
* [ ] Parameter inputs validate against schemas.
* [ ] Database transactions use error handling.
* [ ] JWT permission checks protect admin paths.
* [ ] Logs redact sensitive parameters.

### Frontend Code Review
* [ ] Elements support keyboard navigation focus.
* [ ] Large message lists use virtualization.
* [ ] Inputs escape output characters to prevent XSS.

---

## SECTION 12: Risk Register

| Risk Description | Probability | Impact | Mitigation Strategy | Contingency Action |
| :--- | :--- | :--- | :--- | :--- |
| **OpenAI API Rate Limits** | High | Critical | Cache embeddings queries in Redis. | Shift traffic to Anthropic Claude or a local Llama instance. |
| **Stale Web Crawl Data** | Medium | Medium | Hash compare page content during crawls. | Re-index crawl vectors manually on alert events. |
| **Memory Leak in SSE Stream** | Low | High | Use virtualized message lists. | Configure auto-restart rules for Node.js container pods. |

---

## SECTION 13: Release Phases

```
[Internal Alpha (Team Tests)] -> [Engineering Beta (Staff QA)] -> [UAT (Admin Audits)] -> [Prod Pilot (Group Launch)] -> [General Availability]
```

---

## SECTION 14: Production Readiness Checklist

Before updates are deployed to production, teams must verify:
* [ ] Performance: streaming token latency is $< 800$ms under load.
* [ ] Security: penetration scans report zero critical vulnerabilities.
* [ ] Disaster Recovery: database snapshots are verified.
* [ ] Observability: metrics export endpoints are active.

---

## SECTION 15: Success Metrics & KPIs

* **Response Latency:** $95\%$ of chat queries stream initial tokens in $< 800$ms.
* **Groundedness Index:** AI responses maintain $\ge 98\%$ grounding accuracy.
* **Defect Deflection:** Deflect customer support inquiries by $40\%$ within six months of deployment.

---

## SECTION 16: Future Platform Roadmap

* **Voice Support:** Voice inputs parse to text before passing to the Core API in future updates.
* **LMS/CRM Integration:** Sync course schedules and student profiles with JCCAD CRMs using event queues.

---

## SECTION 17: Engineering Handover Package Checklist

Before implementation begins, engineers must receive:
* [ ] Approved system architecture specifications.
* [ ] API specs and schema schemas.
* [ ] Target environment credentials.
* [ ] Test data scripts.

---
*(End of Roadmap Document)*
