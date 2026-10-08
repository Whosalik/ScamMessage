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
