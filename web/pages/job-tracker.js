import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import AppShell from '../components/AppShell';

export default function JobTracker({ user }) {
  const supabase = useSupabaseClient();
  const session = useSession();
  const router = useRouter();
  const accessToken = session?.access_token;

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    location: '',
    jobUrl: '',
    status: 'applied',
    notes: '',
    appliedDate: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session) {
      router.replace('/');
    }
  }, [session, router]);

  // Load jobs from localStorage (in a real app, this would be from an API)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedJobs = localStorage.getItem('jobTracker');
      if (savedJobs) {
        try {
          setJobs(JSON.parse(savedJobs));
        } catch (e) {
          console.error('Error loading jobs:', e);
        }
      }
      setLoading(false);
    }
  }, []);

  const saveJobs = useCallback((newJobs) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jobTracker', JSON.stringify(newJobs));
      setJobs(newJobs);
    }
  }, []);

  const handleAddJob = (e) => {
    e.preventDefault();
    if (!formData.company || !formData.position) {
      setError('Company and position are required');
      return;
    }

    setSaving(true);
    const newJob = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
    };

    const updatedJobs = [...jobs, newJob];
    saveJobs(updatedJobs);
    setFormData({
      company: '',
      position: '',
      location: '',
      jobUrl: '',
      status: 'applied',
      notes: '',
      appliedDate: new Date().toISOString().split('T')[0],
    });
    setShowAddForm(false);
    setSaving(false);
    setError(null);
  };

  const handleUpdateStatus = (jobId, newStatus) => {
    const updatedJobs = jobs.map((job) =>
      job.id === jobId ? { ...job, status: newStatus } : job
    );
    saveJobs(updatedJobs);
  };

  const handleDeleteJob = (jobId) => {
    if (confirm('Are you sure you want to delete this job application?')) {
      const updatedJobs = jobs.filter((job) => job.id !== jobId);
      saveJobs(updatedJobs);
    }
  };

  const statusColors = {
    applied: { bg: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', label: 'Applied' },
    interviewing: { bg: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', label: 'Interviewing' },
    offer: { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', label: 'Offer' },
    rejected: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', label: 'Rejected' },
    withdrawn: { bg: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', label: 'Withdrawn' },
  };

  return (
    <AppShell>
      <Head>
        <title>Job Tracker | CareerPilot</title>
      </Head>
      <main className="job-tracker">
        <section className="job-tracker__hero">
          <span className="job-tracker__pill">Job Applications</span>
          <h1>Track your job applications</h1>
          <p>Stay organized and monitor your job search progress in one place.</p>
        </section>

        <section className="job-tracker__content">
          <div className="job-tracker__header">
            <h2>Your Applications</h2>
            <button
              type="button"
              className="cta"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Cancel' : '+ Add Application'}
            </button>
          </div>

          {showAddForm && (
            <form className="job-tracker__form" onSubmit={handleAddJob}>
              <div className="input-group">
                <label htmlFor="company">Company *</label>
                <input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Google"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="position">Position *</label>
                <input
                  id="position"
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Senior Product Manager"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label htmlFor="location">Location</label>
                  <input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="San Francisco, CA"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="appliedDate">Applied Date</label>
                  <input
                    id="appliedDate"
                    type="date"
                    value={formData.appliedDate}
                    onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="jobUrl">Job Posting URL</label>
                <input
                  id="jobUrl"
                  type="url"
                  value={formData.jobUrl}
                  onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="input-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any notes about this application..."
                  rows={3}
                />
              </div>

              {error && <p className="error">{error}</p>}

              <button type="submit" className="cta" disabled={saving}>
                {saving ? 'Adding...' : 'Add Application'}
              </button>
            </form>
          )}

          {loading ? (
            <p className="muted">Loading applications...</p>
          ) : jobs.length === 0 ? (
            <div className="job-tracker__empty">
              <p className="muted">No job applications yet. Add your first application to get started!</p>
            </div>
          ) : (
            <div className="job-tracker__list">
              {jobs.map((job) => {
                const statusInfo = statusColors[job.status] || statusColors.applied;
                return (
                  <div key={job.id} className="job-tracker__card">
                    <div className="job-tracker__card-header">
                      <div>
                        <h3>{job.position}</h3>
                        <p className="job-tracker__company">{job.company}</p>
                        {job.location && <p className="job-tracker__location">📍 {job.location}</p>}
                      </div>
                      <div className="job-tracker__card-actions">
                        <select
                          value={job.status}
                          onChange={(e) => handleUpdateStatus(job.id, e.target.value)}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: `1px solid ${statusInfo.color}`,
                            background: statusInfo.bg,
                            color: statusInfo.color,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {Object.entries(statusColors).map(([key, value]) => (
                            <option key={key} value={key}>
                              {value.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleDeleteJob(job.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            fontSize: '1.2rem',
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="job-tracker__card-body">
                      {job.appliedDate && (
                        <p className="job-tracker__date">
                          Applied: {new Date(job.appliedDate).toLocaleDateString()}
                        </p>
                      )}
                      {job.jobUrl && (
                        <a
                          href={job.jobUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="link"
                          style={{ display: 'inline-block', marginTop: '0.5rem' }}
                        >
                          View Job Posting →
                        </a>
                      )}
                      {job.notes && (
                        <p className="job-tracker__notes" style={{ marginTop: '0.75rem', color: '#64748b' }}>
                          {job.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

