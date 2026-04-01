import mysql, { type Pool, type RowDataPacket } from 'mysql2/promise'
import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2'

import * as schema from './schema'

interface MysqlConnectionConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
}

type DbClient = MySql2Database<typeof schema>

const TABLES_SQL = [
  `
    CREATE TABLE IF NOT EXISTS profiles (
      id VARCHAR(191) NOT NULL,
      account VARCHAR(191) NOT NULL,
      password_hash VARCHAR(255) NOT NULL DEFAULT '',
      nickname VARCHAR(80) NULL,
      gender VARCHAR(32) NULL,
      age INT NULL,
      appearance VARCHAR(64) NULL,
      identity VARCHAR(64) NULL,
      location VARCHAR(64) NULL,
      grade VARCHAR(64) NULL,
      bio TEXT NULL,
      avatar_url VARCHAR(1024) NULL,
      contact_visibility_limit INT NOT NULL DEFAULT 0,
      balance DOUBLE NOT NULL DEFAULT 0,
      is_verified BOOLEAN NOT NULL DEFAULT FALSE,
      is_profile_complete BOOLEAN NOT NULL DEFAULT FALSE,
      app_role VARCHAR(32) NOT NULL DEFAULT 'user',
      campus_available_balance DOUBLE NOT NULL DEFAULT 0,
      campus_pending_balance DOUBLE NOT NULL DEFAULT 0,
      campus_settlement_applying_amount DOUBLE NOT NULL DEFAULT 0,
      campus_settled_total DOUBLE NOT NULL DEFAULT 0,
      created_at VARCHAR(64) NOT NULL,
      updated_at VARCHAR(64) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY idx_profiles_account (account),
      KEY idx_profiles_gender (gender),
      KEY idx_profiles_age (age),
      KEY idx_profiles_identity (identity),
      KEY idx_profiles_appearance (appearance)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS contact_pool (
      id VARCHAR(191) NOT NULL,
      user_id VARCHAR(191) NOT NULL,
      wechat VARCHAR(191) NULL,
      qq VARCHAR(191) NULL,
      phone VARCHAR(191) NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      drawn_count INT NOT NULL DEFAULT 0,
      max_drawn_count INT NOT NULL DEFAULT 0,
      created_at VARCHAR(64) NOT NULL,
      updated_at VARCHAR(64) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY idx_contact_pool_user_id (user_id),
      KEY idx_contact_pool_active (is_active),
      CONSTRAINT fk_contact_pool_user_id FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS draw_history (
      id VARCHAR(191) NOT NULL,
      drawer_id VARCHAR(191) NOT NULL,
      target_id VARCHAR(191) NOT NULL,
      amount DOUBLE NOT NULL DEFAULT 0,
      status VARCHAR(64) NOT NULL DEFAULT 'PENDING_PAYMENT',
      contact_wechat VARCHAR(191) NULL,
      contact_qq VARCHAR(191) NULL,
      contact_phone VARCHAR(191) NULL,
      note VARCHAR(255) NULL,
      is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
      created_at VARCHAR(64) NOT NULL,
      PRIMARY KEY (id),
      KEY idx_draw_history_drawer (drawer_id),
      KEY idx_draw_history_created (created_at),
      CONSTRAINT fk_draw_history_drawer FOREIGN KEY (drawer_id) REFERENCES profiles(id) ON DELETE CASCADE,
      CONSTRAINT fk_draw_history_target FOREIGN KEY (target_id) REFERENCES profiles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS email_verification_codes (
      id VARCHAR(191) NOT NULL,
      email VARCHAR(191) NOT NULL,
      purpose VARCHAR(64) NOT NULL,
      code_hash VARCHAR(255) NOT NULL,
      expires_at VARCHAR(64) NOT NULL,
      sent_at VARCHAR(64) NOT NULL,
      consumed_at VARCHAR(64) NULL,
      attempt_count INT NOT NULL DEFAULT 0,
      created_at VARCHAR(64) NOT NULL,
      updated_at VARCHAR(64) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY idx_email_verification_email_purpose (email, purpose),
      KEY idx_email_verification_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS campus_express_orders (
      id VARCHAR(191) NOT NULL,
      order_no VARCHAR(64) NOT NULL,
      user_id VARCHAR(191) NOT NULL,
      runner_id VARCHAR(191) NULL,
      small_count INT NOT NULL DEFAULT 0,
      medium_count INT NOT NULL DEFAULT 0,
      large_count INT NOT NULL DEFAULT 0,
      xlarge_count INT NOT NULL DEFAULT 0,
      total_count INT NOT NULL DEFAULT 0,
      pickup_station VARCHAR(255) NOT NULL,
      pickup_codes TEXT NOT NULL,
      delivery_building VARCHAR(255) NOT NULL,
      delivery_address VARCHAR(255) NOT NULL,
      expected_time VARCHAR(255) NOT NULL,
      remark TEXT NULL,
      order_amount DOUBLE NOT NULL,
      platform_fee DOUBLE NOT NULL,
      runner_income DOUBLE NOT NULL,
      pay_type VARCHAR(32) NULL,
      status VARCHAR(64) NOT NULL DEFAULT 'PENDING_PAYMENT',
      paid_at VARCHAR(64) NULL,
      accepted_at VARCHAR(64) NULL,
      picked_up_at VARCHAR(64) NULL,
      delivered_at VARCHAR(64) NULL,
      confirmed_at VARCHAR(64) NULL,
      created_at VARCHAR(64) NOT NULL,
      updated_at VARCHAR(64) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY idx_express_order_no (order_no),
      KEY idx_express_user_id (user_id),
      KEY idx_express_runner_id (runner_id),
      KEY idx_express_status (status),
      CONSTRAINT fk_express_user_id FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS campus_book_posts (
      id VARCHAR(191) NOT NULL,
      seller_id VARCHAR(191) NOT NULL,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(255) NOT NULL,
      isbn VARCHAR(64) NULL,
      condition_level VARCHAR(64) NOT NULL,
      sale_price DOUBLE NOT NULL,
      platform_fee DOUBLE NOT NULL DEFAULT 2,
      seller_income DOUBLE NOT NULL,
      description TEXT NULL,
      shelf_status VARCHAR(64) NOT NULL DEFAULT 'ON_SALE',
      created_at VARCHAR(64) NOT NULL,
      updated_at VARCHAR(64) NOT NULL,
      PRIMARY KEY (id),
      KEY idx_book_posts_seller_id (seller_id),
      KEY idx_book_posts_shelf_status (shelf_status),
      CONSTRAINT fk_book_posts_seller_id FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS campus_book_orders (
      id VARCHAR(191) NOT NULL,
      order_no VARCHAR(64) NOT NULL,
      book_id VARCHAR(191) NOT NULL,
      book_title VARCHAR(255) NOT NULL,
      buyer_id VARCHAR(191) NOT NULL,
      seller_id VARCHAR(191) NOT NULL,
      sale_price DOUBLE NOT NULL,
      platform_fee DOUBLE NOT NULL,
      seller_income DOUBLE NOT NULL,
      delivery_building VARCHAR(255) NOT NULL,
      pay_type VARCHAR(32) NULL,
      status VARCHAR(64) NOT NULL DEFAULT 'PENDING_PAYMENT',
      paid_at VARCHAR(64) NULL,
      delivered_at VARCHAR(64) NULL,
      received_at VARCHAR(64) NULL,
      created_at VARCHAR(64) NOT NULL,
      updated_at VARCHAR(64) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY idx_book_order_no (order_no),
      KEY idx_book_orders_buyer_id (buyer_id),
      KEY idx_book_orders_seller_id (seller_id),
      KEY idx_book_orders_status (status),
      CONSTRAINT fk_book_orders_book_id FOREIGN KEY (book_id) REFERENCES campus_book_posts(id) ON DELETE CASCADE,
      CONSTRAINT fk_book_orders_buyer_id FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE CASCADE,
      CONSTRAINT fk_book_orders_seller_id FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS campus_snack_products (
      id VARCHAR(191) NOT NULL,
      sku VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      subtitle VARCHAR(255) NULL,
      category VARCHAR(64) NOT NULL,
      cover_emoji VARCHAR(32) NULL,
      sale_price DOUBLE NOT NULL,
      original_price DOUBLE NULL,
      stock_count INT NOT NULL DEFAULT 0,
      description TEXT NULL,
      shelf_status VARCHAR(64) NOT NULL DEFAULT 'ON_SALE',
      sort_order INT NOT NULL DEFAULT 0,
      created_at VARCHAR(64) NOT NULL,
      updated_at VARCHAR(64) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY idx_snack_products_sku (sku),
      KEY idx_snack_products_category (category),
      KEY idx_snack_products_shelf_status (shelf_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS campus_snack_orders (
      id VARCHAR(191) NOT NULL,
      order_no VARCHAR(64) NOT NULL,
      product_id VARCHAR(191) NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      buyer_id VARCHAR(191) NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      unit_price DOUBLE NOT NULL,
      total_amount DOUBLE NOT NULL,
      pay_type VARCHAR(32) NULL,
      status VARCHAR(64) NOT NULL DEFAULT 'PENDING_PAYMENT',
      contact_name VARCHAR(80) NOT NULL,
      contact_phone VARCHAR(64) NOT NULL,
      delivery_location VARCHAR(255) NOT NULL,
      remark TEXT NULL,
      paid_at VARCHAR(64) NULL,
      completed_at VARCHAR(64) NULL,
      created_at VARCHAR(64) NOT NULL,
      updated_at VARCHAR(64) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY idx_snack_order_no (order_no),
      KEY idx_snack_orders_buyer_id (buyer_id),
      KEY idx_snack_orders_status (status),
      CONSTRAINT fk_snack_orders_product_id FOREIGN KEY (product_id) REFERENCES campus_snack_products(id) ON DELETE CASCADE,
      CONSTRAINT fk_snack_orders_buyer_id FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS campus_payment_records (
      id VARCHAR(191) NOT NULL,
      out_trade_no VARCHAR(64) NOT NULL,
      biz_type VARCHAR(64) NOT NULL,
      biz_id VARCHAR(191) NOT NULL,
      user_id VARCHAR(191) NOT NULL,
      amount DOUBLE NOT NULL,
      pay_type VARCHAR(32) NULL,
      status VARCHAR(64) NOT NULL DEFAULT 'CREATED',
      trade_status VARCHAR(64) NULL,
      gateway_trade_no VARCHAR(255) NULL,
      gateway_order_id VARCHAR(255) NULL,
      pay_url TEXT NULL,
      created_at VARCHAR(64) NOT NULL,
      updated_at VARCHAR(64) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY idx_payment_out_trade_no (out_trade_no),
      KEY idx_payment_user_id (user_id),
      CONSTRAINT fk_payment_user_id FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS campus_settlement_applications (
      id VARCHAR(191) NOT NULL,
      application_no VARCHAR(64) NOT NULL,
      user_id VARCHAR(191) NOT NULL,
      amount DOUBLE NOT NULL,
      status VARCHAR(64) NOT NULL DEFAULT 'PENDING',
      user_role VARCHAR(32) NOT NULL DEFAULT 'user',
      payee_qr_code VARCHAR(1024) NULL,
      note TEXT NULL,
      transfer_ref VARCHAR(255) NULL,
      handled_by VARCHAR(191) NULL,
      created_at VARCHAR(64) NOT NULL,
      updated_at VARCHAR(64) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY idx_settlement_application_no (application_no),
      KEY idx_settlement_user_id (user_id),
      KEY idx_settlement_status (status),
      CONSTRAINT fk_settlement_user_id FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  `
    CREATE TABLE IF NOT EXISTS campus_balance_logs (
      id VARCHAR(191) NOT NULL,
      user_id VARCHAR(191) NOT NULL,
      biz_type VARCHAR(64) NOT NULL,
      biz_id VARCHAR(191) NOT NULL,
      change_type VARCHAR(64) NOT NULL,
      amount DOUBLE NOT NULL,
      before_available DOUBLE NOT NULL DEFAULT 0,
      after_available DOUBLE NOT NULL DEFAULT 0,
      before_pending DOUBLE NOT NULL DEFAULT 0,
      after_pending DOUBLE NOT NULL DEFAULT 0,
      remark TEXT NULL,
      created_at VARCHAR(64) NOT NULL,
      PRIMARY KEY (id),
      KEY idx_balance_logs_user_id (user_id),
      CONSTRAINT fk_balance_logs_user_id FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
]

const DEFAULT_SNACK_PRODUCTS = [
  {
    sku: 'SNACK-001',
    name: '零食好忙 | 深夜快乐桶',
    subtitle: '薯片 + 海苔 + 可乐，一单补足晚自习快乐值',
    category: '人气组合',
    coverEmoji: '盒',
    salePrice: 16.8,
    originalPrice: 19.8,
    stockCount: 24,
    description: '适合晚自习、宿舍开黑和追剧时间，一桶打包 3 种高频零食，省去纠结。',
    sortOrder: 10,
  },
  {
    sku: 'SNACK-002',
    name: '爆辣魔芋爽补给包',
    subtitle: '嘴巴寂寞的时候，先来点有攻击性的快乐',
    category: '辣味专区',
    coverEmoji: '辣',
    salePrice: 7.9,
    originalPrice: 9.9,
    stockCount: 36,
    description: '宿舍常备的小体积狠角色，辣味上头但不会太油，适合当加班和熬夜零食。',
    sortOrder: 20,
  },
  {
    sku: 'SNACK-003',
    name: '海盐芝士威化',
    subtitle: '轻甜不腻，适合当早八和午后补能量的小点心',
    category: '甜口专区',
    coverEmoji: '甜',
    salePrice: 8.8,
    originalPrice: 10.8,
    stockCount: 32,
    description: '酥脆威化夹层配海盐芝士夹心，偏奶香路线，适合不想吃太辣的时候。',
    sortOrder: 30,
  },
  {
    sku: 'SNACK-004',
    name: '青柠气泡饮',
    subtitle: '冰镇之后很适合配炸物和晚饭外卖',
    category: '饮料',
    coverEmoji: '饮',
    salePrice: 5.5,
    originalPrice: 6.5,
    stockCount: 40,
    description: '清爽路线的基础饮料，适合搭配零食套餐一起下单。',
    sortOrder: 40,
  },
  {
    sku: 'SNACK-005',
    name: '冻干草莓酸奶块',
    subtitle: '嘴馋但不想太罪恶时的轻负担选项',
    category: '轻食零嘴',
    coverEmoji: '莓',
    salePrice: 12.9,
    originalPrice: 14.9,
    stockCount: 20,
    description: '冻干草莓搭配酸奶小方块，甜度不高，适合图书馆和宿舍桌面常备。',
    sortOrder: 50,
  },
  {
    sku: 'SNACK-006',
    name: '乐事原味薯片',
    subtitle: '最稳的经典款，选不出来时闭眼下单就行',
    category: '经典零食',
    coverEmoji: '薯',
    salePrice: 6.9,
    originalPrice: 7.9,
    stockCount: 48,
    description: '经典口味的宿舍硬通货，配剧、配球赛、配聊天都不会出错。',
    sortOrder: 60,
  },
] as const
let pool: Pool | null = null
let dbPromise: Promise<DbClient> | null = null

function resolveMysqlConfig(): MysqlConnectionConfig {
  const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL || ''

  if (databaseUrl) {
    const url = new URL(databaseUrl)
    const database = url.pathname.replace(/^\//, '')

    if (!database) {
      throw new Error('DATABASE_URL 或 MYSQL_URL 缺少数据库名。')
    }

    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database,
    }
  }

  const host = process.env.MYSQL_HOST || process.env.DB_HOST || ''
  const port = Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306)
  const user = process.env.MYSQL_USER || process.env.DB_USER || ''
  const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || ''
  const database = process.env.MYSQL_DATABASE || process.env.DB_NAME || ''

  if (!host || !user || !database) {
    throw new Error('缺少 MySQL 配置，请设置 DATABASE_URL 或 MYSQL_HOST / MYSQL_USER / MYSQL_PASSWORD / MYSQL_DATABASE。')
  }

  return { host, port, user, password, database }
}

async function ensureSettlementColumns(targetPool: Pool, database: string) {
  const [rows] = (await targetPool.query<RowDataPacket[]>(
    `
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'campus_settlement_applications'
        AND COLUMN_NAME = 'payee_qr_code'
    `,
    [database],
  )) as [Array<RowDataPacket & { count: number }>, unknown]

  if (Number(rows[0]?.count ?? 0) === 0) {
    await targetPool.query('ALTER TABLE campus_settlement_applications ADD COLUMN payee_qr_code VARCHAR(1024) NULL AFTER user_role')
  }
}

async function ensureSnackSeed(targetPool: Pool) {
  const [rows] = (await targetPool.query<RowDataPacket[]>('SELECT COUNT(*) AS count FROM campus_snack_products')) as [Array<RowDataPacket & { count: number }>, unknown]

  if (Number(rows[0]?.count ?? 0) > 0) {
    return
  }

  for (const product of DEFAULT_SNACK_PRODUCTS) {
    await targetPool.query(
      `
        INSERT INTO campus_snack_products (
          id, sku, name, subtitle, category, cover_emoji, sale_price, original_price,
          stock_count, description, shelf_status, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ON_SALE', ?, ?, ?)
      `,
      [
        crypto.randomUUID(),
        product.sku,
        product.name,
        product.subtitle,
        product.category,
        product.coverEmoji,
        product.salePrice,
        product.originalPrice,
        product.stockCount,
        product.description,
        product.sortOrder,
        new Date().toISOString(),
        new Date().toISOString(),
      ],
    )
  }
}

async function ensureSchema(targetPool: Pool, database: string) {
  for (const statement of TABLES_SQL) {
    await targetPool.query(statement)
  }

  await ensureSettlementColumns(targetPool, database)
  await ensureSnackSeed(targetPool)
}

async function getPool() {
  if (pool) {
    return pool
  }

  const config = resolveMysqlConfig()
  pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
    queueLimit: 0,
  })

  try {
    await ensureSchema(pool, config.database)
  } catch (error) {
    await pool.end().catch(() => undefined)
    pool = null
    throw error
  }

  return pool
}

export async function getDb(): Promise<DbClient> {
  if (!dbPromise) {
    dbPromise = getPool()
      .then((targetPool) => drizzle(targetPool, { schema, mode: 'default' }) as DbClient)
      .catch((error) => {
        dbPromise = null
        throw error
      })
  }

  return dbPromise
}

export { schema }



