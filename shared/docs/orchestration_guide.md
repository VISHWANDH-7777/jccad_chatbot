# AI Orchestration Platform Integration Manual
## JCCAD Company Intelligence Platform (CIP)

---

## 1. Request Pipeline Flow

The AI Orchestration layer manages requests through the following pipeline:

```
[Client Trigger /chat (Bearer JWT)]
              |
              v
[Verify Token & Parse User Profile]
              |
              v
[Lookup Conversation history in DB]
              |
              v
[Invoke Retrieval Engine with Query]
- Checks permissions on matching vector segments.
- Packages grounding contexts within a 1500-token budget.
              |
              v
[Compile Prompt Template]
- Injects safety rules, chat history, and retrieved grounding context.
              |
              v
[Invoke Model Provider (OpenAI/Anthropic)]
- Streams token chunks back using SSE headers.
- Automatically routes to fallback models if primary endpoint fails.
              |
              v
[Append assistant reply to DB conversation thread & close stream]
```

---

## 2. Dynamic Grounding Prompt Injection

System prompts use a templated format:

```
You are the JCCAD Company Intelligence Platform Assistant.
Use the following grounding context blocks to answer the user query...

GROUNDING CONTEXT:
[1] (Source: FAQs Document) JCCAD mechatronics labs are open Mon-Fri 8am-6pm.
[2] (Source: Profile Document) JCCAD was founded in 2020.
```

The retrieval citations are mapped to superscript indexes (e.g. `[1]`, `[2]`), helping the client render clickable links to source documents.

---

## 3. Fallback Model Router Configuration

To ensure service availability:
* **Primary model:** `gpt-4o` (OpenAI).
* **Fallback model:** `claude-3-haiku` (Anthropic).
* **Execution:** If calls to the primary provider fail or timeout, the routing engine automatically redirects queries to the fallback model. This switch is logged to the security audit trail.
