import Head from 'next/head';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import AppShell from '../components/AppShell';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

// Stripe Price IDs - Replace these with your actual Stripe Price IDs
// Get these from Stripe Dashboard > Products > Your Product > Pricing
const STRIPE_PRICE_IDS = {
  weekly: process.env.NEXT_PUBLIC_STRIPE_WEEKLY_PRICE_ID || 'price_1SU9guD3YrV0maBoMLJYRZmm',
  monthly: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || 'price_1SU9hUD3YrV0maBoYT3fpGdQ',
};

const plans = [
  {
    id: 'free',
    name: 'Free trial',
    price: '$0',
    cadence: 'for your first 3 requests',
    description: 'Perfect for exploring the generator and uploading your first context.',
    features: [
      '3 complimentary generations',
      'Single active context upload',
      'Access to cover letter, blurb, and answer templates',
      'Upgrade anytime to keep momentum',
    ],
    cta: 'Included',
    disabled: true,
    priceId: null,
  },
  {
    id: 'weekly',
    name: 'Weekly',
    price: '$9.99',
    cadence: 'per week',
    description: 'Best for active job seekers iterating weekly on collateral.',
    features: [
      'Unlimited generations across templates',
      'Multiple saved contexts and quick switching',
      'Priority email support',
      'Early access to upcoming prompts and workflows',
    ],
    cta: 'Upgrade now',
    disabled: false,
    priceId: STRIPE_PRICE_IDS.weekly,
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$27.99',
    cadence: 'per month',
    description: 'Lock in a full month of guided AI support for your career journey.',
    features: [
      'Everything in Weekly',
      'Better value with monthly billing',
      'Invite-only strategy sessions with our team',
      'Premium prompt bundle drops',
    ],
    cta: 'Upgrade now',
    disabled: false,
    priceId: STRIPE_PRICE_IDS.monthly,
  },
];

export default function Subscription({ user }) {
  const supabase = useSupabaseClient();
  const session = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

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
      'Content-Type': 'application/json',
    };
  }, [accessToken]);

  const fetchSubscriptionStatus = async () => {
    if (!apiBaseUrl || !accessToken) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/subscription-status`, {
        headers: authHeaders,
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
      }
    } catch (err) {
      console.error('Error fetching subscription status:', err);
    }
  };

  useEffect(() => {
    // Check for success/cancel query params
    const { success, canceled } = router.query;
    if (success === 'true') {
      setError(null);
      // Refresh subscription status
      if (accessToken && apiBaseUrl) {
        fetchSubscriptionStatus();
      }
    } else if (canceled === 'true') {
      setError('Payment was canceled. You can try again anytime.');
    }
  }, [router.query, accessToken, apiBaseUrl]);

  useEffect(() => {
    if (accessToken && apiBaseUrl) {
      fetchSubscriptionStatus();
    }
  }, [accessToken, apiBaseUrl]);

  const handleSubscribe = async (plan) => {
    if (!plan.priceId || plan.disabled) return;
    if (!accessToken || !apiBaseUrl) {
      setError('You need to be signed in to subscribe.');
      return;
    }

    setLoading({ [plan.id]: true });
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/create-checkout-session`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          price_id: plan.priceId,
          success_url: `${window.location.origin}/subscription?success=true`,
          cancel_url: `${window.location.origin}/subscription?canceled=true`,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || 'Error creating checkout session. Please try again.');
      setLoading({ [plan.id]: false });
    }
  };

  const isCurrentPlan = (planId) => {
    if (!subscriptionStatus) return false;
    if (planId === 'free' && subscriptionStatus.subscription_tier === 'free') return true;
    if (planId === 'weekly' && subscriptionStatus.subscription_tier === 'premium') return true;
    if (planId === 'monthly' && subscriptionStatus.subscription_tier === 'premium') return true;
    return false;
  };

  return (
    <AppShell>
      <Head>
        <title>Subscription | CareerPilot</title>
      </Head>
      <main className="subscription">
        <section className="subscription__hero">
          <div>
            <span className="subscription__pill">Upgrade your momentum</span>
            <h1>
              Plans that scale with <span>your career story</span>
            </h1>
            <p>
              Start with the complimentary trial, then unlock unlimited, context-aware generations designed for cover
              letters, interview answers, and more.
            </p>
            {error && (
              <p className="error" style={{ marginTop: '1rem', color: '#fca5a5' }}>
                {error}
              </p>
            )}
            {subscriptionStatus && subscriptionStatus.subscription_tier === 'premium' && (
              <p className="success" style={{ marginTop: '1rem', color: '#22c55e' }}>
                You're currently on the premium plan. Thank you for your subscription!
              </p>
            )}
          </div>
        </section>

        <section className="subscription__plans">
          {plans.map((plan) => {
            const isCurrent = isCurrentPlan(plan.id);
            const isLoading = loading[plan.id];

            return (
              <article key={plan.id} className="plan-card">
                <div className="plan-card__header">
                  <h2>{plan.name}</h2>
                  <div className="plan-card__price">
                    <span>{plan.price}</span>
                    <small>{plan.cadence}</small>
                  </div>
                  <p className="muted">{plan.description}</p>
                </div>
                <ul className="plan-card__features">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={`plan-card__cta ${plan.disabled || isCurrent ? 'disabled' : ''}`}
                  disabled={plan.disabled || isCurrent || isLoading}
                  onClick={() => handleSubscribe(plan)}
                >
                  {isLoading
                    ? 'Loading...'
                    : isCurrent
                    ? 'Current plan'
                    : plan.cta}
                </button>
              </article>
            );
          })}
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

