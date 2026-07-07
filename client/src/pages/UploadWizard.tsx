import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';

const uploadSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().optional(),
  category: z.string().min(1, { message: 'Category is required' }),
  tags: z.string().optional(),
  keywords: z.string().optional(),
  visibility: z.enum(['Public', 'Internal', 'Restricted'])
});

type UploadFormInput = z.infer<typeof uploadSchema>;

export const UploadWizard: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<UploadFormInput>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      category: 'General',
      visibility: 'Internal'
    }
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const onSubmit = async (data: UploadFormInput) => {
    if (!file) {
      setError('Please select or drag a document file to upload');
      return;
    }

    setIsPending(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', data.title);
    formData.append('description', data.description || '');
    formData.append('category', data.category);
    formData.append('tags', data.tags || '');
    formData.append('keywords', data.keywords || '');
    formData.append('visibility', data.visibility);
    formData.append('retentionPolicy', 'Indefinite');

    try {
      await axios.post('/api/v1/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      setSuccess('Document uploaded successfully as draft.');
      setTimeout(() => navigate('/documents'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Document upload execution failed');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Upload New Document</h1>
        <p className="text-sm text-slate-500 mt-1">DIP validates file types and checks checksum unique values.</p>
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Drag & Drop zone */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            dragActive ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/20' : 'border-slate-300 dark:border-slate-700'
          }`}
        >
          <input
            type="file"
            id="file-upload"
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.docx,.pptx,.txt,.md,.html,image/png,image/jpeg"
          />
          <label htmlFor="file-upload" className="cursor-pointer block">
            <span className="text-slate-600 dark:text-slate-400 text-sm block">
              {file ? `Selected file: ${file.name}` : 'Drag and drop your file here, or click to browse'}
            </span>
            <span className="text-xs text-slate-400 block mt-2">
              Supported files: PDF, DOCX, PPTX, TXT, MD, PNG, JPG (Max 10MB)
            </span>
          </label>
        </div>

        {/* Metadata Inputs */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Document Title</label>
            <input
              type="text"
              required
              {...register('title')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              rows={3}
              {...register('description')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
              <select
                {...register('category')}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              >
                <option value="Curriculum">Curriculum</option>
                <option value="Policies">Policies</option>
                <option value="UAV Research">UAV Research</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Visibility</label>
              <select
                {...register('visibility')}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              >
                <option value="Internal">Internal</option>
                <option value="Public">Public</option>
                <option value="Restricted">Restricted (Admin Only)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tags (comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. syllabus, drone, 2026"
              {...register('tags')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 focus:outline-none"
        >
          {isPending ? 'Uploading...' : 'Upload Draft Document'}
        </button>
      </form>
    </div>
  );
};
export default UploadWizard;
