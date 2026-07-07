import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CompanyProfile } from '../../../shared/types/profile';

export const ApprovalQueue: React.FC = () => {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchQueueItem = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Find latest record state
      const res = await axios.get('/api/v1/profile/latest', { withCredentials: true });
      if (res.data.profile) {
        setProfile(res.data.profile);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error fetching review item');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueItem();
  }, []);

  const handleAction = async (action: 'approve' | 'reject' | 'publish') => {
    setError(null);
    setMessage(null);
    try {
      const payload = action === 'approve' || action === 'reject' ? { notes } : {};
      await axios.post(`/api/v1/profile/${action}`, payload, { withCredentials: true });
      setMessage(`Successfully executed profile ${action}`);
      setNotes('');
      fetchQueueItem();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || `Failed to execute ${action}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-sky-600"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-md bg-amber-50 p-6 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400">
        <h3 className="font-bold">Queue Empty</h3>
        <p className="text-sm mt-1">{error || 'No updates pending review currently.'}</p>
      </div>
    );
  }

  const isPending = profile.status === 'Pending Review';
  const isApproved = profile.status === 'Approved';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Approval & Review Queue</h1>
        <p className="text-sm text-slate-500 mt-1">Review active draft changes before publication.</p>
      </div>

      {error && (
        <div role="alert" className="rounded-md bg-red-50 p-4 dark:bg-red-950/20">
          <p className="text-sm font-medium text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {message && (
        <div role="alert" className="rounded-md bg-green-50 p-4 dark:bg-green-950/20">
          <p className="text-sm font-medium text-green-800 dark:text-green-400">{message}</p>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">STATUS</span>
            <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
              {profile.status}
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400">VERSION</span>
            <span className="ml-2 text-sm font-bold text-slate-900 dark:text-white">{profile.version}</span>
          </div>
        </div>

        {/* View Proposed changes */}
        <div className="border-t border-slate-100 pt-4 dark:border-slate-700 space-y-3">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Proposed Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong className="block text-slate-500">Name</strong>
              <span>{profile.data.companyName}</span>
            </div>
            <div>
              <strong className="block text-slate-500">Tagline</strong>
              <span>{profile.data.tagline}</span>
            </div>
            <div className="col-span-2">
              <strong className="block text-slate-500">About Us</strong>
              <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-300">{profile.data.aboutUs}</p>
            </div>
          </div>
        </div>

        {/* Action interfaces */}
        {(isPending || isApproved) && (
          <div className="border-t border-slate-100 pt-4 dark:border-slate-700 space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Reviewer Operations</h3>
            
            {isPending && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Review Notes / Rejection Reasons
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter comments explaining your review decisions..."
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />
                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleAction('approve')}
                    className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
                  >
                    Approve Version
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction('reject')}
                    className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                  >
                    Reject (Send to Draft)
                  </button>
                </div>
              </div>
            )}

            {isApproved && (
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  This version is approved. Push it live to update the dynamic prompt indexes.
                </p>
                <button
                  type="button"
                  onClick={() => handleAction('publish')}
                  className="rounded bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900"
                >
                  Publish Version Live
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default ApprovalQueue;
