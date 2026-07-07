# Document Intelligence Platform (DIP) Governance & Event Manual
## JCCAD Company Intelligence Platform (CIP)

---

## 1. Document Lifecycle Flow

Documents transition through five distinct states inside the DIP:

```
[Upload Document Draft] --------> [Submit Review] --------> [Pending Review]
          |                                                      |
          | (Revert to edit)                                     | (Approve File)
          +------------------------------------------------------+
                                                                 v
[Archived Versions] <--------- [Rollback] <--------- [Publish Approved]
```

---

## 2. Event-Driven AI Synchronization Architecture

Downstream AI modules (such as the RAG pipeline or Vector Embedding indexing workers) subscribe to lifecycle event streams issued by the DIP. 

### Event Execution Flow

```
[DIP Controller: Publish File]
              |
              v
[Commit transaction & update status to 'Published']
              |
              v
[Trigger Event: 'document:published'] --------------------------+
                                                                |
                                                                v
                                              [ Redis Pub/Sub Event Channel ]
                                                                |
         +------------------------------------------------------+------------------------------------------------------+
         |                                                                                                             |
         v                                                                                                             v
[AI Embedding Ingest Worker]                                                                                 [Config Cache Manager]
1. Read file path from S3 storage keys.                                                                     1. Evict prompt caching tags.
2. Segment document text into 512-token chunks.                                                             2. Mark index status as dirty.
3. Compute vectors using OpenAI Embedding APIs.
4. Save vector mappings in MongoDB Atlas indexes.
```

### Supported Event Types
1. **`document:uploaded` (Draft):** Fired when a file is uploaded. Downstream crawlers or parsers can run preview generation tasks.
2. **`document:published`:** Fired when a manager approves and publishes a file. Instructs RAG ingestion workers to index chunks and write vector embeddings.
3. **`document:updated`:** Fired when a new version is uploaded. Instructs workers to update downstream vector DB entries using version tags.
4. **`document:archived`:** Fired when a file is archived. Instructs indexing systems to flag vector chunks as inactive, blocking them from query results.
5. **`document:deleted`:** Fired when a file is purged. Instructs workers to hard-delete related vector chunks from Atlas collections.
