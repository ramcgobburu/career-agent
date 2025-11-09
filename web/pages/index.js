import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default function Home() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const router = useRouter();
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session) {
      router.replace('/dashboard');
    }
  }, [session, router]);

  const handleGoogleSignIn = async () => {
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (signInError) {
      setError(signInError.message);
    }
  };

  return (
    <>
      <Head>
        <title>CareerPilot Consulting | AI Career Co-Pilot</title>
        <meta
          name="description"
          content="CareerPilot Consulting helps you craft standout career materials with AI assistance tailored to your journey."
        />
      </Head>
      <main className="hero">
        <div className="hero-content">
          <h1>Accelerate Your Career with AI</h1>
          <p>
            Generate polished cover letters, blurbs, and interview answers using your personal
            career context. Powered by AI, guided by your experience.
          </p>
          <div className="actions">
            <button onClick={handleGoogleSignIn} className="cta">
              Sign in with Google
            </button>
            <span className="note">No credit card required</span>
          </div>
          {error && <p className="error">Error: {error}</p>}
        </div>
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

