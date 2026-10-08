import React, { useState } from 'react';
import { Wallet, X, CheckCircle2, Shield, Zap } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#0d1017] border border-slate-700/70 rounded-2xl p-6 shadow-2xl relative text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Крипто-кошелёк & BankID</h3>
              <p className="text-xs text-slate-400">Модуль B2B микротранзакций</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-slate-300">
              <strong className="text-white block mb-0.5">Транзакционная модель монетизации</strong>
              Банк или сотовый оператор оплачивает фиксированную микроплату за каждый верифицированный звонок в режиме реального времени.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-slate-300">
              <strong className="text-white block mb-0.5">Статус разработки: Скоро (Q3)</strong>
              Интеграция кошельков MetaMask, Phantom, а также национальных шлюзов eGov Mobile & Digital ID Республики Казахстан.
            </div>
          </div>

          {subscribed ? (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-emerald-200">Вы в списке ожидания раннего доступа!</p>
              <p className="text-[11px] text-emerald-300/80 mt-1">Мы уведомим вас при открытии тестовой B2B сети.</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="pt-2">
              <label className="block text-[11px] text-slate-400 mb-1.5">
                Получить уведомление о запуске тестовой сети:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="name@company.kz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
                >
                  Записаться
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
