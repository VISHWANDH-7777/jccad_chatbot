# Company Profile Governance & Operations Manual
## JCCAD Company Intelligence Platform (CIP)

---

## 1. Profile Version Lifecycle Flow

Company Profile records transition through five distinct states:

```
[Create/Edit Draft] ---------> [Submit Review] ---------> [Pending Review]
         ^                                                      |
         | (Reject Update)                                      | (Approve Update)
         +------------------------------------------------------+
                                                                v
[Archived Versions] <--------- [Rollback] <--------- [Publish approved]
```

* **Draft:** Editable work area. Changes can be updated repeatedly without affecting active RAG prompts.
* **Pending Review:** Draft is locked. Awaiting Manager evaluation.
* **Approved:** Approved draft. Ready for publication.
* **Published:** Active configuration. Injected live into prompt templates.
* **Archived:** De-activated historical snapshot. Replaced by a newer version.

---

## 2. Dynamic Prompt & AI Synchronization

Approved changes update the AI engine instantly using the following cache invalidation pattern:

```
[Administrator Publishes Profile] 
      |
      v
[Archive past Published profiles in MongoDB]
      |
      v
[Save Version snapshot to ProfileVersion collection]
      |
      v
[Execute Redis Cache Invalidation event]
- Evicts `cip:company_profile:active` key.
- Triggers dynamic re-compilation on the next user query.
      |
      v
[Sync Vector Indexing Task (BullMQ)]
- Creates text chunks for profile fields (Faqs, Stats, Contact).
- Updates Atlas Vector indexes with version tags.
```

* **Outcome:** The chatbot loads the fresh profile information dynamically from Redis on the next query, eliminating the need to retrain models.

---

## 3. Operations Console Guidelines

### 3.1 Draft Updates
* **Access Control:** Restricted to `Employee` role or higher.
* **API Ingress:** `POST /api/v1/profile/draft`

### 3.2 Submitting Reviews
* **Access Control:** Restricted to `Employee` role or higher.
* **API Ingress:** `POST /api/v1/profile/submit-review`

### 3.3 Evaluation & Approval
* **Access Control:** Restricted to `Manager` role or higher.
* **API Ingress:** `POST /api/v1/profile/approve` or `/reject`

### 3.4 Publication & Rollbacks
* **Access Control:** Restricted to `Administrator` role or higher.
* **API Ingress:** `POST /api/v1/profile/publish` or `/rollback`
