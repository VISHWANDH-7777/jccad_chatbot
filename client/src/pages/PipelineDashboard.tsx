import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PipelineJob } from '../../../shared/types/pipeline';
import { Link } from 'react-router-dom';

export const PipelineDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<PipelineJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get<{ jobs: any[] }>('/api/v1/pipeline', { withCredentials: true });
      setJobs(res.data.jobs);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error fetching pipeline jobs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">AI Processing Pipelines</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor ingestion tasks, chunk plans, and quality audits.</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-950/20 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-800 dark:border-slate-700">
        {jobs.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No pipeline ingestion jobs have executed yet.</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Target Knowledge Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Quality Score
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {jobs.map((job) => {
                const knowledge = (job as any).knowledgeId;
                return (
                  <tr key={job.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-semibold">
                      {knowledge ? knowledge.title : 'Deleted Asset'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                      {job.currentStage}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          job.status === 'completed'
                            ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                            : job.status === 'failed'
                            ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                            : 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {job.qualityReport ? `${job.qualityReport.totalScore}%` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {job.status === 'completed' && (
                        <Link
                          to={`/pipeline/preview/${job.id}`}
                          className="text-sky-600 hover:text-sky-500 font-semibold"
                        >
                          Preview Chunks
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
export default PipelineDashboard;
