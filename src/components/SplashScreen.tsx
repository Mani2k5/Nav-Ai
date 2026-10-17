import React, { useEffect, useState } from 'react';
import { ArrowRight, Compass, Heart, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  onDismiss: () => void;
  autoDismissDelay?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDismiss, autoDismissDelay = 2400 }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const pct = Math.min(100, Math.round(((Date.now() - startTime) / autoDismissDelay) * 100));
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        onDismiss();
      }
    }, 35);
    return () => clearInterval(interval);
  }, [autoDismissDelay, onDismiss]);

  const progressWidth = progress >= 88 ? 'w-full' : progress >= 62 ? 'w-3/4' : progress >= 36 ? 'w-1/2' : progress >= 12 ? 'w-1/4' : 'w-0';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex min-h-screen flex-col overflow-hidden bg-[#f7fbff] px-6 text-[#10213f] select-none safe-top safe-bottom"
    >
      <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />
      <div className="absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-cyan-100/40 blur-3xl" />

      <div className="relative z-10 flex w-full items-center justify-between pt-2 text-[11px] font-bold tracking-[0.22em] text-blue-800/70">
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-600" /> NAVAI CONCIERGE</span>
        <button onClick={onDismiss} aria-label="Skip introduction" className="min-h-11 rounded-full px-3 text-[11px] tracking-normal text-slate-600 transition hover:bg-white hover:text-blue-700">Skip</button>
      </div>

      <div className="relative z-10 my-auto flex flex-col items-center text-center">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15, duration: 0.6 }} className="relative mb-9 flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80">
          <div className="absolute inset-4 rounded-full border border-blue-200/70 bg-blue-100/35 shadow-[0_0_80px_rgba(37,99,235,0.14)]" />
          <div className="absolute inset-0 rounded-full border border-blue-100/70 animate-pulse-slow" />
          <div className="absolute left-5 top-1/2 h-3 w-3 rounded-full bg-blue-600 shadow-lg shadow-blue-400/50" />
          <div className="absolute right-5 top-1/4 h-3 w-3 rounded-full bg-cyan-500 shadow-lg shadow-cyan-400/50" />
          <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-8 border-white bg-gradient-to-br from-blue-700 to-blue-500 text-white shadow-2xl shadow-blue-300/50 sm:h-44 sm:w-44">
            <Compass className="h-16 w-16 sm:h-20 sm:w-20" strokeWidth={1.5} />
            <div className="absolute -bottom-2 rounded-full bg-white px-3 py-1 text-[9px] font-black tracking-[0.18em] text-blue-700 shadow-md">GUIDE</div>
          </div>
        </motion.div>

        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}>
          <div className="flex items-center justify-center gap-3 text-blue-600"><span className="h-px w-9 bg-blue-200" /><Sparkles className="h-4 w-4" /><span className="h-px w-9 bg-blue-200" /></div>
          <h1 className="mt-5 text-5xl font-extrabold tracking-[0.18em] text-blue-700 sm:text-7xl">NAVAI</h1>
          <p className="mt-5 max-w-xs text-2xl font-semibold leading-tight text-[#10213f] sm:max-w-md sm:text-3xl">Your smart companion <span className="text-blue-600">for every journey.</span></p>
          <div className="mt-8 rounded-full border border-white bg-white/85 px-5 py-3 text-sm font-semibold text-slate-600 shadow-sm sm:text-base">Welcome <span className="mx-2 text-blue-600">•</span> नमस्कार <span className="mx-2 text-blue-600">•</span> வணக்கம்</div>
        </motion.div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-col items-center gap-4 pb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600"><Heart className="h-5 w-5 text-blue-600" /> Made in India</div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-100"><div className={`h-full ${progressWidth} rounded-full bg-blue-600 transition-all duration-100`} /></div>
        <button onClick={onDismiss} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 active:scale-[0.98]">Enter NAVAI <ArrowRight className="h-4 w-4" /></button>
      </div>
    </motion.div>
  );
};
