/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Compass, ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  onDismiss: () => void;
  autoDismissDelay?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onDismiss,
  autoDismissDelay = 2400,
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / autoDismissDelay) * 100));
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        onDismiss();
      }
    }, 35);

    return () => clearInterval(interval);
  }, [autoDismissDelay, onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-[#0a1930] via-[#0f2444] to-[#0a1930] text-white p-6 select-none animate-in fade-in duration-300">
      {/* Top Status */}
      <div className="w-full flex justify-between items-center text-xs text-blue-200/70 pt-2 font-mono">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>KSR BENGALURU</span>
        </span>
        <button
          onClick={onDismiss}
          className="text-xs text-blue-300/80 hover:text-white px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
        >
          Skip &rarr;
        </button>
      </div>

      {/* Center Branding & Glowing Transit Mark */}
      <div className="flex flex-col items-center text-center my-auto max-w-sm">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-32 h-32 rounded-full bg-blue-500/15 animate-ping" />
          <div className="absolute w-24 h-24 rounded-full bg-indigo-500/20 animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/40 ring-4 ring-white/10">
            <Compass className="w-10 h-10 text-white" />
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-2">
          NAVAI
        </h1>
        <p className="text-sm font-semibold text-blue-300 tracking-wide uppercase">
          KSR Bengaluru Transit Concierge
        </p>

        <p className="text-xs text-blue-100/70 leading-relaxed font-normal mt-3 px-4">
          Spoken voice wayfinding with Rahul, verified platform blueprints, and offline transit routing.
        </p>
      </div>

      {/* Bottom Progress & CTA */}
      <div className="w-full max-w-sm flex flex-col items-center gap-3 pb-4">
        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
        <button
          onClick={onDismiss}
          className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <span>Enter Station Experience</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
