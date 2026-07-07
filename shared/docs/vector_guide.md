# Embedding & Vector Intelligence Platform (EVIP) Manual
## JCCAD Company Intelligence Platform (CIP)

---

## 1. Vector & Indexing Lifecycle

Knowledge chunks are indexed and updated using event-driven lifecycle pipelines:

```
[Ingestion Pipeline Complete]
              |
              v
[Generate Vector (text-embedding-3-small)]
              |
              v
[Delete historical vectors for target asset ID]
              |
              v
[Insert new vectors into VectorRecord collection]
              |
              v
[Rebuild MongoDB Atlas search indexes]
```

---

## 2. Cosine Similarity & Search Metrics

Retrieval matching is evaluated using Cosine Similarity calculations. The dot product compares query and document vector directions:

$$\text{Similarity}(A, B) = \frac{A \cdot B}{\|A\| \|B\|}$$

* **Normalizations:** Chunks and queries are normalized to a magnitude of 1.0 during generation, simplifying the similarity calculation to a dot product:
  $$\text{Similarity}(A, B) = A \cdot B$$
* **Metadata Filtering:** Queries apply pre-filters (such as category or department restrictions) at the database layer before calculating vector distances, optimizing performance.

---

## 3. Operations & Recovery Guide

### 3.1 Model Upgrades
When transitioning to a new embedding model:
1. Re-index drafts under the new model tag.
2. Invalidate existing caches.
3. Keep the old model indices active during migration to prevent downtime.

### 3.2 Index Backups
Execute weekly snapshots of the `vectorrecords` collection. If index corruption occurs, restore the snapshot collection and run a full re-index.
