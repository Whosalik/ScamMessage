import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  clusterApiUrl,
} from '@solana/web3.js';

// Memo Program v2 on Solana
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export const DEVNET_RPC_URL = clusterApiUrl('devnet');

export function getSolanaExplorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export interface SendMemoResult {
  signature: string;
  explorerUrl: string;
}

export async function sendMemoToBlockchain(
  userAddress: string,
  memoText: string
): Promise<SendMemoResult> {
  if (!window.solana || !window.solana.isPhantom) {
    throw new Error('Кошелёк Phantom не найден');
  }

  const connection = new Connection(DEVNET_RPC_URL, 'confirmed');
  const userPubkey = new PublicKey(userAddress);

  // 1. Fetch latest blockhash from Solana Devnet
  const { blockhash } = await connection.getLatestBlockhash('confirmed');

  // 2. Encode UTF-8 memo text
  const memoBuffer = typeof Buffer !== 'undefined'
    ? Buffer.from(memoText, 'utf-8')
    : new TextEncoder().encode(memoText);

  const memoInstruction = new TransactionInstruction({
    keys: [{ pubkey: userPubkey, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: memoBuffer as Buffer,
  });

  // 3. Build transaction
  const transaction = new Transaction();
  transaction.add(memoInstruction);
  transaction.feePayer = userPubkey;
  transaction.recentBlockhash = blockhash;

  // 4. Request signature and broadcast via Phantom
  if (!window.solana.signAndSendTransaction) {
    throw new Error('Метод signAndSendTransaction не поддерживается провайдером');
  }

  const res = await window.solana.signAndSendTransaction(transaction);
  const signature = typeof res === 'string' ? res : res.signature;

  return {
    signature,
    explorerUrl: getSolanaExplorerUrl(signature),
  };
}

export async function requestDevnetAirdrop(address: string): Promise<string> {
  const connection = new Connection(DEVNET_RPC_URL, 'confirmed');
  const pubkey = new PublicKey(address);
  const sig = await connection.requestAirdrop(pubkey, 1_000_000_000); // 1 SOL
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature: sig,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  });
  return sig;
}

export function parseSolanaError(err: unknown): string {
  if (!err) return 'Неизвестная ошибка';

  const errObj = err as { code?: number; message?: string };
  const message = errObj?.message || String(err);

  if (errObj?.code === 4001 || message.includes('User rejected') || message.includes('cancelled')) {
    return 'Транзакция отменена: вы отклонили подтверждение в окне Phantom.';
  }

  if (
    message.includes('Attempt to debit an account but found no record') ||
    message.includes('insufficient funds') ||
    message.includes('0x1')
  ) {
    return 'На кошельке в сети Devnet недостаточно SOL для оплаты комиссии транзакции (~0.000005 SOL). Запросите тестовые SOL (Airdrop).';
  }

  if (message.includes('Blockhash not found') || message.includes('timeout')) {
    return 'Истекло время ожидания блока в сети Solana Devnet. Пожалуйста, повторите попытку.';
  }

  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Сетевой сбой при обращении к RPC узлу Solana Devnet. Проверьте интернет-соединение.';
  }

  return `Ошибка транзакции: ${message}`;
}
