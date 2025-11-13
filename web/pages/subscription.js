import Head from 'next/head';
import AppShell from '../components/AppShell';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

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
    cta: 'Upgrade (coming soon)',
    disabled: true,
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
    cta: 'Upgrade (coming soon)',
    disabled: true,
  },
];

export default function Subscription() {
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
          </div>
        </section>

        <section className="subscription__plans">
          {plans.map((plan) => (
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
              <button type="button" className={`plan-card__cta ${plan.disabled ? 'disabled' : ''}`} disabled={plan.disabled}>
                {plan.cta}
              </button>
            </article>
          ))}
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

