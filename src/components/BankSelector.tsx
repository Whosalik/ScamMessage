import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { BankInfo } from '../types';
import { KAZAKHSTAN_BANKS } from '../data/banks';

interface BankSelectorProps {
  selectedBank: BankInfo;
  onSelectBank: (bank: BankInfo) => void;
  disabled?: boolean;
}

export const BankSelector: React.FC<BankSelectorProps> = ({
  selectedBank,
  onSelectBank,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Банковский шлюз (Казахстан)
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
          isOpen
            ? 'border-blue-500/80 bg-slate-900/90 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/50'
            : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/60'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: selectedBank.color }}
          />
          <div className="truncate">
            <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span className="truncate">{selectedBank.name}</span>
              <span className="text-[11px] text-slate-500 font-normal">· {selectedBank.region}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              {selectedBank.gateway}
            </div>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ml-2 ${
            isOpen ? 'rotate-180 text-blue-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu - Explicit high z-index and absolute positioning */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-[#0f131c] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 max-h-72 overflow-y-auto"
          style={{ boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)' }}
        >
          <div className="p-1.5 space-y-1">
            {KAZAKHSTAN_BANKS.map((bank) => {
              const isSelected = bank.id === selectedBank.id;
              return (
                <button
                  key={bank.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelectBank(bank);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/15 text-white border border-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: bank.color }}
                    />
                    <div className="truncate">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <span className="text-slate-200">{bank.name}</span>
                        {isSelected && (
                          <span className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold">
                            (Выбран)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        {bank.gateway}
                      </div>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
