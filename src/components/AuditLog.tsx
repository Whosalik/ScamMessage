import React from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import { AuditRecord } from '../types';

interface AuditLogProps {
  logs: AuditRecord[];
  onClear: () => void;
}

export const AuditLog: React.FC<AuditLogProps> = ({ logs, onClear }) => {
  return (
    <div className="glass-panel rounded-2xl p-4 relative z-10">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-slate-400" />
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Журнал аудита безопасности
          </h4>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 font-mono">
            {logs.length} {logs.length === 1 ? 'запись' : logs.length < 5 ? 'записи' : 'записей'}
          </span>
          {logs.length > 0 && (
            <button
              onClick={onClear}
              title="Очистить журнал"
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-600 font-mono">
            Журнал пуст. Инициируйте сессию для начала записи.
          </div>
        ) : (
          logs.map((record) => {
            const statusColor =
              record.status === 'success'
                ? 'text-emerald-400'
                : record.status === 'danger'
                ? 'text-rose-400'
                : record.status === 'warning'
                ? 'text-amber-400'
                : 'text-blue-400';

            return (
              <div
                key={record.id}
                className="flex items-start gap-2 text-[11px] font-mono leading-relaxed py-0.5"
              >
                <span className="text-slate-600 shrink-0">{record.timestamp}</span>
                <span className={`font-semibold shrink-0 ${statusColor}`}>
                  [{record.type}]
                </span>
                <span className="text-slate-300 break-words">{record.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
