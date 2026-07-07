import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { PipelineJob } from '../../../shared/types/pipeline';

export const ChunkPreview: React.FC = () => {
  const { id } = useParams();
  const [job, setJob] = useState<PipelineJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchJobDetail = async () => {
      try {
        const res = await axios.get<{ job: PipelineJob }>(`/api/v1/pipeline/${id}`, {
          withCredentials: true
        });
        setJob(res.data.job);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Error fetching job details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobDetail();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-sky-600"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-md bg-amber-50 p-6 text-amber-800">
          <h3 className="font-bold">Error loading chunk preview details</h3>
          <p className="text-sm mt-1">{error || 'Job detail is empty'}</p>
        </div>
      </div>
    );
  }

  const pkg = job.outputPackage;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <Link to="/pipeline" className="text-xs font-semibold text-sky-600 hover:text-sky-500 uppercase tracking-wider block">
            &larr; Back to Pipeline Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 mt-1">Chunk Planner Preview</h1>
        </div>
        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
          Quality Score: {job.qualityReport?.totalScore}%
        </span>
      </div>

      {!pkg ? (
        <div className="p-6 bg-white border rounded-xl text-center text-slate-500 dark:bg-slate-800">
          No chunk definitions generated. The processing pipeline may have failed or is still running.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chunks List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Generated Chunks ({pkg.chunks.length})</h3>
            <div className="space-y-4">
              {pkg.chunks.map((chunk) => (
                <div
                  key={chunk.chunkIndex}
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">CHUNK #{chunk.chunkIndex + 1}</span>
                    <span className="text-xs bg-slate-50 px-2 py-0.5 rounded text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                      Tokens: {chunk.tokenCount}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-mono bg-slate-50 p-4 rounded dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    {chunk.content}
                  </p>
                  <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                    <span>Checksum: {chunk.checksum.substring(0, 16)}...</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata Package Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 space-y-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Metadata Package</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <strong className="block text-xs text-slate-400 uppercase">Category</strong>
                  <span className="text-slate-700 dark:text-slate-300">{pkg.metadata.category}</span>
                </div>
                <div>
                  <strong className="block text-xs text-slate-400 uppercase">Department</strong>
                  <span className="text-slate-700 dark:text-slate-300">{pkg.metadata.department}</span>
                </div>
                <div>
                  <strong className="block text-xs text-slate-400 uppercase">Topic</strong>
                  <span className="text-slate-700 dark:text-slate-300">{pkg.metadata.topic}</span>
                </div>
                <div>
                  <strong className="block text-xs text-slate-400 uppercase">Visibility</strong>
                  <span className="text-slate-700 dark:text-slate-300">{pkg.metadata.visibility}</span>
                </div>
                <div>
                  <strong className="block text-xs text-slate-400 uppercase">Tags</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {pkg.metadata.tags.map((t) => (
                      <span key={t} className="text-xs bg-slate-100 px-2 py-0.5 rounded dark:bg-slate-900">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quality Report card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 space-y-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Quality Audit Report</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Completeness:</span>
                  <span className="font-semibold">{job.qualityReport?.completenessScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Readability:</span>
                  <span className="font-semibold">{job.qualityReport?.readabilityScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Metadata Score:</span>
                  <span className="font-semibold">{job.qualityReport?.metadataQualityScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Structural Score:</span>
                  <span className="font-semibold">{job.qualityReport?.structuralQualityScore}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ChunkPreview;
