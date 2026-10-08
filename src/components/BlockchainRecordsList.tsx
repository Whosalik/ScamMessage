import React from 'react';
import { ExternalLink, Database, CheckCircle2 } from 'lucide-react';
import { BlockchainRecord } from '../types';

interface BlockchainRecordsListProps {
  records: BlockchainRecord[];
}

export const BlockchainRecordsList: React.FC<BlockchainRecordsListProps> = ({ records }) => {
  if (records.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl p-5 relative z-10 mb-5 border border-slate-700/60 shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Database className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Записи в блокчейне Solana (devnet)
            </h4>
          </div>
        </div>
        <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded-full">
          {records.length} {records.length === 1 ? 'запись' : records.length < 5 ? 'записи' : 'записей'}
        </span>
      </div>

      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
        {records.map((rec) => (
          <div
            key={rec.id}
            className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-purple-500/30 transition-colors text-xs space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-slate-500">{rec.timestamp}</span>
              <a
                href={rec.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-400 hover:text-purple-300 hover:underline transition-colors shrink-0"
              >
                <span>Посмотреть запись</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 break-words flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{rec.memoText}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
