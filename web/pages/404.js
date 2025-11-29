import Head from 'next/head';
import Link from 'next/link';
import AppShell from '../components/AppShell';

export default function Custom404() {
  return (
    <AppShell>
      <Head>
        <title>404 - Page Not Found | CareerPilot</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '600px',
          padding: '3rem 2rem',
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
        }}>
          <h1 style={{
            fontSize: '4rem',
            fontWeight: '600',
            color: '#10b981',
            margin: '0 0 1rem',
            lineHeight: '1'
          }}>404</h1>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '500',
            color: '#0f172a',
            margin: '0 0 1rem'
          }}>Page Not Found</h2>
          <p style={{
            color: '#64748b',
            fontSize: '1rem',
            lineHeight: '1.6',
            margin: '0 0 2rem'
          }}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Link href="/dashboard" style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'transform 200ms ease, box-shadow 200ms ease',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.3)';
            }}
            >
              Go to Dashboard
            </Link>
            <Link href="/" style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: '#ffffff',
              color: '#059669',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              transition: 'background 200ms ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
            }}
            >
              Go to Home
            </Link>
          </div>
        </div>
      </main>
    </AppShell>
  );
}

