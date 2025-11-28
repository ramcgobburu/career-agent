import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if already shown in this session
    if (sessionStorage.getItem('pwa-install-prompt-shown')) {
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
    sessionStorage.setItem('pwa-install-prompt-shown', 'true');
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa-install-prompt-shown', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="install-prompt">
      <div className="install-prompt__content">
        <div className="install-prompt__icon">📱</div>
        <div className="install-prompt__text">
          <h3>Install CareerPilot</h3>
          <p>Add to your home screen for quick access</p>
        </div>
        <div className="install-prompt__actions">
          <button onClick={handleInstall} className="install-prompt__install">
            Install
          </button>
          <button onClick={handleDismiss} className="install-prompt__dismiss">
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

