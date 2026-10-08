export interface BankInfo {
  id: string;
  name: string;
  shortName: string;
  color: string;
  badgeBg: string;
  gateway: string;
  region: string;
}

export interface SessionData {
  sessionId: string;
  code: string;
  bank: BankInfo;
  createdAt: number;
  expiresInSeconds: number;
  status: 'active' | 'verified' | 'flagged' | 'revoked' | 'expired';
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  type: 'SYS' | 'SEC' | 'CALL' | 'ALERT';
  message: string;
  status?: 'success' | 'warning' | 'danger' | 'info';
}

export interface BlockchainRecord {
  id: string;
  signature: string;
  text: string;
  timestamp: string;
  explorerUrl: string;
}

export interface PhantomPublicKey {
  toString(): string;
  toBase58?(): string;
}

export interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: PhantomPublicKey | null;
  isConnected?: boolean;
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: PhantomPublicKey }>;
  disconnect(): Promise<void>;
  signAndSendTransaction?(
    transaction: unknown,
    options?: { skipPreflight?: boolean }
  ): Promise<{ signature: string } | string>;
  on(event: 'connect' | 'disconnect' | 'accountChanged', handler: (args?: unknown) => void): void;
  removeListener(event: 'connect' | 'disconnect' | 'accountChanged', handler: (args?: unknown) => void): void;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}
