import { Progress } from "@/components/ui/progress";

interface BypassExpirationBarProps {
  startTime: string;
  endTime: string;
}

export function BypassExpirationBar({ startTime, endTime }: BypassExpirationBarProps) {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const total = end - start;
  const elapsed = now - start;
  const remaining = end - now;

  if (remaining <= 0) {
    return <span className="text-xs font-semibold text-red-600">Expiré</span>;
  }

  const percentElapsed = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const hoursLeft = remaining / 3600000;
  const minutesLeft = Math.floor((remaining % 3600000) / 60000);

  let colorClass: string;
  let label: string;

  if (hoursLeft >= 4) {
    colorClass = "bg-green-500";
    label = `${Math.floor(hoursLeft)}h ${minutesLeft}min`;
  } else if (hoursLeft >= 1) {
    colorClass = "bg-orange-500";
    label = `${Math.floor(hoursLeft)}h ${minutesLeft}min`;
  } else {
    colorClass = "bg-red-500 animate-pulse";
    label = `${Math.floor(remaining / 60000)}min`;
  }

  return (
    <div className="flex flex-col gap-1 min-w-[120px]">
      <Progress
        value={100 - percentElapsed}
        className="h-2 bg-muted"
        indicatorClassName={colorClass}
      />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
