import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import path from 'node:path';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';

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
    CREATE TABLE IF NOT EXISTS humans (id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE, handle text NOT NULL UNIQUE, password_hash text NOT NULL, created_at timestamp NOT NULL DEFAULT now());
    ALTER TABLE humans ADD COLUMN IF NOT EXISTS wallet text;
    CREATE TABLE IF NOT EXISTS sessions (token_hash text PRIMARY KEY, human_id text NOT NULL REFERENCES humans(id), expires_at timestamp NOT NULL);
    CREATE TABLE IF NOT EXISTS organizations (id text PRIMARY KEY, name text NOT NULL, handle text NOT NULL UNIQUE, wallet text, founder_id text NOT NULL REFERENCES humans(id), invite_code text NOT NULL UNIQUE, created_at timestamp NOT NULL DEFAULT now());
    CREATE TABLE IF NOT EXISTS organization_memberships (organization_id text NOT NULL REFERENCES organizations(id), human_id text NOT NULL REFERENCES humans(id), joined_at timestamp NOT NULL DEFAULT now(), PRIMARY KEY (organization_id, human_id));
    CREATE TABLE IF NOT EXISTS agent_accounts (id text PRIMARY KEY, name text NOT NULL, handle text NOT NULL UNIQUE, wallet text, capability text NOT NULL, endpoint text, owner_id text NOT NULL UNIQUE, owner_kind text NOT NULL CHECK (owner_kind IN ('human', 'organization')), created_at timestamp NOT NULL DEFAULT now());
  `).then(async () => {
      const demoPassword = 'demo12345';
      const salt = randomBytes(16).toString('hex');
      const hash = `${salt}:${scryptSync(demoPassword, salt, 64).toString('hex')}`;
      const mayaId = 'demo-human-maya';
      const noahId = 'demo-human-noah';
      const orgId = 'demo-org-northstar';
      await client!.query(`INSERT INTO humans (id, name, email, handle, password_hash) VALUES
        ($1, 'Maya Chen', 'maya@sherara.test', 'maya', $3),
        ($2, 'Noah Rivera', 'noah@sherara.test', 'noah', $3)
        ON CONFLICT (id) DO NOTHING`, [mayaId, noahId, hash]);
      await client!.query(`INSERT INTO organizations (id, name, handle, founder_id, invite_code) VALUES ($1, 'Northstar Cooperative', 'northstar', $2, 'NORTHSTAR-DEMO') ON CONFLICT (id) DO NOTHING`, [orgId, mayaId]);
      await client!.query(`INSERT INTO organization_memberships (organization_id, human_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [orgId, mayaId]);
      await client!.query(`INSERT INTO agent_accounts (id, name, handle, capability, owner_id, owner_kind) VALUES
        ('demo-agent-ledger', 'Ledger Lens', 'ledgerlens', 'Reconciliation', $1, 'human'),
        ('demo-agent-orbit', 'Orbit Pay', 'orbitpay', 'Payment routing', $2, 'organization')
        ON CONFLICT (id) DO NOTHING`, [mayaId, orgId]);
      return instance;
    });
  }
  return init;
}

export async function readyClient() {
  await ready();
  return client!;
}
