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

  const [isSigningOut, setIsSigningOut] = useState(false);

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
    if (!apiBaseUrl || !accessToken || isSigningOut) {
      return;
    }
    setLoadingProfile(true);
    setProfileError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/me`, {
        headers: authHeaders,
      });

      if (!response.ok) {
        // If 401, user is not authenticated - don't show error, just return
        if (response.status === 401) {
          setLoadingProfile(false);
          return;
        }
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Failed to load profile');
      }

      const data = await response.json();
      // Only set profile if not signing out
      if (!isSigningOut) {
        setProfile(data);
      }
    } catch (err) {
      // Only set error if it's not a 401 (unauthorized) and not signing out
      if (!isSigningOut && !err.message.includes('401') && !err.message.includes('Unauthorized')) {
        setProfileError(err.message);
      }
    } finally {
      if (!isSigningOut) {
        setLoadingProfile(false);
      }
    }
  }, [apiBaseUrl, accessToken, authHeaders, isSigningOut]);


  useEffect(() => {
    // Don't fetch if user is not authenticated or if signing out
    if (!session || !accessToken || !apiBaseUrl || isSigningOut) {
      return;
    }

    fetchProfile();
  }, [session, accessToken, apiBaseUrl, isSigningOut, fetchProfile]);

  const handleSignOut = async () => {
    try {
      // Set signing out flag immediately to prevent any new API calls
      setIsSigningOut(true);
      
      // Clear all state before signing out to prevent API calls
      setProfile(null);
      setProfileError(null);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
      }
      
      // Redirect to home page
      router.push('/');
    } catch (err) {
      console.error('Error during sign out:', err);
      // Still try to redirect even if there's an error
      router.push('/');
    }
  };


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
            <p>CareerPilot is your AI-powered career assistant that helps you create personalized cover letters, STAR stories, interview answers, and networking materials. Upload your career context once, and let AI generate professional content tailored to your experience.</p>
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
              </>
            ) : (
              <p className="muted">We’ll personalize this once your profile loads.</p>
            )}
          </div>
        </header>

        <section className="dashboard__panels">
          <article className="panel-card panel-card--info">
            <div className="panel-card__header">
              <div>
                <h2>About CareerPilot</h2>
                <p>Your intelligent career assistant powered by AI</p>
              </div>
            </div>
            <div className="panel-card__content">
              <div className="info-section">
                <h3>How it works</h3>
                <ol className="info-list">
                  <li>
                    <strong>Upload your career context</strong>
                    <p>Start by uploading your resume, career history, achievements, and any relevant documents. The more context you provide, the better the AI can personalize your materials.</p>
                  </li>
                  <li>
                    <strong>Generate personalized content</strong>
                    <p>Use the Generator to create cover letters, STAR stories, interview answers, and networking blurbs. Simply provide a job description or prompt, and AI will craft content tailored to your experience.</p>
                  </li>
                  <li>
                    <strong>Optimize and refine</strong>
                    <p>Use the Resume Builder to analyze your resume, the LinkedIn Optimizer to enhance your profile, and iterate on generated content until it's perfect.</p>
                  </li>
                </ol>
              </div>
              <div className="info-section">
                <h3>Key features</h3>
                <ul className="info-list">
                  <li>
                    <strong>Context-aware generation</strong>
                    <p>All content is generated based on your actual career history and achievements.</p>
                  </li>
                  <li>
                    <strong>Smart job parsing</strong>
                    <p>Paste a job URL and let AI automatically extract company name, role title, and job description.</p>
                  </li>
                  <li>
                    <strong>Multiple document types</strong>
                    <p>Generate cover letters, STAR stories, application answers, networking blurbs, and more.</p>
                  </li>
                  <li>
                    <strong>Professional tone</strong>
                    <p>All generated content maintains a professional, polished tone suitable for career applications.</p>
                  </li>
                </ul>
              </div>
              <div className="panel-card__actions" style={{ marginTop: '2rem' }}>
                <Link href="/context-manager" className="cta">
                  Get started: Upload your career context
                </Link>
              </div>
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
                Open generator
              </Link>
              <p className="muted">We'll pull your latest context automatically during each session.</p>
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

          <article className="panel-card panel-card--video">
            <div className="panel-card__header">
              <div>
                <h2>
                  <span style={{ marginRight: '0.5rem', fontSize: '1.5rem' }}>🎥</span>
                  How to make better use of this tool
                </h2>
                <p>Watch our demo video to learn best practices and unlock the full potential of CareerPilot.</p>
              </div>
            </div>
            <div className="panel-card__actions">
              <a 
                href="https://www.youtube.com/watch?v=YOUR_VIDEO_ID" 
                target="_blank" 
                rel="noopener noreferrer"
                className="cta"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  textDecoration: 'none',
                  width: 'fit-content'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Watch Demo Video
              </a>
              <p className="muted">Learn how to upload context, generate materials, and optimize your LinkedIn profile.</p>
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

