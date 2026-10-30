import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import path from 'node:path';

export const agreements = pgTable('agreements', {
  id: text('id').primaryKey(),
  digest: text('digest').notNull(),
  customer: text('customer').notNull(),
  merchant: text('merchant').notNull(),
  chainId: text('chain_id').notNull(),
  token: text('token').notNull(),
  recipient: text('recipient').notNull(),
  amount: text('amount').notNull(),
  deadline: text('deadline').notNull(),
  customerSignature: text('customer_signature').notNull(),
  merchantSignature: text('merchant_signature'),
  commitmentTx: text('commitment_tx'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const receipts = pgTable('receipts', {
  id: text('id').primaryKey(),
  agreementId: text('agreement_id').notNull(),
  txHash: text('tx_hash').notNull(),
  logIndex: text('log_index').notNull(),
  status: text('status').notNull(),
  report: text('report').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

const dataPath = process.env.SHERARA_DB_PATH ?? path.join(process.cwd(), '.sherara-data');
let client: PGlite | undefined;
let init: Promise<ReturnType<typeof drizzle>> | undefined;

export function ready() {
  if (!init) {
    client = new PGlite(dataPath);
    const instance = drizzle(client);
    init = client.exec(`
    CREATE TABLE IF NOT EXISTS agreements (id text PRIMARY KEY, digest text NOT NULL, customer text NOT NULL, merchant text NOT NULL, chain_id text NOT NULL, token text NOT NULL, recipient text NOT NULL, amount text NOT NULL, deadline text NOT NULL, customer_signature text NOT NULL, merchant_signature text, commitment_tx text, created_at timestamp NOT NULL DEFAULT now());
    CREATE TABLE IF NOT EXISTS receipts (id text PRIMARY KEY, agreement_id text NOT NULL, tx_hash text NOT NULL, log_index text NOT NULL, status text NOT NULL, report text NOT NULL, created_at timestamp NOT NULL DEFAULT now());
  `).then(() => instance);
  }
  return init;
}
