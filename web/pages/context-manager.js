import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import AppShell from '../components/AppShell';

export default function ContextManager({ user }) {
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
    if (window.location.hostname === 'careerpilotconsulting.com' || window.location.hostname === 'www.careerpilotconsulting.com') {
      return 'https://api.careerpilotconsulting.com';
    }
    return `${window.location.origin}`;
  }, []);

  const [contexts, setContexts] = useState([]);
  const [loadingContexts, setLoadingContexts] = useState(true);
  const [contextsError, setContextsError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [contextText, setContextText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [appendText, setAppendText] = useState('');
  const [appendPending, setAppendPending] = useState(false);
  const [appendMessage, setAppendMessage] = useState(null);
  const [appendError, setAppendError] = useState(null);
  const [deletingContextId, setDeletingContextId] = useState(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const authHeaders = useMemo(() => {
    if (!accessToken) {
      return {};
    }
    return {
      Authorization: `Bearer ${accessToken}`,
    };
  }, [accessToken]);

  const fetchContexts = useCallback(async () => {
    if (!apiBaseUrl || !accessToken || isSigningOut) {
      return;
    }

    setLoadingContexts(true);
    setContextsError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/contexts?limit=20`, {
        headers: authHeaders,
      });

      if (!response.ok) {
        if (response.status === 404) {
          if (!isSigningOut) {
            setContexts([]);
            setLoadingContexts(false);
          }
          return;
        }
        if (response.status === 401) {
          if (!isSigningOut) {
            setContexts([]);
            setLoadingContexts(false);
          }
          return;
        }
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Failed to load contexts');
      }

      const data = await response.json();
      if (!isSigningOut) {
        setContexts(data.contexts || []);
      }
    } catch (err) {
      if (!isSigningOut && !err.message.includes('404') && !err.message.includes('401')) {
        setContextsError(err.message);
      } else if (!isSigningOut) {
        setContexts([]);
      }
    } finally {
      if (!isSigningOut) {
        setLoadingContexts(false);
      }
    }
  }, [apiBaseUrl, accessToken, authHeaders, isSigningOut]);

  useEffect(() => {
    if (!session || !accessToken || !apiBaseUrl || isSigningOut) {
      return;
    }

    fetchContexts();
  }, [session, accessToken, apiBaseUrl, isSigningOut, fetchContexts]);

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

    // Check if there are existing contexts and show warning
    if (contexts && contexts.length > 0) {
      const confirmUpload = window.confirm(
        'You have existing career context documents. If you continue, all existing context documents will be deleted and replaced with this new upload. Do you want to continue?'
      );
      
      if (!confirmUpload) {
        return; // User cancelled
      }

      // Delete all existing contexts
      console.log(`Deleting ${contexts.length} existing context(s)...`);
      for (const context of contexts) {
        try {
          const deleteResponse = await fetch(`${apiBaseUrl}/api/v1/contexts/${context.id}`, {
            method: 'DELETE',
            headers: authHeaders,
          });
          
          if (!deleteResponse.ok) {
            console.warn(`Failed to delete context ${context.id}`);
          }
        } catch (err) {
          console.warn(`Error deleting context ${context.id}:`, err);
        }
      }
      
      // Wait a moment for deletions to complete
      await new Promise(resolve => setTimeout(resolve, 500));
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

      await fetchContexts();
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
      const response = await fetch(`${apiBaseUrl}/api/v1/contexts/append`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: appendText.trim() }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Append failed');
      }

      const data = await response.json();
      setAppendMessage(data.message || 'Text appended successfully.');
      setAppendText('');
      await fetchContexts();
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

  return (
    <AppShell>
      <Head>
        <title>Context Manager | CareerPilot</title>
      </Head>
      <main className="dashboard dashboard--gradient">
        <header className="dashboard__hero">
          <div className="dashboard__hero-text">
            <span className="dashboard__hero-pill">Career Context Manager</span>
            <h1>Manage Your Career Context</h1>
            <p>Upload and manage your career documents, resumes, and achievements. The AI uses this context to personalize all generated materials.</p>
          </div>
        </header>

        <section className="dashboard__panels">
          <article className="panel-card panel-card--context">
            <div className="panel-card__header">
              <div>
                <h2>Upload Career Context</h2>
                <p>Upload resumes, notes, and career assets for the agent to reference. Upload everything from day one of your career for best results.</p>
              </div>
            </div>
            <form className="context-form" onSubmit={handleUpload}>
              <div className="input-group">
                <label htmlFor="context-file">Upload a .txt, .md, .doc, or .pdf file</label>
                <input id="context-file" type="file" accept=".txt,.md,.markdown,.doc,.docx,.pdf" onChange={handleFileChange} />
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

          <article className="panel-card">
            <div className="panel-card__header">
              <div>
                <h2>Your Context Documents</h2>
                <p>Manage your uploaded career context documents.</p>
              </div>
            </div>
            {loadingContexts ? (
              <p className="muted">Loading contexts…</p>
            ) : contextsError ? (
              <p className="error">Error: {contextsError}</p>
            ) : contexts.length === 0 ? (
              <p className="muted">No context documents uploaded yet. Upload your first document above.</p>
            ) : (
              <ul className="context-list">
                {contexts.map((context) => (
                  <li key={context.id} className="context-item">
                    <div className="context-item__info">
                      <strong>{context.filename || 'Career Context'}</strong>
                      <span className="muted">
                        {formatTimestamp(context.uploaded_at)} · {context.character_count?.toLocaleString() || 0} chars
                        {context.is_active && <span className="badge badge--active">Active</span>}
                      </span>
                    </div>
                    <div className="context-item__actions">
                      <button
                        type="button"
                        className="ghost ghost--muted"
                        onClick={() => handleDeleteContext(context.id)}
                        disabled={deletingContextId === context.id}
                      >
                        {deletingContextId === context.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {contextsError && <p className="error">{contextsError}</p>}
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



