import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, Database, CheckCircle2, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineIndicatorProps {
  forcedOffline?: boolean;
  onToggleForcedOffline?: () => void;
  cachedNodesCount?: number;
  cachedEdgesCount?: number;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  forcedOffline = false,
  onToggleForcedOffline,
  cachedNodesCount = 19,
  cachedEdgesCount = 28,
}) => {
  const browserOnline = useOnlineStatus();
  const isOnline = browserOnline && !forcedOffline;
  const [showReconnectedBanner, setShowReconnectedBanner] = useState(false);
  const [hasBeenOffline, setHasBeenOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setHasBeenOffline(true);
      setShowReconnectedBanner(false);
    } else if (hasBeenOffline) {
      setShowReconnectedBanner(true);
      const timer = setTimeout(() => {
        setShowReconnectedBanner(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, hasBeenOffline]);

  if (showReconnectedBanner && isOnline) {
    return (
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-emerald-600 text-white px-4 py-2 text-xs font-semibold shadow-xl border border-emerald-500 animate-in fade-in slide-in-from-top-4">
        <Wifi className="w-3.5 h-3.5" />
        <span>Station network reconnected. Station cache synced.</span>
      </div>
    );
  }

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg rounded-2xl bg-amber-500 text-white px-4 py-3 shadow-2xl border border-amber-400 animate-in fade-in slide-in-from-top-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-600/50 shrink-0 mt-0.5">
            <WifiOff className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-amber-100">
                {forcedOffline ? 'Offline Mode (Simulated)' : 'Station Connectivity Drop'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-600/60 text-[10px] font-semibold text-white">
                Service Worker Active
              </span>
            </div>
            <p className="text-xs text-amber-50 mt-1 font-medium leading-relaxed">
              Navigation is uninterrupted. Full KSR station blueprint &amp; topological graph are cached in Service Worker.
            </p>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-amber-100 font-medium">
              <span>{cachedNodesCount} Station Zones</span>
              <span aria-hidden="true">·</span>
              <span>{cachedEdgesCount} Corridors</span>
              <span aria-hidden="true">·</span>
              <span>Offline Pathfinding Active</span>
            </div>
          </div>
        </div>

        {onToggleForcedOffline && (
          <button
            onClick={onToggleForcedOffline}
            className="text-[10px] px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 transition"
          >
            {forcedOffline ? 'Go Online' : 'Dismiss'}
          </button>
        )}
      </div>
    </div>
  );
};
