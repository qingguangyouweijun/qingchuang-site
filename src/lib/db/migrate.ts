import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const DB_FILE = join(process.cwd(), 'data', 'qingchuang.db')

const TABLES_SQL = `
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  account TEXT NOT NULL,
  password_hash TEXT NOT NULL DEFAULT '',
  nickname TEXT,
  gender TEXT,
  age INTEGER,
  appearance TEXT,
  identity TEXT,
  location TEXT,
  grade TEXT,
  bio TEXT,
  avatar_url TEXT,
  contact_visibility_limit INTEGER NOT NULL DEFAULT 0,
  balance REAL NOT NULL DEFAULT 0,
  is_verified INTEGER NOT NULL DEFAULT 0,
  is_profile_complete INTEGER NOT NULL DEFAULT 0,
  app_role TEXT NOT NULL DEFAULT 'user',
  campus_available_balance REAL NOT NULL DEFAULT 0,
  campus_pending_balance REAL NOT NULL DEFAULT 0,
  campus_settlement_applying_amount REAL NOT NULL DEFAULT 0,
  campus_settled_total REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_account ON profiles(account);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_age ON profiles(age);
CREATE INDEX IF NOT EXISTS idx_profiles_identity ON profiles(identity);
CREATE INDEX IF NOT EXISTS idx_profiles_appearance ON profiles(appearance);

CREATE TABLE IF NOT EXISTS contact_pool (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wechat TEXT,
  qq TEXT,
  phone TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  drawn_count INTEGER NOT NULL DEFAULT 0,
  max_drawn_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_pool_user_id ON contact_pool(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_pool_active ON contact_pool(is_active);

CREATE TABLE IF NOT EXISTS draw_history (
  id TEXT PRIMARY KEY,
  drawer_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  price REAL NOT NULL,
  contact_wechat TEXT,
  contact_qq TEXT,
  contact_phone TEXT,
  note TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_draw_history_drawer ON draw_history(drawer_id);
CREATE INDEX IF NOT EXISTS idx_draw_history_created ON draw_history(created_at);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  balance_after REAL NOT NULL,
  description TEXT,
  related_draw_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_verification_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  purpose TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  consumed_at TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verification_email_purpose ON email_verification_codes(email, purpose);
CREATE INDEX IF NOT EXISTS idx_email_verification_email ON email_verification_codes(email);

CREATE TABLE IF NOT EXISTS campus_express_orders (
  id TEXT PRIMARY KEY,
  order_no TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  runner_id TEXT,
  small_count INTEGER NOT NULL DEFAULT 0,
  medium_count INTEGER NOT NULL DEFAULT 0,
  large_count INTEGER NOT NULL DEFAULT 0,
  xlarge_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  pickup_station TEXT NOT NULL,
  pickup_codes TEXT NOT NULL DEFAULT '[]',
  delivery_building TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  expected_time TEXT NOT NULL,
  remark TEXT,
  order_amount REAL NOT NULL,
  platform_fee REAL NOT NULL,
  runner_income REAL NOT NULL,
  pay_type TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
  paid_at TEXT,
  accepted_at TEXT,
  picked_up_at TEXT,
  delivered_at TEXT,
  confirmed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_express_order_no ON campus_express_orders(order_no);
CREATE INDEX IF NOT EXISTS idx_express_user_id ON campus_express_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_express_runner_id ON campus_express_orders(runner_id);
CREATE INDEX IF NOT EXISTS idx_express_status ON campus_express_orders(status);

CREATE TABLE IF NOT EXISTS campus_book_posts (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  isbn TEXT,
  condition_level TEXT NOT NULL,
  sale_price REAL NOT NULL,
  platform_fee REAL NOT NULL DEFAULT 2,
  seller_income REAL NOT NULL,
  description TEXT,
  shelf_status TEXT NOT NULL DEFAULT 'ON_SALE',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_book_posts_seller_id ON campus_book_posts(seller_id);
CREATE INDEX IF NOT EXISTS idx_book_posts_shelf_status ON campus_book_posts(shelf_status);

CREATE TABLE IF NOT EXISTS campus_book_orders (
  id TEXT PRIMARY KEY,
  order_no TEXT NOT NULL,
  book_id TEXT NOT NULL REFERENCES campus_book_posts(id) ON DELETE CASCADE,
  book_title TEXT NOT NULL,
  buyer_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sale_price REAL NOT NULL,
  platform_fee REAL NOT NULL,
  seller_income REAL NOT NULL,
  delivery_building TEXT NOT NULL,
  pay_type TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
  paid_at TEXT,
  delivered_at TEXT,
  received_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_book_order_no ON campus_book_orders(order_no);
CREATE INDEX IF NOT EXISTS idx_book_orders_buyer_id ON campus_book_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_book_orders_seller_id ON campus_book_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_book_orders_status ON campus_book_orders(status);

CREATE TABLE IF NOT EXISTS campus_payment_records (
  id TEXT PRIMARY KEY,
  out_trade_no TEXT NOT NULL,
  biz_type TEXT NOT NULL,
  biz_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  pay_type TEXT,
  status TEXT NOT NULL DEFAULT 'CREATED',
  trade_status TEXT,
  gateway_trade_no TEXT,
  gateway_order_id TEXT,
  pay_url TEXT,
  qr_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_out_trade_no ON campus_payment_records(out_trade_no);
CREATE INDEX IF NOT EXISTS idx_payment_user_id ON campus_payment_records(user_id);

CREATE TABLE IF NOT EXISTS campus_settlement_applications (
  id TEXT PRIMARY KEY,
  application_no TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  user_role TEXT NOT NULL DEFAULT 'user',
  note TEXT,
  transfer_ref TEXT,
  handled_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_settlement_application_no ON campus_settlement_applications(application_no);
CREATE INDEX IF NOT EXISTS idx_settlement_user_id ON campus_settlement_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_settlement_status ON campus_settlement_applications(status);

CREATE TABLE IF NOT EXISTS campus_balance_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  biz_type TEXT NOT NULL,
  biz_id TEXT NOT NULL,
  change_type TEXT NOT NULL,
  amount REAL NOT NULL,
  before_available REAL NOT NULL DEFAULT 0,
  after_available REAL NOT NULL DEFAULT 0,
  before_pending REAL NOT NULL DEFAULT 0,
  after_pending REAL NOT NULL DEFAULT 0,
  remark TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_balance_logs_user_id ON campus_balance_logs(user_id);
`

export function migrate() {
  mkdirSync(dirname(DB_FILE), { recursive: true })
  const db = new Database(DB_FILE)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(TABLES_SQL)
  db.close()
  console.log('Database migrated successfully.')
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('migrate.ts')) {
  migrate()
}
