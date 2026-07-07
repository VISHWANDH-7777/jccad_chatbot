# Enterprise Retrieval & Search Engine Manual
## JCCAD Company Intelligence Platform (CIP)

---

## 1. Intent Classification Matrix

To optimize retrieval efficiency, incoming queries are classified into specific intents:

| Intent Tag | Query Description | Retrieval Actions | Fallback / Output |
| :--- | :--- | :--- | :--- |
| **`Greeting`** | User greetings ("hello", "good morning"). | Skip search query. | Direct friendly response block. |
| **`CompanyQuery`**| Specific request about JCCAD assets. | Run hybrid search with permission checks. | Return top-K matches with citations. |
| **`GeneralAI`** | Out-of-scope coding or logic request. | Skip search query. | Run default chatbot grounding prompt. |
| **`Unsupported`**| Malformed or unrecognized queries. | Skip search query. | Direct fallback text output. |

---

## 2. Hybrid Reranking & Reciprocal Rank Fusion (RRF)

The retrieval engine combines vector similarity and quality scores using a weighted Reciprocal Rank Fusion (RRF) calculation:

$$\text{RRF Score} = (S_{\text{vector}} \times W_{\text{vector}}) + (S_{\text{quality}} \times W_{\text{quality}})$$

* **Weights:** Vector Similarity is weighted at $70\%$, while Document Quality (version status and metadata completeness) is weighted at $30\%$. This ensures that highly relevant, active documents are prioritized over outdated revisions.

---

## 3. Grounded Context Token Budgeting

To fit within LLM context window constraints:
* **Token Budget Limit:** Enforces a strict limit of 1500 tokens (approximately 6000 characters).
* **Citations Generation:** Every matching chunk is assigned a superscript citation index (e.g. `[1]`, `[2]`), mapping to its source document and version snapshot.
