import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CheckCircle2 } from 'lucide-react';
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
      <div className="fixed left-1/2 top-20 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg">
        <Wifi className="h-4 w-4" />
        <span>Back online. Station map re-synced.</span>
      </div>
    );
  }

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed left-1/2 top-20 z-50 w-[92%] max-w-md -translate-x-1/2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <WifiOff className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
              {forcedOffline ? 'Offline preview' : 'Weak station signal'}
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-900/90">
              The blueprint map and routing keep working. Voice calls resume when the signal returns.
            </p>
            <p className="mt-1.5 text-[11px] font-semibold text-amber-700">
              {cachedNodesCount} zones · {cachedEdgesCount} routes cached
            </p>
          </div>
        </div>
        {onToggleForcedOffline && (
          <button
            onClick={onToggleForcedOffline}
            className="min-h-11 shrink-0 rounded-xl bg-amber-600 px-3 text-xs font-bold text-white transition hover:bg-amber-700"
          >
            {forcedOffline ? 'Go online' : 'Dismiss'}
          </button>
        )}
      </div>
    </div>
  );
};
