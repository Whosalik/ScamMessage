import React from 'react';
import { X, ExternalLink, AlertTriangle, ShieldCheck } from 'lucide-react';

export type WalletModalType = 'not-installed' | 'rejected' | 'error';

interface WalletModalProps {
  isOpen: boolean;
  type: WalletModalType;
  errorMessage?: string;
  onClose: () => void;
  onRetry?: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  type,
  errorMessage,
  onClose,
  onRetry,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#0d1017] border border-slate-700/70 rounded-2xl p-6 shadow-2xl relative text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <svg width="18" height="18" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M112.4 63.8C110.8 54.2 104.9 46.2 96.3 41.7C87.7 37.2 77.5 36.7 68.4 40.2C59.3 43.8 52.3 51 49.3 60.1C46.3 69.2 47.6 79.2 52.8 87.2C58 95.2 66.5 100.3 76.1 101.1C85.7 101.9 95.3 98.3 102.3 91.3C109.3 84.3 113.2 74.4 112.4 63.8Z" fill="url(#paint0_linear)"/>
                <path d="M78.6 15.6C54.8 15.6 35.6 34.8 35.6 58.6C35.6 62.4 36.1 66 37.1 69.4L15.6 90.9V112.4H37.1V98.1H51.4V83.8L59.1 76.1C64.9 79.6 71.6 81.6 78.6 81.6C102.4 81.6 121.6 62.4 121.6 38.6C121.6 15.6 102.4 15.6 78.6 15.6ZM78.6 32.8C83.3 32.8 87.1 36.6 87.1 41.3C87.1 46 83.3 49.8 78.6 49.8C73.9 49.8 70.1 46 70.1 41.3C70.1 36.6 73.9 32.8 78.6 32.8Z" fill="#AB9FF2"/>
                <defs>
                  <linearGradient id="paint0_linear" x1="48" y1="40" x2="112" y2="101" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#534BB1"/>
                    <stop offset="1" stopColor="#551A8B"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Phantom кошелёк</h3>
              <p className="text-xs text-slate-400">Solana Web3 Provider</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {type === 'not-installed' && (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40">
              <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs mb-2">
                <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0" />
                Phantom не найден
              </div>
              <p className="text-sm font-medium text-slate-100 leading-relaxed mb-2">
                Откройте приложение в отдельной вкладке с установленным Phantom.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                В изолированных фреймах расширения браузера часто заблокированы. Откройте прямую ссылку на приложение или установите Phantom, если он ещё не установлен.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <a
                href={typeof window !== 'undefined' ? window.location.href : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-purple-900/30"
              >
                <span>Открыть в новой вкладке</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://phantom.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Скачать Phantom</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {type === 'rejected' && (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40">
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs mb-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                Подключение отклонено (код 4001)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Вы отменили запрос на подключение в окне Phantom кошелька. Чтобы привязать адрес, подтвердите запрос авторизации.
              </p>
            </div>

            <div className="pt-2 flex gap-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Попробовать снова
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}

        {type === 'error' && (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40">
              <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs mb-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                Ошибка при подключении кошелька
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {errorMessage || 'Не удалось установить соединение с провайдером Phantom.'}
              </p>
            </div>

            <div className="pt-2 flex gap-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Повторить попытку
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
