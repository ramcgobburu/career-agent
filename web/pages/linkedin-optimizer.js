import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Linkedin, Sparkles, Copy, Download } from 'lucide-react';
import AppShell from '../components/AppShell';

export default function LinkedInOptimizer({ user }) {
  const supabase = useSupabaseClient();
  const session = useSession();
  const router = useRouter();
  const accessToken = session?.access_token;

  const [linkedinProfile, setLinkedinProfile] = useState({
    headline: '',
    summary: '',
    currentRole: '',
    targetRole: '',
  });
  const [optimizing, setOptimizing] = useState(false);
  const [optimization, setOptimization] = useState(null);
  const [error, setError] = useState(null);

  const apiBaseUrl = useMemo(() => {
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
      return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '');
    }
    if (typeof window === 'undefined') {
      return '';
    }
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:8000';
    }
    if (window.location.hostname === 'careerpilotconsulting.com' || window.location.hostname === 'www.careerpilotconsulting.com') {
      return 'https://api.careerpilotconsulting.com';
    }
    return `${window.location.origin}`;
  }, []);

  const authHeaders = useMemo(() => {
    if (!accessToken) {
      return {};
    }
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }, [accessToken]);

  useEffect(() => {
    if (!session) {
      router.replace('/');
    }
  }, [session, router]);

  const handleOptimize = async () => {
    if (!linkedinProfile.headline && !linkedinProfile.summary) {
      setError('Please provide at least your headline or summary');
      return;
    }

    setOptimizing(true);
    setError(null);
    setOptimization(null);

    try {
      const prompt = `Optimize this LinkedIn profile for better visibility and recruiter engagement. Provide specific suggestions for:\n1. Headline optimization\n2. Summary/About section improvements\n3. Keyword suggestions\n4. Overall profile strength\n\nCurrent Headline: ${linkedinProfile.headline || 'Not provided'}\nCurrent Summary: ${linkedinProfile.summary || 'Not provided'}\nCurrent Role: ${linkedinProfile.currentRole || 'Not provided'}\nTarget Role: ${linkedinProfile.targetRole || 'Not specified'}`;

      const response = await fetch(`${apiBaseUrl}/api/v1/query`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question: prompt,
          format: 'text',
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Failed to optimize profile');
      }

      const data = await response.json();
      setOptimization(data.content);
    } catch (err) {
      setError(err.message);
    } finally {
      setOptimizing(false);
    }
  };

  const handleCopy = async () => {
    if (!optimization) return;
    try {
      await navigator.clipboard.writeText(optimization);
      setError('Copied to clipboard!');
      setTimeout(() => setError(null), 2000);
    } catch (err) {
      setError('Unable to copy. Please select and copy manually.');
    }
  };

  const handleDownload = () => {
    if (!optimization) return;
    const blob = new Blob([optimization], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkedin_optimization_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <Head>
        <title>LinkedIn Optimizer | CareerPilot</title>
      </Head>
      <div className="p-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full mb-4">
            <Linkedin className="w-4 h-4" />
            <span className="text-sm font-medium">LinkedIn Profile</span>
          </div>
          <h1 className="text-3xl text-gray-900 mb-2">Optimize Your LinkedIn Profile</h1>
          <p className="text-gray-600">Enhance your LinkedIn profile to attract more recruiters and increase your visibility.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl text-gray-900 mb-2">Your Current Profile</h2>
              <p className="text-sm text-gray-600 mb-6">Enter your current LinkedIn profile information to get optimization suggestions.</p>

              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleOptimize(); }}>
                <div>
                  <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-2">
                    Headline
                  </label>
                  <input
                    id="headline"
                    type="text"
                    value={linkedinProfile.headline}
                    onChange={(e) => setLinkedinProfile({ ...linkedinProfile, headline: e.target.value })}
                    placeholder="e.g., Senior Product Manager | AI & ML Expert"
                    maxLength={120}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none"
                  />
                  <small className="text-xs text-gray-500 mt-1 block">
                    {linkedinProfile.headline.length}/120 characters
                  </small>
                </div>

                <div>
                  <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
                    Summary / About Section
                  </label>
                  <textarea
                    id="summary"
                    value={linkedinProfile.summary}
                    onChange={(e) => setLinkedinProfile({ ...linkedinProfile, summary: e.target.value })}
                    placeholder="Paste your LinkedIn summary here..."
                    rows={8}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none resize-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="currentRole" className="block text-sm font-medium text-gray-700 mb-2">
                      Current Role
                    </label>
                    <input
                      id="currentRole"
                      type="text"
                      value={linkedinProfile.currentRole}
                      onChange={(e) => setLinkedinProfile({ ...linkedinProfile, currentRole: e.target.value })}
                      placeholder="Product Manager at Tech Corp"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="targetRole" className="block text-sm font-medium text-gray-700 mb-2">
                      Target Role
                    </label>
                    <input
                      id="targetRole"
                      type="text"
                      value={linkedinProfile.targetRole}
                      onChange={(e) => setLinkedinProfile({ ...linkedinProfile, targetRole: e.target.value })}
                      placeholder="Senior Product Manager"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {error && (
                  <div className={`p-3 rounded-lg ${error.includes('Copied') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  onClick={handleOptimize}
                  disabled={optimizing || (!linkedinProfile.headline && !linkedinProfile.summary)}
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {optimizing ? (
                    <>
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Get Optimization Suggestions
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Optimization Results */}
            {optimization && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl text-gray-900">Optimization Suggestions</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">
                    {optimization}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Tips Sidebar */}
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg text-gray-900 mb-4">LinkedIn Optimization Tips</h3>
              <ul className="space-y-4">
                <li className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <strong className="text-gray-900 block mb-1">Use keywords</strong>
                  <span className="text-sm text-gray-600">Relevant to your industry and target roles</span>
                </li>
                <li className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <strong className="text-gray-900 block mb-1">Write a compelling headline</strong>
                  <span className="text-sm text-gray-600">That includes your value proposition</span>
                </li>
                <li className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <strong className="text-gray-900 block mb-1">Tell your story</strong>
                  <span className="text-sm text-gray-600">In the summary section with specific achievements</span>
                </li>
                <li className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <strong className="text-gray-900 block mb-1">Add a professional photo</strong>
                  <span className="text-sm text-gray-600">To increase profile views</span>
                </li>
                <li>
                  <strong className="text-gray-900 block mb-1">Engage regularly</strong>
                  <span className="text-sm text-gray-600">By posting and commenting to increase visibility</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export const getServerSideProps = async (ctx) => {
  const supabase = createServerSupabaseClient(ctx);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {
      initialSession: session,
      user: session.user,
    },
  };
};
