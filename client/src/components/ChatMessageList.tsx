import React from 'react';
import { ChatMessage } from '../../../shared/types/orchestration';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  onFeedback: (index: number, rating: 'up' | 'down') => void;
  onSuggestionClick: (text: string) => void;
  suggestions: string[];
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isGenerating,
  onFeedback,
  onSuggestionClick,
  suggestions
}) => {
  return (
    <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-900">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Welcome to JCCAD CIP</h2>
          <p className="text-sm max-w-sm text-center">Ask me questions about UAV research, course syllabuses, or laboratory policies.</p>
        </div>
      ) : (
        messages.map((m, idx) => {
          const isUser = m.role === 'user';
          if (m.role === 'system') return null; // Hide system notes
          
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-2xl rounded-2xl p-5 shadow-sm space-y-2 ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-br-none'
                    : 'bg-white text-slate-950 rounded-bl-none border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white'
                }`}
              >
                {/* Content body */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>



                {/* Message Actions & Feedback buttons */}
                {!isUser && (
                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => onFeedback(idx, 'up')}
                      className="text-xs text-slate-400 hover:text-green-500"
                    >
                      Thumbs Up
                    </button>
                    <button
                      onClick={() => onFeedback(idx, 'down')}
                      className="text-xs text-slate-400 hover:text-red-500"
                    >
                      Thumbs Down
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Typing indicator */}
      {isGenerating && (
        <div className="flex justify-start">
          <div className="bg-white border p-4 rounded-2xl rounded-bl-none dark:bg-slate-800 dark:border-slate-700 flex items-center space-x-1.5">
            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0.2s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0.4s]"></div>
          </div>
        </div>
      )}

      {/* Suggested Follow-up chips */}
      {!isGenerating && suggestions.length > 0 && (
        <div className="flex flex-col space-y-2 pt-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Suggested Questions:</span>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((text) => (
              <button
                key={text}
                onClick={() => onSuggestionClick(text)}
                className="rounded-full bg-white border px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default ChatMessageList;
