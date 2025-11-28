import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import AppShell from '../components/AppShell';

const toneOptions = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal', label: 'Formal' },
];

const lengthOptions = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
];

const generatorModes = [
  { value: 'cover-letter', label: 'Cover letter' },
  { value: 'job-application-answer', label: 'Application answer' },
  { value: 'blurb', label: 'Networking blurb' },
];

export default function Generator({ user }) {
  const supabase = useSupabaseClient();
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.replace('/');
    }
  }, [session, router]);

  const accessToken = session?.access_token;

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
    // Use API subdomain for production
    if (window.location.hostname === 'careerpilotconsulting.com' || window.location.hostname === 'www.careerpilotconsulting.com') {
      return 'https://api.careerpilotconsulting.com';
    }
    return `${window.location.origin}`;
  }, []);

  const [mode, setMode] = useState('cover-letter');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [additional, setAdditional] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [blurbPurpose, setBlurbPurpose] = useState('LinkedIn introduction');
  const [blurbStyle, setBlurbStyle] = useState('linkedin');
  const [maxWords, setMaxWords] = useState(200);
  const [question, setQuestion] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [parsingUrl, setParsingUrl] = useState(false);
  const [urlError, setUrlError] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const authHeaders = useMemo(() => {
    if (!accessToken) {
      return {};
    }
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }, [accessToken]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!apiBaseUrl || !accessToken) {
      setErrorMessage('You need to be signed in to generate.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setResult(null);

    try {
      let endpoint = '';
      let payload = {};

      if (mode === 'cover-letter') {
        endpoint = '/api/v1/cover-letter';
        payload = {
          company_name: company,
          role_title: role,
          job_description: jobDescription || undefined,
          additional_context: additional || undefined,
          tone,
          length,
          format: 'text',
        };
      } else if (mode === 'job-application-answer') {
        endpoint = '/api/v1/job-application-answer';
        payload = {
          question,
          company_name: company || undefined,
          job_description: jobDescription || undefined,
          role_title: role || undefined,
          format: 'text',
        };
      } else if (mode === 'blurb') {
        endpoint = '/api/v1/blurb';
        payload = {
          purpose: blurbPurpose,
          target_role: role || undefined,
          max_words: maxWords,
          style: blurbStyle,
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
        throw new Error(errorBody.detail || 'Failed to generate content');
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setErrorMessage(error.message || 'Error generating content. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderModeSpecificFields = () => {
    switch (mode) {
      case 'cover-letter':
        return (
          <>
            <label htmlFor="company">Company name</label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Corp"
              required
            />

            <label htmlFor="role">Role title</label>
            <input
              id="role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Senior Product Manager"
              required
            />

            <label htmlFor="jobDescription">Job description or key requirements</label>
            <textarea
              id="jobDescription"
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the most important parts of the job description here..."
            />

            <label htmlFor="additional">Additional points to include</label>
            <textarea
              id="additional"
              rows={4}
              value={additional}
              onChange={(e) => setAdditional(e.target.value)}
              placeholder="Specific stories, metrics, or talking points you'd like to emphasize..."
            />

            <div className="generator__inline">
              <div>
                <label htmlFor="tone">Tone</label>
                <select id="tone" value={tone} onChange={(e) => setTone(e.target.value)}>
                  {toneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="length">Length</label>
                <select id="length" value={length} onChange={(e) => setLength(e.target.value)}>
                  {lengthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        );
      case 'job-application-answer':
        return (
          <>
            <label htmlFor="question">Application question</label>
            <textarea
              id="question"
              rows={4}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Describe a time you led a team through ambiguity..."
              required
            />

            <label htmlFor="companyOptional">Company (optional)</label>
            <input
              id="companyOptional"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Corp"
            />

            <label htmlFor="roleOptional">Role (optional)</label>
            <input
              id="roleOptional"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Senior Product Manager"
            />

            <label htmlFor="jobDescriptionOptional">Job description (optional)</label>
            <textarea
              id="jobDescriptionOptional"
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste parts of the job description that matter for this question..."
            />
          </>
        );
      case 'blurb':
        return (
          <>
            <label htmlFor="purpose">Blurb purpose</label>
            <input
              id="purpose"
              type="text"
              value={blurbPurpose}
              onChange={(e) => setBlurbPurpose(e.target.value)}
              placeholder="LinkedIn introduction, recruiter outreach..."
              required
            />

            <label htmlFor="roleBlurb">Target role (optional)</label>
            <input
              id="roleBlurb"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Principal Product Manager"
            />

            <div className="generator__inline">
              <div>
                <label htmlFor="maxWords">Max words</label>
                <input
                  id="maxWords"
                  type="number"
                  min={50}
                  max={1000}
                  value={maxWords}
                  onChange={(e) => setMaxWords(Number(e.target.value))}
                />
              </div>
              <div>
                <label htmlFor="style">Style</label>
                <select id="style" value={blurbStyle} onChange={(e) => setBlurbStyle(e.target.value)}>
                  <option value="linkedin">LinkedIn</option>
                  <option value="email">Email</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

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

      // Auto-fill form fields
      if (data.company_name) {
        setCompany(data.company_name);
      }
      if (data.role_title) {
        setRole(data.role_title);
      }
      if (data.job_description) {
        setJobDescription(data.job_description);
      }

      setUrlError(null);
      setJobUrl(''); // Clear URL after successful parse
    } catch (error) {
      setUrlError(error.message || 'Error parsing job URL. Please try again or enter details manually.');
    } finally {
      setParsingUrl(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.content) return;
    try {
      await navigator.clipboard.writeText(result.content);
      setErrorMessage('Copied to clipboard!');
      setTimeout(() => setErrorMessage(null), 2000);
    } catch (err) {
      setErrorMessage('Unable to copy. Please select and copy manually.');
    }
  };

  return (
    <AppShell>
      <Head>
        <title>Generator | CareerPilot</title>
      </Head>
      <main className="generator">
        <div className="generator__header">
          <div>
            <span className="generator__pill">Career-Agent Workspace</span>
            <h1>Generate on-brand materials instantly</h1>
            <p>
              Use your uploaded context to produce polished cover letters, tailored application answers, and punchy
              blurbs.
            </p>
          </div>
          <Link href="/dashboard" className="ghost ghost--muted">
            ← Back to dashboard
          </Link>
        </div>

        <section className="generator__content">
          <form className="generator__form" onSubmit={handleSubmit}>
            <div className="generator__mode">
              <label htmlFor="mode">Choose what to create</label>
              <div id="mode" className="generator__mode-buttons">
                {generatorModes.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={mode === option.value ? 'active' : ''}
                    onClick={() => setMode(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Job URL Parser */}
            {(mode === 'cover-letter' || mode === 'job-application-answer') && (
              <div className="generator__url-parser">
                <label htmlFor="jobUrl">Or paste job posting URL (LinkedIn, Indeed, etc.)</label>
                <div className="generator__url-input-group">
                  <input
                    id="jobUrl"
                    type="url"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/jobs/view/..."
                    disabled={parsingUrl}
                  />
                  <button
                    type="button"
                    onClick={handleParseJobUrl}
                    disabled={parsingUrl || !jobUrl.trim()}
                    className="ghost ghost--bright"
                  >
                    {parsingUrl ? 'Parsing...' : 'Auto-fill'}
                  </button>
                </div>
                {urlError && <p className="error">{urlError}</p>}
                <p className="muted" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Paste a job posting URL to automatically fill company name, role title, and job description
                </p>
              </div>
            )}

            {renderModeSpecificFields()}

            {errorMessage && <p className="error">{errorMessage}</p>}

            <button type="submit" className="cta generator__submit" disabled={submitting}>
              {submitting ? 'Generating…' : 'Generate'}
            </button>
          </form>

          <aside className="generator__aside">
            <div className="generator__result-card">
              <h2>Output</h2>
              <p className="muted">The generated text will appear here. Copy or tweak before sending.</p>
              {result ? (
                <>
                  <div className="generator__result-meta">
                    <span className="badge badge--endpoint">{mode}</span>
                    {result.metadata && (
                      <span className="muted">
                        {Object.entries(result.metadata)
                          .filter(([, value]) => Boolean(value))
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(' · ')}
                      </span>
                    )}
                  </div>
                  <pre className="generator__result">{result.content}</pre>
                  <button type="button" className="ghost ghost--bright" onClick={handleCopy}>
                    Copy text
                  </button>
                  {result.usage_info && (
                    <p className="muted generator__usage-hint">
                      {result.usage_info.requests_used} of {result.usage_info.requests_limit} requests used.
                    </p>
                  )}
                </>
              ) : (
                <div className="generator__placeholder">
                  <p>Generate a piece of content to see it here.</p>
                  <p className="muted">
                    We will automatically ground outputs in your currently active context. For best results, make sure
                    your context is up to date.
                  </p>
                </div>
              )}
            </div>

            <div className="generator__tips">
              <h3>Pro tips</h3>
              <ul>
                <li>
                  <strong>Tweak the tone</strong>
                  <span>Experiment with the tone and length controls to match the audience you’re writing for.</span>
                </li>
                <li>
                  <strong>Refresh your context</strong>
                  <span>Upload or append new wins before generating to keep outputs accurate.</span>
                </li>
                <li>
                  <strong>Iterate quickly</strong>
                  <span>Generate, tweak the prompt, and regenerate. You can append new context mid-session.</span>
                </li>
              </ul>
            </div>
          </aside>
        </section>
      </main>
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

