import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface VersionSnapshot {
  _id: string;
  version: number;
  data: {
    companyName: string;
    tagline: string;
  };
  createdByName: string;
  createdAt: string;
}

export const VersionHistory: React.FC = () => {
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchVersions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/v1/profile/versions', { withCredentials: true });
      setVersions(res.data.versions);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error fetching version history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const handleRollback = async (version: number) => {
    setError(null);
    setSuccess(null);
    if (!window.confirm(`Are you sure you want to rollback to Version ${version}?`)) {
      return;
    }

    try {
      await axios.post('/api/v1/profile/rollback', { version }, { withCredentials: true });
      setSuccess(`Successfully rolled back to version ${version}`);
      fetchVersions();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to rollback version');
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
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Version Snapshot History</h1>
        <p className="text-sm text-slate-500 mt-1">Revert to historical profile versions to update RAG grounding.</p>
      </div>

      {error && (
        <div role="alert" className="rounded-md bg-red-50 p-4 dark:bg-red-950/20">
          <p className="text-sm font-medium text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div role="alert" className="rounded-md bg-green-50 p-4 dark:bg-green-950/20">
          <p className="text-sm font-medium text-green-800 dark:text-green-400">{success}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-800 dark:border-slate-700">
        {versions.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No version snapshots stored in historical archives.</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Company Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Published By
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Date Published
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {versions.map((ver) => (
                <tr key={ver._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">
                    v{ver.version}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {ver.data.companyName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {ver.createdByName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(ver.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      type="button"
                      onClick={() => handleRollback(ver.version)}
                      className="rounded bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                    >
                      Rollback
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
export default VersionHistory;
