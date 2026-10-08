import { useState, useEffect, useRef } from 'react';
import {
  Shield,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  PhoneCall,
  Volume2,
  VolumeX,
  Wallet,
  Lock,
  Radio,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { BankInfo, SessionData, AuditRecord } from './types';
import { KAZAKHSTAN_BANKS } from './data/banks';
import { BankSelector } from './components/BankSelector';
import { CallSimulatorModal } from './components/CallSimulatorModal';
import { WalletModal, WalletModalType } from './components/WalletModal';
import { BlockchainRecords } from './components/BlockchainRecords';
import { AuditLog } from './components/AuditLog';
import { playSound } from './utils/audio';

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function generateRandomCode(): string {
  // 6 digits
  const num = Math.floor(100000 + Math.random() * 900000);
  return num.toString();
}

function generateSessionId(bankShort: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `KZ-${bankShort.toUpperCase()}-${rand}`;
}

function getFormattedTime(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

export default function App() {
  const [selectedBank, setSelectedBank] = useState<BankInfo>(KAZAKHSTAN_BANKS[0]);
  const [session, setSession] = useState<SessionData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scrambleDigits, setScrambleDigits] = useState<string[]>(['0', '0', '0', '0', '0', '0']);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isCopied, setIsCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [walletModalState, setWalletModalState] = useState<{
    isOpen: boolean;
    type: WalletModalType;
    message?: string;
  }>({
    isOpen: false,
    type: 'not-installed',
  });
  const [logs, setLogs] = useState<AuditRecord[]>([
    {
      id: 'log-0',
      timestamp: getFormattedTime(),
      type: 'SYS',
      message: 'Система ScamMessage Protocol инициализирована (KZ Gateway)',
      status: 'info',
    },
  ]);

  const timerRef = useRef<number | null>(null);
  const scrambleIntervalRef = useRef<number | null>(null);

  const addLog = (type: AuditRecord['type'], message: string, status?: AuditRecord['status']) => {
    setLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: getFormattedTime(),
        type,
        message,
        status: status || 'info',
      },
      ...prev,
    ]);
  };

  // Sound helper that respects soundEnabled toggle
  const triggerAudio = (type: 'generate' | 'verify_success' | 'verify_fail' | 'click') => {
    if (soundEnabled) {
      playSound(type);
    }
  };

  const handleBankChange = (bank: BankInfo) => {
    setSelectedBank(bank);
    triggerAudio('click');
    addLog('SYS', `Выбран шлюз: ${bank.name} (${bank.gateway})`, 'info');
  };

  // Phantom Wallet listeners
  useEffect(() => {
    const provider = typeof window !== 'undefined' ? window.solana : undefined;
    if (!provider?.isPhantom) return;

    const handleAccountChange = (pubKey: unknown) => {
      if (pubKey) {
        const addr = (pubKey as { toString(): string }).toString();
        setWalletAddress(addr);
        addLog('SYS', `Phantom аккаунт изменён: ${shortenAddress(addr)}`, 'info');
      } else {
        setWalletAddress(null);
        addLog('SYS', 'Phantom аккаунт отключен', 'info');
      }
    };

    const handleDisconnect = () => {
      setWalletAddress(null);
      addLog('SYS', 'Сессия Phantom завершена', 'info');
    };

    provider.on('accountChanged', handleAccountChange);
    provider.on('disconnect', handleDisconnect);

    return () => {
      provider.removeListener('accountChanged', handleAccountChange);
      provider.removeListener('disconnect', handleDisconnect);
    };
  }, []);

  const handleConnectWallet = async () => {
    triggerAudio('click');
    const provider = typeof window !== 'undefined' ? window.solana : undefined;

    // 1. Проверяем window.solana?.isPhantom
    if (!provider || !provider.isPhantom) {
      setWalletModalState({ isOpen: true, type: 'not-installed' });
      addLog('SYS', 'Расширение Phantom не обнаружено в браузере', 'warning');
      return;
    }

    try {
      setIsConnectingWallet(true);
      // 2. Вызываем window.solana.connect() и получаем publicKey
      const resp = await provider.connect();
      const pubKey = resp.publicKey.toString();
      setWalletAddress(pubKey);
      setWalletModalState((prev) => ({ ...prev, isOpen: false }));
      triggerAudio('verify_success');
      addLog('SYS', `Phantom кошелёк подключен: ${shortenAddress(pubKey)}`, 'success');
    } catch (err: unknown) {
      console.error('Phantom connect error:', err);
      triggerAudio('verify_fail');
      const errorObj = err as { code?: number; message?: string };
      // 4. Обрабатываем отказ пользователя (код 4001)
      if (errorObj?.code === 4001 || errorObj?.message?.includes('User rejected')) {
        setWalletModalState({ isOpen: true, type: 'rejected' });
        addLog('SYS', 'Подключение Phantom отклонено пользователем (код 4001)', 'warning');
      } else {
        setWalletModalState({
          isOpen: true,
          type: 'error',
          message: errorObj?.message || 'Не удалось подключиться к кошельку Phantom',
        });
        addLog('SYS', `Ошибка Phantom: ${errorObj?.message || 'Сбой подключения'}`, 'danger');
      }
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleDisconnectWallet = async () => {
    triggerAudio('click');
    try {
      const provider = typeof window !== 'undefined' ? window.solana : undefined;
      if (provider?.disconnect) {
        await provider.disconnect();
      }
    } catch (err) {
      console.error('Phantom disconnect error:', err);
    }
    setWalletAddress(null);
    addLog('SYS', 'Phantom кошелёк отключен пользователем', 'info');
  };

  // Start Generation Flow with realistic cryptography scramble
  const handleGenerateCode = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    triggerAudio('click');

    addLog('SEC', `Запрос на генерацию одноразового ключа для ${selectedBank.name}...`, 'info');

    // Scramble effect
    let count = 0;
    scrambleIntervalRef.current = window.setInterval(() => {
      setScrambleDigits(
        Array.from({ length: 6 }, () => Math.floor(Math.random() * 10).toString())
      );
      count++;

      if (count > 12) {
        if (scrambleIntervalRef.current) clearInterval(scrambleIntervalRef.current);

        const newCode = generateRandomCode();
        const sessionId = generateSessionId(selectedBank.shortName);

        const newSession: SessionData = {
          sessionId,
          code: newCode,
          bank: selectedBank,
          createdAt: Date.now(),
          expiresInSeconds: 60,
          status: 'active',
        };

        setSession(newSession);
        setScrambleDigits(newCode.split(''));
        setTimeLeft(60);
        setIsGenerating(false);

        triggerAudio('generate');
        addLog(
          'SEC',
          `Ключ сгенерирован: ${newCode.slice(0, 3)}-${newCode.slice(3)} | Сессия: ${sessionId}`,
          'success'
        );
      }
    }, 60);
  };

  // Session countdown timer
  useEffect(() => {
    if (!session || session.status !== 'active') return;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setSession((cur) => (cur ? { ...cur, status: 'expired' } : null));
          addLog('SEC', 'Срок действия сессионного токена истёк (60 сек)', 'warning');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.sessionId, session?.status]);

  const handleCopyCode = () => {
    if (!session) return;
    navigator.clipboard.writeText(session.code);
    setIsCopied(true);
    triggerAudio('click');
    setTimeout(() => setIsCopied(false), 2000);
    addLog('SYS', `Код ${session.code} скопирован в буфер обмена`, 'info');
  };

  const handleRevokeSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (session) {
      addLog('SEC', `Сессия ${session.sessionId} аннулирована пользователем`, 'danger');
    }
    setSession(null);
    setTimeLeft(60);
    triggerAudio('click');
  };

  const handleSimulationResult = (result: 'safe' | 'scam') => {
    if (result === 'safe') {
      addLog('CALL', `Входящий звонок: оператор успешно подтвердил код ${session?.code}`, 'success');
      if (session) {
        setSession({ ...session, status: 'verified' });
      }
    } else {
      addLog('ALERT', 'Входящий звонок: обнаружен мошенник! Код не совпал. Вызов отклонён', 'danger');
      if (session) {
        setSession({ ...session, status: 'flagged' });
      }
    }
  };

  // Timer visual math
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / 60) * 100));
  const progressColor =
    timeLeft > 25
      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
      : timeLeft > 10
      ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
      : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse';

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col relative overflow-x-hidden tech-grid-bg">
      {/* Background Soft Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-blue-600/10 blur-[130px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-10 w-[500px] h-[300px] bg-cyan-600/5 blur-[120px] pointer-events-none -z-10" />

      {/* Top Bar Navigation */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between relative z-40">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-900/30 border border-blue-400/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span>ScamMessage</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-800/60 text-blue-300">
                B2B API
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">Dynamic Call Verification Protocol</p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            title={soundEnabled ? 'Звук включен' : 'Звук выключен'}
            className="p-2 rounded-xl bg-slate-900/70 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Phantom Wallet Connect / Address / Disconnect */}
          {!walletAddress ? (
            <button
              type="button"
              onClick={handleConnectWallet}
              disabled={isConnectingWallet}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-sm group cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span>{isConnectingWallet ? 'Подключение...' : 'Подключить кошелёк'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-700/80 rounded-xl shadow-sm">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium text-purple-300 select-all"
                title={`Публичный адрес: ${walletAddress}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{shortenAddress(walletAddress)}</span>
              </div>
              <button
                type="button"
                onClick={handleDisconnectWallet}
                className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                title="Отключить Phantom кошелёк"
              >
                Отключить
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Single Screen Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-8 relative z-20">
        <div className="w-full max-w-[460px]">
          {/* Headline and Description */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              Верификация банковских звонков
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-normal leading-relaxed">
              Динамическая криптографическая проверка подлинности звонящего оператора для клиентов банков.
            </p>
          </div>

          {/* Main Interaction Card */}
          <div className="glass-panel rounded-2xl p-6 sm:p-7 shadow-2xl relative z-30 mb-5 border border-slate-700/60">
            {/* View 1: Setup & Generate */}
            {!session ? (
              <div className="space-y-6">
                {/* Bank Selector with fixed high z-index */}
                <BankSelector
                  selectedBank={selectedBank}
                  onSelectBank={handleBankChange}
                  disabled={isGenerating}
                />

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  disabled={isGenerating}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2.5 shadow-lg ${
                    isGenerating
                      ? 'bg-blue-700/60 text-blue-200 cursor-wait'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-300" />
                      <span>Связь со шлюзом {selectedBank.shortName}...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 text-white" />
                      <span>Создать одноразовый код</span>
                    </>
                  )}
                </button>

                {/* Micro Guarantee Note */}
                <div className="pt-1 flex items-center justify-center gap-2 text-[11px] text-slate-500">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Шифрование AES-256 · Прямой B2B шлюз</span>
                </div>
              </div>
            ) : (
              /* View 2: Active Session & Code Display */
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                {/* Header of Active Session */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                        {session.status === 'verified'
                          ? 'Звонок подтвержден'
                          : session.status === 'flagged'
                          ? 'Мошенник заблокирован'
                          : session.status === 'expired'
                          ? 'Срок истек'
                          : 'Сессия активна'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      Оператор обязан назвать этот код
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-mono text-lg font-bold ${
                        timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-slate-100'
                      }`}
                    >
                      00:{timeLeft.toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* 6-Digit Code Terminal Display */}
                <div>
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                    {/* First 3 digits */}
                    <div className="flex gap-1.5 sm:gap-2 flex-1">
                      {scrambleDigits.slice(0, 3).map((digit, idx) => (
                        <div
                          key={`digit-1-${idx}`}
                          className="flex-1 h-14 sm:h-16 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl sm:text-3xl font-extrabold font-mono text-white shadow-inner"
                        >
                          {digit}
                        </div>
                      ))}
                    </div>

                    <span className="text-slate-600 font-bold text-xl px-1">−</span>

                    {/* Second 3 digits */}
                    <div className="flex gap-1.5 sm:gap-2 flex-1">
                      {scrambleDigits.slice(3, 6).map((digit, idx) => (
                        <div
                          key={`digit-2-${idx}`}
                          className="flex-1 h-14 sm:h-16 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl sm:text-3xl font-extrabold font-mono text-white shadow-inner"
                        >
                          {digit}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Copy Button */}
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-800/60"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">Скопировано</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Скопировать код</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Dynamic Lifetime Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/60">
                    <div
                      className={`h-full transition-all duration-1000 ease-linear rounded-full ${progressColor}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Лимит времени</span>
                    <span>{timeLeft} сек.</span>
                  </div>
                </div>

                {/* Session Metadata Info Box */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Шлюз банка:</span>
                    <span className="font-medium text-slate-200 flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: session.bank.color }}
                      />
                      <span>{session.bank.name}</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center font-mono">
                    <span className="text-slate-500 font-sans">ID сессии:</span>
                    <span className="text-slate-400">{session.sessionId}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Статус канала:</span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <Radio className="w-3 h-3 animate-pulse" />
                      Ожидание звонка оператора...
                    </span>
                  </div>
                </div>

                {/* Interactive Test Simulator Action */}
                <div className="pt-1 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setIsSimulatorOpen(true)}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 hover:text-blue-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <PhoneCall className="w-4 h-4 text-blue-400" />
                    <span>Проверить сценарий входящего звонка</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Обновить код</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRevokeSession}
                      className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900/50 text-slate-400 hover:text-rose-300 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Сбросить
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick 3-Step Guide (Clean unboxed typography) */}
          <div className="mb-5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 leading-relaxed">
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>Как работает верификация</span>
            </div>
            <ol className="space-y-1.5 text-slate-300 pl-1">
              <li className="flex items-start gap-2">
                <span className="font-mono text-blue-400 font-bold shrink-0">1.</span>
                <span>Сгенерируйте защитный код за секунду до ответа на входящий вызов.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-blue-400 font-bold shrink-0">2.</span>
                <span>Попросите звонящего оператора назвать одноразовый код вашей сессии.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-blue-400 font-bold shrink-0">3.</span>
                <span>
                  Код совпал — звонок безопасен. Если звонит мошенник — у него токена не существует!
                </span>
              </li>
            </ol>
          </div>

          {/* Blockchain Memo Records (Solana Devnet) */}
          <div className="mb-5">
            <BlockchainRecords
              walletAddress={walletAddress}
              onConnectWallet={handleConnectWallet}
              currentSession={session}
              onAddLog={addLog}
            />
          </div>

          {/* Real-Time Security Audit Log */}
          <AuditLog logs={logs} onClear={() => setLogs([])} />

          {/* Quiet Trust Footnote */}
          <footer className="mt-8 text-center text-[11px] text-slate-500">
            <p>© 2026 ScamMessage Protocol · B2B интеграция для банков и операторов Казахстана</p>
          </footer>
        </div>
      </main>

      {/* Interactive Simulator Modal */}
      {session && (
        <CallSimulatorModal
          session={session}
          isOpen={isSimulatorOpen}
          onClose={() => setIsSimulatorOpen(false)}
          onSimulationCompleted={handleSimulationResult}
        />
      )}

      {/* Phantom Wallet Status Modal */}
      <WalletModal
        isOpen={walletModalState.isOpen}
        type={walletModalState.type}
        errorMessage={walletModalState.message}
        onClose={() => setWalletModalState((prev) => ({ ...prev, isOpen: false }))}
        onRetry={() => {
          setWalletModalState((prev) => ({ ...prev, isOpen: false }));
          handleConnectWallet();
        }}
      />
    </div>
  );
}
