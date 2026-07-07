import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DocumentRecord } from '../../../shared/types/document';

export const DocumentApprovalQueue: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchQueue = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch documents in review states (using search filters)
      const resPending = await axios.get<{ documents: DocumentRecord[] }>('/api/v1/documents/search?status=Pending%20Review', {
        withCredentials: true
      });
      const resApproved = await axios.get<{ documents: DocumentRecord[] }>('/api/v1/documents/search?status=Approved', {
        withCredentials: true
      });
      setDocuments([...resPending.data.documents, ...resApproved.data.documents]);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error fetching review queue');
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
      const payload = action === 'approve' ? { notes } : {};
      await axios.post(`/api/v1/documents/${id}/${action}`, payload, { withCredentials: true });
      setSuccess(`Document successfully updated with action: ${action}`);
      setNotes('');
      fetchQueue();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error execution action');
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
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Document Review Pipeline</h1>
        <p className="text-sm text-slate-500 mt-1">Review, approve, and publish materials to active AI search index databases.</p>
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

      {documents.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200 dark:bg-slate-800">
          Approval queue is empty. No documents currently require managerial review.
        </div>
      ) : (
        <div className="space-y-6">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {doc.metadata.category}
                </span>
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                  {doc.status}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{doc.metadata.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{doc.metadata.description}</p>
                <span className="block text-xs text-slate-400 mt-2">Uploaded file: {doc.fileName}</span>
              </div>

              {/* Operations Interface */}
              <div className="border-t border-slate-100 pt-4 dark:border-slate-700">
                {doc.status === 'Pending Review' ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-500">Review Notes</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add comments or guidelines..."
                      className="block w-full rounded border px-2 py-1 text-sm dark:bg-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleAction(doc.id, 'approve')}
                      className="rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500"
                    >
                      Approve Document
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Approved version is ready. Publish to update vector search.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAction(doc.id, 'publish')}
                      className="rounded bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Publish Live
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default DocumentApprovalQueue;
