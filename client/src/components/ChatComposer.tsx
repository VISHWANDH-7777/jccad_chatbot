import React, { useState } from 'react';

interface ChatComposerProps {
  onSend: (text: string, imageFile: File | null) => void;
  isGenerating: boolean;
  onStop: () => void;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({ onSend, isGenerating, onStop }) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !imageFile) return;
    onSend(text, imageFile);
    setText('');
    setImageFile(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
      {/* File attachment preview */}
      {imageFile && (
        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-md max-w-xs">
          <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{imageFile.name}</span>
          <button
            type="button"
            onClick={() => setImageFile(null)}
            className="text-red-500 hover:text-red-700 text-xs"
          >
            Remove
          </button>
        </div>
      )}

      <div className="flex items-end space-x-3">
        {/* Attachment upload input */}
        <div>
          <input
            type="file"
            id="composer-image"
            onChange={handleImageChange}
            accept="image/png,image/jpeg"
            className="hidden"
          />
          <label
            htmlFor="composer-image"
            className="cursor-pointer inline-flex items-center justify-center p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Attach
          </label>
        </div>

        {/* Text Input area */}
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message JCCAD Assistant..."
          className="flex-grow rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-sm resize-none"
        />

        {/* Stop or Send actions */}
        {isGenerating ? (
          <button
            type="button"
            onClick={onStop}
            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-red-500"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!text.trim() && !imageFile}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 disabled:bg-slate-400"
          >
            Send
          </button>
        )}
      </div>
    </form>
  );
};
export default ChatComposer;
