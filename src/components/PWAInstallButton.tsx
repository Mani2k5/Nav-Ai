import React, { useState } from 'react';
import { Download, Share2, X, Check, CheckCircle2 } from 'lucide-react';
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
        className="flex min-h-11 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-2.5 text-xs font-bold text-blue-700 shadow-sm transition-all hover:bg-blue-100 active:scale-95"
        title="Install NAVAI for offline access"
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
          className="flex min-h-11 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-2.5 text-xs font-bold text-blue-700 shadow-sm transition-all hover:bg-blue-100 active:scale-95"
          title="Add NAVAI to your home screen"
        >
          <Share2 className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Add to Home Screen</span>
          <span className="sm:hidden">Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-700 text-xs font-extrabold text-white">N</div>
                  <h3 className="text-sm font-extrabold text-slate-900">Add NAVAI on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close install guide"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-3 space-y-2.5 text-xs leading-5 text-slate-600">
                <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-extrabold text-blue-700">1</span>
                  <p>
                    Tap the <strong>Share</strong> button <Share2 className="inline h-3.5 w-3.5 text-blue-700" /> in your Safari toolbar.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-extrabold text-blue-700">2</span>
                  <p>
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 p-2.5 text-emerald-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <p>
                    The station map and routing stay fully available offline.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 min-h-12 w-full rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white transition hover:bg-blue-800"
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
