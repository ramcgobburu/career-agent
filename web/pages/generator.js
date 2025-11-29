import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Sparkles, FileText, Mail, MessageSquare, Target, Copy, Download, RefreshCw } from 'lucide-react';
import AppShell from '../components/AppShell';

const templates = [
  {
    id: 'cover-letter',
    name: 'Cover Letter',
    description: 'Generate tailored cover letters for job applications',
    icon: FileText,
    color: 'bg-blue-600',
    endpoint: '/api/v1/cover-letter',
  },
  {
    id: 'job-application-answer',
    name: 'Interview Answers',
    description: 'Prepare compelling answers to common interview questions',
    icon: MessageSquare,
    color: 'bg-green-600',
    endpoint: '/api/v1/job-application-answer',
  },
  {
    id: 'blurb',
    name: 'Networking Blurb',
    description: 'Create professional networking messages and blurbs',
    icon: Mail,
    color: 'bg-purple-600',
    endpoint: '/api/v1/blurb',
  },
  {
    id: 'summary',
    name: 'Professional Summary',
    description: 'Write impactful professional summaries for resumes',
    icon: Target,
    color: 'bg-orange-600',
    endpoint: '/api/v1/query',
  }
];

export default function Generator({ user }) {
  const supabase = useSupabaseClient();
  const session = useSession();
  const router = useRouter();
  const accessToken = session?.access_token;

  const [selectedTemplate, setSelectedTemplate] = useState('cover-letter');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Cover letter fields
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [additional, setAdditional] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');

  // Application answer fields
  const [question, setQuestion] = useState('');

  // Blurb fields
  const [blurbPurpose, setBlurbPurpose] = useState('LinkedIn introduction');
  const [blurbStyle, setBlurbStyle] = useState('linkedin');
  const [maxWords, setMaxWords] = useState(200);

  // Job URL parsing
  const [jobUrl, setJobUrl] = useState('');
  const [parsingUrl, setParsingUrl] = useState(false);
  const [urlError, setUrlError] = useState(null);

  // Profile for usage stats
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!session) {
      router.replace('/');
    }
  }, [session, router]);

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
    const fetchProfile = async () => {
      if (!apiBaseUrl || !accessToken) return;
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/me`, {
          headers: authHeaders,
        });
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };
    fetchProfile();
  }, [apiBaseUrl, accessToken, authHeaders]);

  const handleParseJobUrl = async () => {
    if (!jobUrl.trim()) {
      setUrlError('Please enter a job posting URL');
      return;
    }
    if (!apiBaseUrl || !accessToken) {
      setUrlError('You need to be signed in to parse job URLs');
      return;
    }

    setParsingUrl(true);
    setUrlError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/parse-job-url`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ url: jobUrl.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to parse job URL');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to parse job posting');
      }

      if (data.company_name) setCompany(data.company_name);
      if (data.role_title) setRole(data.role_title);
      if (data.job_description) setJobDescription(data.job_description);

      setUrlError(null);
      setJobUrl('');
    } catch (error) {
      setUrlError(error.message || 'Error parsing job URL. Please try again or enter details manually.');
    } finally {
      setParsingUrl(false);
    }
  };

  const handleGenerate = async () => {
    if (!apiBaseUrl || !accessToken) {
      setErrorMessage('You need to be signed in to generate.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratedContent('');

    try {
      let endpoint = '';
      let payload = {};

      if (selectedTemplate === 'cover-letter') {
        if (!company || !company.trim()) {
          setErrorMessage('Company name is required');
          setIsGenerating(false);
          return;
        }
        if (!role || !role.trim()) {
          setErrorMessage('Role title is required');
          setIsGenerating(false);
          return;
        }
        endpoint = '/api/v1/cover-letter';
        payload = {
          company_name: company.trim(),
          role_title: role.trim(),
          job_description: jobDescription?.trim() || null,
          additional_context: additional?.trim() || null,
          tone,
          length,
          format: 'text',
        };
      } else if (selectedTemplate === 'job-application-answer') {
        if (!question || !question.trim()) {
          setErrorMessage('Application question is required');
          setIsGenerating(false);
          return;
        }
        endpoint = '/api/v1/job-application-answer';
        payload = {
          question: question.trim(),
          company_name: company || null,
          job_description: jobDescription || null,
          role_title: role || null,
          format: 'text',
        };
      } else if (selectedTemplate === 'blurb') {
        endpoint = '/api/v1/blurb';
        payload = {
          purpose: blurbPurpose,
          target_role: role || null,
          max_words: maxWords,
          style: blurbStyle,
          format: 'text',
        };
      } else if (selectedTemplate === 'summary') {
        endpoint = '/api/v1/query';
        payload = {
          question: 'Generate a professional summary for my resume based on my career context.',
          format: 'text',
        };
      }

      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        let errorDetail = errorBody.detail || errorBody.message || errorBody.error || `Server returned ${response.status}`;
        
        const errorLower = errorDetail.toLowerCase();
        if (errorLower.includes('career context') || errorLower.includes('upload')) {
          errorDetail = 'Please upload your career context first. Go to Content Manager and upload your resume or career document.';
        }
        
        setIsGenerating(false);
        setErrorMessage(errorDetail);
        return;
      }

      const data = await response.json();
      setGeneratedContent(data.content || '');
      setErrorMessage(null);

      // Update profile if usage info is provided
      if (data.usage_info) {
        setProfile(prev => ({
          ...prev,
          requests_used: data.usage_info.requests_used,
          requests_limit: data.usage_info.requests_limit,
        }));
      }
    } catch (error) {
      setErrorMessage(error.message || 'Error generating content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedContent) return;
    try {
      await navigator.clipboard.writeText(generatedContent);
      setErrorMessage('Copied to clipboard!');
      setTimeout(() => setErrorMessage(null), 2000);
    } catch (err) {
      setErrorMessage('Unable to copy. Please select and copy manually.');
    }
  };

  const handleDownload = () => {
    if (!generatedContent) return;
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `careerpilot_${selectedTemplate}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentTemplate = templates.find(t => t.id === selectedTemplate);
  const usageProgress = profile ? Math.min(100, Math.round((profile.requests_used / profile.requests_limit) * 100)) : 0;

  return (
    <AppShell>
      <Head>
        <title>AI Content Generator | CareerPilot</title>
      </Head>
      <div className="p-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">AI Content Generator</h1>
          <p className="text-gray-600">Create professional career content with AI in seconds.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Template Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
              <h2 className="text-lg text-gray-900 mb-4">Select Template</h2>
              <div className="space-y-3">
                {templates.map((template) => {
                  const IconComponent = template.icon;
                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`w-full flex items-start gap-3 p-4 rounded-lg transition-all text-left ${
                        selectedTemplate === template.id
                          ? 'bg-teal-50 border-2 border-teal-600'
                          : 'border-2 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`${template.color} p-2 rounded-lg text-white`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-gray-900 mb-1 font-medium">{template.name}</h3>
                        <p className="text-xs text-gray-600">{template.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Usage Stats */}
            {profile && (
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
                <h3 className="text-lg mb-4">Generation Credits</h3>
                <div className="text-3xl mb-2 font-semibold">
                  {profile.requests_used} / {profile.requests_limit === 999999 ? '∞' : profile.requests_limit}
                </div>
                <div className="text-sm text-teal-100 mb-4">Credits used this cycle</div>
                <div className="bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all" 
                    style={{ width: `${usageProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Generator Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg text-gray-900 mb-4">Input Information</h2>
              
              {/* Job URL Parser for cover letter and application answer */}
              {(selectedTemplate === 'cover-letter' || selectedTemplate === 'job-application-answer') && (
                <div className="mb-6 p-4 bg-gray-50 border border-teal-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or paste job posting URL (LinkedIn, Indeed, etc.)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      placeholder="https://www.linkedin.com/jobs/view/..."
                      disabled={parsingUrl}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleParseJobUrl}
                      disabled={parsingUrl || !jobUrl.trim()}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all disabled:opacity-50 font-medium"
                    >
                      {parsingUrl ? 'Parsing...' : 'Auto-fill'}
                    </button>
                  </div>
                  {urlError && <p className="text-sm text-red-600 mt-2">{urlError}</p>}
                  <p className="text-xs text-gray-500 mt-2">
                    Paste a job posting URL to automatically fill company name, role title, and job description
                  </p>
                </div>
              )}
              
              <div className="space-y-4">
                {selectedTemplate === 'cover-letter' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g., Senior Product Manager"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g., TechCorp Inc."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
                      <textarea
                        rows={4}
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job description here for better results..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Your Key Skills & Experience</label>
                      <textarea
                        rows={3}
                        value={additional}
                        onChange={(e) => setAdditional(e.target.value)}
                        placeholder="Highlight your relevant skills and experience..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                      <select 
                        value={tone} 
                        onChange={(e) => setTone(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none"
                      >
                        <option value="professional">Professional</option>
                        <option value="friendly">Friendly</option>
                        <option value="formal">Formal</option>
                        <option value="enthusiastic">Enthusiastic</option>
                        <option value="confident">Confident</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
                      <select 
                        value={length} 
                        onChange={(e) => setLength(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none"
                      >
                        <option value="short">Short</option>
                        <option value="medium">Medium</option>
                        <option value="long">Long</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedTemplate === 'job-application-answer' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Application Question *</label>
                      <textarea
                        rows={4}
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="e.g., Describe a time you led a team through ambiguity..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none resize-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company (Optional)</label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g., TechCorp Inc."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role (Optional)</label>
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g., Senior Product Manager"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Job Description (Optional)</label>
                      <textarea
                        rows={4}
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste parts of the job description that matter for this question..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none resize-none"
                      />
                    </div>
                  </>
                )}

                {selectedTemplate === 'blurb' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Blurb Purpose *</label>
                      <input
                        type="text"
                        value={blurbPurpose}
                        onChange={(e) => setBlurbPurpose(e.target.value)}
                        placeholder="LinkedIn introduction, recruiter outreach..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target Role (Optional)</label>
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g., Principal Product Manager"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Words</label>
                        <input
                          type="number"
                          min={50}
                          max={1000}
                          value={maxWords}
                          onChange={(e) => setMaxWords(Number(e.target.value))}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
                        <select 
                          value={blurbStyle} 
                          onChange={(e) => setBlurbStyle(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none"
                        >
                          <option value="linkedin">LinkedIn</option>
                          <option value="email">Email</option>
                          <option value="professional">Professional</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {selectedTemplate === 'summary' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>Note:</strong> This will generate a professional summary based on your uploaded career context.
                    </p>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{errorMessage}</p>
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Content
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Generated Content */}
            {generatedContent && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg text-gray-900">Generated Content</h2>
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
                    <button 
                      onClick={handleGenerate}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all flex items-center gap-2 text-sm font-medium"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">
                    {generatedContent}
                  </pre>
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="text-sm text-blue-900">
                      <strong>AI Tip:</strong> Review and personalize this content to make it uniquely yours. Add specific examples and achievements to stand out.
                    </div>
                  </div>
                </div>
              </div>
            )}
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
