import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Home, FileText, FolderOpen, Briefcase, Sparkles, Linkedin, User, CreditCard, Settings as SettingsIcon, HelpCircle, Compass, LogOut } from 'lucide-react';
import HelpSidebar from './HelpSidebar';

const MENU_ITEMS = [
  { label: 'Home', href: '/dashboard', icon: Home, badge: null },
  { label: 'Content Manager', href: '/context-manager', icon: FolderOpen, badge: null },
  { label: 'Resume Builder', href: '/resume-builder', icon: FileText, badge: null },
  { label: 'Job Tracker', href: '/job-tracker', icon: Briefcase, badge: null },
  { label: 'Generator', href: '/generator', icon: Sparkles, badge: null },
  { label: 'LinkedIn Optimizer', href: '/linkedin-optimizer', icon: Linkedin, badge: 'LINKEDIN PROFILE' },
];

const BOTTOM_MENU_ITEMS = [
  { label: 'Account', href: '/account', icon: User, badge: null },
  { label: 'Subscription', href: '/subscription', icon: CreditCard, badge: 'ACCOUNT OVERVIEW' },
  { label: 'Settings', href: '/settings', icon: SettingsIcon, badge: null },
  { label: 'Help & FAQ', href: '#', icon: HelpCircle, badge: null, onClick: true },
];

export default function AppShell({ children }) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const currentPath = useMemo(() => router.pathname, [router.pathname]);

  const handleToggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  const handleMobileToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const closeMobile = () => setMobileOpen(false);

  const handleSignOut = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      
      // Wait a moment to ensure session is cleared
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Force a full page reload with signout parameter to clear server-side session
      // Use window.location instead of router.push to bypass Next.js routing cache
      window.location.href = '/?signout=true';
    } catch (err) {
      console.error('Error during sign out:', err);
      // Even on error, try to redirect
      window.location.href = '/';
    }
  };

  return (
    <div className={`app-shell ${collapsed ? 'app-shell--collapsed' : ''} ${mobileOpen ? 'app-shell--mobile-open' : ''}`}>
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col z-20">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center">
            <img src="/logo.svg" alt="CareerPilot" className="h-12" />
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {MENU_ITEMS.map((item) => {
              const isActive = item.href !== '#' && currentPath.startsWith(item.href);
              const IconComponent = item.icon;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    style={{ textDecoration: 'none', WebkitTapHighlightColor: 'transparent' }}
                  >
                    <IconComponent className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{item.label}</span>
                    {item.badge && isActive && (
                      <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Navigation */}
        <div className="p-4 border-t border-gray-200">
          <ul className="space-y-1">
            {BOTTOM_MENU_ITEMS.map((item) => {
              const isActive = item.href !== '#' && currentPath.startsWith(item.href);
              const IconComponent = item.icon;
              if (item.onClick) {
                return (
                  <li key={item.label}>
                    <button
                      onClick={() => {
                        setHelpOpen(true);
                        setMobileOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                        isActive
                          ? 'bg-teal-50 text-teal-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <IconComponent className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{item.label}</span>
                    </button>
                  </li>
                );
              }
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    style={{ textDecoration: 'none', WebkitTapHighlightColor: 'transparent' }}
                  >
                    <IconComponent className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{item.label}</span>
                    {item.badge && isActive && (
                      <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                onClick={() => {
                  handleSignOut();
                  setMobileOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left text-gray-700 hover:bg-red-50 hover:text-red-700"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">Sign out</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      <div className="flex-1 ml-64">
        <header className="app-shell__mobile-header">
          <button type="button" className="app-shell__mobile-toggle" onClick={handleMobileToggle}>
            ☰
          </button>
          <span>CareerPilot</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </header>
        <div className="app-shell__content">{children}</div>
      </div>
      {mobileOpen && <div className="app-shell__backdrop" onClick={closeMobile} aria-hidden="true" />}
      <HelpSidebar isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

