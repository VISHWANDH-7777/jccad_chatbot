# Enterprise Conversation Platform Integration Manual
## JCCAD Company Intelligence Platform (CIP)

---

## 1. Conversational Lifecycle States

The KEP coordinates user queries, histories, file uploads, and stream parsers:

```
[Create Conversation Thread]
              |
              v
[User Message Uploaded] -------------> Sends text and attachments in FormData format.
              |
              v
[Invoke Stream Generator (SSE)] ------> Emits token chunks and citation links.
              |
              v
[Check Client Disconnect] -----------> Terminate token generation immediately if 
                                       user closes connection or clicks Stop.
              |
              v
[Save Thread & Append Ratings] -------> Log thumbs-up/down ratings and save thread.
```

---

## 2. Dynamic Citation Card Rendering

To maintain transparency, citation metadata returned from the RAG engine is displayed as a card stack:

```
+--------------------------------------------------------+
| Assistant Answer Text                                  |
| "Quadcopter drones require mechatronics courses... [1]"|
+--------------------------------------------------------+
  |
  +--- [1] (Source: FAQs Document) Syllabus details for UAV 2026.
```

* **Clickable Sources:** Users can click citations to view source file names, versions, and categories.

---

## 3. Streaming Interruptions (Abort Controllers)

The frontend client manages generation cycles using standard Abort Controllers:

```
                      +------------------------------------+
                      |     Initialize AbortController     |
                      +------------------------------------+
                                         |
                                         v
                      +------------------------------------+
                      |       Fetch API chat request       |
                      +------------------------------------+
                                         |
                     +-----------------+-----------------+
                     | Cancel Action                     | Stream Complete
                     v                                   v
        +--------------------------+       +---------------------------+
        | 1. Execute abort()       |       | 1. Clear AbortController  |
        | 2. Terminate connection  |       | 2. Save history records   |
        | 3. Terminate generation  |       |                           |
        +--------------------------+       +---------------------------+
```
