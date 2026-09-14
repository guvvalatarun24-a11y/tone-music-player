import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="offline-status-indicator"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-amber-500/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-lg border border-amber-300/30 animate-pulse"
    >
      <WifiOff className="w-3.5 h-3.5" />
      <span>Offline Mode — Playing local device music</span>
    </div>
  );
};
