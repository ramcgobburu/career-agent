import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import AppShell from '../components/AppShell';

export default function Settings({ user }) {
  const supabase = useSupabaseClient();
  const session = useSession();
  const router = useRouter();
  const accessToken = session?.access_token;

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [pausing, setPausing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      setName(data.name || '');
      setEmail(data.email || '');
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setLoadingProfile(false);
    }
  }, [apiBaseUrl, accessToken, authHeaders]);

  useEffect(() => {
    if (!session) {
      router.replace('/');
    }
  }, [session, router]);

  useEffect(() => {
    if (accessToken && apiBaseUrl) {
      fetchProfile();
    }
  }, [accessToken, apiBaseUrl, fetchProfile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/me`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ name, email }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Failed to update profile');
      }

      const data = await response.json();
      setProfile(data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePause = async () => {
    if (!confirm('Are you sure you want to pause your account? You will not be able to use the service until you reactivate.')) {
      return;
    }

    setPausing(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/me/pause`, {
        method: 'POST',
        headers: authHeaders,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Failed to pause account');
      }

      alert('Account paused successfully. You will be signed out.');
      await supabase.auth.signOut();
      router.push('/');
    } catch (err) {
      alert(`Error pausing account: ${err.message}`);
    } finally {
      setPausing(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/me`, {
        method: 'DELETE',
        headers: authHeaders,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Failed to delete account');
      }

      alert('Account deleted successfully. All your data has been removed.');
      await supabase.auth.signOut();
      router.push('/');
    } catch (err) {
      alert(`Error deleting account: ${err.message}`);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <AppShell>
      <Head>
        <title>Settings | CareerPilot</title>
      </Head>
      <main className="settings">
        <section className="settings__hero">
          <span className="settings__pill">Account Settings</span>
          <h1>Manage your account</h1>
          <p>Update your profile information, pause, or delete your account.</p>
        </section>

        <section className="settings__content">
          <div className="settings__panel">
            <h2>Account Details</h2>
            {loadingProfile && <p className="muted">Loading account details…</p>}
            {profileError && <p className="error">Error: {profileError}</p>}

            {!loadingProfile && !profileError && (
              <form className="settings__form" onSubmit={handleSave}>
                <div className="input-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                {saveError && <p className="error">{saveError}</p>}
                {saveSuccess && <p className="success">Profile updated successfully!</p>}

                <button type="submit" className="cta" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            )}
          </div>

          <div className="settings__panel">
            <h2>Account Status</h2>
            {profile && (
              <div className="settings__status">
                <div className="settings__status-item">
                  <span className="settings__status-label">Status:</span>
                  <span className={`badge ${profile.is_active ? 'badge--active' : ''}`}>
                    {profile.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>
                <div className="settings__status-item">
                  <span className="settings__status-label">Subscription:</span>
                  <span className="badge badge--plan">{profile.subscription_tier.toUpperCase()}</span>
                </div>
                <div className="settings__status-item">
                  <span className="settings__status-label">Member since:</span>
                  <span>{new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>

          <div className="settings__panel settings__panel--danger">
            <h2>Danger Zone</h2>
            <p className="muted">Irreversible and destructive actions</p>

            <div className="settings__actions">
              <div className="settings__action">
                <div>
                  <h3>Pause Account</h3>
                  <p className="muted">Temporarily disable your account. You can reactivate by contacting support.</p>
                </div>
                <button
                  type="button"
                  className="ghost ghost--muted"
                  onClick={handlePause}
                  disabled={pausing || !profile?.is_active}
                >
                  {pausing ? 'Pausing…' : 'Pause Account'}
                </button>
              </div>

              <div className="settings__action">
                <div>
                  <h3>Delete Account</h3>
                  <p className="muted">Permanently delete your account and all associated data. This action cannot be undone.</p>
                </div>
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    className="ghost"
                    style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    Delete Account
                  </button>
                ) : (
                  <div className="settings__delete-confirm">
                    <p className="error" style={{ marginBottom: '0.75rem' }}>
                      Are you absolutely sure? This will permanently delete your account and all data.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        type="button"
                        className="cta"
                        style={{ background: '#ef4444', borderColor: '#ef4444' }}
                        onClick={handleDelete}
                        disabled={deleting}
                      >
                        {deleting ? 'Deleting…' : 'Yes, Delete Forever'}
                      </button>
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleting(false);
                        }}
                        disabled={deleting}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
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

