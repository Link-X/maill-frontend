import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ScanLine, KeyRound, CheckCircle2, XCircle, Camera } from 'lucide-react';
import { Button, Input, Label, extractErrorMessage, notify, type VerifyResult } from '@maill/shared';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { formatDateTime, ticketStatusLabel } from '@/lib/format';
import { useVerifyByTicketNoMutation } from './verifyApi';

type Tab = 'manual' | 'scan';

export default function VerifyPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('manual');
  const [ticketNo, setTicketNo] = useState('');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifyByTicketNo, { isLoading }] = useVerifyByTicketNoMutation();

  const handleVerify = async () => {
    if (!ticketNo.trim()) {
      notify.warn('请输入票号');
      return;
    }
    setErrorMsg(null);
    setResult(null);
    try {
      const res = await verifyByTicketNo({ ticketNo: ticketNo.trim() }).unwrap();
      setResult(res);
      notify.success('核销成功');
    } catch (e) {
      const msg = extractErrorMessage(e);
      setErrorMsg(msg);
      notify.error(msg);
    }
  };

  return (
    <div className="pb-8">
      <div className="px-4 py-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="h-9 w-9 rounded-full bg-card flex items-center justify-center border border-border/60"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="font-semibold">票券核销</div>
      </div>

      <div className="px-4 space-y-4">
        <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg w-full">
          <TabBtn label="手动输入" active={tab === 'manual'} icon={KeyRound} onClick={() => setTab('manual')} />
          <TabBtn label="扫码（暂不支持）" active={tab === 'scan'} icon={ScanLine} onClick={() => setTab('scan')} disabled />
        </div>

        {tab === 'manual' ? (
          <Card className="p-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="ticketNo">票号</Label>
              <Input
                id="ticketNo"
                value={ticketNo}
                onChange={(e) => setTicketNo(e.target.value)}
                placeholder="请扫码或手动输入票号"
                autoComplete="off"
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              />
            </div>
            <Button
              className="w-full bg-gradient-brand hover:opacity-90"
              disabled={isLoading || !ticketNo.trim()}
              onClick={handleVerify}
            >
              {isLoading ? '核销中...' : '核销'}
            </Button>
          </Card>
        ) : (
          <Card className="p-6 text-center text-sm text-muted-foreground space-y-2">
            <Camera className="h-10 w-10 text-muted-foreground/60 mx-auto" />
            <p>摄像头扫码功能将在后续版本支持。</p>
            <p>当前请切换到"手动输入"。</p>
          </Card>
        )}

        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key="ok"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="p-4 space-y-2 border-success/30">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">核销成功</span>
                  <Badge variant="success" className="ml-auto">
                    {ticketStatusLabel(result.status)}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  票号：<span className="font-mono">{result.ticketNo}</span>
                </div>
                {result.verifyTime && (
                  <div className="text-xs text-muted-foreground">
                    核销时间：{formatDateTime(result.verifyTime)}
                  </div>
                )}
              </Card>
            </motion.div>
          )}
          {errorMsg && (
            <motion.div
              key="err"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="p-4 space-y-1 border-destructive/30">
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">核销失败</span>
                </div>
                <div className="text-sm text-muted-foreground">{errorMsg}</div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabBtn({
  label,
  icon: Icon,
  active,
  onClick,
  disabled,
}: {
  label: string;
  icon: typeof KeyRound;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`relative flex-1 px-3 py-2 text-sm rounded-md transition-colors inline-flex items-center justify-center gap-1.5 ${
        disabled
          ? 'opacity-50 cursor-not-allowed text-muted-foreground'
          : active
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {active && !disabled && (
        <motion.span
          layoutId="verify-tab-indicator"
          className="absolute inset-0 bg-background rounded-md shadow-sm"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative inline-flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
    </button>
  );
}
