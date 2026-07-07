import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { KnowledgeItem } from '../../../shared/types/knowledge';

interface SectionInput {
  heading: string;
  subheading?: string;
  content: string;
  contentType: 'paragraph' | 'list' | 'table' | 'definition';
}

interface MetadataInput {
  topic: string;
  tags: string;
  keywords: string;
  language: string;
}

interface KnowledgeFormInput {
  title: string;
  sections: SectionInput[];
  metadata: MetadataInput;
}

export const EditKnowledge: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { register, handleSubmit, control, reset } = useForm<KnowledgeFormInput>({
    defaultValues: {
      sections: [{ heading: '', content: '', contentType: 'paragraph' }],
      metadata: { topic: 'General', language: 'en' }
    }
  });

  const { fields: sectionFields, append: appendSection, remove: removeSection } = useFieldArray({
    control,
    name: 'sections'
  });

  useEffect(() => {
    if (!id) return;

    const fetchItem = async () => {
      try {
        const res = await axios.get<{ item: KnowledgeItem }>(`/api/v1/knowledge/${id}`, { withCredentials: true });
        if (res.data.item) {
          // Map properties to form formatting
          reset({
            title: res.data.item.title,
            sections: res.data.item.sections,
            metadata: {
              topic: res.data.item.metadata.topic,
              tags: res.data.item.metadata.tags.join(','),
              keywords: res.data.item.metadata.keywords.join(','),
              language: res.data.item.metadata.language
            }
          });
        }
      } catch (err) {
        // Fallback to defaults
      }
    };

    fetchItem();
  }, [id, reset]);

  const onSubmit = async (data: KnowledgeFormInput) => {
    setIsPending(true);
    setError(null);
    setSuccess(null);

    const payload = {
      title: data.title,
      sections: data.sections,
      source: {
        sourceType: 'Document',
        sourceId: id || 'local-creation',
        sourceVersion: 1
      },
      metadata: {
        topic: data.metadata.topic,
        tags: data.metadata.tags ? data.metadata.tags.split(',') : [],
        keywords: data.metadata.keywords ? data.metadata.keywords.split(',') : [],
        language: data.metadata.language
      }
    };

    try {
      if (id) {
        await axios.put(`/api/v1/knowledge/${id}`, payload, { withCredentials: true });
      } else {
        await axios.post('/api/v1/knowledge/draft', payload, { withCredentials: true });
      }
      setSuccess('Knowledge asset draft updated successfully.');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error updating knowledge draft');
    } finally {
      setIsPending(false);
    }
  };

  const submitReview = async () => {
    if (!id) return;
    setIsPending(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.post(`/api/v1/knowledge/${id}/submit-review`, {}, { withCredentials: true });
      setSuccess('Submitted to review queue successfully.');
      setTimeout(() => navigate('/knowledge'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Submission failed');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
          {id ? 'Modify Knowledge Asset' : 'Initialize Knowledge Element'}
        </h1>
        {id && (
          <button
            type="button"
            onClick={submitReview}
            className="rounded bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            Submit for Review
          </button>
        )}
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
            <input
              type="text"
              required
              {...register('title')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Topic</label>
            <input
              type="text"
              {...register('metadata.topic')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Language</label>
            <input
              type="text"
              {...register('metadata.language')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Dynamic section fields array layout */}
        <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Content Sections</h3>
            <button
              type="button"
              onClick={() => appendSection({ heading: '', content: '', contentType: 'paragraph' })}
              className="rounded bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900"
            >
              Add Section
            </button>
          </div>

          {sectionFields.map((field, index) => (
            <div key={field.id} className="p-4 bg-slate-50 rounded-lg dark:bg-slate-900 relative space-y-3">
              <button
                type="button"
                onClick={() => removeSection(index)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Heading</label>
                  <input
                    type="text"
                    {...register(`sections.${index}.heading` as const)}
                    className="mt-1 block w-full rounded border px-2 py-1 text-sm dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Type</label>
                  <select
                    {...register(`sections.${index}.contentType` as const)}
                    className="mt-1 block w-full rounded border px-2 py-1 text-sm dark:bg-slate-800 dark:text-white"
                  >
                    <option value="paragraph">Paragraph</option>
                    <option value="list">List</option>
                    <option value="table">Table</option>
                    <option value="definition">Definition</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Content Body</label>
                <textarea
                  rows={3}
                  {...register(`sections.${index}.content` as const)}
                  className="mt-1 block w-full rounded border px-2 py-1 text-sm dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-850"
        >
          {isPending ? 'Saving...' : 'Save Knowledge Draft'}
        </button>
      </form>
    </div>
  );
};
export default EditKnowledge;
