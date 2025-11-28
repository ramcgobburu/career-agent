import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
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

  return (
    <AppShell>
      <Head>
        <title>LinkedIn Optimizer | CareerPilot</title>
      </Head>
      <main className="linkedin-optimizer">
        <section className="linkedin-optimizer__hero">
          <span className="linkedin-optimizer__pill">LinkedIn Profile</span>
          <h1>Optimize Your LinkedIn Profile</h1>
          <p>Enhance your LinkedIn profile to attract more recruiters and increase your visibility.</p>
        </section>

        <section className="linkedin-optimizer__content">
          <div className="linkedin-optimizer__panel">
            <h2>Your Current Profile</h2>
            <p className="muted">Enter your current LinkedIn profile information to get optimization suggestions.</p>

            <form className="linkedin-optimizer__form" style={{ marginTop: '1.5rem' }}>
              <div className="input-group">
                <label htmlFor="headline">Headline</label>
                <input
                  id="headline"
                  type="text"
                  value={linkedinProfile.headline}
                  onChange={(e) => setLinkedinProfile({ ...linkedinProfile, headline: e.target.value })}
                  placeholder="e.g., Senior Product Manager | AI & ML Expert"
                  maxLength={120}
                />
                <small className="muted" style={{ marginTop: '0.25rem', display: 'block' }}>
                  {linkedinProfile.headline.length}/120 characters
                </small>
              </div>

              <div className="input-group">
                <label htmlFor="summary">Summary / About Section</label>
                <textarea
                  id="summary"
                  value={linkedinProfile.summary}
                  onChange={(e) => setLinkedinProfile({ ...linkedinProfile, summary: e.target.value })}
                  placeholder="Paste your LinkedIn summary here..."
                  rows={8}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label htmlFor="currentRole">Current Role</label>
                  <input
                    id="currentRole"
                    type="text"
                    value={linkedinProfile.currentRole}
                    onChange={(e) => setLinkedinProfile({ ...linkedinProfile, currentRole: e.target.value })}
                    placeholder="Product Manager at Tech Corp"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="targetRole">Target Role</label>
                  <input
                    id="targetRole"
                    type="text"
                    value={linkedinProfile.targetRole}
                    onChange={(e) => setLinkedinProfile({ ...linkedinProfile, targetRole: e.target.value })}
                    placeholder="Senior Product Manager"
                  />
                </div>
              </div>

              {error && <p className="error">{error}</p>}

              <button
                type="button"
                className="cta"
                onClick={handleOptimize}
                disabled={optimizing || (!linkedinProfile.headline && !linkedinProfile.summary)}
                style={{ marginTop: '1rem' }}
              >
                {optimizing ? 'Optimizing...' : 'Get Optimization Suggestions'}
              </button>
            </form>
          </div>

          {optimization && (
            <div className="linkedin-optimizer__panel">
              <h2>Optimization Suggestions</h2>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginTop: '1rem',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.7',
                  color: '#1e293b',
                }}
              >
                {optimization}
              </div>
            </div>
          )}

          <div className="linkedin-optimizer__panel">
            <h2>LinkedIn Optimization Tips</h2>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
              <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
                <strong>Use keywords</strong> relevant to your industry and target roles
              </li>
              <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
                <strong>Write a compelling headline</strong> that includes your value proposition
              </li>
              <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
                <strong>Tell your story</strong> in the summary section with specific achievements
              </li>
              <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
                <strong>Add a professional photo</strong> to increase profile views
              </li>
              <li style={{ padding: '0.75rem 0' }}>
                <strong>Engage regularly</strong> by posting and commenting to increase visibility
              </li>
            </ul>
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

