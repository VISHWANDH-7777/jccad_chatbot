import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DocumentRecord } from '../../../shared/types/document';
import { Link } from 'react-router-dom';

export const DocumentDashboard: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Published');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await axios.get<{ documents: DocumentRecord[] }>(`/api/v1/documents/search?${params.toString()}`, {
        withCredentials: true
      });
      setDocuments(res.data.documents);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error fetching document list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [categoryFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocuments();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Document Registry</h1>
          <p className="text-sm text-slate-500 mt-1">Manage official JCCAD documents used by the AI systems.</p>
        </div>
        <Link
          to="/documents/upload"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900"
        >
          Upload New Document
        </Link>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keywords..."
            className="flex-grow rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:bg-slate-900 dark:text-white"
          />
          <button type="submit" className="rounded bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white">
            Search
          </button>
        </form>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border px-2 py-1 text-sm dark:bg-slate-900 dark:text-white"
          >
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Approved">Approved</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded border px-2 py-1 text-sm dark:bg-slate-900 dark:text-white"
          >
            <option value="">All Categories</option>
            <option value="Curriculum">Curriculum</option>
            <option value="Policies">Policies</option>
            <option value="UAV Research">UAV Research</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-950/20 text-red-800 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Grid listing */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-sky-600"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No documents found matching current query parameters.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {doc.metadata.category}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                    v{doc.version}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mt-2">{doc.metadata.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{doc.metadata.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {doc.metadata.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-slate-100 px-2 py-0.5 rounded dark:bg-slate-900">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-4 mt-4">
                <span className="text-xs text-slate-400">Size: {(doc.fileSize / 1024).toFixed(1)} KB</span>
                <a
                  href={`/api/v1/documents/${doc.id}/download`}
                  className="text-sm font-semibold text-sky-600 hover:text-sky-500 dark:text-sky-400"
                >
                  Download File
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default DocumentDashboard;
