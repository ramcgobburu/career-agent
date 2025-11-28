import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import AppShell from '../components/AppShell';

const highlightIcons = {
  context: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 1.667C5.858 1.667 2.5 4.425 2.5 8.125c0 2.45 1.71 4.61 4.271 5.788l-.862 3.64a.417.417 0 0 0 .612.453L10 16.75l3.479 1.256a.417.417 0 0 0 .612-.453l-.862-3.64c2.561-1.178 4.271-3.338 4.271-5.788 0-3.7-3.358-6.458-7.5-6.458Z"
        fill="currentColor"
        opacity="0.3"
      />
      <path d="M10 8.333a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" fill="currentColor" />
      <path
        d="M10 10.833c-1.512 0-2.917-.825-2.917-1.875 0-.46.385-.833.833-.833h4.168c.46 0 .833.374.833.833 0 1.05-1.405 1.875-2.917 1.875Z"
        fill="currentColor"
      />
    </svg>
  ),
  usage: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M15.833 10A5.833 5.833 0 1 1 10 4.167"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.35"
      />
      <path
        d="M16.667 5L10 11.667l-2.5-2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  streak: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M6.667 2.5s-1.667 3.333 1.666 5c0 0-2.5.833-2.5 3.333 0 1.666 1.5 3.334 4.167 3.334 3.333 0 5.833-2.5 5.833-5.834 0-3.333-2.916-5.833-2.916-5.833S8.333 6.667 8.333 8.334c0 1.25.833 1.666.833 1.666"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

export default function Account({ user }) {
  const supabase = useSupabaseClient();
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.replace('/');
    }
  }, [session, router]);

  const accessToken = session?.access_token;

  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [contexts, setContexts] = useState([]);
  const [contextsError, setContextsError] = useState(null);
  const [loadingContexts, setLoadingContexts] = useState(true);

  const [usageSummary, setUsageSummary] = useState(null);
  const [usageError, setUsageError] = useState(null);
  const [loadingUsage, setLoadingUsage] = useState(true);

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
    if (!apiBaseUrl || !accessToken) return;
    setLoadingProfile(true);
    setProfileError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/me`, { headers: authHeaders });
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
    if (!apiBaseUrl || !accessToken) return;
    setLoadingContexts(true);
    setContextsError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/contexts?limit=20`, { headers: authHeaders });
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
    if (!apiBaseUrl || !accessToken) return;
    setLoadingUsage(true);
    setUsageError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/usage?limit=10`, { headers: authHeaders });
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

  const usageTotals = usageSummary?.totals || {};
  const coverLettersGenerated = usageTotals['cover-letter'] || 0;
  const blurbsGenerated = usageTotals['blurb'] || 0;
  const answersGenerated = usageTotals['job-application-answer'] || 0;

  const latestActivity = usageSummary?.recent_usage?.[0]
    ? usageSummary.recent_usage[0].created_at
    : null;

  const remainingRequests =
    profile && typeof profile.requests_limit === 'number'
      ? Math.max(profile.requests_limit - profile.requests_used, 0)
      : null;

  const trialMessage =
    profile?.subscription_tier === 'free'
      ? remainingRequests === 0
        ? 'You have used both complimentary requests. Upgrade to unlock unlimited access.'
        : `You have ${remainingRequests} complimentary ${remainingRequests === 1 ? 'request' : 'requests'} left before upgrading.`
      : 'You are on a premium plan with extended access.';

  return (
    <AppShell>
      <Head>
        <title>Account | CareerPilot</title>
      </Head>
      <main className="account">
        <section className="account__hero">
          <div>
            <span className="account__pill">Account overview</span>
            <h1>
              {profile ? profile.name || user?.email : 'Your account'} <span>at a glance</span>
            </h1>
            <p>
              Review your plan, context footprint, and recent generation activity. Keep everything aligned with your
              next career moment.
            </p>
            {loadingProfile && <p className="muted">Loading account details…</p>}
            {profileError && <p className="error">Unable to load profile: {profileError}</p>}
          </div>
          <div className="account__plan-card">
            <h2>Current plan</h2>
            {profile && !loadingProfile && !profileError ? (
              <>
                <span className="badge badge--plan">{profile.subscription_tier.toUpperCase()}</span>
                <p className="muted">
                  {profile.requests_used} of {profile.requests_limit} requests used this cycle.
                </p>
                <p className="muted">{trialMessage}</p>
              </>
            ) : (
              <p className="muted">We’ll show your subscription details once loaded.</p>
            )}
          </div>
        </section>

        <section className="dashboard__highlights account__highlights">
          <article className="highlight-card">
            <div className="highlight-card__icon highlight-card__icon--context">{highlightIcons.context}</div>
            <h3>Context vault</h3>
            <p>Keep resumes, wins, and notes ready for every prompt.</p>
            <span className="highlight-card__metric">
              {loadingContexts ? 'Loading…' : `${contexts.length || '—'} stored contexts`}
            </span>
            {contextsError && <p className="error">{contextsError}</p>}
          </article>

          <article className="highlight-card">
            <div className="highlight-card__icon highlight-card__icon--usage">{highlightIcons.usage}</div>
            <h3>Generation streak</h3>
            <p>Track where you spend the most requests to plan ahead.</p>
            <span className="highlight-card__metric">
              {loadingUsage
                ? 'Loading…'
                : `${coverLettersGenerated} cover letters · ${blurbsGenerated} blurbs · ${answersGenerated} answers`}
            </span>
            {usageError && <p className="error">{usageError}</p>}
          </article>

          <article className="highlight-card">
            <div className="highlight-card__icon highlight-card__icon--streak">{highlightIcons.streak}</div>
            <h3>Momentum insights</h3>
            <p>Stay aware of how recently you leveraged Career-Agent outputs.</p>
            <span className="highlight-card__metric">
              {loadingUsage
                ? 'Loading…'
                : latestActivity
                ? `Latest activity: ${new Date(latestActivity).toLocaleString()}`
                : 'Awaiting your next run'}
            </span>
          </article>
        </section>

        <section className="account__details">
          <div className="account__panel">
            <h2>Context quick links</h2>
            {loadingContexts && <p className="muted">Loading contexts…</p>}
            {contextsError && <p className="error">{contextsError}</p>}
            {!loadingContexts && !contextsError && contexts.length === 0 && (
              <p className="muted">No contexts yet. Upload one from the dashboard to get started.</p>
            )}
            {!loadingContexts && !contextsError && contexts.length > 0 && (
              <ul className="account__context-list">
                {contexts.map((ctx) => (
                  <li key={ctx.id}>
                    <div>
                      <strong>{ctx.file_name || 'Manual entry'}</strong>
                      <span>
                        {new Date(ctx.uploaded_at).toLocaleDateString()} · {ctx.character_count.toLocaleString()} chars
                      </span>
                    </div>
                    <a href={ctx.download_url} className="link" target="_blank" rel="noreferrer">
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="account__panel">
            <h2>Subscription & billing</h2>
            <p className="muted">
              Manage your subscription, upgrade your plan, and view billing details.
            </p>
            <Link href="/subscription" className="ghost ghost--bright">
              Go to subscription page →
            </Link>
          </div>
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

