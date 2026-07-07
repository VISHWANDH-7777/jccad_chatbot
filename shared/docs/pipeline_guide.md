# AI Ingestion Processing Pipeline Integration Guide
## JCCAD Company Intelligence Platform (CIP)

---

## 1. Data Ingestion Stages

Before structured knowledge is converted to vectors, it passes through five ingestion stages:

```
[Ingestion Trigger (Published Asset)]
                  |
                  v
[Stage 1: Validation] -------------> Verify asset status is 'Published'.
                  |
                  v
[Stage 2: Canonicalization] --------> Compile sections into standard Markdown formatting.
                  |
                  v
[Stage 3: Chunk Planning] ----------> Split text into segments of 512 tokens with 
                                     a 64-token overlap.
                  |
                  v
[Stage 4: Metadata Enrichment] -----> Attach categories, topics, departments, 
                                     and visibility tags to each chunk.
                  |
                  v
[Stage 5: Quality Audit Report] ----> Evaluate readability and metadata structure scores.
```

---

## 2. Text Chunking & Overlap Configurations

To prevent losing context at chunk boundaries, we implement a sliding window overlap strategy:

```
Word Token Flow:
[ Word 1, Word 2, ..., Word 448 ]  --------------> Chunk #1 (Length: 512 tokens)
                      | (Overlap: 64 tokens)
                      v
            [ Word 448, Word 449, ..., Word 960 ] -> Chunk #2 (Length: 512 tokens)
```

* **Maximum Chunk Size:** 512 tokens.
* **Overlap Strategy:** 64 tokens are copied from the end of the previous chunk to the start of the next one.
* **Heading Preservation:** The parent section heading is injected into each chunk's metadata path, preserving hierarchical context.

---

## 3. Metadata Enrichment Properties
Each output package contains structured keys for downstream indexing:
* **`category` / `topic`:** Direct routing classification parameters.
* **`visibility`:** Enforces access control limits at the database level.
* **`relationships`:** List of linked knowledge asset IDs.
