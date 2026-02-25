import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getPendingCount } from '@/utils/offlineQueue';
import { useState, useEffect } from 'react';

export function OfflineIndicator() {
  const { isOnline } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isOnline) {
      const interval = setInterval(() => {
        setPendingCount(getPendingCount());
      }, 2000);
      setPendingCount(getPendingCount());
      return () => clearInterval(interval);
    } else {
      setPendingCount(0);
    }
  }, [isOnline]);

  if (isOnline) return null;

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium z-[60]">
      <WifiOff className="w-4 h-4" />
      <span>
        Mode hors ligne
        {pendingCount > 0
          ? ` — ${pendingCount} modification${pendingCount > 1 ? 's' : ''} en attente de synchronisation`
          : ' — Les modifications seront synchronisées au retour en ligne'}
      </span>
    </div>
  );
}
