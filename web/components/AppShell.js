import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const MENU_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Generator', href: '/generator', icon: '⚡️' },
  { label: 'Account', href: '/account', icon: '👤' },
  { label: 'Subscription', href: '#', icon: '💳', disabled: true },
  { label: 'Your docs', href: '#', icon: '🗂', disabled: true },
  { label: 'Settings', href: '#', icon: '⚙️', disabled: true },
];

export default function AppShell({ children }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <span className="app-shell__logo">CA</span>
          <span className="app-shell__title">Career-Agent</span>
        </div>
        <nav className="app-shell__nav">
          <ul>
            {MENU_ITEMS.map((item) => {
              const isActive = item.href !== '#' && currentPath.startsWith(item.href);
              return (
                <li key={item.label} className={isActive ? 'active' : ''}>
                  {item.disabled ? (
                    <span className="app-shell__nav-item app-shell__nav-item--disabled">
                      <span className="app-shell__nav-icon" aria-hidden="true">
                        {item.icon}
                      </span>
                      <span className="app-shell__nav-label">{item.label}</span>
                      <span className="app-shell__nav-label--hint">Coming soon</span>
                    </span>
                  ) : (
                    <Link href={item.href} className="app-shell__nav-item" onClick={closeMobile}>
                      <span className="app-shell__nav-icon" aria-hidden="true">
                        {item.icon}
                      </span>
                      <span className="app-shell__nav-label">{item.label}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        <button className="app-shell__collapse" type="button" onClick={handleToggleSidebar}>
          {collapsed ? '→' : '←'}
        </button>
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
    </div>
  );
}

