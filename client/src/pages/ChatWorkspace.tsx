import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { ChatSidebar } from '../components/ChatSidebar';
import { ChatMessageList } from '../components/ChatMessageList';
import { ChatComposer } from '../components/ChatComposer';
import { ConversationSummary } from '../../../shared/types/conversation';
import { ChatMessage } from '../../../shared/types/orchestration';
import { executeChatStream } from '../services/chatStream';

export const ChatWorkspace: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchHistoryList = async () => {
    try {
      const res = await axios.get<{ conversations: ConversationSummary[] }>('/api/v1/conversations', {
        withCredentials: true
      });
      setConversations(res.data.conversations);
    } catch (err) {
      // Silent error fallback
    }
  };

  useEffect(() => {
    fetchHistoryList();
  }, []);

  const loadConversationMessages = async (id: string) => {
    setActiveId(id);
    setMessages([]);
    setSuggestions([]);
    try {
      const res = await axios.get<{ history: any[] }>('/api/v1/orchestration/history', {
        withCredentials: true
      });
      const currentThread = res.data.history.find((t) => t._id === id);
      if (currentThread) {
        setMessages(currentThread.messages);
      }
    } catch (err) {
      // Fallback
    }
  };

  const handleCreate = async () => {
    try {
      const res = await axios.post<{ conversation: any }>('/api/v1/conversations', {}, { withCredentials: true });
      const nextThread = res.data.conversation;
      setActiveId(nextThread._id);
      setMessages([]);
      setSuggestions([]);
      fetchHistoryList();
    } catch (err) {
      // Fallback
    }
  };

  const handleRename = async (id: string, title: string) => {
    try {
      await axios.put(`/api/v1/conversations/${id}/rename`, { title }, { withCredentials: true });
      fetchHistoryList();
    } catch (err) {
      // Fallback
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this thread?')) return;
    try {
      await axios.delete(`/api/v1/conversations/${id}`, { withCredentials: true });
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
      fetchHistoryList();
    } catch (err) {
      // Fallback
    }
  };

  const handleSend = async (queryText: string, imageFile: File | null) => {
    if (isGenerating) return;

    let targetThreadId = activeId;
    if (!targetThreadId) {
      try {
        const res = await axios.post<{ conversation: any }>('/api/v1/conversations', {}, { withCredentials: true });
        targetThreadId = res.data.conversation._id;
        setActiveId(targetThreadId);
        await fetchHistoryList();
      } catch (err) {
        return;
      }
    }

    setIsGenerating(true);
    setSuggestions([]);
    
    // Optimistic local UI updates
    const userMsg: ChatMessage = {
      role: 'user',
      content: queryText,
      timestamp: new Date().toISOString()
    };
    
    setMessages((prev) => [...prev, userMsg]);

    const placeholderAssistantMsg: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    };
    
    setMessages((prev) => [...prev, placeholderAssistantMsg]);

    // Setup abort controls
    abortControllerRef.current = new AbortController();

    let accumulatedContent = '';

    await executeChatStream(
      queryText,
      targetThreadId,
      (payload) => {
        if (payload.chunk) {
          accumulatedContent += payload.chunk;
          setMessages((prev) => {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: accumulatedContent
              };
            }
            return updated;
          });
        }

        if (payload.done) {
          setIsGenerating(false);
          if (payload.followUp) setSuggestions(payload.followUp);
          if (payload.citations) {
            setMessages((prev) => {
              const updated = [...prev];
              if (updated.length > 0) {
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  citations: payload.citations
                };
              }
              return updated;
            });
          }
          fetchHistoryList();
        }

        if (payload.error) {
          setIsGenerating(false);
          setMessages((prev) => {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[updated.length - 1] = {
                role: 'assistant',
                content: payload.error,
                timestamp: new Date().toISOString()
              };
            }
            return updated;
          });
        }
      },
      abortControllerRef.current.signal
    );
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  const handleFeedback = async (msgIndex: number, rating: 'up' | 'down') => {
    if (!activeId) return;
    try {
      await axios.post(`/api/v1/conversations/${activeId}/feedback`, {
        messageIndex: msgIndex,
        rating
      }, { withCredentials: true });
    } catch (err) {
      // Fallback
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={loadConversationMessages}
        onRename={handleRename}
        onDelete={handleDelete}
        onCreate={handleCreate}
      />

      <div className="flex-grow flex flex-col h-full overflow-hidden">
        {/* Main conversation stream window */}
        <ChatMessageList
          messages={messages}
          isGenerating={isGenerating}
          onFeedback={handleFeedback}
          onSuggestionClick={(text) => handleSend(text, null)}
          suggestions={suggestions}
        />

        {/* Dynamic Composer Area */}
        <ChatComposer
          onSend={handleSend}
          isGenerating={isGenerating}
          onStop={handleStop}
        />
      </div>
    </div>
  );
};
export default ChatWorkspace;
