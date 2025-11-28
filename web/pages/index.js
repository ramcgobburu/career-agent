import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

const LOGIN_VIEW = {
  SIGN_IN: 'sign-in',
  SIGN_UP: 'sign-up',
};

export default function Home() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const router = useRouter();

  const [view, setView] = useState(LOGIN_VIEW.SIGN_IN);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

  useEffect(() => {
    if (session) {
      router.replace('/dashboard');
    }
  }, [session, router]);

  const toggleView = (nextView) => {
    if (nextView === view) return;
    setView(nextView);
    setErrorMessage('');
    setPassword('');
    setShowForgotPassword(false);
    setForgotPasswordMessage('');
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setForgotPasswordMessage('Please enter your email address.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setForgotPasswordMessage('Enter a valid email address.');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setForgotPasswordMessage('Check your email for a password reset link.');
    } catch (error) {
      setForgotPasswordMessage(error.message || 'Something went wrong. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const validateForm = () => {
    if (!email.trim()) {
      setErrorMessage('Email is required.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage('Enter a valid email address.');
      return false;
    }
    if (!password.trim()) {
      setErrorMessage('Password is required.');
      return false;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return false;
    }
    if (view === LOGIN_VIEW.SIGN_UP) {
      if (!firstName.trim() && !lastName.trim() && !fullName.trim()) {
        setErrorMessage('Enter your name so we can personalize your experience.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      if (view === LOGIN_VIEW.SIGN_IN) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          throw error;
        }
      } else {
        // Use firstName/lastName if provided, otherwise use fullName
        const displayName = firstName.trim() && lastName.trim()
          ? `${firstName.trim()} ${lastName.trim()}`
          : fullName.trim();
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: displayName,
              first_name: firstName.trim() || '',
              last_name: lastName.trim() || '',
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) {
          throw error;
        }
        setErrorMessage('Check your email to confirm your account, then sign in.');
        setView(LOGIN_VIEW.SIGN_IN);
        setPassword('');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setLoading(false);
    if (error) {
      setErrorMessage(error.message);
    }
  };

  const heroFeatures = useMemo(
    () => [
      { label: 'Personalized AI assistance', value: 'Context-aware' },
      { label: 'Multiple document types', value: 'Cover letters, STAR stories & more' },
      { label: 'Job URL auto-fill', value: 'Smart parsing' },
    ],
    []
  );

  return (
    <>
      <Head>
        <title>CareerPilot Consulting | AI Career Co-Pilot</title>
        <meta
          name="description"
          content="CareerPilot Consulting helps you craft standout career materials with AI assistance tailored to your journey."
        />
      </Head>
      <main className="landing">
        <section className="landing__spotlight">
          <div className="spotlight__badge">CareerPilot Consulting</div>
          <h1>Your AI Co-Pilot for Winning Career Moments</h1>
          <p className="spotlight__lead">
            Transform your experience into polished cover letters, STAR stories, and interview answers.
            Career-Agent combines personalized context with powerful AI to help you land the role you want.
          </p>
          <ul className="spotlight__stats">
            {heroFeatures.map(({ label, value }) => (
              <li key={label}>
                <span>{value}</span>
                <p>{label}</p>
              </li>
            ))}
          </ul>
          <div className="spotlight__footnote">
            Trusted by product managers, engineers, and consultants to showcase their next chapter.
          </div>
        </section>

        <section className="landing__auth">
          <div className="auth-card">
            <div className="auth-card__header">
              <h2>{view === LOGIN_VIEW.SIGN_IN ? 'Welcome back' : 'Create your account'}</h2>
              <p>
                {view === LOGIN_VIEW.SIGN_IN
                  ? 'Sign in to keep generating tailored career collateral.'
                  : 'Join Career-Agent to unlock personalized career intelligence.'}
              </p>
            </div>

            <div className="auth-card__tabs">
              <button
                type="button"
                className={view === LOGIN_VIEW.SIGN_IN ? 'active' : ''}
                onClick={() => toggleView(LOGIN_VIEW.SIGN_IN)}
              >
                Sign in
              </button>
              <button
                type="button"
                className={view === LOGIN_VIEW.SIGN_UP ? 'active' : ''}
                onClick={() => toggleView(LOGIN_VIEW.SIGN_UP)}
              >
                Create account
              </button>
            </div>

            <form className="auth-card__form" onSubmit={handleSubmit}>
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@careerpilot.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete={view === LOGIN_VIEW.SIGN_IN ? 'current-password' : 'new-password'}
                placeholder="Enter at least 6 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              {view === LOGIN_VIEW.SIGN_IN && !showForgotPassword && (
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0ea5e9',
                    cursor: 'pointer',
                    padding: 0,
                    marginTop: '-0.5rem',
                    fontSize: '0.9rem',
                    textAlign: 'right',
                    textDecoration: 'underline',
                  }}
                >
                  Forgot password?
                </button>
              )}

              {view === LOGIN_VIEW.SIGN_IN && showForgotPassword && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ marginBottom: '0.75rem', fontSize: '0.95rem', color: '#64748b' }}>
                    Enter your email and we'll send you a password reset link.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordMessage('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: 0,
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                    }}
                  >
                    ← Back to sign in
                  </button>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="cta"
                    disabled={forgotPasswordLoading}
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    {forgotPasswordLoading ? 'Sending...' : 'Send reset link'}
                  </button>
                  {forgotPasswordMessage && (
                    <p className={forgotPasswordMessage.includes('Check your email') ? 'success' : 'error'} style={{ marginTop: '0.75rem' }}>
                      {forgotPasswordMessage}
                    </p>
                  )}
                </div>
              )}

              {view === LOGIN_VIEW.SIGN_UP && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label htmlFor="firstName">First name</label>
                      <input
                        id="firstName"
                        type="text"
                        autoComplete="given-name"
                        placeholder="Taylor"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName">Last name</label>
                      <input
                        id="lastName"
                        type="text"
                        autoComplete="family-name"
                        placeholder="Morgan"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="fullName">Full name (optional)</label>
                    <input
                      id="fullName"
                      type="text"
                      autoComplete="name"
                      placeholder="Taylor Morgan (or leave blank if using first/last)"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                    />
                  </div>
                </>
              )}

              {errorMessage && <p className="error auth-card__error">{errorMessage}</p>}

              <button type="submit" className="cta auth-card__submit" disabled={loading}>
                {loading ? 'Please wait…' : view === LOGIN_VIEW.SIGN_IN ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <div className="auth-card__divider">
              <span />
              <p>Or continue with</p>
              <span />
            </div>

            <button type="button" className="google-btn" onClick={handleGoogleSignIn} disabled={loading}>
              <span className="google-btn__icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M19.6 10.2273C19.6 9.5091 19.5382 8.81817 19.4245 8.15454H10V12.0773H15.4509C15.2155 13.3455 14.5064 14.3909 13.3527 15.1273V17.7545H16.5527C18.5091 15.9727 19.6 13.3455 19.6 10.2273Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M10 20C12.7 20 14.9636 19.1091 16.5527 17.7546L13.3527 15.1273C12.4546 15.7273 11.3273 16.1 10 16.1C7.39545 16.1 5.19091 14.3091 4.40909 11.9364H1.09091V14.6364C2.67273 17.9818 6.09091 20 10 20Z"
                    fill="#34A853"
                  />
                  <path
                    d="M4.40909 11.9363C4.2 11.3363 4.08182 10.6909 4.08182 9.99998C4.08182 9.30907 4.2 8.66362 4.40909 8.06362V5.36362H1.09091C0.4 6.69089 0 8.3045 0 9.99998C0 11.6954 0.4 13.309 1.09091 14.6363L4.40909 11.9363Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M10 3.9C11.45 3.9 12.7364 4.4 13.7455 5.36364L16.6255 2.45455C14.9636 0.809091 12.7 0 10 0C6.09091 0 2.67273 2.01818 1.09091 5.36364L4.40909 8.06364C5.19091 5.69091 7.39545 3.9 10 3.9Z"
                    fill="#EA4335"
                  />
                </svg>
              </span>
              <span>Sign in with Google</span>
            </button>

            <p className="auth-card__disclaimer">
              By continuing, you agree to our&nbsp;
              <a href="/privacy_policy.html" target="_blank" rel="noreferrer">
                privacy policy
              </a>
              .
            </p>
          </div>
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

  if (session) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {
      initialSession: null,
    },
  };
};

