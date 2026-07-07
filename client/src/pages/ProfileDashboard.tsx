import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CompanyProfile } from '../../../shared/types/profile';

export const ProfileDashboard: React.FC = () => {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublishedProfile = async () => {
      try {
        const res = await axios.get<{ profile: CompanyProfile }>('/api/v1/profile/published');
        setProfile(res.data.profile);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'No published profile details found');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublishedProfile();
  }, []);

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
        <h3 className="font-bold">No Active Profile Details Found</h3>
        <p className="text-sm mt-1">{error || 'Please set up and publish a company profile version.'}</p>
      </div>
    );
  }

  const { data } = profile;

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 py-8">
      {/* Hero header */}
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
              Published Version {profile.version}
            </span>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-50 mt-3">{data.companyName}</h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 italic mt-1">{data.tagline}</p>
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* General Details card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">About JCCAD</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{data.aboutUs}</p>
          <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-2">
            <p className="text-sm">
              <strong className="text-slate-700 dark:text-slate-300">Mission:</strong> {data.mission}
            </p>
            <p className="text-sm">
              <strong className="text-slate-700 dark:text-slate-300">Vision:</strong> {data.vision}
            </p>
          </div>
        </div>

        {/* Dynamic statistics counts */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4">Official Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-center">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">{data.stats.studentCount}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">Students Trained</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-center">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">{data.stats.workshopCount}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">Workshops Run</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-center">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">{data.stats.uavProjectsCount}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">UAV Prototypes</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-center">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">{data.stats.industryPartnersCount}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">Industry Partners</span>
            </div>
          </div>
        </div>
      </div>

      {/* Services, Software & Industries grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Services card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800 space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Services Provided</h3>
          <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
            {data.services?.map((service, i) => (
              <li key={i}>{service}</li>
            )) || <span className="text-slate-400 italic">None configured</span>}
          </ul>
        </div>

        {/* Software card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800 space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Software Expertise</h3>
          <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
            {data.softwareExpertise?.map((software, i) => (
              <li key={i}>{software}</li>
            )) || <span className="text-slate-400 italic">None configured</span>}
          </ul>
        </div>

        {/* Industries card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800 space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Industries Served</h3>
          <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
            {data.industriesServed?.map((industry, i) => (
              <li key={i}>{industry}</li>
            )) || <span className="text-slate-400 italic">None configured</span>}
          </ul>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {data.faqs.map((faq) => (
            <div key={faq.id} className="border-b border-slate-100 dark:border-slate-700 pb-4">
              <h4 className="font-semibold text-slate-900 dark:text-slate-50">{faq.question}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default ProfileDashboard;
