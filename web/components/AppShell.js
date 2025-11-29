import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import HelpSidebar from './HelpSidebar';

const MENU_ITEMS = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Context Manager', href: '/context-manager' },
  { label: 'Resume Builder', href: '/resume-builder' },
  { label: 'Job Tracker', href: '/job-tracker' },
  { label: 'Generator', href: '/generator' },
  { label: 'LinkedIn Optimizer', href: '/linkedin-optimizer' },
  { label: 'Account', href: '/account' },
  { label: 'Subscription', href: '/subscription' },
  { label: 'Settings', href: '/settings' },
];

export default function AppShell({ children }) {
  const router = useRouter();
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

  return (
    <div className={`app-shell ${collapsed ? 'app-shell--collapsed' : ''} ${mobileOpen ? 'app-shell--mobile-open' : ''}`}>
      <aside className="app-shell__sidebar">
        <div className="app-shell__brand">
          <span className="app-shell__logo">CP</span>
          <span className="app-shell__title">CareerPilot</span>
        </div>
        <nav className="app-shell__nav">
          <ul>
            {MENU_ITEMS.map((item) => {
              const isActive = item.href !== '#' && currentPath.startsWith(item.href);
              return (
                <li key={item.label} className={isActive ? 'active' : ''}>
                  <Link 
                    href={item.href} 
                    className="app-shell__nav-item" 
                    onClick={() => {
                      // Close mobile sidebar when link is clicked
                      setMobileOpen(false);
                    }}
                    style={{ 
                      display: 'block',
                      width: '100%',
                      textDecoration: 'none',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    <span className="app-shell__nav-label">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="app-shell__help-section">
            <button
              type="button"
              className="app-shell__help-button"
              onClick={() => setHelpOpen(true)}
            >
              <span className="app-shell__help-icon">?</span>
              <span className="app-shell__help-label">Help & FAQ</span>
            </button>
          </div>
        </nav>
      </aside>

      <div className="app-shell__main">
        <header className="app-shell__mobile-header">
          <button type="button" className="app-shell__mobile-toggle" onClick={handleMobileToggle}>
            ☰
          </button>
          <span>Career-Agent</span>
        </header>
        <div className="app-shell__content">{children}</div>
      </div>
      {mobileOpen && <div className="app-shell__backdrop" onClick={closeMobile} aria-hidden="true" />}
      <HelpSidebar isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

