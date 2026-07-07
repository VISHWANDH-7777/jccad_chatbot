import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { KnowledgeItem } from '../../../shared/types/knowledge';

export const KnowledgeReviewQueue: React.FC = () => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchQueue = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch knowledge assets in review states
      const resPending = await axios.get<{ items: KnowledgeItem[] }>('/api/v1/knowledge/search?status=Pending%20Review', {
        withCredentials: true
      });
      const resApproved = await axios.get<{ items: KnowledgeItem[] }>('/api/v1/knowledge/search?status=Approved', {
        withCredentials: true
      });
      setItems([...resPending.data.items, ...resApproved.data.items]);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error loading review queue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'publish') => {
    setError(null);
    setSuccess(null);
    try {
      await axios.post(`/api/v1/knowledge/${id}/${action}`, {}, { withCredentials: true });
      setSuccess(`Knowledge asset updated with action: ${action}`);
      fetchQueue();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update asset');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Knowledge Review Pipeline</h1>
        <p className="text-sm text-slate-500 mt-1">Audit cleaned text structures and map relationships before publishing.</p>
      </div>

      {error && (
        <div role="alert" className="rounded-md bg-red-50 p-4 dark:bg-red-950/20 text-red-800 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div role="alert" className="rounded-md bg-green-50 p-4 dark:bg-green-950/20 text-green-800 dark:text-green-400 text-sm">
          {success}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200 dark:bg-slate-800">
          Knowledge review queue is empty. No assets currently require evaluation.
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {item.category}
                </span>
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                  {item.status}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{item.title}</h3>
                <span className="text-xs text-slate-400 block mt-1">Source: {item.source.sourceType} (ID: {item.source.sourceId})</span>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed line-clamp-3">
                  {item.sections[0]?.content}
                </p>
              </div>

              {/* Review Actions */}
              <div className="border-t border-slate-100 pt-4 dark:border-slate-700 flex justify-end gap-2">
                {item.status === 'Pending Review' ? (
                  <button
                    type="button"
                    onClick={() => handleAction(item.id, 'approve')}
                    className="rounded bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-500"
                  >
                    Approve Content
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAction(item.id, 'publish')}
                    className="rounded bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Publish Content
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default KnowledgeReviewQueue;
