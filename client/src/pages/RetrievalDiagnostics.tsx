import React, { useState } from 'react';
import axios from 'axios';
import { GroundedContextPackage } from '../../../shared/types/retrieval';

export const RetrievalDiagnostics: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [context, setContext] = useState<GroundedContextPackage | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsPending(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      if (category) params.append('category', category);

      const res = await axios.get<GroundedContextPackage>(`/api/v1/retrieval?${params.toString()}`, {
        withCredentials: true
      });
      setContext(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error running retrieval diagnostics');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Retriever & Context Diagnostics</h1>
        <p className="text-sm text-slate-500 mt-1">Audit dynamic prompt grounding context outputs and citations.</p>
      </div>

      <form onSubmit={handleSearch} className="bg-white p-6 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-grow space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Semantic Query</label>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
            placeholder="e.g. Mechatronics laboratory policies"
            className="w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white text-sm"
          />
        </div>

        <div className="w-full md:w-48 space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category Filter</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white text-sm"
          >
            <option value="">All Categories</option>
            <option value="Company Profile">Company Profile</option>
            <option value="Courses">Courses</option>
            <option value="FAQs">FAQs</option>
            <option value="Engineering Domains">Engineering Domains</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 w-full md:w-auto"
        >
          {isPending ? 'Processing...' : 'Run Diagnostics'}
        </button>
      </form>

      {error && (
        <div role="alert" className="rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-950/20 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {context && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Context results block */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Intent: <strong className="text-slate-900 dark:text-white">{context.intent}</strong>
              </span>
              <span className="text-xs text-slate-400">Tokens: {context.totalTokensUsed} / 1500 limit</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Grounded Context Blocks</h3>
            {context.contextChunks.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No context chunks matched the request.</div>
            ) : (
              <div className="space-y-4">
                {context.contextChunks.map((chunk, index) => (
                  <div
                    key={chunk.chunkId}
                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-sky-600">CONTEXT CHUNK #{index + 1}</span>
                      <span className="text-xs text-slate-400">RRF Score: {(chunk.score * 100).toFixed(1)}%</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 p-4 rounded dark:bg-slate-900 border border-slate-100">
                      {chunk.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Citations panel */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 space-y-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Generated Citations</h3>
              {context.citations.length === 0 ? (
                <div className="text-sm text-slate-500">No citations mapped for this query.</div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                  {context.citations.map((cite) => (
                    <li key={cite.chunkId} className="py-3 text-sm flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        [{cite.citationIndex}] {cite.sourceName}
                      </span>
                      <span className="text-xs text-slate-400">Version: v{cite.version}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default RetrievalDiagnostics;
