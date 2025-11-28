import Head from 'next/head';
import Link from 'next/link';
import { useSession } from '@supabase/auth-helpers-react';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import AppShell from '../components/AppShell';

const FAQ_ITEMS = [
  {
    question: 'How do I upload my career context?',
    answer: 'Go to the Dashboard and use the "Upload Career Context" section. You can either paste your resume/career information as text or upload a file (markdown or text format).',
  },
  {
    question: 'What can I generate with CareerPilot?',
    answer: 'You can generate cover letters, LinkedIn blurbs, STAR stories, interview answers, and role-specific summaries. All content is personalized based on your career context.',
  },
  {
    question: 'How do I track my job applications?',
    answer: 'Use the Job Tracker page to add and monitor your job applications. You can update status, add notes, and keep everything organized in one place.',
  },
  {
    question: 'How does the Resume Analyzer work?',
    answer: 'Paste your resume content in the Resume Builder page and click "Analyze Resume". Our AI will provide feedback on ATS compatibility, keyword optimization, formatting, and improvement suggestions.',
  },
  {
    question: 'Can I optimize my LinkedIn profile?',
    answer: 'Yes! Use the LinkedIn Optimizer page to get AI-powered suggestions for improving your headline, summary, and overall profile visibility.',
  },
  {
    question: 'What subscription plans are available?',
    answer: 'We offer free and premium plans. Free users get 3 complimentary requests. Premium users get unlimited access to all features.',
  },
  {
    question: 'How do I update my account information?',
    answer: 'Go to Settings to update your name, email, and manage your account. You can also pause or delete your account from there.',
  },
  {
    question: 'Where can I see my usage history?',
    answer: 'Your usage history is displayed on the Dashboard, showing recent generations and usage statistics.',
  },
];

export default function Help({ user }) {
  const session = useSession();

  return (
    <AppShell>
      <Head>
        <title>Help Center | CareerPilot</title>
      </Head>
      <main className="help">
        <section className="help__hero">
          <span className="help__pill">Support</span>
          <h1>Help Center</h1>
          <p>Find answers to common questions and learn how to get the most out of CareerPilot.</p>
        </section>

        <section className="help__content">
          <div className="help__panel">
            <h2>Frequently Asked Questions</h2>
            <div className="help__faq">
              {FAQ_ITEMS.map((item, index) => (
                <details key={index} className="help__faq-item">
                  <summary className="help__faq-question">{item.question}</summary>
                  <p className="help__faq-answer">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="help__panel">
            <h2>Quick Links</h2>
            <div className="help__links">
              <Link href="/dashboard" className="help__link">
                <span>📊</span>
                <div>
                  <strong>Dashboard</strong>
                  <p className="muted">View your profile, contexts, and usage</p>
                </div>
              </Link>
              <Link href="/generator" className="help__link">
                <span>⚡️</span>
                <div>
                  <strong>Generator</strong>
                  <p className="muted">Generate cover letters, blurbs, and more</p>
                </div>
              </Link>
              <Link href="/job-tracker" className="help__link">
                <span>📋</span>
                <div>
                  <strong>Job Tracker</strong>
                  <p className="muted">Track your job applications</p>
                </div>
              </Link>
              <Link href="/settings" className="help__link">
                <span>⚙️</span>
                <div>
                  <strong>Settings</strong>
                  <p className="muted">Manage your account settings</p>
                </div>
              </Link>
            </div>
          </div>

          <div className="help__panel">
            <h2>Contact Support</h2>
            <p className="muted">
              Need more help? Contact us at{' '}
              <a href="mailto:support@careerpilotconsulting.com" style={{ color: '#0ea5e9' }}>
                support@careerpilotconsulting.com
              </a>
            </p>
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

