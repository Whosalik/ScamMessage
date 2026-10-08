import React, { useState } from 'react';
import { Phone, PhoneOff, ShieldCheck, ShieldAlert, X, RefreshCw } from 'lucide-react';
import { SessionData } from '../types';
import { playSound } from '../utils/audio';

interface CallSimulatorModalProps {
  session: SessionData;
  isOpen: boolean;
  onClose: () => void;
  onSimulationCompleted: (result: 'safe' | 'scam') => void;
}

export const CallSimulatorModal: React.FC<CallSimulatorModalProps> = ({
  session,
  isOpen,
  onClose,
  onSimulationCompleted,
}) => {
  const [activeScenario, setActiveScenario] = useState<'legit' | 'scammer'>('legit');
  const [step, setStep] = useState<'ringing' | 'connected' | 'verified' | 'rejected'>('connected');

  if (!isOpen) return null;

  const handleVerify = () => {
    playSound('verify_success');
    setStep('verified');
    onSimulationCompleted('safe');
  };

  const handleReject = () => {
    playSound('verify_fail');
    setStep('rejected');
    onSimulationCompleted('scam');
  };

  const resetSimulation = (scenario: 'legit' | 'scammer') => {
    setActiveScenario(scenario);
    setStep('connected');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[#0d1017] border border-slate-700/70 rounded-2xl p-6 shadow-2xl relative text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Интерактивная проверка звонка</h3>
              <p className="text-xs text-slate-400">Протестируйте алгоритм в действии</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scenario Switcher */}
        <div className="mt-4 p-1 bg-slate-900/90 rounded-xl border border-slate-800 flex gap-1">
          <button
            type="button"
            onClick={() => resetSimulation('legit')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeScenario === 'legit'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Настоящий банк
          </button>
          <button
            type="button"
            onClick={() => resetSimulation('scammer')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeScenario === 'scammer'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Звонок мошенника
          </button>
        </div>

        {/* Call Visual Container */}
        <div className="mt-5 p-5 rounded-xl border border-slate-800/80 bg-slate-950/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: session.bank.color }}
              />
              <span className="text-xs font-semibold text-slate-300">
                {activeScenario === 'legit' ? session.bank.name : 'Неизвестный абонент ("Служба безопасности")'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              00:14
            </div>
          </div>

          {/* Reference User Code Reminder */}
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg flex items-center justify-between mb-4">
            <span className="text-xs text-slate-400">Ваш активный код:</span>
            <span className="font-mono text-base font-bold text-blue-400 tracking-wider">
              {session.code}
            </span>
          </div>

          {/* Dialog Flow */}
          {activeScenario === 'legit' ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 text-blue-200">
                <p className="font-semibold text-blue-300 mb-1">
                  Оператор ({session.bank.name}):
                </p>
                «Здравствуйте! Для подтверждения подлинности звонка сверьте защитный код ScamMessage: <strong className="text-white underline decoration-emerald-400">{session.code}</strong>. Совпадает?»
              </div>

              {step === 'connected' && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleVerify}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/30"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Да, код совпал (Безопасно)
                  </button>
                </div>
              )}

              {step === 'verified' && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-200 mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Подлинность подтверждена!
                  </div>
                  Шлюз {session.bank.gateway} подтвердил полномочия оператора. Вы можете безопасно продолжать консультацию.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/40 text-rose-200">
                <p className="font-semibold text-rose-300 mb-1">
                  Звонящий мошенник:
                </p>
                «Срочно! По вашей карте подозрительный перевод в Дубай! Назовите пароль из СМС, иначе счёт заблокируют!»
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <span className="text-slate-400">Вы спрашиваете: </span>
                «Назовите одноразовый код из ScamMessage для подтверждения банка.»
              </div>

              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/40 text-rose-200">
                <p className="font-semibold text-rose-300 mb-1">Мошенник пытается угадать:</p>
                «Э... какой код? Я старший лейтенант безопасности! Ну, код <strong className="text-white">991-340</strong>!»
              </div>

              {step === 'connected' && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleReject}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-rose-900/30"
                  >
                    <PhoneOff className="w-4 h-4" />
                    Код не совпал! Сбросить вызов
                  </button>
                </div>
              )}

              {step === 'rejected' && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300">
                  <div className="font-bold flex items-center gap-1.5 text-rose-200 mb-1">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Попытка взлома отражена!
                  </div>
                  Мошенник не имеет доступа к B2B API банка и не знает токен. Ваши деньги спасены благодаря одноразовому коду.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="mt-5 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
          <button
            onClick={() => resetSimulation(activeScenario)}
            className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Перезапустить симуляцию
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
