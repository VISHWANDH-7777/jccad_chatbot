# AI Engineering Blueprint
## JCCAD Company Intelligence Platform (CIP)

**Prepared by the AI Engineering Council**

| Version | Date | Status | Target Audience |
| :--- | :--- | :--- | :--- |
| v1.0.0 | 2026-06-30 | Released | Chief AI Officer, Engineering Leadership, AI Engineers, Data Scientists |

---

## SECTION 1: Overall AI Architecture

The JCCAD Company Intelligence Platform (CIP) features a modular architecture designed to support dynamic context building, semantic indexing, intent routing, and grounded text generation.

```
                                  +------------------------------------+
                                  |             User Input             |
                                  +------------------------------------+
                                                     |
                                                     v
                                  +------------------------------------+
                                  |      API Gateway / Guardrails      |
                                  |    (Llama Guard / PII Scrubbers)   |
                                  +------------------------------------+
                                                     |
                                                     v
                                  +------------------------------------+
                                  |      Intent & Context Router       |
                                  |       (Local Semantic Router)      |
                                  +------------------------------------+
                                      |                            |
                +---------------------+                            +---------------------+
                | >= 0.70 Match                                    | < 0.70 Match
                v                                                  v
+------------------------------+                                 +------------------------------+
|     Company Expert Mode      |                                 |       General AI Mode        |
+------------------------------+                                 +------------------------------+
  | (Cosine + BM25 Search)                                         | (Bypass Retrieval)
  v                                                                v
+------------------------------+                                 +------------------------------+
|  Reciprocal Rank Fusion      |                                 |       System Prompt          |
+------------------------------+                                 +------------------------------+
  | (Cohere Rerank v3)                                             | (Set Temperature to 0.7)
  v                                                                v
+------------------------------+                                 +------------------------------+
|    Context Builder Payload   |                                 |       LLM API Engine         |
+------------------------------+                                 +------------------------------+
  | (Grounding & Temperature 0.0)                                  | (Token Generation Stream)
  v                                                                v
+------------------------------+                                 +------------------------------+
|       LLM API Engine         |                                 |      Client Viewport         |
+------------------------------+                                 +------------------------------+
  |
  v
+------------------------------+
|  Citation & Output Verifier  |
+------------------------------+
  |
  v
+------------------------------+
|      Client Viewport         |
+------------------------------+
```

### Subsystem Directory

* **LLM Engine:** Orchestrates generation loops. Relies on remote APIs (`gpt-4o` for vision/complex reasoning, `gpt-4o-mini` for fast classifications/suggestions).
* **Embedding Model:** Generates vector arrays using `text-embedding-3-large` (1536 dimensions).
* **Retriever Node:** Executes hybrid search queries, merging lexical (BM25) and semantic vector results using Reciprocal Rank Fusion (RRF).
* **Prompt Builder:** Compiles prompts dynamically based on active metadata definitions.
* **Context Builder:** Collects RAG chunks, prunes redundant information, and optimizes token distribution.
* **Conversation Memory:** Stores conversational history, using sliding context windows to manage token usage.
* **Knowledge Router:** Evaluates query embeddings to direct requests to the appropriate processing mode.
* **Citation Generator:** Maps output statements to metadata page numbers in the source documents.
* **Response Generator:** Manages SSE streams to deliver output tokens in real time.
* **Confidence Engine:** Calculates similarity scores to block or fallback low-confidence generations.
* **Evaluation Layer:** Monitors answer accuracy, context grounding, and citation precision.
* **Moderation Layer:** Screens inputs and outputs using guardrail models to block injection attempts and unsafe content.

---

## SECTION 2: Knowledge Priority

The RAG pipeline prioritizes source documents to ensure system outputs align with JCCAD's official documentation.

### Priority Hierarchy & Conflict Resolution

```
[1. Approved FAQ Collections] -> [2. Static Syllabi Files] -> [3. Crawled Site Markdown] -> [4. Company Profile Profile]
```

1. **Approved FAQ Collections (Rank 1):** Directly matching database Q&As represent established company definitions. If an FAQ match exists, it overrides other document sources.
2. **Static Uploaded Syllabi and Course Files (Rank 2):** PDF/DOCX course syllabi, fee schedules, and requirements files.
3. **Crawled Website Markdown (Rank 3):** Extracted public-facing page content. Contains marketing updates and news.
4. **Static Company Profile Profile (Rank 4):** Base JSON parameters defining active engineering domains, branches, and contact emails.
5. **General AI parametric knowledge (Rank 5):** Leveraged only when the query routes to General AI Mode.

#### Conflict Resolution Protocol
When retrieved chunks contain conflicting information (e.g., a 2025 syllabus states a fee is \$500, but a crawled 2026 page lists \$550), the system applies three sorting rules:
* **Recency:** Chunks extracted from documents with the latest modification timestamp override older contexts.
* **Authority Rank:** Official uploaded documents override crawled web pages if timestamps match.
* **Explicit Deprecation:** Chunks matching database soft-delete flags are excluded from the retrieval set.

---

## SECTION 3: Question Classification

Every user input passes through a classifier model to determine its intent and structure the subsequent processing steps.

### Intent Classification Flow Matrix

```
                          +---------------------------------------+
                          |              User Input               |
                          +---------------------------------------+
                                              |
                                              v
                          +---------------------------------------+
                          |       Llama Guard Moderation          |
                          +---------------------------------------+
                                              | Pass
                                              v
                          +---------------------------------------+
                          |   Automatic Question Classifier       |
                          +---------------------------------------+
                             |       |        |        |        |
                             |       |        |        |        +-----------------+
                             |       |        |        +---------------+          |
                             |       |        +------------+           |          |
                             v       v                     v           v          v
                       [Greeting] [General]             [Expert]   [Multimodal] [Unsupported]
                             |       |                     |           |          |
                             v       v                     v           v          v
                       Standard   General API           Retrieve    Multimodal  Safe Fallback
                       Response   Inference             & RAG       Vision LLM  Output
```

* **Greeting / Small Talk:** Simple greetings (e.g., "Hello", "Thank you"). Handled using standard templates to reduce LLM token usage.
* **Company Expert Query:** Queries containing terms related to JCCAD domains or services. Routed directly to the RAG pipeline.
* **General Query:** Broad questions (e.g., "Write a Python script for a matrix transpose"). Bypasses the RAG database, routing to the general reasoning model.
* **Multimodal / Vision Query:** User query accompanied by an image upload. Renders vision evaluation workflows.
* **Unsupported Query:** Queries containing out-of-bounds requests (e.g., credit card information, policy violations). Bypasses retrieval, returning a standardized safe fallback message.

---

## SECTION 4: Automatic Mode Selection

The platform automatically routes queries between **Company Expert Mode** and **General AI Mode** based on vector similarity scores.

```
                    +------------------------------------+
                    |             User Query             |
                    +------------------------------------+
                                       |
                                       v
                    +------------------------------------+
                    |   Cosine Similarity Evaluation     |
                    +------------------------------------+
                                       |
                     +-----------------+-----------------+
                     | >= 0.70                           | < 0.70
                     v                                   v
        +--------------------------+       +---------------------------+
        |   Company Expert Mode    |       |      General AI Mode      |
        +--------------------------+       +---------------------------+
        | 1. Query Embeddings      |       | 1. Bypasses Vector search |
        | 2. Hybrid RRF Retrieval  |       | 2. Standard System Prompt |
        | 3. Grounding Verification|       | 3. Set temperature to 0.7 |
        | 4. Strict Citations      |       |                           |
        | 5. Set temperature 0.0   |       |                           |
        +--------------------------+       +---------------------------+
```

### Threshold Action Boundaries
* **Cosine Match score $\ge 0.70$ (Auto-Expert):** Classifies query as JCCAD-focused. Restricts generation strictly to retrieved contexts.
* **Cosine Match score between $0.55$ and $0.69$ (Hybrid Suggestion):** Triggers a recommendation prompt in the chat bubble: *"Would you like to search JCCAD's official databases for this question?"* If the user declines, the query is processed in General AI Mode.
* **Cosine Match score $< 0.55$ (Auto-General):** Routes the query to General AI Mode without vector search checks.

---

## SECTION 5: Retrieval-Augmented Generation (RAG)

The end-to-end RAG pipeline implements a hybrid search approach combined with cross-encoder rerankers to optimize context retrieval.

```
[Query] -> [Embed API] -> [Hybrid Search (k-NN + BM25)] -> [RRF Conjunction] -> [Rerank] -> [LLM] -> [SSE Stream]
```

1. **Embedding Generation:** The query is vectorized using `text-embedding-3-large` (1536 dimensions).
2. **Parallel Retrieval:**
   * *Lexical Search:* Runs full-text indexes inside MongoDB using BM25 models.
   * *Semantic Search:* Runs k-NN vector similarity evaluations.
3. **Rank Conjunction (RRF):** Merges candidate lists using Reciprocal Rank Fusion (RRF) with parameter $k=60$.
4. **Reranking:** Passes the top 10 candidates to the Cohere Rerank API to select the top 4 contexts.
5. **Prompt Compilation:** Embeds the selected contexts into the dynamic system prompt.
6. **Inference & Stream:** Calls the model with a temperature configuration of `0.0`. Delivers tokens to the client browser via Server-Sent Events (SSE).

---

## SECTION 6: Prompt Engineering

CIP defines clear prompt templates, decoupling system configuration settings from prompt structures.

### Prompt Templates

#### 1. System Grounding Prompt (Company Expert Mode)
```
You are the official JCCAD Company Intelligence Assistant. JCCAD is a {{org_type}}.
Answer the user's question using ONLY the retrieved contexts below:

---
{% for chunk in chunks %}
[Source: {{chunk.metadata.source_file}}, Page: {{chunk.metadata.page_num}}]
{{chunk.chunk_text}}
---
{% endfor %}

Strict Grounding Rules:
1. Base your answer strictly on the provided contexts. Do not extrapolate.
2. If the context does not contain the answer, output: "I cannot find that information in JCCAD's files."
3. Format output citations as superscript indexes mapping directly to the matching context.
```

#### 2. General AI Mode Prompt
```
You are a helpful assistant. You may answer this question using general knowledge.
For questions specific to JCCAD, remind the user to switch to Company Expert Mode.
```

### Prompt Governance & Versioning
* Prompt configurations are version-controlled using semantic version tags (e.g., `prompt_expert_v1.0.3`).
* Prompts are stored in the database, allowing updates without requiring server redeployment.
* Updates must pass automated regression testing, verifying grounding accuracy before deployment.

---

## SECTION 7: Conversation Memory

CIP implements a sliding context window combined with a summarizing memory layer to manage token budgets.

```
[Active Message Input] --> [Recent Context (Last 8 Turns)] --> [Pruned Older Message Blocks]
                                                                     |
                                                                     v
                                                       [Summarizer Engine Wrapper]
                                                                     |
                                                                     v
                                                       [Appended Session Summary]
```

### Memory Options Analysis

| Memory Pattern | Token Footprint | Retrieval Performance | Operational Trade-offs |
| :--- | :--- | :--- | :--- |
| **Option A (Full Context Window)** | Exponentially increasing token costs. | High context retention. | High API latency and cost under extended usage. |
| **Option B (Sliding Window - Selected)** | **Fixed token size.** | **High for recent turns.** | **Loses context from older turns.** |
| **Option C (Summary Buffering)** | Medium token size. | Variable context retention. | Incurs summary generation latency. |

*Decision Justification:* We select **Option B (Sliding Window)** combined with a summary backup database. We store the last 8 conversation turns directly in the prompt context. Older messages are passed through a summarization worker and appended to the context as a single summary string. This preserves context continuity while managing token budgets.

---

## SECTION 8: Context Builder

The context builder compiles RAG chunks and user context into a single structured payload.

```
Total Token Budget: 8192 Tokens
   |
   +---> System Base Grounding Prompts (1024 Tokens)
   +---> sliding Chat Message History (2048 Tokens)
   +---> Reranked RAG context Blocks (4096 Tokens)
   +---> Available buffer space (1024 Tokens)
```

### Construction Rules
* **Deduplication:** Chunks with identical text content or hashes are excluded.
* **Permissible Role Access:** Chunks must match the user's validated RBAC tags.
* **Rerank Selection:** Selected contexts are sorted in descending order of similarity score.

---

## SECTION 9: Citation System

The citation service maps generated text sentences back to source document metadata.

```
LLM Generated Text: "CAD courses occur on Mondays [1]."
   |
   +---> Citation Pointer Map
          [1] => {
            doc_id: "doc_081",
            source_file: "Syllabus_CAD_Training.pdf",
            page_num: 3,
            location_uri: "s3://jccad-files/Syllabus_CAD_Training.pdf"
          }
```

* **Inline Mapping:** Chunks are formatted in the prompt using unique index markers. The LLM is instructed to append the matching context indices to sentences in the output.
* **Metadata Resolution:** The client parses inline superscript markers to display detailed source popovers with download links.

---

## SECTION 10: Confidence Engine

Calculates similarity scores to classify response confidence and trigger appropriate fallback workflows.

| Score Range | Classification | System Action | User-Facing Behavior |
| :--- | :--- | :--- | :--- |
| **$\ge 0.70$** | High | Normal stream pipeline. | Standard cited streaming response. |
| **$0.60$ to $0.69$** | Medium | Normal stream pipeline with warning. | Response appended with caution tag: *"Please verify details with support."* |
| **$< 0.60$** | Low / Unknown | Terminate search pipeline. | Fallback message: *"I cannot verify this detail. Please contact us at info@jccad.com."* |

---

## SECTION 11: Hallucination Prevention

To ensure information accuracy, the system enforces five grounding layers:

```
[Strict Prompt Grounding (Temp 0.0)] -> [Input Guardrails] -> [Context Relevancy Reranker] -> [Post-Generation Parser] -> [Verification check]
```

1. **System Prompt Grounding:** Restricts output space to retrieved contexts.
2. **Output Validation:** Post-generation parsers check that all output citations correspond to retrieved context files.
3. **Verification Check:** Evaluates sentence-level embeddings against context chunks. Sentences with similarity scores $< 0.70$ are removed from the response stream.

---

## SECTION 12: Image Understanding (Multimodal Processing)

Enables visual evaluations of uploaded blueprints, charts, or diagrams.

```
                    +------------------------------------+
                    |       User Image Upload            |
                    +------------------------------------+
                                       |
                                       v
                    +------------------------------------+
                    |        Image Type Classifier       |
                    +------------------------------------+
                             |                 |
                             v                 v
               [CAD Blueprint / Drawing]   [Scanned Text / PDF]
                             |                 |
                             v                 v
               +-----------------------+   +-----------------------+
               | Multimodal Model      |   | Ingest OCR Engine     |
               | (Structure evaluation)|   | (Text extraction)     |
               +-----------------------+   +-----------------------+
                             |                 |
                             +--------+--------+
                                      |
                                      v
                    +------------------------------------+
                    |    Append to chat context record   |
                    +------------------------------------+
```

* **Engineering Drawings:** Multimodal models evaluate mechanical layouts and CAD diagrams, returning text summaries of identified symbols, dimensions, and configurations.
* **Document Scans:** Scanned text page images run through an OCR process before vectorization.

---

## SECTION 13: Multilingual Support

CIP implements a dynamic translation pipeline to support multilingual queries:

```
[Non-English Query] -> [Detect Language] -> [Translate to English] -> [Perform RAG Search] -> [Generate response] -> [Translate to User Language]
```

* **Language Detection:** The system detects the user's language at the entry gateway using fast classification models.
* **Retrieval Translation:** Non-English queries are translated to English to run RAG search queries against the database.
* **Generation & Translation:** The final response is translated back to the user's language, preserving JCCAD terminology (such as domain names or course titles).

---

## SECTION 14: Response Generation

* **Streaming:** Delivers token stream outputs via Server-Sent Events (SSE).
* **Formatting:** Markdown rendering engine formats text arrays dynamically, supporting code blocks, lists, and tables.
* **Suggested Follow-up Questions:** Fast model instances compile context-relevant follow-up prompts based on the generated response.

---

## SECTION 15: AI Safety

CIP implements security policies to prevent prompt injection and protect sensitive data:

* **Injection Protection:** User input is isolated inside structural HTML/XML tag markers.
* **Content Filtering:** Out-of-bounds queries or unsafe request payloads are blocked at the gateway level.
* **Role Restrictions:** Vector searches filter database records based on the user's role authentication token.

---

## SECTION 16: Evaluation Framework

The system evaluations are based on RAG Triad frameworks:

```
                  +---------------------------------------+
                  |              User Query               |
                  +---------------------------------------+
                   /                                     \
                  /                                       \
                 v                                         v
+-----------------------------+             +-----------------------------+
|        Groundedness         |             |      Answer Relevance       |
|    (Response vs Context)    |             |     (Response vs Query)     |
+-----------------------------+             +-----------------------------+
                 \                                         /
                  \                                       /
                   v                                     v
                  +---------------------------------------+
                  |           Context Relevance           |
                  |          (Context vs Query)           |
                  +---------------------------------------+
```

### Metrics Target Thresholds
* **Groundedness Score:** Target $\ge 98\%$ accuracy. Verifies that generated answers do not contain claims outside the retrieved contexts.
* **Context Relevance:** Target $\ge 95\%$. Evaluates search precision.
* **Answer Relevance:** Target $\ge 95\%$. Verifies that generated responses directly address user questions.

---

## SECTION 17: Observability & Telemetry

* **Telemetry Logs:** Exposes AI performance metrics (API latency, token usage, routing accuracy) at `/metrics` to be scraped by Prometheus.
* **Alerting:** Configures alerts in Prometheus Alertmanager to notify engineers of critical failures (such as latency spikes $> 2$s or fallback triggers $> 5\%$).

---

## SECTION 18: Future AI Roadmap

* **Reasoning Models:** Transition complex CAD engineering evaluations to reasoning models (e.g., GPT-o1).
* **AI Agents:** Integrate function-calling capabilities to allow the chatbot to perform actions (such as booking workshops or creating course registrations) in internal CRM systems.

---
*(End of AI Engineering Blueprint)*
