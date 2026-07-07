import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { CompanyProfileData } from '../../../shared/types/profile';

const profileDataSchema = z.object({
  companyName: z.string().min(1, { message: 'Company Name is required' }),
  tagline: z.string().min(1, { message: 'Tagline is required' }),
  aboutUs: z.string().min(1, { message: 'About Us summary is required' }),
  mission: z.string().min(1, { message: 'Mission is required' }),
  vision: z.string().min(1, { message: 'Vision is required' }),
  organizationType: z.string().min(1, { message: 'Organization Type is required' }),
  contactEmail: z.string().email({ message: 'Enter a valid contact email address' }),
  contactPhone: z.string().min(1, { message: 'Phone number is required' }),
  address: z.string().min(1, { message: 'Address is required' }),
  websiteUrl: z.string().url({ message: 'Enter a valid website URL' }),
  workingHours: z.string().min(1, { message: 'Working hours is required' }),
  stats: z.object({
    studentCount: z.number().nonnegative(),
    workshopCount: z.number().nonnegative(),
    uavProjectsCount: z.number().nonnegative(),
    industryPartnersCount: z.number().nonnegative()
  }),
  services: z.array(z.string()).optional(),
  softwareExpertise: z.array(z.string()).optional(),
  industriesServed: z.array(z.string()).optional(),
  faqs: z.array(
    z.object({
      id: z.string(),
      question: z.string().min(1, { message: 'Question cannot be empty' }),
      answer: z.string().min(1, { message: 'Answer cannot be empty' }),
      category: z.string().min(1, { message: 'Category is required' })
    })
  )
});

export const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [servicesText, setServicesText] = useState('');
  const [softwareText, setSoftwareText] = useState('');
  const [industriesText, setIndustriesText] = useState('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm<CompanyProfileData>({
    resolver: zodResolver(profileDataSchema),
    defaultValues: {
      coreValues: [],
      targetAudience: [],
      domains: [],
      services: [],
      softwareExpertise: [],
      industriesServed: [],
      leadership: [],
      faqs: []
    }
  });

  const { fields: faqFields, append: appendFaq, remove: removeFaq } = useFieldArray({
    control,
    name: 'faqs'
  });

  useEffect(() => {
    const fetchLatestDraft = async () => {
      try {
        const res = await axios.get('/api/v1/profile/latest', { withCredentials: true });
        if (res.data.profile) {
          reset(res.data.profile.data);
          setServicesText(res.data.profile.data.services?.join(', ') || '');
          setSoftwareText(res.data.profile.data.softwareExpertise?.join(', ') || '');
          setIndustriesText(res.data.profile.data.industriesServed?.join(', ') || '');
        }
      } catch (err) {
        // Fallback to default values if no record exists
      }
    };

    fetchLatestDraft();
  }, [reset]);

  const onSubmit = async (data: CompanyProfileData) => {
    setIsPending(true);
    setError(null);
    setSuccess(null);
    
    // Parse comma-separated inputs back to string arrays
    data.services = servicesText.split(',').map(s => s.trim()).filter(Boolean);
    data.softwareExpertise = softwareText.split(',').map(s => s.trim()).filter(Boolean);
    data.industriesServed = industriesText.split(',').map(s => s.trim()).filter(Boolean);

    try {
      await axios.post('/api/v1/profile/draft', { data }, { withCredentials: true });
      setSuccess('Draft version updated successfully.');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error updating draft');
    } finally {
      setIsPending(false);
    }
  };

  const submitReview = async () => {
    setIsPending(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.post('/api/v1/profile/submit-review', {}, { withCredentials: true });
      setSuccess('Profile submitted to manager review queue successfully.');
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error submitting review');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Edit JCCAD Profile</h1>
        <div className="space-x-2">
          <button
            type="button"
            onClick={submitReview}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-500 focus:outline-none"
          >
            Submit for Review
          </button>
        </div>
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* General Inputs */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Company Name</label>
            <input
              type="text"
              {...register('companyName')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
            {errors.companyName && <p className="text-xs text-red-500 mt-1">{errors.companyName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tagline</label>
            <input
              type="text"
              {...register('tagline')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
            {errors.tagline && <p className="text-xs text-red-500 mt-1">{errors.tagline.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">About Us</label>
            <textarea
              rows={4}
              {...register('aboutUs')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
            {errors.aboutUs && <p className="text-xs text-red-500 mt-1">{errors.aboutUs.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Mission</label>
            <input
              type="text"
              {...register('mission')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
            {errors.mission && <p className="text-xs text-red-500 mt-1">{errors.mission.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Vision</label>
            <input
              type="text"
              {...register('vision')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
            {errors.vision && <p className="text-xs text-red-500 mt-1">{errors.vision.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Organization Type</label>
            <input
              type="text"
              {...register('organizationType')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Website URL</label>
            <input
              type="text"
              {...register('websiteUrl')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Email</label>
            <input
              type="text"
              {...register('contactEmail')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Phone</label>
            <input
              type="text"
              {...register('contactPhone')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
            <input
              type="text"
              {...register('address')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Working Hours</label>
            <input
              type="text"
              {...register('workingHours')}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Services (comma-separated)</label>
            <textarea
              rows={2}
              value={servicesText}
              onChange={(e) => setServicesText(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              placeholder="e.g. CAD Training, CAD Design Services, Website Design & Development"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Software Expertise (comma-separated)</label>
            <textarea
              rows={2}
              value={softwareText}
              onChange={(e) => setSoftwareText(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              placeholder="e.g. AutoCAD, CATIA, SolidWorks, Siemens NX, PTC Creo, Fusion 360, ANSYS"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Industries Served (comma-separated)</label>
            <textarea
              rows={2}
              value={industriesText}
              onChange={(e) => setIndustriesText(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              placeholder="e.g. Automotive, Mechanical, Manufacturing, Educational Institutions, Startups, MSMEs"
            />
          </div>
        </div>

        {/* FAQs list sections */}
        <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Manage FAQs</h3>
            <button
              type="button"
              onClick={() => appendFaq({ id: Date.now().toString(), question: '', answer: '', category: 'General' })}
              className="rounded bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900"
            >
              Add FAQ Item
            </button>
          </div>

          {faqFields.map((field, index) => (
            <div key={field.id} className="p-4 bg-slate-50 rounded-lg dark:bg-slate-900 relative space-y-2">
              <button
                type="button"
                onClick={() => removeFaq(index)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
              >
                Delete
              </button>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Question</label>
                <input
                  type="text"
                  {...register(`faqs.${index}.question` as const)}
                  className="mt-1 block w-full rounded border px-2 py-1 text-sm dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Answer</label>
                <textarea
                  rows={2}
                  {...register(`faqs.${index}.answer` as const)}
                  className="mt-1 block w-full rounded border px-2 py-1 text-sm dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900"
          >
            {isPending ? 'Saving...' : 'Save Draft Snapshot'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default EditProfile;
