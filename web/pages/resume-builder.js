import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import AppShell from '../components/AppShell';

export default function ResumeBuilder({ user }) {
  const supabase = useSupabaseClient();
  const session = useSession();
  const router = useRouter();
  const accessToken = session?.access_token;

  const [resumeText, setResumeText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
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

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      setError('Please paste your resume content first');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      // Use the query endpoint to analyze the resume
      const response = await fetch(`${apiBaseUrl}/api/v1/query`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          question: `Analyze this resume and provide feedback on:\n1. ATS (Applicant Tracking System) compatibility\n2. Keyword optimization\n3. Formatting and structure\n4. Areas for improvement\n5. Overall score out of 100\n\nResume:\n${resumeText}`,
          format: 'text',
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Failed to analyze resume');
      }

      const data = await response.json();
      setAnalysis(data.content);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <AppShell>
      <Head>
        <title>Resume Builder | CareerPilot</title>
      </Head>
      <main className="resume-builder">
        <section className="resume-builder__hero">
          <span className="resume-builder__pill">Resume Analysis</span>
          <h1>AI Resume Builder & Analyzer</h1>
          <p>Get instant feedback on your resume's ATS compatibility, keyword optimization, and overall quality.</p>
        </section>

        <section className="resume-builder__content">
          <div className="resume-builder__panel">
            <h2>Paste Your Resume</h2>
            <p className="muted">Paste your resume content below to get AI-powered analysis and improvement suggestions.</p>

            <div className="input-group" style={{ marginTop: '1.5rem' }}>
              <label htmlFor="resume">Resume Content</label>
              <textarea
                id="resume"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume here... (or upload a file)"
                rows={15}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '16px',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  background: '#ffffff',
                  color: '#1e293b',
                  fontFamily: 'inherit',
                  fontSize: '1rem',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              type="button"
              className="cta"
              onClick={handleAnalyze}
              disabled={analyzing || !resumeText.trim()}
              style={{ marginTop: '1rem' }}
            >
              {analyzing ? 'Analyzing...' : 'Analyze Resume'}
            </button>

            {error && <p className="error" style={{ marginTop: '1rem' }}>{error}</p>}
          </div>

          {analysis && (
            <div className="resume-builder__panel">
              <h2>Analysis Results</h2>
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
                {analysis}
              </div>
            </div>
          )}

          <div className="resume-builder__panel">
            <h2>Tips for Better Resumes</h2>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
              <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
                <strong>Use keywords</strong> from the job description to improve ATS compatibility
              </li>
              <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
                <strong>Quantify achievements</strong> with numbers and metrics
              </li>
              <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
                <strong>Keep formatting simple</strong> - avoid complex layouts that ATS can't parse
              </li>
              <li style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
                <strong>Use action verbs</strong> to start bullet points (e.g., "Led", "Developed", "Improved")
              </li>
              <li style={{ padding: '0.75rem 0' }}>
                <strong>Tailor your resume</strong> for each job application
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

