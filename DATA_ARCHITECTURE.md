# Enterprise Data Architecture Document
## JCCAD Company Intelligence Platform (CIP)

**Prepared by the Enterprise Data Architecture Council**

| Version | Date | Status | Target Audience |
| :--- | :--- | :--- | :--- |
| v1.0.0 | 2026-06-30 | Released | CTO, Chief Data Officer, Engineering Leads, Data Engineering Team |

---

## SECTION 1: Complete Data Landscape

JCCAD's corporate intelligence system relies on a structured, multi-tier data landscape. Information is classified into nine functional domains:

| Data Category | Definition / Purpose | Storage Architecture | Example Data Entities |
| :--- | :--- | :--- | :--- |
| **Operational Data** | Transactional schemas representing user accounts, session contexts, and administrative changes. | MongoDB Document Store | Users, Sessions, Chat metadata records. |
| **Knowledge Data** | Grounding company material used to inform chatbot responses in Expert Mode. | MongoDB + Vector Index | Syllabi, Course outlines, policy guides. |
| **Analytical Data** | Log metrics tracking system performance, token counts, and user feedback rates. | MongoDB Time-Series | Response latency metrics, usage statistics. |
| **AI Data** | High-dimensional embeddings and contextual conversational histories. | Vector Database + Redis | 1536-dim vector arrays, memory segments. |
| **Security Data** | Authentication hashes, signed tokens, and granular permission access rules. | MongoDB (Encrypted) | Argon2id password hashes, JWT signatures. |
| **Configuration Data** | Settings variables controlling model choices, routing parameters, and crawler limits. | MongoDB (Cached) | Temperature thresholds, CORS whitelist domains. |
| **Audit Data** | Write-once read-many activity trails tracking administrative actions. | MongoDB (Locked) | File deletion events, user profile changes. |
| **Temporary Data** | Transient caches holding parsing tasks, intermediate scraping queues, and connection states. | Redis Cache | Document parsing queues, lock indicators. |
| **Archived Data** | Cold historical chat sessions and audit trails preserved for compliance. | S3 Object Glacier | System logs older than 90 days. |

---

## SECTION 2: Database Selection & Architecture Decisions

JCCAD CIP implements a **Unified Document & Vector Store** utilizing **MongoDB Atlas** combined with **Atlas Vector Search**.

```
                           +--------------------------------------+
                           |             Core App API             |
                           +--------------------------------------+
                                      |                |
                       JSON Records   |                |  JSON Docs / Updates
                       & Operations   v                v
                           +--------------------------------------+
                           |          MongoDB Atlas Node          |
                           |   (Transactional & Metadata DB)      |
                           +--------------------------------------+
                                      |
                                      | Dynamic Sync (Trigger)
                                      v
                           +--------------------------------------+
                           |      MongoDB Atlas Vector Search     |
                           |    (k-NN Semantic Vector Index)      |
                           +--------------------------------------+
```

### Technical Evaluation Matrix

| Database Choice | Alternatives Considered | Architectural Trade-offs & Analysis | Recommendation |
| :--- | :--- | :--- | :--- |
| **Primary Metadata & Relational Database** | **PostgreSQL**, MySQL, DynamoDB | MongoDB handles high-volume conversational logging and dynamic profile JSON configurations efficiently. *Trade-off:* Lacks native SQL foreign key integrity validations, which must be handled at the Application API middleware level. | **Recommended:** MongoDB Atlas. |
| **Vector Engine Integration** | **Qdrant**, Pinecone, Milvus | *Unified (Atlas Search):* Minimizes operational overhead by managing metadata and embeddings in a single database. *Decoupled (Qdrant):* High k-NN query throughput, but requires maintaining separate database instances and synchronization pipelines. | **Recommended:** MongoDB Atlas Vector Search. |

---

## SECTION 3: MongoDB Design & Collections Schema

CIP defines 25 distinct collections in MongoDB Atlas, structured using schema validations.

```
+---------------+     +---------------+     +---------------+     +---------------+
|     Users     |1  N| Chat_Sessions |1  N|   Messages    |1  N|   Feedback    |
+---------------+     +---------------+     +---------------+     +---------------+
                                                |
                                                | 1
                                                v 1
                                          +-----------+
                                          | Citations |
                                          +-----------+
```

### 1. `users`
* **Purpose:** Stores user profiles and authentication metadata.
* **Schema Fields:**
  * `_id`: `ObjectId` (Primary Key)
  * `email`: `string` (Validated RFC 5322 regex)
  * `password_hash`: `string` (Argon2id format)
  * `role_id`: `ObjectId` (References `roles._id`)
  * `status`: `string` (`active | suspended | pending`)
  * `created_at`: `timestamp`
* **Relationships:** One-to-Many with `chat_sessions`.
* **Validation:** JSON Schema checks email formatting constraints.
* **Retention:** Permanent.
* **Growth:** Linear (approx. 5,000 students/year).
* **Scaling:** Sharded on `{"_id": "hashed"}` keys.

### 2. `roles`
* **Purpose:** Defines application access levels.
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `name`: `string` (`Super_Admin | Admin | Manager | Employee | Professional | Student`)
  * `description`: `string`
* **Relationships:** One-to-Many with `users`.
* **Validation:** Unique string check on role name.
* **Retention:** Permanent.

### 3. `permissions`
* **Purpose:** Defines granular action tags.
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `action`: `string` (e.g., `knowledge:upload`, `system:config`)
  * `assigned_roles`: `array` (References `roles._id`)
* **Relationships:** Shared mappings between roles.

### 4. `chat_sessions`
* **Purpose:** Manages active and historical chat sessions.
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `user_id`: `ObjectId` (References `users._id`, nullable for guests)
  * `session_token`: `string` (UUIDv4)
  * `started_at`: `timestamp`
  * `last_activity`: `timestamp`
* **Indexes:** `{"session_token": 1}`, `{"user_id": 1}`.
* **Retention:** Guests: 30 minutes; Authenticated: 90 days.

### 5. `messages`
* **Purpose:** Stores individual conversational messages.
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `session_id`: `ObjectId` (References `chat_sessions._id`)
  * `sender`: `string` (`user | assistant | system`)
  * `text`: `string`
  * `timestamp`: `timestamp`
* **Indexes:** `{"session_id": 1, "timestamp": 1}`.
* **Retention:** Inherits parent session settings.

### 6. `conversation_memory`
* **Purpose:** Manages the LLM context buffer.
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `session_id`: `ObjectId`
  * `summary`: `string`
  * `token_count`: `int`
* **Retention:** Cleared dynamically upon session archive steps.

### 7. `feedback`
* **Purpose:** Records user ratings on response quality.
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `message_id`: `ObjectId` (References `messages._id`)
  * `rating`: `string` (`up | down`)
  * `comments`: `string`
* **Indexes:** `{"message_id": 1}`.

### 8. `company_profile`
* **Purpose:** Manages baseline JCCAD Company metadata.
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `org_name`: `string`
  * `org_type`: `string`
  * `domains`: `array`
  * `services`: `array`
* **Retention:** Permanent.

### 9. `departments`
* **Purpose:** Maps corporate organizational hierarchies.
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `name`: `string`
  * `lead_poc`: `string`

### 10. `services`
* **Purpose:** Tracks current JCCAD services.
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `name`: `string`
  * `status`: `string` (`active | deprecated`)

### 11. `faqs`
* **Purpose:** Stores curated Q&A pairs for direct retrieval matching.
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `question`: `string`
  * `answer`: `string`

### 12. `knowledge_sources`
* **Purpose:** Tracks document origins (crawled domains vs files).
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `source_type`: `string` (`upload | web`)
  * `origin_uri`: `string`

### 13. `documents`
* **Purpose:** Tracks uploaded files and validation status.
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `filename`: `string`
  * `file_hash`: `string`
  * `storage_path`: `string`
  * `role_access`: `array`
  * `status`: `string` (`processing | indexed | failed`)
* **Indexes:** `{"file_hash": 1}`.

### 14. `website_pages`
* **Purpose:** Stores text content extracted from crawls.
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `url`: `string`
  * `html_hash`: `string`
  * `markdown_content`: `string`
* **Indexes:** `{"url": 1}`.

### 15. `document_versions`
* **Purpose:** Tracks file update histories.
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `document_id`: `ObjectId`
  * `version_num`: `int`
  * `file_hash`: `string`

### 16. `categories`
* **Purpose:** Defines taxonomy classifications for grounding content.
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `name`: `string`

### 17. `tags`
* **Purpose:** Custom metadata tags for filtering.
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `label`: `string`

### 18. `analytics`
* **Purpose:** Stores aggregated system latency and token usage metrics.
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `timestamp`: `timestamp`
  * `api_latency_ms`: `int`
  * `tokens_consumed`: `int`

### 19. `search_logs`
* **Purpose:** Stores search queries for quality evaluation.
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `query_text`: `string`
  * `results_count`: `int`

### 20. `error_logs`
* **Purpose:** Logs system errors for debugging.
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `stack_trace`: `string`
  * `component`: `string`

### 21. `system_logs`
* **Purpose:** Logs standard operational events.
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `event_name`: `string`
  * `level`: `string`

### 22. `notifications`
* **Purpose:** Manages alerts for Administrators.
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `message`: `string`
  * `is_read`: `boolean`

### 23. `settings`
* **Purpose:** Stores global platform configuration variables.
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `model_name`: `string`
  * `router_threshold`: `double`

### 24. `audit_logs`
* **Purpose:** Write-once log of administrative actions.
* **Schema Fields:**
  * `_id`: `ObjectId`
  * `user_id`: `ObjectId`
  * `action`: `string`
  * `timestamp`: `timestamp`
* **Indexes:** `{"timestamp": -1}`.

---

## SECTION 4: Knowledge Base Data Model

The JCCAD Knowledge Base contains structural and unstructured assets mapped using inheritance tags:

```
                                  +-----------------------+
                                  |     Base Document     |
                                  +-----------------------+
                                              |
      +------------------+--------------------+-------------------+------------------+
      |                  |                    |                   |                  |
      v                  v                    v                   v                  v
+-----------+      +-----------+        +-----------+       +-----------+      +-----------+
|  Courses  |      | Policies  |        |    FAQs   |       | Websites  |      | Research  |
+-----------+      +-----------+        +-----------+       +-----------+      +-----------+
```

* **Core Taxonomy Mappings:** Grounding chunks inherit tags based on content categories:
  * `courses`: Contains schedules, fees, syllabus details, and prerequisites.
  * `policies`: Focuses on training requirements and security rules.
  * `faqs`: Direct-match database of approved company definitions.
  * `websites`: Extracted public-facing page markdown content.
  * `research`: Internal UAV research logs and mechatronics files (accessed only by Employee/Manager roles).

---

## SECTION 5: Knowledge Lifecycle

```
[Create] -> [Review] -> [Approve] -> [Publish] -> [Index] -> [Retrieve] -> [Archive] -> [Delete]
```

1. **Create:** Administrator uploads a document or the Web Crawler fetches page text content, assigning it a `PENDING_REVIEW` state.
2. **Review & Approve:** Managers review text extraction logs. Approving the item updates its status to `ACTIVE`.
3. **Publish & Index:** Embedding generators chunk approved content, compute vectors, and sync indexes.
4. **Retrieve:** The RAG query engine matches user vectors against active document indices.
5. **Archive & Delete:** Updating or deleting documents soft-deletes active records, schedules vector purges, and moves archived documents to S3 Glacier storage.

---

## SECTION 6: Document Architecture

Documents are mapped using structural schemas to handle different file types:

```json
{
  "_id": "ObjectId",
  "document_metadata": {
    "file_type": "string (pdf|docx|pptx|image|web)",
    "file_hash": "string (SHA256)",
    "owner_id": "ObjectId",
    "access_roles": ["string"],
    "version": 1
  },
  "raw_content_ptr": "string (S3-URI)",
  "parsed_markdown": "string",
  "approval_state": "string (draft|approved|archived)"
}
```

* **Version Management:** File updates generate a new document record. The prior document's vector index is archived to prevent duplicate context matches.

---

## SECTION 7: Document Processing Pipeline

```
[Upload] -> [Scan] -> [Verify] -> [Extract] -> [Chunk] -> [Embed] -> [Index]
```

1. **Upload & Scan:** Raw files are written to S3 objects. ClamAV runs virus scans on target temporary storage directories.
2. **Verify & Extract:** Parsers extract content layout structures (including table columns and formatting).
3. **Chunk & Embed:** Document text is chunked using sliding windows. Embedding APIs generate vector representations.
4. **Index & Publish:** Vector indices are refreshed. If processing fails, the transaction rolls back, deleting new chunks and reverting system status.

---

## SECTION 8: Chunking Strategy

To preserve context, we use a recursive splitting strategy based on character counts:

```
Document Markdown Text
  |
  +---> [Headers / Paragraphs Detection]
          |
          +---> Chunk Size: 512 Tokens (approx. 400 words)
          |     Chunk Overlap: 64 Tokens (approx. 50 words)
          |
          +---> Metadata Injection: { doc_id, filename, headers, page }
```

* **Table Parsing:** HTML tables are extracted as text blocks to ensure tabular data structures are preserved during vectorization.
* **Image OCR:** Multimodal models analyze drawings and images, appending written descriptions directly to matching context chunks.

---

## SECTION 9: Embedding Strategy

* **Model Selection:** OpenAI's `text-embedding-3-large` (configured at 1536 dimensions).
* **Similarity Evaluation:** Uses **Cosine Similarity** to evaluate vectors. Queries with matches $< 0.70$ are rejected.
* **Hybrid Retrieval:** Combined search ranking merges lexical text metrics with vector matching scores:
  
$$\text{RRF Score} = \sum_{d \in D} \frac{1}{k + r_v(d)} + \frac{1}{k + r_l(d)}$$

---

## SECTION 10: Vector Database Design (Atlas Vector Search)

Vector storage is managed directly within MongoDB Atlas collections.

```json
{
  "_id": "ObjectId",
  "doc_id": "ObjectId",
  "chunk_text": "string",
  "embedding": [ "float" ],
  "role_access": [ "string" ],
  "metadata": {
    "source_file": "string",
    "page_num": "int",
    "header_path": "string"
  }
}
```

* **Index Updates:** Changing or deleting documents triggers database listeners to automatically rebuild search indices.
* **Backups:** Vector collections are backed up during standard operational snapshot cycles.

---

## SECTION 11: Website Knowledge Model

```json
{
  "_id": "ObjectId",
  "url": "string",
  "depth": "int",
  "page_metadata": {
    "title": "string",
    "description": "string",
    "last_crawled": "ISODate"
  },
  "content": {
    "raw_html": "string",
    "clean_markdown": "string",
    "links_extracted": ["string"]
  },
  "content_hash": "string (SHA256)"
}
```

* **Change Monitoring:** Crawl cycles compare calculated HTML hashes against database values. Vector updates are triggered only if page content changes.

---

## SECTION 12: Company Profile Model (Version 1 Metadata)

The company profile collection holds operational metadata used to compile grounding prompts:

| Attribute Field | Data Type | Purpose / Description |
| :--- | :--- | :--- |
| `org_name` | `string` | Official organization identity name ("JCCAD"). |
| `org_type` | `string` | Defines organization focus ("Engineering Skill Development Hub"). |
| `mission` | `string` | Core mission statement. |
| `vision` | `string` | Core vision statement. |
| `domains` | `array` | Core engineering categories (Aeronautical, Automobile, Mechanical, Mechatronics). |
| `services` | `array` | Active services (CAD Training, UAV Research, Internships, etc.). |
| `leadership` | `array` | Names and titles of leadership team. |
| `contact_email`| `string` | General support and contact email address. |

*Design Justification:* Storing this dynamic data in a centralized collection allows administrators to modify baseline company profile values without code updates.

---

## SECTION 13: Conversation Data Model

```json
{
  "session_token": "string (UUIDv4)",
  "history": [
    {
      "sender": "string (user|assistant)",
      "text": "string",
      "timestamp": "ISODate"
    }
  ],
  "context_cache": {
    "last_expert_contexts": ["string"],
    "summary_history": "string"
  }
}
```

* **Retention & Deletion:** Guest sessions expire after 30 minutes of inactivity. Authenticated logs are purged after 90 days.

---

## SECTION 14: Analytics Data Model

CIP stores operational and usability metrics in dedicated collections:

```json
{
  "_id": "ObjectId",
  "timestamp": "ISODate",
  "metric_type": "string (performance|usage|satisfaction|failed_query)",
  "payload": {
    "latency_ms": "int",
    "tokens_used": "int",
    "query_text": "string",
    "resolved_mode": "string",
    "feedback_rating": "string"
  }
}
```

* **Failed Queries:** Logs queries returning fallback responses to help identify gaps in the knowledge base.

---

## SECTION 15: Search Architecture

The search service executes a hybrid retrieval path:

```
                    +------------------------------------+
                    |             User Query             |
                    +------------------------------------+
                                       |
                     +-----------------+-----------------+
                     |                                   |
                     v                                   v
        +--------------------------+       +---------------------------+
        |   Lexical Text Search    |       |   k-NN Vector Search      |
        |      (Atlas BM25)        |       |   (Similarity Metric)     |
        +--------------------------+       +---------------------------+
                     |                                   |
                     +-----------------+-----------------+
                                       |
                                       v
                    +------------------------------------+
                    |    Reciprocal Rank Fusion (RRF)    |
                    +------------------------------------+
                                       |
                                       v
                    +------------------------------------+
                    |     Cohere Cross-Encoder Rerank    |
                    |           (Top 4 Contexts)         |
                    +------------------------------------+
```

---

## SECTION 16: Security & Governance

* **Encryption:** Data in transit is secured using TLS 1.3. Databases and object storage are encrypted at rest using AES-256 keys.
* **PII Redaction:** Input processing pipelines strip personal identifiers (such as phone numbers or credentials) from queries before they reach vector storage or LLM endpoints.
* **Role-Based Access Control:** All vector queries filter search results based on user permission levels.

---

## SECTION 17: Scalability

```
100 Documents (1K Chunks)     --> Stored in single MongoDB instances.
10,000 Documents (100K Chunks) --> MongoDB indexes cached in memory.
100,000 Documents (1M Chunks)  --> Read-replicas handle vector query traffic.
1 Million Documents (10M Chunks)--> Shared collections distributed by chunk ranges.
```

---

## SECTION 18: Backup & Recovery

* **Snapshots:** Daily backups are stored across multiple cloud availability zones.
* **Point-in-Time Recovery (PITR):** Enables transactional recovery to any point within the past 14 days.
* **Version Rollbacks:** Administrators can revert system files to previous versions, restoring previous vector states.

---

## SECTION 19: Future Expansion

* **Multi-Company Support:** The database schema is partitionable using `company_id` tenant keys.
* **Integrations:** Decoupled database collections sync data with external systems (including CRM or LMS platforms) via event streams.

---
*(End of Data Architecture Document)*
