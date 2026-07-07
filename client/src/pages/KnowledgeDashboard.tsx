import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { KnowledgeItem } from '../../../shared/types/knowledge';
import { Link } from 'react-router-dom';

export const KnowledgeDashboard: React.FC = () => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKnowledge = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (categoryFilter) params.append('category', categoryFilter);

      const res = await axios.get<{ items: KnowledgeItem[] }>(`/api/v1/knowledge/search?${params.toString()}`, {
        withCredentials: true
      });
      setItems(res.data.items);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error loading knowledge assets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, [categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKnowledge();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Knowledge Base Engine</h1>
          <p className="text-sm text-slate-500 mt-1">Browse structured, cleaned, and classified company assets.</p>
        </div>
        <Link
          to="/knowledge/create"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900"
        >
          Initialize Knowledge Draft
        </Link>
      </div>

      {/* Filter Options */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search key structured elements..."
            className="flex-grow rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:bg-slate-900 dark:text-white"
          />
          <button type="submit" className="rounded bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white">
            Search
          </button>
        </form>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded border px-2 py-1 text-sm dark:bg-slate-900 dark:text-white"
        >
          <option value="">All Categories</option>
          <option value="Company Profile">Company Profile</option>
          <option value="Courses">Courses</option>
          <option value="FAQs">FAQs</option>
          <option value="Engineering Domains">Engineering Domains</option>
          <option value="Policies">Policies</option>
        </select>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-950/20 text-red-800 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-sky-600"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No structured knowledge items found matching the query.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {item.category}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                    Quality: {item.metadata.qualityScore}%
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mt-2">{item.title}</h3>
                <span className="text-xs text-slate-400 block mt-1">Topic: {item.metadata.topic}</span>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed line-clamp-3">
                  {item.sections[0]?.content}
                </p>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">Relationships: {item.relationships.length}</span>
                <Link
                  to={`/knowledge/edit/${item.id}`}
                  className="text-sm font-semibold text-sky-600 hover:text-sky-500 dark:text-sky-400"
                >
                  Edit Elements
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default KnowledgeDashboard;
