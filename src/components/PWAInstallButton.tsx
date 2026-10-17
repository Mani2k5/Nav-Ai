import React, { useState } from 'react';
import { Download, Share2, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={async () => {
          const success = await install();
          if (success) {
            setJustInstalled(true);
            setTimeout(() => setJustInstalled(false), 3000);
          }
        }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 shadow-xs transition-all active:scale-95 cursor-pointer"
        title="Install KSR Station Map PWA for offline access"
      >
        {justInstalled ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-700 font-bold">Installed!</span>
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Install Offline App</span>
            <span className="sm:hidden">Install</span>
          </>
        )}
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 shadow-xs transition-all active:scale-95 cursor-pointer"
          title="Install on iOS Home Screen for offline access"
        >
          <Share2 className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Add to Home Screen</span>
          <span className="sm:hidden">Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                    N
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Install NAVAI on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 space-y-2.5 text-xs text-slate-600">
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                    1
                  </span>
                  <p>
                    Tap the <strong>Share</strong> button <Share2 className="inline w-3.5 h-3.5 text-blue-600 mx-0.5" /> in your Safari toolbar.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                    2
                  </span>
                  <p>
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                    ✓
                  </span>
                  <p>
                    KSR Station Map & routing will stay fully available offline during signal drops!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
