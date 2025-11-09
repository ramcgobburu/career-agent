import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

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

  return (
    <>
      <Head>
        <title>CareerPilot Dashboard</title>
      </Head>
      <main className="dashboard">
        <header className="dashboard__header">
          <div>
            <h1>Welcome back, {profile?.name || user?.email}</h1>
            <p>Your AI co-pilot is ready to generate career materials.</p>
            {loadingProfile && <p className="muted">Loading your usage data…</p>}
            {profileError && <p className="error">Unable to load profile: {profileError}</p>}
            {profile && !loadingProfile && !profileError && (
              <div className="usage-banner">
                <div className="usage-banner__tier">{profile.subscription_tier.toUpperCase()} plan</div>
                <div className="usage-banner__details">
                  <span>
                    {profile.requests_used} of {profile.requests_limit} requests used
                  </span>
                  <div className="usage-progress">
                    <div className="usage-progress__bar" style={{ width: `${usageProgress}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <button onClick={handleSignOut} className="secondary">
            Sign out
          </button>
        </header>

        <section className="dashboard__grid">
          <article>
            <h2>Generate Materials</h2>
            <p>
              Create cover letters, interview responses, or blurbs customized to your path. Our AI references your
              uploaded context to stay authentic.
            </p>
            <a href="https://careerpilotconsulting.com" className="link" target="_blank" rel="noreferrer">
              Open Generator (coming soon)
            </a>
          </article>

          <article>
            <h2>Manage Context</h2>
            <p>
              Upload or update your career context (resume, portfolio, achievements) so the AI has the latest
              information about you.
            </p>

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

            {loadingContexts && <p className="muted">Loading contexts…</p>}
            {contextsError && <p className="error">Unable to load contexts: {contextsError}</p>}
            {!loadingContexts && !contextsError && contexts.length === 0 && (
              <p className="muted">No contexts yet. Upload a file or paste text to get started.</p>
            )}
            {!loadingContexts && !contextsError && contexts.length > 0 && (
              <ul className="context-list">
                {contexts.map((ctx) => (
                  <li key={ctx.id} className="context-list__item">
                    <div>
                      <div className="context-list__meta">
                        <span className="context-list__name">{ctx.file_name || 'Manual entry'}</span>
                        {ctx.is_active && <span className="badge badge--active">Active</span>}
                      </div>
                      <p className="context-list__preview">{ctx.preview || 'No preview available.'}</p>
                      <p className="context-list__details">
                        {formatTimestamp(ctx.uploaded_at)} · {ctx.character_count.toLocaleString()} characters
                      </p>
                    </div>
                    <button
                      type="button"
                      className="context-list__delete"
                      onClick={() => handleDeleteContext(ctx.id)}
                      disabled={deletingContextId === ctx.id}
                    >
                      {deletingContextId === ctx.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article>
            <h2>Usage & Billing</h2>
            <p>
              Track how many generations you have used and upgrade to unlock additional features, personalized coaching,
              and advanced outputs.
            </p>
            <Link href="#" className="link disabled">
              Manage subscription (in progress)
            </Link>

            {loadingUsage && <p className="muted">Loading usage history…</p>}
            {usageError && <p className="error">Unable to load usage: {usageError}</p>}
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
          </article>
        </section>
      </main>
    </>
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

