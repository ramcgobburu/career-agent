import '../styles/globals.css';
import { useState, useEffect } from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import InstallPrompt from '../components/InstallPrompt';

function MyApp({ Component, pageProps }) {
  const [supabaseClient] = useState(() => createPagesBrowserClient());

  useEffect(() => {
    // Register service worker with update checking
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { updateViaCache: 'none' })
          .then((registration) => {
            console.log('Service Worker registered:', registration);
            
            // Check for updates every hour
            setInterval(() => {
              registration.update();
            }, 3600000); // 1 hour

            // Check for updates on page focus
            window.addEventListener('focus', () => {
              registration.update();
            });

            // Listen for service worker updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New service worker available, prompt user to reload
                    if (confirm('New version available! Reload to update?')) {
                      window.location.reload();
                    }
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.log('Service Worker registration failed:', error);
          });

        // Listen for controller change (new service worker activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      });
    }
  }, []);

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >
      <Component {...pageProps} />
      <InstallPrompt />
    </SessionContextProvider>
  );
}

export default MyApp;
