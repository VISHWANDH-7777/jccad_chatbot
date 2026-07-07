import React, { useState } from 'react';
import axios from 'axios';

interface SearchResult {
  id: string;
  content: string;
  category: string;
  score: number;
  version: number;
}

export const SearchDiagnostics: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsPending(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('query', query);
      if (category) params.append('category', category);

      const res = await axios.get<{ results: SearchResult[] }>(`/api/v1/vector/search-diagnostics?${params.toString()}`, {
        withCredentials: true
      });
      setResults(res.data.results);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error running semantic search diagnostics');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Semantic Search Diagnostics</h1>
        <p className="text-sm text-slate-500 mt-1">Execute query commands to verify retrieval metrics and cosine similarity scores.</p>
      </div>

      <form onSubmit={handleSearch} className="bg-white p-6 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Test Query</label>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
            placeholder="e.g. What are the prerequisites for UAV robotics courses?"
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
          {isPending ? 'Searching...' : 'Test Search'}
        </button>
      </form>

      {error && (
        <div role="alert" className="rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-950/20 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Results details */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Retrieval Matches ({results.length})</h3>
        {results.length === 0 ? (
          <div className="text-center py-8 text-slate-400">Enter a query above to run diagnostic tests.</div>
        ) : (
          <div className="space-y-4">
            {results.map((res, index) => (
              <div
                key={res.id}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-600">MATCH #{index + 1}</span>
                  <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                    Cosine Score: {(res.score * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 font-mono bg-slate-50 p-4 rounded dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  {res.content}
                </p>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Category: {res.category}</span>
                  <span>Version: v{res.version}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default SearchDiagnostics;
