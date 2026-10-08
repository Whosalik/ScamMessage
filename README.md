# ScamMessage

> Generates a one-time code so you can verify that a phone call really comes from your bank.

**Target Audience:** Banks and mobile operators in Kazakhstan, and their customers.

---

## Problem
Fraudsters steal millions by impersonating bank security operators over the phone. Customers currently have no cryptographic or reliable way to verify the true identity of an incoming caller before speaking.

## Solution
ScamMessage forces the caller to prove their authenticity:
1. **Generate Code:** The customer creates a dynamic, ephemeral one-time code synced with their bank's API gateway.
2. **Verify Caller:** The genuine bank operator reads the code aloud. If it matches the screen, the call is authentic.
3. **Expose Scammers:** Impostors do not have access to the bank's backend token and cannot state the code, allowing the customer to hang up immediately.

## How it uses Solana
- **What is recorded:** Session ID, SHA-256 hash of the one-time code, and timestamp are written to **Solana Devnet** as an SPL Memo transaction (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`).
- **Why:** This gives a public, immutable audit trail without exposing the code itself, ensuring dispute resolution without compromising security.
- **Wallet Connection:** Users connect non-custodially via [Phantom Wallet](https://phantom.app/) to broadcast verification proofs and view transactions on [Solana Explorer](https://explorer.solana.com/?cluster=devnet).

## How to run

### Prerequisites
- Node.js 18+
- [Phantom Wallet](https://phantom.app/) extension (enabled for **Devnet** in Settings > Developer Settings)

### Setup & Run
```bash
# Clone the repository
git clone https://github.com/Whosalik/ScamMessage.git
cd ScamMessage

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build
```bash
npm run build
```

## Team
- **Core Engineering:** Whosalik ([alixan6556@gmail.com](mailto:alixan6556@gmail.com))
