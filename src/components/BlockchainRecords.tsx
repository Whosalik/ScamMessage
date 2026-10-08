import React, { useState, useEffect } from 'react';
import {
  Database,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Trash2,
  Copy,
  Check,
  Coins,
} from 'lucide-react';
import { BlockchainRecord, SessionData } from '../types';
import {
  sendMemoToBlockchain,
  parseSolanaError,
  requestDevnetAirdrop,
} from '../utils/solana';

interface BlockchainRecordsProps {
  walletAddress: string | null;
  onConnectWallet: () => void;
  currentSession: SessionData | null;
  onAddLog: (type: 'SYS' | 'SEC' | 'CALL' | 'ALERT', message: string, status?: 'success' | 'warning' | 'danger' | 'info') => void;
}

const STORAGE_KEY = 'scammessage_blockchain_records_v1';

export const BlockchainRecords: React.FC<BlockchainRecordsProps> = ({
  walletAddress,
  onConnectWallet,
  currentSession,
  onAddLog,
}) => {
  const [records, setRecords] = useState<BlockchainRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    signature: string;
    explorerUrl: string;
    text: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedSig, setCopiedSig] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      // ignore
    }
  }, [records]);

  // Update default input text whenever active session changes
  useEffect(() => {
    if (currentSession) {
      const defaultText = `ScamMessage [${currentSession.bank.name}]: Сессия ${currentSession.sessionId} верифицирована. Код ${currentSession.code.slice(0, 3)}-${currentSession.code.slice(3)}`;
      setInputText(defaultText);
    } else if (!inputText) {
      setInputText('ScamMessage Protocol: Верификация банковского звонка (Тестовая запись)');
    }
  }, [currentSession?.sessionId, currentSession?.status]);

  const handleCopy = (sig: string) => {
    navigator.clipboard.writeText(sig);
    setCopiedSig(sig);
    setTimeout(() => setCopiedSig(null), 2000);
  };

  const handleSendTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessResult(null);

    if (!walletAddress) {
      onConnectWallet();
      return;
    }

    const textToSend = inputText.trim();
    if (!textToSend) {
      setErrorMessage('Пожалуйста, введите текст для записи в блокчейн.');
      return;
    }

    setIsSubmitting(true);
    onAddLog('SYS', `Инициализация транзакции SPL Memo на Solana Devnet...`, 'info');

    try {
      const { signature, explorerUrl } = await sendMemoToBlockchain(walletAddress, textToSend);

      const newRecord: BlockchainRecord = {
        id: `rec-${Date.now()}`,
        signature,
        text: textToSend,
        timestamp: new Date().toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        explorerUrl,
      };

      setRecords((prev) => [newRecord, ...prev]);
      setSuccessResult({ signature, explorerUrl, text: textToSend });
      onAddLog('SEC', `Успешно записано в блокчейн: ${signature.slice(0, 8)}...`, 'success');
    } catch (err: unknown) {
      console.error('Blockchain write error:', err);
      const friendlyError = parseSolanaError(err);
      setErrorMessage(friendlyError);
      onAddLog('ALERT', friendlyError, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestAirdrop = async () => {
    if (!walletAddress) return;
    setIsAirdropping(true);
    setErrorMessage(null);
    onAddLog('SYS', 'Запрос тестовых 1 SOL (Devnet Airdrop)...', 'info');

    try {
      const sig = await requestDevnetAirdrop(walletAddress);
      onAddLog('SYS', `Получен 1 SOL на Devnet (tx: ${sig.slice(0, 8)}...)`, 'success');
      setErrorMessage(null);
    } catch (err: unknown) {
      console.error('Airdrop error:', err);
      setErrorMessage('Не удалось запросить тестовые SOL. Лимит крана исчерпан или сеть перегружена. Попробуйте кран на faucet.solana.com.');
    } finally {
      setIsAirdropping(false);
    }
  };

  const handleClearRecords = () => {
    if (window.confirm('Очистить сохранённый список записей блокчейна?')) {
      setRecords([]);
      setSuccessResult(null);
      setErrorMessage(null);
      onAddLog('SYS', 'Список записей блокчейна очищен', 'info');
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 relative z-10 border border-slate-700/60 shadow-xl space-y-5">
      {/* Block Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Запись в блокчейн</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800/60 text-purple-300">
                Solana Devnet
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Фиксация неизменяемого следа верификации через SPL Memo
            </p>
          </div>
        </div>

        {walletAddress && (
          <button
            type="button"
            onClick={handleRequestAirdrop}
            disabled={isAirdropping}
            title="Получить 1 тестовый SOL на кошелёк для оплаты комиссий"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-purple-300 hover:text-white transition-colors cursor-pointer"
          >
            {isAirdropping ? (
              <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
            ) : (
              <Coins className="w-3 h-3 text-purple-400" />
            )}
            <span>{isAirdropping ? 'Airdrop...' : '+1 SOL (Тест)'}</span>
          </button>
        )}
      </div>

      {/* Form Input & Action */}
      <form onSubmit={handleSendTransaction} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Текст записи для отправки в блокчейн
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Например: ScamMessage: Сессия KZ-KASPI-891X верифицирована"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/70 transition-colors"
            />
          </div>
        </div>

        {!walletAddress ? (
          <button
            type="button"
            onClick={onConnectWallet}
            className="w-full py-3 px-4 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-purple-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <span>Сначала подключите Phantom кошелёк</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
              isSubmitting
                ? 'bg-purple-800/50 text-purple-200 cursor-wait'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/30 hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
                <span>Отправка транзакции в Solana Devnet...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Записать в блокчейн</span>
              </>
            )}
          </button>
        )}
      </form>

      {/* SUCCESS BANNER: «Записано в блокчейн» + ссылка «Посмотреть запись» */}
      {successResult && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-bold text-sm text-emerald-100">
                Записано в блокчейн
              </span>
            </div>
            <a
              href={successResult.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-xs font-semibold text-emerald-200 hover:text-white transition-all shadow-sm"
            >
              <span>Посмотреть запись</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 font-mono break-all">
            «{successResult.text}»
          </p>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
            <span>TX: {successResult.signature.slice(0, 12)}...{successResult.signature.slice(-8)}</span>
            <button
              type="button"
              onClick={() => handleCopy(successResult.signature)}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {copiedSig === successResult.signature ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Скопировано</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Копировать хэш</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ERROR BANNER: Понятное сообщение на русском */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="block text-rose-100 font-semibold mb-1">
                Не удалось записать в блокчейн
              </strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* LIST OF ALL RECORDS: текст, время, ссылка */}
      <div className="pt-2">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span>Список всех записей</span>
            <span className="text-[10px] text-slate-500 font-mono">
              ({records.length})
            </span>
          </h4>
          {records.length > 0 && (
            <button
              type="button"
              onClick={handleClearRecords}
              title="Очистить список"
              className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {records.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 font-mono bg-slate-950/40 rounded-xl border border-slate-900">
            Пока нет записей. Нажмите «Записать в блокчейн», чтобы зафиксировать первую транзакцию.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {records.map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-colors space-y-2"
              >
                {/* Текст записи */}
                <div className="text-xs font-medium text-slate-200 break-words leading-relaxed">
                  {rec.text}
                </div>

                {/* Время и Ссылка */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[11px]">
                  <span className="text-slate-500 font-mono">
                    {rec.timestamp}
                  </span>

                  <a
                    href={rec.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 transition-colors font-medium"
                  >
                    <span>Посмотреть запись</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
