import { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { remainingSeconds, formatMMSS } from '@/lib/format';
import { cn } from '@maill/shared';

interface CountdownProps {
  expireTime?: string;
  onExpire?: () => void;
  className?: string;
}

export function Countdown({ expireTime, onExpire, className }: CountdownProps) {
  const [secs, setSecs] = useState(() => remainingSeconds(expireTime));

  useEffect(() => {
    setSecs(remainingSeconds(expireTime));
    if (!expireTime) return;
    const interval = setInterval(() => {
      const left = remainingSeconds(expireTime);
      setSecs(left);
      if (left === 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expireTime, onExpire]);

  const danger = secs > 0 && secs <= 60;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono tabular-nums text-sm',
        danger ? 'text-destructive' : 'text-foreground',
        className,
      )}
    >
      <Timer className="h-3.5 w-3.5" />
      {formatMMSS(secs)}
    </span>
  );
}
