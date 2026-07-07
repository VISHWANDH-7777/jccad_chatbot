# JCCAD Company Intelligence Platform (CIP)

An enterprise-grade AI-powered Company Intelligence Platform built for **JCCAD Software Solutions**. The platform combines Retrieval-Augmented Generation (RAG), semantic search, document intelligence, and conversational AI to provide accurate, company-specific answers while also supporting general AI queries.

---

## Overview

The JCCAD Company Intelligence Platform is designed to serve as an intelligent assistant for students, professionals, employees, and customers. It provides information about JCCAD's services, training programs, engineering solutions, internships, and technology offerings using an enterprise AI architecture.

---

## Features

- AI-powered conversational chatbot
- Company-specific knowledge retrieval (RAG)
- General AI question answering
- Semantic document search
- Company profile management
- PDF, DOCX and PPT knowledge ingestion
- Website content indexing
- Conversation history
- Session memory
- Suggested follow-up questions
- Source-aware responses
- Admin dashboard
- Knowledge base management
- Responsive ChatGPT-like interface
- Future-ready AI Skills Framework

---

## Technology Stack

### Frontend

- React
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query

### Backend

- Node.js
- Express.js
- TypeScript

### Database

- MongoDB

### AI

- Gemini API
- Retrieval-Augmented Generation (RAG)
- Semantic Search
- Embedding Pipeline
- Vector Database

---

## Project Structure

```
jccad_chatbot/
│
├── client/
├── server/
├── shared/
├── docs/
├── assets/
├── README.md
└── package.json
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/VISHWANDH-7777/jccad_chatbot.git
```

Install dependencies:

```bash
npm install
```

Install workspace dependencies if applicable:

```bash
npm install --workspaces
```

---

## Environment Variables

Create a `.env` file based on `.env.example`.

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=your_model_name
```

---

## Run the Project

Development:

```bash
npm run dev
```

Backend:

```bash
npm run dev --workspace server
```

Frontend:

```bash
npm run dev --workspace client
```

---

## Roadmap

- Complete enterprise RAG pipeline
- Enhanced AI orchestration
- Multi-model AI support
- Analytics dashboard
- AI Skills Framework
- Website widget
- Production deployment
- Enterprise monitoring
- CI/CD pipeline

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

## License

This project is intended for educational, research, and internal organizational use unless otherwise specified.

---

GitHub:
https://github.com/VISHWANDH-7777

---

## Future Enhancements

- Enterprise Authentication
- Multi-language Support
- OCR-based document understanding
- AI Agent Framework
- Voice interaction
- Real-time document synchronization
- Enterprise analytics
- Advanced permission management
