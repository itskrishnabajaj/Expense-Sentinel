import { memo, useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { TapButton } from './TapButton';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt = memo(function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('pwa-install-dismissed')) {
      setDismissed(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') setPromptEvent(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', '1');
    setPromptEvent(null);
  };

  if (!promptEvent || dismissed) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-lg mx-auto">
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
          <Download size={18} className="text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">Install App</p>
          <p className="text-xs text-[#6B6B6B]">Add to home screen for quick access</p>
        </div>
        <div className="flex items-center gap-2">
          <TapButton
            onTap={handleInstall}
            className="px-3 py-1.5 bg-indigo-500 active:bg-indigo-600 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Install
          </TapButton>
          <TapButton
            onTap={handleDismiss}
            className="p-1.5 text-[#6B6B6B] active:text-white transition-colors"
          >
            <X size={14} />
          </TapButton>
        </div>
      </div>
    </div>
  );
});
