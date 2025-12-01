import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { ArrowRight, FileText, FolderOpen, Briefcase, Sparkles, TrendingUp, Clock, CheckCircle2, Linkedin, LogOut, User } from 'lucide-react';
import AppShell from '../components/AppShell';

export default function Dashboard({ user }) {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const session = useSession();
  const accessToken = session?.access_token;

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

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
    };
  }, [accessToken]);

  const fetchProfile = useCallback(async () => {
    if (!apiBaseUrl || !accessToken || isSigningOut) {
      return;
    }
    setLoadingProfile(true);
    setProfileError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/me`, {
        headers: authHeaders,
      });

      if (!response.ok) {
        if (response.status === 401) {
          setLoadingProfile(false);
          return;
        }
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail || 'Failed to load profile');
      }

      const data = await response.json();
      if (!isSigningOut) {
        setProfile(data);
      }
    } catch (err) {
      if (!isSigningOut && !err.message.includes('401') && !err.message.includes('Unauthorized')) {
        setProfileError(err.message);
      }
    } finally {
      if (!isSigningOut) {
        setLoadingProfile(false);
      }
    }
  }, [apiBaseUrl, accessToken, authHeaders, isSigningOut]);

  useEffect(() => {
    if (!session || !accessToken || !apiBaseUrl || isSigningOut) {
      return;
    }
    fetchProfile();
  }, [session, accessToken, apiBaseUrl, isSigningOut, fetchProfile]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      setProfile(null);
      setProfileError(null);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      router.push('/');
    } catch (err) {
      console.error('Error during sign out:', err);
      router.push('/');
    }
  };

  const usageProgress = useMemo(() => {
    if (!profile || !profile.requests_limit) {
      return 0;
    }
    return Math.min(100, Math.round((profile.requests_used / profile.requests_limit) * 100));
  }, [profile]);

  const remainingRequests =
    profile && typeof profile.requests_limit === 'number'
      ? Math.max(profile.requests_limit - profile.requests_used, 0)
      : null;

  return (
    <AppShell>
      <Head>
        <title>CareerPilot Dashboard</title>
      </Head>
      <div className="p-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl text-gray-900 mb-2">
              Welcome back, {profile?.name || user?.email?.split('@')[0] || 'User'}!
            </h1>
            <p className="text-gray-600">Here's what's happening with your career journey today.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/account"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
            >
              <User className="w-4 h-4" />
              <span className="text-sm">Account</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sign out</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl text-gray-900 mb-1">3</div>
            <div className="text-sm text-gray-600">Active Resumes</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <FolderOpen className="w-6 h-6 text-purple-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl text-gray-900 mb-1">12</div>
            <div className="text-sm text-gray-600">Saved Contents</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Briefcase className="w-6 h-6 text-orange-600" />
              </div>
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="text-2xl text-gray-900 mb-1">8</div>
            <div className="text-sm text-gray-600">Job Applications</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-teal-100 p-3 rounded-lg">
                <Sparkles className="w-6 h-6 text-teal-600" />
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
            </div>
            <div className="text-2xl text-gray-900 mb-1">{profile?.requests_used || 0}</div>
            <div className="text-sm text-gray-600">AI Generations</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
              <h2 className="text-xl text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Link
                  href="/resume-builder"
                  className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all group text-left"
                >
                  <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-teal-100 transition-colors">
                    <FileText className="w-6 h-6 text-blue-600 group-hover:text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 mb-1">Build Resume</h3>
                    <p className="text-sm text-gray-600">Create ATS-optimized resume</p>
                  </div>
                </Link>

                <Link
                  href="/generator"
                  className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all group text-left"
                >
                  <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-teal-100 transition-colors">
                    <Sparkles className="w-6 h-6 text-purple-600 group-hover:text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 mb-1">Generate Content</h3>
                    <p className="text-sm text-gray-600">Create cover letters & more</p>
                  </div>
                </Link>

                <Link
                  href="/job-tracker"
                  className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all group text-left"
                >
                  <div className="bg-orange-100 p-3 rounded-lg group-hover:bg-teal-100 transition-colors">
                    <Briefcase className="w-6 h-6 text-orange-600 group-hover:text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 mb-1">Track Jobs</h3>
                    <p className="text-sm text-gray-600">Manage applications</p>
                  </div>
                </Link>

                <Link
                  href="/linkedin-optimizer"
                  className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all group text-left"
                >
                  <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-teal-100 transition-colors">
                    <Linkedin className="w-6 h-6 text-indigo-600 group-hover:text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 mb-1">Optimize LinkedIn</h3>
                    <p className="text-sm text-gray-600">Enhance your profile</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl text-gray-900">Recent Activity</h2>
                <Link href="/context-manager" className="text-sm text-teal-600 hover:text-teal-700">
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {[
                  {
                    action: 'Generated cover letter',
                    item: 'Senior Product Manager at TechCorp',
                    time: '2 hours ago',
                    icon: Sparkles,
                    color: 'bg-purple-100 text-purple-600'
                  },
                  {
                    action: 'Updated resume',
                    item: 'Product_Manager_Resume_2025.pdf',
                    time: '5 hours ago',
                    icon: FileText,
                    color: 'bg-blue-100 text-blue-600'
                  },
                  {
                    action: 'Applied to job',
                    item: 'UX Designer at StartupXYZ',
                    time: '1 day ago',
                    icon: Briefcase,
                    color: 'bg-orange-100 text-orange-600'
                  },
                  {
                    action: 'Optimized LinkedIn',
                    item: 'Profile headline updated',
                    time: '2 days ago',
                    icon: CheckCircle2,
                    color: 'bg-green-100 text-green-600'
                  }
                ].map((activity, index) => {
                  const IconComponent = activity.icon;
                  return (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className={`${activity.color} p-2 rounded-lg`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-gray-900">{activity.action}</div>
                        <div className="text-sm text-gray-600">{activity.item}</div>
                      </div>
                      <div className="text-xs text-gray-500">{activity.time}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Plan */}
            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
              <div className="text-sm text-teal-100 mb-2">Current plan</div>
              <div className="text-2xl mb-4 font-semibold">
                {profile?.subscription_tier === 'premium' ? 'Premium' : 'Free Trial'}
              </div>
              {profile && !loadingProfile ? (
                <>
                  <div className="text-sm text-teal-100 mb-4">
                    {profile.requests_used} of {profile.requests_limit === 999999 ? '∞' : profile.requests_limit} requests used this cycle
                  </div>
                  <div className="bg-white/20 rounded-full h-2 mb-4">
                    <div 
                      className="bg-white rounded-full h-2 transition-all" 
                      style={{ width: `${usageProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-teal-100 mb-4">
                    {remainingRequests !== null && remainingRequests > 0
                      ? `You have ${remainingRequests} complementary ${remainingRequests === 1 ? 'request' : 'requests'} left before upgrading`
                      : 'Upgrade to unlock unlimited access'}
                  </p>
                </>
              ) : (
                <div className="text-sm text-teal-100 mb-4">Loading...</div>
              )}
              <Link
                href="/subscription"
                className="w-full bg-white text-teal-600 py-2 rounded-lg hover:bg-teal-50 transition-all flex items-center justify-center gap-2 font-medium"
              >
                Upgrade Plan
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Tips */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg text-gray-900 mb-4">Career Tips</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg h-fit">
                    <span className="text-lg">💡</span>
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-900 mb-1">Optimize for ATS</h4>
                    <p className="text-xs text-gray-600">Include relevant keywords from job descriptions in your resume.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg h-fit">
                    <span className="text-lg">📊</span>
                  </div>
                  <div>
                    <h4 className="text-sm text-gray-900 mb-1">LinkedIn Profile</h4>
                    <p className="text-xs text-gray-600">Profiles with photos get 21x more views than those without.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg text-gray-900 mb-4">Recommended Next Steps</h3>
              <div className="space-y-3">
                <Link href="/resume-builder" className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all block">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span className="text-sm text-gray-900">Complete your resume</span>
                  </div>
                  <p className="text-xs text-gray-600 ml-6">Add your work experience</p>
                </Link>
                <Link href="/linkedin-optimizer" className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all block">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                    <span className="text-sm text-gray-900">Optimize LinkedIn</span>
                  </div>
                  <p className="text-xs text-gray-600 ml-6">Get AI suggestions</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export const getServerSideProps = async (ctx) => {
  try {
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
  } catch (error) {
    console.error('Error in dashboard getServerSideProps:', error);
    // Redirect to home if there's an error
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
};
