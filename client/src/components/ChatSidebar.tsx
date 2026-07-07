import React from 'react';
import { ConversationSummary } from '../../../shared/types/conversation';

interface ChatSidebarProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, nextTitle: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  activeId,
  onSelect,
  onRename,
  onDelete,
  onCreate
}) => {
  return (
    <div className="w-80 h-full bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800">
      <div className="p-4 border-b border-slate-800">
        <button
          onClick={onCreate}
          className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-sky-500 transition-colors"
        >
          New Conversation Thread
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
              activeId === c.id ? 'bg-slate-800 text-white' : 'hover:bg-slate-850 text-slate-400'
            }`}
          >
            <span className="text-sm truncate pr-2 font-medium">{c.title}</span>
            <div className="hidden group-hover:flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const val = prompt('Rename conversation thread title:', c.title);
                  if (val) onRename(c.id, val);
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Rename
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ChatSidebar;
