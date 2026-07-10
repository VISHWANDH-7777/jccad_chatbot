import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { searchRetrieval } from './retrieval';
import {
  appendMessagesToConversation,
  ensureConversation,
  getConversationForUser,
  listConversationHistory,
  recordAuditLog
} from '../services/chatPersistence';

// Strict System Prompt template configuration for Company Queries
const SYSTEM_PROMPT_JCCAD = `
You are a helpful and professional customer support representative for JCCAD Software Solutions.

Your answers regarding JCCAD Software Solutions must be based on the provided company facts. Prioritize these facts to answer questions accurately.

CRITICAL CONSTRAINTS:
1. Answer naturally, professionally, and directly.
2. Never mention or reference internal AI terminology, such as "grounding context", "retrieved context", "knowledge base", "chunks", "database", or "system prompts".
3. Never use inline citation indices, reference numbers, or brackets (e.g., "[1]", "[2]") in your responses unless the user explicitly requests source referencing.
4. If the provided company facts do not contain the information required to answer the user's question, state professionally: "That information is not currently available in the official company information." or "I couldn't find official information about that." Offer to have them contact JCCAD support directly if appropriate. Do not speculate or assume details.

Company Facts:
{{grounding_context}}
`;

const SYSTEM_PROMPT_GENERAL = `
You are a helpful and professional customer support representative for JCCAD Software Solutions.
Answer general questions (e.g., general programming, technology concepts) accurately and concisely using your pre-trained knowledge.
If the user asks about JCCAD Software Solutions, prioritize the provided company facts to answer.

CRITICAL CONSTRAINTS:
1. Answer naturally, professionally, and directly.
2. Never mention or reference internal AI terminology, such as "grounding context", "retrieved context", "knowledge base", "chunks", "database", or "system prompts".
3. Never use inline citation indices, reference numbers, or brackets (e.g., "[1]", "[2]") in your responses unless the user explicitly requests source referencing.
4. If asked about JCCAD and the facts are insufficient, state professionally that the information is currently unavailable.

Company Facts:
{{grounding_context}}
`;

// Active selected model configuration (defaults to gemini-2.5-flash)
export let ACTIVE_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export const initializeGeminiModel = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[GEMINI CONFIG] GEMINI_API_KEY environment variable is not defined. Using default model configuration.');
    return;
  }

  if (apiKey.startsWith('gsk_')) {
    console.log('[GROQ CONFIG] Detected Groq API key. Groq model provider successfully initialized.');
    return;
  }

  const preferredModels = [
    process.env.GEMINI_MODEL,
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-flash-latest'
  ].filter(Boolean) as string[];

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) {
      throw new Error(`Failed to query model list: ${res.statusText}`);
    }
    const data = await res.json();
    const availableModels = (data.models || []).map((m: any) => m.name.replace('models/', ''));

    // Try to find the first preferred model that is available
    let matchedModel = '';
    for (const pref of preferredModels) {
      if (availableModels.includes(pref)) {
        matchedModel = pref;
        break;
      }
    }

    if (matchedModel) {
      ACTIVE_GEMINI_MODEL = matchedModel;
      console.log(`[GEMINI CONFIG] Successfully validated and selected Gemini model: "${ACTIVE_GEMINI_MODEL}"`);
    } else {
      // Fallback to the first available model that supports generateContent
      const generateContentModel = data.models.find((m: any) => 
        m.supportedGenerationMethods?.includes('generateContent')
      );
      if (generateContentModel) {
        ACTIVE_GEMINI_MODEL = generateContentModel.name.replace('models/', '');
        console.log(`[GEMINI CONFIG] Configured model not available. Auto fell back to: "${ACTIVE_GEMINI_MODEL}"`);
      } else {
        console.warn(`[GEMINI CONFIG] No models supporting generateContent were found. Defaulting to: "${ACTIVE_GEMINI_MODEL}"`);
      }
    }
  } catch (err: any) {
    console.error(`[GEMINI CONFIG] Error during Gemini model validation:`, err.message);
    console.log(`[GEMINI CONFIG] Retaining default model configuration: "${ACTIVE_GEMINI_MODEL}"`);
  }
};

// Dynamic Follow-up Question generator helper
const generateFollowUpQuestions = (query: string): string[] => {
  const normalized = query.toLowerCase();
  const jccadRelated = normalized.includes('jccad') || 
                       normalized.includes('services') || 
                       normalized.includes('software') || 
                       normalized.includes('cad') || 
                       normalized.includes('intern') ||
                       normalized.includes('contact') ||
                       normalized.includes('training') ||
                       normalized.includes('consult') ||
                       normalized.includes('client');
                       
  if (jccadRelated || query.trim() === '') {
    return [
      "Tell me about JCCAD",
      "What services do you provide?",
      "What CAD software do you teach?",
      "Do you provide internships?",
      "Tell me about your engineering consultancy.",
      "How can I contact JCCAD?",
      "Explain your CAD training.",
      "Who are your clients?"
    ];
  }
  return [
    `Tell me more about ${query.substring(0, 20)}...`,
    `What are the policies related to this?`,
    `Can you list the prerequisites?`
  ];
};

const generateOfflineResponse = (query: string, intent: string, contextChunks: any[]): string => {
  if (intent === 'Greeting') {
    return `Hello! Welcome to JCCAD Software Solutions. How can I help you today?`;
  }

  if (intent === 'CompanyQuery') {
    if (contextChunks && contextChunks.length > 0) {
      let response = '';
      contextChunks.forEach((chunk) => {
        response += `${chunk.content}\n\n`;
      });
      return response.trim();
    } else {
      return `I couldn't find official information matching your request. If you'd like, you can contact JCCAD directly through their official website or email for this information.`;
    }
  }

  // GeneralAI
  const normalized = query.toLowerCase();
  if (normalized.includes('react')) {
    return `React is a popular open-source front-end JavaScript library developed by Meta for building user interfaces based on components. It promotes a declarative programming model and utilizes a virtual DOM for efficient updates.`;
  } else if (normalized.includes('java')) {
    return `Java is a high-level, class-based, object-oriented programming language designed to have as few implementation dependencies as possible, enabling developers to "write once, run anywhere" (WORA).`;
  } else if (normalized.includes('ai') || normalized.includes('intelligence') || normalized.includes('model')) {
    return `Artificial Intelligence (AI) refers to the simulation of human intelligence in machines. Modern AI relies heavily on Deep Learning and Large Language Models (LLMs) to parse, generate, and reason over natural language.`;
  } else {
    return `That information is not currently available in the official company information.`;
  }
};

export const streamChat = async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();
  const { query, conversationId } = req.body;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  console.log(`[ORCHESTRATION] [${new Date().toISOString()}] Incoming Question: "${query}" (Conversation ID: ${conversationId || 'new'})`);

  if (!query) {
    console.error(`[ORCHESTRATION] [${new Date().toISOString()}] Error: Query parameter is required`);
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  // Configure Server-Sent Events (SSE) headers for real-time chunk streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let activeModelName = ACTIVE_GEMINI_MODEL;
  let conversation: any = null;

  try {
    if (conversationId) {
      conversation = await getConversationForUser(user.id, conversationId);
    }

    conversation = await ensureConversation(user.id, conversationId || null);

    // Call Retrieval Engine
    // Coreference Resolution: check if query contains company pronouns and history has JCCAD context
    let queryForRetrieval = query;
    if (conversation && conversation.messages && conversation.messages.length > 0) {
      const hasJCCADContext = conversation.messages.some((m: any) => 
        m.content.toLowerCase().includes('jccad') || m.content.toLowerCase().includes('they') || m.content.toLowerCase().includes('them')
      );
      
      if (hasJCCADContext) {
        const lowerQuery = query.toLowerCase();
        const pronouns = ['they', 'them', 'their', 'it', 'its', 'he', 'she', 'company', 'organization', 'hub', 'agency', 'firm'];
        const companyKeywords = ['services', 'software', 'teach', 'learn', 'courses', 'internship', 'training', 'contact', 'email', 'website', 'vision', 'mission', 'about', 'who', 'what'];
        
        const needsExpansion = pronouns.some(p => new RegExp(`\\b${p}\\b`).test(lowerQuery)) || 
                               companyKeywords.some(k => lowerQuery.includes(k));
                               
        if (needsExpansion && !lowerQuery.includes('jccad')) {
          queryForRetrieval = `${query} JCCAD`;
          console.log(`[COREFERENCE RESOLUTION] Expanded retrieval query to: "${queryForRetrieval}"`);
        }
      }
    }

    // For local tests, we mock the Express routing parameters call to searchRetrieval controller
    const mockRes: any = {
      status: () => ({
        json: (payload: any) => payload
      })
    };
    
    // Simulate call to searchRetrieval handler
    const reqMock: any = {
      query: { q: queryForRetrieval },
      user,
      ip: ipAddress,
      headers: req.headers
    };

    let retrievalResult;
    try {
      // Mock lookup call to local search
      const allResults = await searchRetrieval(reqMock, mockRes as any);
      retrievalResult = allResults as any;
    } catch (err) {
      // Fallback model triggered on retrieval failures
      activeModelName = ACTIVE_GEMINI_MODEL;
      retrievalResult = { contextChunks: [], citations: [], totalTokensUsed: 0, intent: 'Unsupported' as any };
    }

    console.log(`[ORCHESTRATION] [${new Date().toISOString()}] Retriever Result: Found ${retrievalResult.contextChunks?.length || 0} grounding chunks. Total tokens used: ${retrievalResult.totalTokensUsed}`);

    // Compile dynamic Prompt
    const groundingContextText = (retrievalResult.contextChunks || [])
      .map((c: any, idx: number) => `[${idx + 1}] (Source: ${c.category}) ${c.content}`)
      .join('\n\n');

    // Select the prompt template dynamically based on intent
    const systemPromptTemplate = (retrievalResult.intent === 'CompanyQuery') ? SYSTEM_PROMPT_JCCAD : SYSTEM_PROMPT_GENERAL;
    const compiledSystemPrompt = systemPromptTemplate.replace('{{grounding_context}}', groundingContextText);
    console.log(`[ORCHESTRATION] [${new Date().toISOString()}] Prompt Built:\n--- SYSTEM PROMPT ---\n${compiledSystemPrompt.trim()}\n----------------------`);

    // Save user message to thread
    const currentMessages = [
      ...conversation.messages,
      {
        role: 'user',
        content: query,
        timestamp: new Date().toISOString()
      }
    ];

    await appendMessagesToConversation(user.id, conversation._id, [{
      role: 'user',
      content: query,
      timestamp: new Date().toISOString()
    }]);

    // Map conversation message history to Gemini API format (role must be 'user' or 'model')
    const contents = currentMessages
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    let accumulatedText = '';
    let isClientDisconnected = false;

    req.on('close', () => {
      isClientDisconnected = true;
    });

    const apiKey = process.env.GEMINI_API_KEY;
    let useOfflineFallback = false;
    let fallbackText = '';
    let response: any = null;
    let isGroq = apiKey && apiKey.startsWith('gsk_');

    if (!apiKey) {
      console.warn('[ORCHESTRATION] GEMINI_API_KEY is not defined. Using offline simulator.');
      useOfflineFallback = true;
      fallbackText = generateOfflineResponse(query, retrievalResult.intent, retrievalResult.contextChunks || []);
    } else if (isGroq) {
      const endpoint = 'https://api.groq.com/openai/v1/chat/completions';
      const messages = [
        {
          role: 'system',
          content: compiledSystemPrompt
        },
        ...conversation.messages
          .filter((m: any) => m.role === 'user' || m.role === 'assistant')
          .map((m: any) => ({
            role: m.role,
            content: m.content
          }))
      ];

      const llmRequestPayload = {
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        messages,
        stream: true
      };

      console.log(`[ORCHESTRATION] [${new Date().toISOString()}] Groq Request payload: ${JSON.stringify(llmRequestPayload)}`);

      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(llmRequestPayload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`[ORCHESTRATION] Groq API call failed with status ${response.status}: ${errorText}. Falling back to offline simulator.`);
          useOfflineFallback = true;
          fallbackText = generateOfflineResponse(query, retrievalResult.intent, retrievalResult.contextChunks || []);
        }
      } catch (err: any) {
        console.warn(`[ORCHESTRATION] Groq API fetch threw error: ${err.message}. Falling back to offline simulator.`);
        useOfflineFallback = true;
        fallbackText = generateOfflineResponse(query, retrievalResult.intent, retrievalResult.contextChunks || []);
      }
    } else {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModelName}:streamGenerateContent?key=${apiKey}`;

      const llmRequestPayload = {
        contents,
        systemInstruction: {
          parts: [{ text: compiledSystemPrompt }]
        }
      };

      console.log(`[ORCHESTRATION] [${new Date().toISOString()}] LLM Request payload: ${JSON.stringify(llmRequestPayload)}`);

      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(llmRequestPayload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`[ORCHESTRATION] Gemini API call failed with status ${response.status}: ${errorText}. Falling back to offline simulator.`);
          useOfflineFallback = true;
          fallbackText = generateOfflineResponse(query, retrievalResult.intent, retrievalResult.contextChunks || []);
        }
      } catch (err: any) {
        console.warn(`[ORCHESTRATION] Gemini API fetch threw error: ${err.message}. Falling back to offline simulator.`);
        useOfflineFallback = true;
        fallbackText = generateOfflineResponse(query, retrievalResult.intent, retrievalResult.contextChunks || []);
      }
    }

    if (useOfflineFallback) {
      const chunkSize = 15;
      let offset = 0;
      while (offset < fallbackText.length) {
        if (isClientDisconnected) break;
        const chunk = fallbackText.substring(offset, offset + chunkSize);
        accumulatedText += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        offset += chunkSize;
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
    } else {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      if (!reader) {
        throw new Error('Readable stream not supported by server response');
      }

      let buffer = '';

      if (isGroq) {
        while (true) {
          if (isClientDisconnected) break;
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;
            if (cleanLine === 'data: [DONE]') continue;
            if (cleanLine.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(cleanLine.substring(6));
                const chunkText = parsed.choices?.[0]?.delta?.content || '';
                if (chunkText) {
                  accumulatedText += chunkText;
                  res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
                }
              } catch (e) {
                // Ignore incomplete json chunks
              }
            }
          }
        }
      } else {
        // Stateful brace-counting parser to extract JSON objects from pretty-printed or chunked JSON stream
        let depth = 0;
        let inString = false;
        let escape = false;
        let startIdx = -1;

        while (true) {
          if (isClientDisconnected) break;

          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let i = 0;
          while (i < buffer.length) {
            const char = buffer[i];
            if (escape) {
              escape = false;
              i++;
              continue;
            }
            if (char === '\\') {
              escape = true;
              i++;
              continue;
            }
            if (char === '"') {
              inString = !inString;
              i++;
              continue;
            }
            if (!inString) {
              if (char === '{') {
                if (depth === 0) {
                  startIdx = i;
                }
                depth++;
              } else if (char === '}') {
                depth--;
                if (depth === 0 && startIdx !== -1) {
                  const objStr = buffer.substring(startIdx, i + 1);
                  try {
                    const parsed = JSON.parse(objStr);
                    const chunkText = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    if (chunkText) {
                      accumulatedText += chunkText;
                      res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
                    }
                  } catch (err) {
                    // Ignore parse errors on incomplete structures
                  }
                  // Consume the processed object from buffer
                  buffer = buffer.substring(i + 1);
                  i = 0;
                  startIdx = -1;
                  continue;
                }
              }
            }
            i++;
          }
        }

        // Process any remaining characters in the buffer
        if (buffer.trim()) {
          try {
            const cleanBuffer = buffer.trim();
            // Fallback simple parsing if any object structure was left incomplete but valid
            if (cleanBuffer.startsWith('{') && cleanBuffer.endsWith('}')) {
              const parsed = JSON.parse(cleanBuffer);
              const chunkText = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (chunkText) {
                accumulatedText += chunkText;
                res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
              }
            }
          } catch (err) {
            // Ignore
          }
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[ORCHESTRATION] [${new Date().toISOString()}] LLM Response successfully accumulated (${accumulatedText.length} chars). Duration: ${duration}ms`);
    console.log(`[ORCHESTRATION] [${new Date().toISOString()}] LLM Response content:\n${accumulatedText}\n----------------------`);

    if (!isClientDisconnected) {
      const followUp = generateFollowUpQuestions(query);

      // Save assistant response to conversation thread
        await appendMessagesToConversation(user.id, conversation._id, [{
        role: 'assistant',
        content: accumulatedText,
        timestamp: new Date().toISOString(),
        citations: retrievalResult.citations
        }]);

      // Send termination metadata and suggestions
      res.write(
        `data: ${JSON.stringify({
          done: true,
          conversationId: conversation._id.toString(),
          followUp
        })}\n\n`
      );

      await recordAuditLog({
        userId: user.id,
        action: 'orchestration:stream_chat',
        resource: conversation._id.toString(),
        ipAddress,
        userAgent,
        status: 'success',
        details: `Model: Gemini 1.5 Flash. Cost: $0.00`
      });
    }

    res.end();
  } catch (err: any) {
    const duration = Date.now() - startTime;
    console.error(`[ORCHESTRATION] [${new Date().toISOString()}] Orchestration error occurred after ${duration}ms:`, err);
    res.write(`data: ${JSON.stringify({ error: 'That information is not currently available.' })}\n\n`);
    res.end();
  }
};

export const getConversationHistory = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  try {
    const history = await listConversationHistory(user.id);
    // Filter out internal citations metadata from messages
    const cleanedHistory = history.map((conv: any) => {
      const messages = conv.messages.map((msg: any) => {
        const msgObj = msg.toObject ? msg.toObject() : msg;
        delete msgObj.citations;
        return msgObj;
      });
      const convObj = conv.toObject ? conv.toObject() : conv;
      convObj.messages = messages;
      return convObj;
    });
    return res.status(200).json({ history: cleanedHistory });
  } catch (err: any) {
    console.error('[ORCHESTRATION] getConversationHistory failed:', err);
    return res.status(500).json({ error: 'Error fetching conversation thread history' });
  }
};
