import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from '@supabase/auth-helpers-react';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import AppShell from '../components/AppShell';

const formatDateTime = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
};

export default function Docs({ user }) {
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

  const [contexts, setContexts] = useState([]);
  const [generatedDocs, setGeneratedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocuments = useCallback(async () => {
    if (!apiBaseUrl || !accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/documents?context_limit=50&generated_limit=50`, {
        headers: authHeaders,
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Unable to load documents');
      }
      const data = await response.json();
      setContexts(data.contexts || []);
      setGeneratedDocs(data.generated_documents || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, accessToken, authHeaders]);

  useEffect(() => {
    if (!apiBaseUrl || !accessToken) return;
    fetchDocuments();
  }, [apiBaseUrl, accessToken, fetchDocuments]);

  const handleCopy = async (content) => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handleDownload = (doc) => {
    if (typeof window === 'undefined' || !doc?.content) return;
    const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `${doc.title || doc.document_type || 'career-agent-doc'}.txt`.replace(/\s+/g, '-');
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <Head>
        <title>Docs | CareerPilot</title>
      </Head>
      <main className="docs">
        <section className="docs__hero">
          <div>
            <span className="docs__pill">Your document library</span>
            <h1>
              Everything you&apos;ve <span>uploaded and generated</span>
            </h1>
            <p>
              Keep tabs on your uploaded career context and the AI-crafted outputs you&apos;ve produced along the way.
              Download, reuse, and iterate as your search evolves.
            </p>
            {error && <p className="error">Unable to load documents: {error}</p>}
            {loading && <p className="muted">Loading documents…</p>}
          </div>
        </section>

        <section className="docs__grid">
          <article className="docs__panel">
            <header>
              <h2>Uploaded contexts</h2>
              <p className="muted">
                Every resume, brag document, or notes file you&apos;ve added. Manage uploads from the dashboard.
              </p>
            </header>
            {contexts.length === 0 && !loading ? (
              <p className="muted">No uploads yet. Add your core career context from the dashboard to get started.</p>
            ) : (
              <ul className="docs__list">
                {contexts.map((context) => (
                  <li key={context.id} className="docs__item">
                    <div className="docs__item-meta">
                      <strong>{context.file_name || 'Manual entry'}</strong>
                      <span>
                        {new Date(context.uploaded_at).toLocaleDateString()} · {context.character_count.toLocaleString()}{' '}
                        chars
                      </span>
                    </div>
                    <div className="docs__item-actions">
                      <a href={context.download_url} className="ghost ghost--muted" target="_blank" rel="noreferrer">
                        Download
                      </a>
                    </div>
                    <p className="docs__item-preview">{context.preview || 'No preview available.'}</p>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="docs__panel">
            <header>
              <h2>Generated content</h2>
              <p className="muted">
                Outputs produced through the generator, saved automatically so you can quickly revisit and reuse them.
              </p>
            </header>
            {generatedDocs.length === 0 && !loading ? (
              <p className="muted">No generated documents yet. Use the generator to craft your next cover letter.</p>
            ) : (
              <ul className="docs__list">
                {generatedDocs.map((doc) => (
                  <li key={doc.id} className="docs__item">
                    <div className="docs__item-meta">
                      <div className="docs__item-heading">
                        <span className="badge badge--endpoint">{doc.document_type}</span>
                        <strong>{doc.title || 'Generated document'}</strong>
                      </div>
                      <span>{formatDateTime(doc.created_at)}</span>
                    </div>
                    <p className="docs__item-preview">{doc.preview || doc.content.slice(0, 200)}</p>
                    <div className="docs__item-actions">
                      <button type="button" className="ghost ghost--bright" onClick={() => handleCopy(doc.content)}>
                        Copy
                      </button>
                      <button type="button" className="ghost ghost--muted" onClick={() => handleDownload(doc)}>
                        Download
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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


