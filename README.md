# JCCAD Company Intelligence Platform (CIP)

An enterprise-ready Company Intelligence Platform and Conversational Chatbot designed for **JCCAD Software Solutions**. The platform combines Retrieval-Augmented Generation (RAG), semantic search, document intelligence, and conversational AI to provide accurate, company-specific answers (e.g. course offerings, training schedules, software expertise) while also supporting general AI queries.

---

## Overview

The JCCAD Company Intelligence Platform (CIP) allows users to query company information, CAD training schedules, course syllabi, engineering solutions, contact channels, and branches. It acts as an automated, grounded customer support representative that responds to queries professionally while hiding any internal AI terminology or retrieval implementation details from the user.

---

## Features

- **Dual LLM Provider Support:** Dynamically routes queries to **Google Gemini** (using Google AI Studio keys) or **Groq** (using Llama 3 models like `llama-3.1-8b-instant`) based on the API key type.
- **Enterprise Grounded Responses:** Implements strict system prompts to prevent AI hallucinations and keep answers naturally framed as a company representative.
- **Simulated Offline Fallback:** If the external APIs are misconfigured or offline, the platform degrades gracefully to a simulated responsive mode using local knowledge base facts.
- **Hybrid RAG Retrieval Engine:** Combines vector search embeddings and BM25 lexical scores using Reciprocal Rank Fusion (RRF) for top-quality search rankings.
- **Pronoun & Coreference Resolution:** Expanded query parser tracks previous message history to resolve pronouns (e.g., "they", "it") in multi-turn conversations.
- **Zero AI-leak UX:** Completely filters out citations, chunks, databases, and LLM terms from customer-facing message bubbles and chat history.
- **Full Test Suite:** 47 unit and integration tests covering RAG routing, parser, vector embeddings, and conversation state manager using Vitest.

---

## Technology Stack

- **Monorepo Manager:** npm Workspaces
- **Frontend client:** React (v18), Vite, Tailwind CSS, Axios, React Router, React Hook Form, Zod
- **Backend server:** Express.js, TypeScript, Mongoose (MongoDB ODM), dotenv, MongoDB
- **Shared packages:** Common TypeScript mappings and schemas
- **Testing:** Vitest

---

## Folder Structure

```text
jccad_chatbot/
├── client/                  # Frontend React SPA
│   ├── src/
│   │   ├── components/      # Chat components (Composer, MessageList, Sidebar)
│   │   ├── pages/           # Page routes (ChatWorkspace, Dashboards)
│   │   └── services/        # Event stream API clients
│   ├── vite.config.ts       # Vite config
│   └── package.json
├── server/                  # Backend Express API Server
│   ├── src/
│   │   ├── config/          # Configurations
│   │   ├── controllers/     # Route handlers (Orchestration, Retrieval, Vector)
│   │   ├── models/          # MongoDB Mongoose Schemas (Conversation, VectorRecord)
│   │   ├── routes/          # API endpoint routes
│   │   ├── utils/           # Database seeder and utilities
│   │   └── index.ts         # Server entry point
│   ├── tests/               # Unit and integration test suites (Vitest)
│   └── package.json
├── shared/                  # Common typescript interfaces & types
├── tsconfig.json            # Root TS configuration
└── package.json             # Root monorepo workspace dependencies
```

---

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB running locally or an Atlas connection URI

### 1. Install dependencies
From the root directory, run:
```bash
npm install
```

### 2. Configure Environment Variables
Copy the env example template to `.env` in the `server` directory:
```bash
cp server/.env.example server/.env
```
Fill in the configuration fields in `server/.env`:
- Set `GEMINI_API_KEY` to a valid Gemini key (typically starts with `AIzaSy`).
- Alternatively, set it to a valid Groq API key (starts with `gsk_`) to use Groq Llama 3 completions.

---

## Running the Project

### Start both Client and Server in Development Mode
Run from the root workspace directory:
```bash
npm run dev
```
- **Frontend Client:** Available at [http://localhost:5173](http://localhost:5173)
- **Backend API Server:** Available at [http://localhost:5000](http://localhost:5000)

### Running Tests
Run Vitest execution for server files:
```bash
npm run test
```

### Build Instructions
Build client assets and compile backend typescript:
```bash
npm run build
```

---

## Company Information

**JCCAD Software Solutions**
Engineering, Technology & Skill Development Hub

### Services
- CAD Training
- CAD Design Services
- Engineering Design & Product Development
- Website Design & Development
- Technology Solutions
- Research & Development (R&D)
- Engineering Consultancy
- Internship Programs
- Corporate Training

### Software Expertise
- AutoCAD
- CATIA
- SolidWorks
- Siemens NX
- PTC Creo
- Fusion 360
- ANSYS

### Industries Served
- Automotive
- Mechanical
- Manufacturing
- Educational Institutions
- Startups
- MSMEs
- Design Solutions (Drafting to Design)

---

## Future Roadmap

- **Multi-document Indexer:** Add support for dynamic PDF, DOCX, and CSV uploading and semantic chunking.
- **Interactive Visual Knowledge Graph:** Map and render knowledge entities in a dashboard graph view for administrators.
- **Enhanced Role-Based Access Control (RBAC):** Restrict indexing actions to administrative groups via SSO.
- **OCR-based document understanding**
- **AI Agent & Skills Framework**
- **Voice interaction**
- **Real-time document synchronization**
- **Enterprise analytics**

---

## License

This project is licensed under the MIT License.

---

## Author

- **VISHWANDH-7777** (GitHub: [VISHWANDH-7777](https://github.com/VISHWANDH-7777))
