import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import AppShell from '../components/AppShell';

export default function Dashboard({ user }) {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const session = useSession();
  const accessToken = session?.access_token;

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);

  const [contexts, setContexts] = useState([]);
  const [loadingContexts, setLoadingContexts] = useState(true);
  const [contextsError, setContextsError] = useState(null);

  const [usageSummary, setUsageSummary] = useState(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [usageError, setUsageError] = useState(null);

  const [contextText, setContextText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadMessage, setUploadMessage] = useState(null);

  const [appendText, setAppendText] = useState('');
  const [appendPending, setAppendPending] = useState(false);
  const [appendError, setAppendError] = useState(null);
  const [appendMessage, setAppendMessage] = useState(null);

  const [deletingContextId, setDeletingContextId] = useState(null);

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

  const authHeaders = useMemo(() => {
    if (!accessToken) {
      return {};
    }
    return {
      Authorization: `Bearer ${accessToken}`,
    };
  }, [accessToken]);

  const fetchProfile = useCallback(async () => {
    if (!apiBaseUrl || !accessToken) {
      return;
    }
    setLoadingProfile(true);
    setProfileError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/me`, {
        headers: authHeaders,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Failed to load profile');
      }

      const data = await response.json();
      setProfile(data);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setLoadingProfile(false);
    }
  }, [apiBaseUrl, accessToken, authHeaders]);

  const fetchContexts = useCallback(async () => {
    if (!apiBaseUrl || !accessToken) {
      return;
    }

    setLoadingContexts(true);
    setContextsError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/contexts?limit=20`, {
        headers: authHeaders,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Failed to load contexts');
      }

      const data = await response.json();
      setContexts(data.contexts || []);
    } catch (err) {
      setContextsError(err.message);
    } finally {
      setLoadingContexts(false);
    }
  }, [apiBaseUrl, accessToken, authHeaders]);

  const fetchUsage = useCallback(async () => {
    if (!apiBaseUrl || !accessToken) {
      return;
    }

    setLoadingUsage(true);
    setUsageError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/usage?limit=10`, {
        headers: authHeaders,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Failed to load usage history');
      }

      const data = await response.json();
      setUsageSummary(data);
    } catch (err) {
      setUsageError(err.message);
    } finally {
      setLoadingUsage(false);
    }
  }, [apiBaseUrl, accessToken, authHeaders]);

  useEffect(() => {
    if (!accessToken || !apiBaseUrl) {
      return;
    }

    fetchProfile();
    fetchContexts();
    fetchUsage();
  }, [accessToken, apiBaseUrl, fetchProfile, fetchContexts, fetchUsage]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
    setUploadError(null);
    setUploadMessage(null);
  };

  const handleAppendReset = () => {
    setAppendText('');
    setAppendError(null);
    setAppendMessage(null);
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!apiBaseUrl || !accessToken) {
      return;
    }

    const trimmedText = contextText.trim();
    if (!selectedFile && trimmedText.length === 0) {
      setUploadError('Provide a file or paste text before uploading.');
      return;
    }

    const formData = new FormData();
    if (selectedFile) {
      formData.append('file', selectedFile);
    }
    if (trimmedText) {
      formData.append('context_text', trimmedText);
    }

    setUploading(true);
    setUploadError(null);
    setUploadMessage(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/upload-context`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Upload failed');
      }

      const data = await response.json();
      setUploadMessage(data.message || 'Context uploaded successfully.');
      setContextText('');
      setSelectedFile(null);
      event.target.reset();

      await Promise.all([fetchContexts(), fetchProfile()]);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAppend = async (event) => {
    event.preventDefault();

    if (!apiBaseUrl || !accessToken) {
      return;
    }

    if (!appendText.trim()) {
      setAppendError('Add text before appending.');
      return;
    }

    setAppendPending(true);
    setAppendError(null);
    setAppendMessage(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/append-context`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: appendText }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Unable to append context');
      }

      const data = await response.json();
      setAppendMessage(data.message || 'Context updated.');
      setAppendText('');
      await Promise.all([fetchContexts(), fetchProfile()]);
    } catch (err) {
      setAppendError(err.message);
    } finally {
      setAppendPending(false);
    }
  };

  const handleDeleteContext = async (contextId) => {
    if (!apiBaseUrl || !accessToken) {
      return;
    }

    const confirmDelete =
      typeof window !== 'undefined'
        ? window.confirm('Delete this context? This cannot be undone.')
        : true;

    if (!confirmDelete) {
      return;
    }

    setDeletingContextId(contextId);
    setContextsError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/contexts/${contextId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Failed to delete context');
      }

      await fetchContexts();
      await fetchProfile();
    } catch (err) {
      setContextsError(err.message);
    } finally {
      setDeletingContextId(null);
    }
  };

  const formatTimestamp = useCallback((isoString) => {
    if (!isoString) {
      return 'Unknown date';
    }
    const parsed = new Date(isoString);
    if (Number.isNaN(parsed.getTime())) {
      return 'Unknown date';
    }
    return parsed.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const usageProgress = useMemo(() => {
    if (!profile || !profile.requests_limit) {
      return 0;
    }
    return Math.min(100, Math.round((profile.requests_used / profile.requests_limit) * 100));
  }, [profile]);

  const remainingRequests =
    profile && typeof profile.requests_limit === 'number'
      ? Math.max(profile.requests_limit - profile.requests_used, 0)
      : null;
  const trialMessage =
    profile?.subscription_tier === 'free'
      ? remainingRequests === 0
        ? 'You have used both complimentary requests. Unlock unlimited access with the premium plan.'
        : `You have ${remainingRequests} complimentary ${remainingRequests === 1 ? 'request' : 'requests'} left before upgrading.`
      : 'You are on a premium plan with extended access.';

  const nextPrompts = useMemo(
    () => [
      {
        title: 'Interview prep',
        description: 'Ask for “five behavioral interview questions based on my experience and sample answers.”',
      },
      {
        title: 'STAR story polish',
        description: 'Prompt: “Turn my latest project win into a STAR-format story highlighting metrics.”',
      },
      {
        title: 'Quick LinkedIn outreach',
        description: 'Prompt: “Draft a 100-word LinkedIn DM for a recruiter at {companyName} referencing my achievements.”',
      },
    ],
    []
  );

  return (
    <AppShell>
      <Head>
        <title>CareerPilot Dashboard</title>
      </Head>
      <main className="dashboard dashboard--gradient">
        <header className="dashboard__hero">
          <div className="dashboard__hero-text">
            <span className="dashboard__hero-pill">Career-Agent workspace</span>
            <h1>
              Welcome back, <span>{profile?.name || user?.email}</span>
            </h1>
            <p>Ship interview answers, STAR stories, and executive blurbs with your tailored AI co-pilot.</p>
            {loadingProfile && <p className="muted">Loading your usage data…</p>}
            {profileError && <p className="error">Unable to load profile: {profileError}</p>}
          </div>
          <div className="dashboard__hero-card">
            <div className="dashboard__hero-card-header">
              <h2>Plan status</h2>
              <button onClick={handleSignOut} className="ghost">
                Sign out
              </button>
            </div>
            {profile && !loadingProfile && !profileError ? (
              <>
                <span className="badge badge--plan">{profile.subscription_tier.toUpperCase()} plan</span>
                <div className="dashboard__usage-bar">
                  <div className="dashboard__usage-progress" style={{ width: `${usageProgress}%` }} />
                </div>
                <p>
                  {profile.requests_used} of {profile.requests_limit} requests used
                </p>
              </>
            ) : (
              <p className="muted">We’ll personalize this once your profile loads.</p>
            )}
          </div>
        </header>

        <section className="dashboard__panels">
          <article className="panel-card panel-card--context">
            <div className="panel-card__header">
              <div>
                <h2>Career context manager</h2>
                <p>Upload resumes, notes, and career assets for the agent to reference.</p>
              </div>
            </div>
            <form className="context-form" onSubmit={handleUpload}>
              <div className="input-group">
                <label htmlFor="context-file">Upload a .txt or .md file</label>
                <input id="context-file" type="file" accept=".txt,.md,.markdown" onChange={handleFileChange} />
                {selectedFile && <span className="muted">Selected file: {selectedFile.name}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="context-text">Or paste your content</label>
                <textarea
                  id="context-text"
                  rows={6}
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  placeholder="Paste your resume, achievements, or notes here…"
                />
              </div>

              <button type="submit" className="cta" disabled={uploading}>
                {uploading ? 'Uploading…' : 'Save context'}
              </button>

              {uploadMessage && <p className="success">{uploadMessage}</p>}
              {uploadError && <p className="error">Upload failed: {uploadError}</p>}
            </form>

            <form className="append-form" onSubmit={handleAppend}>
              <div className="input-group">
                <label htmlFor="append-text">Add to existing context</label>
                <textarea
                  id="append-text"
                  rows={4}
                  value={appendText}
                  onChange={(e) => setAppendText(e.target.value)}
                  placeholder="Add notes from your latest project, certifications, or performance reviews…"
                />
              </div>
              <div className="append-form__actions">
                <button type="submit" className="ghost ghost--bright" disabled={appendPending}>
                  {appendPending ? 'Appending…' : 'Append text'}
                </button>
                <button type="button" className="ghost ghost--muted" onClick={handleAppendReset} disabled={appendPending}>
                  Clear
                </button>
              </div>
              {appendMessage && <p className="success">{appendMessage}</p>}
              {appendError && <p className="error">{appendError}</p>}
            </form>

          </article>

          <article className="panel-card panel-card--usage">
            <div className="panel-card__header">
              <div>
                <h2>Activity timeline</h2>
                <p>Stay on top of your latest generations and upcoming goals.</p>
              </div>
              <Link href="#" className="link disabled">
                Manage subscription (coming soon)
              </Link>
            </div>

            <div className="panel-card__body">
              {loadingUsage && <p className="muted">Loading usage history…</p>}
              {usageError && <p className="error">Unable to load usage: {usageError}</p>}
              {trialMessage && <p className="trial-banner">{trialMessage}</p>}
              {!loadingUsage && !usageError && usageSummary && usageSummary.recent_usage?.length > 0 && (
                <ul className="usage-list">
                  {usageSummary.recent_usage.map((record) => (
                    <li key={record.id} className="usage-list__item">
                      <span className="badge badge--endpoint">{record.endpoint}</span>
                      <span>{formatTimestamp(record.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {!loadingUsage && !usageError && usageSummary && usageSummary.recent_usage?.length === 0 && (
                <p className="muted">You have not generated any content yet.</p>
              )}
            </div>
          </article>

          <article className="panel-card panel-card--generator">
            <div className="panel-card__header">
              <div>
                <h2>Launch generator</h2>
                <p>Create cover letters, STAR stories, and interview answers grounded in your context.</p>
              </div>
            </div>
            <div className="panel-card__actions">
              <Link href="/generator" className="cta">
                Open generator (beta)
              </Link>
              <p className="muted">We’ll pull your latest context automatically during each session.</p>
            </div>
            <div className="next-prompts">
              <h3>Try these prompts next</h3>
              <ul>
                {nextPrompts.map((prompt) => (
                  <li key={prompt.title}>
                    <strong>{prompt.title}</strong>
                    <span>{prompt.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
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

