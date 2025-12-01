import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { ArrowRight, CheckCircle2, Sparkles, FileText, Briefcase, Target, TrendingUp, Linkedin, Menu, X } from 'lucide-react';

const LOGIN_VIEW = {
  SIGN_IN: 'sign-in',
  SIGN_UP: 'sign-up',
};

export default function Home() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const scrollToAuth = (viewType) => {
    setView(viewType);
    const authSection = document.getElementById('auth');
    if (authSection) {
      authSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubscribe = () => {
    if (!session) {
      alert('Please create an account first to subscribe. You will be redirected to the sign up page.');
      scrollToAuth(LOGIN_VIEW.SIGN_UP);
    } else {
      router.push('/subscription');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>CareerPilot | AI-Powered Career Assistant</title>
        <meta
          name="description"
          content="CareerPilot helps you craft standout career materials with AI assistance tailored to your journey."
        />
      </Head>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl text-gray-900 font-semibold">CareerPilot</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How it Works</a>
              <button onClick={() => scrollToAuth(LOGIN_VIEW.SIGN_IN)} className="text-gray-600 hover:text-gray-900 transition-colors">Login</button>
              <button 
                onClick={() => scrollToAuth(LOGIN_VIEW.SIGN_UP)} 
                className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all"
              >
                Get Started Free
              </button>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col gap-4">
                <a href="#features" className="text-gray-600" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#pricing" className="text-gray-600" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
                <button onClick={() => { scrollToAuth(LOGIN_VIEW.SIGN_IN); setMobileMenuOpen(false); }} className="text-gray-600 text-left">Login</button>
                <button 
                  onClick={() => { scrollToAuth(LOGIN_VIEW.SIGN_UP); setMobileMenuOpen(false); }} 
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-6 py-2 rounded-lg text-left"
                >
                  Get Started Free
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-2 rounded-full mb-6">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Career Assistant</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-gray-900 mb-4 sm:mb-6 leading-tight">
                Navigate Your Career with{' '}
                <span className="bg-gradient-to-r from-teal-500 to-emerald-600 bg-clip-text text-transparent">
                  AI Intelligence
                </span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                From resume building to LinkedIn optimization, CareerPilot uses AI to help you create compelling career content and land your dream job.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
                  <span className="text-gray-700">AI-powered resume builder with ATS scoring</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
                  <span className="text-gray-700">Generate tailored cover letters instantly</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
                  <span className="text-gray-700">Optimize LinkedIn profile for recruiters</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => scrollToAuth(LOGIN_VIEW.SIGN_UP)} 
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white px-8 py-4 rounded-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <a 
                  href="https://www.youtube.com/watch?v=YQaJvmKAPao" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all text-center"
                >
                  Watch Demo
                </a>
              </div>

              <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-8 sm:mt-12 pt-8 sm:pt-12 border-t border-gray-200">
                <div>
                  <div className="text-2xl sm:text-3xl text-gray-900 mb-1">50K+</div>
                  <div className="text-xs sm:text-sm text-gray-600">Users</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl text-gray-900 mb-1">100K+</div>
                  <div className="text-xs sm:text-sm text-gray-600">Resumes Created</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl text-gray-900 mb-1">4.9/5</div>
                  <div className="text-xs sm:text-sm text-gray-600">User Rating</div>
                </div>
              </div>
            </div>

            <div className="relative mt-8 lg:mt-0">
              <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl sm:rounded-2xl opacity-10 blur-xl sm:blur-2xl"></div>
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1758520144417-e1c432042dec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                  alt="Resume building"
                  className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] object-cover object-center"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-teal-100 text-teal-700 px-4 py-2 rounded-full mb-4">
              Features
            </div>
            <h2 className="text-4xl lg:text-5xl text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive AI-powered tools to manage your entire career journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: 'Resume Builder & Analyzer',
                description: 'Create ATS-optimized resumes with AI assistance and get instant scoring to improve your chances.',
                color: 'from-blue-500 to-blue-600'
              },
              {
                icon: Sparkles,
                title: 'Content Manager',
                description: 'Organize all your career content in one place. Track generation status and manage your vault.',
                color: 'from-purple-500 to-purple-600'
              },
              {
                icon: Briefcase,
                title: 'Job Tracker',
                description: 'Keep track of all your job applications, interviews, and follow-ups in one organized dashboard.',
                color: 'from-orange-500 to-orange-600'
              },
              {
                icon: Sparkles,
                title: 'AI Generator',
                description: 'Generate cover letters, interview answers, and career content with advanced AI technology.',
                color: 'from-teal-500 to-teal-600'
              },
              {
                icon: Linkedin,
                title: 'LinkedIn Optimizer',
                description: 'Optimize your LinkedIn profile to attract recruiters and increase your visibility.',
                color: 'from-indigo-500 to-indigo-600'
              },
              {
                icon: Target,
                title: 'Career Insights',
                description: 'Get personalized insights and recommendations to advance your career strategically.',
                color: 'from-pink-500 to-pink-600'
              }
            ].map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full mb-4">
              Pricing
            </div>
            <h2 className="text-4xl lg:text-5xl text-gray-900 mb-4">
              Plans that scale with{' '}
              <span className="bg-gradient-to-r from-teal-500 to-emerald-600 bg-clip-text text-transparent">
                your career story
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that works best for you
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Trial */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-teal-500 transition-all">
              <div className="text-sm text-gray-600 mb-2">Free Trial</div>
              <div className="text-4xl text-gray-900 mb-1">$0</div>
              <div className="text-sm text-gray-500 mb-6">Get started for free</div>
              <button 
                onClick={() => scrollToAuth(LOGIN_VIEW.SIGN_UP)} 
                className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-all mb-6"
              >
                Start Free
              </button>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
                  <span className="text-gray-600">3 complementary generations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
                  <span className="text-gray-600">Single active content upload</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
                  <span className="text-gray-600">Access to all prompt templates</span>
                </li>
              </ul>
            </div>

            {/* Weekly */}
            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-8 transform scale-105 shadow-2xl">
              <div className="text-sm text-teal-100 mb-2">Weekly</div>
              <div className="text-4xl text-white mb-1">$9.99</div>
              <div className="text-sm text-teal-100 mb-6">per week</div>
              <button 
                onClick={handleSubscribe}
                className="w-full bg-white text-teal-600 py-3 rounded-lg hover:bg-teal-50 transition-all mb-6 font-medium"
              >
                Subscribe
              </button>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
                  <span className="text-white">Unlimited generations across templates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
                  <span className="text-white">Multiple saved content and quick switching</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
                  <span className="text-white">Early access to upcoming prompts</span>
                </li>
              </ul>
            </div>

            {/* Monthly */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-teal-500 transition-all">
              <div className="text-sm text-gray-600 mb-2">Monthly</div>
              <div className="text-4xl text-gray-900 mb-1">$27.99</div>
              <div className="text-sm text-gray-500 mb-6">per month</div>
              <button 
                onClick={handleSubscribe}
                className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition-all mb-6 font-medium"
              >
                Subscribe
              </button>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
                  <span className="text-gray-600">Everything in Weekly</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
                  <span className="text-gray-600">Better value with monthly billing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
                  <span className="text-gray-600">Priority support for your team</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
                  <span className="text-gray-600">Premium prompt handle drops</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Section */}
      <section id="auth" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl text-gray-900 mb-4">
                Ready to Accelerate Your Career?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join thousands of professionals who are already using AI to advance their careers
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="mb-6">
                <h3 className="text-2xl text-gray-900 mb-2">
                  {view === LOGIN_VIEW.SIGN_IN ? 'Welcome back' : 'Create your account'}
                </h3>
                <p className="text-gray-600">
                  {view === LOGIN_VIEW.SIGN_IN
                    ? 'Sign in to keep generating tailored career collateral.'
                    : 'Join CareerPilot to unlock personalized career intelligence.'}
                </p>
              </div>

              <div className="inline-flex bg-gray-100 rounded-full p-1 mb-6 w-full">
                <button
                  type="button"
                  onClick={() => toggleView(LOGIN_VIEW.SIGN_IN)}
                  className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all ${
                    view === LOGIN_VIEW.SIGN_IN
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md'
                      : 'text-gray-600'
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => toggleView(LOGIN_VIEW.SIGN_UP)}
                  className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all ${
                    view === LOGIN_VIEW.SIGN_UP
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md'
                      : 'text-gray-600'
                  }`}
                >
                  Create account
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@careerpilot.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete={view === LOGIN_VIEW.SIGN_IN ? 'current-password' : 'new-password'}
                    placeholder="Enter at least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>

                {view === LOGIN_VIEW.SIGN_IN && !showForgotPassword && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-teal-600 hover:text-teal-700 text-right w-full"
                  >
                    Forgot password?
                  </button>
                )}

                {view === LOGIN_VIEW.SIGN_IN && showForgotPassword && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Enter your email and we'll send you a password reset link.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordMessage('');
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      ← Back to sign in
                    </button>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={forgotPasswordLoading}
                      className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {forgotPasswordLoading ? 'Sending...' : 'Send reset link'}
                    </button>
                    {forgotPasswordMessage && (
                      <p className={`text-sm ${forgotPasswordMessage.includes('Check your email') ? 'text-green-600' : 'text-red-600'}`}>
                        {forgotPasswordMessage}
                      </p>
                    )}
                  </div>
                )}

                {view === LOGIN_VIEW.SIGN_UP && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                        First name
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        autoComplete="given-name"
                        placeholder="Taylor"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                        Last name
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        autoComplete="family-name"
                        placeholder="Morgan"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {errorMessage}
                  </div>
                )}

                {!showForgotPassword && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? 'Please wait…' : view === LOGIN_VIEW.SIGN_IN ? 'Sign in' : 'Create account'}
                  </button>
                )}
              </form>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-sm text-gray-500">Or continue with</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full mt-6 flex items-center justify-center gap-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-all py-3 font-medium text-gray-700 disabled:opacity-50"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M19.6 10.2273C19.6 9.5091 19.5382 8.81817 19.4245 8.15454H10V12.0773H15.4509C15.2155 13.3455 14.5064 14.3909 13.3527 15.1273V17.7545H16.5527C18.5091 15.9727 19.6 13.3455 19.6 10.2273Z" fill="#4285F4" />
                  <path d="M10 20C12.7 20 14.9636 19.1091 16.5527 17.7546L13.3527 15.1273C12.4546 15.7273 11.3273 16.1 10 16.1C7.39545 16.1 5.19091 14.3091 4.40909 11.9364H1.09091V14.6364C2.67273 17.9818 6.09091 20 10 20Z" fill="#34A853" />
                  <path d="M4.40909 11.9363C4.2 11.3363 4.08182 10.6909 4.08182 9.99998C4.08182 9.30907 4.2 8.66362 4.40909 8.06362V5.36362H1.09091C0.4 6.69089 0 8.3045 0 9.99998C0 11.6954 0.4 13.309 1.09091 14.6363L4.40909 11.9363Z" fill="#FBBC05" />
                  <path d="M10 3.9C11.45 3.9 12.7364 4.4 13.7455 5.36364L16.6255 2.45455C14.9636 0.809091 12.7 0 10 0C6.09091 0 2.67273 2.01818 1.09091 5.36364L4.40909 8.06364C5.19091 5.69091 7.39545 3.9 10 3.9Z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </button>

              <p className="mt-6 text-xs text-center text-gray-500">
                By continuing, you agree to our{' '}
                <a href="/privacy_policy.html" target="_blank" rel="noreferrer" className="text-teal-600 hover:text-teal-700">
                  privacy policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-teal-500 to-emerald-600 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl text-white mb-6">
            Ready to Accelerate Your Career?
          </h2>
          <p className="text-xl text-teal-100 mb-8">
            Join thousands of professionals who are already using AI to advance their careers
          </p>
          <button 
            onClick={() => scrollToAuth(LOGIN_VIEW.SIGN_UP)} 
            className="bg-white text-teal-600 px-8 py-4 rounded-lg hover:shadow-xl transition-all inline-flex items-center gap-2 group font-medium"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-2 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-white text-lg font-semibold">CareerPilot</span>
              </div>
              <p className="text-sm">AI-powered career assistant for the modern professional.</p>
            </div>
            <div>
              <h4 className="text-white mb-4 font-semibold">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Updates</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white mb-4 font-semibold">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white mb-4 font-semibold">Contact & Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="mailto:careerpilotconsulting@gmail.com" className="hover:text-white transition-colors flex items-center gap-2">
                    <span>Contact Us</span>
                  </a>
                </li>
                <li className="text-gray-500 text-xs mt-1">careerpilotconsulting@gmail.com</li>
                <li><a href="/privacy_policy.html" target="_blank" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-sm">
            © 2025 CareerPilot. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export const getServerSideProps = async (ctx) => {
  try {
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
  } catch (error) {
    // If there's an error (e.g., missing env vars), still render the page
    // The client-side will handle authentication
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        initialSession: null,
      },
    };
  }
};
