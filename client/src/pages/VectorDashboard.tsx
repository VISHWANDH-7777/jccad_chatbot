import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { IndexHealthReport } from '../../../shared/types/vector';

export const VectorDashboard: React.FC = () => {
  const [health, setHealth] = useState<IndexHealthReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get<{ report: IndexHealthReport }>('/api/v1/vector/health', {
        withCredentials: true
      });
      setHealth(res.data.report);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error loading vector index health statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-sky-600"></div>
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-md bg-red-50 p-6 text-red-800">
          <h3 className="font-bold">Error loading dashboard</h3>
          <p className="text-sm mt-1">{error || 'Data is empty'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Embedding & Vector Diagnostics</h1>
        <p className="text-sm text-slate-500 mt-1">Audit active model indexes size, count metrics, and storage growth.</p>
      </div>

      {/* Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <span className="text-xs font-semibold text-slate-400 block uppercase">Total Active Vectors</span>
          <span className="text-4xl font-extrabold text-slate-900 dark:text-white mt-2 block">
            {health.totalVectorsCount.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">Indexed float dimensions</span>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <span className="text-xs font-semibold text-slate-400 block uppercase">Active Embedding Model</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 block">
            {health.activeModelVersion}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">1536 float output size</span>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <span className="text-xs font-semibold text-slate-400 block uppercase">Index Storage Size</span>
          <span className="text-4xl font-extrabold text-slate-900 dark:text-white mt-2 block">
            {health.storageUsageMb} MB
          </span>
          <span className="text-xs text-slate-400 mt-1 block">MongoDB Atlas Vector search capacity</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 space-y-4">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Index Parameters</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong className="text-slate-500 block">Collection Name</strong>
            <span>vectorrecords</span>
          </div>
          <div>
            <strong className="text-slate-500 block">Similarity Metric</strong>
            <span>Cosine similarity</span>
          </div>
          <div>
            <strong className="text-slate-500 block">Index Success Rate</strong>
            <span>{health.indexingSuccessRate}%</span>
          </div>
          <div>
            <strong className="text-slate-500 block">Avg Query Latency</strong>
            <span>{health.averageLatencyMs} ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default VectorDashboard;
