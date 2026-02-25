import { useEffect, useRef } from "react";

type UseInactivityLogoutOptions = {
  onTimeout: () => void;
  timeoutMs?: number;
  enabled?: boolean;
};

export const useInactivityLogout = ({
  onTimeout,
  timeoutMs = 15 * 60 * 1000, // 15 minutes
  enabled = true,
}: UseInactivityLogoutOptions) => {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const resetTimer = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        onTimeout();
      }, timeoutMs);
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "visibilitychange",
    ];

    const handleEvent = () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      resetTimer();
    };

    activityEvents.forEach((event) => window.addEventListener(event, handleEvent));
    resetTimer();

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      activityEvents.forEach((event) => window.removeEventListener(event, handleEvent));
    };
  }, [enabled, onTimeout, timeoutMs]);
};

